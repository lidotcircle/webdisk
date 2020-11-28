import { Component, ViewContainerRef } from '@angular/core';
import { MatIconRegistry } from '@angular/material/icon';
import { DomSanitizer } from '@angular/platform-browser';
import { rootViewContainerRefSymbol } from './shared/utils';

@Component({
    selector: 'app-root',
    templateUrl: './app.component.html',
    styleUrls: ['./app.component.scss']
})
export class AppComponent {
    title = 'webdisk-dashboard';

    constructor(private bodyContainer: ViewContainerRef) {
        window[rootViewContainerRefSymbol] = this.bodyContainer;
    }
}

