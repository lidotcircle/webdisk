import path from 'path';
import fs from 'fs';
import { Config, ConfigPathProviderName } from '../config';
import { CloseLogger } from '../logger';
import { AsyncQueryDependency, DIProperty, GlobalInjector, ProvideDependency, QueryDependency, ResolveInitPromises } from '../di';
import { WDDatabase } from '../database/database';
import { IDBUserSettings, IDBToken, IDBStorePass } from '../database';
CloseLogger();

try {
    if(fs.statSync('/tmp/testwd.db')) {
        fs.unlinkSync('/tmp/testwd.db');
    }
} catch {}
ProvideDependency(null, {name: ConfigPathProviderName, object: path.join(__dirname, 'conf.json')});

test('config', async () => {
    const conf = await AsyncQueryDependency(Config);
    expect(conf.listen_addr).toBe('1.2.3.4');
    expect(conf.listen_port).toBe(10107);
    expect(conf.allow_http_redirect).toBe(true);
    expect(conf.filesystem.type).toBe("local");

    expect(() => conf.listen_addr = '0.0.0.0').toThrowError();
    expect(() => conf.filesystem.type = 'hello' as any).toThrowError();
    expect(conf.listen_addr).toBe('1.2.3.4');
    expect(conf.filesystem.type).toBe("local");
});


const DB = QueryDependency(WDDatabase) as WDDatabase & IDBUserSettings & IDBToken & IDBStorePass;
test('basic user', async () => {
    await ResolveInitPromises();
    const token = await DB.login('administrator', '123456');
    expect(token != null).toBe(true);

    expect(DB.login('administrator', '1234567')).rejects.not.toBeNull();
    expect(DB.login('administratoy', '123456' )).rejects.not.toBeNull();

    const userinfo = await DB.getUserInfo(token);
    expect(userinfo.username).toEqual('administrator');

    await DB.logout(token);;
});

test('user settings', async () => {
    await ResolveInitPromises();
    const token = await DB.login('administrator', '123456');
    const settings = await DB.getUserSettings(token);
    settings.ContinueSendFileWithSameMD5 = false;
    settings.HttpRedirect = false;
    settings.MoveFolderWithoutConfirm = false;
    settings.UsingLoginTokenInPlayer = false;
    await DB.setUserSettings(token, settings);

    const v = await DB.getUserSettings(token);
    expect(v.HttpRedirect).toBeFalsy();
    expect(v.ContinueSendFileWithSameMD5).toBeFalsy();
    expect(v.MoveFolderWithoutConfirm).toBeFalsy();
    expect(v.UsingLoginTokenInPlayer).toBeFalsy();
});

test('add/remove new user', async () => {
    await ResolveInitPromises();
    const token = await DB.login('administrator', '123456');
    await DB.generateInvitationCode(token, 1);
    const invs = await DB.getInvitationCodes(token);;
    expect(invs.length > 1).toBeTruthy();

    const newuser = await DB.addUser('fakeuser', 'password', invs[1][0]);
    const ntoken = await DB.login('fakeuser', 'password');

    await DB.removeUser(ntoken, 'fakeuser', 'password');
    try {
        await DB.login('fakeuser', 'password');
        throw new Error('remove user fail');
    } catch {}
});

test('change password', async () => {
    await ResolveInitPromises();
    const token = await DB.login('administrator', '123456');
    await DB.changePassword(token, '123456', '654321');
    try {
        await DB.getUserInfo(token)
        throw new Error('require remove login tokens');
    } catch {}
    const t2 = await DB.login('administrator', '654321');
    await DB.changePassword(t2, '654321', '123456');
});

test('reset password', async () => {
    await ResolveInitPromises();
    const token = await DB.login('administrator', '123456');
    await DB.generateInvitationCode(token, 1);
    const invs = await DB.getInvitationCodes(token);
    expect(invs.length).toBeGreaterThan(1);
    await DB.addUser('fakeuser', 'password', invs[invs.length - 1][0]);
    await DB.resetPassword('fakeuser', 'oldpassword', invs[invs.length - 1][0]);
    const t1 = await DB.login('fakeuser', 'oldpassword');
    expect(t1).not.toBeNull();

    await DB.removeUser(t1, 'fakeuser', 'oldpassword');
});

test('store pass', async () => {
    await ResolveInitPromises();
    const token = await DB.login('administrator', '123456');
    const passid = await DB.newPass(token, 'https://example.com', 'user', 'password');
    const allpass = await DB.getAllPass(token);
    expect(allpass.length).toBeGreaterThan(0);
    expect(allpass[allpass.length - 1].passid).toBe(passid);
    expect(allpass[allpass.length - 1].site).toBe('https://example.com');
    expect(allpass[allpass.length - 1].account).toBe('user');
    expect(allpass[allpass.length - 1].pass).toBe('password');
    await DB.changePass(token, passid, 'newpassword');
    const allpass__ = await DB.getAllPass(token);
    expect(allpass__.length).toEqual(allpass.length);
    expect(allpass__[allpass__.length - 1].pass).toBe('newpassword');
    await DB.deletePass(token, passid);
    await DB.logout(token);
});

test('db property', async () => {
    class dbt {
        @DIProperty(WDDatabase)
        db: WDDatabase;
    }

    const t = new dbt();
    expect(t.db instanceof WDDatabase).toBeTruthy();
});

