import express, { Request, Response } from 'express';
import path from 'path';
import child_process from 'child_process';
import process from 'process';
import fs from 'fs';
import { URL } from 'url';
import fetch from 'node-fetch';
import { body, validationResult } from 'express-validator';
import createHttpError from 'http-errors';

const router = express.Router();
export default router;

const updateScript = path.join(path.dirname(path.dirname(__dirname)), "bin", "update.js");
const rootDir = path.dirname(path.dirname(path.dirname(__dirname)));
type updateCB = () => void;
function updateAndRestart(dirs: string[], updatedir: string): updateCB
{
    return () => {
        const restartCMD = process.argv.map(encodeURIComponent).join(",");
        process.on("exit", function () {
            child_process.spawn(process.argv.shift(), 
                [
                    updateScript,
                    "--dir", encodeURIComponent(updatedir),
                    "--dirs", dirs.map(encodeURIComponent).join(","),
                    "--cdir", encodeURIComponent(rootDir),
                    "--after", restartCMD,
                    "--acwd", encodeURIComponent(process.cwd())
                ],
                {
                    cwd: process.cwd(),
                    detached : true,
                    stdio: "inherit"
                }
            );
        });
        process.exit();
    };
}

async function extractArchive(archive: string, dest: string): Promise<boolean> {
    if (!path.isAbsolute(archive))
        throw new Error(`expect absolute path, get ${archive}`);
    if (!path.isAbsolute(dest))
        throw new Error(`expect absolute path, get ${dest}`);

    try {
        const s1 = await fs.promises.stat(archive);
        const s2 = await fs.promises.stat(dest);
        if (!s1.isFile())
            throw new Error(`expect file, get ${archive}`);
        if (!s2.isDirectory())
            throw new Error(`expect directory, get ${dest}`);
    } catch (e) {
        throw e;
    }

    try {
        await new Promise<void>((resolve, reject) => {
            const child = child_process.spawn("tar", ["-xf", archive], {
                cwd: dest, 
                stdio: ['ignore', 'inherit', 'inherit'],
                shell: true
            });
            child.once('exit', (code, _) => {
                if(code == 0) {
                    resolve();
                } else {
                    reject();
                }
            });
        });
        return true;
    } catch { return false; }
}

async function downloadURLToTmp(urlstr: string): Promise<string>
{
    const url = new URL(urlstr);
    const head = await fetch(url, {method: 'GET', compress: true, redirect: 'follow'});
    if(head.status >= 400) {
        throw new Error(`getting '${urlstr}' failed with ${head.statusText}`);
    }

    const temporaryFile = path.join(await fs.promises.mkdtemp('webdisk_update'), "update");
    const fstream = fs.createWriteStream(temporaryFile, {
        flags: 'w',
    });
    await new Promise<void>((resolve, reject) => {
        head.body.pipe(fstream);
        fstream.on("finish", resolve);
        fstream.on("error", reject);
    });

    return temporaryFile;
}

async function handleUpdate(update_archive_url: string, next: string, dirs: string[]): Promise<updateCB>
{
    const updatearchive = await downloadURLToTmp(update_archive_url);
    const archive_dir = path.dirname(updatearchive);
    try {
        const extraction_dir = path.join(path.dirname(updatearchive), "ex");
        await fs.promises.mkdir(extraction_dir);
        await extractArchive(updatearchive, extraction_dir);
        const update_dir = path.join(extraction_dir, next);
        const ustat = await fs.promises.stat(update_dir);
        if (!ustat.isDirectory())
            throw new Error("new a directory");
        
        for (const d of dirs) {
            const p1 = path.join(rootDir, d);
            const p2 = path.join(update_dir, d);
            const s1 = await fs.promises.stat(p1);
            const s2 = await fs.promises.stat(p2);
            if (!s1.isDirectory())
                throw new Error(`not a valid directory, '${p1}'`);
            if (!s2.isDirectory())
                throw new Error(`not a valid directory, '${p2}'. bad update`);
        }
        return updateAndRestart(dirs, update_dir);
    } finally {
        await ((fs.promises as any).rm || fs.promises.rmdir)(archive_dir, { recursive: true });
    }
}


function handleFactory(dirs: string[]) {
    return async (req: Request, res: Response) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(422).json({ errors: errors.array() });
        }

        const updateURL = req.body["updateURL"];
        const next = req.body["next"] || '.';

        try {
            const cb = await handleUpdate(updateURL, next, dirs);
            const run = await new Promise(resolve => {
                res.status(200).send();
                res.on("finish", () => resolve(true));
                res.on("error",  () => resolve(false));
            });
            if (run) cb();
        } catch (e) {
            const err = e as Error;
            throw new createHttpError.BadRequest(err.message || "unknown error");
        }
    }
}

router.post('/backend', 
    body('updateURL').isString().withMessage('updateURL should be a string'),
    body('next').optional().isString().withMessage('next should be a string'),
    handleFactory(["backend"])
);
router.post('/dashboard',
    body('updateURL').isString().withMessage('updateURL should be a string'),
    body('next').optional().isString().withMessage('next should be a string'),
    handleFactory(["dashboard"])
);

router.post('/',
    body('updateURL').isString().withMessage('updateURL should be a string'),
    body('next').optional().isString().withMessage('next should be a string'),
    handleFactory(["dashboard", "backend"])
);
