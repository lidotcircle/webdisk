import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { CurrentDirectoryService } from 'src/app/shared/service/current-directory.service';


let count = 1;
@Component({
    selector: 'ngx-home',
    template: `<router-outlet></router-outlet>`,
    styles: []
})
export class HomeComponent implements OnInit {
    constructor(private cwdservice: CurrentDirectoryService,
                private router: Router,
                private activatedRouter: ActivatedRoute) {}

    ngOnInit(): void {
        this.cwdservice.cwd.subscribe(cwd => {
            this.router.navigate(['explorer'], {
                relativeTo: this.activatedRouter,
                queryParams: {
                    count: count++,
                    path: cwd
                }
            });
        });
    }
}
