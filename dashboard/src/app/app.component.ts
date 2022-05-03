import { Component, ViewContainerRef } from '@angular/core';
import { MatIconRegistry } from '@angular/material/icon';
import { DomSanitizer } from '@angular/platform-browser';
import { NbThemeService } from '@nebular/theme';
import { map } from 'rxjs/operators';
import { AsyncLocalStorageService } from './shared/service/async-local-storage.service';
import { MousePointerService } from './shared/service/mouse-pointer.service';
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
const password = require('!raw-loader!src/assets/maticons/password-key.svg').default;

const icons = [
    {name: 'sortby',        svg: sortbyicon},
    {name: 'hide_folder',   svg: hide_foldericon},
    {name: 'user-settings', svg: usersettings},
    {name: 'user-account',  svg: useraccount},
    {name: 'logo',          svg: logo},
    {name: 'nav-back',      svg: nav_back},
    {name: 'info',          svg: info},
    {name: 'warn',          svg: warn},
    {name: 'error',         svg: error},
    {name: 'in_fold',       svg: in_fold},
    {name: 'in_unfold',     svg: in_unfold},
    {name: 'wd-copy',       svg: wd_copy},
    {name: 'wd-download',   svg: download},
    {name: 'wd-password',   svg: password},
];

@Component({
    selector: 'ngx-app',
    template: '<router-outlet></router-outlet>',
})
export class AppComponent {
    constructor(private bodyContainer: ViewContainerRef,
                private matIconRegistry: MatIconRegistry,
                private themeService: NbThemeService,
                private localstorage: AsyncLocalStorageService,
                private mousePointerService: MousePointerService,
                private domSanitizer: DomSanitizer) 
    {
        window[rootViewContainerRefSymbol] = this.bodyContainer;

        console.log("setup mouse pointer ", this.mousePointerService.coordinate);
        icons.forEach(v => this.matIconRegistry.addSvgIconLiteral(v.name, this.domSanitizer.bypassSecurityTrustHtml(v.svg)));
        this.themeStoreRecovery();
    }

    private async themeStoreRecovery()
    {
        const theme = await this.localstorage.get<string>("theme");
        if (theme != null && theme != 'default')
            this.themeService.changeTheme(theme);

        this.themeService.onThemeChange()
            .pipe(
                map(({ name }) => name),
            )
            .subscribe(async (themeName) =>
                await this.localstorage.set("theme", themeName)
            );
    }
}
