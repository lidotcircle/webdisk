import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { ExceptionRoutingModule } from './exception-routing.module';
import { SharedModule } from '../../shared/shared.module';
import { Exception403Component, Exception404Component, Exception500Component, ExceptionComponent } from './components';
import { ExceptionLayoutComponent } from './exception-layout.component';
import { ThemeModule } from 'src/app/@theme/theme.module';
import { NbCardModule, NbLayoutModule } from '@nebular/theme';


@NgModule({
    declarations: [ 
        Exception404Component, Exception403Component, Exception500Component, 
        ExceptionComponent, ExceptionLayoutComponent 
    ],
    imports: [
        CommonModule,
        SharedModule,
        ThemeModule,
        ExceptionRoutingModule,
        NbLayoutModule,
        NbCardModule,
    ]
})
export class ExceptionModule { }

