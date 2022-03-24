import { Component, OnDestroy, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { NbThemeService } from '@nebular/theme';
import { EChartsOption } from 'echarts';
import { DataRecordService } from 'src/app/service/data-record.service';


@Component({
    selector: 'app-group-graph',
    template: `
    <nb-card [nbSpinner]="loading" nbSpinnerStatus="info" accent="info">
      <nb-card-header>
        {{ group }}
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

    constructor(private activatedRouter: ActivatedRoute,
                private dataRecordService: DataRecordService)
    {
        this.loading = true;
        this.options = {};
        this.errorMsg = null;
        this.datasize = 0;
        this.refresh_sec = 5;
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

    private async fetchLatestData() {
        this.SetTimerFetchData();
        const pagedata = await this.dataRecordService.getGroupData(this.group, 1, 1);
        if (pagedata.count <= this.u_rawdata_size)
            return;

        const new_data = await this.dataRecordService.getGroupAllData(this.group, this.u_rawdata_size);
        if (!new_data || !new_data.length || new_data.length == 0)
            return;

        this.u_rawdata_size += new_data.length;
        for (const val of new_data) {
            try {
                const obj = JSON.parse(val);
                for (const prop of this.u_properties) {
                    const index = this.u_series.findIndex(x => x.name == prop);
                    if (index < 0) continue;
                    this.u_series[index].data.push(Number(obj[prop]) || 0);
                }
            } catch (e) {
                console.debug(e);
                continue;
            }
            this.u_xaxis_data.push(this.u_xaxis_data[this.u_xaxis_data.length - 1] + 1);
        }
        this.refreshChart();
    }

    private refreshChart() {
        const old_options = this.dynamic_options;
        this.dynamic_options = {};
        for (const prop in old_options) {
            if (old_options.hasOwnProperty(prop)) {
                this.dynamic_options[prop] = old_options[prop];
            }
        }
    }

    ngOnInit(): void {
        this.activatedRouter.queryParamMap.subscribe(async (params) => {
            this.group = params.get("group");
            const jsonlist = [];
            this.datasize = 0;
            try { 
                const rawdata = await this.dataRecordService.getGroupAllData(this.group);
                this.u_rawdata_size = rawdata.length || 0;
                for (const data of rawdata) {
                    try {
                        jsonlist.push(JSON.parse(data));
                    } catch {}
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
            this.u_properties = properties;
            const dataset = {};
            for (const property of properties) {
                dataset[property] = [];
            }
            for (const data of jsonlist) {
                for (const property of properties) {
                    dataset[property].push(Number(data[property]) || 0);
                }
            }

            const series = [];
            for (const property of properties) {
                series.push({
                    name: property,
                    smooth: true,
                    type: 'line',
                    data: dataset[property],
                });
            }
            this.u_series = series;

            this.u_xaxis_data = this.range(1, jsonlist.length + 1);
            const options: EChartsOption = {
                title: {
                    text: this.group,
                },
                tooltip: {
                    trigger: 'axis',
                },
                legend: {
                    data: properties,
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
                dataZoom: [
                    {
                        type: 'slider',
                        xAxisIndex: 0,
                        filterMode: 'empty',
                    },
                    {
                        type: 'slider',
                        yAxisIndex: 0,
                        filterMode: 'empty',
                    },
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
                ],
                xAxis: {
                    type: 'category',
                    data: this.u_xaxis_data,
                },
                yAxis: {
                    type: 'value',
                },
                series: series,
            };

            this.options = options;
            this.dynamic_options = options;
            this.SetTimerFetchData();
        });
    }

    private range(start: number, end: number) {
        const result = [];
        for (let i = start; i < end; i++) {
            result.push(i);
        }
        return result;
    }

    ngOnDestroy() {
        clearTimeout(this.timeout);
    }
}

