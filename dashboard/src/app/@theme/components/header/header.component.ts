import { Component, OnDestroy, OnInit } from '@angular/core';
import { NbMediaBreakpointsService, NbMenuService, NbSidebarService, NbThemeService } from '@nebular/theme';

import { LayoutService } from '../../../@core/utils';
import { filter, map, takeUntil } from 'rxjs/operators';
import { Subject } from 'rxjs';
// import { UserService } from 'src/app/service/user/user.service';
import { User } from 'src/app/entity/User';
import { AuthService } from 'src/app/service/auth';


@Component({
    selector: 'ngx-header',
    styleUrls: ['./header.component.scss'],
    templateUrl: './header.component.html',
})
export class HeaderComponent implements OnInit, OnDestroy {

    private destroy$: Subject<void> = new Subject<void>();
    userPictureOnly: boolean = false;

    themes = [
        {
            value: 'default',
            name: '默认',
        },
        {
            value: 'dark',
            name: 'Dark',
        },
        {
            value: 'cosmic',
            name: 'Cosmic',
        },
        {
            value: 'corporate',
            name: 'Corporate',
        },
    ];

    currentTheme = 'default';

    userMenu = [ { title: '设置' }, { title: '退出' } ];

    constructor(private sidebarService: NbSidebarService,
        private menuService: NbMenuService,
        private themeService: NbThemeService,
        /*
              private userService: UserService,
         */
        private authService: AuthService,
        private layoutService: LayoutService,
        private breakpointService: NbMediaBreakpointsService) {
    }

    ngOnInit() {
        this.currentTheme = this.themeService.currentTheme;

        /*
    this.userService.getUser()
      .pipe(takeUntil(this.destroy$))
      .subscribe(user => this.user = user);
         */

        this.menuService.onItemClick()
            .pipe(takeUntil(this.destroy$))
            .pipe(filter(({ tag }) => tag == 'user-click'))
            .subscribe(async ({ item: {title} }) => {
                if(title == '退出') {
                    await this.authService.logout();
                    window.location.reload();
                }
            });

        const { xl } = this.breakpointService.getBreakpointsMap();
        this.themeService.onMediaQueryChange()
            .pipe(
                map(([, currentBreakpoint]) => currentBreakpoint.width < xl),
                takeUntil(this.destroy$),
            )
            .subscribe((isLessThanXl: boolean) => this.userPictureOnly = isLessThanXl);

        this.themeService.onThemeChange()
            .pipe(
                map(({ name }) => name),
                takeUntil(this.destroy$),
            )
            .subscribe(themeName => this.currentTheme = themeName);
    }

    ngOnDestroy() {
        this.destroy$.next();
        this.destroy$.complete();
    }

    changeTheme(themeName: string) {
        this.themeService.changeTheme(themeName);
    }

    toggleSidebar(): boolean {
        this.sidebarService.toggle(true, 'menu-sidebar');
        this.layoutService.changeLayoutSize();

        return false;
    }
}
