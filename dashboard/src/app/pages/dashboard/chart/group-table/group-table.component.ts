import { Component, OnInit, Input, ViewEncapsulation, OnDestroy } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { NbToastrService, NbWindowService } from '@nebular/theme';
import { LocalDataSource } from 'ng2-smart-table';
import { DataRecordService } from 'src/app/service/data-record.service';
import { ConfirmWindowComponent } from 'src/app/shared/shared-component/confirm-window.component';
import { ViewCell } from 'ng2-smart-table';
import { takeUntil } from 'rxjs/operators';
import { Subject } from 'rxjs';
import { LocalSettingService } from 'src/app/service/user/local-setting.service';
import { AsyncLocalStorageService } from 'src/app/shared/service/async-local-storage.service';
import { TranslocoService } from '@ngneat/transloco';


@Component({
    template: `
      <div class="buttons" *transloco='let t'>
        <button nbButton status='info' size='tiny' (click)='nav_graph()' outline>{{ t('Graph') }}</button>
        <button nbButton status='info' size='tiny' (click)='nav_table()' outline>{{ t('Table') }}</button>
      </div>
    `,
    styles: [
    `
    .buttons {
        display: grid;
        grid-template-columns: auto auto;
        column-gap: 0.3em;
    }
    `
    ]
})
export class ButtonsCellComponent implements ViewCell, OnInit {
    constructor(private router: Router, private activatedRouter: ActivatedRoute) {}

    @Input() value: string | number;
    @Input() rowData: { group: string };

    ngOnInit() {
    }

    async nav_graph() {
        await this.router.navigate(['../graph'], {
            relativeTo: this.activatedRouter,
            queryParams: {
                group: this.rowData.group,
            }
        });
    }

    async nav_table() {
        await this.router.navigate(['../table-view'], {
            relativeTo: this.activatedRouter,
            queryParams: {
                group: this.rowData.group,
            }
        });
    }
}

@Component({
    template: `
      <div class="date">
        {{ datestr}}
      </div>
    `,
    styles: [
    `
    .date {
      text-align: center;
    }
    `
    ]
})
export class DateComponent implements ViewCell, OnInit {
    constructor() {}

    @Input() value: string | number;
    @Input() rowData: { group: string };
    datestr: string;

    ngOnInit() {
        const date = new Date(this.value);
        this.datestr = `${date.toLocaleString()}`;
    }
}

type DataType = { group: string };
@Component({
    selector: 'app-group-table',
    templateUrl: './group-table.component.html',
    styleUrls: ['./group-table.component.scss'],
    encapsulation: ViewEncapsulation.None,
})
export class GroupTableComponent implements OnInit, OnDestroy {
    settings: any;
    source: LocalDataSource;
    private destroy$: Subject<void>;
    private pageno: number;
    private pagesize: number;
    cb_sortbyupdate: boolean = false;
    cb_desc: boolean = false;

    constructor(private toastrService: NbToastrService,
                private localSetting: LocalSettingService,
                private localstorage: AsyncLocalStorageService,
                private translocoService: TranslocoService,
                private router: Router,
                private windowService: NbWindowService,
                private activatedRoute: ActivatedRoute,
                private dataRecordService: DataRecordService)
    {
        this.destroy$ = new Subject();
    }

    async options_change(_event: any)
    {
        this.refresh_data();
        await this.save_config();
    }

    private async save_config()
    {
        const page_config = {
            cb_sortbyupdate: this.cb_sortbyupdate,
            cb_desc: this.cb_desc,
        };
        await this.localstorage.set("grouptable_conf", page_config);
    }

    private async restore_config() {
        const config = await this.localstorage.get("grouptable_conf") as any;
        if (!config) return;

        this.cb_sortbyupdate = config.cb_sortbyupdate;
        this.cb_desc = config.cb_desc;
    }

    sourcecount() {
        if (this.source)
            return this.source.count()
        else
            return 0;
    }

    ngOnInit(): void {
        let setuped: boolean = false;
        this.activatedRoute.queryParamMap.subscribe(async params => {
            await this.restore_config();
            this.pageno = Number(params.get("pageno")) || 1;
            this.pagesize = Number(params.get("pagesize")) || 10
            if (!setuped) {
                setuped = true;
                this.setup_settings(this.pageno, this.pagesize);
                this.refresh();
            }
            if (this.source) {
                const paging: {page: number, perPage: number} = this.source.getPaging();
                if (paging.page != this.pageno || paging.perPage != this.pagesize) {
                    this.source.setPaging(this.pageno, this.pagesize, true);
                }
            }
        });
    }

    ngOnDestroy() {
        this.destroy$.next();
        this.destroy$.complete();
    }

    private init_source() {
        this.source = new LocalDataSource();
        this.source.onChanged()
            .pipe(takeUntil(this.destroy$))
            .subscribe((change: any) => {
                switch (change.action) {
                    case 'page': {
                        const page = change.paging.page;
                        this.router.navigate([], {
                            queryParams: {
                                pageno: page,
                            },
                            relativeTo: this.activatedRoute,
                            queryParamsHandling: 'merge',
                        });
                    }
                }
            });
    }

    private setup_settings(pageno: number, pagesize: number) {
        this.settings = {
            actions: {
                columnTitle: this.translocoService.translate('operation'),
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
                    title: this.translocoService.translate('Buttons'),
                    width: '4em',
                    editable: false,
                    type: 'custom',
                    renderComponent: ButtonsCellComponent,
                },
                createdAt: {
                    title: this.translocoService.translate('CreatedAt'),
                    width: '12em',
                    filter: true,
                    type: 'custom',
                    renderComponent: DateComponent,
                },
                updatedAt: {
                    title: this.translocoService.translate('LastUpdated'),
                    width: '12em',
                    filter: true,
                    type: 'custom',
                    renderComponent: DateComponent,
                },
                group: {
                    title: this.translocoService.translate('Group'),
                    filter: true,
                    type: 'text',
                },
            },
            pager: {
                page: pageno,
                perPage: pagesize,
                display: true,
            },
        };
    }

    private async refresh() {
        try {
            const groups = await this.dataRecordService.getGroups(this.cb_sortbyupdate, this.cb_desc);
            if (!this.source) this.init_source();
            this.source.load(groups);
        } catch (e) {
            this.toastrService.danger(e.message ||  "failed to get group list", "Group");
        }
    }

    async refresh_data() { await this.refresh(); }

    async onDeleteConfirm(event: {
        data: { group: string }, 
        source: LocalDataSource,
        confirm: {resolve: (data:  DataType ) => void, reject: () => void},
    })
    {
        if (!this.localSetting.Group_Delete_Without_Confirm) {
            const win = this.windowService.open(ConfirmWindowComponent, {
                title: `delete ${event.data.group}`,
                context: {}
            });
            await win.onClose.toPromise();
            if (!win.config.context['isConfirmed'])
                return;
        }

        try {
            await this.dataRecordService.deleteGroup(event.data.group);
            event.confirm.resolve(event.data);
        } catch (err) {
            this.toastrService.danger(err.message || "failed to delete group", "Group");
            event.confirm.reject();
        }
    }
}
