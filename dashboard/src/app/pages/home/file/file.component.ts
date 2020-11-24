import { Component, Input, OnInit } from '@angular/core';
import { FileStat } from '../../../shared/common';
import { FiletypeSvgIconService } from 'src/app/shared/service/filetype-svg-icon.service';


@Component({
    selector: 'app-file',
    templateUrl: './file.component.html',
    styleUrls: ['./file.component.scss']
})
export class FileComponent implements OnInit {
    @Input('file')
    file: FileStat;

    constructor(private svgIcon: FiletypeSvgIconService) {}

    ngOnInit(): void {
        if(this.file == null || this.file.filename == null) {
            throw new Error('bad filename');
        }

        this.svgIcon.getSvgIcon(this.file.extension).then(e => console.log(e));
    }

    get FileType(): string {
        return 'file type';
    }

    get FileName(): string {
        return 'file name';
    }

    get FileMTime(): string {
        return 'file mtime';
    }

    get FileMode(): string {
        return 'file mode';
    }

    get FileSize(): string {
        return 'file size';
    }
}

