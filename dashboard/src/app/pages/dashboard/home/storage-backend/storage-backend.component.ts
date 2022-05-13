import { Component, OnDestroy, OnInit } from '@angular/core';
import { interval, Subject } from 'rxjs';
import { filter, take, takeUntil } from 'rxjs/operators';
import { StorageBackend, StorageBackendService } from 'src/app/service/storage-backend.service';
import { assignTargetEnumProp } from 'src/app/shared/common';
import { MessageBoxService } from 'src/app/shared/service/message-box.service';
import { NotifierService } from 'src/app/shared/service/notifier.service';
import { NotifierType } from 'src/app/shared/shared-component/notifier/notifier.component';

@Component({
    selector: 'app-storage-backend',
    template: `
    <nb-card accent='primary'>
        <nb-card-header>
            <app-search-bar-float (searchinput)='onsearchinput($event)' (searchenter)='onsearchenter($event)'></app-search-bar-float>
        </nb-card-header>

        <nb-card-body>
            <div class='scroll-body'>
            <div class="entry" *ngFor='let entry of outentries; let i=index;'>
                <div class='entry-info'>
                    <div class='basic-info'>
                        <span class='directory'>{{ entry.directory }}</span>
                        <span class='type'>{{ entry.type }}</span>
                    </div>

                    <div *ngIf='entry.type == "alioss"' class='key-value type-alioss'>
                        <div class='field'> Region </div>
                        <div class='value' *ngIf='!entry.config.regionEdit' (click)='onClick(i, "region", $event)'> {{ entry.config.region }} </div>
                        <div class='value input' *ngIf='entry.config.regionEdit'>
                            <input type='text' [(ngModel)]='entry.config.region'
                                   (change)='entry.edited=true' (input)='entry.edited=true'
                                   (blur)='entry.config.regionEdit=false' (keydown.enter)='entry.config.regionEdit=false'/>
                        </div>

                        <div class='field'> Bucket </div>
                        <div class='value' *ngIf='!entry.config.bucketEdit' (click)='onClick(i, "bucket", $event)'> {{ entry.config.bucket }} </div>
                        <div class='value input' *ngIf='entry.config.bucketEdit'>
                            <input type='text' [(ngModel)]='entry.config.bucket'
                                   (change)='entry.edited=true' (input)='entry.edited=true'
                                   (blur)='entry.config.bucketEdit=false' (keydown.enter)='entry.config.bucketEdit=false'/>
                        </div>

                        <div class='field'> AccessKeyId </div>
                        <div class='value' *ngIf='!entry.config.accessKeyIdEdit' (click)='onClick(i, "accessKeyId", $event)'> {{ entry.config.accessKeyId }} </div>
                        <div class='value input' *ngIf='entry.config.accessKeyIdEdit'>
                            <input type='text' [(ngModel)]='entry.config.accessKeyId'
                                   (change)='entry.edited=true' (input)='entry.edited=true'
                                   (blur)='entry.config.accessKeyIdEdit=false' (keydown.enter)='entry.config.accessKeyIdEdit=false'/>
                        </div>

                        <div class='field'> AccessKeySecret </div>
                        <div class='value' *ngIf='!entry.config.accessKeySecretEdit' (click)='onClick(i, "accessKeySecret", $event)'>
                            ••••••••
                        </div>
                        <div class='value input' *ngIf='entry.config.accessKeySecretEdit'>
                            <input type='password' [(ngModel)]='entry.config.accessKeySecret'
                                   (change)='entry.edited=true' (input)='entry.edited=true'
                                   (blur)='entry.config.accessKeySecretEdit=false' (keydown.enter)='entry.config.accessKeySecretEdit=false'/>
                        </div>

                        <div class='field'> Secure </div>
                        <div class='value'>
                            <input style='width: min-content;' type='checkbox' [(ngModel)]='entry.config.secure'
                                   (change)='entry.edited=true' (input)='entry.edited=true'/>
                        </div>
                    </div>
                </div>
                <div class='entry-operation'>
                    <button ghost nbButton status='primary' (click)='onsave(i)' [disabled]='!entry.edited || entry.saving'><nb-icon icon='save'></nb-icon></button>
                    <button ghost nbButton status='primary' (click)='ondelete(i)'><nb-icon icon='trash'></nb-icon></button>
                </div>
            </div>
            </div>
        </nb-card-body>
    </nb-card>`,
    styleUrls: ['./storage-backend.component.scss']
})
export class StorageBackendComponent implements OnInit, OnDestroy {
    private entries: StorageBackend[];
    private filter: string;
    private destroy$: Subject<void> = new Subject();
    outentries: StorageBackend[];

    constructor(private storeService: StorageBackendService,
                private msgBox: MessageBoxService,
                private notifier: NotifierService) {
        this.entries = [];
        this.outentries = [];
        this.filter = '';
    }

    ngOnDestroy(): void {
        this.destroy$.next();
        this.destroy$.complete();
    }

    ngOnInit(): void {
        this.storeService.getStores().then(configs => {
            configs.forEach(config => config['oldConfig'] = JSON.parse(JSON.stringify(config.config)));
            this.entries = configs;
            this.run_fileter();
        }, () => {
            this.notifier.create({message: 'get storages failed', mtype: NotifierType.Error}).wait();
        });
    }

    private run_fileter(): string[] {
        let ans = [];
        if(this.filter == '') {
            this.outentries = this.entries.slice(0);
        } else {
            this.outentries = [];
            for(const entry of this.entries) {
                let matched = false;
                if(entry.type.match(this.filter)) {
                    ans.push(entry.type);
                    matched = true;
                }
                const dircom = entry.directory.split('/').filter(v => v != '');
                for (const m of dircom) {
                    if (m.match(this.filter)) {
                        ans.push(m);
                        matched = true;
                    }
                }

                if (matched) {
                    this.outentries.push(entry);
                }
            }
        }
        return ans;
    }

    onsearchinput(pair: [string, (hints: string[]) => void]) {
        const input = pair[0];
        const hook = pair[1];

        this.filter = input;
        const ans = this.run_fileter();
        hook(ans);
    }

    onsearchenter(input: string) {
        this.filter = input;
        this.run_fileter();
    }

    async onClick(n: number, key: string, event: MouseEvent) {
        const entry = this.outentries[n];
        entry.config[key + 'Edit'] = true;
        const target = (event.target as HTMLElement).previousElementSibling;
        interval(100)
            .pipe(
                takeUntil(this.destroy$), take(20),
                filter(() => target?.nextElementSibling?.classList.contains('input')),
                take(1)
            )
            .subscribe(() => {
                const input = target?.nextElementSibling?.querySelector('input');
                if (input) input.focus();
            });;
    }

    async ondelete(n: number) {
        const entry = this.outentries[n];
        if (!await this.msgBox.confirmMSG(`delete storage at '${entry.directory}'?`, 'delete')) {
            return;
        }

        try {
            await this.storeService.deleteStore(entry.directory);
            this.notifier.create({message: `delete storage at '${entry.directory}' success`});

            for(let i=0;i<this.entries.length;i++) {
                if(this.entries[i] == entry) {
                    this.entries.splice(i, 1);
                    break;
                }
            }
            this.run_fileter();
        } catch {
            this.notifier.create({message: `delete storage fail`, mtype: NotifierType.Error});
        }
    }

    async onsave(n: number) {
        const entry = this.outentries[n];
        try {
            entry['saving'] = true;
            const config = JSON.parse(JSON.stringify(entry['oldConfig']));
            let changed = false;
            for (const key in config) {
                if (config[key] !== entry.config[key]) {
                    changed = true;
                    break;
                }
            }
            assignTargetEnumProp(entry.config, config);
            if (changed) {
                await this.storeService.changeStoreConfig(entry.directory, config);
            }
            entry['oldConfig'] = config;
            entry.config = JSON.parse(JSON.stringify(config));
            entry['edited'] = false;
        } catch (e) {
            this.notifier.create({message: `update config failed`, mtype: NotifierType.Error});
        } finally {
            entry['saving'] = false;
        }
    }
}
