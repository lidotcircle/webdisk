import { ViewTrait } from './view-trait';

export class ViewBackground extends ViewTrait {
    private zindex: number;
    private r: number;
    private g: number;
    private b: number;
    private alpha: number;

    constructor(r: number, g: number, b: number, alpha: number = 1, zindex?: number) {
        super();
        this.r = r;
        this.g = g;
        this.b = b;
        this.alpha = alpha;
        this.zindex = zindex;
    }

    public perform(host: HTMLElement) {
        host.style.background = `rgba(${this.r}, ${this.g}, ${this.b}, ${this.alpha})`;
        if(this.zindex) {
            host.style.zIndex = Math.floor(this.zindex).toString();
        }
    }
}

