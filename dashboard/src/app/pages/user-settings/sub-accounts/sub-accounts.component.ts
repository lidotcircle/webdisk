import { Component, OnInit } from '@angular/core';
import { UserInfo, UserPermission } from 'src/app/shared/common';
import { AccountManagerService } from 'src/app/shared/service/account-manager.service';
import { ClipboardContentType, ClipboardService } from 'src/app/shared/service/clipboard.service';
import { NotifierService } from 'src/app/shared/service/notifier.service';
import { NotifierType } from 'src/app/shared/shared-component/notifier/notifier.component';
import { SettingItem } from '../setting-item/setting-item.component';

@Component({
    selector: 'app-sub-accounts',
    templateUrl: './sub-accounts.component.html',
    styleUrls: ['./sub-accounts.component.scss']
})
export class SubAccountsComponent implements OnInit {
    invitations: string[];
    indexClassState: string[] = [];
    details: [UserInfo, UserPermission][] = [];
    permsSetting: SettingItem[][] = [];

    constructor(private accountManager: AccountManagerService,
                private clipboard: ClipboardService,
                private notifier: NotifierService) { }

    ngOnInit(): void {
        this.refresh();
    }

    createTime(n: number): string {
        const info = this.details[n][0];
        if(info == null) return '';
        return (new Date(info.createTime)).toLocaleString();
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
            this.details.splice(i, 1);
            this.indexClassState.splice(i, 1);
            this.refresh();
        } catch {
            await this.notifier.create({message: 'delete invitation code fail', mtype: NotifierType.Error}).wait();
        }
    }

    async copyToClipboard(text: string) {
        await this.clipboard.copy(ClipboardContentType.text, text);
        await this.notifier.create({message: 'copied invitation code to clipboard'}).wait();
    }

    private updatePermSetting(n: number) //{
    {
        const perm = this.details[n][1];
        const settingItems = [];
        for(const key in perm) {
            const s = new SettingItem();
            s.property = key;
            s.name = key; // TODO
            s.initvalue = perm[key];
            s.change = (() => {
                const code = this.invitations[n];
                const k = key;
                return async (val: any) => {
                    perm[k] = val;
                    const req = {};
                    req[k] = val;
                    await this.updatePermission(code, req);
                }
            })();

            if(typeof perm[key] == 'boolean') {
                s.type = 'checkbox';
            }

            if(typeof s.type === 'string') {
                settingItems.push(s);
            }
        }
        this.permsSetting[n] = settingItems;
    } //}

    private async updatePermission(invcode: string, perm: {[key: string]: any}) //{
    {
        try {
            await this.accountManager.setInvCodePermission(invcode, perm);
        } catch (err) {
            await this.notifier.create({
                message: `update invitation code permission fail: ${err.message}`, 
                mtype: NotifierType.Error
            });
        }
    } //}

    private async fetchInvStatus(n: number): Promise<void> //{
    {
        const code = this.invitations[n];
        let info;
        try {
            info = await this.accountManager.getUserInfoByInvcode(code);
        } catch {}
        const perm = await this.accountManager.getInvCodePermission(code);
        this.details[n] = [info, perm];
        this.updatePermSetting(n);
    } //}

    async foldToggle(i: number): Promise<void> //{
    {
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
                } catch (err) {
                    this.indexClassState[i] = null;
                    await this.notifier.create({
                        message: `get information of invitation code fail: ${err.message}`, 
                        mtype: NotifierType.Warn
                    }).wait();
                }
            }
        }
    } //}
}

