import * as constants from './constants';
import * as global from './global_vars';
import * as types from './types';
import * as util from './util';
import * as event from 'events';
import * as register from './register';
import * as file_manager from './file_manager';
import * as controller from './controller';

import { debug } from './util';

enum SortByWhat {
    name = "name",
    type = "type",
    size = "size",
    time = "time"
}

enum SortOrder {
    ascending = "ascending",
    descending = "descending"
}

/**
 * @class DetailItem represent a file
 * @event change @fires when filename changed
 *     @param {string} new_pathname
 *     @param {string} old_pathname
 */
export class DetailItem extends event.EventEmitter//{
{
    protected stat: types.FileStat;
    private basename: string;
    private location: string;
    private extension: string;
    private _element: HTMLDivElement;

    constructor(stat: types.FileStat) //{
    {
        super();
        this.stat = stat;
        this.basename = util.basename(this.stat.filename);
        this.location = util.dirname (this.stat.filename);
        this.extension = util.extension(this.stat.filename);
        this._element = null;
        window["ab"] = util.basename;
        window["bc"] = util.dirname;
        window["cd"] = util.extension;
    } //}

    private static int2string(n: number) //{
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
    private static size2String(size: number) //{
    {
        if (size < 1024) return `${DetailItem.int2string(size)} Byte`;
        if (size < 1024 * 1024 * 1024) return `${DetailItem.int2string(size / 1024)} KB`;
        if (size < 1024 * 1024 * 1024 * 1024) return `${DetailItem.int2string(size / 1024)} MB`;
        if (size < 1024 * 1024 * 1024 * 1024 * 1024) return `${DetailItem.int2string(size / 1024)} GB`;
    } //}
    private static extension2type(ext: string) //{
    {
        if (ext == null) return "File";
        if (ext == "" ) return "File";
        return ext.toUpperCase() + " File";
    } //}
    private static time2string(time: Date) //{
    {
        return time.getMonth().toString()    + "/" + time.getDay().toString() + "/"
             + time.getFullYear().toString() + " " + time.getHours() + ":" + time.getMinutes();
    } //}
    private static mode2string(mode: number) //{
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

    private static sizeT = "<div class='detail-size'></div>";
    private static typeT = "<div class='detail-type'></div>";
    private static DataT = "<div class='detail-data'></div>";
    private static ModeT = "<div class='detail-mode'></div>";
    private static sizeTT = util.createNodeFromHtmlString(DetailItem.sizeT);
    private static typeTT = util.createNodeFromHtmlString(DetailItem.typeT);
    private static DataTT = util.createNodeFromHtmlString(DetailItem.DataT);
    private static ModeTT = util.createNodeFromHtmlString(DetailItem.ModeT);

    private properties(): HTMLElement[] //{
    {
        let ret = [];

        let sizeE = DetailItem.sizeTT.cloneNode(true) as HTMLElement;
        sizeE.innerText = DetailItem.size2String(this.stat.size);
        ret.push(sizeE);

        let typeE = DetailItem.typeTT.cloneNode(true) as HTMLElement;
        if (this.stat.type == types.FileType.dir)
            typeE.innerText = "File folder"
        else
            typeE.innerText = DetailItem.extension2type(this.extension);
        ret.push(typeE);

        let dateE = DetailItem.DataTT.cloneNode(true) as HTMLElement;
        dateE.innerText = DetailItem.time2string(new Date(this.stat.ctimeMs));
        ret.push(dateE);

        let modeE = DetailItem.ModeTT.cloneNode(true) as HTMLElement;
        modeE.innerText = DetailItem.mode2string(this.stat.mode);
        ret.push(modeE);

        return ret;
    } //}

    private on_dragstart(ev: DragEvent) //{
    {
        ev.stopPropagation();
        ev.dataTransfer.setData("path", this.stat.filename);
        ev.dataTransfer.setDragImage(this._element, 0, 0);
    } //}

    toHtmlElement(): HTMLElement //{
    {
        if(this._element) return this._element;
        let tag = this.Stat.type == types.FileType.reg ? "a" : "div";
        let result: HTMLDivElement = util.createNodeFromHtmlString(
            `<${tag} class='${constants.CSSClass.file_item}' draggable="true">
            </${tag}>`) as HTMLDivElement;
        let fname = new controller.FilenameBar(this.basename, constants.CSSClass.hide_elem);
        fname.on("change", (n, o) => {
            this.emit("change", `${util.pathJoin(this.location, n)}`, `${util.pathJoin(this.location, o)}`);
        });
        result.prepend(fname.Elem);

        let properties_list = this.properties();
        properties_list.map(x => result.appendChild(x));

        let svg_template: HTMLTemplateElement;
        if (this.stat.type == types.FileType.dir) {
            svg_template = constants.svg.folder;
        } else {
            let mm: HTMLTemplateElement = document.getElementById(constants.svg.svg_filetype_prefiex + this.extension) as HTMLTemplateElement;
            if (mm == null)
                svg_template = constants.svg.blank;
            else
                svg_template = mm;
        }
        let xx = util.createNodeFromHtmlString(`<div class='${constants.CSSClass.file_item_icon}'></div>`);
        xx.prepend(svg_template.content.cloneNode(true));
        result.prepend(xx);
        this._element = result;
        result[constants.KDetailItem] = this;
        result[constants.KFilenameControl] = fname;
        result.ondragstart = this.on_dragstart.bind(this);
        return result;
    } //}

    get Dirname() {return this.location;}
    get Extension() {return this.extension;}
    get Basename() {return this.basename;}
    get Stat() {return Object.assign({}, this.stat);} // shallow copy
} //}

/** sortByName */
function SortByName(d1: DetailItem, d2: DetailItem): number //{
{
    if(d1.Stat.type == "dir" && d2.Stat.type != "dir") return -1;
    if(d2.Stat.type == "dir" && d1.Stat.type != "dir") return 1;
    if(d1.Basename.localeCompare(d2.Basename) < 0) return -1; // d1 is lexicographically greater than d2
    return 1;
} //}
/** sortByTime */
function SortByTime(d1: DetailItem, d2: DetailItem): number //{
{
    if(d1.Stat.type == "dir" && d2.Stat.type != "dir") return -1;
    if(d2.Stat.type == "dir" && d1.Stat.type != "dir") return 1;
    if(d1.Stat.ctimeMs > d2.Stat.ctimeMs) return -1; // d1 is newer than d2
    if(d1.Stat.ctimeMs == d2.Stat.ctimeMs) return SortByName(d1, d2);
    return 1;
} //}
/** sortBySize */
function SortBySize(d1: DetailItem, d2: DetailItem): number //{
{
    if(d1.Stat.type == "dir" && d2.Stat.type != "dir") return -1;
    if(d2.Stat.type == "dir" && d1.Stat.type != "dir") return 1;
    if(d1.Stat.size > d2.Stat.size) return -1; // size of d1 is greater than d2
    if(d1.Stat.size == d2.Stat.size) return SortByName(d1, d2);
    return 1;
} //}
/** sortByType */
function SortByType(d1: DetailItem, d2: DetailItem): number //{
{
    if(d1.Stat.type == "dir" && d2.Stat.type != "dir") return -1;
    if(d2.Stat.type == "dir" && d1.Stat.type != "dir") return 1;
    if((d1.Extension || "").localeCompare(d2.Extension || "") < 0) return -1;
    if((d1.Extension || "").localeCompare(d2.Extension || "") > 0) return 1;
    return SortByName(d1, d2);
} //}


export type FileSortFunc = (d1: DetailItem, d2: DetailItem) => number;

/**
 * @class Detail represent a file details panel
 * @event chdir @fires when chdir() return with success
 *     @param {string} new directory this object resides in
 * @event change @see DetailItem#change
 */
export class Detail extends event.EventEmitter//{
{
    /**
     * @property {string} currentLoc location of current panel, which should be a valid path
     * @property {DetailItem[]} children files in current location
     * @property {HTMLDivElement} attachElem render with this element
     * @property {string} classname class of #attachElem
     */
    private currentLoc: string;
    private children: DetailItem[];
    private attachElem: HTMLDivElement;
    private _classname: string;
    private _order: boolean;
    private sortFunc: FileSortFunc;
    private reg_func: register.RegisterFunction;
    private fileManager: file_manager.FileManager;
    private name2DetailItem: Map<string, DetailItem>;

    /**
     * @param {HTMLDivElement} elem which object be attached
     * @param {Function} reg call for every HTMLElement object
     * @param {FileManager} filemanager used for providing RPC, such as [readdir, read, write, chmod ...].
     *                                  if this parameter not supplied, any attemp to call file system function
     *                                  call will raise error.
     */
    constructor(elem: HTMLDivElement, reg: register.RegisterFunction = register.dummyRegister, filemanager: file_manager.FileManager = null) //{
    {
        super();
        this.attachElem = elem;
        this.currentLoc = null;
        this.children = [];
        this._classname = null;
        this.sortFunc = SortByName;
        this.reg_func = reg;
        this.fileManager = filemanager;
        this.name2DetailItem = null;
        this._order = true;
    } //}

    private UpdateDetails(children: DetailItem[]): void //{
    {
        this.children = children;
        this.reconstruct();
    } //}

    private reconstruct(): void //{
    {
        while(this.attachElem.firstChild)
            this.attachElem.removeChild(this.attachElem.firstChild);
        this.children.sort((d1, d2) => {
            if(this._order) return this.sortFunc(d1, d2);
            return this.sortFunc(d2, d1);
        });
        this.name2DetailItem = new Map<string, DetailItem>();
        this.children.map( x => {
            x.on("change", (n, o) => this.emit("change", n, o));
            this.name2DetailItem.set(x.Basename, x);
            let ee = x.toHtmlElement();
            this.reg_func(ee, this, x);
            this.attachElem.append(ee);
        });
    } //}

    get ClassName() {return this._classname;}
    set ClassName(cn: string) //{
    {
        if (this._classname != null)
            this.attachElem.classList.remove(this._classname);
        this._classname = cn;
        if (this._classname != null)
            this.attachElem.classList.add(this._classname);
    } //}

    get AttachElement() {return this.attachElem;}

    Order(ord: SortOrder): void //{
    {
        if (ord == SortOrder.ascending) {
            if(this._order) return;
            this._order = true;
        } else if (ord == SortOrder.descending) {
            if(this._order == false) return;
            this._order = false;
        } else {
            debug("incorrect sort order");
            return;
        }
        this.reconstruct();
    } //}

    private sortBy(f: FileSortFunc): void //{
    {
        this.sortFunc = f;
        this.reconstruct();
    } //}

    SortBy(what: SortByWhat): void //{
    {
        switch (what) {
            case SortByWhat.name: this.sortBy(SortByName); break;
            case SortByWhat.size: this.sortBy(SortBySize); break;
            case SortByWhat.time: this.sortBy(SortByTime); break;
            case SortByWhat.type: this.sortBy(SortByType); break;
            default:
                debug("incorrect sort method");
                return;
        }
    } //}

    QueryItem(basename: string): DetailItem {return this.name2DetailItem.get(basename);}

    get cwd() {return this.currentLoc;}

    async chdir(path_: string): Promise<void> {
        if (this.fileManager == null) throw new Error("file manager doesn't initialize");
        let pps = await this.fileManager.getdirP(path_);
        let cwd_stat = pps.filter(x => x.filename == path_)[0];
        pps = pps.filter(x => x.filename != path_);
        let mm = pps.map( x => new DetailItem(x));
        this.UpdateDetails(mm);
        this.currentLoc = path_;
        let cwd_di = new DetailItem(cwd_stat);
        this.attachElem[constants.KDetailItem] = cwd_di;
        this.emit("chdir", this.currentLoc);
        return;
    }

    async backDir(): Promise<void> {
        if(this.currentLoc == "/") return;
        return this.chdir(util.dirname(this.currentLoc));
    }
}; //}

export function SetupDetail() {
    global.Detail.Details = new Detail(constants.detail_page as HTMLDivElement, register.form_multi_functions([
        register.dummyRegister,
        register.dblclick_chdir,
        register.dblclick_download,
        register.upload
    ]), global.File.manager);
    global.File.manager.once("ready", () => {
        global.Detail.Details.chdir("/").then(() => {
            debug("chdir /");
        }, (err) => {
            debug(err);
        });
    });
    window["dl"] = global.Detail.Details;
}
