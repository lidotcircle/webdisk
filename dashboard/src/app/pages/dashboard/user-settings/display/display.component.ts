import { Component, OnDestroy, OnInit } from '@angular/core';
import { NbThemeService } from '@nebular/theme';
import { Subject } from 'rxjs';
import { map, takeUntil } from 'rxjs/operators';


@Component({
    selector: 'app-display',
    templateUrl: './display.component.html',
    styleUrls: ['./display.component.scss']
})
export class DisplayComponent implements OnInit, OnDestroy {
    private destroy$: Subject<void> = new Subject<void>();
    themes = [
        {
            value: 'default',
            name: 'Default',
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

    constructor(private themeService: NbThemeService) { }

    ngOnInit(): void {
        this.currentTheme = this.themeService.currentTheme;

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
}
