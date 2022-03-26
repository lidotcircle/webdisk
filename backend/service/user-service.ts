import { getDataSource } from "../index";
import { User, RefreshToken, InvitationCode, UserSetting } from "../entity";
import { DataSource, Repository } from "typeorm";
import createError from "http-errors";
import { PasswordEncoder } from "./password-encoder";
import { Injectable, DIProperty } from "../lib/di";
import { v4 as uuidv4 } from "uuid";
import { JWTService } from "./jwt-service";


interface UserBasicInfo {
    username: string;
    createdAt: Date;
};
@Injectable({
    lazy: true
})
export class UserService {
    private userRepo: Repository<User>;
    private userSettingRepo: Repository<UserSetting>;
    private invRepo: Repository<InvitationCode>;
    private refRepo: Repository<RefreshToken>;
    @DIProperty(PasswordEncoder)
    private encoder: PasswordEncoder;
    private dataSource: DataSource;

    constructor() {
        this.dataSource = getDataSource();
        this.userRepo = this.dataSource.getRepository(User);
        this.userSettingRepo = this.dataSource.getRepository(UserSetting);
        this.invRepo = this.dataSource.getRepository(InvitationCode);
        this.refRepo = this.dataSource.getRepository(RefreshToken);
    }

    public async getBasicInfo(username: string): Promise<UserBasicInfo> {
        const user = await this.getUser(username);
        if (!user) {
            throw new createError.NotFound("User not found");
        }
        return {
            username: user.username,
            createdAt: user.createdAt
        };
    }

    public async getUser(username: string): Promise<User> {
        return await this.userRepo.findOne({
            where: {
                username: username
            }
        });
    }

    public async createInvitationCode(username: string): Promise<string> {
        const user = await this.getUser(username);
        if (!user) {
            throw createError(404, "User not found");
        }
        const code = this.create_uuid();
        const inv = new InvitationCode();
        inv.code = code;
        inv.user = user;
        inv.relativepath = ".";
        await this.invRepo.save(inv);
        return code;
    }

    public async deleteInvitationCode(code: string) {
        return await this.invRepo.delete({
            code: code
        });
    }

    public async getProfilePicture(username: string): Promise<string> {
        const user = await this.getUser(username);
        if (!user) {
            throw new createError.NotFound("User not found");
        }

        const setting = await this.userSettingRepo
            .createQueryBuilder("setting")
            .select("setting.profilePicture")
            .where("setting.user = :user", {user: user.id})
            .getOne();
        if (!setting) {
            throw new createError.NotFound("User setting not found");
        }
        return setting.profilePicture;
    }

    public async setProfilePicture(username: string, pic: string) {
        const user = await this.getUser(username);
        if (!user) {
            throw new createError.NotFound("User not found");
        }
        await this.userSettingRepo
            .createQueryBuilder()
            .update(UserSetting)
            .set({
                profilePicture: pic
            })
            .where("user = :user", {user: user.id})
            .execute();
    }

    public async getFrontendSettings(username: string): Promise<string> {
        const user = await this.getUser(username);
        if (!user) {
            throw new createError.NotFound("User not found");
        }
        const setting = await this.userSettingRepo
            .createQueryBuilder("setting")
            .select("setting.frontendSettings")
            .where("setting.user = :user", {user: user.id})
            .getOne();
        if (!setting) {
            throw new createError.NotFound("User setting not found");
        }
        return setting.frontendSettings;
    }

    public async setFrontendSettings(username: string, settings: string) {
        const user = await this.getUser(username);
        if (!user) {
            throw new createError.NotFound("User not found");
        }
        await this.userSettingRepo
            .createQueryBuilder()
            .update(UserSetting)
            .set({
                frontendSettings: settings
            })
            .where("user = :user", {user: user.id})
            .execute();
    }

    public async createUser(username: string, password: string, inv: string) {
        await this.dataSource.transaction(async (manager) => {
            const up = manager.getRepository(User);
            const ip = manager.getRepository(InvitationCode);
            const sp = manager.getRepository(UserSetting);

            let invCode = null;
            if (inv != null) {
                invCode = await ip.findOne({
                    where: {
                        code: inv
                    }
                });
                if (!invCode) {
                    throw new createError.NotFound("Invalid invitation code");
                }
            }

            const oldUser = up.findOne({
                where: {
                    username: username
                }
            });
            if (oldUser) {
                throw new createError.Conflict("Username already exists");
            }

            const user = new User();
            user.username = username;
            user.password = this.encoder.encode(password);
            user.selfInvitationCode = invCode;
            up.save(user);

            const setting = new UserSetting();
            setting.user = user;
            setting.frontendSettings = "{}";
            setting.profilePicture = "";
            sp.save(setting);
        });
    }

    public async updateUser(username: string, info: User) {
        const user = await this.getUser(username);
        if (user) {
            const _info: any = {};
            _info.password = this.encoder.encode(info.password);
            return await this.userRepo.update(user.id, _info);
        }
    }

    public async changeUserPassword(username: string, oldpass: string, newpass: string) {
        const user = await this.getUser(username);
        if (!user) {
            throw new createError.NotFound("User not found");
        }
        if (!this.encoder.validate(oldpass, user.password)) {
            throw new createError.Unauthorized("Wrong password");
        }
        await this.userRepo.update(user.id, {
            password: this.encoder.encode(newpass)
        });
        await this.refRepo
            .createQueryBuilder()
            .delete()
            .where({ user: user.id })
            .execute();
    }

    public async setUserPassword(username: string, password: string) {
        password = this.encoder.encode(password);
        await this.userRepo.update({
            username: username
        }, {
            password: password
        });
    }

    public async validateUserWithInvcode(username: string, invcode: string): Promise<boolean> {
        return await this.dataSource
            .createQueryBuilder()
            .select("user.id")
            .from(User, "user")
            .innerJoin(InvitationCode, "inv", "inv.user = user.id")
            .where("user.username = :username", {username: username})
            .andWhere("inv.code = :invcode", {invcode: invcode})
            .getOne() != null;
    }

    public async deleteUser(username: string) {
        const user = await this.getUser(username);

        if (username == 'admin') {
            throw new createError.Forbidden("can't delete administrator account");
        }

        if (user) {
            return await this.userRepo.remove(user);
        }
    }

    private create_uuid(): string { return uuidv4(); }
    public async login(username: string, password: string): Promise<string> {
        const user = await this.getUser(username);
        if (!user || !this.encoder.validate(password, user.password)) {
            throw createError(401, "Invalid username or password");
        }
        const token = this.create_uuid();
        const refreshToken = new RefreshToken();
        refreshToken.token = token;
        refreshToken.user = user;
        refreshToken.updateCount = 0;
        await this.refRepo.save(refreshToken);
        await this.refRepo.update(refreshToken, {updateCount: refreshToken.updateCount+1});
        return token;
    }

    public async verifyUsernamePassword(username: string, password: string): Promise<boolean> {
        const user = await this.getUser(username);
        if (!user || !this.encoder.validate(password, user.password)) {
            return false;
        }
        return true;
    }

    public async logout(token: string) {
        const refreshToken = await this.refRepo.findOne({
            where: {
                token: token
            }
        });
        if (!refreshToken) {
            throw createError(401, "Invalid token");
        }
        await this.refRepo.remove(refreshToken);
    }

    @DIProperty(JWTService)
    private jwtService: JWTService;
    /**
     * @param token refresh token
     * @returns {Promise<string>} new json web token
     */
    public async refresh(token: string): Promise<string> {
        const refreshToken = await this.refRepo.findOne({
            where: {
                token: token
            }
        });
        if (!refreshToken) {
            throw createError(401, "Invalid token");
        }
        const prevDate = refreshToken.updatedAt;
        if (Date.now() - prevDate.getTime() > 1000 * 60 * 60 * 24) {
            throw createError(401, "Token expired");
        }
        await this.refRepo.update({ id: refreshToken.id }, { updateCount: refreshToken.updateCount+1 });
        const username = refreshToken.user.username;
        const rootpath = refreshToken.user.rootpath;
        return this.jwtService.sign({username: username, rootpath: rootpath}, username);
    }
}
