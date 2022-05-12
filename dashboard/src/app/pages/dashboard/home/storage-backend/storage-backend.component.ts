import { Component, OnInit } from '@angular/core';
import { StorageBackend, StorageBackendService } from 'src/app/service/storage-backend.service';
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
            <div class="entry" *ngFor='let entry of outentries; let i=index;'>
                <div class='entry-info'>
                    <div class='basic-info'>
                        <span class='directory'>{{ entry.directory }}</span>
                        <span class='type'>{{ entry.type }}</span>
                    </div>

                    <div *ngIf='entry.type == "alioss"' class='type-alioss'>
                        <div class='field'> Region </div>
                        <div class='value'> {{ entry.config.region }} </div>
                        <div class='field'> Bucket </div>
                        <div class='value'> {{ entry.config.bucket }} </div>
                        <div class='field'> AccessKeyId </div>
                        <div class='value'> {{ entry.config.accessKeyId }} </div>
                        <div class='field'> AccessKeySecret </div>
                        <div class='value'> {{ entry.config.accessKeySecret }} </div>
                        <div class='field'> Secure </div>
                        <div class='value'> {{ entry.config.secure }} </div>
                    </div>
                </div>
                <div class='entry-operation'>
                    <button ghost nbButton status='primary' (click)='ondelete(i)'><nb-icon icon='trash'></nb-icon></button>
                </div>
            </div>
        </nb-card-body>
    </nb-card>`,
    styleUrls: ['./storage-backend.component.scss']
})
export class StorageBackendComponent implements OnInit {
    private entries: StorageBackend[];
    private filter: string;
    outentries: StorageBackend[];

    constructor(private storeService: StorageBackendService,
                private notifier: NotifierService) {
        this.entries = [];
        this.outentries = [];
        this.filter = '';
    }

    ngOnInit(): void {
        this.storeService.getStores().then(configs => {
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

    async ondelete(n: number) {
        try {
            const entry = this.outentries[n];
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
}
