import { Token, UserInfo } from "../../common/db_types";
import { ErrorMSG } from "../../common/string";
import { makeid } from "../../utils";
import { KEY_SHORTTERM_TOKEN, KEY_TOKEN, SHORT_TERM_TOKEN_LIVE_TIME, TOKEN_LENGTH } from "../constants";
import { WDDatabase } from "../database";
import { DBRelations } from "../relations";
import { Constructor, createSQLInsertion } from "../utils";

export interface IDBShortTermToken {
    UserInfoByShortTermToken(stoken: Token): Promise<UserInfo>;
    RequestShortTermToken(token: Token): Promise<Token>;
    DeleteShortTermToken(token: Token): Promise<void>;
}

function MixinFunction<T extends Constructor<Object>>(Base: T) { //{
    const Parent = Base as unknown as Constructor<WDDatabase>; //}

class MixinedDatabase extends Parent implements IDBShortTermToken {
    constructor(...args) //{
    {
        super(...args);

        this.preconditions.push(async () => {
            await this.run(`CREATE TABLE IF NOT EXISTS ${KEY_SHORTTERM_TOKEN} (
                token   TEXT(256) PRIMARY KEY,
                ATtoken TEXT(256) NOT NULL,
                start   INTEGER   NOT NULL CHECK(start > 0),
                FOREIGN KEY (ATtoken) references ${KEY_TOKEN} (token) ON DELETE CASCADE);`);
        });
    } //}

    async UserInfoByShortTermToken(stoken: Token): Promise<UserInfo> //{
    {
        const record = await this.get(`SELECT * FROM ${KEY_SHORTTERM_TOKEN} WHERE token='${stoken}';`) as DBRelations.ShortTermToken;
        if(!record) {
            throw new Error(ErrorMSG.BadToken);
        }

        const now = Date.now();
        if((now - record.start) > SHORT_TERM_TOKEN_LIVE_TIME) {
            await this.run(`DELETE FROM ${KEY_SHORTTERM_TOKEN} WHERE token='${stoken}';`);
            throw new Error(ErrorMSG.BadToken);
        } else {
            return await this.getUserInfo(record.ATtoken);
        }
    } //}

    async RequestShortTermToken(token: Token): Promise<Token> //{
    {
        const uid = await this.checkToken(token);

        let obj = new DBRelations.ShortTermToken();
        obj.token = makeid(TOKEN_LENGTH);
        obj.start = Date.now();
        obj.ATtoken = token;
        let insert = createSQLInsertion(DBRelations.ShortTermToken, [obj]);
        await this.run(`INSERT INTO ${KEY_SHORTTERM_TOKEN} ${insert}`);

        return obj.token;
    } //}

    async DeleteShortTermToken(token: Token): Promise<void> //{
    {
        await this.run(`DELETE FROM ${KEY_SHORTTERM_TOKEN} WHERE token='${token}';`);
    } //}
}

    return MixinedDatabase as Constructor<MixinedDatabase & InstanceType<T>>; //{
} //}


export const DB_ShortTermToken = MixinFunction as (v: any) => any;

