import { Component, OnDestroy, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { NbToastrService } from '@nebular/theme';
import { EChartsOption } from 'echarts';
import { DataRecordService } from 'src/app/service/data-record.service';
import { AsyncLocalStorageService } from 'src/app/shared/service/async-local-storage.service';
import { utils, writeFile } from 'xlsx';


const xaxis_symbol = Symbol("xaxis")
const createdAt_symbol = Symbol("createat")
@Component({
    selector: 'app-group-graph',
    template: `
    <nb-card [nbSpinner]="loading" nbSpinnerStatus="info" accent="info">
      <nb-card-header>
        {{ group }}
        <div class="control-components">
            <mat-checkbox (change)='options_change($event)' [(ngModel)]='cb_zoomSlider'>Zoom Slider</mat-checkbox>
            <mat-checkbox (change)='options_change($event)' [(ngModel)]='cb_smooth'>Smooth Line</mat-checkbox>
            <mat-form-field>
                <mat-label>naverage</mat-label>
                <input (change)='options_change($event)' matInput type="number" min='1' step='1' [(ngModel)]='data_average'>
            </mat-form-field>
            <button (click)="saveAsXLSX()" class="xlsx-download"><nb-icon icon="download-outline"></nb-icon></button>
        </div>
        <div class="control-components">
            <mat-form-field>
                <mat-label>X-Axis</mat-label>
                <input (change)='options_change($event)' matInput type="text" [(ngModel)]='in_xaxis_name'>
            </mat-form-field>
            <mat-form-field>
                <mat-label>Y-Axis</mat-label>
                <input (change)='options_change($event)' matInput type="text" [(ngModel)]='in_yaxis_name'>
            </mat-form-field>
            <mat-form-field>
                <mat-label>skip</mat-label>
                <input (change)='options_change($event)' matInput type="number" min='0' step='1' [(ngModel)]='data_skipn'>
            </mat-form-field>
            <div>
                <label style='margin: 0em; width: 100%; text-align: center;'>Refresh Frequency {{refresh_sec}}s</label>
                <mat-slider style='width: 100%;' min='1' max='100' step='1' [(ngModel)]='refresh_sec'></mat-slider>
            </div>
        </div>
      </nb-card-header>
      <nb-card-body>
        <div *ngIf='!errorMsg && datasize > 0' echarts [options]="options" [merge]="dynamic_options" class="echart"></div>
        <nb-alert *ngIf='errorMsg' status="danger"><div>{{errorMsg}}</div></nb-alert>
        <nb-alert *ngIf='!errorMsg && datasize == 0' status="info"><div>Nothing In This Group</div></nb-alert>
      </nb-card-body>
    </nb-card>
  `,
    styles: [`
       nb-card {
           height: 100%;
           margin: 0em;
       }

       nb-alert {
           height: 100%;
           font-size: large;
           display: flex;
           justify-content: center;
           flex-direction: column;
           text-align: center;
           margin: 0em;
       }

       .control-components {
           display: flex;
           flex-direction: row;
           align-items: center;
           flex-wrap: wrap;
           justify-content: space-around;
           box-sizing: border-box;
           padding: 0.3em 0.5em;
       }

       .xlsx-download {
           border: none;
           background: transparent;
       }
       .xlsx-download:hover::after {
           position: absolute;
           content: 'save as xlsx';
           transform: translate(0.5em, 0.8em);
           color: #17b;
       }
    `],
})
export class GroupGraphComponent implements OnInit, OnDestroy {
    loading: boolean
    options: EChartsOption;
    dynamic_options: EChartsOption;
    errorMsg: string;
    group: string;
    datasize: number;
    refresh_sec: number;
    timeout: any;
    private u_rawdata_size: number;
    private u_series: any[];
    private u_properties: string[];
    private u_xaxis_data: number[];
    private u_keyvaldatas: Map<string | symbol,number[]>;
    private u_keyvaldatas_after_skip_avg: Map<string | symbol,number[]>;
    cb_zoomSlider: boolean = true;
    cb_smooth: boolean = true;
    in_xaxis_name: string;
    in_yaxis_name: string;
    data_average: number;
    data_skipn: number;

    constructor(private activatedRouter: ActivatedRoute,
                private dataRecordService: DataRecordService,
                private toastrService: NbToastrService,
                private localstorage: AsyncLocalStorageService)
    {
        this.loading = true;
        this.options = {};
        this.errorMsg = null;
        this.datasize = 0;
        this.refresh_sec = 5;
        this.data_average = 1;
        this.data_skipn = 0;
    }

    async options_change(_event: any)
    {
        this.refresh_chart();
        const page_config = {
            refresh_sec: this.refresh_sec,
            data_average: this.data_average,
            data_skipn: this.data_skipn,
            smooth: this.cb_smooth,
            zoomSlider: this.cb_zoomSlider,
            xaxis_name: this.in_xaxis_name,
            yaxis_name: this.in_yaxis_name,
        };
        await this.localstorage.set("grouppage_conf_" + this.group, page_config);
    }

    private async restore_config() {
        const config = await this.localstorage.get("grouppage_conf_" + this.group) as any;
        if (!config) return;

        this.refresh_sec = config.refresh_sec;
        this.data_average = config.data_average;
        this.data_skipn = config.data_skipn;
        this.cb_smooth = config.cb_smooth;
        this.cb_zoomSlider = config.zoomSlider;
        this.in_xaxis_name = config.xaxis_name;
        this.in_yaxis_name = config.yaxis_name;
    }

    private apply_skip_average(before: Map<string | symbol,number[]>, init_apply: boolean):
        [Map<string | symbol,number[]>,number]
    {
        const after = new Map();
        let remain = 0;
        for (const key of before.keys()) {
            const val = before.get(key).slice(init_apply ? this.data_skipn : 0);
            const newval = [];
            while (val.length > 0) {
                if (!init_apply && val.length < this.data_average) {
                    remain = val.length;
                    break;
                }

                const vs = val.splice(0, this.data_average);
                if (typeof(key) === 'string') {
                    newval.push(vs.reduce((a, b) => a + b) / vs.length);
                } else {
                    newval.push(vs[0]);
                }
            }
            after.set(key, newval);
        }

        if (!after.has(this.in_xaxis_name)) {
            const len = after.get(Array.from(after.keys())[0]).length;
            let range_begin = this.data_skipn + 1;
            if (!init_apply) {
                const l = this.u_keyvaldatas_after_skip_avg.get(xaxis_symbol);
                if (l.length > 0) {
                    range_begin = l[l.length - 1] + this.data_average;;
                } else {
                    range_begin = 1;
                }
            }

            const xaxis_val = this.range(range_begin, range_begin + len * this.data_average, this.data_average);
            after.set(xaxis_symbol, xaxis_val);
        } else {
            const vals = after.get(this.in_xaxis_name);
            after.delete(this.in_xaxis_name);
            after.set(xaxis_symbol, vals);
        }

        return [after, remain];
    }


    private refresh_chart()
    {
        const [ newdatas, _ ] = this.apply_skip_average(this.u_keyvaldatas, true);
        this.u_keyvaldatas_after_skip_avg = newdatas;
        this.u_xaxis_data = this.u_keyvaldatas_after_skip_avg.get(xaxis_symbol);

        this.u_properties = [];
        this.u_series = [];
        for (const key of this.u_keyvaldatas_after_skip_avg.keys()) {
            if (key == xaxis_symbol)
                continue;
            const propkey = String(key);
            this.u_properties.push(propkey);
            this.u_series.push({
                name: propkey,
                smooth: true,
                type: 'line',
                data: this.u_keyvaldatas_after_skip_avg.get(key),
            });
        }

        this.options = this.generate_options();
        this.dynamic_options = this.options;
    }

    private generate_options(): EChartsOption {
        const dataZoom: any[]  = [
            {
                type: 'inside',
                xAxisIndex: 0,
                filterMode: 'empty',
            },
            {
                type: 'inside',
                yAxisIndex: 0,
                filterMode: 'empty',
            }
        ];
        if (this.cb_zoomSlider) {
            dataZoom.push({
                type: 'slider',
                xAxisIndex: 0,
                filterMode: 'empty',
            });
            dataZoom.push(
            {
                type: 'slider',
                yAxisIndex: 0,
                filterMode: 'empty',
            });
        }
        const options: EChartsOption = {
            title: {
                text: this.group,
            },
            tooltip: {
                trigger: 'axis',
            },
            legend: {
                data: this.u_properties,
            },
            grid: {
                left: '3%',
                right: '4%',
                bottom: '3%',
                containLabel: true,
            },
            toolbox: {
                feature: {
                    saveAsImage: {},
                },
            },
            dataZoom: dataZoom,
            xAxis: {
                type: 'category',
                name: this.in_xaxis_name,
                data: this.u_xaxis_data,
            },
            yAxis: {
                type: 'value',
                name: this.in_yaxis_name,
            },
            series: this.u_series,
        };
        if (this.u_series != null) {
            for (const one of this.u_series) {
                one.smooth = this.cb_smooth;
            }
        }
        return options;
    }

    private SetTimerFetchData() {
        if (this.timeout) return;

        this.timeout = setTimeout(async () => {
            this.timeout = null;
            try {
            await this.fetchLatestData();
            } catch {}
        }, this.refresh_sec * 1000);
    }

    private notfinish_data: Map<string | symbol,number[]>;
    private async fetchLatestData() {
        this.SetTimerFetchData();
        const pagedata = await this.dataRecordService.getGroupData(this.group, 1, 1);
        if (pagedata.count <= this.u_rawdata_size)
            return;

        const new_data = await this.dataRecordService.getGroupAllData(this.group, this.u_rawdata_size);
        if (!new_data || !new_data.length || new_data.length == 0)
            return;

        this.u_rawdata_size += new_data.length;
        const store_map: Map<string | symbol, number[]> = new Map();
        for (const key of this.u_keyvaldatas.keys())
            store_map.set(key, []);
        for (const data of new_data) {
            const obj = this.parse_data(data);
            if (obj == null) continue;
            for (const key of store_map.keys()) {
                const list1 = this.u_keyvaldatas.get(key);
                const list2 = store_map.get(key);
                const val = this.get_data_prop(obj, key);
                list1.push(val);
                list2.push(val);
            }
        }

        if (this.notfinish_data) {
            for (const key of store_map.keys()) {
                const l1 = this.notfinish_data.get(key);
                const l2 = store_map.get(key);
                for (const val of l1) l2.push(val);
            }
            this.notfinish_data = null;
        }

        const [ after_map, n ] = this.apply_skip_average(store_map, false);
        for (const key of after_map.keys()) {
            const l1 = after_map.get(key);
            const l2 = this.u_keyvaldatas_after_skip_avg.get(key);
            for (const val of l1) l2.push(val);
        }

        if (n > 0) {
            this.notfinish_data = store_map;
            for (const key of store_map.keys()) {
                const list = store_map.get(key);
                list.splice(0, list.length - n);
            }
        }

        this.append_refresh_chart();
    }

    private append_refresh_chart() {
        const old_options = this.dynamic_options;
        this.dynamic_options = {};
        for (const prop in old_options) {
            if (old_options.hasOwnProperty(prop)) {
                this.dynamic_options[prop] = old_options[prop];
            }
        }
    }

    private parse_data(data: any) {
        try {
            const ndata = data["data"] || data;
            const obj = JSON.parse(ndata);
            if (data["createdAt"])
                obj[createdAt_symbol] = data["createAt"];
            return obj;
        } catch {
            return null;
        }
    }

    private get_data_prop(data: object, prop: string | symbol) {
        let val = data[prop];
        if (typeof(val) === 'string') {
            const date = new Date(val);
            if (!isNaN(date.getTime())) {
                val = date.getTime();
            }
        }
        return Number(val) || 0;
    }

    ngOnInit(): void {
        this.activatedRouter.queryParamMap.subscribe(async (params) => {
            this.group = params.get("group");
            await this.restore_config();
            const jsonlist = [];
            this.datasize = 0;
            try { 
                const rawdata = await this.dataRecordService.getGroupAllData(this.group);
                this.u_rawdata_size = rawdata.length || 0;
                for (const data of rawdata) {
                    const obj = this.parse_data(data);
                    if (obj == null) continue;
                    jsonlist.push(obj);
                }
                if (jsonlist.length == 0) {
                    if (rawdata.length > 0)
                        this.errorMsg = "No valid data";
                    return;
                }
            } catch (error) {
                this.errorMsg = error.message || "failed to retrieve data";
            } finally {
                this.loading = false;
            }

            this.datasize = jsonlist.length;
            const front = jsonlist[0];
            const properties = Object.keys(front);
            this.u_keyvaldatas = new Map();
            for (const property of properties) {
                this.u_keyvaldatas.set(property, []);
            }
            for (const data of jsonlist) {
                for (const property of properties) {
                    const list = this.u_keyvaldatas.get(property);
                    list.push(this.get_data_prop(data, property));
                }
            }

            this.refresh_chart();
            this.SetTimerFetchData();
        });
    }

    private range(start: number, end: number, step: number) {
        const result = [];
        for (let i = start; i < end; i += step) {
            result.push(i);
        }
        return result;
    }

    saveAsXLSX() {
        if (this.u_series == null) {
            this.toastrService.danger("No data to export");
            return;
        }

        const data = [];
        for (const s of this.u_series) {
            let i = 1;
            data[0] = data[0] || [];
            data[0].push(s.name);
            for (const d of s.data) {
                data[i] = data[i] || [];
                data[i].push(d);
                i++;
            }
        }
        const book = utils.book_new();
        const worksheet = utils.aoa_to_sheet(data);
        utils.book_append_sheet(book, worksheet, this.group);
        writeFile(book, this.group + '.xlsx');
    }

    ngOnDestroy() {
        clearTimeout(this.timeout);
    }
}

