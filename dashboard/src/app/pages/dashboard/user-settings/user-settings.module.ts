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
import { SettingItemComponent } from './setting-item/setting-item.component';
import { CheckboxComponent } from './setting-item/checkbox/checkbox.component';
import { InputComponent } from './setting-item/input/input.component';
import { NbCardModule } from '@nebular/theme';
import { SelectComponent } from './setting-item/select/select.component';
import { MiscComponent } from './misc/misc.component';
import { TranslocoRootModule } from 'src/app/transloco-root.module';
import { ProfilePhotoUploadComponent } from './user-account/profile-photo-upload.component';


@NgModule({
    declarations: [
        UserSettingsComponent,
        UserAccountComponent,
        SubAccountsComponent,
        FileOperationsComponent,
        DisplayComponent,
        AboutComponent,
        WrapperComponent,
        SettingItemComponent,
        CheckboxComponent,
        InputComponent,
        SelectComponent,
        MiscComponent,
        ProfilePhotoUploadComponent,
    ],
    imports: [
        CommonModule,
        SharedModule,
        NbCardModule,
        TranslocoRootModule,
        UserSettingsRoutingModule
    ]
})
export class UserSettingsModule { }

