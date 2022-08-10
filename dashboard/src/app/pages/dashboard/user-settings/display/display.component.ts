import { Component, OnDestroy, OnInit } from '@angular/core';
import { NbThemeService } from '@nebular/theme';
import { Subject } from 'rxjs';
import { map, takeUntil } from 'rxjs/operators';
import { LocalSettingService } from 'src/app/service/user/local-setting.service';
import { LocaleService } from 'src/app/service/user/locale.service';


@Component({
    selector: 'app-display',
    templateUrl: './display.component.html',
    styleUrls: ['./display.component.scss']
})
export class DisplayComponent implements OnInit, OnDestroy {
    private destroy$: Subject<void> = new Subject<void>();
    currentTheme = 'default';
    currentLanguage = 'en';

    settings: LocalSettingService;

    constructor(private themeService: NbThemeService,
                private localeService: LocaleService,
                private _settings: LocalSettingService)
    {
        this.settings = this._settings;
    }

    ngOnInit(): void {
        this.currentTheme = this.themeService.currentTheme;

        this.themeService.onThemeChange()
            .pipe(
                map(({ name }) => name),
                takeUntil(this.destroy$),
            )
            .subscribe(themeName => this.currentTheme = themeName);

        this.localeService.getLang()
            .pipe(takeUntil(this.destroy$))
            .subscribe(lang => {
                this.currentLanguage = lang;
            });
    }

    ngOnDestroy() {
        this.destroy$.next();
        this.destroy$.complete();
    }

    changeTheme(themeName: string) {
        this.themeService.changeTheme(themeName);
    }

    changeLanguage(lang: string) {
        this.localeService.setLang(lang, true);
    }

}
