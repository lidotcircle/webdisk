
export type Token = string;

export class UserPermission {
    write: boolean = true;
    chat:  boolean = true;
    offlineDownload: boolean = true;

    namedlinkquota: number = -1;
    invitequota:    number = -1;

    relativePath: string = '/';

    static fromString(permission: string): UserPermission {
        const ans = new UserPermission();
        const config = JSON.parse(permission);

        for(const key in ans) {
            if(config[key] !== undefined) {
                ans[key] = config[key]
            }
        }
        return ans;
    }

    static inherit(permission: UserPermission): UserPermission {
        const ans = new UserPermission();
        for(const key in ans) {
            ans[key] = permission[key];
        }
        ans.relativePath = '/';
        return ans;
    }

    static lessequal(a: UserPermission, b: UserPermission) {
        for(const key in a) {
            if(a[key] === true) {
                if(b[key] !== true) {
                    return false;
                }
            } else if(typeof a[key] === 'number') {
                if((a[key] === -1 || a[key] > b[key]) && b[key] !== -1) {
                    return false;
                }
            }
        }

        return true;
    }
}

export class UserInfo {
    username: string = null;
    rootPath: string = null;
    createTime: number = null;
}

export class NameEntry {
    name: string = null;
    destination: string = null;
    validEnd: number = null;
}

export class InvitationStatus {
    code: string = null;
    user: string = null;
    permission: string = null;
}

