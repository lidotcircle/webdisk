import * as events from 'events';
import * as util from './util';

class MessageBar extends events.EventEmitter //{
{
    private where: HTMLElement = null;
    private displayState: boolean   = false;
    private displayClass: string;
    private msgQueue: any[][];
    private amountOfTimeOfInvoking: number;
    constructor(target: HTMLElement, displayClass: string = "d-block") {
        super();
        if(target == null) throw new Error("null element");
        this.where                  = target;
        this.displayClass           = displayClass;
        this.msgQueue               = [];
        this.amountOfTimeOfInvoking = 0;
    }
    private _show(time: number = 3000): void {
        if(this.displayState) return;

        let id = util.makeid(16);
        let css_template: string = 
        `<style>
        #${id} {
            animation-name:   anim-${id};
            animation-duration: ${time * 0.2 / 1000.0}s;
            background-size: cover;
            background-repeat: no-repeat;
        }
        @keyframes anim-${id} {
            0%    {opacity: 0;} 
            100%  {opcaity: 1;}
        }
        </style>`;
        let newCss: Element = util.createNodeFromHtmlString(css_template);
        let prevSibling: Element = this.where.previousSibling as Element;
        if(prevSibling == null || prevSibling.nodeName.toLowerCase() != "style") {
            this.where.parentNode.insertBefore(newCss, this.where);
        } else {
            this.where.parentNode.replaceChild(newCss, prevSibling);
        }

        this.where.setAttribute("id", id);
        this.where.classList.remove("d-none"); 
        this.where.classList.add(this.displayClass);
        this.displayState = true;
    }
    _hide(): void {
        if(!this.displayState) return;

        let time: number = 800;
        let id = util.makeid(16);
        let css_template: string = 
        `<style>
        #${id} {
            animation-name:   anim-${id};
            animation-duration: ${time / 1000.0}s;
        }
        @keyframes anim-${id} {
            0%    {opacity: 1;} 
            100%  {opacity: 0; display: none;}
        }
        </style>`;
        let newCss: Element = util.createNodeFromHtmlString(css_template);
        let prevSibling: Element = this.where.previousSibling as Element;
        if(prevSibling == null || prevSibling.nodeName.toLowerCase() != "style") {
            this.where.parentNode.insertBefore(newCss, this.where);
        } else {
            this.where.parentNode.replaceChild(newCss, prevSibling);
        }

        this.where.setAttribute("id", id);
        window.setTimeout((() => {
            this.where.classList.remove(this.displayClass);
            this.where.classList.add("d-none"); 
            this.displayState = false;
        }), time);
    }
    __run(): void {
        if(this.displayState == true) return;
        if(this.msgQueue.length == 0) return;
        let keep = this.amountOfTimeOfInvoking;
        this.amountOfTimeOfInvoking++;
        let i: any[] = this.msgQueue.splice(0, 1)[0];
        if(i.length == 2) {
            this.where.innerHTML = i[0];
            this._show(i[1]);
            window.setTimeout(function(obj: MessageBar) {
                if(obj.amountOfTimeOfInvoking != ++keep) // this message had been cancelled
                    return;
                obj._hide();
                obj.__run();
            }, i[1], this);
        } else if (i.length == 3) {
            this.where.innerHTML = i[0];
            this._show();
            let etarget: events.EventEmitter = i[1];
            let event: string = i[2];
            etarget.once(event, (earg) => {
                if(this.amountOfTimeOfInvoking != ++keep) // this message had been cancelled
                    return;
                this._hide();
                this.__run();
            });
        } else {
            console.error("unexpected length.");
            return;
        }
    }
    ShowWithDuration(html_msg: string, duration: number, force: boolean = false): void {
        this.msgQueue.push([html_msg, duration]);
        if(force) {
            this.displayState = false;
        }
        this.__run();
    }
    ShowWithEvent(html_msg: string, target: events.EventEmitter, eventType: string, force: boolean = false): void {
        this.msgQueue.push([html_msg, target, eventType]);
        if(force) {
            this.displayState = false;
        }
        this.__run();
    }
} //}

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
        this.input_e.addEventListener("keydown", this.input_onkeydown);
        this.input_e.addEventListener("blur", this.input_onblur);
        this.input_e.addEventListener("input", this.input_oninput);
    } //}

    /** event handlers */
    private change_name(name: string) //{
    {
        let old_name = this.basename;
        this.basename = name;
        this.filename_e.innerText = this.basename;
        this.input_e.classList.toggle(this.h_class);
        this.filename_e.classList.toggle(this.h_class);
        if (old_name != this.basename)
            this.emit("change", this.basename, old_name);
    } //}
    private check_on_input() //{
    {
        if(!FilenameBar.validFilename.test(this.input_e.value)) {
            window.alert("invalid filename");
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

        this.input_e.classList.toggle(this.h_class);
        this.input_e.value = this.basename;
        this.input_e.select();
        this.filename_e.classList.toggle(this.h_class);
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
            <span class='${AddressSlice.ClassAA}'>&#8614;</span>
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
        this.holdElement.addEventListener("click", this.name_onclick);
        if(hide_arrow) this.holdElement.removeChild(this.holdElement.firstElementChild);
    }

    private name_onclick(e: MouseEvent) {e.stopPropagation(); this.emit("click", this.name);}

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
            if (startWithSlash) emitPath = emitPath.substring(1, 0);
            let elem = new AddressSlice(path_split[i], emitPath, hide);
            this.holdElement.appendChild(elem.Elem);
            elem.on("click", this.child_onclick);
        }
    } //}

    private child_onclick(path_: string) {this.emit("click", path_);}

    get Elem(): HTMLSpanElement {return this.holdElement;}
} //}


/**
 * @class AddressBar
 * @event click @see AddressSlice#click
 */
export class AddressBar extends events.EventEmitter //{
{
    private anchorPoint: HTMLSpanElement;
    private full_path: string;
    private inInput: boolean;
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
        this.anchorPoint = AddressBar.TTElement.cloneNode(true) as HTMLSpanElement;
        this.input_bar = this.anchorPoint.firstElementChild as HTMLInputElement;
        this.address_bar = new AddressBarPA();
        this.anchorPoint.prepend(this.address_bar.Elem);

        this.address_bar.on("click", (addr) => this.emit("click", addr));

        this.input_bar.addEventListener("keydown", this.input_onkeydown);
        this.input_bar.addEventListener("input", this.input_oninput);
        this.input_bar.addEventListener("blur", this.input_onblur);
        
        this.anchorPoint.addEventListener("click", this.__onclick);
    }

    /** event handlers */
    private change_name(name: string) //{
    {
        let old_name = this.full_path;
        this.address_bar.Elem.classList.toggle(this.h_class);
        if (old_name != this.full_path)
            this.emit("change", this.full_path, old_name);
    } //}
    private check_on_input() //{
    {
        if(!AddressBar.validPathname.test(this.input_bar.value)) {
            window.alert("invalid pathname");
            this.change_name(this.full_path);
        } else
            this.change_name(this.input_bar.value);
    } //}
    private input_onkeydown(e: KeyboardEvent) {if(e.key.toLowerCase() == "enter") this.check_on_input();}
    private input_onblur   () {this.check_on_input();}
    private input_oninput  () {this.input_bar.value = this.input_bar.value.replace(/(\r|\n)/, "");}

    private __onclick() {
        this.address_bar.Elem.classList.toggle(this.h_class);
        this.input_bar.value = this.full_path;
        this.input_bar.select();
    }

    setAddr(path?: string) {
        this.full_path = path || this.full_path;
        this.address_bar.setAddr(path);
    }
    get Elem(): HTMLSpanElement{return this.anchorPoint;}
} //}

