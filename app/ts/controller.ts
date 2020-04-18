import * as events from 'events';
import * as util from './util';
import * as constants from './constants';
import { debug } from './util';

/**
 * @class FilenameBar used for managing filename rename
 * @event change @fires when filename changed
 *     @param {string} new_filename
 *     @param {string} old_filename
 */
export class FilenameBar extends events.EventEmitter //{
{
    /**
     * @property {HTMLDivElement} anchorPoint operate this element
     * @property {string} basename display with this content
     * @property {boolean} inInput whether in input
     */
    private anchorPoint: HTMLDivElement;
    private basename: string;
    private inInput: boolean;
    private h_class: string;
    private filename_e: HTMLDivElement;
    private input_e: HTMLInputElement;

    static ClassA  = 'filename-bar';
    static ClassAA = 'filename';
    static ClassAB = 'filename-input';
    static validFilename = /^[\w\-. ]+$/;
    static HTMLTemplate = `
    <div class='${FilenameBar.ClassA}'>
        <div class='${FilenameBar.ClassAA}'></div>
        <input type='text' class='${FilenameBar.ClassAB}'>
    </div>`;
    private static TTElement: HTMLDivElement = util.createNodeFromHtmlString(FilenameBar.HTMLTemplate) as HTMLDivElement;

    /**
     * @param {string} basename initial filename
     * @param {string} hideClass used for controlling rendering state of element
     */
    constructor(basename: string, hideClass: string) //{
    {
        super();
        this.basename = basename || "";
        this.h_class = hideClass;
        this.anchorPoint = FilenameBar.TTElement.cloneNode(true) as HTMLDivElement;
        this.filename_e  = this.anchorPoint.querySelector(`.${FilenameBar.ClassAA}`);
        this.filename_e.innerText = this.basename;
        this.input_e = this.anchorPoint.querySelector(`.${FilenameBar.ClassAB}`);
        this.input_e.classList.add(this.h_class); // hide input element
        this.input_e.addEventListener("keydown", this.input_onkeydown.bind(this));
        this.input_e.addEventListener("blur", this.input_onblur.bind(this));
        this.input_e.addEventListener("input", this.input_oninput.bind(this));
    } //}

    /** event handlers */
    private change_name(name: string) //{
    {
        let old_name = this.basename;
        this.basename = name;
        this.filename_e.innerText = this.basename;
        this.input_e.classList.add(this.h_class);
        this.filename_e.classList.remove(this.h_class);
        this.input_e.blur();
        if (old_name != this.basename)
            this.emit("change", this.basename, old_name);
    } //}
    private check_on_input() //{
    {
        if(!FilenameBar.validFilename.test(this.input_e.value)) {
            if (this.input_e.value != "") window.alert("invalid filename");
            this.change_name(this.basename);
        } else
            this.change_name(this.input_e.value);
    } //}
    private input_onkeydown(e: KeyboardEvent) {if(e.key.toLowerCase() == "enter") this.check_on_input();}
    private input_onblur   () {this.check_on_input();}
    private input_oninput  () {this.input_e.value = this.input_e.value.replace(/(\r|\n)/, "");}

    get Elem (): HTMLDivElement {return this.anchorPoint;}

    /** change state from display text to input */
    editName() //{
    {
        if(this.inInput) return;
        this.inInput = true;

        this.input_e.classList.remove(this.h_class);
        this.input_e.value = this.basename;
        this.input_e.select();
        this.filename_e.classList.add(this.h_class);
    } //}
} //}


/**
 * @class AddressSlice
 * @event click @fires when this elment be click
 *     @param {string} preset path name
 */
class AddressSlice extends events.EventEmitter //{
{
    static ClassA = 'address-slice';
    static ClassAA = 'address-slice-arrow';
    static ClassAB = 'address-slice-name';
    static HTMLTemplate = `
        <span class='${AddressSlice.ClassA}'>
            <span class='${AddressSlice.ClassAA}'></span>
            <span class='${AddressSlice.ClassAB}'></span>
        </span>`;
    private static XXElement: HTMLSpanElement = util.createNodeFromHtmlString(AddressSlice.HTMLTemplate) as HTMLSpanElement;

    private holdElement: HTMLSpanElement;
    private holdElementName: HTMLSpanElement;
    private name: string;
    private emitPara: string;

    constructor(name: string, emitPara?: string, hide_arrow?: boolean) {
        super();
        this.name = name;
        this.emitPara = emitPara || this.name;
        this.holdElement = AddressSlice.XXElement.cloneNode(true) as HTMLDivElement;
        this.holdElementName = this.holdElement.querySelector(`.${AddressSlice.ClassAB}`);
        this.holdElementName.innerText = this.name;
        this.holdElementName.addEventListener("click", this.name_onclick.bind(this));
        if(hide_arrow) this.holdElement.removeChild(this.holdElement.firstElementChild);
        else {
            let ff = this.holdElement.firstElementChild;
            ff.appendChild(constants.svg.misc.rarrow.content.cloneNode(true));
        }
    }

    private name_onclick(e: MouseEvent) {e.stopPropagation(); this.emit("click", this.emitPara);}

    get Elem(): HTMLSpanElement {return this.holdElement;}
} //}


/**
 * @class AddressBarPA linear collection of @see AddressSlice
 * @event click @see AddressSlice#click
 */
class AddressBarPA extends events.EventEmitter //{
{
    static ClassA = 'address-bar-pa';
    static HTMLTemplate = `<span class='${AddressBarPA.ClassA}'></span>`;
    private static XXElement = util.createNodeFromHtmlString(AddressBarPA.HTMLTemplate);

    private holdElement: HTMLSpanElement;
    private full_path: string;

    constructor() {
        super();
        this.holdElement = AddressBarPA.XXElement.cloneNode(true) as HTMLSpanElement;
        this.full_path = null;
    }

    setAddr(path: string) //{
    {
        while(this.holdElement.firstChild) this.holdElement.removeChild(this.holdElement.firstChild);
        this.full_path = path.trim();
        let path_split = this.full_path.split("/").filter(x => x != '');;
        let startWithSlash = this.full_path.startsWith('/');
        if(startWithSlash) path_split.unshift('/');
        for(let i=0; i<path_split.length; i++) {
            let hide = (i == 0 && startWithSlash);
            let emitPath = path_split.slice(0, i + 1).join('/');
            if (startWithSlash) emitPath = emitPath.substring(1, emitPath.length);
            let elem = new AddressSlice(path_split[i], emitPath, hide);
            this.holdElement.appendChild(elem.Elem);
            elem.on("click", this.child_onclick.bind(this));
        }
    } //}

    private child_onclick(path_: string) {this.emit("click", path_);}

    get Elem(): HTMLSpanElement {return this.holdElement;}
} //}


/**
 * @class AddressBar
 * @event click @see AddressSlice#click
 * @event change @fires when submmit input
 *     @param {string} new_path
 *     @param {string} old_path
 */
export class AddressBar extends events.EventEmitter //{
{
    private anchorPoint: HTMLSpanElement;
    private full_path: string;
    private isInInputAddr: boolean;
    private h_class: string;
    private address_bar: AddressBarPA;
    private input_bar: HTMLInputElement;

    static ClassA  = 'address-bar';
    static ClassAB  = 'address-bar-input';
    static validPathname = /^\/([\w\-. ]+\/)*([\w\-. ]+)?$/;
    static HTMLTemplate = `
    <span class='${AddressBar.ClassA}'>
        <input type='text' class='${AddressBar.ClassAB}'>
    </span>`;
    private static TTElement: HTMLDivElement = util.createNodeFromHtmlString(AddressBar.HTMLTemplate) as HTMLDivElement;

    constructor(hideClass: string, id?: string) {
        super();
        this.h_class = hideClass;
        this.isInInputAddr = false;
        this.anchorPoint = AddressBar.TTElement.cloneNode(true) as HTMLSpanElement;
        this.input_bar = this.anchorPoint.firstElementChild as HTMLInputElement;
        this.address_bar = new AddressBarPA();
        this.anchorPoint.prepend(this.address_bar.Elem);

        this.address_bar.on("click", (addr) => this.emit("click", addr));

        this.input_bar.addEventListener("keydown", this.input_onkeydown.bind(this));
        this.input_bar.addEventListener("input", this.input_oninput.bind(this));
        this.input_bar.addEventListener("blur", this.input_onblur.bind(this));
        
        this.anchorPoint.addEventListener("click", this.__onclick.bind(this));
    }

    /** event handlers */
    private change_name(name: string) //{
    {
        let old_name = this.full_path;
        this.setAddr(name);
        this.address_bar.Elem.classList.remove(this.h_class);
        this.isInInputAddr = false;
        this.input_bar.value = "";
        this.input_bar.blur();
        if (old_name != this.full_path)
            this.emit("change", this.full_path, old_name);
    } //}
    private check_on_input() //{
    {
        if(!AddressBar.validPathname.test(this.input_bar.value)) {
            if(this.input_bar.value.trim() != "") window.alert("invalid pathname");
            this.change_name(this.full_path);
        } else
            this.change_name(this.input_bar.value);
    } //}
    private input_onkeydown(e: KeyboardEvent) {if(e.key.toLowerCase() == "enter") this.check_on_input();}
    private input_onblur   () {this.check_on_input();}
    private input_oninput  () {this.input_bar.value = this.input_bar.value.replace(/(\r|\n)/, "");}

    private __onclick() {
        if(this.isInInputAddr) return;
        this.isInInputAddr = true;
        this.address_bar.Elem.classList.add(this.h_class);
        this.input_bar.value = this.full_path;
        this.input_bar.select();
    }

    setAddr(path?: string) {
        this.full_path = path || this.full_path;
        this.address_bar.setAddr(path);
    }
    get Elem(): HTMLSpanElement{return this.anchorPoint;}
} //}

/**
 * @class Attachment
 */
class Attachment extends events.EventEmitter //{
{
    protected attachElem: HTMLElement;

    constructor(attach: HTMLElement) {
        super();
        this.attachElem = attach;
    }
} //}

export enum MessageType {
    Fail = 'message-fail', 
    Success = 'message-success', 
    Inform = 'message-inform'
};
/**
 * @class MessageBar
 */
export class MessageBar extends Attachment //{
{
    private hideClass: string;
    private msgCount: number;

    constructor(attach: HTMLElement, hideClass: string) //{
    {
        super(attach);
        this.hideClass = hideClass;
        this.msgCount = 0;
    } //}

    show(msg: string, mtype: MessageType, mtimeout: number = 3000) //{
    {
        while(this.attachElem.firstElementChild) 
            this.attachElem.removeChild(this.attachElem.firstElementChild);
        this.msgCount += 1;
        let i = this.msgCount;
        this.attachElem.classList.remove(this.hideClass);
        this.attachElem.classList.add(mtype);
        switch (mtype) {
            case MessageType.Fail:
                this.attachElem.classList.remove(MessageType.Inform);
                this.attachElem.classList.remove(MessageType.Success);
                break;
            case MessageType.Success:
                this.attachElem.classList.remove(MessageType.Inform);
                this.attachElem.classList.remove(MessageType.Fail);
                break;
            case MessageType.Inform:
                this.attachElem.classList.remove(MessageType.Fail);
                this.attachElem.classList.remove(MessageType.Success);
                break;
        }
        this.attachElem.innerText = msg;
        window.setTimeout(() => {
            if(this.msgCount != i) return;
            this.attachElem.classList.add(this.hideClass);
        }, mtimeout);
    } //}
} //}

/**
 * @class PopMenu
 */
export class PopMenu extends Attachment //{
{
    static ClassA = 'pop-menu-item';
    private static popMenuTemplate = `
        <div class="${PopMenu.ClassA}">
        </div>`;
    private static XElement = util.createNodeFromHtmlString(PopMenu.popMenuTemplate);

    /**
     * @property {[string, string][]} eMap store mapping from menu item name to event 
     *                                 that will arise when click the item
     * @property {string} hideClass control the display of this element
     */
    private eMap: [string, string][];
    private hideClass: string;

    constructor(elem: HTMLElement, hideClass: string) {
        super(elem);
        this.hideClass = hideClass;
    }

    private show() {this.attachElem.classList.remove(this.hideClass);}
    private hide() {this.attachElem.classList.add(this.hideClass);}
    private update() //{
    {
        while(this.attachElem.firstChild) this.attachElem.removeChild(this.attachElem.firstChild);
        for(let v of this.eMap) {
            let e = PopMenu.XElement.cloneNode(true) as HTMLElement;
            e.innerText = v[0];
            e.onclick = (ev: MouseEvent) => {
                ev.stopPropagation();
                ev.preventDefault();
                this.hide();
                this.emit(v[1], ev);
            };
            e.onkeydown = (ev: KeyboardEvent) => {
                ev.stopPropagation();
                ev.preventDefault();
                if(ev.key.toLowerCase() == "enter") {
                    this.hide();
                    this.emit(v[1], ev);
                }
            };
            this.attachElem.appendChild(e);
        }
    } //}

    SetMenu(items: [string, string][]) {
        this.eMap = items;
        this.update();
    }
} //}

/**
 * @class ElementGenerator
 */
class ElementGenerator extends events.EventEmitter //{
{
    constructor() {
        super();
    }

    toHtmlElement(): HTMLElement {
        return null;
    }
} //}

/**
 * @class MoveableElementGenerator
 */
class MoveableElementGenerator extends ElementGenerator //{
{
    protected latestElem: HTMLElement;

    constructor() {
        super();
    }

    protected register_drag_drop() {
        this.latestElem.ondragstart = this.on_dragstart.bind(this);
        this.latestElem.ondragover = this.on_dragover.bind(this);
    }

    private on_dragstart(ev: DragEvent) //{
    {
        ev.stopPropagation();
        let img = new Image();
        img.src = "/imgs/transparent-1pixel.png";
        ev.dataTransfer.setDragImage(img, 0, 0);
        this.latestElem[constants.KScreenPrevDragOver] = [ev.screenX, ev.screenY];
    } //}
    private on_dragover(ev: DragEvent) //{
    {
        let cstyle = window.getComputedStyle(this.latestElem);
        let ox = parseInt(cstyle.marginLeft);
        let oy = parseInt(cstyle.marginTop);
        let ax, ay;
        if (this.latestElem[constants.KScreenPrevDragOver] == null) {
            ax = ev.offsetX;
            ay = ev.offsetY;
        } else {
            ax = ev.screenX - this.latestElem[constants.KScreenPrevDragOver][0];
            ay = ev.screenY - this.latestElem[constants.KScreenPrevDragOver][1];
        }
        this.latestElem[constants.KScreenPrevDragOver] = [ev.screenX, ev.screenY];
        this.latestElem.style.marginLeft = `${ax + ox}px`;
        this.latestElem.style.marginTop  = `${ay + oy}px`;
    } //}
} //}

/**
 * @class ConfirmMenu
 */
export class ConfirmMenu extends MoveableElementGenerator //{
{
    static ClassA = 'confirm-menu';
    static ClassAA = 'confirm-menu-msg';
    static ClassAB = 'confirm-menu-item';
    private static template = `
    <div class="${ConfirmMenu.ClassA}" draggable="true">
        <div class="${ConfirmMenu.ClassAA}"></div>
        <div class="${ConfirmMenu.ClassAB}"></div>
    </div>
    `;
    private static XTemplate = util.createNodeFromHtmlString(ConfirmMenu.template);

    private cb: Function;
    private msg: string;
    private options: string[];
    private uclass: string;

    constructor(msg: string, options: string[], uclass: string = null) {
        super();
        this.msg = msg;
        this.options = options;
        this.uclass = uclass;
    }

    toHtmlElement(): HTMLElement {
        let x: HTMLElement = ConfirmMenu.XTemplate.cloneNode(true) as HTMLElement;
        (x.firstElementChild as HTMLDivElement).innerText = this.msg;
        if (this.uclass) x.classList.add(this.uclass);
        for(let v of this.options) {
            let y = util.createNodeFromHtmlString(`<input type="button" value="${v}">`);
            y.onclick = () => this.cb(null, v);
            x.children[1].appendChild(y);
        }
        this.latestElem = x;
        this.register_drag_drop();
        return x;
    }

    GetInput(cb: (err, message) => void) {
        this.cb = (e, m) => {
            x.remove();
            cb(e, m);
        }
        let x = this.toHtmlElement();
        let body = document.querySelector("body");
        body.prepend(x);
    }

    async GetInputP(): Promise<string> {return util.promisify(this.GetInput).call(this);}
} //}

/**
 * @class TransferProgressBar
 */
export class TransferProgressBar extends MoveableElementGenerator //{
{
    static ClassA = 'transfer-bar';
    static ClassAA = 'transfer-bar-top';
    static ClassAAA = 'transfer-bar-title';
    static ClassAAB = 'transfer-bar-cancel';
    static ClassAB = 'transfer-bar-progress';
    static ClassABA = 'transfer-bar-progress-finish';
    private static template = `
    <div class="${TransferProgressBar.ClassA}" draggable="true">
        <div class="${TransferProgressBar.ClassAA}">
            <div class="${TransferProgressBar.ClassAAA}"></div>
            <input class="${TransferProgressBar.ClassAAB}" type="button" value="cancel">
        </div>
        <div class="${TransferProgressBar.ClassAB}"><div class="${TransferProgressBar.ClassABA}"></div></div>
    </div>
    `;
    private static XTemplate = util.createNodeFromHtmlString(TransferProgressBar.template);

    private title: string;
    private totalsize: number;
    private processedsize: number;

    private Efinish: HTMLElement;
    private cancel: Function;

    constructor(title: string, cancel: Function) {
        super();
        this.title = title;
        this.totalsize = 0;
        this.processedsize = 0;
        this.cancel = cancel;
    }

    toHtmlElement(): HTMLElement {
        let x = TransferProgressBar.XTemplate.cloneNode(true) as HTMLElement;
        (x.firstElementChild.firstElementChild as HTMLElement).innerText = this.title;
        this.Efinish = x.lastElementChild.firstElementChild as HTMLElement;
        (x.firstElementChild.lastElementChild as HTMLElement).onclick = () => {
            this.cancel();
            this.finish();
        };
        this.latestElem = x;
        this.register_drag_drop();
        return x;
    }

    start(total: number) {
        this.totalsize = total;
        let x = this.toHtmlElement();
        this.Efinish.style.width = "0%";
        let body = document.querySelector("body");
        body.prepend(x);
    }

    progress(size: number, t: number) {
        this.processedsize = size;
        this.totalsize = t;
        let percent = (this.processedsize / this.totalsize) * 100;
        this.Efinish.style.width = `${percent}%`;
        this.Efinish.innerText = `${percent.toPrecision(3)}%`;
    }

    finish() {
        if(this.latestElem) {
            this.latestElem.remove();
            this.latestElem = null;
        }
    }
} //}

/**
 * @class DirectoryTree
 */
export class DirectoryEntry {
}

