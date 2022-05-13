import { Component, OnInit, ElementRef, OnDestroy, ViewChild, Input } from '@angular/core';
import { FileStat, FileType } from 'src/app/shared/common';
import { FileSystemManagerService } from 'src/app/shared/service/file-system-manager.service';
import { KeyboardPressService, Keycode } from 'src/app/shared/service/keyboard-press.service';
import { Subscription } from 'rxjs';
import { duration2ms, Life, path } from 'src/app/shared/utils';
import { MenuEntry, MenuEntryType, RightMenuManagerService } from 'src/app/shared/service/right-menu-manager.service';
import { MessageBoxService } from 'src/app/shared/service/message-box.service';
import { FileOperationService } from 'src/app/shared/service/file-operation.service';
import { ClipboardContentType, ClipboardService } from 'src/app/shared/service/clipboard.service';
import { ActivatedRoute, Router } from '@angular/router';
import { Tool, ToolbarService, ToolType } from './toolbar.service';
import { FileViewerService } from './plugins/file-viewer.service';
import { NbToastrService } from '@nebular/theme';
import { CurrentDirectoryService } from 'src/app/shared/service/current-directory.service';
import { PageEvent } from '@angular/material/paginator';
import { NamedLinkService } from 'src/app/service/user/named-link-service';
import { DiskDownloadService } from 'src/app/service/disk-download.service';
import { StorageBackendService } from 'src/app/service/storage-backend.service';


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

function dirname(path: string): string //{
{
    if(path.endsWith("/")) path = path.substr(0, path.length - 1);
    const p = path.substr(0, path.lastIndexOf("/") + 1);
    if (p.length > 1)
        return p.substring(0, p.length - 1);
    else
        return p;
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
})
export class FileViewComponent implements OnInit, OnDestroy {
    get fileslice(): FileStat[] {return this.files.slice(this.fileidx_beg, this.fileidx_end);}
    fileidx_beg: number = 0;
    fileidx_end: number = 0;
    fileEntryLength: number = 0;
    pageIdx: number = 0;
    pageSize: number = 50;
    handlePageEvent(event: PageEvent) {
        this.pageIdx = event.pageIndex;
        this.pageSize = event.pageSize;
        this.fileidx_beg = this.pageIdx * this.pageSize;
        this.fileidx_end = this.fileidx_beg + this.pageSize;
        this.select = [];
        this.cuts = [];
    }

    private set_files(_files: FileStat[]) {
        this.files = _files;
        this.pageIdx = 0;
        this.fileEntryLength = this.files.length;
        this.fileidx_beg = this.pageIdx * this.pageSize;
        this.fileidx_end = this.fileidx_beg + this.pageSize;
        this.refresh();
    }

    files: FileStat[] = [];
    cuts: boolean[] = [];
    select: boolean[] = [];
    // TODO save to account storage
    config: ViewConfig = new ViewConfig();

    get detailFileView(): FileDetailViewStyle {return this.config.detail;}
    get viewStyle(): FileViewStyle {return this.config.style;}
    get sortby(): SortByWhat {return this.config.sort;}
    get sortReverse(): boolean {return this.config.reverse;}

    private life: Life;
    constructor(private fileManager: FileSystemManagerService,
                private downloadService: DiskDownloadService,
                private namedLinkService: NamedLinkService,
                private toaster: NbToastrService,
                private toolbar: ToolbarService,
                private KeyboardPress: KeyboardPressService,
                private currentDirectory: CurrentDirectoryService,
                private menuManager: RightMenuManagerService,
                private messagebox: MessageBoxService,
                private fileoperation: FileOperationService,
                private clipboard: ClipboardService,
                private router: Router,
                private storeService: StorageBackendService,
                private activatedroute: ActivatedRoute,
                private fileviewer: FileViewerService,
                private host: ElementRef) {}

    private kbsubscription: Subscription;
    ngOnInit(): void //{
    {
        const menuSub = this.menuManager.registerElement(this.host.nativeElement as HTMLElement);
        this.kbsubscription = this.KeyboardPress.down.subscribe((kv) => {
            switch(kv.code) {
                case Keycode.ESC:
                    this.select = [];
                    break;
                case Keycode.DOWN:
                    for(let i=0;i<this.fileslice.length;i++) {
                        if(this.select[i] == true) {
                            this.select = [];
                            this.select[(i + 1) % this.fileslice.length] = true;
                            break;
                        }
                    }
                    break;
                case Keycode.UP:
                    for(let i=this.fileslice.length-1;i>=0;i--) {
                        if(this.select[i] == true) {
                            this.select = [];
                            this.select[(i + this.fileslice.length - 1) % this.fileslice.length] = true;
                            break;
                        }
                    }
                    break;
            }
        });
        this.kbsubscription.add(menuSub);
        this.life = new Life();
        this.setup_tools();
    } //}

    @Input()
    currentDir: string;
    handleDropdone = () => this.currentDirectory.justRefresh();

    private setup_tools() //{
    {
        const tool_home = new Tool('Home', 'home', () => this.currentDirectory.cd('/'));
        const tool_refresh = new Tool('Refresh', 'refresh',
                                      () => this.currentDirectory.justRefresh()); 
        const tool_back = new Tool('Back', 'backward',
                                   () => this.currentDirectory.cd(dirname(this.currentDirectory.now)),
                                   () => this.currentDirectory.now && dirname(this.currentDirectory.now).length > 0);

        this.toolbar.register(ToolType.Navigation, tool_home, this.life);
        this.toolbar.register(ToolType.Navigation, tool_refresh, this.life);
        this.toolbar.register(ToolType.Navigation, tool_back, this.life);

        const tool_copy = new Tool('Copy', 'copy', () => {
            this.clipboard.copy(ClipboardContentType.files, this.selectedFiles());
            this.select = [];
        }, () => this.has_select());
        const tool_cut = new Tool('Cut', 'cut', () => {
            this.clipboard.cut(ClipboardContentType.files, this.selectedFiles());
            this.cuts = [];
            this.select = [];
        }, () => this.has_select());
        const tool_paste = new Tool('Paste', 'paste', () => {
            const pastecwd = this.currentDirectory.now;
            this.clipboard.paste((iscut, files: FileStat[]) => {
                if(iscut) {
                    this.fileoperation.move(files, pastecwd);
                } else {
                    this.fileoperation.copy(files, pastecwd);
                }
            });
        }, () => this.clipboard.contenttype == ClipboardContentType.files);
        const tool_clear = new Tool('Clear', 'ban', () => {
            this.select = [];
        }, () => this.selectedFiles().length > 0);
        const tool_reverseSelection = new Tool('Revert', 'yin-yang', () => {
            for(let i=0;i<this.fileslice.length;i++) {
                this.select[i] = !this.select[i];
            }
        }, () => this.selectedFiles().length > 0);

        this.toolbar.register(ToolType.Clipboard, tool_copy, this.life);
        this.toolbar.register(ToolType.Clipboard, tool_cut, this.life);
        this.toolbar.register(ToolType.Clipboard, tool_paste, this.life);
        this.toolbar.register(ToolType.Clipboard, tool_clear, this.life);
        this.toolbar.register(ToolType.Clipboard, tool_reverseSelection, this.life);

        const tool_delete = new Tool('Delete', 'trash', () => {
            this.fileoperation.delete(this.selectedFiles());
        }, () => this.selectedFiles().length > 0);
        const tool_newfile = new Tool('File', 'circle-plus', () => {
            this.fileoperation.new_file(this.currentDirectory.now);
        });
        const tool_newfolder = new Tool('Folder', 'folder-plus', () => {
            this.fileoperation.new_folder(this.currentDirectory.now);
        });
        const tool_filter = new Tool('Filter', 'search', async () => {
            const ans = await this.messagebox.create({
                title: 'Search in Current Directory',
                message: '',
                inputs: [
                    {label: 'filter regex', name: 'filter', type: 'text', initValue: ''}
                ],
                buttons: [
                    {name: 'Confirm'},
                    {name: 'Cancel'}
                ]
            }).wait();

            const filter: string = ans.inputs['filter'] || '';
            if(ans.buttonValue == 0 && filter.length > 0) {
                const re = new RegExp(filter);
                const newfiles = [];
                for(const file of this.files) {
                    if(file.filename.match(re)) {
                        newfiles.push(file);
                    }
                }
                this.set_files(newfiles);
            }
        });

        this.toolbar.register(ToolType.FileManage, tool_delete, this.life);
        this.toolbar.register(ToolType.FileManage, tool_newfile, this.life);
        this.toolbar.register(ToolType.FileManage, tool_newfolder, this.life);
        this.toolbar.register(ToolType.FileManage, tool_filter, this.life);

        const tool_revert = new Tool('Reverse', 'up-down', () => this.reverse());
        const tool_sortby = new Tool('Sortby', 'arrow-down-short-wide', async () => {
            const ans = await this.messagebox.create({
                title: 'Sortby',
                message: '',
                buttons: [
                    {name: 'Name', clickValue: SortByWhat.name},
                    {name: 'Type', clickValue: SortByWhat.ftype},
                    {name: 'Date', clickValue: SortByWhat.date},
                    {name: 'Size', clickValue: SortByWhat.size}
                ]
            }).wait();
            if(!ans.closed) {
                this.config.sort = ans.buttonValue;
                this.refresh();
            }
        });
        const tool_hide_folder = new Tool('Hide Dir', 'circle-minus', () => {
            let nfs = [];
            this.files.forEach(file => {
                if(file.filetype != FileType.dir) {
                    nfs.push(file);
                }
            });
            this.set_files(nfs);
        }, () => {
            for(const file of this.files) {
                if(file.filetype == FileType.dir) {
                    return true;
                }
            }
            return false;
        });
        this.toolbar.register(ToolType.SortStuff, tool_revert, this.life);
        this.toolbar.register(ToolType.SortStuff, tool_sortby, this.life);
        this.toolbar.register(ToolType.SortStuff, tool_hide_folder, this.life);

        const tool_namedlink = new Tool('NL', 'link', () => {
            this.router.navigate(['../namedlink'], {relativeTo: this.activatedroute});
        });
        this.toolbar.register(ToolType.LinkManage, tool_namedlink, this.life);
    } //}

    ngOnDestroy(): void {
        this.kbsubscription.unsubscribe();
        this.life.die();
    }

    private has_select() //{
    {
        for(let i=0;i<this.fileslice.length;i++) {
            if(this.select[i]) {
                return true;
            }
        }
        return false;
    } //}

    private menuItemSet = {
        paste:  false,
        upload: false,
    }
    private clear_menuItemSet() //{
    {
        for(const key in this.menuItemSet) this.menuItemSet[key] = false;
    } //}
    /**
     * callback of contextmenu event in fileview HTML Element
     */
    onFileViewContextMenu() //{
    {
        const refresh = new MenuEntry();
        refresh.clickCallback = () => this.currentDirectory.justRefresh();
        refresh.enable = () => this.currentDirectory.now != null;
        refresh.entryName = 'Refresh';
        refresh.icon = 'refresh';

        const newEntry = this.createMenuEntry_New(this.currentDirectory.now);

        const entries = [refresh, newEntry];
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

    /**
     * refresh page, clear selection state of file items
     * and re-sort items base on configuration
     */
    private refresh() //{
    {
        this.select = [];
        this.cuts = [];
        switch(this.sortby) {
            case SortByWhat.name:  this.sortByName(); break;
            case SortByWhat.date:  this.sortByDate(); break;
            case SortByWhat.ftype: this.sortByType(); break;
            case SortByWhat.size:  this.sortBySize(); break;
        }
        if(this.sortReverse) {
            const o = this.files;
            const nf = [];
            for(let f of o) {
                nf.unshift(f);
            }
            this.files = nf;
        }
    } //}

    private prevSelect: number;
    /**
     * callback of selection of file item
     * @param {number} n index of file item in #files
     */
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

    @ViewChild('fileview', {static: true})
    private viewelem: ElementRef;
    private toggle_wait() {
        const elem = this.viewelem.nativeElement as HTMLElement;
        elem.classList.toggle('waiting');
    }

    /**
     * called by subscription of current directory service
     * @param {string} dir latest direcotry request
     */
    on_chdir: string = null;
    public async chdir(dir: string) //{
    {
        if(this.on_chdir == dir) return;
        const old_chdir = this.on_chdir;
        this.on_chdir = dir;
        if(old_chdir != null)
            return;

        this.toggle_wait();
        try {
            this.set_files(await this.fileManager.getdir(dir));
        } catch(e) {
            this.toaster.danger(`Failed to get directory: ${dir}, ${e}`);
        } finally {
            this.toggle_wait();
        }
        const _dir = this.on_chdir;
        this.on_chdir = null;
        if (dir != _dir && _dir) {
            await this.chdir(_dir);
        }
    } //}

    /**
     * callback of double click in file item
     * @param {number} n index of file item in #files
     */
    async onDoubleClick(n: number) //{
    {
        const stat = this.fileslice[n];
        if(stat.filetype == FileType.dir) {
            this.currentDirectory.cd(stat.filename);
        } else if (stat.filetype == FileType.reg) {
            if(!await this.fileviewer.view(this.fileslice, n)) {
                await this.downloadService.download([[stat.filename, stat.basename]]);
            }
        }
    } //}

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
        const now = this.currentDirectory.now;

        const uploadFileEntry = new MenuEntry('Upload File', 'attach_file');
        const refresh = this.currentDirectory.now == destination;
        uploadFileEntry.clickCallback = () => {
            this.fileoperation.filechooser_upload_file_to(destination)
                .finally(() => refresh ? this.currentDirectory.cd(now) : null);
        }
        const uploadFilesEntry = new MenuEntry('Upload Files', 'list');
        uploadFilesEntry.clickCallback = () => {
            this.fileoperation.filechooser_upload_files_to(destination)
                .finally(() => refresh ? this.currentDirectory.cd(now) : null);
        }
        const uploadDirEntry = new MenuEntry('Upload Directory', 'folder');
        uploadDirEntry.clickCallback = () => {
            this.fileoperation.filechooser_upload_directory_to(destination)
                .finally(() => refresh ? this.currentDirectory.cd(now) : null);
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

        const newAliyunOSS = new MenuEntry('New Aliyun OSS', 'inventory_2');
        newAliyunOSS.clickCallback = async () => {
            const cwd = this.currentDirectory.now;
            const input = await this.messagebox.create({
                title: 'add aliyun oss bucket',
                message: '',
                inputs: [
                    {name: 'directory', initValue: '', label: 'Directory', type: 'text'},
                    {name: 'region', initValue: '', label: 'Region', type: 'text'},
                    {name: 'accessKeyId', initValue: '', label: 'AccessKeyId', type: 'text'},
                    {name: 'accessKeySecret', initValue: '', label: 'AccessKeySecret', type: 'password'},
                    {name: 'bucket', initValue: '', label: 'Bucket', type: 'text'},
                    {name: 'secure', initValue: true, label: 'Secure', type: 'checkbox'},
                ],
                buttons: [{name: 'confirm'}, {name: 'cancel'}],
            }).wait();

            if (!input.closed && input.buttonValue == 0) {
                const dir = path.pathjoin(cwd, input.inputs['directory']);
                await this.storeService.addStore('alioss', dir, {
                    region: input.inputs['region'],
                    accessKeyId: input.inputs['accessKeyId'],
                    accessKeySecret: input.inputs['accessKeySecret'],
                    bucket: input.inputs['bucket'],
                    secure: !!input.inputs['secure'],
                });
                this.currentDirectory.justRefresh();
            }
        }
        const newEntry = new MenuEntry('New', 'add');
        newEntry.subMenus = [newFileEntry, newFolderEntry, newAliyunOSS];
        return newEntry;
    } //}
    private createMenuEntry_Share(filename: string) //{
    {
        const namedlinkEntry = new MenuEntry('Named Link', 'add_circle');
        namedlinkEntry.clickCallback = async () => {
            const ans = await this.messagebox.create({
                title: 'Share File with Named Link',
                message: path.basename(filename),
                inputs: [
                    {label: 'Named Link', name: 'link', type: 'text', initValue: ''},
                    {label: 'Valid Period (default: Permanent)', name: 'period', type: 'text', initValue: ''}
                ],
                buttons: [
                    {name: 'Confirm'},
                    {name: 'Cancel'}
                ]
            }).wait();

            if(ans.buttonValue == 0) {
                const period = duration2ms(ans.inputs['period']) 
                const name = ans.inputs['link'];
                if (!name) {
                    this.toaster.warning("invalid link name", "named link");
                    return;
                }

                try {
                    await this.namedLinkService.createNamedLink(name, filename, period);
                    this.toaster.info(`create named link success, from ${name} to ${filename}`, "named link");
                } catch (e) {
                    this.toaster.danger(e || "create named link failed", "named link");
                }
            }
        };

        const downloadLink = new MenuEntry('Download Link', 'cloud_download');
        downloadLink.clickCallback = async () => {
            const op: string[] = [];
            for(const i in this.select) {
                if(this.select[i]) {
                    const stat = this.fileslice[i];
                    if (stat.filetype == FileType.reg)
                        op.push(stat.filename);
                }
            }

            const urls = await this.downloadService.getDownloadUrls(op)
            if (!urls || urls.length == 0) {
                this.toaster.danger("generate download url failed", "Sharing");
                return;
            }

            const ans = await this.clipboard.copy(ClipboardContentType.text, urls.join('\n'));
            if (ans) {
                this.toaster.info('Copied the link to clipboard', "Sharing");
            } else {
                this.toaster.danger("can paste link into clipboard", "Sharing");
            }
        };

        const shareEntry = new MenuEntry('Share with', 'link');
        shareEntry.subMenus = [namedlinkEntry, downloadLink];
        return shareEntry;
    } //}
    private createMenuEntry_Open(filename: string) //{
    {
        const idx = this.fileslice.findIndex(v => filename == v.filename);
        const sl = [ this.fileslice[idx] ];

        const openAsWithEntry = new MenuEntry('As', 'open_with');
        openAsWithEntry.clickCallback = async () => {
            const ans = await this.messagebox.create({
                title: 'open file as',
                message: path.basename(filename),
                inputs: [
                    {label: 'Filetype', name: 'ft', type: 'text', initValue: 'txt'},
                ],
                buttons: [
                    {name: 'Confirm'},
                    {name: 'Cancel'}
                ]
            }).wait();

            if(ans.buttonValue == 0) {
                const ft = ans.inputs['ft'];
                if (!this.fileviewer.hasHandler(ft)) {
                    this.toaster.warning("unknown type", "OpenAs");
                    return;
                }

                await this.fileviewer.view(sl, 0, ft);
            }
        };

        const openAsTxtWithEntry = new MenuEntry('As Txt', 'text_fields');
        openAsTxtWithEntry.clickCallback = async () => {
            await this.fileviewer.view(sl, 0, "txt")
        };

        const openEntry = new MenuEntry('Open', 'open_in_new');
        openEntry.subMenus = [openAsTxtWithEntry, openAsWithEntry];
        return openEntry;
    } //}

    private selectedFiles(): FileStat[] //{
    {
        let selectFiles = [];
        for(let i=0;i<this.fileslice.length;i++) {
            if(this.select[i]) selectFiles.push(this.fileslice[i]);
        }
        return selectFiles;
    } //}

    /**
     * callback of contextmenu in file item
     * @param {number} n index of file item in #files
     */
    onMenu(n: number) //{
    {
        if(!this.select[n]) {
            this.onSelect(n);
        }
        const entries: MenuEntry[] = [];
        const selectFiles = this.selectedFiles();
        console.assert(selectFiles.length > 0);
        const selectCopy = JSON.parse(JSON.stringify(this.select));

        let menuType = MenuEntryType.FileMenuClick;
        if (this.fileslice[n].filetype == FileType.dir) {
            menuType = MenuEntryType.DirMenuClick;
            const chdir = new MenuEntry();
            chdir.clickCallback = () => this.onDoubleClick(n);
            chdir.entryName = "Open Folder";
            chdir.icon = "folder_open";
            entries.push(chdir);
            entries.push(this.createMenuEntry_Upload(this.fileslice[n].filename));
            this.menuItemSet.upload = true;
        } else {
            const download = new MenuEntry();
            download.clickCallback = async () => {
                const op: [string,string][] = [];
                for(const i in this.select) {
                    if(this.select[i]) {
                        const stat = this.fileslice[i];
                        if (stat.filetype == FileType.reg)
                            op.push([stat.filename, stat.basename]);
                    }
                }

                if (!await this.downloadService.download(op)) {
                    this.toaster.danger("download failed", "Download");
                }
            }
            download.entryName = "Download File";
            download.icon = "cloud_download";
            entries.push(download);

            const share = this.createMenuEntry_Share(this.fileslice[n].filename);
            entries.push(share);
            const open  = this.createMenuEntry_Open(this.fileslice[n].filename);
            entries.push(open);
        }

        const renameEntry = new MenuEntry('Rename', 'create');
        renameEntry.clickCallback = async () => {
            if (selectFiles.length != 1) return;
            const filestat = selectFiles[0];

            const ans = await this.messagebox.create({
                title: `rename '${filestat.basename}' to`, 
                message: '', 
                inputs: [
                    {label: `new filename`, name: 'name', type: 'text'}
                ], 
                buttons: [
                    {name: 'confirm'},
                    {name: 'cancel'}
                ]}).wait();;
            if(ans.closed || ans.buttonValue == 1 || !ans.inputs['name'] || ans.inputs['name'].length == 0) {
                return;
            } else {
                await this.fileoperation.rename(filestat, ans.inputs['name']);
                this.currentDirectory.justRefresh();
            }
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

        for(const entry of [newEntry, renameEntry, deleteEntry, copyEntry, cutEntry, pasteEntry]) {
            entries.push(entry);
        }

        this.menuManager.registerMenuEntry(menuType, entries);
    } //}

    private sortByName() //{
    {
        this.files.sort(SortByName);
    } //}
    private sortByDate() //{
    {
        this.files.sort(SortByDate);
    } //}
    private sortByType() //{
    {
        this.files.sort(SortByType);
    } //}
    private sortBySize() //{
    {
        this.files.sort(SortBySize);
    } //}

    reverse() //{
    {
        this.config.reverse = !this.config.reverse;
        this.refresh();
    } //}

    get FileOrder(): boolean {
        return !this.config.reverse;
    }

    get FileCount(): number {
        return this.files.length;
    }
}

