import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';

import { HomeRoutingModule } from './home-routing.module';
import { SharedModule } from 'src/app/shared/shared.module';
import { HomeComponent } from './home.component';
import { ToolComponent } from './tool/tool.component';
import { FileComponent } from './file/file.component';


@NgModule({
    declarations: [ HomeComponent, ToolComponent, FileComponent ],
    imports: [
        CommonModule,
        HomeRoutingModule,
        MatInputModule,
        MatIconModule,
        MatButtonModule,
        SharedModule
    ]
})
export class HomeModule { }

