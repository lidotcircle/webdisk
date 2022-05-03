import { Component, EventEmitter, OnInit, Output, ViewChild } from '@angular/core';
import { ProgressCircleComponent } from './progress-circle/progress-circle.component';

@Component({
    selector: 'app-message-progress-bar',
    templateUrl: './message-progress-bar.component.html',
    styleUrls: ['./message-progress-bar.component.scss']
})
export class MessageProgressBarComponent implements OnInit {
    @Output('close')
    private close = new EventEmitter<void>();
    @ViewChild('progresscircle', {static: true})
    progressc: ProgressCircleComponent;

    title = 'unknown';
    message: string;
    constructor() {}

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

