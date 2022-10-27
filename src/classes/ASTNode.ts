export default class ASTNode {

    isNode: boolean = true;
    static isNodeConstructor: boolean = true;

    toString () {
        return "[ParseitASTNode]"
    }

}

export interface ASTNodeConstructor {
    isNodeConstructor: boolean;
}