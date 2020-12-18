import { ViewTrait } from './view-trait';

export class ViewFullscreen extends ViewTrait {
    public perform(host: HTMLElement) {
        host.style.width  = "100%";
        host.style.height = "100%";
        host.style.top    = '0em';
        host.style.left   = '0em';
    }
}

