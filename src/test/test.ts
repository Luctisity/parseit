import Token from "../classes/Token";
import Parser  from "../parser/parser";
import grammar from "./grammar";

const parser = new Parser(grammar);

const result = parser.parse(toTokens(
    //"IDENTIFIER:mario ASSIGN IDENTIFIER:luigi NEWL INT:5 ADD INT:5",
    //"KEYWORD:switch OPAREN IDENTIFIER:mario CPAREN OCURLY KEYWORD:case INT:42 COLON NEWL KEYWORD:case INT:43 COLON NEWL STRING:mamamia NEWL KEYWORD:case INT:45 COLON NEWL STING:mamamaa NEWL KEYWORD:default COLON INT:0 CCURLY",
    "KEYWORD:if OPAREN IDENTIFIER:mario EQUALS IMT:5 CPAREN OCURLY INT:5 CCURLY NEWL KEYWORD:else INT:42",
    //"IDENTIFIER:mario OBRACK IDENTIFIER:is CBRACK DOT IDENTIFIER:gaming",
    "INT:2 ADD NEWL INT:2 SUB INT:2 MUL INT:3 NEWL INT:69 NEWL"
));

function toTokens (str: string, ..._rest: any[]) {
    const strSpl = str.split(" ").filter(f => f.trim());
    const tokens: Token[] = [];

    strSpl.forEach(s => {
        const ss = s.split(":");
        tokens.push(new Token(ss[0], ss[1]));
    });

    return tokens;
}

console.log(result.toString());

export default result;