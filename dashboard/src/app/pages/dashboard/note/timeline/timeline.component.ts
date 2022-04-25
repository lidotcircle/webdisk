import { Component, OnInit } from '@angular/core';


@Component({
    selector: 'app-timeline',
    template: `<a routerLink="../markdown">MD</a>`,
    styleUrls: ["./timeline.component.scss"]
})
export class TimelineComponent implements OnInit {
    constructor() { }

    ngOnInit(): void {
    }
}
