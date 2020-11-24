import { Component, OnInit, Input, EventEmitter, Output } from '@angular/core';
import { FileViewStyle } from '../home.component';

@Component({
    selector: 'app-detail-view-header',
    templateUrl: './detail-view-header.component.html',
    styleUrls: ['./detail-view-header.component.scss']
})
export class DetailViewHeaderComponent implements OnInit {
    @Input('view-style')
    viewStyle: FileViewStyle;
    @Output('change')
    ViewChange = new EventEmitter();

    constructor() { }

    ngOnInit(): void {
        if(this.viewStyle == null) {
            throw new Error('fixme');
        }
    }
}
