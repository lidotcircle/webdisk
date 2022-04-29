import { Injectable } from '@angular/core';
import { interval, Observable, Subject, Subscription } from 'rxjs';
import { filter, take } from 'rxjs/operators';


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
    private readonly selectorPrefix: string;

    constructor() {
        this.statusSubject = new Subject();
        this.selectorPrefix = `ngx-dashboard > ngx-default-layout > ngx-one-column-single-page-layout > nb-layout > div.scrollable-container > div.layout`;

        this.setHeaderClick();
    }

    private async setHeaderClick() {
        const getHeader = () => document.body.querySelector(this.selectorPrefix + ' > nb-layout-header .header-space');

        while (true) {
            await interval(1000)
                .pipe(filter(() => getHeader() != null), take(1))
                .toPromise();

            const header = getHeader() as HTMLElement;
            header.style.cursor = 'pointer';
            let prevClick: Date = null;
            const clickHandler = () => {
                if (prevClick && (new Date().getTime() - prevClick.getTime()) < 500) {
                    this.toggle();
                } else {
                    prevClick = new Date();
                }
            }

            header.addEventListener('click', clickHandler);
            await interval(1000)
                .pipe(filter(() => header.parentNode == null), take(1))
                .toPromise();
            header.removeEventListener('click', clickHandler);
        }
    }

    hide() {
        if (this.subscription)
            return;

        const hiddenCSS = `
        ${this.selectorPrefix} > nb-layout-header {
            display: none !important;
        }
        ${this.selectorPrefix} > .layout-container > nb-sidebar {
            display: none !important;
        }
        ${this.selectorPrefix} > .layout-container > .content > .columns >  nb-layout-column {
            padding: 0em !important;
        }
        ${this.selectorPrefix} > .layout-container > nb-sidebar + div {
            margin: 0em !important;
        }

        .fullscreen-exit-button {
            position: absolute;
            bottom: 0.5em;
            right: 0.5em;
            font-size: large;
            background: white;
            padding: 0.5em;
            height: 2.5em;
            width: 2.5em;
            color: #000;
            border: 1pt solid #ccc;
            border-radius: 0.5em;
            text-align: center;
            cursor: pointer;
            animation: fadein 0.5s linear forwards;
        }

        .fullscreen-exit-button:hover {
            background: #eee;
        }

        .fullscreen-exit-button.hidden {
            animation: fadeout 0.5s linear forwards;
        }
        @keyframes fadein {
            0% {
                right: -2.5em;
            }
            100% {
                right: 0.5em;
            }
        }
        @keyframes fadeout {
            0% {
                right: 0.5em;
            }
            100% {
                right: -2.5em;
            }
        }
        `;
        this.subscription = new Subscription(injectCssIntoDocument(hiddenCSS));

        const exitButton = document.createElement('div');
        exitButton.classList.add('fullscreen-exit-button');
        exitButton.innerHTML = '<i class="nb-close"></i>';
        document.body.appendChild(exitButton);
        let prevClick: Date = null;
        exitButton.addEventListener('click', () => {
            if (prevClick && (new Date().getTime() - prevClick.getTime()) < 500) {
                this.subscription.unsubscribe();
                this.subscription = null;
                this.statusSubject.next(false);
            } else {
                prevClick = new Date();
            }
        });

        let mousePosition: { x: number, y: number } = null;
        const pointerInBottomRightRegion = () => {
            if (mousePosition == null) return false;
            const { x, y } = mousePosition;
            const rect = document.body.getBoundingClientRect();
            const bottom = rect.bottom;
            const right = rect.right;
            return x > right * 0.8 && y > bottom * 0.8;
        }

        let buttonHidden = false;
        const hideButton = async () => {
            while (true) {
                await interval(750).pipe(filter(() => !pointerInBottomRightRegion()), take(2)).toPromise();
                await interval(1500).pipe(take(1)).toPromise();
                if (!pointerInBottomRightRegion())
                    break;
            }

            exitButton.classList.add('hidden');
            buttonHidden = true;
        }

        let waitingMouseHoverBottom = false;
        const mouseMoveHandler = async (event: MouseEvent) => {
            mousePosition = { x: event.clientX, y: event.clientY };

            if (!buttonHidden || waitingMouseHoverBottom || !pointerInBottomRightRegion())
                return;

            waitingMouseHoverBottom = true;
            await interval(1500).pipe(take(1)).toPromise();
            waitingMouseHoverBottom = false;

            if (pointerInBottomRightRegion()) {
                exitButton.classList.remove('hidden');
                buttonHidden = false;
                hideButton();
            }
        }
        document.body.addEventListener('mousemove', mouseMoveHandler);
        hideButton();

        this.subscription.add(() => exitButton.remove());
        this.subscription.add(() => document.body.removeEventListener('mousemove', mouseMoveHandler));
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
