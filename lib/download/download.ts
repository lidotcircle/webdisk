import { default as fetch, Response } from 'node-fetch';
import path from 'path';
import { URL } from 'url';


class Task {
    id: number = 0;
    url: string = null;
    name: string = null;
    size: number = null;
    partial: boolean = false;
    fail: boolean = false;
    temporaryFile: string = null;
}

export async function startTask(url: string): Promise<Task> {
    const ans = new Task();
    ans.url = url;
    const u = new URL(url);
    ans.name = path.basename(u.pathname);

    const head = await fetch(url, {method: 'HEAD', compress: true, size: 1});
    if(head.headers.get('content-length')) {
        ans.size = Number(head.headers.get('content-length'));
    }
    if(head.headers.get('accepts-range') == 'bytes') {
        ans.partial = true;
    }

    return ans;
}

