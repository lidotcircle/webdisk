import { Readable, Writable } from "stream";

export async function pipelineWithTimeout( //{
    reader: Readable, 
    writer: Writable, 
    options?: {timeout?: number, canceled?: boolean}): Promise<number> 
{
    options = options || {};
    options.canceled = options.canceled || false;
    options.timeout = options.timeout || 5000;

    return await new Promise((resolve, reject) => {
        let writed = 0;
        let finished = false;
        const ok = () => {
            if(finished) return;
            finished = true;
            reader.unpipe(writer);
            removelisteners();
            resolve(writed);
        }
        const failByOther = () => fail(new Error('closed by Writable endpoint'));
        const fail = (err) => {
            if(finished) return;
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
            reader.removeListener('error', fail);

            writer.removeListener('error', fail);
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
        checkWriterLive();

        reader
            .on('end', ok)
            .on('data', count)
            .on('error', fail)
            .on('close', ok);

        writer
            .on('error', fail)
            .on('close', failByOther);

        reader.pipe(writer, {end: false});
    });
} //}

