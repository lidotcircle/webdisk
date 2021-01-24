import { Component, Input, OnInit } from '@angular/core';

@Component({
    selector: 'app-video-player',
    templateUrl: './video-player.component.html',
    styleUrls: ['./video-player.component.scss']
})
export class VideoPlayerComponent implements OnInit {
    @Input('src')
    source: string;
    constructor() { 
    }

    ngOnInit(): void {
    }

    onPlaybackReady() {
    }
}

