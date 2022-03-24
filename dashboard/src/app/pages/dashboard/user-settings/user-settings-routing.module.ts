import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { UserSettingsComponent } from './user-settings.component';

const routes: Routes = [
    {
        path: '',
        pathMatch: 'full',
        component: UserSettingsComponent
    }
];

@NgModule({
    imports: [RouterModule.forChild(routes)],
    exports: [RouterModule]
})
export class UserSettingsRoutingModule { }

