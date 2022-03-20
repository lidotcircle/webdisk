import { Token, UserInfo } from "../../common/db_types";
import { ErrorMSG } from "../../common/string";
import { makeid } from "../../utils";
import { KEY_TOKEN, KEY_USER, LAST_ACTIVATION_SPAN, TOKEN_LENGTH } from "../constants";
import { WDDatabase } from "../database";
import { DBRelations } from "../relations";
import { Constructor, createSQLInsertion } from "../utils";
const MD5 = require('md5');

export interface IDBToken {
    login(username: string, password: string): Promise<Token>;
    logout(token: Token): Promise<void>;
}

function MixinFunction<T extends Constructor<Object>>(Base: T) { //{
    const Parent = Base as unknown as Constructor<WDDatabase>; //}

class MixinedDatabase extends Parent implements IDBToken {
    constructor(...args) //{
    {
        super(...args);

        this.preconditions.push(async () => {
            await this.run(`CREATE TABLE IF NOT EXISTS ${KEY_TOKEN} (
                                token TEXT(256) PRIMARY KEY,
                                uid   INTEGER NOT NULL CHECK(uid >= 0),
                                last  INTEGER   NOT NULL CHECK(last > 0),
                                FOREIGN KEY (uid) references ${KEY_USER}(uid) ON DELETE CASCADE);`);
        });
    } //}

    protected async checkToken(token: Token): Promise<number> //{
    {
        const now = Date.now();
        const data = await this.get(`SELECT uid, last FROM ${KEY_TOKEN} WHERE token='${token}';`);
        if(!data) {
            throw new Error(ErrorMSG.AuthenticationFail);
        }

        if ((now - data.last) > LAST_ACTIVATION_SPAN) {
            await this.run(`DELETE FROM ${KEY_TOKEN} WHERE token='${token}';`);
            throw new Error(ErrorMSG.AuthenticationFail);
        } else {
            await this.run(`UPDATE ${KEY_TOKEN} SET last=${now} WHERE token='${token}';`);
            return data['uid'];
        }
    } //}
    
    protected async removeTokenByUid(uid: number): Promise<void> //{
    {
        await this.run(`DELETE FROM ${KEY_TOKEN} WHERE uid=${uid};`);
    } //}

    private async generateToken(uid: number): Promise<Token> //{
    {
        if (uid < 0) {
            throw new Error('Bad uid which must greater than 0');
        };

        let new_record = new DBRelations.AuthenticationToken();
        new_record.last  = Date.now();
        new_record.token = makeid(56);
        new_record.uid   = uid;
        const insert = createSQLInsertion(DBRelations.AuthenticationToken, [new_record]);
        await this.run(`INSERT INTO ${KEY_TOKEN} ${insert};`);

        return new_record.token;
    } //}

    async login(username: string, password: string): Promise<Token> //{
    {
        const user = await this.getUserRecordByUsername(username);
        const uid: number = user.uid;
        const perm = await this.getPermisstionByUid(uid);
        if(!perm.enable) {
            throw new Error(ErrorMSG.AccountBeSuspended);
        }

        if(MD5(password) == user.password) {
            return await this.generateToken(uid);
        } else {
            throw new Error(ErrorMSG.BadUsernamePassword)
        }
    } //}

    async logout(token: Token): Promise<void> //{
    {
        await this.run(`DELETE FROM ${KEY_TOKEN} WHERE token='${token}';`);
        return;
    } //}
}

    return MixinedDatabase as Constructor<MixinedDatabase & InstanceType<T>>; //{
} //}


export const DB_Token = MixinFunction as (v: any) => any;

