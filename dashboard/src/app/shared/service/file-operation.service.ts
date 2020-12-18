import { Injectable } from '@angular/core';
import { FileStat } from '../common';
import { MatButtonType } from '../shared-component/message-box/message-box.component';
import { FileSystemEntry } from '../utils';
import { CurrentDirectoryService } from './current-directory.service';
import { FileSystemManagerService } from './file-system-manager.service';
import { InjectViewService } from './inject-view.service';
import { MessageBoxService } from './message-box.service';
import { NotifierService } from './notifier.service';

@Injectable({
    providedIn: 'root'
})
export class FileOperationService {
    constructor(private notifier: NotifierService,
                private messagebox: MessageBoxService,
                private injector: InjectViewService,
                private filesystem: FileSystemManagerService,
                private cwd: CurrentDirectoryService) {}

    async move(files: FileStat[], destination: string) {
    }

    async copy(files: FileStat[], destination: string) {
    }

    /**
     * @param {string} newname new basename
     */
    async rename(file: FileStat, newname: string) {
    }

    async upload(fileEntry: FileSystemEntry, destination: string) {
    }

    async delete(files: FileStat[]) {
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
    }
}

