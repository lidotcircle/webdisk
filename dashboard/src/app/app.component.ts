import { Component, ViewContainerRef } from '@angular/core';
import { MatIconRegistry } from '@angular/material/icon';
import { DomSanitizer } from '@angular/platform-browser';
import { rootViewContainerRefSymbol } from './shared/utils';

declare const require: any;
const sortbyicon = require('!raw-loader!src/assets/maticons/sortby.svg').default;
const hide_foldericon = require('!raw-loader!src/assets/maticons/hide-folder.svg').default;

const icons = [
    {name: 'sortby', svg: sortbyicon},
    {name: 'hide_folder', svg: hide_foldericon}
];

@Component({
    selector: 'app-root',
    templateUrl: './app.component.html',
    styleUrls: ['./app.component.scss']
})
export class AppComponent {
    title = 'webdisk-dashboard';

    constructor(private bodyContainer: ViewContainerRef,
                private matIconRegistry: MatIconRegistry,
                private domSanitizer: DomSanitizer) {
        window[rootViewContainerRefSymbol] = this.bodyContainer;

        icons.forEach(v => this.matIconRegistry.addSvgIconLiteral(v.name, this.domSanitizer.bypassSecurityTrustHtml(v.svg)));
    }
}

