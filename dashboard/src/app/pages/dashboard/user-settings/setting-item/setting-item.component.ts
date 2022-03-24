import { Component, Input, OnInit, Output, ViewEncapsulation } from '@angular/core';
import { Subject } from 'rxjs';

export class SettingItem {
    property: string;
    name: string;
    type: string;
    initvalue: any;
    extra: any;
    change: (newv: any) => void;
}

@Component({
    selector: 'app-setting-item',
    templateUrl: './setting-item.component.html',
    styleUrls: ['./setting-item.component.scss'],
    encapsulation: ViewEncapsulation.None
})
export class SettingItemComponent implements OnInit {
    @Input('setting')
    setting: SettingItem;

    constructor() { }

    ngOnInit(): void {
    }

    onchange(newval: any) {
        this.setting.change(newval);
    }
}

