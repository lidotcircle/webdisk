import * as constants from './constants';
import * as types from './types';
import * as util from './util';

/**
 * @class DetailItem represent a file
 */
export class DetailItem {
    protected stat: types.FileStat;
    private basename: string;
    private location: string;

    constructor(stat: types.FileStat) {
        this.stat = stat;
        this.basename = util.basename(this.stat.filename);
        this.location = util.dirname (this.stat.filename);
    }

    toHtmlString() {
    }
};

export class Detail {
    private currentLoc: string;
    private children: DetailItem[];
    private attachElem: HTMLDivElement;

    constructor(elem: HTMLDivElement) {
    }
};
