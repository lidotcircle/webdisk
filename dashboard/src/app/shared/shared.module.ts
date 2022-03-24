import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { MatInputModule } from '@angular/material/input';
import { NbActionsModule, NbAlertModule, NbButtonModule, NbCardModule, NbCheckboxModule, NbDatepickerModule, NbIconModule, NbInputModule, NbLayoutModule, NbListModule, NbRadioModule, NbSelectModule, NbSpinnerModule, NbTimepickerModule, NbUserModule } from '@nebular/theme';
import { ThemeModule } from '../@theme/theme.module';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { FormsModule } from '@angular/forms';
import { SharedComponentModule } from './shared-component/shared-component.module';
import { SharedDirectiveModule } from './shared-directive/shared-directive.module';
import { HttpClientModule } from '@angular/common/http';
import { SwiperModule } from 'swiper/angular';


@NgModule({
    declarations: [],
    imports: [
        CommonModule,
    ],
    exports: [
        MatInputModule,
        MatCheckboxModule,
        MatButtonModule,
        MatIconModule,
        SwiperModule,
        SharedDirectiveModule,
        SharedComponentModule,
        FormsModule,
        HttpClientModule,
        ThemeModule,
        NbDatepickerModule,
        NbTimepickerModule,
        NbActionsModule,
        NbSpinnerModule,
        NbSelectModule,
        NbListModule,
        NbLayoutModule,
        NbRadioModule,
        NbUserModule,
        NbIconModule,
        NbCardModule,
        NbAlertModule,
        NbInputModule,
        NbButtonModule,
        NbCheckboxModule,
    ]
})
export class SharedModule { }
