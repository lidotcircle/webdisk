import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { FileViewRoutingModule } from './file-view-routing.module';
import { SharedModule } from 'src/app/shared/shared.module';
import { FileComponent } from './file/file.component';
import { FileSortComponent } from './file-sort/file-sort.component';
import { DetailViewHeaderComponent } from './detail-view-header/detail-view-header.component';
import { FileViewComponent } from './file-view.component';


@NgModule({
    declarations: [FileComponent, FileSortComponent, DetailViewHeaderComponent, FileViewComponent],
    imports: [
        CommonModule,
        FileViewRoutingModule
    ],
    exports: [
        FileViewComponent
    ]
})
export class FileViewModule { }

