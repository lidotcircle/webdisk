
export class UserSettings {
    ContinueSendFileWithSameMD5: boolean = true;
    MoveFolderWithoutConfirm: boolean = false;
    UsingLoginTokenInPlayer: boolean = true;
    HttpRedirect: boolean = true;

    static fromJSON(json: string): UserSettings {
        const ans = new UserSettings();
        const j = JSON.parse(json);

        for(const key in ans) {
            ans[key] = j[key] === undefined ? ans[key] : j[key];
        }

        return ans;
    }
}

