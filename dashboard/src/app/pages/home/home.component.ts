import { Component, OnInit, ElementRef, OnDestroy } from '@angular/core';
import { FileStat } from 'src/app/shared/common';
import { FileSystemManagerService } from 'src/app/shared/service/file-system-manager.service';
import { InjectViewService } from 'src/app/shared/service/inject-view.service';
import { NotifierComponent } from 'src/app/shared/shared-component/notifier/notifier.component';
import { KeyboardPressService, Keycode } from 'src/app/shared/service/keyboard-press.service';
import { Subscription } from 'rxjs';


/** sortByName */
function SortByName(d1: FileStat, d2: FileStat): number //{
{
    if(d1.filetype == "dir" && d2.filetype != "dir") return -1;
    if(d2.filetype == "dir" && d1.filetype != "dir") return 1;
    if(d1.filename.localeCompare(d2.filename) < 0) return -1; // d1 is lexicographically greater than d2
    return 1;
} //}
/** sortByTime */
function SortByDate(d1: FileStat, d2: FileStat): number //{
{
    if(d1.filetype == "dir" && d2.filetype != "dir") return -1;
    if(d2.filetype == "dir" && d1.filetype != "dir") return 1;
    if(d1.ctimeMs > d2.ctimeMs) return -1; // d1 is newer than d2
    if(d1.ctimeMs == d2.ctimeMs) return SortByName(d1, d2);
    return 1;
} //}
/** sortBySize */
function SortBySize(d1: FileStat, d2: FileStat): number //{
{
    if(d1.filetype == "dir" && d2.filetype != "dir") return -1;
    if(d2.filetype == "dir" && d1.filetype != "dir") return 1;
    if(d1.size > d2.size) return -1; // size of d1 is greater than d2
    if(d1.size == d2.size) return SortByName(d1, d2);
    return 1;
} //}
/** sortByType */
function SortByType(d1: FileStat, d2: FileStat): number //{
{
    if(d1.filetype == "dir" && d2.filetype != "dir") return -1;
    if(d2.filetype == "dir" && d1.filetype != "dir") return 1;
    if((d1.extension || "").localeCompare(d2.extension || "") < 0) return -1;
    if((d1.extension || "").localeCompare(d2.extension || "") > 0) return 1;
    return SortByName(d1, d2);
} //}

class FileDetailViewStyle {
    nameOrder: number = 0;
    dateOrder: number = 1;
    typeOrder: number = 2;
    sizeOrder: number = 3;
    modeOrder: number = 4;

    nameWidth: number = 20;
    dateWidth: number = 20;
    typeWidth: number = 20;
    sizeWidth: number = 20;
    modeWidth: number = 20;
}

export enum FileViewStyle {
    detail = 'detail',
    list = 'list',
    tile = 'tile',
    bigIcon = 'large-icon',
    mediumIcon = 'medium-icon',
    smallIcon = 'small-icon',
}


@Component({
    selector: 'app-home',
    templateUrl: './home.component.html',
    styleUrls: ['./home.component.scss']
})
export class HomeComponent implements OnInit, OnDestroy {
    files: FileStat[] = [];
    select: boolean[] = [];
    // TODO save to local storage
    detailFileView: FileDetailViewStyle = new FileDetailViewStyle();
    viewStyle: FileViewStyle = FileViewStyle.detail;

    constructor(private fileManager: FileSystemManagerService,
                private viewInject: InjectViewService,
                private KeyboardPress: KeyboardPressService,
                private host: ElementRef) {
        this.fileManager.getdir('/')
            .then(files => this.files = files)
            .catch(e => console.warn(e));
        const n = this.viewInject.inject(NotifierComponent, {title: "hello"});
        setTimeout(() => n.destroy(), 500);
    }

    private subscription: Subscription;
    ngOnInit(): void {
        this.subscription = this.KeyboardPress.down.subscribe((kv) => {
            switch(kv.code) {
                case Keycode.ESC:
                    this.select = [];
                    break;
            }
        });
    }

    ngOnDestroy(): void {
        this.subscription.unsubscribe();
    }

    private prevSelect: number;
    onSelect(n: number) {
        console.log(n);
        if(this.KeyboardPress.InPress(Keycode.Ctrl)) {
            this.select[n] = !this.select[n];
        } else if (this.KeyboardPress.InPress(Keycode.Shift) && this.prevSelect != null) {
            this.select = [];
            for(let i=Math.min(this.prevSelect,n);i<=Math.max(this.prevSelect,n);i++) {
                this.select[i] = true;
            }
        } else {
            const ps = this.select[n];
            this.select = [];
            this.select[n] = !ps;
        }
        this.prevSelect = n;
    }

    sortByName() {
        this.files.sort(SortByName);
    }
    sortByDate() {
        this.files.sort(SortByDate);
    }
    sortByType() {
        this.files.sort(SortByType);
    }
    sortBySize() {
        this.files.sort(SortBySize);
    }

    private _order: boolean = true;
    reverse() {
        this._order = !this._order;

        const o = this.files;
        this.files = [];
        for(let f of o) {
            this.files.unshift(f);
        }
    }

    get FileOrder(): boolean {
        return this._order;
    }

    get FileCount(): number {
        return this.files.length;
    }
}

