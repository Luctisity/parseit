import { ASTNodeConstructor } from "../classes/ASTNode";
import Token from "../classes/Token";
import GrammarRule, { GrammarAtom, GrammarAtomType, GrammarBinaryLoop, GrammarBlockLoop, GrammarEither, GrammarRuleSpecialMatch } from "./rule";

export type GrammarRulesMap = {
    [key: string]: GrammarRule[];
}

export type GrammarRuleShorthand = string | GrammarEither;

/** Grammar object class. Used to define rules and other parsing details */
export default class Grammar {

    private rules: GrammarRulesMap = {};
    private currentData: any       = {};
    private ignored: GrammarAtom[] = [];

    /** The name of the rule from which the parser will begin matching */
    startRule: string = "";

    /** Define a rule variation */
    rule = (name: string) => {
        this.currentData = {
            name: name,
            content: []
        }

        return this.chain();
    }

    /** Define a starting rule, from which the parser will begin matching */
    startFrom (rule: string) {
        this.startRule = rule;
    }

    /** Ignore specific tokens globally. This can be overrided with a "overrideIgnore" rule method */
    ignore (...args: GrammarRuleShorthand[]) {
        args.forEach(a => {
            let p = convertStringToAtom(a) as GrammarAtom;
            if (p)  this.ignored.push(p);
        });
    }

    /** Check if a token is globally ignored */
    getIgnored (token: Token, rule?: GrammarRule) {
        const ignored = (rule && rule.ignored) ? rule.ignored : this.ignored;
        return ignored.filter(f => f.name == token.type && (f.value === undefined || f.value == token.value))[0];
    }

    /** Get a rule by name. Will return a rule object with all of it's variations */
    getRule (name: string) {
        return this.rules[name];
    }

    /** Add tokens and other rules to the rule normally */
    private from = (...args: GrammarRuleShorthand[]) => {

        args.forEach(a => {
            let p = convertStringToAtom(a);
            if (p)  this.currentData.content.push(p);
        });

        return this.chain();

    }

    /** Add tokens and other rules within a binary loop */
    private binaryLoop = (args: GrammarRuleShorthand[]) => {

        const loop = new GrammarBinaryLoop();
        args.forEach(a => {
            let p = convertStringToAtom(a);
            if (p)  loop.content.push(p);
        });
        this.currentData.content.push(loop);

        return this.chain();

    }

    /** Add a statement and a separator within a block loop */
    private blockLoop = (statement: GrammarRuleShorthand, separator?: GrammarRuleShorthand) => {

        const loop = new GrammarBlockLoop();
        loop.content = [ convertStringToAtom(statement) as GrammarAtom ];
        if (separator) loop.content.push(convertStringToAtom(separator) as GrammarAtom);
        this.currentData.content.push(loop);

        return this.chain();

    }

    /** Override global ignore settings for this rule variation. This will completely replace the global ignore settings */
    private overrideIgnore = (...args: GrammarRuleShorthand[]) => {

        this.currentData.ignored = [];
        args.forEach(a => {
            let p = convertStringToAtom(a) as GrammarAtom;
            if (p)  this.currentData.ignored.push(p);
        });

        return this.chain();

    }

    /** By default, when going to the next rule, the parser rewinds itself to the tokens that were previosly skip. 
     This can sometimes cause infinite loops. Use this method to prevent this behaviour for the rule variation */
    private preventRollback = () => {
        this.currentData.preventRollback = true;
        return this.chain();
    }

    /** Convert data automatically to a specific AST node. The arguments for the node's constructor must be in the correct order */
    private as = (match: ASTNodeConstructor) => {
        this.currentData.match = match;
        this.make();
    }

    /** Keep the existing data as is. This will pass the first data item to the next rule */ 
    private pass = () => {
        this.currentData.match = GrammarRuleSpecialMatch.PASS;
        this.make();
    }

    /** Use a function to convert the data in some way. This function takes an array of data items as the argument */ 
    private decide = (func: Function) => {
        this.currentData.match = GrammarRuleSpecialMatch.FUNC;
        this.currentData.func  = func;
        this.make();
    }

    /** Selects a certain item from the data list. Similar to pass, except instead of the first, you can pick any index */
    private select = (index: number) => {
        this.currentData.match = GrammarRuleSpecialMatch.FUNC;
        this.currentData.func  = (data: any[]) => data[index];
        this.make();
    }

    private make = () => {
        if (!this.rules[this.currentData.name])
            this.rules[this.currentData.name] = [];

        this.rules[this.currentData.name].push(new GrammarRule(
            this.currentData.name,    this.currentData.content, 
            this.currentData.match,   this.currentData.func, 
            this.currentData.ignored, this.currentData.preventRollback
        ));
    }

    private chain = () => { return {
        from:            this.from,
        binaryLoop:      this.binaryLoop,
        blockLoop:       this.blockLoop,
        overrideIgnore:  this.overrideIgnore,
        preventRollback: this.preventRollback,

        as:     this.as,
        pass:   this.pass, 
        decide: this.decide,
        select: this.select
    }}

}

/** This selector allows multiple variants inside a single rule. Useful with loops */
export function either (...args: string[]) {
    const variants: any[] = args.map(a => convertStringToAtom(a));

    const component = new GrammarEither();
    component.variants = variants;

    return component;
}

function convertStringToAtom (str: GrammarRuleShorthand) {
    let p: GrammarAtom | undefined;
    let skip = false;

    if (typeof str != 'string') 
        return str;

    if (str.endsWith("&")) {
        str = str.slice(0, -1);
        skip = true;
    }

    if (str.startsWith("@")) {
        // slice off "@" at the beginning
        // and split into name and value by the ":" separator
        let strSpl = str.slice(1).split(':');
        p = new GrammarAtom(strSpl[0], GrammarAtomType.TOKEN, strSpl[1], skip);
    }

    if (str.startsWith("$")) 
        p = new GrammarAtom(str.slice(1), GrammarAtomType.RULE);

    return p;
}