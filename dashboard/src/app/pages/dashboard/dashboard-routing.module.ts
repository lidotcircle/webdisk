import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { DashboardComponent } from './dashboard.component';


const routes: Routes = [
    {
        path: '',
        component: DashboardComponent,
        children: [
            {
                path: '',
                pathMatch: 'full',
                redirectTo: 'home'
            },
            {
                path: 'home',
                loadChildren: () => import('./home/home.module').then(m => m.HomeModule),
            },
            {
                path: 'settings',
                loadChildren: () => import('./user-settings/user-settings.module').then(m => m.UserSettingsModule),
            },
            {
                path: 'download',
                loadChildren: () => import('./download/download.module').then(m => m.DownloadModule),
            },
            {
                path: 'store-pass',
                loadChildren: () => import('./store-pass/store-pass.module').then(m => m.StorePassModule),
            },
            {
                path: 'chart',
                loadChildren: () => import('./chart/chart.module').then(m => m.ChartModule),
            },
        ]
    }
];

@NgModule({
    imports: [RouterModule.forChild(routes)],
    exports: [RouterModule]
})
export class DashboardRoutingModule { }
