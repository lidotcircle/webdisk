import { NbMenuItem } from '@nebular/theme';
import { TranslocoService } from '@ngneat/transloco';


export class MenuItem extends NbMenuItem {
    descriptor?: string;
    children?: MenuItem[];
}

export function getWebdiskMenu(translocoService: TranslocoService): NbMenuItem[] {
    return [
        {
            title: translocoService.translate('disk'),
            icon: 'house',
            link: '/wd/dashboard/home',
            children: [
                {
                    title: translocoService.translate('explorer'),
                    icon: 'folder',
                    link: '/wd/dashboard/home/explorer',
                },
                {
                    title: translocoService.translate('namedlink'),
                    icon: 'link',
                    link: '/wd/dashboard/home/namedlink',
                },
                {
                    title: translocoService.translate('Storage'),
                    icon: 'store',
                    link: '/wd/dashboard/home/storage',
                }
            ]
        },
        {
            title: translocoService.translate('download'),
            icon: 'download',
            link: '/wd/dashboard/download',
        },
        {
            title: translocoService.translate('passstore'),
            icon: 'key',
            link: '/wd/dashboard/store-pass',
        },
        {
            title: translocoService.translate('note'),
            icon: 'sticky-note',
            link: '/wd/dashboard/note',
            pathMatch: 'prefix',
            children: [
                {
                    title: translocoService.translate('timeline'),
                    icon: 'timeline',
                    pathMatch: 'full',
                    link: '/wd/dashboard/note/timeline',
                },
                {
                    title: translocoService.translate('tags'),
                    icon: 'tags',
                    pathMatch: 'full',
                    link: '/wd/dashboard/note/tags',
                },
                {
                    title: translocoService.translate('markdown-editor'),
                    icon: 'layout',
                    link: '/wd/dashboard/note/markdown-editor',
                    hidden: true,
                },
                {
                    title: translocoService.translate('markdown-viewer'),
                    icon: 'layout',
                    link: '/wd/dashboard/note/markdown-viewer',
                    hidden: true,
                },
                {
                    title: translocoService.translate('todo-list-editor'),
                    icon: 'layout',
                    link: '/wd/dashboard/note/todo-list-editor',
                    hidden: true,
                },
                {
                    title: translocoService.translate('todo-list-viewer'),
                    icon: 'layout',
                    link: '/wd/dashboard/note/todo-list-viewer',
                    hidden: true,
                }
            ]
        },
        {
            title: translocoService.translate('chart'),
            icon: 'chart-line',
            link: '/wd/dashboard/chart',
            children: [
                {
                    title: translocoService.translate('table'),
                    icon: 'table',
                    link: '/wd/dashboard/chart/group-table',
                },
                {
                    title: translocoService.translate('add'),
                    icon: 'plus-circle',
                    link: '/wd/dashboard/chart/add-data',
                },
                {
                    title: translocoService.translate('graph'),
                    icon: 'layout',
                    link: '/wd/dashboard/chart/graph',
                    hidden: true,
                },
                {
                    title: translocoService.translate('table-view'),
                    icon: 'layout',
                    link: '/wd/dashboard/chart/table-view',
                    hidden: true,
                }
            ]
        },
        {
            title: translocoService.translate('settings'),
            icon: 'gears',
            link: '/wd/dashboard/settings',
            /*
        children: [
            {
                title: translocoService.translate('account'),
                icon: 'person-outline',
                link: '/wd/dashboard/settings',
                queryParams: {
                    panel: 'user-account',
                }
            },
            {
                title: translocoService.translate('invitation'),
                icon: 'people-outline',
                link: '/wd/dashboard/settings',
                queryParams: {
                    panel: 'sub-account',
                }
            },
            {
                title: translocoService.translate('display'),
                icon: 'color-palette',
                link: '/wd/dashboard/settings',
                queryParams: {
                    panel: 'display',
                }
            },
            {
                title: translocoService.translate('about'),
                icon: 'question-mark-circle-outline',
                link: '/wd/dashboard/settings',
                queryParams: {
                    panel: 'about',
                }
            }
        ]
             */
        },
    ];
}
