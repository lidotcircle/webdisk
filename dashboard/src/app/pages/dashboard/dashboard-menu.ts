import { NbMenuItem } from '@nebular/theme';

export class MenuItem extends NbMenuItem {
    descriptor?: string;
    children?: MenuItem[];
}

export const WebdiskMenu: NbMenuItem[] = [
    {
        title: 'disk',
        icon: 'house',
        link: '/wd/dashboard/home',
        children: [
            {
                title: 'explorer',
                icon: 'folder',
                link: '/wd/dashboard/home/explorer',
            },
            {
                title: 'namedlink',
                icon: 'link',
                link: '/wd/dashboard/home/namedlink',
            },
            {
                title: 'Storage',
                icon: 'store',
                link: '/wd/dashboard/home/storage',
            }
        ]
    },
    {
        title: 'download',
        icon: 'download',
        link: '/wd/dashboard/download',
    },
    {
        title: 'passstore',
        icon: 'key',
        link: '/wd/dashboard/store-pass',
    },
    {
        title: 'note',
        icon: 'sticky-note',
        link: '/wd/dashboard/note',
        pathMatch: 'prefix',
        children: [
            {
                title: 'timeline',
                icon: 'timeline',
                pathMatch: 'full',
                link: '/wd/dashboard/note/timeline',
            },
            {
                title: 'tags',
                icon: 'tags',
                pathMatch: 'full',
                link: '/wd/dashboard/note/tags',
            },
            {
                title: 'markdown-editor',
                icon: 'layout',
                link: '/wd/dashboard/note/markdown-editor',
                hidden: true,
            },
            {
                title: 'markdown-viewer',
                icon: 'layout',
                link: '/wd/dashboard/note/markdown-viewer',
                hidden: true,
            },
            {
                title: 'todo-list-editor',
                icon: 'layout',
                link: '/wd/dashboard/note/todo-list-editor',
                hidden: true,
            },
            {
                title: 'todo-list-viewer',
                icon: 'layout',
                link: '/wd/dashboard/note/todo-list-viewer',
                hidden: true,
            }
        ]
    },
    {
        title: 'chart',
        icon: 'chart-line',
        link: '/wd/dashboard/chart',
        children: [
            {
                title: 'table',
                icon: 'table',
                link: '/wd/dashboard/chart/group-table',
            },
            {
                title: 'add',
                icon: 'plus-circle',
                link: '/wd/dashboard/chart/add-data',
            },
            {
                title: 'graph',
                icon: 'layout',
                link: '/wd/dashboard/chart/graph',
                hidden: true,
            },
            {
                title: 'table-view',
                icon: 'layout',
                link: '/wd/dashboard/chart/table-view',
                hidden: true,
            }
        ]
    },
    {
        title: 'settings',
        icon: 'gears',
        link: '/wd/dashboard/settings',
        /*
        children: [
            {
                title: 'account',
                icon: 'person-outline',
                link: '/wd/dashboard/settings',
                queryParams: {
                    panel: 'user-account',
                }
            },
            {
                title: 'invitation',
                icon: 'people-outline',
                link: '/wd/dashboard/settings',
                queryParams: {
                    panel: 'sub-account',
                }
            },
            {
                title: 'display',
                icon: 'color-palette',
                link: '/wd/dashboard/settings',
                queryParams: {
                    panel: 'display',
                }
            },
            {
                title: 'about',
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
