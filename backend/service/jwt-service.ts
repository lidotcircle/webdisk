import { sign, verify, decode  } from 'jsonwebtoken';
import { Config } from './config-service';
import { Injectable } from '../lib/di';


export interface JWTPayload {
    username: string;
    rootpath: string;
};

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
    
    public sign(payload: JWTPayload, username: string): string {
        return sign(payload, this.secret, {
            expiresIn: this.expiresIn_s,
            subject: username,
        });
    }

    public signG(payload: any, username: string, expireAfte_s: number) 
    {
        return sign(payload, this.secret, {
            expiresIn: expireAfte_s,
            subject: username
        });
    }

    public decodeAs<T>(token: string): T {
        return <T>decode(token);
    }

    public verify(token: string): boolean {
        try {
            verify(token, this.secret);
            return true;
        } catch (err) {
            return false;
        }
    }
    
    public decode(token: string): JWTPayload {
        return decode(token) as JWTPayload;
    }
}
