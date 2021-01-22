import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { MatInputModule } from '@angular/material/input';
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
        FormsModule,
        MatInputModule,
        MatCheckboxModule,
        MatButtonModule,
        MatIconModule,
        HttpClientModule,

        SwiperModule,

        SharedDirectiveModule,
        SharedComponentModule
    ]
})
export class SharedModule { }
