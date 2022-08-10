import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { HttpClientModule } from '@angular/common/http';
import { MatIconModule } from '@angular/material/icon';
import { ThemeModule } from './@theme/theme.module';
import {
  NbChatModule,
  NbDatepickerModule,
  NbDialogModule,
  NbMenuModule,
  NbSidebarModule,
  NbTimepickerModule,
  NbToastrModule,
  NbWindowModule,
} from '@nebular/theme';
import { CoreModule } from './@core/core.module';
import { InterceptorProviders } from './core/http';
import { TranslocoRootModule } from './transloco-root.module';


@NgModule({
    declarations: [
        AppComponent,
    ],
    imports: [
        BrowserModule,
        BrowserAnimationsModule,
        HttpClientModule,
        AppRoutingModule,
        CoreModule.forRoot(),
        NbSidebarModule.forRoot(),
        NbMenuModule.forRoot(),
        NbDatepickerModule.forRoot(),
        NbTimepickerModule.forRoot(),
        NbDialogModule.forRoot(),
        NbWindowModule.forRoot(),
        NbToastrModule.forRoot(),
        NbChatModule.forRoot(),
        ThemeModule.forRoot(),
        MatIconModule,
        TranslocoRootModule,
    ],
    providers: [...InterceptorProviders],
    bootstrap: [AppComponent]
})
export class AppModule { }
