import { Component, ElementRef, Input, OnInit, ViewChild } from '@angular/core';
import { SoleWindowClickClose } from '../sole-window-click-close';

@Component({
    selector: 'app-sole-text-viewer',
    template: `
    <app-sole-window (bgclick)='onexit()'>
    <div class='viewer'>
        <div class='tool-bar'>
            <div class='tool'>
                filepath: {{ filename }} 
            </div>

            <select #themeSelect>
                <option *ngFor="let _theme of themes" [value]="_theme.value">
                  {{_theme.viewValue}}
                </option>
            </select>

            <mat-checkbox name="c_lineno" ngDefaultControl [(ngModel)]='lineno'>Line Numbers</mat-checkbox>
        </div>
        <div class='main-viewer'>
            <ngx-prismjs [lineno]='lineno' [theme]='theme' [code]='code' [language]='language'></ngx-prismjs>
        </div>
    </div>
    </app-sole-window>
    `,
    styleUrls: ['./sole-text-viewer.component.scss']
})
export class SoleTextViewerComponent extends SoleWindowClickClose implements OnInit {
    @Input()
    filename: string;
    @Input()
    code: string;
    @Input()
    language: string;

    theme: string;
    lineno: boolean;

    themes = [
        { viewValue: "Default", value: "default" },
        { viewValue: "Coy", value: "coy" },
        { viewValue: "Dark", value: "dark" },
        { viewValue: "Funky", value: "funky" },
        { viewValue: "Okaidia", value: "okaidia" },
        { viewValue: "Solarizedlight", value: "solarizedlight" },
        { viewValue: "Tomorrow", value: "tomorrow" },
        { viewValue: "Twilight", value: "twilight" },
    ];

    @ViewChild("themeSelect", {static: true})
    private selectElem: ElementRef;

    constructor() {
        super();
        this.theme = 'default';
        this.lineno = true;
    }

    ngOnInit(): void {
        const select = this.selectElem.nativeElement as HTMLSelectElement;
        select.onchange = () => this.theme = select.value;
    }
}

