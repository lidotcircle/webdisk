import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NbAlertModule, NbButtonModule, NbCardModule, NbCheckboxModule, NbIconModule, NbInputModule, NbRadioModule, NbSelectModule, NbSpinnerModule } from '@nebular/theme';
import { Ng2SmartTableModule } from 'ng2-smart-table';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatInputModule } from '@angular/material/input';
import { MatSliderModule } from '@angular/material/slider';
import { MatFormFieldModule } from '@angular/material/form-field';
import { FormsModule } from '@angular/forms';
import { SharedModule } from 'src/app/shared/shared.module';
import { NoteComponent } from './note.component';
import { RouterModule } from '@angular/router';
import { NoteTagListComponent } from './note-tag-list/note-tag-list.component';
import { TimelineComponent } from './timeline/timeline.component';
import { NoteRoutingModule } from './note-routing.module';
import { NotePreview } from './note-preview/note-preview.component';
import { MarkdownEditorComponent } from './markdown-editor/markdown-editor.component';
import { MarkdownViewerComponent } from './markdown-viewer/markdown-viewer.component';
import { MarkdownNoteHistoryComponent } from './markdown-note-history/markdown-note-history.component';
import { InfiniteScrollModule } from 'ngx-infinite-scroll';
import { TagListComponent } from './tag-list/tag-list.component';


@NgModule({
    declarations: [
        NoteComponent,
        TimelineComponent,
        MarkdownEditorComponent,
        MarkdownViewerComponent,
        MarkdownNoteHistoryComponent,
        NoteTagListComponent,
        NotePreview,
        TagListComponent,
    ],
    imports: [
        NoteRoutingModule,
        RouterModule,
        CommonModule,
        SharedModule,
        FormsModule,
        NbIconModule,
        NbCardModule,
        NbButtonModule,
        NbRadioModule,
        NbInputModule,
        MatFormFieldModule,
        MatCheckboxModule,
        MatInputModule,
        MatSliderModule,
        NbSelectModule,
        NbCheckboxModule,
        Ng2SmartTableModule,
        NbSpinnerModule,
        NbAlertModule,
        InfiniteScrollModule,
    ]
})
export class NoteModule { }
