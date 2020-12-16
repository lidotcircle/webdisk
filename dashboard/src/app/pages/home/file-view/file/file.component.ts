import { Component, Input, OnInit, ViewChild, ElementRef, ViewEncapsulation, EventEmitter, Output } from '@angular/core';
import { FileStat, FileType } from 'src/app/shared/common';
import { nextTick, path } from 'src/app/shared/utils';
import { FiletypeSvgIconService } from 'src/app/shared/service/filetype-svg-icon.service';
import { FileViewStyle } from '../file-view.component';
import { FileSystemManagerService } from 'src/app/shared/service/file-system-manager.service';
import { CurrentDirectoryService } from 'src/app/shared/service/current-directory.service';
import { InjectViewService } from 'src/app/shared/service/inject-view.service';
import { UploadFileViewComponent } from 'src/app/shared/shared-component/upload-file-view/upload-file-view.component';
import { AcceptDragItem, AsDragItem } from './dragdrop';
import { UserSettingService } from 'src/app/shared/service/user-setting.service';


@Component({
    selector: 'app-file',
    templateUrl: './file.component.html',
    styleUrls: ['./file.component.scss'],
    encapsulation: ViewEncapsulation.None
})
export class FileComponent implements OnInit {
    @Input('file')
    file: FileStat;

    @Input('name-order')
    nameOrder: number;
    @Input('date-order')
    dateOrder: number;
    @Input('mode-order')
    modeOrder: number;
    @Input('type-order')
    typeOrder: number;
    @Input('size-order')
    sizeOrder: number;
    @Input('name-width')
    nameWidth: number;
    @Input('date-width')
    dateWidth: number;
    @Input('mode-width')
    modeWidth: number;
    @Input('type-width')
    typeWidth: number;
    @Input('size-width')
    sizeWidth: number;

    @Input('view-style')
    private viewStyle: FileViewStyle;

    @Output('doubleClick')
    private doubleClickEmitter = new EventEmitter();
    @Output('select')
    private selectEmitter = new EventEmitter();

    @ViewChild('fileicon')
    private iconElem: ElementRef;

    @ViewChild('fileitem')
    private itemElem: ElementRef;

    constructor(private svgIcon: FiletypeSvgIconService,
                private fileManager: FileSystemManagerService,
                private cwd: CurrentDirectoryService,
                private injector: InjectViewService,
                private settings: UserSettingService) {}

    ngOnInit(): void {
        if(this.file == null || this.file.filename == null) {
            throw new Error('bad filename');
        }

        const updateIcon = (icon: string) => {
            this.svgIcon.getSvgIcon(icon)
                .then(svg => (this.iconElem.nativeElement as HTMLElement).innerHTML = svg as string)
                .catch(e => {
                    if(icon != 'blank') {
                        updateIcon('blank');
                    }
                });
        }

        if(this.file.filetype == FileType.dir) {
            updateIcon('folder');
            nextTick(() => AcceptDragItem(this.itemElem.nativeElement as HTMLElement, this.injector,
                                          this.file.filename, this.fileManager, this.cwd, this.settings));
        } else if (this.file.extension == '') {
            updateIcon('blank');
        } else {
            updateIcon(this.file.extension);
        }

        nextTick(() => AsDragItem(this.itemElem.nativeElement as HTMLElement, this.file.filename));
    }

    getPropCSS(order: number, width: number) {
        if(this.viewStyle != FileViewStyle.detail) return '';
        let ans = '';
        if(order == -1) {
            ans += 'display: none;';
        } else if (order != null) {
            ans += `order: ${order};`;
        }
        if(width != null && width >= 0)
            ans += `width: ${width}%;`;
        return ans;
    }

    getItemClass() {
        let ans = 'file-item ';
        switch(this.viewStyle) {
            case FileViewStyle.bigIcon:    ans += 'big-icon'; break;
            case FileViewStyle.mediumIcon: ans += 'big-icon'; break;
            case FileViewStyle.smallIcon:  ans += 'small-icon'; break;
            case FileViewStyle.detail:     ans += 'detail'; break;
            case FileViewStyle.list:       ans += 'list'; break;
            case FileViewStyle.tile:       ans += 'tile'; break;
        }
        return ans;
    }

    private prev_click = 0;
    private static doubleClickSpan = 700;
    onClick() {
        const now = Date.now();
        if((now - this.prev_click) < FileComponent.doubleClickSpan) {
            this.prev_click = 0;
            this.doubleClickEmitter.emit();
        } else {
            this.prev_click = now;
            this.selectEmitter.emit();
        }
    }

    get FileName(): string {
        return this.file.basename;
    }

    get FileMTime(): string {
        const date = this.file.mtime;
        return date.toLocaleString();
    }

    get FileMode(): string {
        return mode2string(this.file.mode);
    }

    get FileType(): string {
        return extension2type(this.file.extension);
    }

    get FileSize(): string {
        return size2String(this.file.size);
    }
}

function mode2string(mode: number) //{
{
    let oth = mode & 0x7;
    let grp = (mode & (0x7 << 3)) >> 3;
    let usr = (mode & (0x7 << 6)) >> 6;
    let spc = (mode & (0x7 << 9)) >> 9;
    let dir = (mode & (0x7 << 12)) >> 12;
    let f = (n: number) => {
        let r = "-", w = "-", x = "-";
        if ((n & 0x1) != 0) x = "x";
        if ((n & 0x2) != 0) w = "w";
        if ((n & 0x4) != 0) r = "r";
        return [r, w, x];
    }
    let oth_rwx = f(oth);
    let grp_rwx = f(grp);
    let usr_rwx = f(usr);
    let spc_rwx = f(spc);
    let dir_rwx = f(dir);
    let d, u, g, o;
    if (dir_rwx.join("") == "---") d = "-"; else d = "d";
    if (spc_rwx[0] == "r") {
        if  (usr_rwx[2] == '-') usr_rwx[2] = "S"; 
        else usr_rwx[2] = "s";
    }
    u = usr_rwx.join("");
    if (spc_rwx[1] == "w") {
        if  (grp_rwx[2] == '-') grp_rwx[2] = "S"; 
        else grp_rwx[2] = "s";
    }
    g = grp_rwx.join("");
    if (spc_rwx[1] == "x") {
        if  (oth_rwx[2] == '-') oth_rwx[2] = "T"; 
        else oth_rwx[2] = "t";
    }
    o = oth_rwx.join("");
    return d + u + g + o;
} //}

function int2string(n: number) //{
{
    n = Math.floor(n);
    if (n < 1000) return n.toString();
    let ret = "";
    let x: number;
    while (n >= 1000) {
        x = Math.floor(n % 1000);
        n = Math.floor(n / 1000);
        if (ret != "")
            ret = "," + ret;
        let m = x.toString();
        for (let i = m.length; i<3; i++)
            m = "0" + m;
        ret = m + ret;
    }
    if (ret != "")
        ret = n.toString() + "," + ret;
    else
        ret = n.toString();
    return ret;
} //}
function size2String(size: number) //{
{
    if (size < 1024) return `${int2string(size)} Byte`;
    if (size < 1024 * 1024 * 1024) return `${int2string(size / 1024)} KB`;
    if (size < 1024 * 1024 * 1024 * 1024) return `${int2string(size / 1024)} MB`;
    if (size < 1024 * 1024 * 1024 * 1024 * 1024) return `${int2string(size / 1024)} GB`;
} //}
function extension2type(ext: string) //{
{
    if (ext == null || ext == "") return "File";
    return ext.toUpperCase() + " File";
} //}


