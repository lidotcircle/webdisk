import createHttpError from "http-errors";


export function syserr2httperr(syserr: Error & {code: string}) {
    switch (syserr.code) {
        case "EEXIST":
        case "EACCES":
        case "EISDIR":
        case "ENOTDIR":
        case "ENOTEMPTY":
        case "EPERM":
            return new createHttpError.BadRequest(String(syserr));
        case "ENOENT":
            return new createHttpError.NotFound(String(syserr));
        default:
            return syserr;
    }
}
