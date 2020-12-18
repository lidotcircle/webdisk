
export type Token = string;

export class UserInfo {
    username: string = null;
    rootPath: string = null;
    ring:     number = null;
    createTime: number = null;
}

export class NameEntry {
    name: string = null;
    destination: string = null;
    validEnd: number = null;
}

