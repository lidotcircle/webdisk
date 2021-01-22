import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { UserSettingsComponent } from './user-settings.component';
import { UserSettingsRoutingModule } from './user-settings-routing.module';
import { SharedModule } from 'src/app/shared/shared.module';
import { UserAccountComponent } from './user-account/user-account.component';
import { SubAccountsComponent } from './sub-accounts/sub-accounts.component';
import { FileOperationsComponent } from './file-operations/file-operations.component';
import { DisplayComponent } from './display/display.component';
import { AboutComponent } from './about/about.component';
import { WrapperComponent } from './wrapper/wrapper.component';


@NgModule({
    declarations: [
        UserSettingsComponent,
        UserAccountComponent,
        SubAccountsComponent,
        FileOperationsComponent,
        DisplayComponent,
        AboutComponent,
        WrapperComponent
    ],
    imports: [
        CommonModule,
        SharedModule,
        UserSettingsRoutingModule
    ]
})
export class UserSettingsModule { }

