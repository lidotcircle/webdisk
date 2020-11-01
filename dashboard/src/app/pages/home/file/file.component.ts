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

