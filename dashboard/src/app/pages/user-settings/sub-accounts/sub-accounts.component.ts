import { Component, OnInit } from '@angular/core';
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

    async copyToClipboard(text: string) {
        await this.clipboard.copy(ClipboardContentType.text, text);
        await this.notifier.create({message: 'copied invitation code to clipboard'}).wait();
    }
}

