import { Component, Input, OnInit, EventEmitter, Output } from '@angular/core';
import { FileStat, FileType } from 'src/app/shared/common';
import { FileViewStyle } from '../file-view.component';
import { CurrentDirectoryService } from 'src/app/shared/service/current-directory.service';
import { LocalSettingService } from 'src/app/service/user/local-setting.service';


@Component({
    selector: 'app-file',
    templateUrl: './file.component.html',
    styleUrls: ['./file.component.scss'],
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
    @Output('menu')
    private menuEmitter = new EventEmitter();

    constructor(private cwd: CurrentDirectoryService,
        private localSetting: LocalSettingService) {}

    private _icon: string = 'blank';
    get icon() {return this._icon;}

    get dropdir() { 
        if (!this.file || this.file.filetype != FileType.dir) {
            return null;
        }

        return this.file.filename;
    }
    handleDropdone = () => this.cwd.cd(this.dropdir);

    ngOnInit(): void {
        if(this.file == null || this.file.filename == null) {
            throw new Error('bad filename');
        }

        if(this.file.filetype == FileType.dir) {
            this._icon = 'folder';
        } else if (this.file.extension == '') {
            this._icon = 'blank';
        } else {
            this._icon = this.file.extension;
        }
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
        let ans = `file-item type-${this.file.storageType} ${this.file.encrypted ? 'encrypted' : ''} `;
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

    onContextMenu() {
        this.menuEmitter.next();
    }

    get FileName(): string {
        return this.file.basename;
    }

    get FileMTime(): string {
        const date = this.file.mtime;
        return date.toLocaleString();
    }

    get FileMode(): string {
        return this.mode2string(this.file.mode);
    }

    get FileType(): string {
        switch(this.file.filetype) {
            case FileType.dir: 
                return 'Directory';
            case FileType.socket:
                return 'Socket';
            default: 
                return this.extension2type(this.file.extension);
        }
    }

    get FileSize(): string {
        return this.size2String(this.file.size);
    }


    private mode2string(mode: number) //{
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
        let d: string, u: string, g: string, o: string;
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

    private int2string(n: number) //{
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
    private size2String(size: number) //{
    {
        if (size < 1024) {
            // MAX 1023 Byte
            return `${this.int2string(size)} Byte`;
        } else if (size < 10 * 1024 * 1024 || this.localSetting.Explorer_Filesize_Unit_Always_KB) {
            // MAX 10239 KB
            return `${this.int2string(size / 1024)} KB`;
        } else if (size < 10 * 1024 * 1024 * 1024) {
            // MAX 10239 MB
            return `${this.int2string(size / (1024 * 1024))} MB`;
        } else {
            return `${this.int2string(size / (1024 * 1024 * 1024))} GB`;
        }
    } //}
    private extension2type(ext: string) //{
    {
        if (ext == null || ext == "") return "File";
        return ext.toUpperCase() + " File";
    } //}
}

