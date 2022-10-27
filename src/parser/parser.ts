import Token from "../classes/Token";
import Grammar from "../grammar/grammar";
import { GrammarAtom, GrammarBinaryLoop, GrammarBlockLoop, GrammarEither, GrammarRuleContent, GrammarRuleContentItem } from "../grammar/rule";
import { adaptNodeData, isRule, isToken, tokenMatches } from "./util";

export type RuleVariationContentStack = {
    content: GrammarRuleContent,
    type:    ContentStackType,
    index:   number
}[];

export enum ContentStackType { RULE, BINARY, BLOCK }

export default class Parser {

    tokens:  Token[] = [];
    index:   number = 0;
    grammar: Grammar;
    
    constructor (grammar: Grammar) {
        this.grammar = grammar;
    }

    parse (tokens: Token[]) {
        this.tokens = tokens;
        this.index  = 0;

        const startRule = this.grammar.startRule;
        const result    = this.evaluateRule(startRule);

        if (this.index < this.tokens.length) return "Error"; // if didn't reach the end, throw error
        return result;
    }

    private evaluateRule = (name: string) => {
        const ruleVariations = this.grammar.getRule(name); // get rule data
       
        let startIndex = +this.index; // copy index
        let ruleVariationIndex = 0;

        // loop A: through all rule's variations
        while (ruleVariationIndex < ruleVariations.length) {

            const ruleVariation = ruleVariations[ruleVariationIndex];
            let matched   = true;
            let nodeData: any[] = [];
            this.index = +startIndex; // reset index to start from the (relative) beginning

            // a stack for rule variation content (to make loops possible)
            // each loop creates it's own stack layer and removes it when the iteration is complete
            let stack: RuleVariationContentStack = [{
                content: ruleVariation.content,
                type:    ContentStackType.RULE,
                index:   0
            }];
            let loopCompleted = false;

            // loop B: through rule variation's items
            while (stack.length && stack[0].index < stack[0].content.length) {

                // get the current item of a variation content (in the rule)
                const item = stack[0].content[stack[0].index];

                // for rules
                if (isRule(item) || isToken(item)) {

                    let shouldBreak = false;

                    this.evaluateOnePiece(item, 
                        // success
                        (result: any, skip: boolean) => {
                            if (!skip) nodeData.push(result)
                        },

                        // fail
                        () => {
                            matched    = false;
                            shouldBreak = true;
                        });

                    if (shouldBreak) break; // break out of loop B

                // for binary loops
                } else if (item instanceof GrammarBinaryLoop) {

                    // add a stack layer for the loop and set it to complete
                    stack.unshift({
                        content: item.content,
                        type:    ContentStackType.BINARY,
                        index:   0
                    });
                    nodeData = [adaptNodeData(nodeData, ruleVariation)];

                    continue;

                } else if (item instanceof GrammarBlockLoop) {

                    // add a stack layer for the loop and set it to complete
                    stack.unshift({
                        content: item.content,
                        type:    ContentStackType.BLOCK,
                        index:   0
                    });

                    continue;

                } else if (item instanceof GrammarEither) {

                    let found: any = false;
                    let skip = false;
                    
                    item.variants.forEach(variant => {
                        this.evaluateOnePiece(variant, (result: any) => {
                            found = result;
                            skip  = (variant as GrammarAtom).skip;
                        });
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
                loopCompleted = false;

                // if reached end, remove stack layer
                if (stack[0].index >= stack[0].content.length) {
                    stack.shift();
                    loopCompleted = true;
                }

            }

            // if matched the variation, construct the required node and return it
            if (matched || loopCompleted) {
                const targetNode = adaptNodeData(nodeData, ruleVariation);
                return targetNode;
            }

            ruleVariationIndex++;

        }

        return "Error"; // TODO: replace with exception class
    }

    private evaluateOnePiece = (item: GrammarRuleContentItem, success: Function, fail?: Function) => {
        // for rules: evaluate the rule recursively 
        // if error — fail, else — return the result
        if (isRule(item)) {

            const itemResult = this.evaluateRule((item as GrammarAtom).name);

            if (itemResult == "Error") fail ? fail() : null;
            else success(itemResult, (item as GrammarAtom).skip);

        // for tokens: check if token matches the given item
        // if not — fail, else — return the token
        } else if (isToken(item)) {

            if (!tokenMatches(this.tokens[this.index], item as GrammarAtom))
                return fail ? fail() : null;
            
            success(this.tokens[this.index], (item as GrammarAtom).skip);
            this.index++;

        }
    }

}