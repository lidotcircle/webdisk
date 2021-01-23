import { Component, OnInit } from '@angular/core';
import { InvitationStatus } from 'src/app/shared/common';
import { AccountManagerService } from 'src/app/shared/service/account-manager.service';
import { ClipboardContentType, ClipboardService } from 'src/app/shared/service/clipboard.service';
import { NotifierService } from 'src/app/shared/service/notifier.service';
import { NotifierType } from 'src/app/shared/shared-component/notifier/notifier.component';

@Component({
    selector: 'app-sub-accounts',
    templateUrl: './sub-accounts.component.html',
    styleUrls: ['./sub-accounts.component.scss']
})
export class SubAccountsComponent implements OnInit {
    invitations: string[];
    indexClassState: string[] = [];
    details: InvitationStatus[] = [];

    constructor(private accountManager: AccountManagerService,
                private clipboard: ClipboardService,
                private notifier: NotifierService) { }

    ngOnInit(): void {
        this.refresh();
    }

    async refresh() {
        this.invitations = await this.accountManager.getInvCodes();
    }

    async newinv(n: number) {
        await this.accountManager.genInvCodes(n);
        await this.refresh();
    }

    async deleteInvCode(i: number) {
        try {
            await this.accountManager.deleteInvCode(this.invitations[i]);
            this.notifier.create({message: 'delete invitation code success'}).wait();
            this.refresh();
        } catch {
            await this.notifier.create({message: 'delete invitation code fail', mtype: NotifierType.Error}).wait();
        }
    }

    async copyToClipboard(text: string) {
        await this.clipboard.copy(ClipboardContentType.text, text);
        await this.notifier.create({message: 'copied invitation code to clipboard'}).wait();
    }

    private async fetchInvStatus(n: number): Promise<void> {
        this.details[n] = null;
        return new Promise((resolve) => {
            setTimeout(() => resolve(), 2000);
        });
    }

    async foldToggle(i: number): Promise<void> {
        if(this.indexClassState[i] == 'active') {
            this.indexClassState[i] = null;
        } else if(this.indexClassState[i] == 'process') {
            return;
        } else {
            if(this.details[i] !== undefined) {
                this.indexClassState[i] = 'active';
            } else {
                this.indexClassState[i] = 'process';
                try {
                    await this.fetchInvStatus(i);
                    this.indexClassState[i] = 'active';
                } catch {
                    this.indexClassState[i] = null;
                }
            }
        }
    }
}

