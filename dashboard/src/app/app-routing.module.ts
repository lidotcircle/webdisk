import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';


const routes: Routes = [
    {
        path: 'wd',
        loadChildren: () => import('./pages/pages.module')
        .then(m => m.WebdiskModule),
    },
    { path: '', redirectTo: 'wd', pathMatch: 'full' },
    { path: '**', redirectTo: 'wd' },
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
