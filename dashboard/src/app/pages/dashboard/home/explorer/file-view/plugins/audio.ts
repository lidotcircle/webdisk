import { FileStat } from 'src/app/shared/common';
import { FileViewerService } from './file-viewer.service';

async function handler(fileviewservice: FileViewerService, file: FileStat): Promise<void> {
    await fileviewservice.openfile.createAudio({
        src: await fileviewservice.ValidHttpResourceURL(file.filename),
        title: file.basename
    }).wait();
}

export default(fileviewservice: FileViewerService) => {
    fileviewservice.registerHandlerEntries(handler, ['mp3', 'wav', 'ogg']);
}

