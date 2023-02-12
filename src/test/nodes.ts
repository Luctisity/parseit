import ASTNode from "../classes/ASTNode";
import Token from "../classes/Token";


export class AtomNode extends ASTNode {
    token: Token;

    constructor (token: Token) {
        super();
        this.token = token;
    }

    toString = () => this.token.toString();
}

export class UnaryOpNode extends ASTNode {
    operator: Token;
    node:     ASTNode;

    constructor (operator: Token, node: ASTNode) {
        super();
        this.operator = operator;
        this.node     = node;
    }

    toString = () => `( ${this.operator} ${this.node} )`;
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

    toString = () => `( ${this.left} ${this.operator} ${this.right} )`;
}

export class BlockNode extends ASTNode {
    nodes: ASTNode[];

    constructor (...nodes: ASTNode[]) {
        super();
        this.nodes = nodes;
    }

    toString = () => `{\n\n${this.nodes.join('; \n')}\n\n}`;
}

export class MemberAccessNode extends ASTNode {
    expr:      ASTNode;
    member:    ASTNode | Token;

    constructor (expr: ASTNode, member: ASTNode | Token) {
        super();
        this.expr = expr;
        this.member = member;
    }

    toString = () => `( ${this.expr} [ ${this.member} ] )`;
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

    toString = () => `[${this.name} ${this.operator} ${this.expr}]`;
}

export class IfNode extends ASTNode {
    condIf:    ASTNode;
    thenIf:    ASTNode;
    thenElse?: ASTNode;

    constructor (_keyword: Token, condIf: ASTNode, thenIf: ASTNode, thenElse?: ASTNode) {
        super();
        this.condIf   = condIf;
        this.thenIf   = thenIf;
        this.thenElse = thenElse;
    }

    toString = () => `if ${this.condIf} then ${this.thenIf} ${this.thenElse || ""}`;
}

export class ElseNode extends ASTNode {
    block: ASTNode;

    constructor (_keyword: Token, block: ASTNode) {
        super();
        this.block = block;
    }

    toString = () => `else ${this.block}`;
}

export class SwitchNode extends ASTNode {
    cond:     ASTNode;
    cases:    ASTNode;
    defcase?: ASTNode;

    constructor (_keyword: Token, cond: ASTNode, cases?: ASTNode, defcase?: ASTNode) {
        super();
        this.cond    = cond;
        this.cases   = cases || new SwitchCasesNode();
        this.defcase = defcase;

        if (this.cases instanceof DefaultCaseNode) {
            this.defcase = this.cases;
            this.cases = new SwitchCasesNode();
        }
    }

    toString = () => `switch ${this.cond} {\n${this.cases}${this.defcase || ''}\n}`;
}

export class SwitchCasesNode extends ASTNode {
    cases: SwitchCaseNode[];

    constructor (...cases: SwitchCaseNode[]) {
        super();
        this.cases = cases;
    }

    toString = () => `${this.cases.join("\n")}`;
}

export class DefaultCaseNode extends ASTNode {
    block: ASTNode;

    constructor (_keyword: Token, block: ASTNode) {
        super();
        this.block = block;
    }

    toString = () => `\ndefault: ${this.block}`;
}

export class SwitchCaseNode extends ASTNode {
    test:  ASTNode;
    block: ASTNode;

    constructor (_keyword: Token, test: ASTNode, block: ASTNode) {
        super();
        this.test    = test;
        this.block   = block;
    }

    toString = () => `case ${this.test} ${this.block}`;
}