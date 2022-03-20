
type SQLFiled = string | number | null | undefined;
function mergeToTuple(values: SQLFiled[], escapeString: boolean = false) //{
{
    let ans = '(';

    for(let i=0;i<values.length;i++) {
        if (typeof(values[i]) == 'string' && escapeString) {
            ans += `'${values[i]}'`;
        } else {
            ans += values[i];
        }
        if(i != values.length-1) {
            ans += ', ';
        }
    }

    ans += ')';
    return ans;
} //}

export function createSQLInsertion(relation: Function, records: any[], ignore: string[] = []): string //{
{
    if (records.length == 0) {
        throw new Error('bad sql insert: without records');
    }

    let keys: string[] = [];
    if (!(records[0] instanceof relation)) {
        throw new Error('bad instance');
    }
    for (let prop in records[0]) {
        if(ignore.indexOf(prop) < 0) {
            keys.push(prop);
        }
    }
    let ans = mergeToTuple(keys);
    ans += ' VALUES ';
    for(let i=0;i<records.length;i++) {
        const record = records[i]
        if(!(record instanceof relation)) {
            throw new Error('bad instance');
        }
        let np = [];
        for (let prop of keys) {
            np.push(record[prop]);
        }
        ans += mergeToTuple(np, true);
        if(i < records.length - 1)
            ans += ', ';
    }
    return ans;
} //}

export type Constructor<T = object, A extends any[] = any[]> = new (...a: A) => T;

