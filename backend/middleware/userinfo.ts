import { User } from "../entity";
import { Request } from "express";


const UsernameSymbol = Symbol('username');
const UserSymbol = Symbol('user');

export function getAuthUser(req: Request): User {
    return req[UserSymbol];
}

export function getAuthUsername(req: Request): string {
    return req[UsernameSymbol];
}

export function setAuthUser(req: Request, user: User) {
    req[UserSymbol] = user;
}

export function setAuthUsername(req: Request, username: string) {
    req[UsernameSymbol] = username;
}
