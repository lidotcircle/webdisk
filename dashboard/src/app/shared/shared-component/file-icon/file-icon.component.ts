import { Component, ElementRef, Input, OnInit } from '@angular/core';
import { FiletypeSvgIconService, SVGIconStyle } from '../../service/filetype-svg-icon.service';

@Component({
    selector: 'app-file-icon',
    templateUrl: './file-icon.component.html',
    styleUrls: ['./file-icon.component.scss']
})
export class FileIconComponent implements OnInit {
    @Input()
    private icon: string;
    @Input()
    private style: SVGIconStyle;

    constructor(private svgicon: FiletypeSvgIconService,
                private host: ElementRef) { }

    ngOnInit(): void {
        console.assert(this.icon != null);
        this.style = this.style || SVGIconStyle.square_o;

        const updateIcon = (icon: string) => {
            this.svgicon.getSvgIcon(icon, this.style)
                .then(svg => (this.host.nativeElement as HTMLElement).innerHTML = svg as string)
                .catch(e => {
                    if(icon != 'blank') {
                        updateIcon('blank');
                    }
                });
        }

        updateIcon(this.icon);
    }
}

