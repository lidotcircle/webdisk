import { NbMenuItem } from '@nebular/theme';

export class MenuItem extends NbMenuItem {
    descriptor?: string;
    children?: MenuItem[];
}

export const WebdiskMenu: NbMenuItem[] = [
    {
        title: 'disk',
        icon: 'home-outline',
        link: '/wd/dashboard/home',
        children: [
            {
                title: 'explorer',
                icon: 'folder-outline',
                link: '/wd/dashboard/home/explorer',
            },
            {
                title: 'namedlink',
                icon: 'link-outline',
                link: '/wd/dashboard/home/namedlink',
            }
        ]
    },
    {
        title: 'download',
        icon: 'cloud-download-outline',
        link: '/wd/dashboard/download',
    },
    {
        title: 'passstore',
        icon: 'hash-outline',
        link: '/wd/dashboard/store-pass',
    },
    {
        title: 'note',
        icon: 'book-outline',
        link: '/wd/dashboard/note',
        pathMatch: 'prefix',
        children: [
            {
                title: 'timeline',
                icon: 'activity-outline',
                pathMatch: 'full',
                link: '/wd/dashboard/note/timeline',
            },
            {
                title: 'tags',
                icon: 'pricetags',
                pathMatch: 'full',
                link: '/wd/dashboard/note/tags',
            },
            {
                title: 'new',
                icon: 'plus-square-outline',
                pathMatch: 'full',
                link: '/wd/dashboard/note/new',
            },
            {
                title: 'markdown',
                icon: 'layout',
                link: '/wd/dashboard/note/markdown',
                hidden: true,
            },
            {
                title: 'todo-list',
                icon: 'layout',
                link: '/wd/dashboard/note/todo-list',
                hidden: true,
            }
        ]
    },
    {
        title: 'chart',
        icon: 'pie-chart-outline',
        link: '/wd/dashboard/chart',
        children: [
            {
                title: 'table',
                icon: 'list-outline',
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
        icon: 'settings-2-outline',
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
