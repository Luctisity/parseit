import Token from "../classes/Token";
import Parser  from "../parser/parser";
import grammar from "./grammar";

const parser = new Parser(grammar);

const result = parser.parse(toTokens(
    "IDENTIFIER:mario OBRACK INT:69 DOT IDENTIFIER:gaming",
    "INT:2 ADD INT:2 SUB INT:2 MUL INT:3"
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