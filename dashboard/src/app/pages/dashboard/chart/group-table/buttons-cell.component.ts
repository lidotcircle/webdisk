import { Component, Input, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { ViewCell } from 'ng2-smart-table';

@Component({
    template: `
      <div class="buttons">
        <button nbButton status='info' size='small' (click)='nav()' outline>View</button>
      </div>
    `,
})
export class ButtonsCellComponent implements ViewCell, OnInit {
    constructor(private router: Router, private activatedRouter: ActivatedRoute) {}

    @Input() value: string | number;
    @Input() rowData: { group: string };

    ngOnInit() {
    }

    async nav() {
        await this.router.navigate(['../graph'], {
            relativeTo: this.activatedRouter,
            queryParams: {
                group: this.rowData.group,
            }
        });
    }
}

