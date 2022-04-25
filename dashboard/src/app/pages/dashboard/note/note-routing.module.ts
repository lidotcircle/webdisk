import { NgModule } from '@angular/core';
import { Routes, RouterModule} from '@angular/router';
import { MarkdownComponent } from './markdown/markdown.component';
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
                path: 'markdown',
                component: MarkdownComponent,
            },
        ]
    }
];

@NgModule({
    imports: [RouterModule.forChild(routes)],
    exports: [RouterModule]
})
export class NoteRoutingModule { }
