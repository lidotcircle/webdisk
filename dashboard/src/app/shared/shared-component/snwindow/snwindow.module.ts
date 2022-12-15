import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SNWindowComponent, SNWindowInnerComponent } from './snwindow.component';


@NgModule({
    declarations: [
        SNWindowComponent,
        SNWindowInnerComponent,
    ],
    imports: [
        CommonModule
    ]
})
export class SNWindowModule { }
