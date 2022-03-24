import { Component, ViewEncapsulation} from '@angular/core';

@Component({
    selector: 'ngx-one-column-single-page-layout',
    styleUrls: ['./one-column-single-page.layout.scss'],
    template: `
    <nb-layout class="splayout">
      <nb-layout-header>
        <ngx-header></ngx-header>
      </nb-layout-header>

      <nb-sidebar class="menu-sidebar" tag="menu-sidebar" responsive>
        <ng-content select="[menu]"></ng-content>
      </nb-sidebar>

      <nb-layout-column #column>
        <ng-content select="[content]"></ng-content>
      </nb-layout-column>
    </nb-layout>
    `,
    encapsulation: ViewEncapsulation.None,
})
export class OneColumnSinglePageLayoutComponent {}
