import { FileOperationService } from 'src/app/shared/service/file-operation.service';
import { FileStat } from 'src/app/shared/common';

export function AsDragItem(elem: HTMLElement, file: FileStat) {
    elem.addEventListener("dragstart", (ev: DragEvent) => {
        ev.stopPropagation();
        ev.dataTransfer.setData("path", file.filename);
        ev.dataTransfer.setDragImage(elem, 0, 0);
    });

}

export function AcceptDragItem(elem: HTMLElement, destination: () => string, 
                               fileOperation: FileOperationService, acceptDragItem: boolean = true, uploadHook?: () => void)
{
    if (destination == null)
        return;

    elem.addEventListener("dragover", (ev: DragEvent) => {
        ev.stopPropagation();
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
                    fileOperation.upload([entry], destination())
                    .catch(err => console.error(err))
                    .then(() => {
                        if(uploadHook) uploadHook.bind(null)();
                    });;
                }
            }
        } else if (filepath != destination() && acceptDragItem) {
            const nf = new FileStat();
            nf.filename = filepath;
            fileOperation.move([nf], destination());
        }
    });
}

