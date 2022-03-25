import { Component, OnInit } from '@angular/core';

@Component({
    selector: 'app-add-data',
    template: `
    <nb-card accent="info">
      <nb-card-header>
        <mat-form-field>
            <mat-label>Group</mat-label>
            <input matInput type="text" [(ngModel)]='group'>
        </mat-form-field>
      </nb-card-header>
      <nb-card-body>
        <ngx-monaco-editor [options]="editorOptions" [(ngModel)]="code"></ngx-monaco-editor>
      </nb-card-body>
        <nb-card-footer>
            <button nbButton status="primary" (click)="addData()" [disabled]="inadding"
                    [nbSpinner]="inadding" nbSpinnerStatus="info">Add</button>
            <button nbButton status="warning" (click)="code = ''" [disabled]="code == ''">Clear</button>
        </nb-card-footer>
    </nb-card>
    `,
    styles: [
    `
    nb-card {
        height: 100%;
        box-size: border-box;
        margin: 0em;
    }
    ngx-monaco-editor {
        height: 100%;
    }
    nb-card-footer {
        display: flex;
        justify-content: space-between;
    }
    nb-card-footer button {
        min-width: 8rem;
    }`]
})
export class AddDataComponent implements OnInit {
    editorOptions = {theme: 'vs-dark', language: 'json'};
    group: string;
    code: string;
    inadding = false;

    constructor() { }

    ngOnInit(): void {
    }

    addData() {
        this.inadding = true;
        console.log(this.group);
        console.log(this.code);
    }
}
