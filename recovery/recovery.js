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
  ok(correctNumberOfErrors,'errors: '+ast.errors.length+'\n'+ast.errors);
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
	module("Parsing module");
	
	// parse a simple string, flatten the ast and confirm the result
	test("basic parse",function() {
	  var parsedProgram = parse("foo.bar");
      assertNoErrors(parsedProgram);
	  equal(stringify(parsedProgram),"{type:ExpressionStatement,expression:{type:MemberExpression,object:{type:Identifier,name:foo},property:{type:Identifier,name:bar}}}");
	});
	
	test("recovery - dot followed by EOF",function() {
	  var parsedProgram = parse("foo.");
      assertErrors(parsedProgram,message(1,'Unexpected end of input'));
      equal(stringify(parsedProgram),"{type:ExpressionStatement,expression:{type:MemberExpression,object:{type:Identifier,name:foo}}}");
	});
	
    // Notice that node for member expression represents 'foo.var' - so it had a go at parsing that then failed, recovered to the start of the line and continued
	test("recovery - dot followed by newline then var",function() {	  
	  var parsedProgram = parse("foo.\nvar x = 4;");
      assertErrors(parsedProgram,message(2,'Unexpected identifier'));
      equal(stringify(parsedProgram),"[{type:ExpressionStatement,expression:{type:MemberExpression,object:{type:Identifier,name:foo},property:{type:Identifier,name:var}}},{type:VariableDeclaration,declarations:[{type:VariableDeclarator,id:{type:Identifier,name:x},init:{type:Literal,value:4}}],kind:var}]");
	});
    
    // Parsed as a call expression 'foo.if(3==4)' then fails on the curly bracket
	test("recovery - dot followed by newline then if",function() {
	  var parsedProgram = parse("foo.\nif (3===4) {}\n");
      assertErrors(parsedProgram,message(2,'Unexpected token {'));
      equal(stringify(parsedProgram), "[{type:ExpressionStatement,expression:{type:CallExpression,callee:{type:MemberExpression,object:{type:Identifier,name:foo},property:{type:Identifier,name:if}},arguments:[{type:BinaryExpression,operator:===,left:{type:Literal,value:3},right:{type:Literal,value:4}}]}},{type:IfStatement,test:{type:BinaryExpression,operator:===,left:{type:Literal,value:3},right:{type:Literal,value:4}},consequent:{type:BlockStatement,body:[]},alternate:null}]");
	});
	
	test("recovery - dot followed by newlines then eof",function() {
	  var parsedProgram = parse("foo.\n\n");
      assertErrors(parsedProgram,[message(3,'Unexpected end of input')]);
      equal(stringify(parsedProgram),"{type:ExpressionStatement,expression:{type:MemberExpression,object:{type:Identifier,name:foo}}}");
	});
	
	// TODO why two errors: 2 Error: Line 2: Unexpected token (,Error: Line 2: Unexpected identifier
	test("recovery - dot followed by newline then a non identifier (just a parenthesized expression)",function() {
	  var parsedProgram = parse("foo.\n(foo())\n");
      assertErrors(parsedProgram,[message(2,'Unexpected token ('),message(2,'Unexpected identifier')]);
      equal(stringify(parsedProgram),"[{type:ExpressionStatement,expression:{type:MemberExpression,object:{type:Identifier,name:foo}}},{type:ExpressionStatement,expression:{type:CallExpression,callee:{type:Identifier,name:foo},arguments:[]}}]");
	});
	
	// Similar to other cases of an identifier following a 'blah.' - just creates a funny looking member expression then recovers
	test("recovery - dot followed by function",function() {
	  var parsedProgram = parse("foo.\nfunction f() {}\n");
      assertErrors(parsedProgram,message(2,'Unexpected identifier'));
      equal(stringify(parsedProgram),"[{type:ExpressionStatement,expression:{type:MemberExpression,object:{type:Identifier,name:foo},property:{type:Identifier,name:function}}},{type:FunctionDeclaration,id:{type:Identifier,name:f},params:[],body:{type:BlockStatement,body:[]}}]");
	});
	
	test("recovery - dot then whitespace before newline and var",function() {
	  var parsedProgram = parse("foo.    \nvar x= 4\n");
      assertErrors(parsedProgram,message(2,'Unexpected end of input'));
      equal(stringify(parsedProgram),"[{type:ExpressionStatement,expression:{type:MemberExpression,object:{type:Identifier,name:foo},property:{type:Identifier,name:var}}},{type:VariableDeclaration,declarations:[{type:VariableDeclarator,id:{type:Identifier,name:x},init:{type:Literal,value:4}}],kind:var}]");
	});
	
	test("recovery - dot then semicolon",function() {
	  var parsedProgram = parse("foo.;");
      assertErrors(parsedProgram,message(1,'Unexpected token ;'));
      equal(stringify(parsedProgram),"{type:ExpressionStatement,expression:{type:MemberExpression,object:{type:Identifier,name:foo}}}");
	});
	
	test("recovery - dotted expression in parentheses",function() {
	  var parsedProgram = parse("(foo.);");
      assertErrors(parsedProgram,[message(1,'Unexpected token )')]);
      equal(stringify(parsedProgram),"{type:ExpressionStatement,expression:{type:MemberExpression,object:{type:Identifier,name:foo}}}");
	});
	
	test("recovery - dotted expression in nested parentheses",function() {
	  var parsedProgram = parse("((foo.));");
      assertErrors(parsedProgram,[message(1,'Unexpected token )')]);
      equal(stringify(parsedProgram),"{type:ExpressionStatement,expression:{type:MemberExpression,object:{type:Identifier,name:foo}}}");
	});

    // this will recover on hitting the && following the . - it reverses one 'token' so that the && is seen again and then parsing
    // continues as expected
	test("recovery - dotted expression followed by ampersand",function() {
	  var parsedProgram = parse("foo. && true;");
      assertErrors(parsedProgram,message(1,'Unexpected token &&'));
      equal(stringify(parsedProgram),"{type:ExpressionStatement,expression:{type:LogicalExpression,operator:&&,left:{type:MemberExpression,object:{type:Identifier,name:foo}},right:{type:Literal,value:true}}}");
	});
	
	test("recovery - double dotted expression followed by or",function() {
	  var parsedProgram = parse("foo.bar. || true;");
      assertErrors(parsedProgram,message(1,'Unexpected token ||'));
      equal(stringify(parsedProgram),"{type:ExpressionStatement,expression:{type:LogicalExpression,operator:||,left:{type:MemberExpression,object:{type:MemberExpression,object:{type:Identifier,name:foo},property:{type:Identifier,name:bar}}},right:{type:Literal,value:true}}}");
	});
	
	test("recovery - parenthesized double dotted expression followed by or",function() {
	  var parsedProgram = parse("(foo.bar. || true);");
      assertErrors(parsedProgram,message(1,'Unexpected token ||'));
      equal(stringify(parsedProgram),"{type:ExpressionStatement,expression:{type:LogicalExpression,operator:||,left:{type:MemberExpression,object:{type:MemberExpression,object:{type:Identifier,name:foo},property:{type:Identifier,name:bar}}},right:{type:Literal,value:true}}}");
	});

});
