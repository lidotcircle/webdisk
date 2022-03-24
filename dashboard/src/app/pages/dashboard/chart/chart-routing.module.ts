import { NgModule } from '@angular/core';
import { Routes, RouterModule} from '@angular/router';
import { ChartComponent } from './chart.component';
import { GroupGraphComponent } from './group-graph/group-graph.component';
import { GroupTableComponent } from './group-table/group-table.component';


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
            }
        ]
    }
];

@NgModule({
    imports: [RouterModule.forChild(routes)],
    exports: [RouterModule]
})
export class ChartRoutingModule { }
