import { FileStat } from 'src/app/shared/common';
import { FileViewerService } from './file-viewer.service';

async function handler(fileviewservice: FileViewerService, file: FileStat): Promise<void> {
    await fileviewservice.openfile.createVideo({
        src: await fileviewservice.ValidHttpResourceURL(file.filename)
    }).wait();
}

export default(fileviewservice: FileViewerService) => {
    fileviewservice.registerHandlerEntries(handler, ['mp4', 'mkv', 'webm']);
}

