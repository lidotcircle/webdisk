import { getDataSource } from "../index";
import { User, RefreshToken, InvitationCode } from "../entity";
import { Repository } from "typeorm";
import createError from "http-errors";
import { PasswordEncoder } from "./password-encoder";
import { Injectable, DIProperty } from "../lib/di";
import { v4 as uuidv4 } from "uuid";
import { JWTService } from "./jwt-service";


@Injectable({
    lazy: true
})
export class UserService {
    private userRepo: Repository<User>;
    private invRepo: Repository<InvitationCode>;
    private refRepo: Repository<RefreshToken>;
    @DIProperty(PasswordEncoder)
    private encoder: PasswordEncoder;

    constructor() {
        this.userRepo = getDataSource().getRepository(User);
        this.invRepo = getDataSource().getRepository(InvitationCode);
        this.refRepo = getDataSource().getRepository(RefreshToken);
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

    private async getInvitationCode(code: string): Promise< InvitationCode> {
        return this.invRepo.findOne({
            where: {
                code: code
            }
        });
    }

    public async createUser(username: string, password: string, inv: string) {
        const invcode = await this.getInvitationCode(inv);
        if (!invcode) {
            throw createError(400, "Invalid invitation code");
        }
        const olduser = await this.getUser(username);
        if (olduser) {
            throw createError(409, "User already exists");
        }
        const user = new User();
        user.username = username;
        user.password = this.encoder.encode(password);
        user.selfInvitationCode = invcode;
        await this.userRepo.save(user);
    }

    public async updateUser(username: string, info: User) {
        const user = await this.getUser(username);
        if (user) {
            const _info: any = {};
            _info.password = this.encoder.encode(info.password);
            return await this.userRepo.update(user.id, _info);
        }
    }

    public async deleteUser(username: string) {
        const user = await this.getUser(username);
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
