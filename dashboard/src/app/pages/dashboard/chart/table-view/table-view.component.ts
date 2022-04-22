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
import { OpenFileService } from 'src/app/shared/service/open-file/open-file.service';


let numberoftableview = 0;
const tableviews: TableViewComponent[] = [];
@Component({
    template: `
    <ngx-prismjs *ngIf='data_as_code' theme='default-transparent' [code]='data' [language]='datatype'></ngx-prismjs>
    <div         *ngIf='data_as_log' [status]='logStatus'>
       <span [style]='logStyle'>{{ logLevel }}</span>
       {{ logText }}
    </div>
    <div         *ngIf='data_as_image' class='col-view'>
        <div *ngIf='!image_loaded' class='row-view'>
            <button nbButton size='tiny' status="primary" (click)='loadImage()'>Load</button>
            <div class='image-name'> {{ imageName }} </div>
        </div>

        <div *ngIf='image_loaded' class='col-view'>
            <img [src]='imageUrl'/>
            <div class='row-view'>
                <button nbButton size='tiny' status="primary" (click)='viewImage()'>View</button>
                <div class='image-name'> {{ imageName }} </div>
            </div>
        </div>
    </div>
    `,
    styles: [`
    .col-view {
        display: flex;
        flex-direction: column;
        align-items: center;
    }

    .row-view {
        display: flex;
        flex-direction: row;
        align-items: center;
    }

    .image-name {
        font-weight: bold;
        padding: 0em 0.5em;
    }

    img {
        max-width: 250px;
        max-height: 200px;
        margin-bottom: 0.5em;
    }
    `],
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RecordViewComponent implements ViewCell, OnInit {
    constructor(private ref: ChangeDetectorRef,
                private openfileservice: OpenFileService) {}

    data: string;
    datatype: string;
    @Input() value: string | number;
    @Input() rowData: { data: string; datatype: string; };

    ngOnInit() {
        this.update_options(this.rowData);
        const viewer = tableviews[this.rowData['viewid']];
        viewer.viewer_init(this);
    }

    // code
    data_as_code: boolean;

    // log
    data_as_log: boolean;
    logLevel: string;
    logText: string;
    logStyle: string;


    // image url
    data_as_image: boolean;
    imageName: string;
    imageUrl: string;
    image_loaded: boolean = false;
    loadImage() {
        this.image_loaded = true;
    }
    async viewImage() {
        await this.openfileservice.createImage({
            images: [ this.imageUrl ],
            index: 0,
        }).wait();
    }

    private clear_components() {
        this.data_as_code = false;
        this.data_as_log = false;
        this.data_as_image = false;
    }

    update_options(options: any) {
        this. data = options['data'] || this.data || '';
        try {
            this.data = JSON.stringify(JSON.parse(this.data), null, 2);
        } catch {}
        this.datatype = options['datatype'] || this.datatype || '';
        this.ref.markForCheck();

        this.clear_components();
        switch (this.datatype) {
            case 'log': {
                this.data_as_log = true;
                try {
                    const obj = JSON.parse(this.data);
                    this.logLevel = obj.level || 'info';
                    this.logText = obj.message || '';
                } catch {}
                switch (this.logLevel) {
                    case 'debug': this.logStyle = 'text-align:center;color:#3db744;font-weight:bold;padding-right:1em;'; break;
                    case 'info':  this.logStyle = 'text-align:center;color:#0095ff;font-weight:bold;padding-right:1em;'; break;
                    case 'warning':
                    case 'warn':  this.logStyle = 'text-align:center;color:#ffaa00;font-weight:bold;padding-right:1em;'; break;
                    case 'error':
                    default:      this.logStyle = 'text-align:center;color:#edf1f7;font-weight:bold;padding-right:1em;'; break;
                }
            } break;
            case 'image': {
                this.data_as_image = true;
                try {
                    const obj = JSON.parse(this.data);
                    this.imageUrl = obj.url || '';
                    this.imageName = obj.name || '';
                } catch {}
            } break;
            default:
                this.data_as_code = true;
        }
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
        this.settings = {};
    }

    private setup_settings() {
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
                page: this.pageno,
                perPage: this.pagesize,
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
        let setuped: boolean = false;
        this.activatedRoute.queryParamMap.subscribe(async (params) => {
            const group = params.get("group");
            const pageno = params.get("pageno");
            const pagesize = params.get("pagesize")
            const config = await this.localstorage.get(`table-view-config?group=${group}`) as any;
            if (config) {
                this.datatype = config.datatype || this.datatype;
            }

            if (!setuped) {
                setuped = true;
                this.setup_settings();
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

            if (this.source) {
                const paging: {page: number, perPage: number} = this.source.getPaging();
                if (paging.page != this.pageno || paging.perPage != this.pagesize) {
                    this.source.setPaging(this.pageno, this.pagesize, true);
                }
            }

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
