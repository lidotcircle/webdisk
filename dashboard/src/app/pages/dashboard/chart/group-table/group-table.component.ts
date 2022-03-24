import { Component, OnInit, ViewEncapsulation } from '@angular/core';
import { NbToastrService, NbWindowService } from '@nebular/theme';
import { LocalDataSource } from 'ng2-smart-table';
import { DataRecordService } from 'src/app/service/data-record.service';
import { ConfirmWindowComponent } from 'src/app/shared/shared-component/confirm-window.component';
import { ButtonsCellComponent } from './buttons-cell.component';


type DataType = { group: string };
@Component({
    selector: 'app-group-table',
    templateUrl: './group-table.component.html',
    styleUrls: ['./group-table.component.scss'],
    encapsulation: ViewEncapsulation.None,
})
export class GroupTableComponent implements OnInit {
    settings = {
        actions: {
            columnTitle: 'operation',
            add: false,
            edit: false,
            delete: true,
            position: 'right',
        },
        noDataMessage: 'group not found',
        sort: true,
        delete: {
            deleteButtonContent: '<i class="nb-trash"></i>',
            confirmDelete: true,
        },
        rowClassFunction: () => 'data-row',
        columns: {
            buttons: {
                title: 'view',
                width: '4em',
                editable: false,
                type: 'custom',
                renderComponent: ButtonsCellComponent,
            },
            group: {
                title: 'Group',
                filter: true,
                type: 'text',
            },
        },
    };

    source: LocalDataSource;
    constructor(private toastrService: NbToastrService,
                private windowService: NbWindowService,
                private dataRecordService: DataRecordService)
    {
        this.source = new LocalDataSource();
        this.refresh();
    }

    ngOnInit(): void { }

    private async refresh() {
        try {
            const groups = await this.dataRecordService.getGroups();
            this.source.load(groups.map(v => { return { group: v  }; }));
        } catch (e) {
            this.toastrService.danger(e.message ||  "failed to get group list", "Group");
        }
    }

    async onDeleteConfirm(event: {
        data: { group: string }, 
        source: LocalDataSource,
        confirm: {resolve: (data:  DataType ) => void, reject: () => void},
    })
    {
        const win = this.windowService.open(ConfirmWindowComponent, {
            title: `delete ${event.data.group}`,
            context: {}
        });
        await win.onClose.toPromise();
        if(win.config.context['isConfirmed']) {
            try {
                await this.dataRecordService.deleteGroup(event.data.group);
                event.confirm.resolve(event.data);
            } catch (err) {
                this.toastrService.danger(err.message || "failed to delete group", "Group");
                event.confirm.reject();
            }
        }
    }
}
