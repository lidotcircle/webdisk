import { Token } from "../../common/db_types";
import { UserSettings } from "../../common/user_settings";
import { KEY_USER, KEY_USER_SETTINGS } from "../constants";
import { WDDatabase } from "../database";
import { DBRelations } from "../relations";
import { Constructor, createSQLInsertion } from "../utils";

export interface IDBUserSettings {
    setUserSettings(token: Token, settings: UserSettings): Promise<void>;
    getUserSettings(token: Token): Promise<UserSettings>;
}
const UserSettingsCache: {[key: string]: UserSettings} = {};


function MixinFunction<T extends Constructor<Object>>(Base: T) { //{
    const Parent = Base as unknown as Constructor<WDDatabase>;
//}

class MixinedDatabase extends Parent implements IDBUserSettings {
    constructor(...args: any[]) //{
    {
        super(...args);

        this.preconditions.push(async () => {
            await this.run(`
                CREATE TABLE IF NOT EXISTS ${KEY_USER_SETTINGS} (
                    uid INTEGER PRIMARY KEY,
                    settings TEXT NOT NULL,
                    FOREIGN KEY (uid) references ${KEY_USER}(uid) ON DELETE CASCADE);`);
        });
    } //}

    async setUserSettings(token: Token, settings: UserSettings): Promise<void> //{
    {
        const uid = await this.checkToken(token);

        if(UserSettingsCache[uid]) {
            delete UserSettingsCache[uid];
        }
        const str = JSON.stringify(settings);
        if (await this.getUserSettings(token) == null) {
            const setting = new DBRelations.UserSettings();
            setting.uid = uid;
            setting.settings = str;
            const insert_data = createSQLInsertion(DBRelations.UserSettings, [setting]);
            await this.run(`INSERT INTO ${KEY_USER_SETTINGS} ${insert_data};`);
        } else {
            await this.run(`UPDATE ${KEY_USER_SETTINGS} SET settings='${str}' WHERE uid=${uid};`);
        }
    } //}

    protected async getUserSettingsByUid(uid: number): Promise<UserSettings> //{
    {
        if(UserSettingsCache[uid] != null)
            return UserSettingsCache[uid];
        const data = await this.get(`SELECT * FROM ${KEY_USER_SETTINGS} WHERE uid=${uid}`);
        const ans = UserSettings.fromJSON(data && data["settings"] || '{}');
        UserSettingsCache[uid] = ans;
        return ans;
    } //}

    async getUserSettings(token: Token): Promise<UserSettings> //{
    {
        const uid = await this.checkToken(token);
        return await this.getUserSettingsByUid(uid);
    } //}
}

    return MixinedDatabase as Constructor<MixinedDatabase & InstanceType<T>>; //{
} //}


export const DB_UserSettings = MixinFunction as (v: any) => any;

