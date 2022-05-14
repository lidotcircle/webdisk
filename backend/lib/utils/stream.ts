import { Readable, Transform, TransformCallback, Writable } from "stream";

export async function pipelineWithTimeout( //{
    reader: Readable, 
    writer: Writable, 
    options?: {timeout?: number, canceled?: boolean, writerEnd?: boolean}): Promise<number> 
{
    options = options || {};
    options.canceled = options.canceled || false;
    options.timeout = options.timeout || 5000;
    options.writerEnd = options.writerEnd !== false;
    let earlyError: Error = null;
    const earlyHandler = (err: Error) => {
        earlyError = err || earlyError;
    };
    writer.on("error", earlyHandler);
    reader.on("error", earlyHandler);

    return await new Promise((resolve, reject) => {
        if (earlyError) {
            return reject(earlyError);
        }
        writer.removeListener("error", earlyHandler);
        reader.removeListener("error", earlyHandler);

        let writed = 0;
        let finished = false;
        let reader_end = false;
        const finish = () => {
            if(finished) return;
            finished = true;
            reader.unpipe(writer);
            removelisteners();
            resolve(writed);
        }
        const ok = () => {
            reader_end = true;
            if (options.writerEnd)
                return;
            finish();
        }
        const failByOther = () => {
            if (!reader_end)
                fail(new Error('closed by readable endpoint'));
        }
        const failByWriterClose = () => {
            if (!finished)
                fail(new Error('closed by writable endpoint'));
        }

        const fail = (err: Error) => {
            if(finished) {
                console.error("error after resolve or reject, possiblely be a bug: ", err);
                return;
            }
            finished = true;
            reader.unpipe(writer);
            removelisteners();
            reject(err);
        }
        const count = (data: Buffer) => writed += data.byteLength;

        const removelisteners = () => {
            reader.removeListener('end', ok);
            reader.removeListener('close', ok);
            reader.removeListener('data', count);
            // reader.removeListener('error', fail);

            // writer.removeListener('error', fail);
            writer.removeListener('close', failByOther);
        }

        let prevCheck = 0;
        let stopThis = 0;
        const checkWriterLive = () => {
            if(finished) return;
            if(options.canceled) {
                return fail(new Error('canceled'));
            }

            stopThis = prevCheck == writed ? ++stopThis : 0;
            if(stopThis > 3) {
                return fail(new Error('timeout'));
            }
            prevCheck = writed;
            setTimeout(checkWriterLive, options.timeout);
        }

        reader
            .on('end', ok)
            .on('data', count)
            .on('error', fail)
            .on('close', failByOther);

        writer
            .on('error', fail)
            .on('finish', finish)
            .on('close', failByWriterClose);

        checkWriterLive();
        reader.pipe(writer, {end: options.writerEnd});
    });
} //}

export async function stream2buffer(readable: Readable): Promise<Buffer> {
    return new Promise<Buffer> ((resolve, reject) => {
        const _buf = Array <any>();

        readable.on("data", chunk => _buf.push(chunk));
        readable.on("end", () => resolve(Buffer.concat(_buf)));
        readable.on("error", err => reject(`error converting stream - ${err}`));
    });
}

class SkipTransform extends Transform {
    private skip: number;

    constructor(skip: number) {
        super();
        this.skip = skip;
    }

    _transform(chunk: Buffer, _encoding: string, callback: TransformCallback): void {
        if (this.skip > 0) {
            if (chunk.length <= this.skip) {
                this.skip -= chunk.length;
                chunk = Buffer.from('');
            } else {
                chunk = chunk.slice(this.skip);
                this.skip = 0;
            }
        }

        callback(null, chunk);
    }
}

class TakeTransform extends Transform {
    private take: number;

    constructor(take: number) {
        super();
        this.take = take;
    }

    _transform(chunk: Buffer, _encoding: string, callback: TransformCallback): void {
        if (this.take > 0) {
            if (chunk.length < this.take) {
                this.take -= chunk.length;
            } else {
                chunk = chunk.slice(0, this.take);
                this.take = 0;
            }
        } else {
            chunk = Buffer.from('');
        }

        callback(null, chunk);
    }
}

export function skipTransform(skip: number) {
    return new SkipTransform(skip);
}

export function takeTransform(take: number) {
    return new TakeTransform(take);
}
