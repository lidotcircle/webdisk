import { Component, ElementRef, Input, OnInit, ViewEncapsulation } from '@angular/core';
import { AbsoluteView } from '../absolute-view/absolute-view';

@Component({
    selector: 'app-notifier',
    templateUrl: './notifier.component.html',
    styleUrls: ['./notifier.component.scss'],
    encapsulation: ViewEncapsulation.None
})
export class NotifierComponent extends AbsoluteView implements OnInit {
    @Input()
    message: string;
    @Input()
    duration: number;

    constructor(host: ElementRef) {
        super(host);
    }

    ngOnInit(): void {
        console.assert(this.message != null);
        console.assert(!this.duration || this.duration >= 300);
        this.duration = this.duration || 3000;

        setTimeout(() => {
            this.waitDecay = true;
            setTimeout(() => {
                this.resolved = true;
                if(!!this.resolve) {
                    this.resolve();
                    this.resolve = null;
                }
            }, 300);
        }, this.duration - 300);
    }

    waitDecay: boolean = false;
    resolved: boolean = false;
    private resolve: () => void;
    async waitTimeout() {
        if(this.resolved) return;
        console.assert(this.resolve == null);

        return await new Promise((resolve, _) => {
            this.resolve = resolve;
        });
    }
}

