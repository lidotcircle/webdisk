import { Component } from '@angular/core';
import { NbSpinnerService } from '@nebular/theme';

@Component({
    selector: 'ngx-exception-layout',
    styles: [],
    template: `
    <nb-layout>
      <nb-layout-header>
      </nb-layout-header>

      <nb-layout-column>
        <router-outlet></router-outlet>
      </nb-layout-column>

      <nb-layout-footer>
        <ngx-footer></ngx-footer>
      </nb-layout-footer>
    </nb-layout>
    `,
})
export class ExceptionLayoutComponent {
    constructor(private spinner: NbSpinnerService) {
        this.spinner.load();
    }
}

