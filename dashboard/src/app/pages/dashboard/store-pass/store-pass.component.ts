import { Component, OnDestroy, OnInit } from '@angular/core';
import { Subscription } from 'rxjs';
import { StorePassword } from 'src/app/shared/common';
import { StorePassService } from 'src/app/shared/service/store-pass/store-pass.service';
import { SearchInputEvent } from 'src/app/shared/shared-component/search-bar/search-bar.component';

@Component({
    selector: 'app-store-pass',
    templateUrl: './store-pass.component.html',
    styleUrls: ['./store-pass.component.scss']
})
export class StorePassComponent implements OnInit, OnDestroy {
    private stores: StorePassword[] = [];
    showstores: StorePassword[] = [];
    private filter: string = '';

    constructor(private storepass: StorePassService) { }

    ngOnDestroy(): void {
        this.subscription.unsubscribe();
    }

    private subscription: Subscription;
    ngOnInit(): void //{
    {
        this.refresh();

        this.subscription = this.storepass.store.subscribe(v => {
            if(v == null) {
                this.stores = [];
                this.refresh();
            } else {
                this.stores = JSON.parse(JSON.stringify(v));
                this.refresh();
            }
        });
    } //}

    private refresh() {
        this.runFileter();
    }

    private runFileter(): string[] //{
    {
        const ans = [];
        if(this.filter == '') {
            this.showstores = this.stores;
            return ans;
        }

        const regex = new RegExp('\\b\\w*' + this.filter + '\\w*\\b');
        this.showstores = [];
        for(const store of this.stores) {
            const m1 = store.account.match(regex);
            const m2 = store.site.match(regex);
            if(m1 || m2) {
                this.showstores.push(store);
            }
            if(m1) {
                ans.push(m1[0]);
            }
            if(m2) {
                ans.push(m2[0]);
            }
        }

        const setx = new Set<string>();
        for(const h of ans) setx.add(h);
        ans.splice(0, ans.length);
        for(const h of setx.keys()) ans.push(h);
        return ans;
    } //}

    onSearchInput(event: SearchInputEvent) {
        this.filter = event[0];
        event[1](this.runFileter());
    }

    onSearchEnter(input: string) {
        this.filter = input;
        this.runFileter();
    }

    async newpass() {
        await this.storepass.newPassWithUI();
    }

    async onrefresh() {
        this.refresh();
    }
}

