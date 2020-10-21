import { SessionStorageService } from './service/sessionStorage-service';
import { LocalStorageService } from './service/localStorage-service';

export const localstorage = new LocalStorageService();
export const sessionstorage = new LocalStorageService();

