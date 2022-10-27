import ASTNode from "../classes/ASTNode";
import Token from "../classes/Token";


export class AtomNode extends ASTNode {

    token: Token;

    constructor (token: Token) {
        super();
        this.token = token;
    }

    toString () {
        return this.token.toString();
    }

}

export class UnaryOpNode extends ASTNode {

    operator: Token;
    node:     ASTNode;

    constructor (operator: Token, node: ASTNode) {
        super();
        this.operator = operator;
        this.node     = node;
    }

    toString () {
        return `( ${this.operator} ${this.node} )`;
    }

}

export class BinaryOpNode extends ASTNode {

    left:     ASTNode;
    operator: Token;
    right:    ASTNode;

    constructor (left: ASTNode, operator: Token, right: ASTNode) {
        super();
        this.left     = left;
        this.operator = operator;
        this.right    = right;
    }

    toString () {
        return `( ${this.left} ${this.operator} ${this.right} )`;
    }

}

export class BlockNode extends ASTNode {

    type = 'block';

    nodes: ASTNode[];

    constructor (...nodes: ASTNode[]) {
        super();
        this.nodes = nodes;
    }

    toString () {
        return `{\n\n${this.nodes.join('; \n')}\n\n}`;
    }

}

export class MemberAccessNode extends ASTNode {

    type = 'memberAccess';

    expr:      ASTNode;
    member:    ASTNode | Token;

    constructor (expr: ASTNode, member: ASTNode | Token) {
        super();
        this.expr = expr;
        this.member = member;
    }

    toString () {
        return `( ${this.expr} [ ${this.member} ] )`;
    }

}

export class VarAssignNode extends ASTNode {

    name:     Token;
    operator: Token;
    expr?:    ASTNode;

    constructor (name: Token, operator: Token, expr?: ASTNode) {
        super();
        this.name     = name;
        this.operator = operator;
        this.expr     = expr;
    }

    toString () {
        return `[${this.name} ${this.operator} ${this.expr}]`;
    }

}

export class IfNode extends ASTNode {

    type = 'if';

    condIf:    ASTNode;
    thenIf:    ASTNode;
    thenElse?: ASTNode;

    constructor (_keyword: Token, condIf: ASTNode, thenIf: ASTNode, thenElse?: ASTNode) {
        super();
        this.condIf   = condIf;
        this.thenIf   = thenIf;
        this.thenElse = thenElse;
    }

    toString () {
        return `if ${this.condIf} then ${this.thenIf} ${this.thenElse || ""}`;
    }

}

export class ElseNode extends ASTNode {

    type = 'else';

    block: ASTNode;

    constructor (_keyword: Token, block: ASTNode) {
        super();
        this.block = block;
    }

    toString () {
        return `else ${this.block}`;
    }

}