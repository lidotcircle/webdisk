import { Component, OnInit, ElementRef, ViewContainerRef, OnDestroy, Input } from '@angular/core';
import { MousePointerService } from '../../service/mouse-pointer.service';
import { assignTargetEnumProp } from '../../utils';
import { AbsoluteView } from '../absolute-view/absolute-view';
import { ViewDraggable } from '../absolute-view/trait/draggable';

export class MessageBoxInput {
    label: string;
    name: string;
    type?: string;
    initValue?: any;
}

export enum MatColorType {
    Basic    = 'basic',
    Primary  = 'primary',
    Accent   = 'accent',
    Warn     = 'warn',
    Disabled = 'disabled',
    Link     = 'link'
}
export enum MatButtonType {
    Basic   = 'basic',
    Raised  = 'raised',
    Flat    = 'flat',
    Stroked = 'stroked',
    Icon    = 'icon',
    Fab     = 'fab',
    MiniFab = 'mini-fab'
}
export class MessageBoxButton {
    name: string;
    clickValue?: any;
    color?: MatColorType;
    btype?: MatButtonType;
}

class MessageBoxReturnData {
    closed: boolean;
    buttonValue: any;
    inputs: {[name: string]: string};
}

@Component({
    selector: 'app-message-box',
    templateUrl: './message-box.component.html',
    styleUrls: ['./message-box.component.scss']
})
export class MessageBoxComponent extends AbsoluteView implements OnInit {
    @Input()
    title: string = 'origin';
    @Input()
    message: string = '';
    @Input()
    inputs: MessageBoxInput[] = [];
    @Input()
    buttons: MessageBoxButton[] = [];

    constructor(protected host: ElementRef,
                private mousepointer: MousePointerService) {
        super(host, new ViewDraggable(()=>true, 
                                      mousepointer.coordinate[0].toString() + 'px', mousepointer.coordinate[1].toString() + 'px'));
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
        this.resolveData = new MessageBoxReturnData();
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

    private resolve: (data: MessageBoxReturnData) => void;
    private resolveData: MessageBoxReturnData;
    async waitClose(): Promise<MessageBoxReturnData> {
        if (!!this.resolveData) return this.resolveData;

        if (this.resolve != null) {
            throw new Error("don't wait MessageBox twice");
        }
        return await new Promise((resolve, _) => {
            this.resolve = resolve;
        });
    }
}

