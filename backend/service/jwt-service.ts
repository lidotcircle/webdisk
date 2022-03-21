import { sign, verify, decode  } from 'jsonwebtoken';
import { Config } from '../lib/config';
import { Injectable } from '../lib/di';


@Injectable({
    lazy: true
})
export class JWTService {
    private secret: string;
    private expiresIn_s: number;

    constructor(config: Config) {
        this.secret = config.jwt.secret;
        this.expiresIn_s = config.jwt.expiresIn_s;
    }
    
    public sign(payload: any, username: string): string {
        return sign(payload, this.secret, {
            expiresIn: this.expiresIn_s,
            subject: username
        });
    }

    public verify(token: string): boolean {
        try {
            verify(token, this.secret);
            return true;
        } catch (err) {
            return false;
        }
    }
    
    public decode(token: string): any {
        return decode(token);
    }
}
