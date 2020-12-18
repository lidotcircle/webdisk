import { ElementRef } from '@angular/core';
import { AbsoluteView } from './absolute-view';
import { ViewFullscreen } from './trait/fullscreen';
import { ViewShadowBackground } from './trait/shadow-background';

export class FullScreenViewShadow extends AbsoluteView {
    constructor(protected host: ElementRef) {
        super(host, new ViewFullscreen(), new ViewShadowBackground());
    }
}

