import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { FormsModule } from '@angular/forms';
import { SharedComponentModule } from './shared-component/shared-component.module';
import { SharedDirectiveModule } from './shared-directive/shared-directive.module';


@NgModule({
    declarations: [],
    imports: [
        CommonModule,
    ],
    exports: [
        FormsModule,
        MatInputModule,
        MatButtonModule,
        MatIconModule,

        SharedDirectiveModule,
        SharedComponentModule
    ]
})
export class SharedModule { }
