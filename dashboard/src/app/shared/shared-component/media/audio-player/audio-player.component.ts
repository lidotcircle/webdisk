import { Component, Input, OnInit, ViewChild } from '@angular/core';
import { Track, AudioPlayerComponent as APlayer } from 'ngx-audio-player';

@Component({
    selector: 'app-audio-player',
    templateUrl: './audio-player.component.html',
    styleUrls: ['./audio-player.component.scss']
})
export class AudioPlayerComponent implements OnInit {
    @Input('displayTitle')
    msaapDisplayTitle = true;
    @Input('dispalyPlayerList')
    msaapDisplayPlayList = true;

    msaapPageSizeOptions = [2,4,6];
    msaapDisplayVolumeControls = true;
    msaapDisplayArtist = false;
    msaapDisplayDuration = true;
    msaapDisablePositionSlider = false;
    pageSizeOptions = {};
       
    // Material Style Advance Audio Player Playlist
    @Input('playerList')
    msaapPlaylist: Track[] = [];

    @ViewChild('audioplayer', {static: true})
    private player: APlayer;

    constructor() { }

    ngOnInit(): void {}

    onEnded(event) {
        this.player.nextSong();
    }
}

