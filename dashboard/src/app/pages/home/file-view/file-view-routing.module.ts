import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { FileViewComponent } from './file-view.component';

const routes: Routes = [
    {
        path: '',
        pathMatch: 'full',
        component: FileViewComponent
    }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class FileViewRoutingModule { }
