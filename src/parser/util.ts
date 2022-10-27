import Token from "../classes/Token";
import GrammarRule, { GrammarAtom, GrammarAtomType, GrammarRuleContentItem, GrammarRuleSpecialMatch } from "../grammar/rule";

export function isRule (item: GrammarRuleContentItem) {
    return item instanceof GrammarAtom && item.type == GrammarAtomType.RULE;
}

export function isToken (item: GrammarRuleContentItem) {
    return item instanceof GrammarAtom && item.type == GrammarAtomType.TOKEN;
}

export function tokenMatches (token: Token, item: GrammarAtom) {
    if (!token) return false;
    
    const matchValue = item.value !== undefined ? token.value == item.value : true;
    return token 
        && item.type  == GrammarAtomType.TOKEN 
        && token.type == item.name 
        && matchValue;
}

export function adaptNodeData (data: any[], rule: GrammarRule) {
    if (rule.match == GrammarRuleSpecialMatch.PASS) {
        return data[0];
    } else if (rule.match == GrammarRuleSpecialMatch.FUNC) {
        return rule.func!(data);
    } else {
        const targetNode: any = rule.match;
        return new targetNode(...data);
    }
}