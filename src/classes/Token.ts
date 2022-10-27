export default class Token {

    type:  string;
    value: any;

    constructor (type: string, value?: any) {
        this.type  = type;
        this.value = value;
    }

    toString () {
        return `[${this.type}${this.value ? ':' + this.value : ''}]`;
    }

}