import { Component, OnInit } from '@angular/core';


@Component({
    selector: 'app-note',
    template: `<router-outlet></router-outlet>`,
    styles: []
})
export class NoteComponent implements OnInit {

    constructor() { }

    ngOnInit(): void {
    }
}
