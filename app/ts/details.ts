import * as constants from './constants';
import * as types from './types';
import * as util from './util';
import * as event from 'events';
import * as register from './register';

/**
 * @class DetailItem represent a file
 */
export class DetailItem //{
{
    protected stat: types.FileStat;
    private basename: string;
    private location: string;
    private extension: string;
    private _element: HTMLDivElement;

    constructor(stat: types.FileStat) //{
    {
        this.stat = stat;
        this.basename = util.basename(this.stat.filename);
        this.location = util.dirname (this.stat.filename);
        this.extension = util.extension(this.stat.filename);
        this._element = null;
    } //}

    toHtmlElement(): HTMLElement //{
    {
        if(this._element) return this._element;
        let result: HTMLDivElement = util.createNodeFromHtmlString(
            `<div class='file-item'><div class='file-item-name'>${this.basename}</div></div>`) as HTMLDivElement;
        let svg_template: HTMLTemplateElement;
        if (this.stat.type == types.FileType.dir) {
            svg_template = constants.svg.folder;
        } else {
            let mm: HTMLTemplateElement = document.getElementById("svg-filetyp-" + this.extension) as HTMLTemplateElement;
            if (mm == null) {
                if (["mp4", "mkv"].indexOf(this.extension) >= 0)
                    svg_template = constants.svg.filetype.video;
                else if (["ttf"].indexOf(this.extension) >= 0)
                    svg_template = constants.svg.filetype.font;
                else if (["gz, tar, xz"].indexOf(this.extension) >= 0)
                    svg_template = constants.svg.filetype.zip;
                else
                    svg_template = constants.svg.filetype.html;
            } else
                svg_template = mm;
        }
        let xx = util.createNodeFromHtmlString("<div class='file-icon'></div>");
        xx.prepend(svg_template.content.cloneNode(true));
        result.prepend(xx);
        this._element = result;
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
 * @event reconstruct fires when reconstruct function is called and finished
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

    /**
     * @param {HTMLDivElement} elem which object be attached
     * @param {Function} reg call for every HTMLElement object
     */
    constructor(elem: HTMLDivElement, reg: register.RegisterFunction = register.dummyRegister) //{
    {
        super();
        this.attachElem = elem;
        this.currentLoc = null;
        this.children = [];
        this._classname = null;
        this.sortFunc = SortByName;
        this.reg_func = reg;
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

    UpdateDetails(children: DetailItem[]): void //{
    {
        this.children = children;
        this.reconstruct();
    } //}

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

    reconstruct(): void //{
    {
        while(this.attachElem.firstChild)
            this.attachElem.removeChild(this.attachElem.firstChild);
        this.children.sort((d1, d2) => {
            if(this._order) return this.sortFunc(d1, d2);
            return this.sortFunc(d2, d1);
        });
        this.children.map( x => {
            let ee = x.toHtmlElement();
            this.reg_func(ee);
            this.attachElem.append(ee);
        });
        this.emit("reconstruct");
    } //}

    get AttachElement() {return this.attachElem;}

    // TODO
    async chdir(path: string): Promise<boolean> {
        return false;
    }
}; //}

