import { Component, ElementRef, EventEmitter, Input, OnInit, Output, ViewChild } from '@angular/core';
import { MousePointerService } from '../../service/mouse-pointer.service';
import { AbsoluteView, BeAbsoluteView } from '../absolute-view/absolute-view';
import { ViewDraggable } from '../absolute-view/trait/draggable';
import { ProgressCircleComponent } from './progress-circle/progress-circle.component';

@Component({
    selector: 'app-message-progress-bar',
    templateUrl: './message-progress-bar.component.html',
    styleUrls: ['./message-progress-bar.component.scss']
})
@BeAbsoluteView()
export class MessageProgressBarComponent extends AbsoluteView implements OnInit {
    @Output('close')
    private close = new EventEmitter<void>();
    @ViewChild('progresscircle', {static: true})
    progressc: ProgressCircleComponent;

    title = 'unknown';
    message: string;
    constructor(private _h: ElementRef,
                private mousepointer: MousePointerService) {
        //super(_h, new ViewDraggable(()=>true, ...mousepointer.pixelCoordinate));
        super(_h, new ViewDraggable(()=>true, '50%', '50%'));
    }

    ngOnInit(): void {
    }

    finish() {
        this.progressc.finish();
    }

    stop() {
        this.progressc.stop();
    }

    pushMessage(msg: string) {
        this.message = msg;
    }

    onClose() {
        this.close.emit();
    }
}

