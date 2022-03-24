declare var require: any;
export const defaultProfileImage = require('!url-loader!./profile-image.png').default;

export class User {
    username: string;

    name: string;
    photo: string;
    roles: string[];

    get Photo(): string {
        return this.photo || defaultProfileImage;
    }

    get Roles(): string {
        if(!this.roles || this.roles.length == 0) {
            return "无";
        } else {
            return this.roles.join(', ');
        }
    }

    constructor() {
        this.roles = [];
    }
}
