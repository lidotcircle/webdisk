import { Component, OnInit, ElementRef, ViewContainerRef, OnDestroy, Input } from '@angular/core';
import { assignTargetEnumProp } from '../../utils';
import { AbsoluteView } from '../absolute-view/absolute-view';
import { ViewDraggable } from '../absolute-view/trait/draggable';

export class NotifierInput {
    label: string;
    name: string;
    type?: string;
    initValue?: any;
}

enum MatColorType {
    Basic    = 'basic',
    Primary  = 'primary',
    Accent   = 'accent',
    Warn     = 'warn',
    Disabled = 'disabled',
    Link     = 'link'
}
enum MatButtonType {
    Basic   = 'basic',
    Raised  = 'raised',
    Flat    = 'flat',
    Stroked = 'stroked',
    Icon    = 'icon',
    Fab     = 'fab',
    MiniFab = 'mini-fab'
}
export class NotifierButton {
    name: string;
    clickValue?: any;
    color?: MatColorType;
    btype?: MatButtonType;
}

class NotifierReturnData {
    closed: boolean;
    buttonValue: any;
    inputs: {[name: string]: string};
}

@Component({
    selector: 'app-notifier',
    templateUrl: './notifier.component.html',
    styleUrls: ['./notifier.component.scss']
})
export class NotifierComponent extends AbsoluteView implements OnInit {
    @Input()
    title: string = 'origin';
    @Input()
    message: string = '';
    @Input()
    inputs: NotifierInput[] = [];
    @Input()
    buttons: NotifierButton[] = [];

    constructor(protected host: ElementRef) {
        super(host, new ViewDraggable());
    }

    ngOnInit(): void {
        this.inputs = JSON.parse(JSON.stringify(this.inputs));
        for(let input of this.inputs) {
            input.type = input.type || 'text';
        }

        this.buttons = JSON.parse(JSON.stringify(this.buttons));
        for(let i in this.buttons) {
            let button = this.buttons[i];
            button.clickValue = button.clickValue || i;
            button.color      = button.color || MatColorType.Primary;
            button.btype      = button.btype || MatButtonType.Flat;
        }
    }

    preventDefaultAndStop(ev: CustomEvent) {ev.stopPropagation(); ev.preventDefault();}

    onClose() {
        this.resolveM(true);
    }

    onButtonClick(n: number) {
        this.resolveM(false, n);
    }

    private resolveM(closed: boolean, buttonNO?: number) {
        this.resolveData = new NotifierReturnData();
        this.resolveData.closed = closed;
        if (this.inputs.length > 0) {
            this.resolveData.inputs = {};
            for(const input of this.inputs) {
                this.resolveData[input.name] = input.initValue;
            }
        }
        if (buttonNO != null) {
            this.resolveData.buttonValue = this.buttons[buttonNO].clickValue;
        }

        if(!!this.resolve) {
            this.resolve(this.resolveData);
        }
    }

    private resolve: (data: NotifierReturnData) => void;
    private resolveData: NotifierReturnData;
    async waitClose(): Promise<NotifierReturnData> {
        if (!!this.resolveData) return this.resolveData;

        if (this.resolve != null) {
            throw new Error("don't wait notifier twice");
        }
        return await new Promise((resolve, _) => {
            this.resolve = resolve;
        });
    }
}

