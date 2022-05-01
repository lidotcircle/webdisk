import { Component, Input, OnInit, Output } from '@angular/core';
import { Subject } from 'rxjs';

@Component({
    selector: 'app-input',
    templateUrl: './input.component.html',
    styleUrls: ['./input.component.scss']
})
export class InputComponent implements OnInit {
    @Input('name')
    name: string;
    @Input('init')
    initvalue: any;
    @Input('type')
    type: string;
    @Output('change')
    private valuechange: Subject<any> = new Subject<any>();

    @Input()
    options: { type: string, min?: number, max?: number, step?: number };
    
    constructor() { }

    ngOnInit(): void {
        this.type = this.type || 'text';
        this.options = this.options || { } as any;
    }

    onchange(event: Event) {
        event.stopPropagation();
        this.valuechange.next(this.initvalue);
    }
}

