import { Component, Input, OnInit, Output } from '@angular/core';
import { Subject } from 'rxjs';

@Component({
  selector: 'app-checkbox',
  templateUrl: './checkbox.component.html',
  styleUrls: ['./checkbox.component.scss']
})
export class CheckboxComponent implements OnInit {
    @Input('name')
    name: string;
    @Input('init')
    initvalue: any;
    @Output('change')
    private valuechange: Subject<any> = new Subject<any>();

    constructor() { }

    ngOnInit(): void {
    }

    onchange() {
        this.valuechange.next(this.initvalue);
    }
}

