import Grammar, { either } from "../grammar/grammar";
import { AtomNode, UnaryOpNode, BinaryOpNode, VarAssignNode, MemberAccessNode } from "./nodes";
const grammar = new Grammar();

function binaryOpOrPass (data: any[]) {
    return data.length == 1 
        ? data[0] 
        : new BinaryOpNode(data[0], data[1], data[2]);
}

function memberAcOrPass (data: any[]) {
    return data.length == 1 
        ? data[0] 
        : new MemberAccessNode(data[0], data[1]);
}

grammar.rule("expr").from("$logic")    .pass();
grammar.rule("expr").from("$varAssign").pass();

grammar.rule("varAssign").from("@IDENTIFIER", "@ASSIGN",  "$expr").as(VarAssignNode);
grammar.rule("varAssign").from("@IDENTIFIER", "@ADDTO",   "$expr").as(VarAssignNode);
grammar.rule("varAssign").from("@IDENTIFIER", "@SUBFROM", "$expr").as(VarAssignNode);
grammar.rule("varAssign").from("@IDENTIFIER", "@MULBY",   "$expr").as(VarAssignNode);
grammar.rule("varAssign").from("@IDENTIFIER", "@DIVBY",   "$expr").as(VarAssignNode);
grammar.rule("varAssign").from("@IDENTIFIER", "@POWERBY", "$expr").as(VarAssignNode);
grammar.rule("varAssign").from("@IDENTIFIER", "@MODBY",   "$expr").as(VarAssignNode);
grammar.rule("varAssign").from("@IDENTIFIER", "@INCR")            .as(VarAssignNode);
grammar.rule("varAssign").from("@IDENTIFIER", "@DECR")            .as(VarAssignNode);

grammar.rule("logic").from("$compare").binaryLoop([either("@AND", "@OR"), "$compare"]).decide(binaryOpOrPass);
grammar.rule("logic").from("$compare").pass();

grammar.rule("compare").from("$arithm").binaryLoop([either(
    "@EQUALS", "@NOTEQ", "@GREATER", "@LESS", "@GREATEREQ", "@LESSEQ"
), "$arithm"]).decide(binaryOpOrPass);
grammar.rule("compare").from("$arithm").pass();

grammar.rule("arithm").from("$term").binaryLoop([either("@ADD", "@SUB"), "$term"]).decide(binaryOpOrPass);
grammar.rule("arithm").from("$term").pass();

grammar.rule("term").from("$factor").binaryLoop([either("@MUL", "@DIV", "@MOD"), "$factor"]).decide(binaryOpOrPass);
grammar.rule("term").from("$factor").pass();

grammar.rule("factor").from("@ADD", "$factor").as(UnaryOpNode);
grammar.rule("factor").from("@SUB", "$factor").as(UnaryOpNode);
grammar.rule("factor").from("@NOT", "$factor").as(UnaryOpNode);
grammar.rule("factor").from("$power").pass();

grammar.rule("power").from("$memberAssign", "@POW", "$factor").decide(binaryOpOrPass);
grammar.rule("power").from("$memberAssign").pass();

grammar.rule("memberAssign").from("$member", "@ASSIGN",  "$expr").as(VarAssignNode);
grammar.rule("memberAssign").from("$member", "@ADDTO",   "$expr").as(VarAssignNode);
grammar.rule("memberAssign").from("$member", "@SUBFROM", "$expr").as(VarAssignNode);
grammar.rule("memberAssign").from("$member", "@MULBY",   "$expr").as(VarAssignNode);
grammar.rule("memberAssign").from("$member", "@DIVBY",   "$expr").as(VarAssignNode);
grammar.rule("memberAssign").from("$member", "@POWERBY", "$expr").as(VarAssignNode);
grammar.rule("memberAssign").from("$member", "@MODBY",   "$expr").as(VarAssignNode);
grammar.rule("memberAssign").from("$member", "@INCR")            .as(VarAssignNode);
grammar.rule("memberAssign").from("$member", "@DECR")            .as(VarAssignNode);
grammar.rule("memberAssign").from("$member").pass();

grammar.rule("member").from("$atom").binaryLoop([either("$memberDot", "$memberDynamic", "$memberFunction")]).decide(memberAcOrPass);
grammar.rule("member").from("$atom").pass();

grammar.rule("memberDynamic") .from("@OBRACK", "$expr").select(1);
grammar.rule("memberDot")     .from("@DOT", "@IDENTIFIER")        .select(1);
grammar.rule("memberFunction").from("@OPAREN", "@CPAREN")         .select(2);

grammar.rule("atom").from("@INT")          .as(AtomNode);
grammar.rule("atom").from("@FLOAT")        .as(AtomNode);
grammar.rule("atom").from("@KEYWORD:true") .as(AtomNode);
grammar.rule("atom").from("@KEYWORD:false").as(AtomNode);
grammar.rule("atom").from("@KEYWORD:null") .as(AtomNode);
grammar.rule("atom").from("@IDENTIFIER")   .as(AtomNode);
grammar.rule("atom").from("@OPAREN", "$expr", "@CPAREN").select(1);

grammar.startFrom("expr");

export default grammar;