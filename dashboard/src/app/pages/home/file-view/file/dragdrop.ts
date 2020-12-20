import { path } from 'src/app/shared/utils';
import { FileSystemManagerService } from 'src/app/shared/service/file-system-manager.service';
import { CurrentDirectoryService } from 'src/app/shared/service/current-directory.service';
import { InjectViewService } from 'src/app/shared/service/inject-view.service';
import { UploadFileViewComponent } from 'src/app/shared/shared-component/upload-file-view/upload-file-view.component';
import { UserSettingService } from 'src/app/shared/service/user-setting.service';
import { FileOperationService } from 'src/app/shared/service/file-operation.service';
import { FileStat } from '../../../../../../../lib/common/file_types';
import { UploadSessionService } from 'src/app/shared/service/upload-session.service';

export function AsDragItem(elem: HTMLElement, file: FileStat) {
    elem.addEventListener("dragstart", (ev: DragEvent) => {
        ev.stopPropagation();
        ev.dataTransfer.setData("path", file.filename);
        ev.dataTransfer.setDragImage(elem, 0, 0);
    });

}

export function AcceptDragItem(elem: HTMLElement, injector: InjectViewService, destination: string, 
                               fileManager: FileSystemManagerService, cwd: CurrentDirectoryService, userSettings: UserSettingService,
                               fileOperation: FileOperationService, uploadService: UploadSessionService) {
    elem.addEventListener("dragover", (ev: DragEvent) => {
        ev.preventDefault();
    });
    elem.addEventListener("drop", (ev: DragEvent) => {
        ev.stopPropagation();
        ev.preventDefault();
        const filepath = ev.dataTransfer.getData("path");
        if (filepath == '') {
            for(let i=0; i<ev.dataTransfer.items.length; i++) {
                const entry = ev.dataTransfer.items[i].webkitGetAsEntry();
                if (entry.isFile || entry.isDirectory) { // FileSystemEntry
                    const upload = uploadService.create(entry, destination);
                    upload.upload().catch(err => console.error(err));
                }
            }
        } else if (filepath != destination) {
            const nf = new FileStat();
            nf.filename = filepath;
            fileOperation.move([nf], destination);
        }
    });
}

