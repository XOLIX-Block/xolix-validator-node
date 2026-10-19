export interface ASTNode {
    type: string;
}
export interface ContractNode extends ASTNode {
    type: 'Contract';
    name: string;
    state: StateDeclNode[];
    methods: MethodNode[];
}
export interface StateDeclNode extends ASTNode {
    type: 'StateDecl';
    name: string;
    dataType: string;
}
export interface MethodNode extends ASTNode {
    type: 'Method';
    name: string;
    capabilities: string[];
    isConstructor: boolean;
    args: {
        name: string;
        dataType: string;
    }[];
    body: StatementNode[];
}
export interface StatementNode extends ASTNode {
    type: string;
}
export interface AssignmentNode extends StatementNode {
    type: 'Assignment';
    target: string;
    value: any;
}
export interface RequireNode extends StatementNode {
    type: 'Require';
    condition: string;
    errorMessage: string;
}
