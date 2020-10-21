
/*
export class ClientAccountManagerService {
    private token: string = null;

    constructor(private remoteAccountManagerWrapper: AccountManageService,
        private router: Router,
        private location: Location) {
        this.token = this.localstorage.get(StaticValue.LOGIN_TOKEN, null);
    }

    private update() {
        this.token = this.localstorage.get(StaticValue.LOGIN_TOKEN, null);
    }

    async login(account: string, password: string): Promise<StaticValue.LoginToken> {
        const token = this.remoteAccountManagerWrapper.login(account, password);
        if (token) {
            this.localstorage.set(StaticValue.LOGIN_TOKEN, token);
            this.invokeChangeHook();
        }
        return token;
    }

    async logout() {
        this.update();
        this.remoteAccountManagerWrapper.removeLoginToken(this.token);
        this.localstorage.remove(StaticValue.LOGIN_TOKEN);
        this.token = null;
        this.invokeChangeHook();

        this.location.go('/');
        location.reload();
    }

    private authcode_token: AUTHCODE_TOKEN;
    private reset_account: string;
    async resetPasswordRequest(phone: string): Promise<string> {
        let md5 = null;
        [this.authcode_token, md5] = this.remoteAccountManagerWrapper.resetPasswordRequest(phone) || [null, null];
        this.reset_account = phone;
        return md5;
    }

    async resetPasswordConfirm(code: string, password: string): Promise<boolean> {
        if (!this.authcode_token) {
            return false;
        }
        const ans = this.remoteAccountManagerWrapper.resetPasswordConfirm(this.authcode_token, this.reset_account, code, password);
        this.authcode_token = null;
        this.reset_account = null;
        return ans;
    }

    private new_user_token: AUTHCODE_TOKEN;
    async newUserRequest(phone: string): Promise<string> {
        const ans = this.remoteAccountManagerWrapper.newUserRequest(phone);
        if (!ans) return null;

        this.new_user_token = ans[0];
        const md5 = ans[1];

        return md5;
    }

    async newUserConfirm(user: StaticValue.SignupDataModel): Promise<boolean> {
        if (!this.new_user_token) return false;
        const token = this.new_user_token;
        this.new_user_token = null;

        return this.remoteAccountManagerWrapper.addUser(token, user);
    }

    async hasUsername(username: string): Promise<boolean> {
        return this.remoteAccountManagerWrapper.hasName(username);
    }

    async hasPhone(phone: string): Promise<boolean> {
        return this.remoteAccountManagerWrapper.hasPhone(phone);
    }

    async hasEmail(email: string): Promise<boolean> {
        return this.remoteAccountManagerWrapper.hasEmail(email);
    }

    async userinfo(): Promise<StaticValue.UserBasicInfo> {
        this.update();
        if (this.token != null) {
            const ans = this.remoteAccountManagerWrapper.userBasicInfo(this.token);
            return ans;
        }
        return null;
    }

    async updateUserInfo(info: StaticValue.UserBasicInfo): Promise<boolean> {
        this.update();
        const ans: boolean = this.remoteAccountManagerWrapper.ChangeUserInfo(this.token, info);
        if (ans) {
            this.invokeChangeHook();
        }
        return ans;
    }

    private changeHooks = [];
    subscribeAccountChange(func: () => void) {
        this.changeHooks.push(func);
    }
    private invokeChangeHook() {
        for (let f of this.changeHooks) {
            try {
                f();
            } catch (err) {
                console.warn(err);
            }
        }
    }
}
*/
