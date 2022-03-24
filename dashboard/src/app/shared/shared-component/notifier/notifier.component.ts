import { AfterViewInit, Component, ElementRef, Input, OnInit, ViewChild, ViewEncapsulation } from '@angular/core';
import { AbsoluteView } from '../absolute-view/absolute-view';

export enum NotifierType {
    Info  = 'info',
    Warn  = 'warn',
    Error = 'error',
}

@Component({
    selector: 'app-notifier',
    templateUrl: './notifier.component.html',
    styleUrls: ['./notifier.component.scss'],
    encapsulation: ViewEncapsulation.None
})
export class NotifierComponent extends AbsoluteView implements OnInit, AfterViewInit {
    @Input()
    message: string;
    @Input()
    duration: number;
    @Input()
    mtype: NotifierType;

    @ViewChild('wrapperelem', {static: true})
    private wrapper: ElementRef;

    constructor(host: ElementRef) {
        super(host);
    }

    ngAfterViewInit(): void {
        this.imready = true;
        if(this.viewready_cb) {
            this.viewready_cb();
            this.viewready_cb = null;
        }
    }

    ngOnInit(): void {
        console.assert(this.message != null);
        console.assert(!this.duration || this.duration >= 300);
        this.duration = this.duration || 2500;
        this.mtype = this.mtype || NotifierType.Info;
        const elem = this.wrapper.nativeElement as HTMLElement;
        elem.setAttribute('mtype', this.mtype);

        setTimeout(() => {
            this.waitDecay = true;
            setTimeout(() => {
                this.resolved = true;
                if(!!this.resolve) {
                    this.resolve(null);
                    this.resolve = null;
                }
            }, 300);
        }, this.duration - 300);
    }

    private imready: boolean = false;
    private viewready_cb: Function;
    async viewinit(): Promise<void> {
        if(this.imready) return;

        return new Promise((resolve) => {
            this. viewready_cb = resolve;
        });
    }

    waitDecay: boolean = false;
    resolved: boolean = false;
    private resolve: (value: any) => void;
    async waitTimeout() {
        if(this.resolved) return;
        console.assert(this.resolve == null);

        return await new Promise((resolve, _) => {
            this.resolve = resolve;
        });
    }

    async upup(howlong_px: number) {
        const style = (this.host.nativeElement as HTMLElement).style;
        if(style.transform) {
            const m = style.transform.match(/translate\([^,]+,([^p]+)px\)/);
            howlong_px -= parseInt(m[1]);
        }

        style.transform = `translate(0px, -${howlong_px}px)`;
    }

    get height(): number {
        const elem = this.host.nativeElement as HTMLElement;
        return elem.clientHeight;
    }
}

