import { Component, OnDestroy, OnInit } from '@angular/core';
import { NbMediaBreakpointsService, NbMenuService, NbSidebarService, NbThemeService } from '@nebular/theme';

import { LayoutService } from '../../../@core/utils';
import { filter, map, takeUntil } from 'rxjs/operators';
import { Subject } from 'rxjs';
import { UserService, UserBasicInfo } from 'src/app/service/user';
import { AuthService } from 'src/app/service/auth';
import { Router } from '@angular/router';


@Component({
    selector: 'ngx-header',
    styleUrls: ['./header.component.scss'],
    templateUrl: './header.component.html',
})
export class HeaderComponent implements OnInit, OnDestroy {
    private destroy$: Subject<void> = new Subject<void>();
    userPictureOnly: boolean = false;
    user: UserBasicInfo;
    avatar: string;

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
    userMenu = [ { title: 'setting' }, { title: 'exit' } ];

    constructor(private sidebarService: NbSidebarService,
        private menuService: NbMenuService,
        private themeService: NbThemeService,
        private userService: UserService,
        private authService: AuthService,
        private layoutService: LayoutService,
        private breakpointService: NbMediaBreakpointsService,
        private router: Router) {
    }

    ngOnInit() {
        this.currentTheme = this.themeService.currentTheme;

        this.menuService.onItemClick()
            .pipe(takeUntil(this.destroy$))
            .pipe(filter(({ tag }) => tag == 'user-click'))
            .subscribe(async ({ item: {title} }) => {
                if(title == 'exit') {
                    await this.authService.logout();
                    window.location.reload();
                } else if (title == 'setting') {
                    this.router.navigate(['/wd/dashboard/settings']);
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

        this.userService.basicInfo.pipe(takeUntil(this.destroy$)).subscribe(user => {
            this.user = user;
        });
        this.userService.avatar.pipe(takeUntil(this.destroy$)).subscribe(avatar => {
            this.avatar = avatar;
        });
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
