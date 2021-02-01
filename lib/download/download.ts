import path from 'path';
import assert from 'assert';
import fs from 'fs';
import util from 'util';

import { DownloadTask } from '../common/db_types';
import { default as fetch, Response } from 'node-fetch';
import { service } from '../services';
import { URL } from 'url';
import { default as mktemp } from 'mktemp';
import { KEY_DOWNLOAD } from '../database/constants';
import { error, info } from '../logger';
import { pipelineWithTimeout } from '../utils';
import { pipeline, Readable } from 'stream';

const mktempP = util.promisify(mktemp.createFile) as (pattern: string) => Promise<string>;

export async function startTask(usertoken: string, url: string, destination: string): Promise<number> //{
{
    const task = new DownloadTask();
    task.url = url;
    const u = new URL(url);
    task.name = path.basename(u.pathname);

    const head = await fetch(url, {method: 'HEAD', compress: true, size: 1});

    if(head.status >= 400) {
        throw new Error(head.statusText);
    }

    if(head.headers.get('content-length')) {
        task.size = Number(head.headers.get('content-length'));
    }
    if(head.headers.get('accept-ranges') == 'bytes') {
        task.partial = true;
    }

    task.downloaded = 0;
    task.temporaryFile = await mktempP('/tmp/webdisk_download_XXXXXXXXXX.tmp');
    task.destination = destination;

    return await service.DB.CreateNewTask(usertoken, task);
} //}

type Cancelable = {cancel(): void; canceled: boolean;}

class DownloadManager {
    private max_running_tasks: number = 5;
    private m_running_tasks: (DownloadTask & Cancelable)[] = [];

    constructor() {
        this.init();
    }

    private async init() //{
    {
        await this.queueNewTasks();

        service.DB.on('insert', (table, sql) => {
            if(table == KEY_DOWNLOAD) {
                this.queueNewTasks();
            }
        });

        service.DB.on('delete', (table, sql) => {
            const taskid = Number(sql.match(/taskId=(\d+)/)[1]);

            for(const task of this.m_running_tasks) {
                if(task.taskId == taskid) {
                    task.cancel();
                }
            }
        });
    } //}

    private async queueNewTasks() //{
    {
        if(this.m_running_tasks.length >= this.max_running_tasks) {
            return;
        }

        const newtasks = await service.DB.QueryUnfinishTasks(this.max_running_tasks - this.m_running_tasks.length)

        if(this.m_running_tasks.length >= this.max_running_tasks) {
            return;
        }

        for(const task of newtasks) {
            const ctask = task as DownloadTask & Cancelable;
            this.m_running_tasks.push(ctask);
            this.runTask(ctask)
            .catch(error);
        }
    } //}

    private async taskFinish(task: DownloadTask) //{
    {
        info(`download task '${task.name}' finish`);
        let n = 0;
        for(;n<this.m_running_tasks.length;n++) {
            if(this.m_running_tasks[n] == task) break;
        }

        const t = this.m_running_tasks.splice(n, 1)[0];
        await service.DB.TaskOver(t.taskId, false);
        await this.queueNewTasks();
    } //}

    private async taskFail(task: DownloadTask) //{
    {
        error(`download task '${task.name}' failed`);
        let n = 0;
        for(;n<this.m_running_tasks.length;n++) {
            if(this.m_running_tasks[n] == task) break;
        }

        const t = this.m_running_tasks.splice(n, 1)[0];
        await service.DB.TaskOver(t.taskId, true);
        await this.queueNewTasks();
    } //}

    private async runTask(task: DownloadTask & Cancelable): Promise<void> //{
    {
        await this.runTaskWrapper(task);
        if(task.finish) {
            const reader = fs.createReadStream(task.temporaryFile);
            try {
                await service.filesystem.createNewFileWithReadableStream(task.destination, reader);
                await this.taskFinish(task);
            } catch {
                await this.taskFail(task);
            }
        }
    } //}

    private async runTaskWrapper(task: DownloadTask & Cancelable): Promise<void> //{
    {
        task.canceled = false;
        let failureTolerence: number = 5;

        while(failureTolerence > 0) {
            try {
                if(task.partial) {
                    await this.downloadWithAppend(task);
                } else {
                    await this.downloadFromStart(task);
                }

                task.finish = true;
                return;
            } catch (err) {
                console.error(err);

                if(task.canceled) {
                    throw err;
                }
            }

            failureTolerence--;
        }

        task.fail = true;
        await this.taskFail(task);
    } //}

    private async downloadFromStart(task: DownloadTask & Cancelable): Promise<void> //{
    {
        task.downloaded = 0;
        const writer = await fs.createWriteStream(task.temporaryFile, {flags: 'w'});
        const reader = (await fetch(task.url)).body;

        reader.on('data', (data: Buffer) => {
            task.downloaded += data.byteLength;
            service.DB.PushContent(task.taskId, task.size);
        });

        const options = {};
        task.cancel = () => {
            options['canceled'] = true;
            task.canceled = true;
        }
        await pipelineWithTimeout(reader as Readable, writer, options);
    } //}

    private async downloadWithAppend(task: DownloadTask & Cancelable): Promise<void> //{
    {
        const writer = await fs.createWriteStream(task.temporaryFile, {flags: 'a'});
        const reader = (await fetch(task.url, {headers: {'Range': `bytes=${task.downloaded}-`}})).body;

        reader.on('data', data => {
            task.downloaded += data.byteLength;
            service.DB.PushContent(task.taskId, task.size);
        });

        const options = {};
        task.cancel = () => {
            options['canceled'] = true;
            task.canceled = true;
        }
        await pipelineWithTimeout(reader as Readable, writer, options);
    } //}
}

if(service.DB.initialized) {
    const dmanager = new DownloadManager();
} else {
    service.DB.on('init', () => {
        const dmanager = new DownloadManager();
    });
}

