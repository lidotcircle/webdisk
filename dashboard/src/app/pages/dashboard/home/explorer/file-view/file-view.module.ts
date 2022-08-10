import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { SharedModule } from 'src/app/shared/shared.module';
import { FileComponent } from './file/file.component';
import { FileSortComponent } from './file-sort/file-sort.component';
import { DetailViewHeaderComponent } from './detail-view-header/detail-view-header.component';
import { FileViewComponent } from './file-view.component';
import { ToolsComponent } from './tools/tools.component';
import { ToolComponent } from './tools/tool/tool.component';
import { MatPaginatorModule } from '@angular/material/paginator';
import { DragItemDirective, DropDirectoryDirective } from './drag-drop.directive';
import { PathViewerComponent } from './path-viewer/path-viewer.component';
import { TranslocoRootModule } from 'src/app/transloco-root.module';


@NgModule({
    declarations: [
        FileComponent, FileSortComponent, DetailViewHeaderComponent,
        FileViewComponent, ToolsComponent, ToolComponent,
        DragItemDirective, DropDirectoryDirective, PathViewerComponent,
    ],
    imports: [
        CommonModule,
        SharedModule,
        TranslocoRootModule,
        MatPaginatorModule,
    ],
    exports: [
        FileViewComponent
    ]
})
export class FileViewModule {}
