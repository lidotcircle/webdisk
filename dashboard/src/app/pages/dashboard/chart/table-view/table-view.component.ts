import { Component, OnInit, Input, ViewEncapsulation, OnDestroy, ChangeDetectorRef, ChangeDetectionStrategy } from '@angular/core';
import { ServerDataSource } from 'ng2-smart-table';
import { ActivatedRoute, Router } from '@angular/router';
import { NbToastrService } from '@nebular/theme';
import { ViewCell } from 'ng2-smart-table';
import { Subject } from 'rxjs';
import { HttpClient, HttpParams, HttpResponse } from '@angular/common/http';
import { RESTfulAPI } from 'src/app/restful';
import { map, takeUntil } from 'rxjs/operators';
import { AsyncLocalStorageService } from 'src/app/shared/service/async-local-storage.service';


let numberoftableview = 0;
const tableviews: TableViewComponent[] = [];
@Component({
    template: `
    <ngx-prismjs [code]='data' [language]='datatype'></ngx-prismjs>
    `,
    styles: [``],
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RecordViewComponent implements ViewCell, OnInit {
    constructor(private ref: ChangeDetectorRef) {}

    data: string;
    datatype: string;
    @Input() value: string | number;
    @Input() rowData: { data: string; datatype: string; };

    ngOnInit() {
        this.update_options(this.rowData);
        const viewer = tableviews[this.rowData['viewid']];
        viewer.viewer_init(this);
    }

    update_options(options: any) {
        this. data = options['data'] || this.data || '';
        try {
            this.data = JSON.stringify(JSON.parse(this.data), null, 2);
        } catch {}
        this.datatype = options['datatype'] || this.datatype || '';
        this.ref.markForCheck();
    }
}


@Component({
    selector: 'app-table-view',
    templateUrl: './table-view.component.html',
    styleUrls: ['./table-view.component.scss'],
    encapsulation: ViewEncapsulation.None,
})
export class TableViewComponent implements OnInit, OnDestroy {
    settings: any;
    datatype: string;
    pagesize: number;
    pageno: number;
    source: ServerDataSource;
    private viewerlist: RecordViewComponent[];
    private viewid: number;

    get pagenoinfo(): string {
        if (!this.source) return '';
        if (this.source.count() == 0) return '0';

        return this.pageno.toString() + '/' + Math.ceil(this.source.count() / this.pagesize).toString();
    }

    viewer_init(viewer: RecordViewComponent) {
        this.viewerlist.push(viewer);
    }

    select_options_change(_event: any) {
        this.datatype = _event;
        for (const viewer of this.viewerlist) {
            viewer.update_options({
                datatype: this.datatype,
            });
        }
        this.localstorage.set(`table-view-config?group=${this.group}`, {
            datatype: this.datatype,
        });
    }

    page_options_change(_event: any) {
        this.router.navigate([], {
            queryParams: {
                pageno: this.pageno,
                pagesize: this.pagesize,
            },
            relativeTo: this.activatedRoute,
            queryParamsHandling: 'merge',
        }).then(() => {
            this.source.setPaging(this.pageno, this.pagesize, true);
        });
    }

    private group: string;
    private destroy$: Subject<void>;

    constructor(private toastrService: NbToastrService,
                private router: Router,
                private activatedRoute: ActivatedRoute,
                private localstorage: AsyncLocalStorageService,
                private http: HttpClient)
    {
        this.viewid = numberoftableview++;
        tableviews.push(this);
        this.destroy$ = new Subject();
        this.datatype = "text";
        this.pagesize = 10;
        this.pageno = 1;
        this.settings  = {
            actions: null,
            noDataMessage: 'empty',
            sort: false,
            columns: {
                date: {
                    title: 'Date',
                    type: 'text',
                    filter: false,
                },
                data: {
                    title: 'Record',
                    editable: false,
                    filter: false,
                    type: 'custom',
                    renderComponent: RecordViewComponent,
                },
            },
            pager: {
                page: 1,
                perPage: 10,
                display: true,
            },
        };
    }

    ngOnDestroy(): void {
        this.destroy$.next();
        this.destroy$.complete();
        tableviews[this.viewid] = undefined;
    }

    ngOnInit(): void {
        this.activatedRoute.queryParamMap.subscribe(async (params) => {
            const group = params.get("group");
            const pageno = params.get("pageno");
            const pagesize = params.get("pagesize")
            const config = await this.localstorage.get(`table-view-config?group=${group}`) as any;
            if (config) {
                this.datatype = config.datatype || this.datatype;
            }

            if (pageno) {
                const pno = Number(pageno) || 1;
                this.settings.pager.page = pno;
            }

            this.pageno = this.settings.pager.page;
            if (pagesize) {
                this.settings.pager.perPage = pagesize;
            }
            this.pagesize = this.settings.pager.perPage;

            if(group == null) {
                this.toastrService.danger("page error", "error");
            } else {
                this.group = group;
                this.initSource();
            }
        });
    }

    private initSource() {
        if (this.source) return;
        const _this = this;
        const http = new Proxy(this.http, {
            get: (target, prop) => {
                if(prop === 'get') {
                    return function (url: string, options: any) {
                        const params: HttpParams = options.params;
                        options.params = params.set('group', _this.group);
                        return target.get(url, options)
                            .pipe(map((result: any) => {
                                const resp = result as HttpResponse<{data: any[], count: number}>;
                                if (resp.status >= 400)
                                    return resp;

                                const datas = resp.body.data;
                                const newdatas = [];
                                for (let data of datas) {
                                    if (typeof(data) === 'string') {
                                        data = { data: data };
                                    }
                                    if (data['date'] == null) {
                                        data['date'] = 'NoPresented';
                                    } else {
                                        const d = new Date(data['date']);
                                        data['date'] = d.toLocaleString();
                                    }
                                    data["datatype"] = _this.datatype;
                                    data["viewid"] = _this.viewid;
                                    newdatas.push(data);
                                }
                                resp.body.data = newdatas;
                                _this.viewerlist = [];
                                return resp;
                            }));
                    }
                } else {
                    return target[prop];
                }
            }
        });

        this.source = new ServerDataSource(http, {
            endPoint: RESTfulAPI.DataRecord.groupData,
            pagerPageKey: 'pageno',
            pagerLimitKey: 'pagesize',
            // sortFieldKey: 'sort',
            // sortDirKey: 'sortDir',
            // filterFieldKey: '#field#',
            dataKey: 'data',
            totalKey: 'count',
        });

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
}
