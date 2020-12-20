import { Component, ElementRef, Input, OnDestroy, OnInit } from '@angular/core';
import { MenuEntry, MenuEntryDivide } from '../../service/right-menu-manager.service';
import { AbsoluteView, BeAbsoluteView } from '../absolute-view/absolute-view';
import { DontOverflow } from '../absolute-view/trait/dont-overflow';

@Component({
    selector: 'app-context-menu',
    templateUrl: './context-menu.component.html',
    styleUrls: ['./context-menu.component.scss']
})
@BeAbsoluteView()
export class ContextMenuComponent extends AbsoluteView implements OnInit {
    @Input()
    private positionX: number;
    @Input()
    private positionY: number;
    @Input()
    private rootMenuEntry: MenuEntry;

    constructor(private _h: ElementRef) {
        super(_h, new DontOverflow());
    }
    get element() {return this.elem;}
    get entries() {return this.rootMenuEntry.subMenus as MenuEntry[];}

    ngOnInit(): void {
        this.elem.style.left = this.positionX + 'px';
        this.elem.style.top  = this.positionY + 'px';
    }

    preventClick(ev: MouseEvent) {
        ev.stopPropagation();
    }

    level2Entries(n: number) {
        return this.entries[n].subMenus.slice(0);
    }

    onLevel1Click(i: number) {
        console.assert(!!this.entries[i].clickCallback);
        this.entries[i].clickCallback();
    }

    onLevel2Click(i: number, j: number) {
        // console.assert(!this.entries[i].clickCallback);
        console.assert(!!this.entries[i].subMenus);
        const E = this.entries[i].subMenus[j] as MenuEntry;
        console.assert(!!E && !!E.clickCallback);
        E.clickCallback();
    }
}

