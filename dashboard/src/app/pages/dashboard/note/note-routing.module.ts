import { NgModule } from '@angular/core';
import { Routes, RouterModule} from '@angular/router';
import { MarkdownEditorComponent } from './markdown-editor/markdown-editor.component';
import { MarkdownNoteHistoryComponent } from './markdown-note-history/markdown-note-history.component';
import { MarkdownViewerComponent } from './markdown-viewer/markdown-viewer.component';
import { NoteTagListComponent } from './note-tag-list/note-tag-list.component';
import { NoteComponent } from './note.component';
import { TimelineComponent } from './timeline/timeline.component';


const routes: Routes = [
    {
        path: '',
        component: NoteComponent,
        children: [
            {
                path: '',
                pathMatch: 'full',
                redirectTo: 'timeline'
            },
            {
                path: 'timeline',
                component: TimelineComponent,
            },
            {
                path: 'tags',
                component: NoteTagListComponent,
            },
            {
                path: 'markdown-editor',
                component: MarkdownEditorComponent,
            },
            {
                path: 'markdown-viewer',
                component: MarkdownViewerComponent,
            },
            {
                path: 'markdown-note-history',
                component: MarkdownNoteHistoryComponent,
            },
        ]
    }
];

@NgModule({
    imports: [RouterModule.forChild(routes)],
    exports: [RouterModule]
})
export class NoteRoutingModule { }
