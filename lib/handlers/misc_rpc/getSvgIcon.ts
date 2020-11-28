import { Config } from "../../config";
import * as path from "path";
import * as fs from "fs";


export default async(icon: string, style: string = 'classic'): Promise<string> => {
    const iconfile = path.join(Config.global_config.staticResources, 
                               "SVG/filetype/dist/icons", style, `${icon}.svg`);
    return (await fs.promises.readFile(iconfile, {})).toString('utf8');
}
