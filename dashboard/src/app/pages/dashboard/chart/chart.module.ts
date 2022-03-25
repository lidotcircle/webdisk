import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NgxEchartsModule } from 'ngx-echarts';
import { ChartComponent } from './chart.component';
import { ChartRoutingModule } from './chart-routing.module';
import { GroupTableComponent } from './group-table/group-table.component';
import { GroupGraphComponent } from './group-graph/group-graph.component';
import { ButtonsCellComponent } from './group-table/buttons-cell.component';
import { NbAlertModule, NbButtonModule, NbCardModule, NbCheckboxModule, NbIconModule, NbInputModule, NbSpinnerModule } from '@nebular/theme';
import { Ng2SmartTableModule } from 'ng2-smart-table';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatInputModule } from '@angular/material/input';
import { MatSliderModule } from '@angular/material/slider';
import { MatFormFieldModule } from '@angular/material/form-field';
import { FormsModule } from '@angular/forms';
import { AddDataComponent } from './add-data/add-data.component';
import { MonacoEditorModule } from 'ngx-monaco-editor';


@NgModule({
    declarations: [
        ChartComponent,
        GroupTableComponent,
        GroupGraphComponent,
        ButtonsCellComponent,
        AddDataComponent,
    ],
    imports: [
        CommonModule,
        ChartRoutingModule,
        FormsModule,
        NbIconModule,
        NbCardModule,
        NbButtonModule,
        NbInputModule,
        MatFormFieldModule,
        MonacoEditorModule.forRoot(),
        MatCheckboxModule,
        MatInputModule,
        MatSliderModule,
        NbCheckboxModule,
        Ng2SmartTableModule,
        NbSpinnerModule,
        NbAlertModule,
        NgxEchartsModule.forRoot({
            echarts: () => import('echarts')
        }),
    ]
})
export class ChartModule { }
