
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
    filename:    string   = null;
    filetype:    FileType = FileType.unknown;

    get extension(): string {
        if(!this.basename) return '';
        if(this.filetype == FileType.dir) return '';
        const k = this.basename.split('.');
        if(k.length == 1) return '';
        return k[k.length-1].toLowerCase();
    }

    get basename(): string {
        if(!this.filename) return null;
        let k = this.filename;
        if(k.endsWith('/') || k.endsWith('\\')) k = k.substr(0, k.length -1);
        const kk = k.split('/');
        return kk[kk.length - 1];
    }

    get atime(): Date     {return new Date(this.atimeMs);}
    get mtime(): Date     {return new Date(this.mtimeMs);}
    get ctime(): Date     {return new Date(this.ctimeMs);}
    get birthtime(): Date {return new Date(this.birthtimeMs);}
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

