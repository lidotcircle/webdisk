import * as path from "path";
import * as fs from "fs";
import { AsyncQueryDependency } from "../../di";
import { Config } from "../../config";


export default async(icon: string, style: string = 'classic'): Promise<string> => {
    const config = await AsyncQueryDependency(Config);
    const iconfile = path.join(config.static_resources, 
                               "SVG/filetype/dist/icons", style, `${icon}.svg`);
    return (await fs.promises.readFile(iconfile, {})).toString('utf8');
}

