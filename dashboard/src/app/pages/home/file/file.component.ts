import { Component, Input, OnInit, ViewChild, ElementRef, ViewEncapsulation } from '@angular/core';
import { FileStat, FileType } from '../../../shared/common';
import { FiletypeSvgIconService } from 'src/app/shared/service/filetype-svg-icon.service';


@Component({
    selector: 'app-file',
    templateUrl: './file.component.html',
    styleUrls: ['./file.component.scss'],
    encapsulation: ViewEncapsulation.None
})
export class FileComponent implements OnInit {
    @Input('file')
    file: FileStat;
    @ViewChild('fileicon')
    private iconElem: ElementRef;

    constructor(private svgIcon: FiletypeSvgIconService) {}

    ngOnInit(): void {
        if(this.file == null || this.file.filename == null) {
            throw new Error('bad filename');
        }

        const updateIcon = (icon: string) => {
            this.svgIcon.getSvgIcon(icon)
            .then(svg => (this.iconElem.nativeElement as HTMLElement).innerHTML = svg as string)
            .catch(e => {
                console.log("error");
                if(icon != 'blank') {
                    updateIcon('blank');
                }
            });
        }

        if(this.file.filetype == FileType.dir) {
            updateIcon('folder');
        } else if (this.file.extension == '') {
            updateIcon('blank');
        } else {
            updateIcon(this.file.extension);
       }
    }

    get FileName(): string {
        return this.file.basename;
    }

    get FileMTime(): string {
        const date = this.file.mtime;
        return date.toLocaleString();
    }

    get FileMode(): string {
        return 'file mode';
    }

    get FileSize(): string {
        return 'file size';
    }
}

