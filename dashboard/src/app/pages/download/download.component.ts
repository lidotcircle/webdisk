import { Component, OnDestroy, OnInit } from '@angular/core';
import { Subscription } from 'rxjs';
import { DownloadTask } from 'src/app/shared/common';
import { DownloadManagerService } from 'src/app/shared/service/download/download-manager.service';

@Component({
    selector: 'app-download',
    templateUrl: './download.component.html',
    styleUrls: ['./download.component.scss']
})
export class DownloadComponent implements OnInit, OnDestroy {
    tasks: DownloadTask[] = [];
    constructor(private downloadservice: DownloadManagerService) { }

    ngOnDestroy(): void {
        this.subscription.unsubscribe();
    }

    subscription: Subscription;
    ngOnInit(): void //{
    {
        this.subscription = this.downloadservice.update.subscribe(v => {
            if(v == null) {
                this.tasks = [];
                for(const tid of this.downloadservice.taskIDs) {
                    this.tasks.push(this.downloadservice.queryByTaskID(tid));
                }
            } else {
                for(const task of this.tasks) {
                    if(task.taskId == v) {
                        const nt = this.downloadservice.queryByTaskID(v);
                        Object.assign(task, nt);
                    }
                }
            }
        });
    } //}

    async newtask() {
        await this.downloadservice.createTaskWithUI();
    }
}
