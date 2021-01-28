import { Readable, Writable } from "stream";

export async function pipelineWithTimeout( //{
    reader: Readable, 
    writer: Writable, 
    timeout: number = 5000): Promise<number> 
{
    return await new Promise((resolve, reject) => {
        let writed = 0;
        let finished = false;
        const ok = () => {
            if(finished) return;
            finished = true;
            resolve(writed);
        }
        const failByOther = () => fail(new Error('closed by Writable endpoint'));
        const fail = (err) => {
            if(finished) return;

            finished = true;
            writer.removeListener('error', fail);
            writer.removeListener('close', failByOther);
            reject(err);
        }

        let prevCheck = 0;
        let stopThis = 0;
        const checkWriterLive = () => {
            if(finished) return;

            stopThis = prevCheck == writed ? ++stopThis : 0;
            if(stopThis > 3) {
                return fail(new Error('timeout'));
            }
            prevCheck = writed;
            setTimeout(checkWriterLive, timeout);
        }
        checkWriterLive();

        reader
            .on('end', ok)
            .on('data', buf => writed += buf.length)
            .on('error', fail)
            .on('close', ok);

        writer
            .on('error', fail)
            .on('close', failByOther);

        reader.pipe(writer, {end: false});
    });
} //}

