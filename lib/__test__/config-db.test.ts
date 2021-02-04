import { WDDatabase } from '../database/database';
import path from 'path';
import { conf, GetConfig } from '../config';
import { IDBUserSettings } from 'lib/database/modules/user_settings';
import { CloseLogger } from '../logger';
CloseLogger();


test('config and database', async () => {
    await GetConfig(path.join(__dirname, 'conf.json'));
    expect(conf.listenAddress).toBe('1.2.3.4');
    expect(conf.listenPort).toBe(10107);
    expect(conf.DB).toBeInstanceOf(WDDatabase);

});

test('basic user', async () => {
    const token = await conf.DB.login('administrator', '123456');
    expect(token != null).toBe(true);

    expect(conf.DB.login('administrator', '1234567')).rejects.not.toBeNull();
    expect(conf.DB.login('administratoy', '123456' )).rejects.not.toBeNull();

    const userinfo = await conf.DB.getUserInfo(token);
    expect(userinfo.username).toEqual('administrator');

    await conf.DB.logout(token);;
    try {
        await conf.DB.logout('hello');
        throw new Error('bad logout');
    } catch {}
});

test('user settings', async () => {
    const token = await conf.DB.login('administrator', '123456');
    const settings = await conf.DB.getUserSettings(token);
    settings.ContinueSendFileWithSameMD5 = false;
    settings.HttpRedirect = false;
    settings.MoveFolderWithoutConfirm = false;
    settings.UsingLoginTokenInPlayer = false;
    await conf.DB.setUserSettings(token, settings);

    const v = await conf.DB.getUserSettings(token);
    expect(v.HttpRedirect).toBeFalsy();
    expect(v.ContinueSendFileWithSameMD5).toBeFalsy();
    expect(v.MoveFolderWithoutConfirm).toBeFalsy();
    expect(v.UsingLoginTokenInPlayer).toBeFalsy();
});

test('add/remove new user', async () => {
    const token = await conf.DB.login('administrator', '123456');
    await conf.DB.generateInvitationCode(token, 1);
    const invs = await conf.DB.getInvitationCodes(token);;
    expect(invs.length > 1).toBeTruthy();

    const newuser = await conf.DB.addUser('fakeuser', 'password', invs[1][0]);
    const ntoken = await conf.DB.login('fakeuser', 'password');

    await conf.DB.removeUser(ntoken, 'fakeuser', 'password');
    try {
        await conf.DB.login('fakeuser', 'password');
        throw new Error('remove user fail');
    } catch {}
});

