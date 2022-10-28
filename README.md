<div align="center"><img src="https://media.discordapp.net/attachments/510776441084968977/1035527394632671242/parseit-logo.png" height=200 /></div>

# Parsing Toolkit for Programming Languages
**ParseIT** is a JavaScript library for generating recursive-descent parsers that work with tokens. It provides a declarative way to define grammar rules for your language, as well as AST nodes to build the resulting tree with. It is availible on npm and works on variety of JavaScript and TypeScript runtimes, including web browsers.

## Getting Started
First, add ParseIT to your project using npm
```
npm install parseit
```

Congratulations, you're good to go! 
<br/><br/>

### Creating grammar
Let's start by creating a new file named `grammar.js`, where we will define the grammar rules for our language:

```js
import { Grammar, either } from 'parseit';
const grammar = new Grammar();

export default grammar;
```

To create a new rule, we can use the `rule()` method, present in the grammar object. ParseIT works with tokens, which have a type and, optionally, a value. To refer to a certain token within our rule, we use this notation: `@TOKENTYPE` or `@TOKENTYPE:TOKENVALUE`. 

With that being said, we are ready to define our first rule:
```js
grammar.rule("number").from("@NUMBER").pass();
```
The rule above looks for any token with the type `NUMBER` and passes it onto the parent rule, or if there's no parent rule, returns it as the result. However, the true power of recursive-descent parsers comes with nesting these rules together. To refer to a rule within another rule, we use this notation: `$ruleName`. 

Let's define another rule:
```js
grammar.rule("term").from("$number", "@MUL", "$number").pass();
grammar.rule("term").from("$number", "@DIV", "$number").pass();
grammar.rule("term").from("$number").pass();
```
As you can see, we are defining this new `term` rule multiple times. This will define 3 *variations* of the rule. When parsing, it will check for every rule variation, until it finds the one that matches. Ordering rule variations correctly is very important, as the parser scans them in the same order they're defined in the grammar file.

Anyways, the `term` rule looks for these three patterns:
* 2 numbers separated by a `*` symbol (`MUL` token)
* 2 numbers separated by a `/` symbol (`DIV` token)
* a single number

Now, before we add support for `+` and `-` symbols, there's one more thing that needs to be solved. In our current grammatical setup, we cannot combine operations together (Ex: `2 * 2 * 3 / 4`). Another words, our `term` rule has to be *left-recursive*. Luckily, ParseIT provides us with a concept called *loops*! There are two types of loops: *binary loops*, which allow for left-recursive grammar and *block loops*, which we'll talk about later. Let's add a binary loop to the rule:

```js
grammar.rule("term").from("$number").binaryLoop(["@MUL", "$number"]).pass();
grammar.rule("term").from("$number").binaryLoop(["@DIV", "$number"]).pass();
grammar.rule("term").from("$number").pass();
```

This makes it possible to write expressions like these:
```
2 * 2 * 2
12 / 2 / 3
1 * 2 * 3 * 4 * 5 * 6
```

However, there's still one problem, being that we cannot combine both operators into a single expression. Luckily, there's another concept in ParseIT, that makes this possible. Let's rewrite the `term` rule once more:

```js
grammar.rule("term").from("$number").binaryLoop([either("@MUL", "@DIV"), "$number"]).pass();
grammar.rule("term").from("$number").pass();
```

The `either` function allows for multiple choices in a single rule, without breaking the loop. Finally, we are finished with `term`! Let's add other rules to complete our grammar:

```js
import { Grammar, either } from 'parseit';
const grammar = new Grammar();

grammar.rule("expr").from("$term").binaryLoop([either("@ADD", "@SUB"), "$term"]).pass();
grammar.rule("expr").from("$term").pass();

grammar.rule("term").from("$factor").binaryLoop([either("@MUL", "@DIV"), "$factor"]).pass();
grammar.rule("term").from("$factor").pass();

grammar.rule("factor").from("@ADD", "$factor").pass();
grammar.rule("factor").from("@SUB", "$factor").pass();
grammar.rule("factor").from("$number").pass();

grammar.rule("number").from("@NUMBER").pass();
grammar.rule("number").from("@OPAREN", "$expr", "@CPAREN").select(1);

export default grammar;
```

This set of rules makes it possible to use `-` or `+` unary operators before the numbers (notice how the `factor` rule is *right-recursive*), and to use parenthesis (`OPAREN` and `CPAREN` tokens) to change the order of operations. Notice the new `select(number)` method. It only passes the `expr` rule to the AST, ignoring parenthesis tokens.
<br/><br/>

### Creating AST Nodes
Now, before testing our grammar rules, we need something to build our *AST* (Abstract Syntax Tree) with. In ParseIT, we use a special `ASTNode` class for that. Let's create a new file titled `ast.js`. We would need 4 types of nodes in our language:
* Atom Node (for single numbers)
* Binary Operation Node (for addition, subtraction, multiplication and division)
* Unary Operation Node (for factor rules)
* Block Node (for blocks of expressions)

Let's define them like so:
```js
import { ASTNode, Token} from 'parseit';

export class AtomNode extends ASTNode {
    type = "atom";
    // token: Token
    constructor (token) {
        super();
        this.token = token;
    }
}

export class UnaryOpNode extends ASTNode {
    type = "unaryOp";
    // operator: Token, node: ASTNode
    constructor (operator, node) {
        super();
        this.operator = operator;
        this.node     = node;
    }
}

export class BinaryOpNode extends ASTNode {
    type = "binaryOp";
    // left: ASTNode, operator: Token, right: ASTNode
    constructor (left, operator, right) {
        super();
        this.left     = left;
        this.operator = operator;
        this.right    = right;
    }
}

export class BlockNode extends ASTNode {
    type = "block";
    // nodes: ASTNode[]
    constructor (...nodes) {
        super();
        this.nodes = nodes;
    }
}
```

The constructor arguments for a node have to be defined in the same order they appear in the grammar of your language if you plan to use them with the `as(...)` method.

Before we add these nodes to our grammar rules, let's define a small helper function:

```js
function binaryOpOrPass (data) {
    return data.length == 1 
        ? data[0] 
        : new BinaryOpNode(...data);
}
```
This would make our AST a bit cleaner.

Now we can incorporate the nodes into the grammar:
```js
import { Grammar, either } from 'parseit';
import { AtomNode, UnaryOpNode, BinaryOpNode, BlockNode } from './ast.js';
const grammar = new Grammar();

function binaryOpOrPass (data) {
    return data.length == 1 
        ? data[0] 
        : new BinaryOpNode(...data);
}

grammar.rule("expr").from("$term").binaryLoop([either("@ADD", "@SUB"), "$term"]).decide(binaryOpOrPass);
grammar.rule("expr").from("$term").pass();

grammar.rule("term").from("$factor").binaryLoop([either("@MUL", "@DIV"), "$factor"]).decide(binaryOpOrPass);
grammar.rule("term").from("$factor").pass();

grammar.rule("factor").from("@ADD", "$factor").as(UnaryOpNode);
grammar.rule("factor").from("@SUB", "$factor").as(UnaryOpNode);
grammar.rule("factor").from("$number").pass();

grammar.rule("number").from("@NUMBER").as(AtomNode);
grammar.rule("number").from("@OPAREN", "$expr", "@CPAREN").select(1);

export default grammar;
```

Our language is almost complete, but we are going to add one more thing.
<br/><br/>

### Blocks

Blocks make it possible to group multiple statements into an array. Blocks also have a special *separator* rule, which is usually just a single token, used to separate the statements between one another. In our language we can use the new line token (`NEWL`) as a separator between expressions.

```js
grammar.rule("block").blockLoop("$expr", "@NEWL").as(BlockNode);
grammar.rule("block").from("$expr").as(BlockNode);
```

We also have to tell the parser which rule should it start from. To do that, let's add this command after the rules:

```js
grammar.startFrom("block");
```
And just like that, we are done with our grammar, hooray!
```js
import { Grammar, either } from 'parseit';
import { AtomNode, UnaryOpNode, BinaryOpNode, BlockNode } from './ast.js';
const grammar = new Grammar();

function binaryOpOrPass (data) {
    return data.length == 1 
        ? data[0] 
        : new BinaryOpNode(...data);
}

grammar.rule("block").blockLoop("$expr", "@NEWL").as(BlockNode);
grammar.rule("block").from("$expr").as(BlockNode);

grammar.rule("expr").from("$term").binaryLoop([either("@ADD", "@SUB"), "$term"]).decide(binaryOpOrPass);
grammar.rule("expr").from("$term").pass();

grammar.rule("term").from("$factor").binaryLoop([either("@MUL", "@DIV"), "$factor"]).decide(binaryOpOrPass);
grammar.rule("term").from("$factor").pass();

grammar.rule("factor").from("@ADD", "$factor").as(UnaryOpNode);
grammar.rule("factor").from("@SUB", "$factor").as(UnaryOpNode);
grammar.rule("factor").from("$number").pass();

grammar.rule("number").from("@NUMBER").as(AtomNode);
grammar.rule("number").from("@OPAREN", "$expr", "@CPAREN").select(1);

grammar.startFrom("block");

export default grammar;
```
<br/><br/>

### Parsing

Let's create a `main.js` file where we'll be testing our language:

```js
import { Token, Parser} from "parseit";
import grammar from "./grammar.js";

const parser = new Parser(grammar);

const result = parser.parse([
    new Token("NUMBER", 2), new Token("ADD"), new Token("NUMBER", 2)
]);

console.log(JSON.stringify(result));
```

If you did everything right, you should see this as the output:
```json
{
  "isNode": true,
  "type": "block",
  "nodes": [
    {
      "isNode": true,
      "type": "binaryOp",
      "left": {
        "isNode": true,
        "type": "atom",
        "token": {
          "type": "NUMBER",
          "value": "2"
        }
      },
      "operator": {
        "type": "ADD"
      },
      "right": {
        "isNode": true,
        "type": "atom",
        "token": {
          "type": "NUMBER",
          "value": "2"
        }
      }
    }
  ]
}
```

At this point, you should connect some sort of a lexer to convert plain text to tokens and test your language on a few other cases, such as:
```
2 + 2 * 2
(2 + 2) * 2
3 - 5 / 2 + 1 * 5
4 - -4 + +10 - (2 * (1 + 2))
```