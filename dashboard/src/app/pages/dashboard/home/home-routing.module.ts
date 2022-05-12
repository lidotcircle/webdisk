import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { NamedLinkComponent } from './named-link/named-link.component';
import { ExplorerComponent } from './explorer/explorer.component';
import { HomeComponent } from './home.component';
import { StorageBackendComponent } from './storage-backend/storage-backend.component';


const routes: Routes = [
    {
        path: '',
        component: HomeComponent,
        children: [
            {
                path: '',
                pathMatch: 'full',
                redirectTo: 'explorer'
            },
            {
                path: 'explorer',
                component: ExplorerComponent,
            },
            {
                path: 'namedlink',
                component: NamedLinkComponent,
            },
            {
                path: 'storage',
                component: StorageBackendComponent,
            }

        ]
    }
];

@NgModule({
    imports: [RouterModule.forChild(routes)],
    exports: [RouterModule]
})
export class HomeRoutingModule { }

