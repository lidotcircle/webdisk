import { Component, OnDestroy, OnInit } from '@angular/core';
import { WebdiskLayoutService } from 'src/app/layout/webdisk-layout.service';
import hotkeys from 'hotkeys-js';


@Component({
    selector: 'ngx-dashboard',
    template: `
    <ngx-default-layout>
        <router-outlet></router-outlet>
    </ngx-default-layout>
  `,
    styles: []
})
export class DashboardComponent implements OnInit, OnDestroy {
    private toggled: boolean;
    constructor(private layoutService: WebdiskLayoutService) { }

    ngOnDestroy(): void {
        hotkeys.unbind("f8");
        if (this.toggled) {
            this.layoutService.toggle();
        }
    }

    ngOnInit(): void {
        hotkeys("f8", (_event, _handler) => {
            this.toggled = !this.toggled;
            this.layoutService.toggle();
        });
    }
}
