import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NameDirective } from './validation/name.directive';



@NgModule({
    declarations: [NameDirective],
    imports: [
        CommonModule
    ],
    exports: [
        NameDirective
    ]
})
export class SharedDirectiveModule { }

