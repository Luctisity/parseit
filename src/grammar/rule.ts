import { ASTNodeConstructor } from "../classes/ASTNode";

export type GrammarRuleContentItem = GrammarAtom 
                                   | GrammarBinaryLoop 
                                   | GrammarBlockLoop[] 
                                   | GrammarEither;

export type GrammarRuleContent = GrammarRuleContentItem[];

export enum GrammarAtomType         { RULE, TOKEN }
export enum GrammarRuleSpecialMatch { PASS, FUNC }


export default class GrammarRule {

    name:    string;
    content: GrammarRuleContent = [];
    match:   ASTNodeConstructor | GrammarRuleSpecialMatch;
    func?:   Function;

    constructor (name: string, content: GrammarRuleContent, match: ASTNodeConstructor | GrammarRuleSpecialMatch, func?: Function) {
        this.name    = name;
        this.content = content;
        this.match   = match;
        this.func    = func;
    }

}


export class GrammarAtom {

    name:  string;
    value: any;
    type:  GrammarAtomType;

    constructor (name: string, type: GrammarAtomType, value?: any) {
        this.name  = name;
        this.value = value;
        this.type  = type;
    }

}

export class GrammarBinaryLoop {

    content: GrammarRuleContent = [];

}

export class GrammarBlockLoop {

    content: GrammarRuleContent = [];

}

export class GrammarEither {

    variants: GrammarRuleContent = [];

}