import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';


type SettingItemExtra = { name: string, value: string} | any;
export class SettingItem {
    name: string;
    type: string;
    initvalue: any;
    extra?: SettingItemExtra;
    change?: (newv: any) => void;
}

@Component({
    selector: 'app-setting-item',
    templateUrl: './setting-item.component.html',
    styleUrls: ['./setting-item.component.scss'],
})
export class SettingItemComponent implements OnInit {
    @Input('setting')
    setting: SettingItem;

    @Input()  name: string;
    @Input()  type: string;
    @Input()  initValue: any;
    @Output() initValueChange = new EventEmitter<any>();
    @Input()  extra: any;
    @Output() change: EventEmitter<any>;

    constructor() {
        this.change = new EventEmitter();
    }

    ngOnInit(): void {
        if (this.setting == null) {
            this.setting = {
                name: this.name,
                type: this.type,
                initvalue: this.initValue,
                extra: this.extra,
                change: (v: any) => {
                    this.initValue = v;
                    this.change.emit(v);
                },
            };
        }
    }

    onchange(newval: any) {
        if (this.setting.change) {
            this.setting.change(newval);
        }
        this.initValueChange.emit(newval);
    }
}

