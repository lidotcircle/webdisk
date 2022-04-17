import { FileStat } from 'src/app/shared/common';
import { FileViewerService } from './file-viewer.service';

const extension2language = {
    'txt': 'txt',
    'json': 'json',
    'py': 'python',
};
const support_extension = Object.getOwnPropertyNames(extension2language);
const max_size = 2 * 1024 * 1024;

async function handler(fileviewservice: FileViewerService, file: FileStat, _files: FileStat[], _findex: number): Promise<void> {
    const fs = fileviewservice.filesystem;
    const toastr = fileviewservice.toastr;
    const getsize = file.size < max_size ? file.size : max_size;

    try {
        const decoder = new TextDecoder("utf8");
        const buffer = await fs.read(file.filename, 0, getsize);
        const code = decoder.decode(buffer);
        const language = extension2language[file.extension];

        await fileviewservice.openfile.createTextViewer({
            filename: file.filename,
            code: code,
            language: language,
        }).wait();
    } catch (e) {
        toastr.danger(`open file failed: ${e}`, "OpenFile");
    }
}

export default(fileviewservice: FileViewerService) => {
    fileviewservice.registerHandlerEntries(handler, support_extension);
}
