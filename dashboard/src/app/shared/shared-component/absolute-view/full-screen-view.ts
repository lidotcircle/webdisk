import { ElementRef } from '@angular/core';
import { AbsoluteView } from './absolute-view';
import { ViewFullscreen } from './trait/fullscreen';

export class FullScreenView extends AbsoluteView {
    constructor(protected host: ElementRef) {
        super(host, new ViewFullscreen());
    }
}

