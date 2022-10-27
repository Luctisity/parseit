import { ASTNodeConstructor } from "../classes/ASTNode";
import GrammarRule, { GrammarAtom, GrammarAtomType, GrammarBinaryLoop, GrammarEither, GrammarRuleSpecialMatch } from "./rule";

export type GrammarRulesMap = {
    [key: string]: GrammarRule[];
}

export type GrammarRuleShorthand = string | GrammarEither;

export default class Grammar {

    private rules: GrammarRulesMap = {};
    private currentData: any       = {};

    startRule: string = "";

    rule = (name: string) => {
        this.currentData = {
            name: name,
            content: []
        }

        return this.chain();
    }

    startFrom (rule: string) {
        this.startRule = rule;
    }

    getRule (name: string) {
        return this.rules[name];
    }

    private from = (...args: GrammarRuleShorthand[]) => {

        args.forEach(a => {
            let p = convertStringToAtom(a);
            if (p)  this.currentData.content.push(p);
        });

        return this.chain();

    }

    private binaryLoop = (args: GrammarRuleShorthand[]) => {

        const loop = new GrammarBinaryLoop();
        args.forEach(a => {
            let p = convertStringToAtom(a);
            if (p)  loop.content.push(p);
        });
        this.currentData.content.push(loop);

        return this.chain();

    }

    // for converting data automatically to a specific AST node
    private as = (match: ASTNodeConstructor) => {
        this.currentData.match = match;
        this.make();
    }

    // for keeping the existing data as is
    private pass = () => {
        this.currentData.match = GrammarRuleSpecialMatch.PASS;
        this.make();
    }

    // for using a function to convert the data in some way
    private decide = (func: Function) => {
        this.currentData.match = GrammarRuleSpecialMatch.FUNC;
        this.currentData.func  = func;
        this.make();
    }

    // to select a certain item from the data list
    private select = (index: number) => {
        this.currentData.match = GrammarRuleSpecialMatch.FUNC;
        this.currentData.func  = (data: any[]) => data[index];
        this.make();
    }

    private make = () => {
        if (!this.rules[this.currentData.name])
            this.rules[this.currentData.name] = [];

        this.rules[this.currentData.name].push(
            new GrammarRule(this.currentData.name, this.currentData.content, this.currentData.match, this.currentData.func)
        );
    }

    private chain = () => { return {
        from:       this.from,
        binaryLoop: this.binaryLoop,
        as:         this.as,
        pass:       this.pass, 
        decide:     this.decide,
        select:     this.select
    }}

}

export function either (...args: string[]) {
    const variants: any[] = args.map(a => convertStringToAtom(a));

    const component = new GrammarEither();
    component.variants = variants;

    return component;
}

// TODO: add option for skippable tokens
function convertStringToAtom (str: GrammarRuleShorthand) {
    let p: GrammarAtom | undefined;

    if (typeof str != 'string') 
        return str;

    if (str.startsWith("@")) {
        // slice off "@" at the beginning
        // and split into name and value by the ":" separator
        let strSpl = str.slice(1).split(':');
        p = new GrammarAtom(strSpl[0], GrammarAtomType.TOKEN, strSpl[1]);
    }

    if (str.startsWith("$")) 
        p = new GrammarAtom(str.slice(1), GrammarAtomType.RULE);

    return p;
}