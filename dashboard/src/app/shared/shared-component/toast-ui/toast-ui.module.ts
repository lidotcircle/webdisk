import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TuiEditorComponent } from './tui-editor/tui-editor.component';
import { TuiViewerComponent } from './tui-viewer/tui-viewer.component';


@NgModule({
    declarations: [
        TuiEditorComponent, TuiViewerComponent,
    ],
    imports: [
        CommonModule,
    ],
    exports: [
        TuiEditorComponent, TuiViewerComponent,
    ]
})
export class ToastUIModule { }

