import { Component, Input, OnInit } from '@angular/core';
import { Tool } from '../../toolbar.service';

@Component({
    selector: 'app-fileview-tool',
    templateUrl: './tool.component.html',
    styleUrls: ['./tool.component.scss']
})
export class ToolComponent implements OnInit {
    @Input()
    tool: Tool;

    constructor() { }

    ngOnInit(): void {}   

    onClick() {
        if(this.tool.clickHook && this.enable) {
            this.tool.clickHook();
        }
    }

    get enable() {
        return !this.tool.enableTool || this.tool.enableTool();
    }
}

