import { FileStat } from 'src/app/shared/common';
import { FileViewerService } from './file-viewer.service';

const support_extension = ['jpeg', 'jpg', 'png', 'svg', 'ico', 'gif', 'webp'];

async function handler(fileviewservice: FileViewerService, file: FileStat, files: FileStat[], findex: number): Promise<void> {
    console.assert(files[findex] == file && support_extension.indexOf(file.extension) > 0);

    const image_files = [];
    let index = 0;
    for(let i=0;i<files.length;i++) {
        if(i == findex) {
            index = image_files.length;
        }

        if(support_extension.indexOf(files[i].extension) >= 0) {
            image_files.push(files[i].filename);
        }
    }
    const images = await fileviewservice.ValidHttpResourceURLs(image_files);;
    await fileviewservice.openfile.createImage({
        images: images,
        index: index
    }).wait();
}

export default(fileviewservice: FileViewerService) => {
    fileviewservice.registerHandlerEntries(handler, support_extension);
}

