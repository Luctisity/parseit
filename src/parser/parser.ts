import ParseError, { error } from "../classes/ParseError";
import Token from "../classes/Token";
import Grammar from "../grammar/grammar";
import GrammarRule, { GrammarAtom, GrammarBinaryLoop, GrammarBlockLoop, GrammarEither, GrammarRuleContent, GrammarRuleContentItem } from "../grammar/rule";
import { adaptNodeData, isRule, isToken, tokenMatches, tokenShouldBeIgnored } from "./util";

export type RuleVariationContentStackItem = {
    content: GrammarRuleContent,
    type:    ContentStackType,
    index:   number
};
export type RuleVariationContentStack = RuleVariationContentStackItem[];

export enum ContentStackType { RULE, BINARY, BLOCK }

export default class Parser {

    tokens:  Token[] = [];
    index:   number = 0;
    grammar: Grammar;
    
    /** The main parser object. Takes the grammar object as a constructor argument */
    constructor (grammar: Grammar) {
        this.grammar = grammar;
    }

    /** Takes an array of tokens and constructs an AST tree based on the grammar rules */
    parse (tokens: Token[]) {
        this.tokens = tokens;
        this.index  = 0;

        const startRule = this.grammar.startRule;
        const result    = this.evaluateRule(startRule);

        if (result instanceof ParseError)    return error(result.position.index, result.position.token!);
        if (this.index < this.tokens.length) return error(this.index, this.currentTok); // if didn't reach the end, throw error
        return result;
    }

    private evaluateRule = (name: string) => {
        const ruleVariations = this.grammar.getRule(name); // get rule data
       
        let startIndex = +this.index; // copy index
        let ruleVariationIndex = 0;
        let errorIndex = -1;

        // loop A: through all rule's variations
        if (ruleVariations)
        while (ruleVariationIndex < ruleVariations.length) {

            const ruleVariation = ruleVariations[ruleVariationIndex];
            let matched = true;
            let nodeData: any[] = [];
            this.index = +startIndex; // reset index to start from the (relative) beginning

            // a stack for rule variation content (to make loops possible)
            // each loop creates it's own stack layer and removes it when the iteration is complete
            let stack: RuleVariationContentStack = [this.stackLayer(ruleVariation.content, ContentStackType.RULE)];
            let loopCompleted = false;

            // loop B: through rule variation's items
            while (stack.length && stack[0].index < stack[0].content.length) {

                // get the current item of a variation content (in the rule)
                const item = stack[0].content[stack[0].index];

                // for rules
                if (isRule(item) || isToken(item)) {

                    let shouldBreak = false;

                    const success = (result: any, skip: boolean) => skip || nodeData.push(result);
                    const fail = (index?: number) => { 
                        matched = false; shouldBreak = true;
                        errorIndex = index || errorIndex;
                    };

                    this.evaluateOnePiece(item, success, fail);

                    if (shouldBreak) break; // break out of loop B

                // for binary loops
                } else if (item instanceof GrammarBinaryLoop) {

                    // add a stack layer for the loop and set it to complete
                    stack.unshift(this.stackLayer(item.content, ContentStackType.BINARY));
                    nodeData = [adaptNodeData(nodeData, ruleVariation)];

                    continue;

                // for block loops
                } else if (item instanceof GrammarBlockLoop) {

                    // add a stack layer for the loop and set it to complete
                    stack.unshift(this.stackLayer(item.content, ContentStackType.BLOCK));

                    continue;

                // for "either" selectors
                } else if (item instanceof GrammarEither) {

                    let found: any = false;
                    let skip = false;
                    
                    item.variants.forEach(variant => {
                        if (found) return;
                        this.evaluateOnePiece(variant, (result: any) => {
                            found = result;
                            skip  = (variant as GrammarAtom).skip;
                        }, (index?: number) => { 
                            errorIndex = index || errorIndex 
                        }, ruleVariation);
                    });
                    
                    if (found) {
                        if (!skip) nodeData.push(found);
                    } else {
                        matched = false;
                        break;
                    }

                }

                // advance and set loop to incomplete
                stack[0].index++;
                if (stack[0].type != ContentStackType.BLOCK)
                    loopCompleted = false;

                // if reached end, remove stack layer
                if (stack[0].index >= stack[0].content.length) {
                    stack.shift();
                    loopCompleted = true;
                }

            }

            // un-skip recently skipped tokens
            if (!ruleVariation.preventRollback) this.rollback();
            
            // if matched the variation, construct the required node and return it
            if (matched || loopCompleted) {
                const targetNode = adaptNodeData(nodeData, ruleVariation);
                return targetNode;
            }

            ruleVariationIndex++;

        }

        errorIndex = errorIndex == -1 ? this.index : errorIndex; // if errorIndex is still -1, change it to current index
        return error(errorIndex, this.tokens[errorIndex]);
    }

    private evaluateOnePiece = (item: GrammarRuleContentItem, success: Function, fail?: Function, rule?: GrammarRule) => {
        // for rules: evaluate the rule recursively 
        // if error — fail, else — return the result
        if (isRule(item)) {

            const itemResult = this.evaluateRule((item as GrammarAtom).name);

            if (itemResult instanceof ParseError) fail ? fail(itemResult.position.index) : null;
            else if (itemResult) success(itemResult, (item as GrammarAtom).skip);

        // for tokens: check if token matches the given item
        // if not — fail, else — return the token
        } else if (isToken(item)) {

            this.advance(rule);

            if (!tokenMatches(this.currentTok, item as GrammarAtom))
                return fail ? fail(this.index) : null;
            
            success(this.currentTok, (item as GrammarAtom).skip);
            this.index++;

        }
    }

    // skip all tokens based on ignore rules and overrides
    private advance (rule?: GrammarRule) {
        while (tokenShouldBeIgnored(this.currentTok, this.grammar, rule)) 
            this.index++;
    }

    // unskip
    private rollback () {
        let prevToken = this.tokens[this.index-1];
        while (tokenShouldBeIgnored(prevToken, this.grammar)) {
            this.index--;
            prevToken = this.tokens[this.index-1];
        }
    }

    private stackLayer (content: GrammarRuleContent, type: ContentStackType): RuleVariationContentStackItem { 
        return { content: content, type: type, index: 0 };
    }

    private get currentTok () { return this.tokens[this.index] }

}