import { Injectable, QueryDependency } from '../lib/di';
import { Config } from '../lib/config';
import { pbkdf2Sync } from 'crypto';
import assert from 'assert';


@Injectable({
    lazy: true,
})
export class PasswordEncoder {
    private _salt: string;

    constructor() {
        const config = QueryDependency(Config);
        this._salt = config.password_salt;
        assert(config.initialized() && this._salt, "Password salt is not set or config isn't initialized");
    }

    encode(password: string): string {
        return pbkdf2Sync(password, this._salt, 100000, 64, 'sha512').toString("base64");
    }

    validate(password: string, encoded_password: string): boolean {
        return this.encode(password) === encoded_password;
    }
}
