import { Component, OnDestroy, OnInit } from '@angular/core';
import { Subscription } from 'rxjs';
import { Tool, ToolbarService } from '../toolbar.service';

@Component({
    selector: 'app-tools',
    templateUrl: './tools.component.html',
    styleUrls: ['./tools.component.scss']
})
export class ToolsComponent implements OnInit, OnDestroy {
    tools: Tool[][];
    constructor(private toolservice: ToolbarService) { }

    private toolsubscription: Subscription;
    ngOnInit(): void {
        this.toolsubscription = this.toolservice.change.subscribe(() => {
            this.tools = this.toolservice.tools;
        });
        this.tools = this.toolservice.tools;
    }

    ngOnDestroy(): void {
        this.toolsubscription.unsubscribe();
    }
}

