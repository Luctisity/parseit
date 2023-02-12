import Token from "./Token";

export enum ParseErrorType {
    UNEXP_TOKEN
}

export type ParseErrorPosition = {
    index: number,
    token: Token | null
}

export default class ParseError {

    type: ParseErrorType = ParseErrorType.UNEXP_TOKEN;
    position: ParseErrorPosition = {
        index: -1,
        token: null
    }

    constructor (index: number, token: Token, type?: ParseErrorType) {
        this.position.index = index;
        this.position.token = token;
        this.type = type || this.type;
    }

    toString = () => `ParseError: Unexpected token ${this.position.token} at index ${this.position.index}`;

}

export function error (index: number, token: Token) {
    return new ParseError (index, token);
}