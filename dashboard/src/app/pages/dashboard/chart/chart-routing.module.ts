import { NgModule } from '@angular/core';
import { Routes, RouterModule} from '@angular/router';
import { AddDataComponent } from './add-data/add-data.component';
import { ChartComponent } from './chart.component';
import { GroupGraphComponent } from './group-graph/group-graph.component';
import { GroupTableComponent } from './group-table/group-table.component';
import { TableViewComponent } from './table-view/table-view.component';


const routes: Routes = [
    {
        path: '',
        component: ChartComponent,
        children: [
            {
                path: '',
                pathMatch: 'full',
                redirectTo: 'group-table'
            },
            {
                path: 'group-table',
                component: GroupTableComponent
            },
            {
                path: 'graph',
                component: GroupGraphComponent
            },
            {
                path: 'table-view',
                component: TableViewComponent
            },
            {
                path: 'add-data',
                component: AddDataComponent
            }
        ]
    }
];

@NgModule({
    imports: [RouterModule.forChild(routes)],
    exports: [RouterModule]
})
export class ChartRoutingModule { }
