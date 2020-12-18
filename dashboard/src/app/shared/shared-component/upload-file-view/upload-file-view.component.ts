import { Component, OnInit, ElementRef, Input } from '@angular/core';
import { AbsoluteView } from '../absolute-view/absolute-view';
import { FileSystemManagerService } from '../../service/file-system-manager.service';
import { FileStat } from '../../common';
import { Observable, Subject } from 'rxjs';
import { FileSystemDirectoryEntry, FileSystemEntry, FileSystemFileEntry, path, pathJoin } from '../../utils';
import * as crypto from 'crypto-js';
import { UserSettingService } from '../../service/user-setting.service';
const assert = console.assert;

const blocksize = 1024 * 1024;

class UploadOption {
    alwaysOverride: boolean = false;
    alwaysSkipSameName: boolean = false;
    alwaysMerge: boolean = false;
}

@Component({
    selector: 'app-upload-file-view',
    templateUrl: './upload-file-view.component.html',
    styleUrls: ['./upload-file-view.component.scss']
})
export class UploadFileViewComponent extends AbsoluteView implements OnInit {
    @Input()
    private fileEntry: FileSystemEntry;
    @Input()
    private destination: string;

    private uploadOption: UploadOption;
    private uploadSize: Subject<number> = new Subject<number>();
    private speedSub: Subject<number> = new Subject<number>();

    private spendTime: number = 0;
    private uploadedSize: number = 0;
    private inProcessFile: string;
    private finish: boolean;

    get uploadConfirm(): Observable<number> {return this.uploadSize;}
    get speed(): Observable<number> {return this.speedSub;}

    get SpendTime()     {return this.spendTime;}
    get UploadSize()    {return this.uploadedSize;}
    get InProcessFile() {return this.inProcessFile;}
    get Finish()        {return this.finish;}

    constructor(protected host: ElementRef,
                private fileManager: FileSystemManagerService,
                private userSettings: UserSettingService) {
        super(host);
        this.uploadOption = new UploadOption();
    }

    ngOnInit(): void {
        if(this.fileEntry == null || this.destination == null) {
            throw new Error("bad update session");
        }
    }

    public async upload() {
        this.uploadConfirm.subscribe(v => this.uploadedSize += v);

        const interval = 500;
        let prev = 0;
        const update_speed = () => {
            if(this.finish) return;
            const speed = (this.uploadedSize - prev) / (interval / 1000);
            prev = this.uploadedSize;
            this.speedSub.next(speed);
            this.spendTime += interval;
            setTimeout(() => update_speed(), interval);
        };
        update_speed();

        this.uploadConfirm.subscribe(v => console.log(this.uploadedSize, "bytes"));
        this.speed.subscribe(v => console.log(v / 1024, "kb/s"));

        const remoteFilePath = pathJoin(this.destination, path.basename(this.fileEntry.name));
        try {
            await this.uploadEntry(this.fileEntry, remoteFilePath);
        } finally {this.finish = true;}
        console.log("total spend time: ", this.spendTime / 1000, "s");
    }

    private async uploadEntry(entry: FileSystemEntry, rpath: string) {
        if(entry.isFile) {
            let file: File = await new Promise((resolve, reject) => {
                (entry as FileSystemFileEntry).file((f: File) => {
                    resolve(f);
                }, (err) => {
                    reject(err);
                });
            });
            await this.sendFile(file, rpath);
        } else {
            let stat: FileStat
            try {
                stat = await this.fileManager.stat(rpath);
            } catch {}
            if(stat != null) {
                let merge = this.uploadOption.alwaysMerge;
                if(!merge) {
                    const opt = await this.PopMergeOptionWindow();
                    if(opt[2]) {
                        throw new Error('exit');
                    } 
                    merge = opt[0];
                    this.uploadOption.alwaysMerge = opt[1] && opt[0];
                }
                if(!merge) {
                    await this.fileManager.remover(rpath);
                    await this.fileManager.mkdir(rpath);
                }
            } else {
                await this.fileManager.mkdir(rpath);
            }

            let dir: FileSystemDirectoryEntry = entry as FileSystemDirectoryEntry;
            let entries: FileSystemEntry[] = await new Promise((resolve, reject) => {
                dir.createReader().readEntries(e => resolve(e), err => reject(err));
            });
            for (let i=0; i<entries.length;i++) {
                let ent = entries[i];
                await this.uploadEntry(ent, pathJoin(rpath, ent.name));
            }
        }
    }


    private async PopOverrideOptionWindow(): Promise<[boolean,boolean]> {
        // override, remember
        return [true, true];
    }

    private async PopMergeOptionWindow(): Promise<[boolean,boolean,boolean]> {
        // merge, remember, cancel
        return [true, true, false];
    }

    private async fileMD5(file: File, position: number = 0, length: number = null) {
        length = length || file.size;
        assert(position >= 0 && (length + position) <= file.size);
        const m = crypto.algo.MD5.create();

        let c = 0;
        while (length > c) {
            let u = Math.min(file.size - c - position, blocksize);
            let b = new Uint8Array(await file.slice(position+c,position+c+u).arrayBuffer());
            m.update(crypto.lib.WordArray.create(b as any));
            c += b.byteLength;
        }

        return m.finalize().toString(crypto.enc.Hex);
    }

    private async sendFile(fileData: File, filename: string): Promise<void> //{
    {
        this.inProcessFile = filename;
        let stat: FileStat;
        try {
            stat = await this.fileManager.stat(filename);
        } catch { }

        let uploadsize = 0;
        if(stat != null) {
            if (stat.size <= fileData.size && this.userSettings.ContinueSendFileWithSameMD5) {
                const rmd5 = await this.fileManager.md5(filename);
                const lmd5 = await this.fileMD5(fileData, 0, stat.size);
                if(rmd5 == lmd5) {
                    uploadsize = stat.size;
                    this.uploadSize.next(stat.size);
                }
            }

            if (uploadsize == 0) {
                let override = false;
                if(this.uploadOption.alwaysOverride) {
                    override = true;
                } else if (!this.uploadOption.alwaysSkipSameName) {
                    const opt = await this.PopOverrideOptionWindow();
                    override = opt[0];
                    if(opt[1]) {
                        this.uploadOption.alwaysOverride = override;
                        this.uploadOption.alwaysSkipSameName = !override;
                    }
                }

                if(override) {
                    crypto.algo.MD5.create();
                    const rmd5 = await this.fileManager.md5(filename);
                    const filemd5 = await this.fileMD5(fileData);
                    if(rmd5 == filemd5) {
                        this.uploadSize.next(fileData.size);
                        return;
                    }
                    await this.fileManager.remove(filename);
                } else {
                    this.uploadSize.next(fileData.size);
                    return;
                }
            }
        }

        await this.fileManager.touch(filename);
        while(uploadsize < fileData.size) {
            let sliceSize = Math.min(blocksize, fileData.size - uploadsize);
            const buf = await fileData.slice(uploadsize, uploadsize + sliceSize).arrayBuffer();
            await this.fileManager.write(filename, uploadsize, buf);
            uploadsize += sliceSize;
            this.uploadSize.next(sliceSize);
        }

        const rmd5 = await this.fileManager.md5(filename);
        const lmd5 = await this.fileMD5(fileData);
        if (rmd5 != lmd5) {
            throw new Error(`upload file fail, unexpected md5 ${rmd5}, require ${lmd5}`);
        }
    } //}
}

