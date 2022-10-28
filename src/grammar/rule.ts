import { ASTNodeConstructor } from "../classes/ASTNode";

export type GrammarRuleContentItem = GrammarAtom 
                                   | GrammarBinaryLoop 
                                   | GrammarBlockLoop[] 
                                   | GrammarEither;

export type GrammarRuleContent = GrammarRuleContentItem[];

export enum GrammarAtomType         { RULE, TOKEN }
export enum GrammarRuleSpecialMatch { PASS, FUNC }


/** The grammar rule variation */
export default class GrammarRule {

    name:     string;
    content:  GrammarRuleContent = [];
    match:    ASTNodeConstructor | GrammarRuleSpecialMatch;
    func?:    Function;
    ignored?: GrammarAtom[];
    
    preventRollback = false;

    constructor (
        name: string, content: GrammarRuleContent, 
        match: ASTNodeConstructor | GrammarRuleSpecialMatch, func?: Function, 
        ignored?: GrammarAtom[], preventRollback = false
    ) {

        this.name    = name;
        this.content = content;
        this.match   = match;
        this.func    = func;
        this.ignored = ignored;
        this.preventRollback = preventRollback;

    }

}

/** A single grammar rule variation object. Can be a token or a reference to another rule */
export class GrammarAtom {

    name:  string;
    value: any;
    type:  GrammarAtomType;
    skip:  boolean = false;

    constructor (name: string, type: GrammarAtomType, value?: any, skip: boolean = false) {
        this.name  = name;
        this.value = value;
        this.type  = type;
        this.skip  = skip;
    }

}

/** Binary loop grammar item */
export class GrammarBinaryLoop {

    content: GrammarRuleContent = [];

}

/** Block loop grammar item */
export class GrammarBlockLoop {

    content: GrammarRuleContent = [];

}

/** Either selector grammar item */
export class GrammarEither {

    variants: GrammarRuleContent = [];

}