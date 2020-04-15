import * as constants from './constants';
import * as global from './global_vars';
import * as types from './types';
import * as util from './util';
import * as event from 'events';
import * as register from './register';
import * as file_manager from './file_manager';
import * as controller from './controller';

import { debug } from './util';

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

    toHtmlElement(): HTMLElement //{
    {
        if(this._element) return this._element;
        let tag = this.Stat.type == types.FileType.reg ? "a" : "div";
        let result: HTMLDivElement = util.createNodeFromHtmlString(
            `<${tag} class='${constants.CSSClass.file_item}'>
            </${tag}>`) as HTMLDivElement;
        let fname = new controller.FilenameBar(this.basename, constants.CSSClass.hide_elem);
        fname.on("change", (n, o) => {
            this.emit("change", `${util.pathJoin(this.location, n)}`, `${util.pathJoin(this.location, o)}`);
        });
        result.prepend(fname.Elem);
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
        return result;
    } //}

    get Dirname() {return this.location;}
    get Extension() {return this.extension;}
    get Basename() {return this.basename;}
    get Stat() {return Object.assign({}, this.stat);} // shallow copy
} //}

/** sortByName */
export function SortByName(d1: DetailItem, d2: DetailItem): number //{
{
    if(d1.Stat.type == "dir" && d2.Stat.type != "dir") return 1;
    if(d2.Stat.type == "dir" && d1.Stat.type != "dir") return -1;
    if(d1.Basename.localeCompare(d2.Basename) >= 0) return -1;
    return 1;
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

    ReverseOrder(): void //{
    {
        this._order = !this._order;
        this.reconstruct();
    } //}

    SortBy(f: FileSortFunc): void //{
    {
        this.sortFunc = f;
        this.reconstruct();
    } //}

    QueryItem(basename: string): DetailItem {return this.name2DetailItem.get(basename);}

    get cwd() {return this.currentLoc;}

    async chdir(path_: string): Promise<void> {
        if (this.fileManager == null) throw new Error("file manager doesn't initialize");
        let pps = await this.fileManager.getdirP(path_);
        pps = pps.filter(x => x.filename != path_);
        let mm = pps.map( x => new DetailItem(x));
        this.UpdateDetails(mm);
        this.currentLoc = path_;
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
