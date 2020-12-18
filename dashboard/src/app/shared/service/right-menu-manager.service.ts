import { Injectable } from '@angular/core';
import { ContextMenuComponent } from '../shared-component/context-menu/context-menu.component';
import { InjectViewService } from './inject-view.service';

export enum MenuEntryType {
    DirMenuClick,
    FileMenuClick,
    HomeMenuCLick,
    AllPresent,
    Default,
}

export type MenuItemClickCallback = () => void;
export class MenuEntryDivide {
    divide: boolean = true;
}
export class MenuEntry {
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

    private menuView: ContextMenuComponent;
    private start: boolean = false;

    constructor(private injector: InjectViewService) {
        this.menuView = null;
        document.body.addEventListener('click',       (ev: MouseEvent) => this.onbody_click.bind(this)(ev));
        document.body.addEventListener('contextmenu', (ev: MouseEvent) => this.onbody_menu.bind(this)(ev));
        this.StartContextMenu();

        const entry = new MenuEntry();
        entry.clickCallback = () => {console.log("hello");}
        entry.entryName = "hello world";
        entry.icon = "content_copy";
        entry.enable = () => false;
        const entry2 = new MenuEntry();
        entry2.clickCallback = () => {console.log("world");}
        entry2.entryName = "world hello";
        entry2.enable = () => false;
        entry.subMenus = [];
        const divide = new MenuEntryDivide();
        entry.subMenus.push(entry2);
        entry.subMenus.push(divide);
        entry.subMenus.push(entry2);
        entry.subMenus.push(entry2);
        entry.subMenus.push(divide);
        entry.subMenus.push(entry2);
        this.defaultEntries.push(entry);
        this.defaultEntries.push(entry);
        entry.subMenus.push(divide);
        this.defaultEntries.push(entry);
        this.defaultEntries.push(entry);
        entry.subMenus.push(divide);
        this.defaultEntries.push(entry);
        this.defaultEntries.push(entry2);
        this.registerMenuEntry(MenuEntryType.Default, this.defaultEntries);
    }

    public StartContextMenu() {
        if (!this.start) {
            console.log("start context menu service");
        }
        this.start = true;
    }

    private createRootMenuEntry(): MenuEntry {
        let ans = new MenuEntry();
        ans.entryName = 'root';
        ans.clickCallback = null;
        ans.subMenus = [];
        for(const key of this.clickMenu.keys()) {
            for(const entry of this.clickMenu.get(key)) {
                ans.subMenus.push(entry);
            }
            ans.subMenus.push(new MenuEntryDivide());
        }
        if(ans.subMenus.length > 0) ans.subMenus.pop();
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
            if(relateElem(ev.target as HTMLElement, this.menuView.element)) {
                return;
            }
            this.onbody_click(ev);
        }

        const x = ev.clientX;
        const y = ev.clientY;
        this.menuView = this.injector.inject(ContextMenuComponent, {
                positionX: x, 
                positionY: y, 
                rootMenuEntry: this.createRootMenuEntry()
            });
        this.clickMenu.clear();
        this.registerMenuEntry(MenuEntryType.Default, this.defaultEntries);
    }

    public registerMenuEntry(menutype: MenuEntryType, entries: MenuEntry[]) {
        this.clickMenu.set(menutype, entries.slice(0));
    }
}

