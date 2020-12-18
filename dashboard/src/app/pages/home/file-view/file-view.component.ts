import { Component, OnInit, ElementRef, OnDestroy, ViewEncapsulation } from '@angular/core';
import { FileStat, FileType } from 'src/app/shared/common';
import { FileSystemManagerService } from 'src/app/shared/service/file-system-manager.service';
import { InjectViewService } from 'src/app/shared/service/inject-view.service';
import { NotifierComponent } from 'src/app/shared/shared-component/notifier/notifier.component';
import { KeyboardPressService, Keycode } from 'src/app/shared/service/keyboard-press.service';
import { Subscription } from 'rxjs';
import { CurrentDirectoryService } from 'src/app/shared/service/current-directory.service';
import { AccountManagerService } from 'src/app/shared/service/account-manager.service';
import { cons, downloadURI } from 'src/app/shared/utils';
import { MenuEntry, MenuEntryType, RightMenuManagerService } from 'src/app/shared/service/right-menu-manager.service';
import { WindowNotifierService } from 'src/app/shared/service/window-notifier.service';


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

enum SortByWhat {
    name = 1, date, ftype, size
}

class ViewConfig {
    detail: FileDetailViewStyle = new FileDetailViewStyle();
    style: FileViewStyle = FileViewStyle.detail;
    sort: SortByWhat = SortByWhat.name;
    reverse: boolean = false;
    filter: string = '';
}


@Component({
    selector: 'app-file-view',
    templateUrl: './file-view.component.html',
    styleUrls: ['./file-view.component.scss'],
    encapsulation: ViewEncapsulation.None
})
export class FileViewComponent implements OnInit, OnDestroy {
    files: FileStat[] = [];
    select: boolean[] = [];
    // TODO save to account storage
    config: ViewConfig = new ViewConfig();

    get detailFileView(): FileDetailViewStyle {return this.config.detail;}
    get viewStyle(): FileViewStyle {return this.config.style;}
    get sortby(): SortByWhat {return this.config.sort;}
    get sortReverse(): boolean {return this.config.reverse;}

    constructor(private fileManager: FileSystemManagerService,
                private viewInject: InjectViewService,
                private accountManager: AccountManagerService,
                private KeyboardPress: KeyboardPressService,
                private currentDirectory: CurrentDirectoryService,
                private menuManager: RightMenuManagerService,
                private notifier: WindowNotifierService,
                private host: ElementRef) {
    }

    private kbsubscription: Subscription;
    private cwdSubscription: Subscription;
    ngOnInit(): void {
        this.kbsubscription = this.KeyboardPress.down.subscribe((kv) => {
            switch(kv.code) {
                case Keycode.ESC:
                    this.select = [];
                    break;
            }
        });
        this.cwdSubscription = this.currentDirectory.cwd.subscribe(new_cwd => {
            this.chdir(new_cwd);
        });
        this.currentDirectory.cd('/');
    }

    ngOnDestroy(): void {
        this.kbsubscription.unsubscribe();
        this.cwdSubscription.unsubscribe();
    }

    onFileViewContextMenu() {
        const forward = new MenuEntry();
        forward.clickCallback = () => this.currentDirectory.forward();
        forward.enable = () => this.currentDirectory.forwardable;
        forward.entryName = 'Forward';
        forward.icon = 'arrow_forward';

        const back = new MenuEntry();
        back.clickCallback = () => this.currentDirectory.back();
        back.enable = () => this.currentDirectory.backable;
        back.entryName = 'Back';
        back.icon = 'arrow_back';

        const refresh = new MenuEntry();
        refresh.clickCallback = () => this.currentDirectory.justRefresh();
        refresh.entryName = 'Refresh';
        refresh.icon = 'refresh';

        this.menuManager.registerMenuEntry(MenuEntryType.FileView, [refresh, forward, back]);
    }

    private refresh() {
        this.select = [];
        switch(this.sortby) {
            case SortByWhat.name:  this.sortByName(); break;
            case SortByWhat.date:  this.sortByDate(); break;
            case SortByWhat.ftype: this.sortByType(); break;
            case SortByWhat.size:  this.sortBySize(); break;
        }
        if(this.sortReverse) {
            const m = this.files;
            const f = [];
            for(const v of m) f.unshift([v]);
            this.files = f;
        }
    }

    private prevSelect: number;
    onSelect(n: number) {
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

    private chdir(dir: string) {
        this.fileManager.getdir(dir)
            .then(files => {
                this.files = files
                this.refresh();
            })
        // TODO
            .catch(e => console.warn(e));
    }

    onDoubleClick(n: number) {
        const stat = this.files[n];
        if(stat.filetype == FileType.dir) {
            // TODO hint
            this.currentDirectory.cd(stat.filename);
        } else if (stat.filetype == FileType.reg) {
            // TODO Others just download prefix
            this.accountManager.getShortTermToken().then(token => {
                const uri = `${cons.DiskPrefix}${stat.filename}?${cons.DownloadShortTermTokenName}=${token}`;
                downloadURI(uri, stat.basename);
            });
        }
    }

    onMenu(n: number) {
        this.onSelect(n);
        const entries: MenuEntry[] = [];

        let menuType = MenuEntryType.FileMenuClick;
        if (this.files[n].filetype == FileType.dir) {
            menuType = MenuEntryType.DirMenuClick;
            const chdir = new MenuEntry();
            chdir.clickCallback = () => this.onDoubleClick(n);
            chdir.entryName = "Open Folder";
            chdir.icon = "folder_open";
            entries.push(chdir);
        } else {
            const download = new MenuEntry();
            download.clickCallback = () => this.onDoubleClick(n);
            download.entryName = "Download File";
            download.icon = "cloud_download";
            entries.push(download);
        }

        const deleteEntry = new MenuEntry('Delete', 'delete');
        deleteEntry.clickCallback = () => {
        }
        const copyEntry = new MenuEntry('Copy', 'content_copy');
        copyEntry.clickCallback = () => {
        }
        const cutEntry = new MenuEntry('Cut', 'content_cut');
        cutEntry.clickCallback = () => {
        }
        const pasteEntry = new MenuEntry('Paste', 'content_paste');
        pasteEntry.clickCallback = () => {
        }

        for(const entry of [deleteEntry, copyEntry, cutEntry, pasteEntry]) {
            entries.push(entry);
        }

        this.menuManager.registerMenuEntry(menuType, entries);
    }

    private delete_file(stat: FileStat) {
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

