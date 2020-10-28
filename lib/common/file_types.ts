
export class FileStat {
    dev:         number   = 0;
    ino:         number   = 0;
    mode:        number   = 0;
    nlink:       number   = 0;
    uid:         number   = 0;
    gid:         number   = 0;
    rdev:        number   = 0;
    size:        number   = 0;
    blksize:     number   = 0;
    blocks:      number   = 0;
    atimeMs:     number   = 0;
    mtimeMs:     number   = 0;
    ctimeMs:     number   = 0;
    birthtimeMs: number   = 0;
    atime:       Date     = null;
    mtime:       Date     = null;
    ctime:       Date     = null;
    birthtime:   Date     = null;
    filename:    string   = null;
    filetype:    FileType = null;
}

export enum FileType {
    reg     = "reg",
    dir     = "dir",
    block   = "block",
    socket  = "socket",
    char    = "char",
    fifo    = "fifo",
    symbol  = "symbol",
    unknown = "unknown"
}

