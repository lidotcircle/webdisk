import { Component, Input, OnInit } from '@angular/core';
import { FileStat } from '../../../shared/common';


@Component({
    selector: 'app-file',
    templateUrl: './file.component.html',
    styleUrls: ['./file.component.scss']
})
export class FileComponent implements OnInit {
    @Input('file')
    private file: FileStat;

    constructor() {}

    ngOnInit(): void {
        if(this.file == null || this.file.filename == null) {
            throw new Error('bad filename');
        }
    }

    get FileType(): string {
        return '';
    }

    get FileName(): string {
        return '';
    }

    get FileMTime(): string {
        return '';
    }

    get FileMode(): string {
        return '';
    }

    get FileSize(): string {
        return '';
    }
}

