import { Component, HostListener, OnDestroy, OnInit } from '@angular/core';
import { NbIconLibraries } from '@nebular/theme';
import { WebdiskLayoutService } from 'src/app/layout/webdisk-layout.service';


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
    constructor(private layoutService: WebdiskLayoutService,
                private iconLibrary: NbIconLibraries)
    {
        this.iconLibrary.setDefaultPack('fa-solid');
    }

    ngOnDestroy(): void {
        if (this.toggled) {
            this.layoutService.toggle();
        }
    }

    @HostListener("document:keydown.f8")
    toggleLayout() {
        this.toggled = !this.toggled;
        this.layoutService.toggle();
    }

    ngOnInit(): void {
    }
}
