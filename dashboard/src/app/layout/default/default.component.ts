import { Component, OnDestroy, OnInit } from '@angular/core';
import { TranslocoService } from '@ngneat/transloco';
import { from, Subject } from 'rxjs';
import { concatAll, filter, takeUntil } from 'rxjs/operators';
import { getWebdiskMenu, MenuItem } from 'src/app/pages/dashboard/dashboard-menu';
import { WebdiskMenuService } from 'src/app/service/menu/webdisk-menu.service';
import { LocaleService } from 'src/app/service/user/locale.service';

@Component({
    selector: 'ngx-default-layout',
    template: `
    <ngx-one-column-single-page-layout>
        <nb-menu [items]="menu" menu></nb-menu>
        <ng-content content></ng-content>
    </ngx-one-column-single-page-layout>`,
})
export class DefaultComponent implements OnInit, OnDestroy {
    private destroy$: Subject<void>;
    menu = [];

    constructor(private menuService: WebdiskMenuService,
                private translocoService: TranslocoService,
                private localeService: LocaleService)
    {
        this.destroy$ = new Subject();
        this.menuService.menuOnReady()
            .pipe(takeUntil(this.destroy$))
            .subscribe(() => {
                this.menu = getWebdiskMenu(this.translocoService);
                this.doit(this.menu);
            });

        from([
            this.translocoService.events$.pipe(filter(v => v.type == 'translationLoadSuccess')),
            this.localeService.getLang()
        ])
            .pipe(concatAll())
            .subscribe(() => {
                this.menu = getWebdiskMenu(this.translocoService);
                this.doit(this.menu);
            });
    }

    ngOnDestroy(): void {
        this.destroy$.next();
        this.destroy$.complete();
    }

    ngOnInit(): void {
    }

    private doit(menuitems: MenuItem[]) {
        const removeEntries = [];

        for(let i=0;i<menuitems.length;i++) {
            const item = menuitems[i];
            if(item.children) {
                this.doit(item.children);
            }

            if (item.descriptor)
            {
                if(!this.menuService.test(item.descriptor)) {
                    removeEntries.push(i);
                }
            } else {
                if(item.children && item.children.length == 0) {
                    removeEntries.push(i);
                }
            }
        }

        for(const i of removeEntries.reverse()) {
            menuitems.splice(i, 1);
        }
    }
}
