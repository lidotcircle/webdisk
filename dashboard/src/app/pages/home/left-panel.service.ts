import { Injectable } from '@angular/core';

@Injectable({
    providedIn: 'root'
})
export class LeftPanelService {
    private element: HTMLElement;

    constructor() { }

    initialize(panel: HTMLElement) {
        this.element = panel;
    }

    toggle() {
        this.element.classList.remove('panel-init');
        this.element.classList.toggle('show');
    }
}

