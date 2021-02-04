import { WDDatabase } from '../database/database';
import path from 'path';
import fs from 'fs';
import { conf, GetConfig } from '../config';
import { IDBUserSettings } from 'lib/database/modules/user_settings';
import { CloseLogger } from '../logger';
CloseLogger();

try {
    if(fs.statSync('/tmp/testwd.db')) {
        fs.unlinkSync('/tmp/testwd.db');
    }
} catch {}


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

test('change password', async () => {
    const token = await conf.DB.login('administrator', '123456');
    await conf.DB.changePassword(token, '123456', '654321');
    try {
        await conf.DB.getUserInfo(token)
        throw new Error('require remove login tokens');
    } catch {}
    const t2 = await conf.DB.login('administrator', '654321');
    await conf.DB.changePassword(t2, '654321', '123456');
});

test('reset password', async () => {
    const token = await conf.DB.login('administrator', '123456');
    await conf.DB.generateInvitationCode(token, 1);
    const invs = await conf.DB.getInvitationCodes(token);
    expect(invs.length).toBeGreaterThan(1);
    await conf.DB.addUser('fakeuser', 'password', invs[invs.length - 1][0]);
    await conf.DB.resetPassword('fakeuser', 'oldpassword', invs[invs.length - 1][0]);
    const t1 = await conf.DB.login('fakeuser', 'oldpassword');
    expect(t1).not.toBeNull();

    await conf.DB.removeUser(t1, 'fakeuser', 'oldpassword');
});

test('store pass', async () => {
    const token = await conf.DB.login('administrator', '123456');
    const passid = await conf.DB.newPass(token, 'https://example.com', 'user', 'password');
    const allpass = await conf.DB.getAllPass(token);
    expect(allpass.length).toBeGreaterThan(0);
    expect(allpass[allpass.length - 1].passid).toBe(passid);
    expect(allpass[allpass.length - 1].site).toBe('https://example.com');
    expect(allpass[allpass.length - 1].account).toBe('user');
    expect(allpass[allpass.length - 1].pass).toBe('password');
    await conf.DB.changePass(token, passid, 'newpassword');
    const allpass__ = await conf.DB.getAllPass(token);
    expect(allpass__.length).toEqual(allpass.length);
    expect(allpass__[allpass__.length - 1].pass).toBe('newpassword');
    await conf.DB.deletePass(token, passid);
    await conf.DB.logout(token);
});

