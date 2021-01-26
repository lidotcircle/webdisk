import { Injectable } from '@angular/core';
import { MatIconRegistry } from '@angular/material/icon';
import { DomSanitizer } from '@angular/platform-browser';

declare const require: any;
const icons = [
    {name: 'iv_zoom_out',     svg: require('!raw-loader!./assets/zoom-out.svg').default},
    {name: 'iv_zoom_in',      svg: require('!raw-loader!./assets/zoom-in.svg').default},
    {name: 'iv_backward',     svg: require('!raw-loader!./assets/backward.svg').default},
    {name: 'iv_forward',      svg: require('!raw-loader!./assets/forward.svg').default},
    {name: 'iv_rotate_left',  svg: require('!raw-loader!./assets/rotate-left.svg').default},
    {name: 'iv_rotate_right', svg: require('!raw-loader!./assets/rotate-right.svg').default},
    {name: 'iv_reset',        svg: require('!raw-loader!./assets/reset.svg').default},
    {name: 'iv_up',           svg: require('!raw-loader!./assets/up.svg').default},
    {name: 'iv_down',         svg: require('!raw-loader!./assets/down.svg').default},
];



@Injectable({
    providedIn: 'root'
})
export class AddMatIconService {
    constructor(private matIconRegistry: MatIconRegistry,
                private domSanitizer: DomSanitizer) {
        icons.forEach(val => this.matIconRegistry.addSvgIconLiteral(val.name, this.domSanitizer.bypassSecurityTrustHtml(val.svg)));
    }
}

