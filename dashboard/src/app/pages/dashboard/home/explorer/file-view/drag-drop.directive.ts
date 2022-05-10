import { Directive, ElementRef, EventEmitter, Input, OnDestroy, OnInit, Output } from '@angular/core';
import { Subscription } from 'rxjs';
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
            ev.dataTransfer.setData(this.dragkey, this.dragvalue);
            ev.dataTransfer.setDragImage(host, 0, 0);
        });
    }
}


@Directive({
    selector: '[dropdir]',
})
export class DropDirectoryDirective implements OnInit, OnDestroy {
    @Input()
    dropdir: string;
    @Input()
    acceptDragItem: boolean;
    @Output()
    dropdone: EventEmitter<void> = new EventEmitter();

    constructor(private host: ElementRef,
                private fileOperation: FileOperationService) {
    }

    private subscription: Subscription;
    ngOnDestroy(): void {
        this.subscription.unsubscribe();
    }

    ngOnInit(): void {
        this.subscription = new Subscription();
        const host = this.host.nativeElement as HTMLElement;
        this.acceptDragItem = this.acceptDragItem || host.hasAttribute("accept-drag-item");

        const handleDragOver = async (ev: DragEvent) => {
            if (this.dropdir == null) return;
            ev.stopPropagation();
            ev.preventDefault();
        };
        host.addEventListener("dragover", handleDragOver);
        this.subscription.add(() => host.removeEventListener("dragover", handleDragOver));

        const handleDrop = async (ev: DragEvent) => {
            if (this.dropdir == null) return;
            ev.stopPropagation();
            ev.preventDefault();

            // avoid inconsistent behavior caused by dropdir change in this asyncrhonous function call
            const currentDir = this.dropdir;
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
                            await this.fileOperation.upload([entry], currentDir);
                        } catch (e) {
                            console.error(e);
                        }
                    }
                }
                this.dropdone.next();
            } else if (filepath != currentDir && this.acceptDragItem) {
                const nf = new FileStat();
                nf.filename = filepath;
                if (await this.fileOperation.move([nf], currentDir)) {
                    this.dropdone.next();
                }
            }
        };
        host.addEventListener("drop", handleDrop);
        this.subscription.add(() => host.removeEventListener("drop", handleDrop));
    }
}
