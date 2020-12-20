import { ViewTrait } from './view-trait';

export class DontOverflow extends ViewTrait {
    protected parentWidth: number;
    protected parentHeight: number;

    protected hostElem: HTMLElement;
    private init_top: string;
    private init_left: string;
    constructor(left='50%', top='50%') {
        super();
        this.init_left = left;
        this.init_top = top;
    }

    public perform(host: HTMLElement) {
        this.hostElem = host;
        this.hostElem.style.top    = this.init_top;
        this.hostElem.style.left   = this.init_left;
    }

    protected get top(): number {
        let v = this.hostElem.style.top;
        if(!v.endsWith('px')) {
            const u = window.getComputedStyle(this.hostElem);
            v = u.top;
        }
        return parseInt(v.substring(0, v.length - 2));
    }
    protected set top(v: number) {
        this.hostElem.style.top = `${Math.floor(v)}px`;
    }
    protected get left(): number {
        let v = this.hostElem.style.left;
        if(!v.endsWith('px')) {
            const u = window.getComputedStyle(this.hostElem);
            v = u.left;
        }
        return parseInt(v.substring(0, v.length - 2));
    }
    protected set left(v: number) {
        this.hostElem.style.left = `${Math.floor(v)}px`;
    }

    protected get elemWidth () {return this.hostElem.clientWidth;}
    protected get elemHeight() {return this.hostElem.clientHeight;}

    protected refreshParentDim() {
        let absoluteContainer = this.hostElem.parentElement;
        while(absoluteContainer != document.body &&
              !absoluteContainer.style.position.match(/absolute|relative/)) {
            absoluteContainer = absoluteContainer.parentElement;
        }
        const sb = window.getComputedStyle(absoluteContainer);
        this.parentWidth  = parseInt(sb.width);
        this.parentHeight = parseInt(sb.height);
    }

    private preventOverflow() {
        if(this.top  < 0) this.top = 0;
        if(this.left < 0) this.left = 0;

        if(this.top + this.elemHeight > this.parentHeight && 
           this.elemHeight <= this.parentHeight) {
            this.top = this.parentHeight - this.elemHeight;
        }
        if(this.left + this.elemWidth > this.parentWidth &&
           this.elemWidth <= this.parentWidth) {
            this.left = this.parentWidth - this.elemWidth;
        }
    }

    public afterViewInitHook() {
        this.refreshParentDim();
        this.preventOverflow();
    }
}

