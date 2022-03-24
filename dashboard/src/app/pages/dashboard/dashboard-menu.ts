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
        title: 'settings',
        icon: 'settings-2-outline',
        link: '/wd/dashboard/settings',
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
            }
        ]
    },
];
