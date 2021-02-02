import { Component, Input, OnInit } from '@angular/core';
import { DownloadTask } from 'src/app/shared/common';

@Component({
    selector: 'app-download-task',
    templateUrl: './download-task.component.html',
    styleUrls: ['./download-task.component.scss']
})
export class DownloadTaskComponent implements OnInit {
    @Input('task')
    task: DownloadTask;

    constructor() { }

    ngOnInit(): void {
    }
}

