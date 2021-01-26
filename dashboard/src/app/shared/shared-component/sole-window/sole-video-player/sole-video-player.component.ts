import { Component, Input, OnInit } from '@angular/core';
import { SoleWindowClickClose } from '../sole-window-click-close';

@Component({
    selector: 'app-sole-video-player',
    templateUrl: './sole-video-player.component.html',
    styleUrls: ['./sole-video-player.component.scss']
})
export class SoleVideoPlayerComponent extends SoleWindowClickClose implements OnInit {
    @Input('src')
    src: string;
    constructor() {
        super();
    }

    ngOnInit(): void {
    }
}

