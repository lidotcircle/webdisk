import { Injectable } from '@angular/core';
import { TranslocoService } from '@ngneat/transloco';
import { Observable, Subject } from 'rxjs';
import { LocalStorageService } from 'src/app/shared/service/local-storage.service';


interface LocaleInfo {
    language: string;
    manually: boolean;
};

@Injectable({
    providedIn: 'root'
})
export class LocaleService {
    private langSubject: Subject<string>;

    constructor(private translocoService: TranslocoService,
                private localstorage: LocalStorageService)
    {
        this.langSubject = new Subject();
    }

    getLang(): Observable<string> {
        return new Observable<string>(subscriber => {
            subscriber.next(this.translocoService.getActiveLang());
            return this.langSubject.subscribe(subscriber);
        });
    }

    bootstrap() {
        const locale = this.localstorage.get("locale-language", null) as LocaleInfo;
        if (locale == null || !locale.manually) {
            const availableLangs = this.translocoService.getAvailableLangs();
            const langset = new Set<string>();
            for (const l of availableLangs) {
                if (typeof(l) == 'string') {
                    langset.add(l);
                } else {
                    langset.add(l.id);
                }
            }

            let lang = navigator.language.toLowerCase();
            if (!langset.has(lang)) {
                lang = lang.split('-')[0];
            }

            if (langset.has(lang)) {
                this.setLang(lang, false)
            }
        } else {
            this.setLang(locale.language, locale.manually)
        }
    }

    setLang(lang: string, manually: boolean = false) {
        if (!manually) {
            const locale = this.localstorage.get("locale-language", null) as LocaleInfo;
            if (locale && locale.manually) {
                return;
            }
        }

        this.translocoService.setActiveLang(lang);
        this.localstorage.set("locale-language", {
            language: lang,
            manually: manually
        });
        this.langSubject.next(lang);
    }
}
