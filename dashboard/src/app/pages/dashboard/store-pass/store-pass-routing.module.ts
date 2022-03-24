import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { StorePassComponent } from './store-pass.component';

const routes: Routes = [
    {
        path: '',
        pathMatch: 'full',
        component: StorePassComponent
    }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class StorePassRoutingModule { }
