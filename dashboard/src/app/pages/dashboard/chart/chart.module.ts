import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NgxEchartsModule } from 'ngx-echarts';
import { ChartComponent } from './chart.component';
import { ChartRoutingModule } from './chart-routing.module';
import { GroupTableComponent } from './group-table/group-table.component';
import { GroupGraphComponent } from './group-graph/group-graph.component';
import { ButtonsCellComponent } from './group-table/buttons-cell.component';
import { NbAlertModule, NbButtonModule, NbCardModule, NbIconModule, NbInputModule, NbSpinnerModule } from '@nebular/theme';
import { Ng2SmartTableModule } from 'ng2-smart-table';



@NgModule({
    declarations: [
        ChartComponent,
        GroupTableComponent,
        GroupGraphComponent,
        ButtonsCellComponent,
    ],
    imports: [
        CommonModule,
        ChartRoutingModule,
        NbIconModule,
        NbCardModule,
        NbButtonModule,
        NbInputModule,
        Ng2SmartTableModule,
        NbSpinnerModule,
        NbAlertModule,
        NgxEchartsModule.forRoot({
            echarts: () => import('echarts')
        }),
    ]
})
export class ChartModule { }
