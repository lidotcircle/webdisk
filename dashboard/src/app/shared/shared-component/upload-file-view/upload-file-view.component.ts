import { Component, OnInit, ElementRef, Input } from '@angular/core';
import { FileSystemManagerService } from '../../service/file-system-manager.service';
import { FileStat } from '../../common';
import { Observable, Subject } from 'rxjs';
import { Convert, FileSystemEntryWrapper, path } from '../../utils';
import * as crypto from 'crypto-js';
import { UserSettingService } from '../../service/user-setting.service';
import { MessageBoxService } from '../../service/message-box.service';
import { NotifierService } from '../../service/notifier.service';
import { NotifierType } from '../notifier/notifier.component';
import { FileType } from 'src/app/shared/common';
import { LocalSettingService } from 'src/app/service/user/local-setting.service';
const assert = console.assert;

const blocksize = 512 * 1024;

class UploadOption {
    alwaysOverride: boolean = false;
    alwaysSkipSameName: boolean = false;

    alwaysMergeFolder: boolean = false;
    alwaysSkipSameNameFolder: boolean = false;
    alwaysOverrideSameNameFolder: boolean = false;
}

@Component({
    selector: 'app-upload-file-view',
    templateUrl: './upload-file-view.component.html',
    styleUrls: ['./upload-file-view.component.scss']
})
export class UploadFileViewComponent implements OnInit {
    @Input()
    private fileEntries: FileSystemEntryWrapper[];
    @Input()
    private destination: string;

    private totalSize: number = 0;

    private uploadOption: UploadOption;
    private uploadSize: Subject<number> = new Subject<number>();
    private speedSub: Subject<number> = new Subject<number>();

    private spendTime: number = 0;
    private uploadedSize: number = 0;
    private uploadSpeed_value: number = 0;
    private inProcessFile: string;
    private finish: boolean;
    private closed: boolean = false;

    get uploadConfirm(): Observable<number> {return this.uploadSize;}
    get speed(): Observable<number> {return this.speedSub;}

    get SpendTime()     {return Convert.tv2str(Math.floor(this.spendTime / 1000));}
    get TimeRemaining() {
        let remain = this.totalSize - this.uploadedSize;
        remain /= (this.uploadSpeed_value + 1);
        return Convert.tv2str(remain);
    }

    get UploadSpeed()   {return Convert.bv2str(this.uploadSpeed_value) + '/s';}
    get UploadedSize()  {return Convert.bv2str(this.uploadedSize);}
    get TotalSize()     {return Convert.bv2str(this.totalSize);}

    get InProcessFile() {return this.inProcessFile;}
    get Finish()        {return this.finish;}

    get progressPercent() {return this.totalSize > 0 ? this.uploadedSize / this.totalSize * 100 : 0;}

    constructor(private fileManager: FileSystemManagerService,
                private userSettings: UserSettingService,
                private messagebox: MessageBoxService,
                private notifier: NotifierService,
                private localSettings: LocalSettingService) {
        this.uploadOption = new UploadOption();
    }

    ngOnInit(): void {
        if(this.fileEntries == null || this.destination == null) {
            throw new Error("bad update session");
        }
    }

    public async upload(): Promise<boolean> //{
    {
        this.uploadConfirm.subscribe(v => this.uploadedSize += v);
        this.totalSize = 0;
        for(const entry of this.fileEntries) {
            this.totalSize += entry.size;
        }

        const interval = 500;
        let prev = 0;
        const update_speed = () => {
            if(this.finish) return;
            const speed = (this.uploadedSize - prev) / (interval / 1000);
            prev = this.uploadedSize;
            this.speedSub.next(speed);
            this.uploadSpeed_value = speed;
            this.spendTime += interval;
            setTimeout(() => update_speed(), interval);
        };
        update_speed();

        try {
            for(const entry of this.fileEntries) {
                const remoteFilePath = path.pathjoin(this.destination, path.basename(entry.name));
                await this.uploadEntry(entry, remoteFilePath);

                if(!this.closed) {
                    this.notifier.create({
                        message: `upload success, total spend time: ${this.spendTime / 1000}s`, 
                        duration: 3000
                    }).wait();

                    return true;
                } else {
                    this.notifier.create({
                        message: `stop upload, total spend time: ${this.spendTime / 1000}s`, 
                        duration: 3000
                    }).wait();

                    return false;
                }
            }
        } catch (err) {
            console.log(err);
            this.notifier.create({message: `upload fail: ${err}`, mtype: NotifierType.Error,duration: 5000}).wait();
            return false;
        } finally {this.finish = true;}
    } //}

    private async uploadEntry(entry: FileSystemEntryWrapper, rpath: string) //{
    {
        if(entry.isFile) {
            await this.sendFile(entry.file, rpath);
        } else {
            let stat: FileStat
            try {
                stat = await this.fileManager.stat(rpath);
            } catch {}
            if(stat != null) {
                let merge = this.uploadOption.alwaysMergeFolder;
                let override = this.uploadOption.alwaysOverrideSameNameFolder;
                let skip = this.uploadOption.alwaysSkipSameName;
                if(!merge && !override && !skip) {
                    const opt = await this.PopMergeOptionWindow();
                    merge = opt[0];
                    override = opt[1];
                    skip = !merge && !override;
                    const remember = opt[2];
                    this.uploadOption.alwaysMergeFolder = merge && remember;
                    this.uploadOption.alwaysOverrideSameNameFolder = override && remember;
                    this.uploadOption.alwaysSkipSameName = skip && remember;
                }
                if(override) {
                    await this.fileManager.remover(rpath);
                    await this.fileManager.mkdir(rpath);
                } else if (skip) {
                    assert(skip);
                    const skipsize = entry.size;
                    this.speedSub.next(skipsize);
                    return;
                } else {assert(merge);}
            } else {
                await this.fileManager.mkdir(rpath);
            }

            for (const ent of entry.children) {
                if(this.closed) return;

                await this.uploadEntry(ent, path.pathjoin(rpath, ent.name));
            }
        }
    } //}

    private async PopOverrideOptionWindow(): Promise<[boolean,boolean]> //{
    {
        const ans = await this.messagebox.create({
            title: 'upload', 
            message: 'whether override file ?',
            inputs: [
                {label: 'Remember', name: 'remember', initValue: false, type: 'checkbox'}
            ],
            buttons: [
                {name: 'Override'},
                {name: 'Skip'}
            ]
        }).wait();
        const override = ans.buttonValue == 0;
        const remember = !!ans.inputs['remember'];
        return [override, remember];
    } //}

    private async PopMergeOptionWindow(): Promise<[boolean,boolean,boolean]> //{
    {
        const ans = await this.messagebox.create({
            title: 'upload', 
            message: 'whether merge folder ?',
            inputs: [
                {label: 'Remember', name: 'remember', initValue: false, type: 'checkbox'}
            ],
            buttons: [
                {name: 'Merge'},
                {name: 'Override'},
                {name: 'Skip'}
            ]
        }).wait();
        const merge = ans.buttonValue == 0;
        const override = ans.buttonValue == 1;
        const remember = !!ans.inputs['remember'];
        return [merge, override, remember];
    } //}

    private async fileMD5(file: File, position: number = 0, length: number = null) //{
    {
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
    } //}

    private async sendFile(fileData: File, filename: string): Promise<void> //{
    {
        this.inProcessFile = filename;
        let stat: FileStat;
        try {
            stat = await this.fileManager.stat(filename);
        } catch { }

        let uploadsize = 0;
        if(stat != null) {
            if (stat.filetype == FileType.dir) {
                throw new Error(`upload '${filename}' failed, it's a directory`);
            }

            if (stat.size <= fileData.size && this.userSettings.ContinueSendFileWithSameMD5) {
                if (this.localSettings.File_Upload_Just_Continue) {
                    uploadsize = stat.size;
                    this.uploadSize.next(stat.size);
                } else {
                    const rmd5 = await this.fileManager.md5(filename);
                    const lmd5 = await this.fileMD5(fileData, 0, stat.size);
                    if(rmd5 == lmd5) {
                        uploadsize = stat.size;
                        this.uploadSize.next(stat.size);
                    }
                }
            }

            if (uploadsize == 0) {
                let override = false;
                if(this.localSettings.File_Upload_Always_Overwrite ||
                   this.uploadOption.alwaysOverride)
                {
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
                    await this.fileManager.remove(filename);
                } else {
                    this.uploadSize.next(fileData.size);
                    return;
                }
            }
        }

        const slices: { buf?: ArrayBuffer, pos: number, len: number }[] = [];
        let sstart = uploadsize;
        while(sstart < fileData.size) {
            const sliceSize = Math.min(blocksize, fileData.size - sstart);
            slices.push({
                pos: sstart,
                len: sliceSize,
            });
            sstart += sliceSize;
        }

        const sessionId = await this.fileManager.createUploadSession(filename, uploadsize);
        const promises: Promise<any>[] = [];
        let cocurrentPromises: number = 30;
        while(slices.length > 0 || promises.length > 0) {
            if(this.closed) return;

            while (promises.length < cocurrentPromises && slices.length > 0) {
                const slice = slices.splice(0, 1)[0];
                const buf = slice.buf || await fileData.slice(slice.pos, slice.pos + slice.len).arrayBuffer();
                const pm =  this.fileManager.uploadSlice(sessionId, slice.pos, buf)
                                .then(() => [ true, pm, slice.len ], e => [ false, pm, e, slice ]);
                promises.push(pm);
            }

            const fResRej = await Promise.race(promises);
            const [ isResolved, pm ] = fResRej;
            if (isResolved) {
                const sliceSize = fResRej[2];
                this.uploadSize.next(sliceSize);
                const idx = promises.indexOf(pm);
                promises.splice(idx, 1);
            } else {
                const err = fResRej[2];
                const slice = fResRej[3];

                const toomanywaiters_prefix = 'too many waiters:';
                if (!(typeof err === 'string') || !err.trim().startsWith(toomanywaiters_prefix))
                    throw err;

                const val = Number(err.trim().substring(toomanywaiters_prefix.length));
                if (Number.isSafeInteger(val) && val > 0) {
                    cocurrentPromises = val;
                } else {
                    cocurrentPromises = Math.max(5, cocurrentPromises - 5);
                }

                const idx = promises.indexOf(pm);
                promises.splice(idx, 1);
                slices.push(slice);
                slices.sort((a, b) => a.pos - b.pos);
            }
        }
        await this.fileManager.expireUploadSession(sessionId);

        if (this.localSettings.File_Upload_ValidateMD5) {
            const rmd5 = await this.fileManager.md5(filename);
            const lmd5 = await this.fileMD5(fileData);
            if (rmd5 != lmd5) {
                throw new Error(`upload file fail, unexpected md5 ${rmd5}, require ${lmd5}`);
            }
        }
    } //}

    private close_hook: () => void;
    onClose() {
        this.closed = true;
        if(this.close_hook) this.close_hook();
    }

    registerClose(hook: () => void) {
        this.close_hook = hook;
    }
}

