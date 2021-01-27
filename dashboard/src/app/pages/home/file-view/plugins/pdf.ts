import { FileStat } from 'src/app/shared/common';
import { FileViewerService } from './file-viewer.service';

async function handler(fileviewservice: FileViewerService, file: FileStat): Promise<void> {
    const url = await fileviewservice.ValidHttpResourceURL(file.filename);
    await (await fileviewservice.openfile.createPdf({
        src: url,
        filename: file.basename
    }, file.filename)).wait();
}

export default(fileviewservice: FileViewerService) => {
    fileviewservice.registerHandlerEntries(handler, ['pdf']);
}

