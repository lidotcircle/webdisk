import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { HomeComponent } from './home.component';

const routes: Routes = [
    {
        path: '',
        pathMatch: 'full',
        redirectTo: '/home/main/(fileview:fileview)'
    },
    {
        path: 'main',
        component: HomeComponent,

        children: [
            {
                path: 'fileview',
                outlet: 'fileview',
                loadChildren: () => import('./file-view/file-view.module').then(m => m.FileViewModule)
            },
        ]
    }
];

@NgModule({
    imports: [RouterModule.forChild(routes)],
    exports: [RouterModule]
})
export class HomeRoutingModule { }

