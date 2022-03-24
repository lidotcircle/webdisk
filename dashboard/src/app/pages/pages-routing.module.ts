import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { AuthDomainGuard, DashboardDomainGuard } from 'src/app/core/guard';

const routes: Routes = [
    {
        path: 'auth',
        loadChildren: () => import('./auth/auth.module')
        .then(m => m.AuthModule),
        canActivate: [ AuthDomainGuard ],
    },
    {

        path: 'dashboard',
        loadChildren: () => import('./dashboard/dashboard.module')
        .then(m => m.DashboardModule),
        canActivate: [ DashboardDomainGuard ],
    },
    {

        path: 'exception',
        loadChildren: () => import('./exception/exception.module')
        .then(m => m.ExceptionModule),
    },
    {
        path: '',
        pathMatch: 'full',
        redirectTo: 'auth'
    },
    {
        path: '**',
        redirectTo: 'exception',
    },
];

@NgModule({
    imports: [RouterModule.forChild(routes)],
    exports: [RouterModule]
})
export class WebdiskRoutingModule { }
