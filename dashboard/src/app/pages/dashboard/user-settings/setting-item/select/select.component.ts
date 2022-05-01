import { Component, Input, OnInit, Output } from '@angular/core';
import { Subject } from 'rxjs';


@Component({
    selector: 'app-select',
    template: `
        <div class='name'> {{ name }} </div>
        <nb-select [selected]="initvalue" (selectedChange)="onchange($event)" status="primary">
          <nb-option *ngFor="let option of options" [value]="option.value"> {{ option.name }}</nb-option>
        </nb-select>`,
    styleUrls: ['./select.component.scss']
})
export class SelectComponent implements OnInit {
    @Input('name')
    name: string;
    @Input('init')
    initvalue: any;
    @Input('type')
    type: string;
    @Input()
    options: { name: string, value: string } []
    @Output('change')
    private valuechange: Subject<any> = new Subject<any>();
    
    constructor() { }

    ngOnInit(): void {
        this.type = this.type || 'select';
    }

    onchange(event: any) {
        this.valuechange.next(event);
        this.initvalue = event;
    }
}

