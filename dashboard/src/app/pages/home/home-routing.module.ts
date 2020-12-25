import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { HomeComponent } from './home.component';
import { NamedLinkComponent } from './named-link/named-link.component';
import { ToolComponent } from './tool/tool.component';

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
            {
                path: 'namedlink',
                outlet: 'fileview',
                component: NamedLinkComponent
            }
        ]
    }
];

@NgModule({
    imports: [RouterModule.forChild(routes)],
    exports: [RouterModule]
})
export class HomeRoutingModule { }

