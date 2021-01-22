import { Component, Input, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Location } from '@angular/common';

@Component({
    selector: 'app-page-top',
    templateUrl: './page-top.component.html',
    styleUrls: ['./page-top.component.scss']
})
export class PageTopComponent implements OnInit {
    @Input('title') title: string;

    constructor(private location: Location) { }

    ngOnInit(): void {
        if(this.title == null) throw new Error('bad title');
    }

    onBack() {
        this.location.back();
    }
}

