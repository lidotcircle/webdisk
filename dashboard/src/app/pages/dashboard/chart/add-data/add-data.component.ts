import { Component, OnInit } from '@angular/core';
import { NbToastrService } from '@nebular/theme';
import { DataRecordService } from 'src/app/service/data-record.service';

@Component({
    selector: 'app-add-data',
    template: `
    <nb-card accent="info">
      <nb-card-header>
        <mat-form-field>
            <mat-label>Group</mat-label>
            <input matInput type="text" [(ngModel)]='group'>
        </mat-form-field>
        <mat-checkbox [(ngModel)]='cb_clear'>ClearWhenAdded</mat-checkbox>
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
    nb-card-header {
        display: flex;
        justify-content: space-between;
        flex-direction: row;
        align-items: center;
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
    cb_clear: boolean = false;
    inadding = false;

    constructor(private dataRecordService: DataRecordService,
                private toasterService: NbToastrService) { }

    ngOnInit(): void {
    }

    async addData() {
        if (this.group == '') {
            this.toasterService.danger('Group is required', 'Error');
            return;
        }

        this.inadding = true;
        try {
            await this.dataRecordService.addRecord(this.group, this.code);
            if (this.cb_clear) 
                this.code = '';
            this.toasterService.success('Add data success', 'Success');
        } catch (e) {
            this.toasterService.danger(`Add data failed: ${e.message || ""}`, 'Error');
        } finally {
            this.inadding = false;
        }
    }
}
