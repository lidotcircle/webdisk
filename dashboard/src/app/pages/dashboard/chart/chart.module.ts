import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NgxEchartsModule } from 'ngx-echarts';
import { ChartComponent } from './chart.component';
import { ChartRoutingModule } from './chart-routing.module';
import { GroupTableComponent, ButtonsCellComponent } from './group-table/group-table.component';
import { GroupGraphComponent } from './group-graph/group-graph.component';
import { NbAlertModule, NbButtonModule, NbCardModule, NbCheckboxModule, NbIconModule, NbInputModule, NbSelectModule, NbSpinnerModule } from '@nebular/theme';
import { Ng2SmartTableModule } from 'ng2-smart-table';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatInputModule } from '@angular/material/input';
import { MatSliderModule } from '@angular/material/slider';
import { MatFormFieldModule } from '@angular/material/form-field';
import { FormsModule } from '@angular/forms';
import { AddDataComponent } from './add-data/add-data.component';
import { MonacoEditorModule } from 'ngx-monaco-editor';
import { SharedModule } from 'src/app/shared/shared.module';
import { RecordViewComponent, TableViewComponent } from './table-view/table-view.component';


@NgModule({
    declarations: [
        ChartComponent,
        GroupTableComponent,
        GroupGraphComponent,
        TableViewComponent,
        RecordViewComponent,
        ButtonsCellComponent,
        AddDataComponent,
    ],
    imports: [
        CommonModule,
        ChartRoutingModule,
        SharedModule,
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
        NbSelectModule,
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
