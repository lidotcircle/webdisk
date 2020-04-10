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
    type: string,
};

export type User = {
    UserName: string;
    Password: string;
    SID:      string;
    DocRoot:  string;
};

