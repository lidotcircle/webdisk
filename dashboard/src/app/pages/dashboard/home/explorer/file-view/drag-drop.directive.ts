import { Directive, ElementRef, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { FileStat } from 'src/app/shared/common';
import { FileOperationService } from 'src/app/shared/service/file-operation.service';


@Directive({
    selector: '[dragitem]',
})
export class DragItemDirective implements OnInit {
    @Input()
    dragkey: string;
    @Input()
    dragvalue: any;

    constructor(private host: ElementRef) {
    }

    ngOnInit(): void {
        if (this.dragkey == null) {
            throw new Error("drag item should provide data");
        }

        const host = this.host.nativeElement as HTMLElement;
        host.draggable = true;
        host.addEventListener("dragstart", (ev: DragEvent) => {
            ev.stopPropagation();
            console.log(this.dragkey, this.dragvalue);
            ev.dataTransfer.setData(this.dragkey, this.dragvalue);
            ev.dataTransfer.setDragImage(host, 0, 0);
        });
    }
}


@Directive({
    selector: '[dropdir]',
})
export class DropDirectoryDirective implements OnInit {
    @Input()
    dropdir: string;
    @Input()
    acceptDragItem: boolean;
    @Output()
    dropdone: EventEmitter<void> = new EventEmitter();

    constructor(private host: ElementRef,
                private fileOperation: FileOperationService) {
    }

    ngOnInit(): void {
        const host = this.host.nativeElement as HTMLElement;
        this.acceptDragItem = this.acceptDragItem || host.hasAttribute("accept-drag-item");

        host.addEventListener("dragover", (ev: DragEvent) => {
            ev.stopPropagation();
            ev.preventDefault();
        });
        host.addEventListener("drop", async (ev: DragEvent) => {
            ev.stopPropagation();
            ev.preventDefault();
            if (this.dropdir == null) return;

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
                            await this.fileOperation.upload([entry], this.dropdir);
                        } catch (e) {
                            console.error(e);
                        }
                    }
                }
                this.dropdone.next();
            } else if (filepath != this.dropdir && this.acceptDragItem) {
                const nf = new FileStat();
                nf.filename = filepath;
                await this.fileOperation.move([nf], this.dropdir);
                this.dropdone.next();
            }
        });
    }
}
