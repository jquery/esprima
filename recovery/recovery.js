/*global document $ test ok equal expect module esprimaContentAssistant console esprima */

/* Helper functions */

/**
 * Invoke the parser.
 */
function parse(contents) {
  return esprima.parse(contents,{
			range: false,
			loc: false, 
			tolerant: true
		});
}

/**
 * Configurable reduce function for an AST, enables us to write more concise tests.
 */
function reduce(parsedStructure, options) {
    var string = "";
    var data = null;
    var flatten = function(node,data,isInitialVisit) {
        if (!isInitialVisit) {
            string  = string +")";
            return true;
        }
        string = string + "("+node.type;
        if (node.type === 'Identifier') {
            string=string+":"+node.name;
        }
        return true;
    };

    try {
		esprimaContentAssistant().visit(parsedStructure.body, data, flatten, flatten);
	} catch (done) {
		if (done !== "done") {
			// a real error
			throw(done);
		}
	}
	return string;
}

function computeContentAssistAtEnd(contents, prefix) {
	if (!prefix) {
		prefix = "";
	}
	var offset = contents.indexOf("/**/");
	if (offset < 0) {
		offset = contents.length;
	}
	
	return esprimaContentAssistant().computeProposals(prefix, contents, {start: offset});
}

function testProposal(proposal, text, description) {
	equal(proposal.proposal, text, "Invalid proposal text");
	if (description) {
		equal(proposal.description, description, "Invalid proposal description");
	}
}

function testProposals(actualProposals, expectedProposals) {
	equal(actualProposals.length, expectedProposals.length, 
		"Wrong number of proposals.  Expected:\n" + expectedProposals +"\nActual:\n"+actualProposals);
		
	for (var i = 0; i < actualProposals.length; i++) {
		testProposal(actualProposals[i], expectedProposals[i][0], expectedProposals[i][1]);
	}
}

function _test(name) {
	console.log("Test " + name + " is disabled");
}

function message(line, text) {
	return {
		lineNumber:line,
		message:text
	};
}

function stringify(parsedProgram) {
  var body = parsedProgram.body;
  if (body.length===1) {
    body=body[0];
  }
  var replacer = function(key,value) {
    if (key==='computed') {
      return;
    } 
    return value;
  };
  return JSON.stringify(body,replacer).replace(/"/g,'');
}

function assertNoErrors(ast) {
  ok(ast.errors===null || ast.errors.length===0,'errors: '+ast.errors.length+'\n'+ast.errors);
}

function assertErrors(ast,expectedErrors) {
  var expectedErrorList = (expectedErrors instanceof Array ? expectedErrors: [expectedErrors]);
  var correctNumberOfErrors = ast.errors!==null && ast.errors.length===expectedErrorList.length;
  ok(correctNumberOfErrors,'checking number of errors (expecting '+expectedErrorList.length+')\nErrors:'+ast.errors.length+'\n'+ast.errors);
  if (correctNumberOfErrors) {
	  for (var e=0;e<expectedErrors.length;e++) {
	    var expectedError = expectedErrorList[e];
	    var actualError = ast.errors[e];
	    equal(actualError.lineNumber,expectedError.lineNumber,"checking line for message #"+(e+1)+": "+actualError);
	    var actualMessage = actualError.message.replace(/Line [0-9]*: /,'');
	    equal(actualMessage,expectedError.message,"checking text for message #"+(e+1)+": "+actualError);
	  }
  }
}

$(document).ready(function() {

	// add parsing tests here
	module("Recovery module - dots");
	
	// parse a simple string, flatten the ast and confirm the result
	test("test 1 - sanity test",function() {
	  var parsedProgram = parse("foo.bar");
      assertNoErrors(parsedProgram);
	  equal(stringify(parsedProgram),"{type:ExpressionStatement,expression:{type:MemberExpression,object:{type:Identifier,name:foo},property:{type:Identifier,name:bar}}}");
	});
	
	test("test 2 - dot followed by EOF",function() {
	  var parsedProgram = parse("foo.");
      assertErrors(parsedProgram,message(1,'Unexpected end of input'));
      equal(stringify(parsedProgram),"{type:ExpressionStatement,expression:{type:MemberExpression,object:{type:Identifier,name:foo},property:null}}");
	});
	
	test("test 3 - dot used in function (so followed by end curly)",function() {
	  var parsedProgram = parse("var foo = { ooo:8 }\nfunction f() {\n  foo.\n}");
      assertErrors(parsedProgram,message(4,'Unexpected token }'));
      equal(stringify(parsedProgram),"[{type:VariableDeclaration,declarations:[{type:VariableDeclarator,id:{type:Identifier,name:foo},init:{type:ObjectExpression,properties:[{type:Property,key:{type:Identifier,name:ooo},value:{type:Literal,value:8},kind:init}]}}],kind:var},{type:FunctionDeclaration,id:{type:Identifier,name:f},params:[],body:{type:BlockStatement,body:[{type:ExpressionStatement,expression:{type:MemberExpression,object:{type:Identifier,name:foo},property:null}}]}}]");
    });
	
    // Notice that node for member expression represents 'foo.var' - so it had a go at parsing that then failed, recovered to the start of the line and continued
	test("test 4 - dot followed by newline then var",function() {	  
	  var parsedProgram = parse("foo.\nvar x = 4;");
      assertErrors(parsedProgram,message(2,'Unexpected identifier'));
      // this is with no 'rewind' so the two pieces are 'foo.var' and 'x=4' 
//      equal(stringify(parsedProgram),"[{type:ExpressionStatement,expression:{type:MemberExpression,object:{type:Identifier,name:foo},property:{type:Identifier,name:var}}},{type:ExpressionStatement,expression:{type:AssignmentExpression,operator:=,left:{type:Identifier,name:x},right:{type:Literal,value:4}}}]");
      
      // this is with rewind:
      equal(stringify(parsedProgram),"[{type:ExpressionStatement,expression:{type:MemberExpression,object:{type:Identifier,name:foo},property:{type:Identifier,name:var}}},{type:VariableDeclaration,declarations:[{type:VariableDeclarator,id:{type:Identifier,name:x},init:{type:Literal,value:4}}],kind:var}]");
	});
    
    // Parsed as a call expression 'foo.if(3==4)' then fails on the curly bracket
	test("test 5 - dot followed by newline then if",function() {
	  var parsedProgram = parse("foo.\nif (3===4) {}\n");
      assertErrors(parsedProgram,message(2,'Unexpected token {'));
      equal(stringify(parsedProgram), "[{type:ExpressionStatement,expression:{type:CallExpression,callee:{type:MemberExpression,object:{type:Identifier,name:foo},property:{type:Identifier,name:if}},arguments:[{type:BinaryExpression,operator:===,left:{type:Literal,value:3},right:{type:Literal,value:4}}]}},{type:IfStatement,test:{type:BinaryExpression,operator:===,left:{type:Literal,value:3},right:{type:Literal,value:4}},consequent:{type:BlockStatement,body:[]},alternate:null}]");
	});
	
	test("test 6 - dot followed by newlines then eof",function() {
	  var parsedProgram = parse("foo.\n\n");
      assertErrors(parsedProgram,[message(3,'Unexpected end of input')]);
      equal(stringify(parsedProgram),"{type:ExpressionStatement,expression:{type:MemberExpression,object:{type:Identifier,name:foo},property:null}}");
	});
	
	// TODO why two errors: 2 Error: Line 2: Unexpected token (,Error: Line 2: Unexpected identifier
	test("test 7 - dot followed by newline then a non identifier (just a parenthesized expression)",function() {
	  var parsedProgram = parse("foo.\n(foo())\n");
      assertErrors(parsedProgram,[message(2,'Unexpected token ('),message(2,'Unexpected identifier')]);
      equal(stringify(parsedProgram),"[{type:ExpressionStatement,expression:{type:MemberExpression,object:{type:Identifier,name:foo},property:null}},{type:ExpressionStatement,expression:{type:CallExpression,callee:{type:Identifier,name:foo},arguments:[]}}]");
	});
	
	// Similar to other cases of an identifier following a 'blah.' - just creates a funny looking member expression then recovers
	test("test 8 - dot followed by function",function() {
	  var parsedProgram = parse("foo.\nfunction f() {}\n");
      assertErrors(parsedProgram,message(2,'Unexpected identifier'));
      equal(stringify(parsedProgram),"[{type:ExpressionStatement,expression:{type:MemberExpression,object:{type:Identifier,name:foo},property:{type:Identifier,name:function}}},{type:FunctionDeclaration,id:{type:Identifier,name:f},params:[],body:{type:BlockStatement,body:[]}}]");
	});
	
	test("test 9 - dot then whitespace before newline and var",function() {
	  var parsedProgram = parse("foo.    \nvar x= 4\n");
      assertErrors(parsedProgram,message(2,'Unexpected end of input'));
      equal(stringify(parsedProgram),"[{type:ExpressionStatement,expression:{type:MemberExpression,object:{type:Identifier,name:foo},property:{type:Identifier,name:var}}},{type:VariableDeclaration,declarations:[{type:VariableDeclarator,id:{type:Identifier,name:x},init:{type:Literal,value:4}}],kind:var}]");
	});
	
	test("test 10 - dot then semicolon",function() {
	  var parsedProgram = parse("foo.;");
      assertErrors(parsedProgram,message(1,'Unexpected token ;'));
      equal(stringify(parsedProgram),"{type:ExpressionStatement,expression:{type:MemberExpression,object:{type:Identifier,name:foo},property:null}}");
	});

	test("test 11 - dot expression in parentheses",function() {
	  var parsedProgram = parse("(foo.);");
      assertErrors(parsedProgram,[message(1,'Unexpected token )')]);
      equal(stringify(parsedProgram),"{type:ExpressionStatement,expression:{type:MemberExpression,object:{type:Identifier,name:foo},property:null}}");
	});
	
	test("test 12 - dot expression in nested parentheses",function() {
	  var parsedProgram = parse("((foo.));");
      assertErrors(parsedProgram,[message(1,'Unexpected token )')]);
      equal(stringify(parsedProgram),"{type:ExpressionStatement,expression:{type:MemberExpression,object:{type:Identifier,name:foo},property:null}}");
	});

    // this will recover on hitting the && following the . - it reverses one 'token' so that the && is seen again and then parsing
    // continues as expected
	test("test 13 - dot expression followed by ampersand",function() {
	  var parsedProgram = parse("foo. && true;");
      assertErrors(parsedProgram,message(1,'Unexpected token &&'));
      equal(stringify(parsedProgram),"{type:ExpressionStatement,expression:{type:LogicalExpression,operator:&&,left:{type:MemberExpression,object:{type:Identifier,name:foo},property:null},right:{type:Literal,value:true}}}");
	});
	
	test("test 14 - dot expression sequence followed by or",function() {
	  var parsedProgram = parse("foo.bar. || true;");
      assertErrors(parsedProgram,message(1,'Unexpected token ||'));
      equal(stringify(parsedProgram),"{type:ExpressionStatement,expression:{type:LogicalExpression,operator:||,left:{type:MemberExpression,object:{type:MemberExpression,object:{type:Identifier,name:foo},property:{type:Identifier,name:bar}},property:null},right:{type:Literal,value:true}}}");
	});
	
	test("test 15 - dot expression sequence parenthesized expression followed by or",function() {
	  var parsedProgram = parse("(foo.bar. || true);");
      assertErrors(parsedProgram,message(1,'Unexpected token ||'));
      equal(stringify(parsedProgram),"{type:ExpressionStatement,expression:{type:LogicalExpression,operator:||,left:{type:MemberExpression,object:{type:MemberExpression,object:{type:Identifier,name:foo},property:{type:Identifier,name:bar}},property:null},right:{type:Literal,value:true}}}");
	});
		
	module("Recovery module - ifs");
	
	test("test 16 - if statements 1",function() {
		var parsedProgram = parse("if (");
		assertErrors(parsedProgram,message(1,'Unexpected end of input'));
		equal(stringify(parsedProgram),	"{type:IfStatement,test:null,consequent:null,alternate:null}");
	});
	
	// two errors occur here, effectively the same thing twice.  
	// First we run out of input parsing the bit after the '.'
	// then we run out of input parsing the closing ')'
	test("test 17 - if statements with incomplete property ref",function() {
		var parsedProgram = parse("if (foo.");
		assertErrors(parsedProgram,message(1,'Unexpected end of input'));
		equal(stringify(parsedProgram),"{type:IfStatement,test:{type:MemberExpression,object:{type:Identifier,name:foo},property:null},consequent:null,alternate:null}");
	});
	
	// More observations around recovery here.
	// In order for the previous test to pass we need to introduce 'rewind()' into the parseIfStatment
	// function for when it goes wrong.  If we do this without further change it will rewind to the beginning of 
	
	test("test 18 - if statements with incomplete property ref and stuff following ",function() {
		var parsedProgram = parse("if (foo.\nvar x = 4;");
		assertErrors(parsedProgram,[message(2,'Unexpected identifier'),message(2,'Unexpected token ='),message(2,'Unexpected number')]);
		equal(stringify(parsedProgram),	
            "[{type:IfStatement,test:{type:MemberExpression,object:{type:Identifier,name:foo},property:{type:Identifier,name:var}},consequent:{type:ExpressionStatement,expression:null},alternate:null},{type:VariableDeclaration,declarations:[{type:VariableDeclarator,id:{type:Identifier,name:x},init:{type:Literal,value:4}}],kind:var}]");
	});
	
	test("test 19 - if statements missing closing paren",function() {
		var parsedProgram = parse("if (true {\nvar x = 1; var y = 2;\n}");
		assertErrors(parsedProgram,message(1,'Unexpected end of input'));
		equal(stringify(parsedProgram),	"{type:IfStatement,test:{type:Literal,value:true},consequent:{type:BlockStatement,body:[{type:VariableDeclaration,declarations:[{type:VariableDeclarator,id:{type:Identifier,name:x},init:{type:Literal,value:1}}],kind:var},{type:VariableDeclaration,declarations:[{type:VariableDeclarator,id:{type:Identifier,name:y},init:{type:Literal,value:2}}],kind:var}]},alternate:null}");
	});
	
	

});
