import { Component, ElementRef, Input, OnInit, ViewChild } from '@angular/core';
import { MatIconRegistry } from '@angular/material/icon';
import { DomSanitizer } from '@angular/platform-browser';
import { StorePassword } from 'src/app/shared/common';
import { ClipboardContentType, ClipboardService } from 'src/app/shared/service/clipboard.service';
import { MessageBoxService } from 'src/app/shared/service/message-box.service';
import { NotifierService } from 'src/app/shared/service/notifier.service';
import { StorePassService } from 'src/app/shared/service/store-pass/store-pass.service';
import { NotifierType } from 'src/app/shared/shared-component/notifier/notifier.component';

declare const require: any;
const menu_dots = require('!raw-loader!./assets/menu-dots.svg').default;
const show_pass = require('!raw-loader!./assets/show-pass.svg').default;
const internet  = require('!raw-loader!./assets/internet.svg').default;
const icons = [
    {name: 'store_internet',  svg: internet},
    {name: 'store_menu_dots', svg: menu_dots},
    {name: 'store_show_pass', svg: show_pass},
];
let icons_loaded = false;


@Component({
    selector: 'app-store',
    templateUrl: './store.component.html',
    styleUrls: ['./store.component.scss']
})
export class StoreComponent implements OnInit {
    @Input('store')
    store: StorePassword;
    truePass: string;
    encryptedAccount: boolean = false;
    trueAccount: string;
    showAccount: boolean = false;
    showPass: boolean = false;

    @ViewChild('bsbsbs', {static: true})
    private tools: ElementRef;

    constructor(private matIconRegistry: MatIconRegistry,
                private domSanitizer: DomSanitizer,
                private storepass: StorePassService,
                private messagebox: MessageBoxService,
                private notifier: NotifierService,
                private clipboard: ClipboardService) { 
        if(!icons_loaded) {
            icons_loaded = true;
            icons.forEach(v => this.matIconRegistry.addSvgIconLiteral(v.name, this.domSanitizer.bypassSecurityTrustHtml(v.svg)));
        }
    }

    ngOnInit(): void {
        const v = this.storepass.eliminatePrefix(this.store.account);
        if(v) {
            this.store.account = v;
            this.trueAccount = v;
        } else {
            this.encryptedAccount = true;
        }
    }

    private prevCipher = '';
    private async tryDecrypt(ciphertext: string): Promise<string | null> //{
    {
        let ans = null;
        const u1 = this.storepass.decrypt(ciphertext, this.prevCipher);
        if(u1 != null) {
            ans = u1;
        } else {
            const u = await this.messagebox.create({
                title: '',
                message: '',
                inputs: [
                    {name: 'pass', label: 'password', type: 'password', initValue: ''}
                ],
                buttons: [
                    {name: 'Confirm'},
                    {name: 'Cancel'},
                ]
            }).wait();

            if(!u.closed && u.buttonValue == 0) {
                const u2 = this.storepass.decrypt(ciphertext, u.inputs['pass']);
                ans = u2;
                this.prevCipher = u.inputs['pass'];
                if(ans == null) {
                    await this.notifier.create({
                        message: 'wrong password',
                        mtype: NotifierType.Error
                    }).wait();
                }
            }
        }

        return ans;
    } //}

    async togglePass(): Promise<void> //{
    {
        if(this.showPass) {
            this.showPass = false;
        } else if (this.truePass == null) {
            this.truePass = await this.tryDecrypt(this.store.pass);
            if(this.truePass != null) {
                this.showPass = true;
            }
        } else {
            this.showPass = true;
        }
    } //}

    async toggleAccount(): Promise<void> //{
    {
        if(this.showAccount) {
            this.showAccount = false;
        } else if (this.trueAccount == null) {
            this.trueAccount = await this.tryDecrypt(this.store.account);
            if(this.trueAccount != null) {
                this.showAccount = true;
            }
        } else {
            this.showAccount = true;
        }
    } //}

    async copyToClipboard(text: string) //{
    {
        if(await this.clipboard.copy(ClipboardContentType.text, text)) {
            await this.notifier.create({message: 'copy to clipboard'}).wait();
        } else {
            await this.notifier.create({message: 'copy to clipboard fail', mtype: NotifierType.Error}).wait();
        }
    } //}

    onToolsClick() {
        const elem = this.tools.nativeElement as HTMLElement;
        const cb = event => {
            document.removeEventListener('click', cb);
            this.onToolsBlur();
        }
        setTimeout(() => document.addEventListener('click', cb), 0);
        elem.style.display = 'flex';
    }

    onToolsBlur() {
        const elem = this.tools.nativeElement as HTMLElement;
        setTimeout(() => elem.style.display = 'none', 50);
    }

    async onEdit() {
        await this.storepass.changePassWithUI(this.store.passid);
    }
    async onDelete() {
        await this.storepass.deletePassWithUI(this.store.passid);
    }
}

