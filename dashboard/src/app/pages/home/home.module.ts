import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { HomeRoutingModule } from './home-routing.module';
import { SharedModule } from 'src/app/shared/shared.module';
import { HomeComponent } from './home.component';
import { ToolComponent } from './tool/tool.component';
import { FileComponent } from './file/file.component';
import { FileSortComponent } from './file-sort/file-sort.component';
import { DetailViewHeaderComponent } from './detail-view-header/detail-view-header.component';


@NgModule({
    declarations: [ HomeComponent, ToolComponent, FileComponent, FileSortComponent, DetailViewHeaderComponent ],
    imports: [
        CommonModule,
        HomeRoutingModule,
        SharedModule
    ]
})
export class HomeModule {}
