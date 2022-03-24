import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { Exception403Component, Exception404Component, Exception500Component } from './components';
import { ExceptionLayoutComponent } from './exception-layout.component';

const routes: Routes = [
    {
        path: '',
        component: ExceptionLayoutComponent,
        children: [
            {
                path: 'not-found',
                component: Exception404Component,
            },
            {
                path: 'forbidden',
                component: Exception403Component,
            },
            {
                path: 'internal-server-error',
                component: Exception500Component,
            },
            {
                path: '',
                pathMatch: 'full',
                redirectTo: 'not-found',
            },
        ],
    },
];

@NgModule({
    imports: [RouterModule.forChild(routes)],
    exports: [RouterModule]
})
export class ExceptionRoutingModule { }

