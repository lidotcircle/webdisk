import * as db from 'webdisk/lib/database';
import * as proc from 'process';

const dbpath = proc.env.HOME + '/.webdisk/test.db';

const u: db.Database = new db.Database(dbpath);

async function test() {
    await u.init();
    console.log("load db success");
    const success = await u.login("administrator", "123456");
    const stoken = await u.RequestShortTermToken(success);
    console.log(await u.UserInfoByShortTermToken(stoken));
    await u.DeleteShortTermToken(stoken);

    await u.generateInvitationCode(success, 2);
    const invites = await u.getInvitationCodes(success);
    await u.addUser('hello', 'goodyou', invites[1][0]);
    await u.logout('');

    console.log((await u.changePassword(success, '123456', 'xoxo1314') ? 'CP s' : 'CP f'));
    console.log((await u.changePassword(success, '123456', 'xoxo1314') ? 'CP s' : 'CP f'));
    console.log(await u.resetPassword('administrator', 'rootkey', 'ROOT_DOESNT_NEED_INVITATION_CODE'));

    console.log(await u.getUserInfo(success));
    console.log(await u.GetUser());
}

test();

