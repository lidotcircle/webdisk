import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { DownloadRoutingModule } from './download-routing.module';
import { DownloadComponent } from './download.component';
import { SharedModule } from 'src/app/shared/shared.module';
import { DownloadTaskComponent } from './download-task/download-task.component';


@NgModule({
    declarations: [DownloadComponent, DownloadTaskComponent],
    imports: [
        CommonModule,
        SharedModule,
        DownloadRoutingModule
    ]
})
export class DownloadModule { }
