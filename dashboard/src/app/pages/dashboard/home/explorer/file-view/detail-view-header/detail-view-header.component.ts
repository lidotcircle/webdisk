import { Component, OnInit, Input, EventEmitter, Output } from '@angular/core';
import { FileViewStyle } from '../file-view.component';

@Component({
    selector: 'app-detail-view-header',
    templateUrl: './detail-view-header.component.html',
    styleUrls: ['./detail-view-header.component.scss']
})
export class DetailViewHeaderComponent implements OnInit {
    @Input('view-style')
    viewStyle: string;
    @Input('view-config')
    ViewConfig: FileViewStyle;

    @Output('change')
    ViewChange = new EventEmitter();

    constructor() {}

    ngOnInit(): void {
        if(this.viewStyle == null) {
            throw new Error('fixme');
        }
    }

    getPropCSS(prop: string) {
        const order = this.ViewConfig[prop + "Order"];
        const width = this.ViewConfig[prop + "Width"];
        let ans = 'white-space: nowrap; overflow-x: hidden; text-overflow: ellipsis;';

        if(order < 0) {
            ans += 'display: none;';
        } else {
            ans += `order: ${order};`;
        }
        if(width != null) {
            ans += `width: ${width}%;`;
        }
        return ans;
    }
}

