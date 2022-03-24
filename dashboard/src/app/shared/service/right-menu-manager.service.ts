import { Injectable } from '@angular/core';
import { Observable, Subject } from 'rxjs';
import { ContextMenuComponent } from '../shared-component/context-menu/context-menu.component';
import { InjectedComponentHandler, InjectViewService } from './inject-view.service';

// DISPLAY MENU ITEMS IN ORDER
export enum MenuEntryType {
    HomeMenuCLick,
    DirMenuClick,
    FileMenuClick,
    FileView,
    Default,
    AllPresent,
}

export type MenuItemClickCallback = () => void;
export class MenuEntryDivide {
    divide: boolean = true;
}
export class MenuEntry {
    constructor(entryName?: string, icon?: string) {
        this.entryName = entryName;
        this.icon = icon;
    }

    entryName: string;
    icon: string;
    enable: () => boolean = () => true;
    clickCallback: MenuItemClickCallback;
    subMenus: (MenuEntry | MenuEntryDivide)[];
}

function relateElem(target: HTMLElement, parentN: HTMLElement): boolean {
    let n = 20;
    do {
        if(target == parentN) return true;
        target = target.parentElement;
        n--;
    } while(target != document.body && target && n > 0);
    return false;
}

@Injectable({
    providedIn: 'root'
})
export class RightMenuManagerService {
    private clickMenu = new Map<MenuEntryType, MenuEntry[]>();
    private defaultEntries: MenuEntry[] = [];
    private _menuclick = new Subject<void>();
    public get menuclick(): Observable<void> {return this._menuclick;}

    private menuView: InjectedComponentHandler<ContextMenuComponent>;
    private start: boolean = false;

    constructor(private injector: InjectViewService) {
        this.menuView = null;
        document.body.addEventListener('click',       (ev: MouseEvent) => this.onbody_click.bind(this)(ev));
        document.body.addEventListener('contextmenu', (ev: MouseEvent) => this.onbody_menu.bind(this)(ev));
        this.StartContextMenu();
    }

    public StartContextMenu() {
        if (!this.start) {
            console.log("start context menu service");
        }
        this.start = true;
    }

    private createRootMenuEntry(): MenuEntry {
        this.registerMenuEntry(MenuEntryType.Default, this.defaultEntries);

        let ans = new MenuEntry();
        ans.entryName = 'root';
        ans.clickCallback = null;
        ans.subMenus = [];
        let keys = [];
        for(const key of this.clickMenu.keys()) keys.push(key);
        keys.sort();
        for(const key of keys) {
            for(const entry of this.clickMenu.get(key)) {
                ans.subMenus.push(entry);
            }
            ans.subMenus.push(new MenuEntryDivide());
        }
        while(ans.subMenus.length > 0 && 
              ans.subMenus[ans.subMenus.length - 1] instanceof MenuEntryDivide) {
            ans.subMenus.pop();
        }
        return ans;
    }

    private onbody_click(ev: MouseEvent) {
        if(this.menuView) {
            this.menuView.destroy();
            this.menuView = null;
        }
    }

    private onbody_menu(ev: MouseEvent) {
        ev.preventDefault();
        if(this.menuView) {
            if(relateElem(ev.target as HTMLElement, this.menuView.instance.element)) {
                return;
            }
            this.onbody_click(ev);
        }

        const x = ev.clientX;
        const y = ev.clientY;
        this.menuView = this.injector.inject(ContextMenuComponent, {
                positionX: x, 
                positionY: y, 
                entry: this.createRootMenuEntry()
            });
        this.clickMenu.clear();
    }

    public registerMenuEntry(menutype: MenuEntryType, entries: MenuEntry[]) {
        console.assert(!this.clickMenu.has(menutype));
        entries.forEach(entry => console.assert(entry != null));
        this.clickMenu.set(menutype, entries.slice(0));
    }
}

