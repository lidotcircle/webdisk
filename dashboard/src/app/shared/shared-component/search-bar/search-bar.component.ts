import { Component, ElementRef, OnInit, Output, ViewChild } from '@angular/core';
import { Subject } from 'rxjs';


export type SearchInputEvent = [string, (hints: string[]) => void];
@Component({
    selector: 'app-search-bar',
    templateUrl: './search-bar.component.html',
    styleUrls: ['./search-bar.component.scss']
})
export class SearchBarComponent implements OnInit {
    @Output('searchinput')
    private _input: Subject<SearchInputEvent> = new Subject();
    @Output('searchenter')
    private _enter: Subject<string> = new Subject();

    @ViewChild('invalue', {static: true})
    private inputv: ElementRef;

    inputvalue: string;
    hints: string[];
    constructor() {
        this.inputvalue = '';
        this.hints = [];
    }

    ngOnInit(): void {}

    oninput() {
        let called = false;
        const hintsHook = (hints: string[]) => {
            if(called) {
                debugger;
                throw new Error('debug here');
            }
            called = true;
            this.hints = hints.slice(0);
        }
        this._input.next([this.inputvalue, hintsHook]);
    }

    onkeyup(ev: KeyboardEvent) {
        if(ev.key == 'Enter') {
            (this.inputv.nativeElement as HTMLElement).blur();
            this._enter.next(this.inputvalue);
        }
    }

    onblur() {
        this.hints = [];
    }

    onclear() {
        this.inputvalue = '';
        this._enter.next(this.inputvalue);
    }

    onhintclick(n: number) {
        this.inputvalue = this.hints[n];
        this.hints = [];
        this._enter.next(this.inputvalue);
    }
}

