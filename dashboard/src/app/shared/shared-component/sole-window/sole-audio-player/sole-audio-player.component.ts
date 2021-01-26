import { Component, Input, OnInit } from '@angular/core';
import { Track } from 'ngx-audio-player';
import { SoleWindowClickClose } from '../sole-window-click-close';

@Component({
  selector: 'app-sole-audio-player',
  templateUrl: './sole-audio-player.component.html',
  styleUrls: ['./sole-audio-player.component.scss']
})
export class SoleAudioPlayerComponent extends SoleWindowClickClose implements OnInit {
    @Input('src')
    src: string;
    @Input('title')
    title: string;

    playerList: Track[] = [];
    constructor() {
        super();
    }

    ngOnInit(): void {
        this.playerList = [
            {
                link: this.src,
                title: this.title,
            }
        ];
    }
}

