import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { HomeRoutingModule } from './home-routing.module';
import { SharedModule } from 'src/app/shared/shared.module';
import { HomeComponent } from './home.component';
import { ToolComponent } from './tool/tool.component';
import { FileViewModule } from './file-view/file-view.module';


@NgModule({
    declarations: [ HomeComponent, ToolComponent ],
    imports: [
        CommonModule,
        HomeRoutingModule,
        SharedModule,
        FileViewModule
    ]
})
export class HomeModule {}

