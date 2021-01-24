
export type Token = string;

export class UserPermission {
    enable: boolean = true;
    write: boolean = true;
    chat:  boolean = true;
    offlineDownload: boolean = true;

    namedlinkquota: number = -1;
    exceedLinkQuota(n: number): boolean {
        return this.namedlinkquota != -1 && n > this.namedlinkquota;
    }
    invitequota:    number = -1;
    exceedInvQuota(n: number): boolean {
        return this.invitequota != -1 && n > this.invitequota;
    }

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

    static validPartial(perm: {[key: string]: any}): boolean {
        if(typeof perm !== 'object') {
            return false;
        }
        const v = new UserPermission();
        for(const key in perm) {
            if(v[key] === undefined) {
                return false;
            }
            const t = typeof perm[key];
            if(t != 'string' && t != 'number' && t != 'boolean') {
                return false;
            }
        }
        return true;
    }

    static validPermJSON(perm: string): boolean {
        try {
            const p = JSON.parse(perm);
            const v = new UserPermission();
            for(const key in v) {
                if(p[key] === undefined) return false;
            }
            return true;
        } catch {
            return false;
        }
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

