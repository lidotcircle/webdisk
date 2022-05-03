import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NameDirective } from './validation/name.directive';
import { MovableDirective } from './movable-component.directive';



@NgModule({
    declarations: [NameDirective, MovableDirective],
    imports: [
        CommonModule
    ],
    exports: [
        NameDirective,
        MovableDirective,
    ]
})
export class SharedDirectiveModule { }

