import { Component, Input, OnInit } from '@angular/core';


@Component({
    selector: 'app-download-progress-bar',
    template: `
    <div class="outer">
        <div class="inner" [style]='"width: " + percentStr + ";"'></div>
        <div class="percent">{{ percentStr }}</div>
    </div>
    `,
    styles: ['']
})
export class DownloadProgressBarComponent implements OnInit {
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

