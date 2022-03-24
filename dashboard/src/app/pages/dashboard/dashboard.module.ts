import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DashboardRoutingModule } from './dashboard-routing.module';
import { LayoutModule } from '../../layout/layout.module';
import { ThemeModule } from 'src/app/@theme/theme.module';
import { NbLayoutModule, NbMenuModule } from '@nebular/theme';
import { DashboardComponent } from './dashboard.component';


@NgModule({
    declarations: [ DashboardComponent ],
    imports: [
        CommonModule,
        ThemeModule,
        NbLayoutModule,
        LayoutModule,
        NbMenuModule,
        DashboardRoutingModule,
    ]
})
export class DashboardModule { }
