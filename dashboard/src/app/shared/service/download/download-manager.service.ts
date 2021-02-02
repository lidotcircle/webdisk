import { Injectable } from '@angular/core';
import { Observable, Subject } from 'rxjs';
import { DownloadManage, DownloadManageDeleteTaskMessage, DownloadManageEvent, DownloadManageEventFailMessage, DownloadManageEventFinishMessage, DownloadManageEventUpdateMessage, DownloadManageGetTasksMessage, DownloadManageGetTasksResponseMessage, DownloadManageInspectTaskMessage, DownloadManageMessage, DownloadManageNewTaskMessage, DownloadManageNewTaskResponseMessage, DownloadTask, MiscMessageType } from '../../common';
import { NotifierType } from '../../shared-component/notifier/notifier.component';
import { AccountManagerService } from '../account-manager.service';
import { MessageBoxService } from '../message-box.service';
import { NotifierService } from '../notifier.service';
import { WSChannelService } from '../wschannel.service';


const Inspected = Symbol('inspected');

@Injectable({
    providedIn: 'root'
})
export class DownloadManagerService {
    private tasks: DownloadTask[] = [];

    private _update: Subject<number | null> = new Subject<number | null>();
    get update(): Observable<number | null> {return this._update;}

    private _tasks_id: number[] = [];
    get taskIDs(): number[] {return this._tasks_id;}


    constructor(private wschannel: WSChannelService,
                private accountmanager: AccountManagerService,
                private messagebox: MessageBoxService,
                private notifier: NotifierService) //{
    {
        this.wschannel.downloadEvent.subscribe(msg => {
            switch(msg.event_type) {
                case DownloadManageEvent.UPDATE: {
                    const gmsg = msg as DownloadManageEventUpdateMessage;
                    const t = this.queryByTaskID(gmsg.misc_msg.taskid);
                    if(t != null) {
                        t.downloaded = gmsg.misc_msg.size;
                        this._update.next(gmsg.misc_msg.taskid);
                    }
                } break;
                case DownloadManageEvent.FINISH: {
                    const gmsg = msg as DownloadManageEventFinishMessage;
                    const t = this.queryByTaskID(gmsg.misc_msg.taskid);
                    if(t != null) {
                        t.finish = true;
                        this._update.next(gmsg.misc_msg.taskid);
                    }
                } break;
                case DownloadManageEvent.FAIL: {
                    const gmsg = msg as DownloadManageEventFailMessage;
                    const t = this.queryByTaskID(gmsg.misc_msg.taskid);
                    if(t != null) {
                        t.fail = true;
                        this._update.next(gmsg.misc_msg.taskid);
                    }
                } break;
            }
        });

        this.wschannel.xconnection.subscribe(() => this.inspectAllTasks());
        this.wschannel.xdisconnect.subscribe(() => {
            for(const task of this.tasks) {
                if(task.finish || task.fail) continue;
                task[Inspected] = false;
            }
        });

        this.accountmanager.onLogout.subscribe(() => {
            this.tasks = [];
        });

        this.accountmanager.onLogin.subscribe(() => {
            this.getAllTasks();
        });
        this.getAllTasks();
    } //}

    private async getAllTasks(): Promise<void> //{
    {
        const reqmsg = new DownloadManageGetTasksMessage();
        reqmsg.misc_msg.token = this.accountmanager.LoginToken;

        const resp = await this.wschannel.send(reqmsg);
        const tasks = (resp as DownloadManageGetTasksResponseMessage).misc_msg.tasks;
        this.tasks = tasks;
        this._tasks_id = [];
        for(const t of this.tasks) this._tasks_id.push(t.taskId);

        this._update.next(null);
        this.inspectAllTasks();
    } //}

    private async inspectAllTasks(): Promise<void> //{
    {
        const proms: Promise<void>[] = [];
        for(const task of this.tasks) {
            if(task.finish || task.fail) continue;
            proms.push(this.inspectTask(task));
        }

        await Promise.all(proms);
    } //}

    private async inspectTask(task: DownloadTask): Promise<void> //{
    {
        if(task[Inspected] == true) return;
        task[Inspected] = true;

        const reqmsg = new DownloadManageInspectTaskMessage();
        reqmsg.misc_msg.token = this.accountmanager.LoginToken;
        reqmsg.misc_msg.taskId = task.taskId;

        await this.wschannel.send(reqmsg);
    } //}

    async newTask(url: string, destination: string): Promise<number> //{
    {
        const reqmsg = new DownloadManageNewTaskMessage();
        reqmsg.misc_msg.token = this.accountmanager.LoginToken;
        reqmsg.misc_msg.url = url;
        reqmsg.misc_msg.destination = destination;

        const resp = await this.wschannel.send(reqmsg);
        const ans = (resp as DownloadManageNewTaskResponseMessage).misc_msg.task;

        this.tasks.push(ans);
        this._tasks_id.push(ans.taskId);
        this._update.next(ans.taskId);

        this.inspectTask(ans);
        return ans.taskId;
    } //}

    async deleteTask(taskid: number): Promise<void> //{
    {
        const reqmsg = new DownloadManageDeleteTaskMessage();
        reqmsg.misc_msg.token = this.accountmanager.LoginToken;
        reqmsg.misc_msg.taskId = taskid;
        await this.wschannel.send(reqmsg);

        let n: number;
        for(let i=0;i<this.tasks.length;i++) {
            if(this.tasks[i].taskId == taskid) {
                n = i;
                break;
            }
        }
        if(n === undefined) {
            console.error('unexpected error');
        }
        this.tasks.splice(n, 1);
        this._tasks_id.splice(n, 1);
        this._update.next(taskid);
    } //}

    queryByTaskID(taskid: number): DownloadTask | null //{
    {
        let ans: DownloadTask;
        for(const t of this.tasks) {
            if(t.taskId == taskid) {
                ans = t;
                break;
            }
        }

        return ans;
    } //}

    async createTaskWithUI(): Promise<void> //{
    {
        const enh = await this.messagebox.create({
            title: 'Download Task',
            message: 'Create new download task',
            inputs: [
                {name: 'url', label: 'url', type: 'text'},
                {name: 'dst', label: 'destination', type: 'text'},
            ],
            buttons: [
                {name: 'confirm'},
                {name: 'cancel'}
            ]
        }).wait();

        if(!enh.closed && enh.buttonValue == 0) {
            try {
                await this.newTask(enh.inputs['url'], enh.inputs['dst']);
                await this.notifier.create({message: 'create download task success'}).wait();
            } catch (err) {
                await this.notifier.create({message: `create download task fail, ${err}`, mtype: NotifierType.Error}).wait();
            }
        }
    } //}

    async deleteTaskWithUI(taskid: number): Promise<void> //{
    {
        try {
            await this.deleteTask(taskid);
            await this.notifier.create({message: 'delete download task success'}).wait();
        } catch(err) {
            await this.notifier.create({message: `delete download task fail, ${err}`, mtype: NotifierType.Error}).wait();
        }
    } //}
}

