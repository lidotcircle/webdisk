export type FileStat = {
    dev: number,
    ino: number,
    mode: number,
    nlink: number,
    uid: number,
    gid: number,
    rdev: number,
    size: number,
    blksize: number,
    blocks: number,
    atimeMs: number,
    mtimeMs: number,
    ctimeMs: number,
    birthtimeMs: number,
    atime: Date,
    mtime: Date,
    ctime: Date,
    birthtime: Date,
    filename: string,
    type: FileType,
};

export enum FileType {
    reg = "reg",
    dir = "dir",
    block = "block",
    socket = "socket",
    char = "char",
    fifo = "fifo",
    symbol = "symbol",
    unknown = "unknown"
}

export type User = {
    UserName: string;
    Password: string;
    SID:      string;
    DocRoot:  string;
};
