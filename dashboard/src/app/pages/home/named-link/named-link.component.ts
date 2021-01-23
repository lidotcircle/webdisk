import { Component, OnInit } from '@angular/core';
import { NameEntry } from 'src/app/shared/common';
import { AccountManagerService } from 'src/app/shared/service/account-manager.service';
import { ClipboardContentType, ClipboardService } from 'src/app/shared/service/clipboard.service';
import { NotifierService } from 'src/app/shared/service/notifier.service';
import { NotifierType } from 'src/app/shared/shared-component/notifier/notifier.component';
import { cons } from 'src/app/shared/utils';

@Component({
    selector: 'app-named-link',
    templateUrl: './named-link.component.html',
    styleUrls: ['./named-link.component.scss']
})
export class NamedLinkComponent implements OnInit {
    private entries: NameEntry[];
    private filter: string;
    outentries: NameEntry[];

    constructor(private accountManager: AccountManagerService,
                private notifier: NotifierService,
                private clipboard: ClipboardService) {
        this.entries = [];
        this.outentries = [];
        this.filter = '';
    }

    ngOnInit(): void {
        this.accountManager.getAllNameEntry()
        .then(entries => {
            this.entries = entries;
            this.run_fileter();
        })
        .catch(() => {
            this.notifier.create({
                message: 'get named entry fail',
                mtype: NotifierType.Error
            }).wait();
        });
    }

    private run_fileter(): string[] {
        let ans = [];
        if(this.filter == '') {
            this.outentries = this.entries.slice(0);
        } else {
            this.outentries = [];
            for(const entry of this.entries) {
                if(entry.name.match(this.filter) || entry.destination.match(this.filter)) {
                    ans.push(entry.name);
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

    onsearchenter(input: string) {}

    getdate(n: number): string {
        const date = this.outentries[n].validEnd;
        if(date > Date.now() + 1000 * 60 * 60 * 24 * 365 * 10) {
            return 'infinity';
        } else {
            const n = new Date(date);
            return n.toLocaleString();
        }
    }

    async oncopy(n: number) {
        const entry = this.outentries[n];
        const name = entry.name;
        const link = location.protocol + '//' + location.host + cons.NamedLinkPREFIX + '/' + name;
        const ans = await this.clipboard.copy(ClipboardContentType.text, link);
        if (ans) {
            this.notifier.create({message: 'Copied the link to clipboard'}).wait();
        } else {
            this.notifier.create({message: `Fail to copy the link: ${link}`, mtype: NotifierType.Error}).wait();
        }
    }

    async ondelete(n: number) {
        try {
            const entry = this.outentries[n];
            const name = entry.name;
            await this.accountManager.deleteNameEntry(name);
            this.notifier.create({message: `delete named link ${name} success`});

            for(let i=0;i<this.entries.length;i++) {
                if(this.entries[i] == entry) {
                    this.entries.splice(i, 1);
                    break;
                }
            }
            this.run_fileter();
        } catch {
            this.notifier.create({message: `delete named link ${name} fail`, mtype: NotifierType.Error});
        }
    }
}

