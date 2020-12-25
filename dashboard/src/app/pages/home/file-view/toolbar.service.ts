import { Injectable } from '@angular/core';
import { Observable, Subject } from 'rxjs';
import { Life } from 'src/app/shared/utils';

export enum ToolType {
    Navigation,
    Clipboard,
    FileManage,
    SortStuff,
    LinkManage,
}

export class Tool {
    private _name: string;
    private _icon: string;
    private _external: boolean;
    cssclass: string = '';

    constructor(name: string, icon: string, external_icon: boolean = false, clickhook?: () => void, enable?: () => boolean) {
        this._name = name;
        this._icon = icon;
        this._external = external_icon;
        this.clickHook = clickhook;
        this.enableTool = enable || this.enableTool;
    }

    clickHook: () => void = null;
    enableTool: () => boolean = () => true;

    get name() {return this._name;}
    get icon() {return this._icon;}
    get external() {return this._external;}
}

@Injectable({
    providedIn: 'root'
})
export class ToolbarService {
    private _tools: Map<ToolType, [number,Tool][]> = new Map();
    private _change: Subject<void> = new Subject<void>();
    private _count: number = 0;

    get change(): Observable<void> {return this._change;}
    get tools(): Tool[][] {
        let ans = [];

        for(const key of this._tools.keys()) {
            const ts = this._tools.get(key);
            ans.push(this._tools.get(key).map(v => v[1]));
        }

        return ans;
    }

    constructor() {}

    register(type: ToolType, tool: Tool, life: Life) {
        let count = this._count++;
        if(!this._tools.has(type)) {
            this._tools.set(type, []);
        }
        this._tools.get(type).push([count,tool]);
        this._change.next();

        life.onend(() => {
            const m = this._tools.get(type);
            for(let i=0;i<m.length;i++) {
                if(m[i][0] == count) {
                    m.splice(i, 1);
                    break;
                }
            }

            this._change.next();
        });
    }
}

