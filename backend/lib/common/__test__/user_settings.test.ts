import { UserSettings } from "../user_settings";

test('user setting', () => {
    const nu = new UserSettings();
    const ju = UserSettings.fromJSON('{}');
    expect(nu).toEqual(ju);

    nu.ContinueSendFileWithSameMD5 = false;
    nu.HttpRedirect = false;
    nu.MoveFolderWithoutConfirm = false;
    nu.UsingLoginTokenInPlayer = false;
    const pu = UserSettings.fromJSON(JSON.stringify(nu));
    expect(pu.ContinueSendFileWithSameMD5).toBeFalsy();
    expect(pu.HttpRedirect).toBeFalsy();
    expect(pu.MoveFolderWithoutConfirm).toBeFalsy();
    expect(pu.UsingLoginTokenInPlayer).toBeFalsy();
});


