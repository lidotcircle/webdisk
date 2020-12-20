import { Injectable } from '@angular/core';
import { FileStat } from '../common';
import { MatButtonType } from '../shared-component/message-box/message-box.component';
import { FileSystemEntry, path } from '../utils';
import { CurrentDirectoryService } from './current-directory.service';
import { FileSystemManagerService } from './file-system-manager.service';
import { InjectViewService } from './inject-view.service';
import { MessageBoxService } from './message-box.service';
import { MessageProgressBarService } from './message-progress-bar.service';
import { NotifierService } from './notifier.service';
import { UserSettingService } from './user-setting.service';

@Injectable({
    providedIn: 'root'
})
export class FileOperationService {
    constructor(private notifier: NotifierService,
                private messagebox: MessageBoxService,
                private injector: InjectViewService,
                private filesystem: FileSystemManagerService,
                private cwd: CurrentDirectoryService,
                private settings: UserSettingService,
                private messageprogress: MessageProgressBarService) {}

    private async reportError(msg: string) //{
    {
        await this.notifier.create({
            message: msg,
            duration: 2000
        }).wait();
    } //}
    private async reportSuccess(msg: string) //{
    {
        await this.notifier.create({
            message: msg,
            duration: 2000
        }).wait();
    } //}

    async move(files: FileStat[], destination: string) //{
    {
        let move = this.settings.MoveFolderWithoutConfirm;
        if(!move) {
            const userans = await this.messagebox.create({
                title: 'move file',
                message: `are you sure move files to ${destination}`,
                buttons: [
                    {name: 'Confirm'},
                    {name: 'Cancel'}
                ]
            }).wait();
            move = userans.buttonValue == 0;
        }

        if(move) {
            let stop = false;
            const b = this.messageprogress.create({title: 'move file'});
            b.registerClose(() => stop = true);
            for(const file of files) {
                if(stop) {
                    return;
                }
                b.pushMessage('move ' + path.basename(file.filename) + ' to ' + destination);
                const dn = path.pathjoin(destination, path.basename(file.filename));
                try {
                    await this.filesystem.move(file.filename, dn);
                } catch(err) {
                    this.reportError(err);
                    b.stop();
                    this.cwd.justRefresh();
                    return;
                }
            }
            await b.finish();
            this.cwd.justRefresh();
        }
    } //}

    async copy(files: FileStat[], destination: string) //{
    {
        let stop = false;
        const b = this.messageprogress.create({title: 'copy file'});
        b.registerClose(() => stop = true);
        for(const file of files) {
            if(stop) {
                return;
            }
            b.pushMessage('copy ' + path.basename(file.filename) + ' to ' + destination);
            const dn = path.pathjoin(destination, path.basename(file.filename));
            try {
                await this.filesystem.copyr(file.filename, dn);
            } catch(err) {
                this.reportError(err);
                b.stop();
                this.cwd.justRefresh();
                return;
            }
        }
        await b.finish();
        this.cwd.justRefresh();
    } //}

    /**
     * @param {string} newname new basename
     */
    async rename(file: FileStat, newname: string) //{
    {
        const dir = path.dir(file.filename);
        try {
            this.filesystem.move(file.filename, path.pathjoin(dir, newname));
        } catch (err) {
            this.reportError(`rename file '${file.filename}' fail: ${err}`);
        }
    } //}

    async upload(fileEntry: FileSystemEntry, destination: string) {
    }

    async delete(files: FileStat[]) //{
    {
        const confirmOP = await this.messagebox.create({
            title: 'Delete',
            message: `Are you sure to delete ${files.length > 1 ? 'these ' + files.length + ' items' : files[0].basename}`,
            buttons: [
                {name: 'Confirm'},
                {name: 'Cancel', btype: MatButtonType.Stroked}
            ]
        }).wait();

        if(!confirmOP.closed && confirmOP.buttonValue == 0) {
            for(const file of files) {
                try {
                    this.filesystem.remover(file.filename);
                } catch(err) {
                    await this.notifier.create({
                        message: `Delete '${file.basename}' fail: ` + err.toString()
                    }).wait();
                    return;
                }
            }

            await this.notifier.create({
                message: 'Delete success!',
                duration: 2000
            }).wait();
            this.cwd.justRefresh();
        }
    } //}
}

