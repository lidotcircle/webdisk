import { ModuleWithProviders, NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
    NbActionsModule,
    NbLayoutModule,
    NbMenuModule,
    NbSearchModule,
    NbSidebarModule,
    NbUserModule,
    NbContextMenuModule,
    NbButtonModule,
    NbSelectModule,
    NbIconModule,
    NbThemeModule,
} from '@nebular/theme';
import { NbSecurityModule } from '@nebular/security';

import {
    FooterComponent,
    HeaderComponent,
    SearchInputComponent,
} from './components';
import {
    CapitalizePipe,
    PluralPipe,
    RoundPipe,
    TimingPipe,
    NumberWithCommasPipe,
} from './pipes';
import {
    OneColumnLayoutComponent,
    OneColumnSinglePageLayoutComponent,
    ThreeColumnsLayoutComponent,
    TwoColumnsLayoutComponent,
} from './layouts';
import { DEFAULT_THEME } from './styles/theme.default';
import { COSMIC_THEME } from './styles/theme.cosmic';
import { CORPORATE_THEME } from './styles/theme.corporate';
import { DARK_THEME } from './styles/theme.dark';
import { RouterModule } from '@angular/router';


const NB_MODULES = [
    NbLayoutModule,
    NbMenuModule,
    NbUserModule,
    NbActionsModule,
    NbSearchModule,
    NbSidebarModule,
    NbContextMenuModule,
    NbSecurityModule,
    NbButtonModule,
    NbSelectModule,
    NbIconModule,
];
const COMPONENTS = [
    HeaderComponent,
    FooterComponent,
    SearchInputComponent,
    OneColumnLayoutComponent,
    OneColumnSinglePageLayoutComponent,
    ThreeColumnsLayoutComponent,
    TwoColumnsLayoutComponent,
];
const PIPES = [
    CapitalizePipe,
    PluralPipe,
    RoundPipe,
    TimingPipe,
    NumberWithCommasPipe,
];

@NgModule({
    imports: [CommonModule, RouterModule, ...NB_MODULES],
    exports: [CommonModule, ...PIPES, ...COMPONENTS],
    declarations: [...COMPONENTS, ...PIPES],
})
export class ThemeModule {
    static forRoot(): ModuleWithProviders<ThemeModule> {
        return {
            ngModule: ThemeModule,
            providers: [
                ...NbThemeModule.forRoot(
                    {
                        name: 'default',
                    },
                    [ DEFAULT_THEME, COSMIC_THEME, CORPORATE_THEME, DARK_THEME ],
                ).providers,
            ],
        };
    }
}
