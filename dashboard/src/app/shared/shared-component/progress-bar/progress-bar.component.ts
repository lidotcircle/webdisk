import { Component, Input, OnInit } from '@angular/core';

@Component({
    selector: 'app-progress-bar',
    templateUrl: './progress-bar.component.html',
    styleUrls: ['./progress-bar.component.scss']
})
export class ProgressBarComponent implements OnInit {
    @Input()
    percent: number = 0;

    get percentStr(): string {
        return this.percent.toFixed(1) + '%';
    }

    constructor() {
    }

    ngOnInit(): void {
    }
}

