
export function dirname(path: string): string {
    let sep = path.lastIndexOf("/");
    if(sep  <= 0) return null;
    return path.substring(0, sep - 1);
}

export function basename(path: string): string {
    let sep = path.lastIndexOf("/");
    if(sep < 0) return path;
    if (sep + 1 == path.length) return null;
    return path.substring(sep + 1);
}

