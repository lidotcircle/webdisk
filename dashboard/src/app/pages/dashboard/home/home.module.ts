import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { HomeRoutingModule } from './home-routing.module';
import { SharedModule } from 'src/app/shared/shared.module';
import { ExplorerComponent } from './explorer/explorer.component';
import { FileViewModule } from './explorer/file-view/file-view.module';
import { DirectoryTreeComponent } from './explorer/directory-tree/directory-tree.component';
import { NamedLinkComponent } from './named-link/named-link.component';
import { HomeComponent } from './home.component';
import { StorageBackendComponent } from './storage-backend/storage-backend.component';


@NgModule({
    declarations: [ HomeComponent, ExplorerComponent, DirectoryTreeComponent, NamedLinkComponent, StorageBackendComponent, ],
    imports: [
        CommonModule,
        HomeRoutingModule,
        SharedModule,
        FileViewModule
    ]
})
export class HomeModule {}
