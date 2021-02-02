import { Component, ViewContainerRef } from '@angular/core';
import { MatIconRegistry } from '@angular/material/icon';
import { DomSanitizer } from '@angular/platform-browser';
import { rootViewContainerRefSymbol } from './shared/utils';

declare const require: any;
const sortbyicon = require('!raw-loader!src/assets/maticons/sortby.svg').default;
const hide_foldericon = require('!raw-loader!src/assets/maticons/hide-folder.svg').default;
const usersettings = require('!raw-loader!src/assets/maticons/user-settings.svg').default;
const useraccount = require('!raw-loader!src/assets/maticons/user-account.svg').default;
const logo = require('!raw-loader!src/assets/maticons/logo.svg').default;
const nav_back = require('!raw-loader!src/assets/maticons/nav-back.svg').default;

const info = require('!raw-loader!src/assets/maticons/information.svg').default;
const warn = require('!raw-loader!src/assets/maticons/warning.svg').default;
const error = require('!raw-loader!src/assets/maticons/error.svg').default;

const in_fold   = require('!raw-loader!src/assets/maticons/in_fold.svg').default;
const in_unfold = require('!raw-loader!src/assets/maticons/in_unfold.svg').default;

const wd_copy = require('!raw-loader!src/assets/maticons/wd_copy.svg').default;
const download = require('!raw-loader!src/assets/maticons/download.svg').default;

const icons = [
    {name: 'sortby', svg: sortbyicon},
    {name: 'hide_folder', svg: hide_foldericon},
    {name: 'user-settings', svg: usersettings},
    {name: 'user-account', svg: useraccount},
    {name: 'logo', svg: logo},
    {name: 'nav-back', svg: nav_back},
    {name: 'info', svg: info},
    {name: 'warn', svg: warn},
    {name: 'error', svg: error},
    {name: 'in_fold', svg: in_fold},
    {name: 'in_unfold', svg: in_unfold},
    {name: 'wd-copy', svg: wd_copy},
    {name: 'wd-download', svg: download},
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

