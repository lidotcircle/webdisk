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
    elem.addEventListener("drop", async (ev: DragEvent) => {
        ev.stopPropagation();
        ev.preventDefault();
        const filepath = ev.dataTransfer.getData("path");
        if (filepath == '') {
            const entries = [];
            for(let i=0; i<ev.dataTransfer.items.length; i++) {
                const entry = ev.dataTransfer.items[i].webkitGetAsEntry();
                entries.push(entry);
            }
            for(const entry of entries) {
                if (entry.isFile || entry.isDirectory) { // FileSystemEntry
                    try {
                        await fileOperation.upload([entry], destination());
                    } catch (e) {
                        console.log(e);
                    }
                }
            }
            if (uploadHook) uploadHook();
        } else if (filepath != destination() && acceptDragItem) {
            const nf = new FileStat();
            nf.filename = filepath;
            fileOperation.move([nf], destination());
        }
    });
}

