import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { StorePassRoutingModule } from './store-pass-routing.module';
import { StorePassComponent } from './store-pass.component';
import { SharedModule } from 'src/app/shared/shared.module';
import { StoreComponent } from './store/store.component';
import { NbButtonModule, NbCardModule } from '@nebular/theme';


@NgModule({
    declarations: [StorePassComponent, StoreComponent],
    imports: [
        CommonModule,
        SharedModule,
        NbCardModule,
        NbButtonModule,
        StorePassRoutingModule
    ]
})
export class StorePassModule { }
