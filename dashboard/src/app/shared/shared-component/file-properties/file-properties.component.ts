import { Component, Input, OnInit } from '@angular/core';
import { FileStat } from '../../common';

@Component({
    selector: 'app-file-properties',
    templateUrl: './file-properties.component.html',
    styleUrls: ['./file-properties.component.scss']
})
export class FilePropertiesComponent implements OnInit {
    @Input()
    filestat: FileStat;

    constructor() { }
    ngOnInit(): void {
    }
}

