import { FileStat } from 'src/app/shared/common';
import { FileViewerService } from './file-viewer.service';

const support_extension = ['jpeg', 'jpg', 'png'];

async function handler(fileviewservice: FileViewerService, file: FileStat, files: FileStat[], index: number): Promise<void> {
    console.assert(files[index] == file && support_extension.indexOf(file.extension) > 0);

    const images = [];
    for(let i=0;i<files.length;i++) {
        if(i == index) {
            index = images.length;
        }

        if(support_extension.indexOf(files[i].extension) > 0) {
            images.push(await fileviewservice.ValidHttpResourceURL(files[i].filename));
        }
    }

    await fileviewservice.openfile.createImage({
        images: images,
        index: index
    }).wait();
}

export default(fileviewservice: FileViewerService) => {
    fileviewservice.registerHandlerEntries(handler, support_extension);
}

