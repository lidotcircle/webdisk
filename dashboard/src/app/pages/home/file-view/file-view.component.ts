import { Component, OnInit, ElementRef, OnDestroy, ViewEncapsulation } from '@angular/core';
import { FileStat, FileType } from 'src/app/shared/common';
import { FileSystemManagerService } from 'src/app/shared/service/file-system-manager.service';
import { InjectViewService } from 'src/app/shared/service/inject-view.service';
import { KeyboardPressService, Keycode } from 'src/app/shared/service/keyboard-press.service';
import { Subscription } from 'rxjs';
import { CurrentDirectoryService } from 'src/app/shared/service/current-directory.service';
import { AccountManagerService } from 'src/app/shared/service/account-manager.service';
import { cons, downloadURI } from 'src/app/shared/utils';
import { MenuEntry, MenuEntryType, RightMenuManagerService } from 'src/app/shared/service/right-menu-manager.service';
import { MessageBoxService } from 'src/app/shared/service/message-box.service';
import { FileOperationService } from 'src/app/shared/service/file-operation.service';
import { ClipboardContentType, ClipboardService } from 'src/app/shared/service/clipboard.service';


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
                private messagebox: MessageBoxService,
                private fileoperation: FileOperationService,
                private clipboard: ClipboardService,
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

    private menuItemSet = {
        paste:  false,
        upload: false,
    }
    private clear_menuItemSet() //{
    {
        for(const key in this.menuItemSet) this.menuItemSet[key] = false;
    } //}
    onFileViewContextMenu() //{
    {
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

        const entries = [refresh, forward, back];
        if(!this.menuItemSet.paste) {
            const pasteEntry = this.createMenuEntry_Paste();
            entries.push(pasteEntry);
            this.menuItemSet.paste = true;
        }
        if(!this.menuItemSet.upload) {
            const uploadEntry = this.createMenuEntry_Upload(this.currentDirectory.now);
            entries.push(uploadEntry);
            this.menuItemSet.upload = true;
        }

        this.menuManager.registerMenuEntry(MenuEntryType.FileView, entries);
        this.clear_menuItemSet();
    } //}

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
    onSelect(n: number) //{
    {
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
    } //}

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

    private createMenuEntry_Paste() //{
    {
        const pasteEntry = new MenuEntry('Paste', 'content_paste');
        const pastecwd = this.currentDirectory.now;
        pasteEntry.enable = () => this.clipboard.contenttype == ClipboardContentType.files;
        pasteEntry.clickCallback = () => {
            this.clipboard.paste((iscut, files: FileStat[]) => {
                if(iscut) {
                    this.fileoperation.move(files, pastecwd);
                } else {
                    this.fileoperation.copy(files, pastecwd);
                }
            });
        }
        return pasteEntry;
    } //}
    private createMenuEntry_Upload(destination: string) //{
    {
        const uploadFileEntry = new MenuEntry('Upload File', 'attach_file');
        const refresh = this.currentDirectory.now == destination;
        uploadFileEntry.clickCallback = () => {
            this.fileoperation.filechooser_upload_file_to(destination)
                .finally(() => refresh ? this.currentDirectory.justRefresh() : null);
        }
        const uploadFilesEntry = new MenuEntry('Upload Files', 'list');
        uploadFilesEntry.clickCallback = () => {
            this.fileoperation.filechooser_upload_files_to(destination)
                .finally(() => refresh ? this.currentDirectory.justRefresh() : null);
        }
        const uploadDirEntry = new MenuEntry('Upload Directory', 'folder');
        uploadDirEntry.clickCallback = () => {
            this.fileoperation.filechooser_upload_directory_to(destination)
                .finally(() => refresh ? this.currentDirectory.justRefresh() : null);
        }

        const uploadEntry = new MenuEntry('Upload', 'cloud_upload');
        uploadEntry.subMenus = [uploadFileEntry, uploadFilesEntry, uploadDirEntry];
        return uploadEntry;
    } //}
    private createMenuEntry_New(destination: string) //{
    {
        const newFileEntry = new MenuEntry('New File', 'add_circle');
        newFileEntry.clickCallback = () => {
            this.fileoperation.new_file(destination);
        }
        const newFolderEntry = new MenuEntry('New Folder', 'create_new_folder');
        newFolderEntry.clickCallback = () => {
            this.fileoperation.new_folder(destination);
        }
        const newEntry = new MenuEntry('New', 'add');
        newEntry.subMenus = [newFileEntry, newFolderEntry];
        return newEntry;
    } //}

    cuts = [];
    onMenu(n: number) //{
    {
        if(!this.select[n]) {
            this.onSelect(n);
        }
        const entries: MenuEntry[] = [];
        let selectFiles = [];
        for(let i=0;i<this.files.length;i++) {
            if(this.select[i]) selectFiles.push(this.files[i]);
        }
        console.assert(selectFiles.length > 0);
        const selectCopy = JSON.parse(JSON.stringify(this.select));

        let menuType = MenuEntryType.FileMenuClick;
        if (this.files[n].filetype == FileType.dir) {
            menuType = MenuEntryType.DirMenuClick;
            const chdir = new MenuEntry();
            chdir.clickCallback = () => this.onDoubleClick(n);
            chdir.entryName = "Open Folder";
            chdir.icon = "folder_open";
            entries.push(chdir);
            entries.push(this.createMenuEntry_Upload(this.files[n].filename));
            this.menuItemSet.upload = true;
        } else {
            const download = new MenuEntry();
            download.clickCallback = () => this.onDoubleClick(n);
            download.entryName = "Download File";
            download.icon = "cloud_download";
            entries.push(download);
        }

        const deleteEntry = new MenuEntry('Delete', 'delete');
        deleteEntry.clickCallback = () => {
            this.fileoperation.delete(selectFiles);
        }
        const copyEntry = new MenuEntry('Copy', 'content_copy');
        copyEntry.clickCallback = () => {
            this.clipboard.copy(ClipboardContentType.files, selectFiles);
            this.select = [];
        }
        const cutEntry = new MenuEntry('Cut', 'content_cut');
        cutEntry.clickCallback = () => {
            this.clipboard.cut(ClipboardContentType.files, selectFiles);
            this.cuts = selectCopy;
            this.select = [];
        }
        const pasteEntry = this.createMenuEntry_Paste();
        this.menuItemSet.paste = true;

        const newEntry = this.createMenuEntry_New(this.currentDirectory.now);

        for(const entry of [newEntry, deleteEntry, copyEntry, cutEntry, pasteEntry]) {
            entries.push(entry);
        }

        this.menuManager.registerMenuEntry(menuType, entries);
    } //}

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

