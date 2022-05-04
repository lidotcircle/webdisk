import { Injectable } from '@angular/core';
import { FileStat, FileType } from '../common';
import { MatButtonType } from '../shared-component/message-box/message-box.component';
import { NotifierType } from '../shared-component/notifier/notifier.component';
import { FileSystemEntry, FileSystemEntryWrapper, path } from '../utils';
import { AccountManagerService } from './account-manager.service';
import { CurrentDirectoryService } from './current-directory.service';
import { FileSystemManagerService } from './file-system-manager.service';
import { MessageBoxService } from './message-box.service';
import { MessageProgressBarService } from './message-progress-bar.service';
import { NotifierService } from './notifier.service';
import { OpenSystemChooseFilesService } from './open-system-choose-files.service';
import { UploadSessionService } from './upload-session.service';
import { UserSettingService } from './user-setting.service';

@Injectable({
    providedIn: 'root'
})
export class FileOperationService {
    constructor(private notifier: NotifierService,
                private messagebox: MessageBoxService,
                private filesystem: FileSystemManagerService,
                private uploadservice: UploadSessionService,
                private cwd: CurrentDirectoryService,
                private settings: UserSettingService,
                private filechooser: OpenSystemChooseFilesService,
                private accountManager: AccountManagerService,
                private messageprogress: MessageProgressBarService) {}

    private async reportError(msg: string) //{
    {
        await this.notifier.create({
            message: msg,
            mtype: NotifierType.Error
        }).wait();
    } //}
    private async reportSuccess(msg: string) //{
    {
        await this.notifier.create({message: msg}).wait();
    } //}

    async move(files: FileStat[], destination: string): Promise<boolean> //{
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
                    console.log(err);
                    this.reportError(err);
                    b.stop();
                    this.cwd.justRefresh();
                    return false;
                }
            }
            await b.finish();
            this.cwd.justRefresh();
            return true;
        }

        return false;
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
                if(file.filetype == FileType.dir) {
                    await this.filesystem.copyr(file.filename, dn);
                } else {
                    await this.filesystem.copy(file.filename, dn);
                }
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

    async upload(fileEntries: FileSystemEntryWrapper[] | FileSystemEntry[], destination: string) //{
    {
        let entries = fileEntries as FileSystemEntryWrapper[];
        if(fileEntries.length > 0 && !(fileEntries[0] instanceof FileSystemEntryWrapper)) {
            entries = [];
            for(const entry of fileEntries) {
                entries.push(await FileSystemEntryWrapper.fromFileSystemEntry(entry as FileSystemEntry));
            }
        }
        await this.uploadservice.create(entries, destination).upload();
    } //}
    async filechooser_upload_file_to(destination: string, accept?: string) //{
    {
        const file = await this.filechooser.getFile(accept);
        await this.upload([file], destination);
    } //}
    async filechooser_upload_files_to(destination: string, accept?: string) //{
    {
        const files = await this.filechooser.getFiles(accept);
        await this.upload(files, destination);
    } //}
    async filechooser_upload_directory_to(destination: string) //{
    {
        const dir = await this.filechooser.getDirectory();
        await this.upload([dir], destination);
    } //}

    private async new_folderorfile(destination: string, isfile: boolean = true) //{
    {
        const f = isfile ? 'file' : 'folder';
        const ans = await this.messagebox.create({title: `new ${f}`, message: '', inputs: [
            {label: `new ${f} name`, name: 'name', type: 'text'}
        ], buttons: [
            {name: 'confirm'},
            {name: 'cancel'}
        ]}).wait();;
        if(ans.closed || ans.buttonValue == 1 || !ans.inputs['name'] || ans.inputs['name'].length == 0) {
            return;
        } else {
            const p = path.pathjoin(destination, ans.inputs['name']);
            try {
                if(!isfile) {
                    await this.filesystem.mkdir(p);
                } else {
                    await this.filesystem.touch(p);
                }
            } catch(err) {
                this.reportError(`create ${f} in '${p}' fail: ` + err);
                return;
            }
            this.reportSuccess(`create ${f} success: ${p}`);
            this.cwd.justRefresh();
        }
    } //}
    async new_folder(destination: string) //{
    {
        await this.new_folderorfile(destination, false);
    } //}
    async new_file(destination: string) //{
    {
        await this.new_folderorfile(destination, true);
    } //}

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
                    await this.filesystem.remover(file.filename);
                } catch(err) {
                    await this.notifier.create({
                        message: `Delete '${file.basename}' fail: ` + err.toString(),
                        mtype: NotifierType.Error
                    }).wait();
                    return;
                }
            }

            await this.notifier.create({message: 'Delete success!'}).wait();
            this.cwd.justRefresh();
        }
    } //}

    async shareFileWithNamedLink(filename: string, linkname: string, period: number) //{
    {
        try {
            await this.accountManager.newNameEntry(linkname, filename, period);
        } catch(err) {
            await this.notifier.create({
                message: `create named link ${linkname} to '${filename}' fail`,
                mtype: NotifierType.Error
            }).wait();
            return;
        }
        await this.notifier.create({
            message: `create named link ${linkname} to '${filename}' success`
        }).wait();
    } //}
}

