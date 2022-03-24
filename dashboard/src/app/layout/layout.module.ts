import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DefaultComponent } from './default/default.component';
import { SharedModule } from '../shared/shared.module';
import { NbMenuModule } from '@nebular/theme';
import { RouterModule } from '@angular/router';
import { ThemeModule } from '../@theme/theme.module';



@NgModule({
    declarations: [DefaultComponent],
    imports: [
        CommonModule,
        SharedModule,
        NbMenuModule,
        RouterModule,
        ThemeModule,
    ],
    exports: [
        DefaultComponent
    ]
})
export class LayoutModule { }

