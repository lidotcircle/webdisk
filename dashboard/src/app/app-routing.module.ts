import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { NotLoginGuard } from './guard/not-login.guard';
import { HomeGuard } from './guard/home.guard';

const routes: Routes = [
    {
        path: '',
        pathMatch: 'full',
        redirectTo: 'passport'
    },
    {
        path: 'passport',
        loadChildren: () => import('./pages/passport/passport.module').then(m => m.PassportModule),
        canActivate: [ NotLoginGuard ]
    },
    {
        path: 'home',
        loadChildren: () => import('./pages/home/home.module').then(m => m.HomeModule),
        canActivate: [ HomeGuard ]
    },
    {
        path: 'settings',
        loadChildren: () => import('./pages/user-settings/user-settings.module').then(m => m.UserSettingsModule),
        canActivate: [ HomeGuard ]
    },
    {
        path: 'download',
        loadChildren: () => import('./pages/download/download.module').then(m => m.DownloadModule),
        canActivate: [ HomeGuard ]
    }
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }

