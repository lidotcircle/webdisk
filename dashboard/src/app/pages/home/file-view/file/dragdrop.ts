import { path } from 'src/app/shared/utils';
import { FileSystemManagerService } from 'src/app/shared/service/file-system-manager.service';
import { CurrentDirectoryService } from 'src/app/shared/service/current-directory.service';
import { InjectViewService } from 'src/app/shared/service/inject-view.service';
import { UploadFileViewComponent } from 'src/app/shared/shared-component/upload-file-view/upload-file-view.component';
import { UserSettingService } from 'src/app/shared/service/user-setting.service';

export function AsDragItem(elem: HTMLElement, filepath: string) {
    elem.addEventListener("dragstart", (ev: DragEvent) => {
        ev.stopPropagation();
        ev.dataTransfer.setData("path", filepath);
        ev.dataTransfer.setDragImage(elem, 0, 0);
    });

}

export function AcceptDragItem(elem: HTMLElement, injector: InjectViewService, destination: string, 
                               fileManager: FileSystemManagerService, cwd: CurrentDirectoryService, userSettings: UserSettingService) {
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
                    const upload = injector.inject(UploadFileViewComponent, {
                        fileEntry: entry, 
                        destination: destination
                    });
                    upload.upload()
                    .then(() => {
                        console.log("upload success");
                    })
                    .catch(err => {
                        console.error('upload fail: ', err);
                    })
                    .finally(() => {
                        upload.destroy();
                    });
                }
            }
        } else if (filepath != destination) {
            const b = path.basename(filepath);
            let move = false;
            if (userSettings.MoveFolderWithoutConfirm) {
                move = true;
            } else {
            }
            if (move) {
                fileManager.move(filepath, destination + "/" + b)
                    .then(() => {
                        cwd.justRefresh();
                    })
                    .catch((err) => {
                        // TODO
                        console.error(err);
                    });
            }
        }
    });
}

