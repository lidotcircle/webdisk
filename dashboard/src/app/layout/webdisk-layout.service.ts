import { Injectable } from '@angular/core';
import { Observable, Subject, Subscription } from 'rxjs';


function injectCssIntoDocument(css: string): () => void {
    const cssNode = document.createElement("style");
    cssNode.innerHTML = css;
    document.head.appendChild(cssNode);
    return () => cssNode.remove();
}

@Injectable({
    providedIn: 'root'
})
export class WebdiskLayoutService {
    private subscription: Subscription;
    private statusSubject: Subject<boolean>;

    constructor() {
        this.statusSubject = new Subject();
    }

    hide() {
        if (this.subscription)
            return;

        const selectorPrefix = `ngx-dashboard > ngx-default-layout > ngx-one-column-single-page-layout > nb-layout > div.scrollable-container > div.layout`;

        const hiddenCSS = `
        ${selectorPrefix} > nb-layout-header {
            display: none !important;
        }
        ${selectorPrefix} > .layout-container > nb-sidebar {
            display: none !important;
        }
        ${selectorPrefix} > .layout-container > .content > .columns >  nb-layout-column {
            padding: 0em !important;
        }
        ${selectorPrefix} > .layout-container > nb-sidebar + div {
            margin: 0em !important;
        }
        `;
        this.subscription = new Subscription(injectCssIntoDocument(hiddenCSS));
        this.statusSubject.next(false);
    }

    show() {
        if (this.subscription) {
            this.subscription.unsubscribe();
            this.subscription = null;
            this.statusSubject.next(true);
        }
    }

    toggle() {
        if (this.subscription) {
            this.subscription.unsubscribe();
            this.subscription = null;
        } else {
            this.hide();
        }
    }

    get status(): Observable<boolean> {
        return new Observable(subscriber => {
            subscriber.next(!this.subscription);
            return this.statusSubject.subscribe(subscriber);
        });
    }
}
