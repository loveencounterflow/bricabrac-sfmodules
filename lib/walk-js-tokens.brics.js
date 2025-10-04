(function() {
  'use strict';
  var BRICS, debug;

  //===========================================================================================================
  ({debug} = console);

  //###########################################################################################################

  //===========================================================================================================
  BRICS = {
    //=========================================================================================================
    /* NOTE Future Single-File Module */
    require_walk_js_tokens: function() {
      var HashbangComment, Identifier, JSXIdentifier, JSXPunctuator, JSXString, JSXText, KeywordsWithExpressionAfter, KeywordsWithNoLineTerminatorAfter, LineTerminatorSequence, MultiLineComment, Newline, NumericLiteral, Punctuator, RegularExpressionLiteral, SingleLineComment, StringLiteral, Template, TokensNotPrecedingObjectLiteral, TokensPrecedingExpression, WhiteSpace, exports, jsTokens, rpr_string, rpr_token, summarize, token_categories, walk_essential_js_tokens, walk_js_tokens;
      ({rpr_string} = (require('./rpr-string.brics')).require_rpr_string());
      //===========================================================================================================
      //###    ####    ####    ####    ####    ####    ####    ####    ####    ####    ####    ####    ####
      //###    ####    ####    ####    ####    ####    ####    ####    ####    ####    ####    ####    ####
      //###    ####    ####    ####    ####    ####    ####    ####    ####    ####    ####    ####    ####
      //###    ####    ####    ####    ####    ####    ####    ####    ####    ####    ####    ####    ####
      //###    ####    ####    ####    ####    ####    ####    ####    ####    ####    ####    ####    ####
      //###    ####    ####    ####    ####    ####    ####    ####    ####    ####    ####    ####    ####
      //###    ####    ####    ####    ####    ####    ####    ####    ####    ####    ####    ####    ####
      //###    ####    ####    ####    ####    ####    ####    ####    ####    ####    ####    ####    ####
      //###    ####    ####    ####    ####    ####    ####    ####    ####    ####    ####    ####    ####
      //###    ####    ####    ####    ####    ####    ####    ####    ####    ####    ####    ####    ####
      //###    ####    ####    ####    ####    ####    ####    ####    ####    ####    ####    ####    ####
      //###    ####    ####    ####    ####    ####    ####    ####    ####    ####    ####    ####    ####

      // thx to https://raw.githubusercontent.com/lydell/js-tokens/d1743a121103f970b9d2e807469cba02d24b852a/index.coffee

      // Copyright 2014, 2015, 2016, 2017, 2018, 2019, 2020, 2021, 2022, 2023 Simon Lydell
      // License: MIT.

      // https://tc39.es/ecma262/#sec-lexical-grammar
      // https://mathiasbynens.be/notes/javascript-identifiers
      // https://github.com/tc39/proposal-regexp-unicode-property-escapes/#other-examples
      // https://unicode.org/reports/tr31/#Backward_Compatibility
      // https://stackoverflow.com/a/27120110/2010616
      RegularExpressionLiteral = /\/(?![*\/])(?:\[(?:[^\]\\\n\r\u2028\u2029]+|\\.)*\]?|[^\/[\\\n\r\u2028\u2029]+|\\.)*(\/[$_\u200C\u200D\p{ID_Continue}]*|\\)?/yu;
      Punctuator = /--|\+\+|=>|\.{3}|\??\.(?!\d)|(?:&&|\|\||\?\?|[+\-%&|^]|\*{1,2}|<{1,2}|>{1,3}|!=?|={1,2}|\/(?![\/*]))=?|[?~,:;[\](){}]/y;
      // Note: `\x23` is `#`. The escape is used since VSCode’s syntax highlighting breaks otherwise.
      Identifier = /(\x23?)(?=[$_\p{ID_Start}\\])(?:[$_\u200C\u200D\p{ID_Continue}]+|\\u[\da-fA-F]{4}|\\u\{[\da-fA-F]+\})+/yu;
      StringLiteral = /(['"])(?:[^'"\\\n\r]+|(?!\1)['"]|\\(?:\r\n|[^]))*(\1)?/y;
      NumericLiteral = /(?:0[xX][\da-fA-F](?:_?[\da-fA-F])*|0[oO][0-7](?:_?[0-7])*|0[bB][01](?:_?[01])*)n?|0n|[1-9](?:_?\d)*n|(?:(?:0(?!\d)|0\d*[89]\d*|[1-9](?:_?\d)*)(?:\.(?:\d(?:_?\d)*)?)?|\.\d(?:_?\d)*)(?:[eE][+-]?\d(?:_?\d)*)?|0[0-7]+/y;
      Template = /[`}](?:[^`\\$]+|\\[^]|\$(?!\{))*(`|\$\{)?/y;
      WhiteSpace = /[\t\v\f\ufeff\p{Zs}]+/yu;
      LineTerminatorSequence = /\r?\n|[\r\u2028\u2029]/y;
      MultiLineComment = /\/\*(?:[^*]+|\*(?!\/))*(\*\/)?/y;
      SingleLineComment = /\/\/.*/y;
      HashbangComment = /^#!.*/;
      JSXPunctuator = /[<>.:={}]|\/(?![\/*])/y;
      JSXIdentifier = /[$_\p{ID_Start}][$_\u200C\u200D\p{ID_Continue}-]*/yu;
      JSXString = /(['"])(?:[^'"]+|(?!\1)['"])*(\1)?/y;
      JSXText = /[^<>{}]+/y;
      TokensPrecedingExpression = /^(?:[\/+-]|\.{3}|\?(?:InterpolationIn(?:JSX|Template)|NoLineTerminatorHere|NonExpressionParenEnd|UnaryIncDec))?$|[{}([,;<>=*%&|^!~?:]$/;
      TokensNotPrecedingObjectLiteral = /^(?:=>|[;\]){}]|else|\?(?:NoLineTerminatorHere|NonExpressionParenEnd))?$/;
      KeywordsWithExpressionAfter = /^(?:await|case|default|delete|do|else|instanceof|new|return|throw|typeof|void|yield)$/;
      KeywordsWithNoLineTerminatorAfter = /^(?:return|throw|yield)$/;
      Newline = RegExp(LineTerminatorSequence.source);
      module.exports = jsTokens = function*(input, {jsx = false} = {}) {
        var braces, firstCodePoint, isExpression, lastIndex, lastSignificantToken, length, match, mode, nextLastIndex, nextLastSignificantToken, parenNesting, postfixIncDec, punctuator, stack;
        ({length} = input);
        lastIndex = 0;
        lastSignificantToken = "";
        stack = [
          {
            tag: "JS"
          }
        ];
        braces = [];
        parenNesting = 0;
        postfixIncDec = false;
        if (match = HashbangComment.exec(input)) {
          yield ({
            type: "HashbangComment",
            value: match[0]
          });
          lastIndex = match[0].length;
        }
        while (lastIndex < length) {
          mode = stack[stack.length - 1];
          switch (mode.tag) {
            case "JS":
            case "JSNonExpressionParen":
            case "InterpolationInTemplate":
            case "InterpolationInJSX":
              if (input[lastIndex] === "/" && (TokensPrecedingExpression.test(lastSignificantToken) || KeywordsWithExpressionAfter.test(lastSignificantToken))) {
                RegularExpressionLiteral.lastIndex = lastIndex;
                if (match = RegularExpressionLiteral.exec(input)) {
                  lastIndex = RegularExpressionLiteral.lastIndex;
                  lastSignificantToken = match[0];
                  postfixIncDec = true;
                  yield ({
                    type: "RegularExpressionLiteral",
                    value: match[0],
                    closed: match[1] !== void 0 && match[1] !== "\\"
                  });
                  continue;
                }
              }
              Punctuator.lastIndex = lastIndex;
              if (match = Punctuator.exec(input)) {
                punctuator = match[0];
                nextLastIndex = Punctuator.lastIndex;
                nextLastSignificantToken = punctuator;
                switch (punctuator) {
                  case "(":
                    if (lastSignificantToken === "?NonExpressionParenKeyword") {
                      stack.push({
                        tag: "JSNonExpressionParen",
                        nesting: parenNesting
                      });
                    }
                    parenNesting++;
                    postfixIncDec = false;
                    break;
                  case ")":
                    parenNesting--;
                    postfixIncDec = true;
                    if (mode.tag === "JSNonExpressionParen" && parenNesting === mode.nesting) {
                      stack.pop();
                      nextLastSignificantToken = "?NonExpressionParenEnd";
                      postfixIncDec = false;
                    }
                    break;
                  case "{":
                    Punctuator.lastIndex = 0;
                    isExpression = !TokensNotPrecedingObjectLiteral.test(lastSignificantToken) && (TokensPrecedingExpression.test(lastSignificantToken) || KeywordsWithExpressionAfter.test(lastSignificantToken));
                    braces.push(isExpression);
                    postfixIncDec = false;
                    break;
                  case "}":
                    switch (mode.tag) {
                      case "InterpolationInTemplate":
                        if (braces.length === mode.nesting) {
                          Template.lastIndex = lastIndex;
                          match = Template.exec(input);
                          lastIndex = Template.lastIndex;
                          lastSignificantToken = match[0];
                          if (match[1] === "${") {
                            lastSignificantToken = "?InterpolationInTemplate";
                            postfixIncDec = false;
                            yield ({
                              type: "TemplateMiddle",
                              value: match[0]
                            });
                          } else {
                            stack.pop();
                            postfixIncDec = true;
                            yield ({
                              type: "TemplateTail",
                              value: match[0],
                              closed: match[1] === "`"
                            });
                          }
                          continue;
                        }
                        break;
                      case "InterpolationInJSX":
                        if (braces.length === mode.nesting) {
                          stack.pop();
                          lastIndex += 1;
                          lastSignificantToken = "}";
                          yield ({
                            type: "JSXPunctuator",
                            value: "}"
                          });
                          continue;
                        }
                    }
                    postfixIncDec = braces.pop();
                    nextLastSignificantToken = postfixIncDec ? "?ExpressionBraceEnd" : "}";
                    break;
                  case "]":
                    postfixIncDec = true;
                    break;
                  case "++":
                  case "--":
                    nextLastSignificantToken = postfixIncDec ? "?PostfixIncDec" : "?UnaryIncDec";
                    break;
                  case "<":
                    if (jsx && (TokensPrecedingExpression.test(lastSignificantToken) || KeywordsWithExpressionAfter.test(lastSignificantToken))) {
                      stack.push({
                        tag: "JSXTag"
                      });
                      lastIndex += 1;
                      lastSignificantToken = "<";
                      yield ({
                        type: "JSXPunctuator",
                        value: punctuator
                      });
                      continue;
                    }
                    postfixIncDec = false;
                    break;
                  default:
                    postfixIncDec = false;
                }
                lastIndex = nextLastIndex;
                lastSignificantToken = nextLastSignificantToken;
                yield ({
                  type: "Punctuator",
                  value: punctuator
                });
                continue;
              }
              Identifier.lastIndex = lastIndex;
              if (match = Identifier.exec(input)) {
                lastIndex = Identifier.lastIndex;
                nextLastSignificantToken = match[0];
                switch (match[0]) {
                  case "for":
                  case "if":
                  case "while":
                  case "with":
                    if (lastSignificantToken !== "." && lastSignificantToken !== "?.") {
                      nextLastSignificantToken = "?NonExpressionParenKeyword";
                    }
                }
                lastSignificantToken = nextLastSignificantToken;
                postfixIncDec = !KeywordsWithExpressionAfter.test(match[0]);
                yield ({
                  type: match[1] === "#" ? "PrivateIdentifier" : "IdentifierName",
                  value: match[0]
                });
                continue;
              }
              StringLiteral.lastIndex = lastIndex;
              if (match = StringLiteral.exec(input)) {
                lastIndex = StringLiteral.lastIndex;
                lastSignificantToken = match[0];
                postfixIncDec = true;
                yield ({
                  type: "StringLiteral",
                  value: match[0],
                  closed: match[2] !== void 0
                });
                continue;
              }
              NumericLiteral.lastIndex = lastIndex;
              if (match = NumericLiteral.exec(input)) {
                lastIndex = NumericLiteral.lastIndex;
                lastSignificantToken = match[0];
                postfixIncDec = true;
                yield ({
                  type: "NumericLiteral",
                  value: match[0]
                });
                continue;
              }
              Template.lastIndex = lastIndex;
              if (match = Template.exec(input)) {
                lastIndex = Template.lastIndex;
                lastSignificantToken = match[0];
                if (match[1] === "${") {
                  lastSignificantToken = "?InterpolationInTemplate";
                  stack.push({
                    tag: "InterpolationInTemplate",
                    nesting: braces.length
                  });
                  postfixIncDec = false;
                  yield ({
                    type: "TemplateHead",
                    value: match[0]
                  });
                } else {
                  postfixIncDec = true;
                  yield ({
                    type: "NoSubstitutionTemplate",
                    value: match[0],
                    closed: match[1] === "`"
                  });
                }
                continue;
              }
              break;
            case "JSXTag":
            case "JSXTagEnd":
              JSXPunctuator.lastIndex = lastIndex;
              if (match = JSXPunctuator.exec(input)) {
                lastIndex = JSXPunctuator.lastIndex;
                nextLastSignificantToken = match[0];
                switch (match[0]) {
                  case "<":
                    stack.push({
                      tag: "JSXTag"
                    });
                    break;
                  case ">":
                    stack.pop();
                    if (lastSignificantToken === "/" || mode.tag === "JSXTagEnd") {
                      nextLastSignificantToken = "?JSX";
                      postfixIncDec = true;
                    } else {
                      stack.push({
                        tag: "JSXChildren"
                      });
                    }
                    break;
                  case "{":
                    stack.push({
                      tag: "InterpolationInJSX",
                      nesting: braces.length
                    });
                    nextLastSignificantToken = "?InterpolationInJSX";
                    postfixIncDec = false;
                    break;
                  case "/":
                    if (lastSignificantToken === "<") {
                      stack.pop();
                      if (stack[stack.length - 1].tag === "JSXChildren") {
                        stack.pop();
                      }
                      stack.push({
                        tag: "JSXTagEnd"
                      });
                    }
                }
                lastSignificantToken = nextLastSignificantToken;
                yield ({
                  type: "JSXPunctuator",
                  value: match[0]
                });
                continue;
              }
              JSXIdentifier.lastIndex = lastIndex;
              if (match = JSXIdentifier.exec(input)) {
                lastIndex = JSXIdentifier.lastIndex;
                lastSignificantToken = match[0];
                yield ({
                  type: "JSXIdentifier",
                  value: match[0]
                });
                continue;
              }
              JSXString.lastIndex = lastIndex;
              if (match = JSXString.exec(input)) {
                lastIndex = JSXString.lastIndex;
                lastSignificantToken = match[0];
                yield ({
                  type: "JSXString",
                  value: match[0],
                  closed: match[2] !== void 0
                });
                continue;
              }
              break;
            case "JSXChildren":
              JSXText.lastIndex = lastIndex;
              if (match = JSXText.exec(input)) {
                lastIndex = JSXText.lastIndex;
                lastSignificantToken = match[0];
                yield ({
                  type: "JSXText",
                  value: match[0]
                });
                continue;
              }
              switch (input[lastIndex]) {
                case "<":
                  stack.push({
                    tag: "JSXTag"
                  });
                  lastIndex++;
                  lastSignificantToken = "<";
                  yield ({
                    type: "JSXPunctuator",
                    value: "<"
                  });
                  continue;
                case "{":
                  stack.push({
                    tag: "InterpolationInJSX",
                    nesting: braces.length
                  });
                  lastIndex++;
                  lastSignificantToken = "?InterpolationInJSX";
                  postfixIncDec = false;
                  yield ({
                    type: "JSXPunctuator",
                    value: "{"
                  });
                  continue;
              }
          }
          WhiteSpace.lastIndex = lastIndex;
          if (match = WhiteSpace.exec(input)) {
            lastIndex = WhiteSpace.lastIndex;
            yield ({
              type: "WhiteSpace",
              value: match[0]
            });
            continue;
          }
          LineTerminatorSequence.lastIndex = lastIndex;
          if (match = LineTerminatorSequence.exec(input)) {
            lastIndex = LineTerminatorSequence.lastIndex;
            postfixIncDec = false;
            if (KeywordsWithNoLineTerminatorAfter.test(lastSignificantToken)) {
              lastSignificantToken = "?NoLineTerminatorHere";
            }
            yield ({
              type: "LineTerminatorSequence",
              value: match[0]
            });
            continue;
          }
          MultiLineComment.lastIndex = lastIndex;
          if (match = MultiLineComment.exec(input)) {
            lastIndex = MultiLineComment.lastIndex;
            if (Newline.test(match[0])) {
              postfixIncDec = false;
              if (KeywordsWithNoLineTerminatorAfter.test(lastSignificantToken)) {
                lastSignificantToken = "?NoLineTerminatorHere";
              }
            }
            yield ({
              type: "MultiLineComment",
              value: match[0],
              closed: match[1] !== void 0
            });
            continue;
          }
          SingleLineComment.lastIndex = lastIndex;
          if (match = SingleLineComment.exec(input)) {
            lastIndex = SingleLineComment.lastIndex;
            postfixIncDec = false;
            yield ({
              type: "SingleLineComment",
              value: match[0]
            });
            continue;
          }
          firstCodePoint = String.fromCodePoint(input.codePointAt(lastIndex));
          lastIndex += firstCodePoint.length;
          lastSignificantToken = firstCodePoint;
          postfixIncDec = false;
          yield ({
            type: mode.tag.startsWith("JSX") ? "JSXInvalid" : "Invalid",
            value: firstCodePoint
          });
        }
        return void 0;
      };
      //###    ####    ####    ####    ####    ####    ####    ####    ####    ####    ####    ####    ####
      //###    ####    ####    ####    ####    ####    ####    ####    ####    ####    ####    ####    ####
      //###    ####    ####    ####    ####    ####    ####    ####    ####    ####    ####    ####    ####
      //###    ####    ####    ####    ####    ####    ####    ####    ####    ####    ####    ####    ####
      //###    ####    ####    ####    ####    ####    ####    ####    ####    ####    ####    ####    ####
      //###    ####    ####    ####    ####    ####    ####    ####    ####    ####    ####    ####    ####
      //###    ####    ####    ####    ####    ####    ####    ####    ####    ####    ####    ####    ####
      //###    ####    ####    ####    ####    ####    ####    ####    ####    ####    ####    ####    ####
      //###    ####    ####    ####    ####    ####    ####    ####    ####    ####    ####    ####    ####
      //###    ####    ####    ####    ####    ####    ####    ####    ####    ####    ####    ####    ####
      //###    ####    ####    ####    ####    ####    ####    ####    ####    ####    ####    ####    ####
      //###    ####    ####    ####    ####    ####    ####    ####    ####    ####    ####    ####    ####

      //-------------------------------------------------------------------------------------------------------
      token_categories = (() => {
        var R;
        R = {};
        //.....................................................................................................
        R.nonessentials = new Set([]);
        R.literals = new Set([]);
        //.....................................................................................................
        R.comments = (new Set(['nonessentials'])).union(R.nonessentials);
        R.whitespace = (new Set(['nonessentials'])).union(R.nonessentials);
        R.primitive_literals = (new Set(['literals'])).union(R.literals);
        //.....................................................................................................
        R.string_literals = (new Set(['primitive_literals'])).union(R.primitive_literals);
        //.....................................................................................................
        R.LineTerminatorSequence = (new Set(['whitespace'])).union(R.whitespace);
        R.WhiteSpace = (new Set(['whitespace'])).union(R.whitespace);
        R.HashbangComment = (new Set(['comments'])).union(R.comments);
        R.MultiLineComment = (new Set(['comments'])).union(R.comments);
        R.SingleLineComment = (new Set(['comments'])).union(R.comments);
        R.StringLiteral = (new Set(['string_literals'])).union(R.string_literals);
        R.NoSubstitutionTemplate = (new Set(['string_literals'])).union(R.string_literals);
        R.NumericLiteral = (new Set(['primitive_literals'])).union(R.primitive_literals);
        R.RegularExpressionLiteral = (new Set(['primitive_literals'])).union(R.primitive_literals);
        // TokensNotPrecedingObjectLiteral:  new Set [ 'literals', ] ### ??? ###
        return R;
      })();
      //-------------------------------------------------------------------------------------------------------
      walk_js_tokens = function*(source) {
        var categories, line_nr, ref, token;
        line_nr = 1;
        for (token of jsTokens(source)) {
          if (token.type === 'LineTerminatorSequence') {
            line_nr++;
          }
          categories = (ref = token_categories[token.type]) != null ? ref : new Set();
          yield ({...token, line_nr, categories});
        }
        return null;
      };
      //-------------------------------------------------------------------------------------------------------
      walk_essential_js_tokens = function*(source) {
        var token;
        for (token of walk_js_tokens(source)) {
          if (token.categories.has('nonessentials')) {
            continue;
          }
          yield token;
        }
        return null;
      };
      //-------------------------------------------------------------------------------------------------------
      rpr_token = function(token) {
        return token.type + rpr_string(token.value);
      };
      //-------------------------------------------------------------------------------------------------------
      summarize = function(tokens, joiner = '&&&') {
        var t;
        return joiner + (((function() {
          var results;
          results = [];
          for (t of tokens) {
            results.push(rpr_token(t));
          }
          return results;
        })()).join(joiner)) + joiner;
      };
      //.......................................................................................................
      return exports = {
        walk_js_tokens,
        walk_essential_js_tokens,
        rpr_token,
        summarize,
        internals: {
          token_categories,
          tokens: {HashbangComment, Identifier, JSXIdentifier, JSXPunctuator, JSXString, JSXText, KeywordsWithExpressionAfter, KeywordsWithNoLineTerminatorAfter, LineTerminatorSequence, MultiLineComment, Newline, NumericLiteral, Punctuator, RegularExpressionLiteral, SingleLineComment, StringLiteral, Template, TokensNotPrecedingObjectLiteral, TokensPrecedingExpression, WhiteSpace}
        }
      };
    }
  };

  //===========================================================================================================
  Object.assign(module.exports, BRICS);

}).call(this);

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vc3JjL3dhbGstanMtdG9rZW5zLmJyaWNzLmNvZmZlZSJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFDQTtFQUFBO0FBQUEsTUFBQSxLQUFBLEVBQUEsS0FBQTs7O0VBR0EsQ0FBQSxDQUFFLEtBQUYsQ0FBQSxHQUFhLE9BQWIsRUFIQTs7Ozs7RUFTQSxLQUFBLEdBSUUsQ0FBQTs7O0lBQUEsc0JBQUEsRUFBd0IsUUFBQSxDQUFBLENBQUE7QUFDMUIsVUFBQSxlQUFBLEVBQUEsVUFBQSxFQUFBLGFBQUEsRUFBQSxhQUFBLEVBQUEsU0FBQSxFQUFBLE9BQUEsRUFBQSwyQkFBQSxFQUFBLGlDQUFBLEVBQUEsc0JBQUEsRUFBQSxnQkFBQSxFQUFBLE9BQUEsRUFBQSxjQUFBLEVBQUEsVUFBQSxFQUFBLHdCQUFBLEVBQUEsaUJBQUEsRUFBQSxhQUFBLEVBQUEsUUFBQSxFQUFBLCtCQUFBLEVBQUEseUJBQUEsRUFBQSxVQUFBLEVBQUEsT0FBQSxFQUFBLFFBQUEsRUFBQSxVQUFBLEVBQUEsU0FBQSxFQUFBLFNBQUEsRUFBQSxnQkFBQSxFQUFBLHdCQUFBLEVBQUE7TUFBSSxDQUFBLENBQUUsVUFBRixDQUFBLEdBQWtCLENBQUUsT0FBQSxDQUFRLG9CQUFSLENBQUYsQ0FBZ0MsQ0FBQyxrQkFBakMsQ0FBQSxDQUFsQixFQUFKOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O01BNEJJLHdCQUFBLEdBQTJCO01BdUIzQixVQUFBLEdBQWEseUhBbkRqQjs7TUE4RUksVUFBQSxHQUFhO01BWWIsYUFBQSxHQUFnQjtNQVloQixjQUFBLEdBQWlCO01BOEJqQixRQUFBLEdBQVc7TUFZWCxVQUFBLEdBQWE7TUFJYixzQkFBQSxHQUF5QjtNQU16QixnQkFBQSxHQUFtQjtNQVVuQixpQkFBQSxHQUFvQjtNQUlwQixlQUFBLEdBQWtCO01BSWxCLGFBQUEsR0FBZ0I7TUFNaEIsYUFBQSxHQUFnQjtNQUtoQixTQUFBLEdBQVk7TUFV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OlsiXG4ndXNlIHN0cmljdCdcblxuIz09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09XG57IGRlYnVnLCB9ID0gY29uc29sZVxuXG5cbiMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjI1xuI1xuIz09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09XG5CUklDUyA9XG5cbiAgIz09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PVxuICAjIyMgTk9URSBGdXR1cmUgU2luZ2xlLUZpbGUgTW9kdWxlICMjI1xuICByZXF1aXJlX3dhbGtfanNfdG9rZW5zOiAtPlxuICAgIHsgcnByX3N0cmluZywgfSA9ICggcmVxdWlyZSAnLi9ycHItc3RyaW5nLmJyaWNzJyApLnJlcXVpcmVfcnByX3N0cmluZygpXG5cbiAgICAjPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT1cbiAgICAjIyMjICAgICMjIyMgICAgIyMjIyAgICAjIyMjICAgICMjIyMgICAgIyMjIyAgICAjIyMjICAgICMjIyMgICAgIyMjIyAgICAjIyMjICAgICMjIyMgICAgIyMjIyAgICAjIyMjXG4gICAgIyMjIyAgICAjIyMjICAgICMjIyMgICAgIyMjIyAgICAjIyMjICAgICMjIyMgICAgIyMjIyAgICAjIyMjICAgICMjIyMgICAgIyMjIyAgICAjIyMjICAgICMjIyMgICAgIyMjI1xuICAgICAgICAjIyMjICAgICMjIyMgICAgIyMjIyAgICAjIyMjICAgICMjIyMgICAgIyMjIyAgICAjIyMjICAgICMjIyMgICAgIyMjIyAgICAjIyMjICAgICMjIyMgICAgIyMjIyAgICAjIyMjXG4gICAgICAgICMjIyMgICAgIyMjIyAgICAjIyMjICAgICMjIyMgICAgIyMjIyAgICAjIyMjICAgICMjIyMgICAgIyMjIyAgICAjIyMjICAgICMjIyMgICAgIyMjIyAgICAjIyMjICAgICMjIyNcbiAgICAjIyMjICAgICMjIyMgICAgIyMjIyAgICAjIyMjICAgICMjIyMgICAgIyMjIyAgICAjIyMjICAgICMjIyMgICAgIyMjIyAgICAjIyMjICAgICMjIyMgICAgIyMjIyAgICAjIyMjXG4gICAgIyMjIyAgICAjIyMjICAgICMjIyMgICAgIyMjIyAgICAjIyMjICAgICMjIyMgICAgIyMjIyAgICAjIyMjICAgICMjIyMgICAgIyMjIyAgICAjIyMjICAgICMjIyMgICAgIyMjI1xuICAgICAgICAjIyMjICAgICMjIyMgICAgIyMjIyAgICAjIyMjICAgICMjIyMgICAgIyMjIyAgICAjIyMjICAgICMjIyMgICAgIyMjIyAgICAjIyMjICAgICMjIyMgICAgIyMjIyAgICAjIyMjXG4gICAgICAgICMjIyMgICAgIyMjIyAgICAjIyMjICAgICMjIyMgICAgIyMjIyAgICAjIyMjICAgICMjIyMgICAgIyMjIyAgICAjIyMjICAgICMjIyMgICAgIyMjIyAgICAjIyMjICAgICMjIyNcbiAgICAjIyMjICAgICMjIyMgICAgIyMjIyAgICAjIyMjICAgICMjIyMgICAgIyMjIyAgICAjIyMjICAgICMjIyMgICAgIyMjIyAgICAjIyMjICAgICMjIyMgICAgIyMjIyAgICAjIyMjXG4gICAgIyMjIyAgICAjIyMjICAgICMjIyMgICAgIyMjIyAgICAjIyMjICAgICMjIyMgICAgIyMjIyAgICAjIyMjICAgICMjIyMgICAgIyMjIyAgICAjIyMjICAgICMjIyMgICAgIyMjI1xuICAgICAgICAjIyMjICAgICMjIyMgICAgIyMjIyAgICAjIyMjICAgICMjIyMgICAgIyMjIyAgICAjIyMjICAgICMjIyMgICAgIyMjIyAgICAjIyMjICAgICMjIyMgICAgIyMjIyAgICAjIyMjXG4gICAgICAgICMjIyMgICAgIyMjIyAgICAjIyMjICAgICMjIyMgICAgIyMjIyAgICAjIyMjICAgICMjIyMgICAgIyMjIyAgICAjIyMjICAgICMjIyMgICAgIyMjIyAgICAjIyMjICAgICMjIyNcblxuICAgICMgdGh4IHRvIGh0dHBzOi8vcmF3LmdpdGh1YnVzZXJjb250ZW50LmNvbS9seWRlbGwvanMtdG9rZW5zL2QxNzQzYTEyMTEwM2Y5NzBiOWQyZTgwNzQ2OWNiYTAyZDI0Yjg1MmEvaW5kZXguY29mZmVlXG5cblxuICAgICMgQ29weXJpZ2h0IDIwMTQsIDIwMTUsIDIwMTYsIDIwMTcsIDIwMTgsIDIwMTksIDIwMjAsIDIwMjEsIDIwMjIsIDIwMjMgU2ltb24gTHlkZWxsXG4gICAgIyBMaWNlbnNlOiBNSVQuXG5cbiAgICAjIGh0dHBzOi8vdGMzOS5lcy9lY21hMjYyLyNzZWMtbGV4aWNhbC1ncmFtbWFyXG4gICAgIyBodHRwczovL21hdGhpYXNieW5lbnMuYmUvbm90ZXMvamF2YXNjcmlwdC1pZGVudGlmaWVyc1xuICAgICMgaHR0cHM6Ly9naXRodWIuY29tL3RjMzkvcHJvcG9zYWwtcmVnZXhwLXVuaWNvZGUtcHJvcGVydHktZXNjYXBlcy8jb3RoZXItZXhhbXBsZXNcbiAgICAjIGh0dHBzOi8vdW5pY29kZS5vcmcvcmVwb3J0cy90cjMxLyNCYWNrd2FyZF9Db21wYXRpYmlsaXR5XG4gICAgIyBodHRwczovL3N0YWNrb3ZlcmZsb3cuY29tL2EvMjcxMjAxMTAvMjAxMDYxNlxuXG4gICAgUmVndWxhckV4cHJlc3Npb25MaXRlcmFsID0gLy8vXG4gICAgICAvKD8hWyAqIC8gXSlcbiAgICAgICg/OlxuICAgICAgICBcXFtcbiAgICAgICAgKD86XG4gICAgICAgICAgW14gXFxdIFxcXFwgXFxuIFxcciBcXHUyMDI4IFxcdTIwMjkgXStcbiAgICAgICAgICB8XG4gICAgICAgICAgXFxcXC5cbiAgICAgICAgKSpcbiAgICAgICAgXFxdP1xuICAgICAgICB8XG4gICAgICAgIFteIC8gWyBcXFxcIFxcbiBcXHIgXFx1MjAyOCBcXHUyMDI5IF0rXG4gICAgICAgIHxcbiAgICAgICAgXFxcXC5cbiAgICAgICkqXG4gICAgICAoXG4gICAgICAgIC9cbiAgICAgICAgWyAkIF8gXFx1MjAwQyBcXHUyMDBEIFxccHtJRF9Db250aW51ZX0gXSpcbiAgICAgICAgfFxuICAgICAgICBcXFxcXG4gICAgICApP1xuICAgIC8vL3l1XG5cbiAgICBQdW5jdHVhdG9yID0gLy8vXG4gICAgICAtLSB8IFxcK1xcK1xuICAgICAgfFxuICAgICAgPT5cbiAgICAgIHxcbiAgICAgIFxcLnszfVxuICAgICAgfFxuICAgICAgXFw/P1xcLiAoPyFcXGQpXG4gICAgICB8XG4gICAgICAoPzpcbiAgICAgICAgJiYgfCBcXHxcXHwgfCBcXD9cXD9cbiAgICAgICAgfFxuICAgICAgICBbICsgXFwtICUgJiB8IF4gXVxuICAgICAgICB8XG4gICAgICAgIFxcKnsxLDJ9XG4gICAgICAgIHxcbiAgICAgICAgPHsxLDJ9IHwgPnsxLDN9XG4gICAgICAgIHxcbiAgICAgICAgIT0/IHwgPXsxLDJ9XG4gICAgICAgIHxcbiAgICAgICAgLyg/IVsgLyAqIF0pXG4gICAgICApPT9cbiAgICAgIHxcbiAgICAgIFsgPyB+ICwgOiA7IFsgXFxdICggKSB7IH0gXVxuICAgIC8vL3lcblxuICAgICMgTm90ZTogYFxceDIzYCBpcyBgI2AuIFRoZSBlc2NhcGUgaXMgdXNlZCBzaW5jZSBWU0NvZGXigJlzIHN5bnRheCBoaWdobGlnaHRpbmcgYnJlYWtzIG90aGVyd2lzZS5cbiAgICBJZGVudGlmaWVyID0gLy8vXG4gICAgICAoXFx4MjM/KVxuICAgICAgKD89WyAkIF8gXFxwe0lEX1N0YXJ0fSBcXFxcIF0pXG4gICAgICAoPzpcbiAgICAgICAgWyAkIF8gXFx1MjAwQyBcXHUyMDBEIFxccHtJRF9Db250aW51ZX0gXStcbiAgICAgICAgfFxuICAgICAgICBcXFxcdVsgXFxkIGEtZiBBLUYgXXs0fVxuICAgICAgICB8XG4gICAgICAgIFxcXFx1XFx7WyBcXGQgYS1mIEEtRiBdK1xcfVxuICAgICAgKStcbiAgICAvLy95dVxuXG4gICAgU3RyaW5nTGl0ZXJhbCA9IC8vL1xuICAgICAgKFsgJyBcIiBdKVxuICAgICAgKD86XG4gICAgICAgIFteICcgXCIgXFxcXCBcXG4gXFxyIF0rXG4gICAgICAgIHxcbiAgICAgICAgKD8hIFxcMSApWyAnIFwiIF1cbiAgICAgICAgfFxuICAgICAgICBcXFxcKD86IFxcclxcbiB8IFteXSApXG4gICAgICApKlxuICAgICAgKFxcMSk/XG4gICAgLy8veVxuXG4gICAgTnVtZXJpY0xpdGVyYWwgPSAvLy9cbiAgICAgICg/OlxuICAgICAgICAwW3hYXVsgXFxkIGEtZiBBLUYgXSAoPzogXz8gWyBcXGQgYS1mIEEtRiBdICkqXG4gICAgICAgIHxcbiAgICAgICAgMFtvT11bMC03XSAoPzogXz8gWzAtN10gKSpcbiAgICAgICAgfFxuICAgICAgICAwW2JCXVswMV0gKD86IF8/IFswMV0gKSpcbiAgICAgICluP1xuICAgICAgfFxuICAgICAgMG5cbiAgICAgIHxcbiAgICAgIFsxLTldKD86IF8/IFxcZCApKm5cbiAgICAgIHxcbiAgICAgICg/OlxuICAgICAgICAoPzpcbiAgICAgICAgICAwKD8hXFxkKVxuICAgICAgICAgIHxcbiAgICAgICAgICAwXFxkKls4OV1cXGQqXG4gICAgICAgICAgfFxuICAgICAgICAgIFsxLTldKD86IF8/IFxcZCApKlxuICAgICAgICApXG4gICAgICAgICg/OiBcXC4oPzogXFxkICg/OiBfPyBcXGQgKSogKT8gKT9cbiAgICAgICAgfFxuICAgICAgICBcXC5cXGQgKD86IF8/IFxcZCApKlxuICAgICAgKVxuICAgICAgKD86IFtlRV1bKy1dP1xcZCAoPzogXz8gXFxkICkqICk/XG4gICAgICB8XG4gICAgICAwWzAtN10rXG4gICAgLy8veVxuXG4gICAgVGVtcGxhdGUgPSAvLy9cbiAgICAgIFsgYCB9IF1cbiAgICAgICg/OlxuICAgICAgICBbXiBgIFxcXFwgJCBdK1xuICAgICAgICB8XG4gICAgICAgIFxcXFxbXl1cbiAgICAgICAgfFxuICAgICAgICBcXCQoPyFcXHspXG4gICAgICApKlxuICAgICAgKCBgIHwgXFwkXFx7ICk/XG4gICAgLy8veVxuXG4gICAgV2hpdGVTcGFjZSA9IC8vL1xuICAgICAgWyBcXHQgXFx2IFxcZiBcXHVmZWZmIFxccHtac30gXStcbiAgICAvLy95dVxuXG4gICAgTGluZVRlcm1pbmF0b3JTZXF1ZW5jZSA9IC8vL1xuICAgICAgXFxyP1xcblxuICAgICAgfFxuICAgICAgWyBcXHIgXFx1MjAyOCBcXHUyMDI5IF1cbiAgICAvLy95XG5cbiAgICBNdWx0aUxpbmVDb21tZW50ID0gLy8vXG4gICAgICAvXFwqXG4gICAgICAoPzpcbiAgICAgICAgW14qXStcbiAgICAgICAgfFxuICAgICAgICBcXCooPyEvKVxuICAgICAgKSpcbiAgICAgIChcXCovKT9cbiAgICAvLy95XG5cbiAgICBTaW5nbGVMaW5lQ29tbWVudCA9IC8vL1xuICAgICAgLy8uKlxuICAgIC8vL3lcblxuICAgIEhhc2hiYW5nQ29tbWVudCA9IC8vL1xuICAgICAgXiMhLipcbiAgICAvLy9cblxuICAgIEpTWFB1bmN0dWF0b3IgPSAvLy9cbiAgICAgIFsgPCA+IC4gOiA9IHsgfSBdXG4gICAgICB8XG4gICAgICAvKD8hWyAvICogXSlcbiAgICAvLy95XG5cbiAgICBKU1hJZGVudGlmaWVyID0gLy8vXG4gICAgICBbICQgXyBcXHB7SURfU3RhcnR9IF1cbiAgICAgIFsgJCBfIFxcdTIwMEMgXFx1MjAwRCBcXHB7SURfQ29udGludWV9IC0gXSpcbiAgICAvLy95dVxuXG4gICAgSlNYU3RyaW5nID0gLy8vXG4gICAgICAoWyAnIFwiIF0pXG4gICAgICAoPzpcbiAgICAgICAgW14gJyBcIl0rXG4gICAgICAgIHxcbiAgICAgICAgKD8hIFxcMSApWyAnIFwiIF1cbiAgICAgICkqXG4gICAgICAoXFwxKT9cbiAgICAvLy95XG5cbiAgICBKU1hUZXh0ID0gLy8vXG4gICAgICBbXiA8ID4geyB9IF0rXG4gICAgLy8veVxuXG4gICAgVG9rZW5zUHJlY2VkaW5nRXhwcmVzc2lvbiA9IC8vL1xuICAgICAgXig/OlxuICAgICAgICBbLystXVxuICAgICAgICB8XG4gICAgICAgIFxcLnszfVxuICAgICAgICB8XG4gICAgICAgIFxcPyg/OkludGVycG9sYXRpb25Jbig/OkpTWHxUZW1wbGF0ZSl8Tm9MaW5lVGVybWluYXRvckhlcmV8Tm9uRXhwcmVzc2lvblBhcmVuRW5kfFVuYXJ5SW5jRGVjKVxuICAgICAgKT8kXG4gICAgICB8XG4gICAgICBbIHsgfSAoIFsgLCA7IDwgPiA9ICogJSAmIHwgXiAhIH4gPyA6IF0kXG4gICAgLy8vXG5cbiAgICBUb2tlbnNOb3RQcmVjZWRpbmdPYmplY3RMaXRlcmFsID0gLy8vXG4gICAgICBeKD86XG4gICAgICAgID0+XG4gICAgICAgIHxcbiAgICAgICAgWyA7IFxcXSApIHsgfSBdXG4gICAgICAgIHxcbiAgICAgICAgZWxzZVxuICAgICAgICB8XG4gICAgICAgIFxcPyg/Ok5vTGluZVRlcm1pbmF0b3JIZXJlfE5vbkV4cHJlc3Npb25QYXJlbkVuZClcbiAgICAgICk/JFxuICAgIC8vL1xuXG4gICAgS2V5d29yZHNXaXRoRXhwcmVzc2lvbkFmdGVyID0gLy8vXG4gICAgICBeKD86YXdhaXR8Y2FzZXxkZWZhdWx0fGRlbGV0ZXxkb3xlbHNlfGluc3RhbmNlb2Z8bmV3fHJldHVybnx0aHJvd3x0eXBlb2Z8dm9pZHx5aWVsZCkkXG4gICAgLy8vXG5cbiAgICBLZXl3b3Jkc1dpdGhOb0xpbmVUZXJtaW5hdG9yQWZ0ZXIgPSAvLy9cbiAgICAgIF4oPzpyZXR1cm58dGhyb3d8eWllbGQpJFxuICAgIC8vL1xuXG4gICAgTmV3bGluZSA9IFJlZ0V4cChMaW5lVGVybWluYXRvclNlcXVlbmNlLnNvdXJjZSlcblxuICAgIG1vZHVsZS5leHBvcnRzID0ganNUb2tlbnMgPSAoaW5wdXQsIHtqc3ggPSBmYWxzZX0gPSB7fSkgLT5cbiAgICAgIHtsZW5ndGh9ID0gaW5wdXRcbiAgICAgIGxhc3RJbmRleCA9IDBcbiAgICAgIGxhc3RTaWduaWZpY2FudFRva2VuID0gXCJcIlxuICAgICAgc3RhY2sgPSBbe3RhZzogXCJKU1wifV1cbiAgICAgIGJyYWNlcyA9IFtdXG4gICAgICBwYXJlbk5lc3RpbmcgPSAwXG4gICAgICBwb3N0Zml4SW5jRGVjID0gZmFsc2VcblxuICAgICAgaWYgbWF0Y2ggPSBIYXNoYmFuZ0NvbW1lbnQuZXhlYyhpbnB1dClcbiAgICAgICAgeWllbGQge1xuICAgICAgICAgIHR5cGU6IFwiSGFzaGJhbmdDb21tZW50XCIsXG4gICAgICAgICAgdmFsdWU6IG1hdGNoWzBdLFxuICAgICAgICB9XG4gICAgICAgIGxhc3RJbmRleCA9IG1hdGNoWzBdLmxlbmd0aFxuXG4gICAgICB3aGlsZSBsYXN0SW5kZXggPCBsZW5ndGhcbiAgICAgICAgbW9kZSA9IHN0YWNrW3N0YWNrLmxlbmd0aCAtIDFdXG5cbiAgICAgICAgc3dpdGNoIG1vZGUudGFnXG4gICAgICAgICAgd2hlbiBcIkpTXCIsIFwiSlNOb25FeHByZXNzaW9uUGFyZW5cIiwgXCJJbnRlcnBvbGF0aW9uSW5UZW1wbGF0ZVwiLCBcIkludGVycG9sYXRpb25JbkpTWFwiXG4gICAgICAgICAgICBpZiBpbnB1dFtsYXN0SW5kZXhdID09IFwiL1wiICYmIChcbiAgICAgICAgICAgICAgVG9rZW5zUHJlY2VkaW5nRXhwcmVzc2lvbi50ZXN0KGxhc3RTaWduaWZpY2FudFRva2VuKSB8fFxuICAgICAgICAgICAgICBLZXl3b3Jkc1dpdGhFeHByZXNzaW9uQWZ0ZXIudGVzdChsYXN0U2lnbmlmaWNhbnRUb2tlbilcbiAgICAgICAgICAgIClcbiAgICAgICAgICAgICAgUmVndWxhckV4cHJlc3Npb25MaXRlcmFsLmxhc3RJbmRleCA9IGxhc3RJbmRleFxuICAgICAgICAgICAgICBpZiBtYXRjaCA9IFJlZ3VsYXJFeHByZXNzaW9uTGl0ZXJhbC5leGVjKGlucHV0KVxuICAgICAgICAgICAgICAgIGxhc3RJbmRleCA9IFJlZ3VsYXJFeHByZXNzaW9uTGl0ZXJhbC5sYXN0SW5kZXhcbiAgICAgICAgICAgICAgICBsYXN0U2lnbmlmaWNhbnRUb2tlbiA9IG1hdGNoWzBdXG4gICAgICAgICAgICAgICAgcG9zdGZpeEluY0RlYyA9IHRydWVcbiAgICAgICAgICAgICAgICB5aWVsZCB7XG4gICAgICAgICAgICAgICAgICB0eXBlOiBcIlJlZ3VsYXJFeHByZXNzaW9uTGl0ZXJhbFwiLFxuICAgICAgICAgICAgICAgICAgdmFsdWU6IG1hdGNoWzBdLFxuICAgICAgICAgICAgICAgICAgY2xvc2VkOiBtYXRjaFsxXSAhPSB1bmRlZmluZWQgJiYgbWF0Y2hbMV0gIT0gXCJcXFxcXCIsXG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGNvbnRpbnVlXG5cbiAgICAgICAgICAgIFB1bmN0dWF0b3IubGFzdEluZGV4ID0gbGFzdEluZGV4XG4gICAgICAgICAgICBpZiBtYXRjaCA9IFB1bmN0dWF0b3IuZXhlYyhpbnB1dClcbiAgICAgICAgICAgICAgcHVuY3R1YXRvciA9IG1hdGNoWzBdXG4gICAgICAgICAgICAgIG5leHRMYXN0SW5kZXggPSBQdW5jdHVhdG9yLmxhc3RJbmRleFxuICAgICAgICAgICAgICBuZXh0TGFzdFNpZ25pZmljYW50VG9rZW4gPSBwdW5jdHVhdG9yXG5cbiAgICAgICAgICAgICAgc3dpdGNoIHB1bmN0dWF0b3JcbiAgICAgICAgICAgICAgICB3aGVuIFwiKFwiXG4gICAgICAgICAgICAgICAgICBpZiBsYXN0U2lnbmlmaWNhbnRUb2tlbiA9PSBcIj9Ob25FeHByZXNzaW9uUGFyZW5LZXl3b3JkXCJcbiAgICAgICAgICAgICAgICAgICAgc3RhY2sucHVzaCh7dGFnOiBcIkpTTm9uRXhwcmVzc2lvblBhcmVuXCIsIG5lc3Rpbmc6IHBhcmVuTmVzdGluZ30pXG4gICAgICAgICAgICAgICAgICBwYXJlbk5lc3RpbmcrK1xuICAgICAgICAgICAgICAgICAgcG9zdGZpeEluY0RlYyA9IGZhbHNlXG5cbiAgICAgICAgICAgICAgICB3aGVuIFwiKVwiXG4gICAgICAgICAgICAgICAgICBwYXJlbk5lc3RpbmctLVxuICAgICAgICAgICAgICAgICAgcG9zdGZpeEluY0RlYyA9IHRydWVcbiAgICAgICAgICAgICAgICAgIGlmIG1vZGUudGFnID09IFwiSlNOb25FeHByZXNzaW9uUGFyZW5cIiAmJiBwYXJlbk5lc3RpbmcgPT0gbW9kZS5uZXN0aW5nXG4gICAgICAgICAgICAgICAgICAgIHN0YWNrLnBvcCgpXG4gICAgICAgICAgICAgICAgICAgIG5leHRMYXN0U2lnbmlmaWNhbnRUb2tlbiA9IFwiP05vbkV4cHJlc3Npb25QYXJlbkVuZFwiXG4gICAgICAgICAgICAgICAgICAgIHBvc3RmaXhJbmNEZWMgPSBmYWxzZVxuXG4gICAgICAgICAgICAgICAgd2hlbiBcIntcIlxuICAgICAgICAgICAgICAgICAgUHVuY3R1YXRvci5sYXN0SW5kZXggPSAwXG4gICAgICAgICAgICAgICAgICBpc0V4cHJlc3Npb24gPVxuICAgICAgICAgICAgICAgICAgICAhVG9rZW5zTm90UHJlY2VkaW5nT2JqZWN0TGl0ZXJhbC50ZXN0KGxhc3RTaWduaWZpY2FudFRva2VuKSAmJiAoXG4gICAgICAgICAgICAgICAgICAgICAgVG9rZW5zUHJlY2VkaW5nRXhwcmVzc2lvbi50ZXN0KGxhc3RTaWduaWZpY2FudFRva2VuKSB8fFxuICAgICAgICAgICAgICAgICAgICAgIEtleXdvcmRzV2l0aEV4cHJlc3Npb25BZnRlci50ZXN0KGxhc3RTaWduaWZpY2FudFRva2VuKVxuICAgICAgICAgICAgICAgICAgICApXG4gICAgICAgICAgICAgICAgICBicmFjZXMucHVzaChpc0V4cHJlc3Npb24pXG4gICAgICAgICAgICAgICAgICBwb3N0Zml4SW5jRGVjID0gZmFsc2VcblxuICAgICAgICAgICAgICAgIHdoZW4gXCJ9XCJcbiAgICAgICAgICAgICAgICAgIHN3aXRjaCBtb2RlLnRhZ1xuICAgICAgICAgICAgICAgICAgICB3aGVuIFwiSW50ZXJwb2xhdGlvbkluVGVtcGxhdGVcIlxuICAgICAgICAgICAgICAgICAgICAgIGlmIGJyYWNlcy5sZW5ndGggPT0gbW9kZS5uZXN0aW5nXG4gICAgICAgICAgICAgICAgICAgICAgICBUZW1wbGF0ZS5sYXN0SW5kZXggPSBsYXN0SW5kZXhcbiAgICAgICAgICAgICAgICAgICAgICAgIG1hdGNoID0gVGVtcGxhdGUuZXhlYyhpbnB1dClcbiAgICAgICAgICAgICAgICAgICAgICAgIGxhc3RJbmRleCA9IFRlbXBsYXRlLmxhc3RJbmRleFxuICAgICAgICAgICAgICAgICAgICAgICAgbGFzdFNpZ25pZmljYW50VG9rZW4gPSBtYXRjaFswXVxuICAgICAgICAgICAgICAgICAgICAgICAgaWYgbWF0Y2hbMV0gPT0gXCIke1wiXG4gICAgICAgICAgICAgICAgICAgICAgICAgIGxhc3RTaWduaWZpY2FudFRva2VuID0gXCI/SW50ZXJwb2xhdGlvbkluVGVtcGxhdGVcIlxuICAgICAgICAgICAgICAgICAgICAgICAgICBwb3N0Zml4SW5jRGVjID0gZmFsc2VcbiAgICAgICAgICAgICAgICAgICAgICAgICAgeWllbGQge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHR5cGU6IFwiVGVtcGxhdGVNaWRkbGVcIixcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB2YWx1ZTogbWF0Y2hbMF0sXG4gICAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgIGVsc2VcbiAgICAgICAgICAgICAgICAgICAgICAgICAgc3RhY2sucG9wKClcbiAgICAgICAgICAgICAgICAgICAgICAgICAgcG9zdGZpeEluY0RlYyA9IHRydWVcbiAgICAgICAgICAgICAgICAgICAgICAgICAgeWllbGQge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHR5cGU6IFwiVGVtcGxhdGVUYWlsXCIsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdmFsdWU6IG1hdGNoWzBdLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNsb3NlZDogbWF0Y2hbMV0gPT0gXCJgXCIsXG4gICAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgIGNvbnRpbnVlXG4gICAgICAgICAgICAgICAgICAgIHdoZW4gXCJJbnRlcnBvbGF0aW9uSW5KU1hcIlxuICAgICAgICAgICAgICAgICAgICAgIGlmIGJyYWNlcy5sZW5ndGggPT0gbW9kZS5uZXN0aW5nXG4gICAgICAgICAgICAgICAgICAgICAgICBzdGFjay5wb3AoKVxuICAgICAgICAgICAgICAgICAgICAgICAgbGFzdEluZGV4ICs9IDFcbiAgICAgICAgICAgICAgICAgICAgICAgIGxhc3RTaWduaWZpY2FudFRva2VuID0gXCJ9XCJcbiAgICAgICAgICAgICAgICAgICAgICAgIHlpZWxkIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgdHlwZTogXCJKU1hQdW5jdHVhdG9yXCIsXG4gICAgICAgICAgICAgICAgICAgICAgICAgIHZhbHVlOiBcIn1cIlxuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgY29udGludWVcbiAgICAgICAgICAgICAgICAgIHBvc3RmaXhJbmNEZWMgPSBicmFjZXMucG9wKClcbiAgICAgICAgICAgICAgICAgIG5leHRMYXN0U2lnbmlmaWNhbnRUb2tlbiA9XG4gICAgICAgICAgICAgICAgICAgIGlmIHBvc3RmaXhJbmNEZWMgdGhlbiBcIj9FeHByZXNzaW9uQnJhY2VFbmRcIiBlbHNlIFwifVwiXG5cbiAgICAgICAgICAgICAgICB3aGVuIFwiXVwiXG4gICAgICAgICAgICAgICAgICBwb3N0Zml4SW5jRGVjID0gdHJ1ZVxuXG4gICAgICAgICAgICAgICAgd2hlbiBcIisrXCIsIFwiLS1cIlxuICAgICAgICAgICAgICAgICAgbmV4dExhc3RTaWduaWZpY2FudFRva2VuID1cbiAgICAgICAgICAgICAgICAgICAgaWYgcG9zdGZpeEluY0RlYyB0aGVuIFwiP1Bvc3RmaXhJbmNEZWNcIiBlbHNlIFwiP1VuYXJ5SW5jRGVjXCJcblxuICAgICAgICAgICAgICAgIHdoZW4gXCI8XCJcbiAgICAgICAgICAgICAgICAgIGlmIGpzeCAmJiAoXG4gICAgICAgICAgICAgICAgICAgIFRva2Vuc1ByZWNlZGluZ0V4cHJlc3Npb24udGVzdChsYXN0U2lnbmlmaWNhbnRUb2tlbikgfHxcbiAgICAgICAgICAgICAgICAgICAgS2V5d29yZHNXaXRoRXhwcmVzc2lvbkFmdGVyLnRlc3QobGFzdFNpZ25pZmljYW50VG9rZW4pXG4gICAgICAgICAgICAgICAgICApXG4gICAgICAgICAgICAgICAgICAgIHN0YWNrLnB1c2goe3RhZzogXCJKU1hUYWdcIn0pXG4gICAgICAgICAgICAgICAgICAgIGxhc3RJbmRleCArPSAxXG4gICAgICAgICAgICAgICAgICAgIGxhc3RTaWduaWZpY2FudFRva2VuID0gXCI8XCJcbiAgICAgICAgICAgICAgICAgICAgeWllbGQge1xuICAgICAgICAgICAgICAgICAgICAgIHR5cGU6IFwiSlNYUHVuY3R1YXRvclwiLFxuICAgICAgICAgICAgICAgICAgICAgIHZhbHVlOiBwdW5jdHVhdG9yLFxuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIGNvbnRpbnVlXG4gICAgICAgICAgICAgICAgICBwb3N0Zml4SW5jRGVjID0gZmFsc2VcblxuICAgICAgICAgICAgICAgIGVsc2VcbiAgICAgICAgICAgICAgICAgIHBvc3RmaXhJbmNEZWMgPSBmYWxzZVxuXG4gICAgICAgICAgICAgIGxhc3RJbmRleCA9IG5leHRMYXN0SW5kZXhcbiAgICAgICAgICAgICAgbGFzdFNpZ25pZmljYW50VG9rZW4gPSBuZXh0TGFzdFNpZ25pZmljYW50VG9rZW5cbiAgICAgICAgICAgICAgeWllbGQge1xuICAgICAgICAgICAgICAgIHR5cGU6IFwiUHVuY3R1YXRvclwiLFxuICAgICAgICAgICAgICAgIHZhbHVlOiBwdW5jdHVhdG9yLFxuICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgIGNvbnRpbnVlXG5cbiAgICAgICAgICAgIElkZW50aWZpZXIubGFzdEluZGV4ID0gbGFzdEluZGV4XG4gICAgICAgICAgICBpZiBtYXRjaCA9IElkZW50aWZpZXIuZXhlYyhpbnB1dClcbiAgICAgICAgICAgICAgbGFzdEluZGV4ID0gSWRlbnRpZmllci5sYXN0SW5kZXhcbiAgICAgICAgICAgICAgbmV4dExhc3RTaWduaWZpY2FudFRva2VuID0gbWF0Y2hbMF1cbiAgICAgICAgICAgICAgc3dpdGNoIG1hdGNoWzBdXG4gICAgICAgICAgICAgICAgd2hlbiBcImZvclwiLCBcImlmXCIsIFwid2hpbGVcIiwgXCJ3aXRoXCJcbiAgICAgICAgICAgICAgICAgIGlmIGxhc3RTaWduaWZpY2FudFRva2VuICE9IFwiLlwiICYmIGxhc3RTaWduaWZpY2FudFRva2VuICE9IFwiPy5cIlxuICAgICAgICAgICAgICAgICAgICBuZXh0TGFzdFNpZ25pZmljYW50VG9rZW4gPSBcIj9Ob25FeHByZXNzaW9uUGFyZW5LZXl3b3JkXCJcbiAgICAgICAgICAgICAgbGFzdFNpZ25pZmljYW50VG9rZW4gPSBuZXh0TGFzdFNpZ25pZmljYW50VG9rZW5cbiAgICAgICAgICAgICAgcG9zdGZpeEluY0RlYyA9ICFLZXl3b3Jkc1dpdGhFeHByZXNzaW9uQWZ0ZXIudGVzdChtYXRjaFswXSlcbiAgICAgICAgICAgICAgeWllbGQge1xuICAgICAgICAgICAgICAgIHR5cGU6IGlmIG1hdGNoWzFdID09IFwiI1wiIHRoZW4gXCJQcml2YXRlSWRlbnRpZmllclwiIGVsc2UgXCJJZGVudGlmaWVyTmFtZVwiLFxuICAgICAgICAgICAgICAgIHZhbHVlOiBtYXRjaFswXSxcbiAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICBjb250aW51ZVxuXG4gICAgICAgICAgICBTdHJpbmdMaXRlcmFsLmxhc3RJbmRleCA9IGxhc3RJbmRleFxuICAgICAgICAgICAgaWYgbWF0Y2ggPSBTdHJpbmdMaXRlcmFsLmV4ZWMoaW5wdXQpXG4gICAgICAgICAgICAgIGxhc3RJbmRleCA9IFN0cmluZ0xpdGVyYWwubGFzdEluZGV4XG4gICAgICAgICAgICAgIGxhc3RTaWduaWZpY2FudFRva2VuID0gbWF0Y2hbMF1cbiAgICAgICAgICAgICAgcG9zdGZpeEluY0RlYyA9IHRydWVcbiAgICAgICAgICAgICAgeWllbGQge1xuICAgICAgICAgICAgICAgIHR5cGU6IFwiU3RyaW5nTGl0ZXJhbFwiLFxuICAgICAgICAgICAgICAgIHZhbHVlOiBtYXRjaFswXSxcbiAgICAgICAgICAgICAgICBjbG9zZWQ6IG1hdGNoWzJdICE9IHVuZGVmaW5lZCxcbiAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICBjb250aW51ZVxuXG4gICAgICAgICAgICBOdW1lcmljTGl0ZXJhbC5sYXN0SW5kZXggPSBsYXN0SW5kZXhcbiAgICAgICAgICAgIGlmIG1hdGNoID0gTnVtZXJpY0xpdGVyYWwuZXhlYyhpbnB1dClcbiAgICAgICAgICAgICAgbGFzdEluZGV4ID0gTnVtZXJpY0xpdGVyYWwubGFzdEluZGV4XG4gICAgICAgICAgICAgIGxhc3RTaWduaWZpY2FudFRva2VuID0gbWF0Y2hbMF1cbiAgICAgICAgICAgICAgcG9zdGZpeEluY0RlYyA9IHRydWVcbiAgICAgICAgICAgICAgeWllbGQge1xuICAgICAgICAgICAgICAgIHR5cGU6IFwiTnVtZXJpY0xpdGVyYWxcIixcbiAgICAgICAgICAgICAgICB2YWx1ZTogbWF0Y2hbMF0sXG4gICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgY29udGludWVcblxuICAgICAgICAgICAgVGVtcGxhdGUubGFzdEluZGV4ID0gbGFzdEluZGV4XG4gICAgICAgICAgICBpZiBtYXRjaCA9IFRlbXBsYXRlLmV4ZWMoaW5wdXQpXG4gICAgICAgICAgICAgIGxhc3RJbmRleCA9IFRlbXBsYXRlLmxhc3RJbmRleFxuICAgICAgICAgICAgICBsYXN0U2lnbmlmaWNhbnRUb2tlbiA9IG1hdGNoWzBdXG4gICAgICAgICAgICAgIGlmIG1hdGNoWzFdID09IFwiJHtcIlxuICAgICAgICAgICAgICAgIGxhc3RTaWduaWZpY2FudFRva2VuID0gXCI/SW50ZXJwb2xhdGlvbkluVGVtcGxhdGVcIlxuICAgICAgICAgICAgICAgIHN0YWNrLnB1c2goe3RhZzogXCJJbnRlcnBvbGF0aW9uSW5UZW1wbGF0ZVwiLCBuZXN0aW5nOiBicmFjZXMubGVuZ3RofSlcbiAgICAgICAgICAgICAgICBwb3N0Zml4SW5jRGVjID0gZmFsc2VcbiAgICAgICAgICAgICAgICB5aWVsZCB7XG4gICAgICAgICAgICAgICAgICB0eXBlOiBcIlRlbXBsYXRlSGVhZFwiLFxuICAgICAgICAgICAgICAgICAgdmFsdWU6IG1hdGNoWzBdLFxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgZWxzZVxuICAgICAgICAgICAgICAgIHBvc3RmaXhJbmNEZWMgPSB0cnVlXG4gICAgICAgICAgICAgICAgeWllbGQge1xuICAgICAgICAgICAgICAgICAgdHlwZTogXCJOb1N1YnN0aXR1dGlvblRlbXBsYXRlXCIsXG4gICAgICAgICAgICAgICAgICB2YWx1ZTogbWF0Y2hbMF0sXG4gICAgICAgICAgICAgICAgICBjbG9zZWQ6IG1hdGNoWzFdID09IFwiYFwiLFxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgY29udGludWVcblxuICAgICAgICAgIHdoZW4gXCJKU1hUYWdcIiwgXCJKU1hUYWdFbmRcIlxuICAgICAgICAgICAgSlNYUHVuY3R1YXRvci5sYXN0SW5kZXggPSBsYXN0SW5kZXhcbiAgICAgICAgICAgIGlmIG1hdGNoID0gSlNYUHVuY3R1YXRvci5leGVjKGlucHV0KVxuICAgICAgICAgICAgICBsYXN0SW5kZXggPSBKU1hQdW5jdHVhdG9yLmxhc3RJbmRleFxuICAgICAgICAgICAgICBuZXh0TGFzdFNpZ25pZmljYW50VG9rZW4gPSBtYXRjaFswXVxuICAgICAgICAgICAgICBzd2l0Y2ggbWF0Y2hbMF1cbiAgICAgICAgICAgICAgICB3aGVuIFwiPFwiXG4gICAgICAgICAgICAgICAgICBzdGFjay5wdXNoKHt0YWc6IFwiSlNYVGFnXCJ9KVxuICAgICAgICAgICAgICAgIHdoZW4gXCI+XCJcbiAgICAgICAgICAgICAgICAgIHN0YWNrLnBvcCgpXG4gICAgICAgICAgICAgICAgICBpZiBsYXN0U2lnbmlmaWNhbnRUb2tlbiA9PSBcIi9cIiB8fCBtb2RlLnRhZyA9PSBcIkpTWFRhZ0VuZFwiXG4gICAgICAgICAgICAgICAgICAgIG5leHRMYXN0U2lnbmlmaWNhbnRUb2tlbiA9IFwiP0pTWFwiXG4gICAgICAgICAgICAgICAgICAgIHBvc3RmaXhJbmNEZWMgPSB0cnVlXG4gICAgICAgICAgICAgICAgICBlbHNlXG4gICAgICAgICAgICAgICAgICAgIHN0YWNrLnB1c2goe3RhZzogXCJKU1hDaGlsZHJlblwifSlcbiAgICAgICAgICAgICAgICB3aGVuIFwie1wiXG4gICAgICAgICAgICAgICAgICBzdGFjay5wdXNoKHt0YWc6IFwiSW50ZXJwb2xhdGlvbkluSlNYXCIsIG5lc3Rpbmc6IGJyYWNlcy5sZW5ndGh9KVxuICAgICAgICAgICAgICAgICAgbmV4dExhc3RTaWduaWZpY2FudFRva2VuID0gXCI/SW50ZXJwb2xhdGlvbkluSlNYXCJcbiAgICAgICAgICAgICAgICAgIHBvc3RmaXhJbmNEZWMgPSBmYWxzZVxuICAgICAgICAgICAgICAgIHdoZW4gXCIvXCJcbiAgICAgICAgICAgICAgICAgIGlmIGxhc3RTaWduaWZpY2FudFRva2VuID09IFwiPFwiXG4gICAgICAgICAgICAgICAgICAgIHN0YWNrLnBvcCgpXG4gICAgICAgICAgICAgICAgICAgIGlmIHN0YWNrW3N0YWNrLmxlbmd0aCAtIDFdLnRhZyA9PSBcIkpTWENoaWxkcmVuXCJcbiAgICAgICAgICAgICAgICAgICAgICBzdGFjay5wb3AoKVxuICAgICAgICAgICAgICAgICAgICBzdGFjay5wdXNoKHt0YWc6IFwiSlNYVGFnRW5kXCJ9KVxuICAgICAgICAgICAgICBsYXN0U2lnbmlmaWNhbnRUb2tlbiA9IG5leHRMYXN0U2lnbmlmaWNhbnRUb2tlblxuICAgICAgICAgICAgICB5aWVsZCB7XG4gICAgICAgICAgICAgICAgdHlwZTogXCJKU1hQdW5jdHVhdG9yXCIsXG4gICAgICAgICAgICAgICAgdmFsdWU6IG1hdGNoWzBdLFxuICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgIGNvbnRpbnVlXG5cbiAgICAgICAgICAgIEpTWElkZW50aWZpZXIubGFzdEluZGV4ID0gbGFzdEluZGV4XG4gICAgICAgICAgICBpZiBtYXRjaCA9IEpTWElkZW50aWZpZXIuZXhlYyhpbnB1dClcbiAgICAgICAgICAgICAgbGFzdEluZGV4ID0gSlNYSWRlbnRpZmllci5sYXN0SW5kZXhcbiAgICAgICAgICAgICAgbGFzdFNpZ25pZmljYW50VG9rZW4gPSBtYXRjaFswXVxuICAgICAgICAgICAgICB5aWVsZCB7XG4gICAgICAgICAgICAgICAgdHlwZTogXCJKU1hJZGVudGlmaWVyXCIsXG4gICAgICAgICAgICAgICAgdmFsdWU6IG1hdGNoWzBdLFxuICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgIGNvbnRpbnVlXG5cbiAgICAgICAgICAgIEpTWFN0cmluZy5sYXN0SW5kZXggPSBsYXN0SW5kZXhcbiAgICAgICAgICAgIGlmIG1hdGNoID0gSlNYU3RyaW5nLmV4ZWMoaW5wdXQpXG4gICAgICAgICAgICAgIGxhc3RJbmRleCA9IEpTWFN0cmluZy5sYXN0SW5kZXhcbiAgICAgICAgICAgICAgbGFzdFNpZ25pZmljYW50VG9rZW4gPSBtYXRjaFswXVxuICAgICAgICAgICAgICB5aWVsZCB7XG4gICAgICAgICAgICAgICAgdHlwZTogXCJKU1hTdHJpbmdcIixcbiAgICAgICAgICAgICAgICB2YWx1ZTogbWF0Y2hbMF0sXG4gICAgICAgICAgICAgICAgY2xvc2VkOiBtYXRjaFsyXSAhPSB1bmRlZmluZWQsXG4gICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgY29udGludWVcblxuICAgICAgICAgIHdoZW4gXCJKU1hDaGlsZHJlblwiXG4gICAgICAgICAgICBKU1hUZXh0Lmxhc3RJbmRleCA9IGxhc3RJbmRleFxuICAgICAgICAgICAgaWYgbWF0Y2ggPSBKU1hUZXh0LmV4ZWMoaW5wdXQpXG4gICAgICAgICAgICAgIGxhc3RJbmRleCA9IEpTWFRleHQubGFzdEluZGV4XG4gICAgICAgICAgICAgIGxhc3RTaWduaWZpY2FudFRva2VuID0gbWF0Y2hbMF1cbiAgICAgICAgICAgICAgeWllbGQge1xuICAgICAgICAgICAgICAgIHR5cGU6IFwiSlNYVGV4dFwiLFxuICAgICAgICAgICAgICAgIHZhbHVlOiBtYXRjaFswXSxcbiAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICBjb250aW51ZVxuXG4gICAgICAgICAgICBzd2l0Y2ggaW5wdXRbbGFzdEluZGV4XVxuICAgICAgICAgICAgICB3aGVuIFwiPFwiXG4gICAgICAgICAgICAgICAgc3RhY2sucHVzaCh7dGFnOiBcIkpTWFRhZ1wifSlcbiAgICAgICAgICAgICAgICBsYXN0SW5kZXgrK1xuICAgICAgICAgICAgICAgIGxhc3RTaWduaWZpY2FudFRva2VuID0gXCI8XCJcbiAgICAgICAgICAgICAgICB5aWVsZCB7XG4gICAgICAgICAgICAgICAgICB0eXBlOiBcIkpTWFB1bmN0dWF0b3JcIixcbiAgICAgICAgICAgICAgICAgIHZhbHVlOiBcIjxcIixcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgY29udGludWVcbiAgICAgICAgICAgICAgd2hlbiBcIntcIlxuICAgICAgICAgICAgICAgIHN0YWNrLnB1c2goe3RhZzogXCJJbnRlcnBvbGF0aW9uSW5KU1hcIiwgbmVzdGluZzogYnJhY2VzLmxlbmd0aH0pXG4gICAgICAgICAgICAgICAgbGFzdEluZGV4KytcbiAgICAgICAgICAgICAgICBsYXN0U2lnbmlmaWNhbnRUb2tlbiA9IFwiP0ludGVycG9sYXRpb25JbkpTWFwiXG4gICAgICAgICAgICAgICAgcG9zdGZpeEluY0RlYyA9IGZhbHNlXG4gICAgICAgICAgICAgICAgeWllbGQge1xuICAgICAgICAgICAgICAgICAgdHlwZTogXCJKU1hQdW5jdHVhdG9yXCIsXG4gICAgICAgICAgICAgICAgICB2YWx1ZTogXCJ7XCIsXG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGNvbnRpbnVlXG5cbiAgICAgICAgV2hpdGVTcGFjZS5sYXN0SW5kZXggPSBsYXN0SW5kZXhcbiAgICAgICAgaWYgbWF0Y2ggPSBXaGl0ZVNwYWNlLmV4ZWMoaW5wdXQpXG4gICAgICAgICAgbGFzdEluZGV4ID0gV2hpdGVTcGFjZS5sYXN0SW5kZXhcbiAgICAgICAgICB5aWVsZCB7XG4gICAgICAgICAgICB0eXBlOiBcIldoaXRlU3BhY2VcIixcbiAgICAgICAgICAgIHZhbHVlOiBtYXRjaFswXSxcbiAgICAgICAgICB9XG4gICAgICAgICAgY29udGludWVcblxuICAgICAgICBMaW5lVGVybWluYXRvclNlcXVlbmNlLmxhc3RJbmRleCA9IGxhc3RJbmRleFxuICAgICAgICBpZiBtYXRjaCA9IExpbmVUZXJtaW5hdG9yU2VxdWVuY2UuZXhlYyhpbnB1dClcbiAgICAgICAgICBsYXN0SW5kZXggPSBMaW5lVGVybWluYXRvclNlcXVlbmNlLmxhc3RJbmRleFxuICAgICAgICAgIHBvc3RmaXhJbmNEZWMgPSBmYWxzZVxuICAgICAgICAgIGlmIEtleXdvcmRzV2l0aE5vTGluZVRlcm1pbmF0b3JBZnRlci50ZXN0KGxhc3RTaWduaWZpY2FudFRva2VuKVxuICAgICAgICAgICAgbGFzdFNpZ25pZmljYW50VG9rZW4gPSBcIj9Ob0xpbmVUZXJtaW5hdG9ySGVyZVwiXG4gICAgICAgICAgeWllbGQge1xuICAgICAgICAgICAgdHlwZTogXCJMaW5lVGVybWluYXRvclNlcXVlbmNlXCIsXG4gICAgICAgICAgICB2YWx1ZTogbWF0Y2hbMF0sXG4gICAgICAgICAgfVxuICAgICAgICAgIGNvbnRpbnVlXG5cbiAgICAgICAgTXVsdGlMaW5lQ29tbWVudC5sYXN0SW5kZXggPSBsYXN0SW5kZXhcbiAgICAgICAgaWYgbWF0Y2ggPSBNdWx0aUxpbmVDb21tZW50LmV4ZWMoaW5wdXQpXG4gICAgICAgICAgbGFzdEluZGV4ID0gTXVsdGlMaW5lQ29tbWVudC5sYXN0SW5kZXhcbiAgICAgICAgICBpZiBOZXdsaW5lLnRlc3QobWF0Y2hbMF0pXG4gICAgICAgICAgICBwb3N0Zml4SW5jRGVjID0gZmFsc2VcbiAgICAgICAgICAgIGlmIEtleXdvcmRzV2l0aE5vTGluZVRlcm1pbmF0b3JBZnRlci50ZXN0KGxhc3RTaWduaWZpY2FudFRva2VuKVxuICAgICAgICAgICAgICBsYXN0U2lnbmlmaWNhbnRUb2tlbiA9IFwiP05vTGluZVRlcm1pbmF0b3JIZXJlXCJcbiAgICAgICAgICB5aWVsZCB7XG4gICAgICAgICAgICB0eXBlOiBcIk11bHRpTGluZUNvbW1lbnRcIixcbiAgICAgICAgICAgIHZhbHVlOiBtYXRjaFswXSxcbiAgICAgICAgICAgIGNsb3NlZDogbWF0Y2hbMV0gIT0gdW5kZWZpbmVkLFxuICAgICAgICAgIH1cbiAgICAgICAgICBjb250aW51ZVxuXG4gICAgICAgIFNpbmdsZUxpbmVDb21tZW50Lmxhc3RJbmRleCA9IGxhc3RJbmRleFxuICAgICAgICBpZiBtYXRjaCA9IFNpbmdsZUxpbmVDb21tZW50LmV4ZWMoaW5wdXQpXG4gICAgICAgICAgbGFzdEluZGV4ID0gU2luZ2xlTGluZUNvbW1lbnQubGFzdEluZGV4XG4gICAgICAgICAgcG9zdGZpeEluY0RlYyA9IGZhbHNlXG4gICAgICAgICAgeWllbGQge1xuICAgICAgICAgICAgdHlwZTogXCJTaW5nbGVMaW5lQ29tbWVudFwiLFxuICAgICAgICAgICAgdmFsdWU6IG1hdGNoWzBdLFxuICAgICAgICAgIH1cbiAgICAgICAgICBjb250aW51ZVxuXG4gICAgICAgIGZpcnN0Q29kZVBvaW50ID0gU3RyaW5nLmZyb21Db2RlUG9pbnQoaW5wdXQuY29kZVBvaW50QXQobGFzdEluZGV4KSlcbiAgICAgICAgbGFzdEluZGV4ICs9IGZpcnN0Q29kZVBvaW50Lmxlbmd0aFxuICAgICAgICBsYXN0U2lnbmlmaWNhbnRUb2tlbiA9IGZpcnN0Q29kZVBvaW50XG4gICAgICAgIHBvc3RmaXhJbmNEZWMgPSBmYWxzZVxuICAgICAgICB5aWVsZCB7XG4gICAgICAgICAgdHlwZTogaWYgbW9kZS50YWcuc3RhcnRzV2l0aChcIkpTWFwiKSB0aGVuIFwiSlNYSW52YWxpZFwiIGVsc2UgXCJJbnZhbGlkXCIsXG4gICAgICAgICAgdmFsdWU6IGZpcnN0Q29kZVBvaW50LFxuICAgICAgICB9XG5cbiAgICAgIHVuZGVmaW5lZFxuICAgICMjIyMgICAgIyMjIyAgICAjIyMjICAgICMjIyMgICAgIyMjIyAgICAjIyMjICAgICMjIyMgICAgIyMjIyAgICAjIyMjICAgICMjIyMgICAgIyMjIyAgICAjIyMjICAgICMjIyNcbiAgICAjIyMjICAgICMjIyMgICAgIyMjIyAgICAjIyMjICAgICMjIyMgICAgIyMjIyAgICAjIyMjICAgICMjIyMgICAgIyMjIyAgICAjIyMjICAgICMjIyMgICAgIyMjIyAgICAjIyMjXG4gICAgICAgICMjIyMgICAgIyMjIyAgICAjIyMjICAgICMjIyMgICAgIyMjIyAgICAjIyMjICAgICMjIyMgICAgIyMjIyAgICAjIyMjICAgICMjIyMgICAgIyMjIyAgICAjIyMjICAgICMjIyNcbiAgICAgICAgIyMjIyAgICAjIyMjICAgICMjIyMgICAgIyMjIyAgICAjIyMjICAgICMjIyMgICAgIyMjIyAgICAjIyMjICAgICMjIyMgICAgIyMjIyAgICAjIyMjICAgICMjIyMgICAgIyMjI1xuICAgICMjIyMgICAgIyMjIyAgICAjIyMjICAgICMjIyMgICAgIyMjIyAgICAjIyMjICAgICMjIyMgICAgIyMjIyAgICAjIyMjICAgICMjIyMgICAgIyMjIyAgICAjIyMjICAgICMjIyNcbiAgICAjIyMjICAgICMjIyMgICAgIyMjIyAgICAjIyMjICAgICMjIyMgICAgIyMjIyAgICAjIyMjICAgICMjIyMgICAgIyMjIyAgICAjIyMjICAgICMjIyMgICAgIyMjIyAgICAjIyMjXG4gICAgICAgICMjIyMgICAgIyMjIyAgICAjIyMjICAgICMjIyMgICAgIyMjIyAgICAjIyMjICAgICMjIyMgICAgIyMjIyAgICAjIyMjICAgICMjIyMgICAgIyMjIyAgICAjIyMjICAgICMjIyNcbiAgICAgICAgIyMjIyAgICAjIyMjICAgICMjIyMgICAgIyMjIyAgICAjIyMjICAgICMjIyMgICAgIyMjIyAgICAjIyMjICAgICMjIyMgICAgIyMjIyAgICAjIyMjICAgICMjIyMgICAgIyMjI1xuICAgICMjIyMgICAgIyMjIyAgICAjIyMjICAgICMjIyMgICAgIyMjIyAgICAjIyMjICAgICMjIyMgICAgIyMjIyAgICAjIyMjICAgICMjIyMgICAgIyMjIyAgICAjIyMjICAgICMjIyNcbiAgICAjIyMjICAgICMjIyMgICAgIyMjIyAgICAjIyMjICAgICMjIyMgICAgIyMjIyAgICAjIyMjICAgICMjIyMgICAgIyMjIyAgICAjIyMjICAgICMjIyMgICAgIyMjIyAgICAjIyMjXG4gICAgICAgICMjIyMgICAgIyMjIyAgICAjIyMjICAgICMjIyMgICAgIyMjIyAgICAjIyMjICAgICMjIyMgICAgIyMjIyAgICAjIyMjICAgICMjIyMgICAgIyMjIyAgICAjIyMjICAgICMjIyNcbiAgICAgICAgIyMjIyAgICAjIyMjICAgICMjIyMgICAgIyMjIyAgICAjIyMjICAgICMjIyMgICAgIyMjIyAgICAjIyMjICAgICMjIyMgICAgIyMjIyAgICAjIyMjICAgICMjIyMgICAgIyMjI1xuXG4gICAgIy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiAgICB0b2tlbl9jYXRlZ29yaWVzID0gZG8gPT5cbiAgICAgIFIgICAgICAgICAgICAgICAgICAgICAgICAgICA9IHt9XG4gICAgICAjLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi5cbiAgICAgIFIubm9uZXNzZW50aWFscyAgICAgICAgICAgICA9ICggbmV3IFNldCBbICAgICAgICAgICAgICAgICAgICAgICAgIF0gKVxuICAgICAgUi5saXRlcmFscyAgICAgICAgICAgICAgICAgID0gKCBuZXcgU2V0IFsgICAgICAgICAgICAgICAgICAgICAgICAgXSApXG4gICAgICAjLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi5cbiAgICAgIFIuY29tbWVudHMgICAgICAgICAgICAgICAgICA9ICggbmV3IFNldCBbICdub25lc3NlbnRpYWxzJywgICAgICAgIF0gKS51bmlvbiBSLm5vbmVzc2VudGlhbHNcbiAgICAgIFIud2hpdGVzcGFjZSAgICAgICAgICAgICAgICA9ICggbmV3IFNldCBbICdub25lc3NlbnRpYWxzJywgICAgICAgIF0gKS51bmlvbiBSLm5vbmVzc2VudGlhbHNcbiAgICAgIFIucHJpbWl0aXZlX2xpdGVyYWxzICAgICAgICA9ICggbmV3IFNldCBbICdsaXRlcmFscycsICAgICAgICAgICAgIF0gKS51bmlvbiBSLmxpdGVyYWxzXG4gICAgICAjLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi5cbiAgICAgIFIuc3RyaW5nX2xpdGVyYWxzICAgICAgICAgICA9ICggbmV3IFNldCBbICdwcmltaXRpdmVfbGl0ZXJhbHMnLCAgIF0gKS51bmlvbiBSLnByaW1pdGl2ZV9saXRlcmFsc1xuICAgICAgIy4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uXG4gICAgICBSLkxpbmVUZXJtaW5hdG9yU2VxdWVuY2UgICAgPSAoIG5ldyBTZXQgWyAnd2hpdGVzcGFjZScsICAgICAgICAgICBdICkudW5pb24gUi53aGl0ZXNwYWNlXG4gICAgICBSLldoaXRlU3BhY2UgICAgICAgICAgICAgICAgPSAoIG5ldyBTZXQgWyAnd2hpdGVzcGFjZScsICAgICAgICAgICBdICkudW5pb24gUi53aGl0ZXNwYWNlXG4gICAgICBSLkhhc2hiYW5nQ29tbWVudCAgICAgICAgICAgPSAoIG5ldyBTZXQgWyAnY29tbWVudHMnLCAgICAgICAgICAgICBdICkudW5pb24gUi5jb21tZW50c1xuICAgICAgUi5NdWx0aUxpbmVDb21tZW50ICAgICAgICAgID0gKCBuZXcgU2V0IFsgJ2NvbW1lbnRzJywgICAgICAgICAgICAgXSApLnVuaW9uIFIuY29tbWVudHNcbiAgICAgIFIuU2luZ2xlTGluZUNvbW1lbnQgICAgICAgICA9ICggbmV3IFNldCBbICdjb21tZW50cycsICAgICAgICAgICAgIF0gKS51bmlvbiBSLmNvbW1lbnRzXG4gICAgICBSLlN0cmluZ0xpdGVyYWwgICAgICAgICAgICAgPSAoIG5ldyBTZXQgWyAnc3RyaW5nX2xpdGVyYWxzJywgICAgICBdICkudW5pb24gUi5zdHJpbmdfbGl0ZXJhbHNcbiAgICAgIFIuTm9TdWJzdGl0dXRpb25UZW1wbGF0ZSAgICA9ICggbmV3IFNldCBbICdzdHJpbmdfbGl0ZXJhbHMnLCAgICAgIF0gKS51bmlvbiBSLnN0cmluZ19saXRlcmFsc1xuICAgICAgUi5OdW1lcmljTGl0ZXJhbCAgICAgICAgICAgID0gKCBuZXcgU2V0IFsgJ3ByaW1pdGl2ZV9saXRlcmFscycsICAgXSApLnVuaW9uIFIucHJpbWl0aXZlX2xpdGVyYWxzXG4gICAgICBSLlJlZ3VsYXJFeHByZXNzaW9uTGl0ZXJhbCAgPSAoIG5ldyBTZXQgWyAncHJpbWl0aXZlX2xpdGVyYWxzJywgICBdICkudW5pb24gUi5wcmltaXRpdmVfbGl0ZXJhbHNcbiAgICAgICMgVG9rZW5zTm90UHJlY2VkaW5nT2JqZWN0TGl0ZXJhbDogIG5ldyBTZXQgWyAnbGl0ZXJhbHMnLCBdICMjIyA/Pz8gIyMjXG4gICAgICByZXR1cm4gUlxuXG4gICAgIy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiAgICB3YWxrX2pzX3Rva2VucyA9ICggc291cmNlICkgLT5cbiAgICAgIGxpbmVfbnIgPSAxXG4gICAgICBmb3IgdG9rZW4gZnJvbSBqc1Rva2VucyBzb3VyY2VcbiAgICAgICAgbGluZV9ucisrIGlmICggdG9rZW4udHlwZSBpcyAnTGluZVRlcm1pbmF0b3JTZXF1ZW5jZScgKVxuICAgICAgICBjYXRlZ29yaWVzID0gdG9rZW5fY2F0ZWdvcmllc1sgdG9rZW4udHlwZSBdID8gbmV3IFNldCgpXG4gICAgICAgIHlpZWxkIHsgdG9rZW4uLi4sIGxpbmVfbnIsIGNhdGVnb3JpZXMsIH1cbiAgICAgIHJldHVybiBudWxsXG5cbiAgICAjLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuICAgIHdhbGtfZXNzZW50aWFsX2pzX3Rva2VucyA9ICggc291cmNlICkgLT5cbiAgICAgIGZvciB0b2tlbiBmcm9tIHdhbGtfanNfdG9rZW5zIHNvdXJjZVxuICAgICAgICBjb250aW51ZSBpZiB0b2tlbi5jYXRlZ29yaWVzLmhhcyAnbm9uZXNzZW50aWFscydcbiAgICAgICAgeWllbGQgdG9rZW5cbiAgICAgIHJldHVybiBudWxsXG5cbiAgICAjLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuICAgIHJwcl90b2tlbiA9ICggdG9rZW4gKSAtPiB0b2tlbi50eXBlICsgcnByX3N0cmluZyB0b2tlbi52YWx1ZVxuXG4gICAgIy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiAgICBzdW1tYXJpemUgPSAoIHRva2Vucywgam9pbmVyID0gJyYmJicgKSAtPlxuICAgICAgcmV0dXJuIGpvaW5lciArICggKCAoIHJwcl90b2tlbiB0ICkgZm9yIHQgZnJvbSB0b2tlbnMgKS5qb2luIGpvaW5lciApICsgam9pbmVyXG5cbiAgICAjLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLlxuICAgIHJldHVybiBleHBvcnRzID0ge1xuICAgICAgd2Fsa19qc190b2tlbnMsXG4gICAgICB3YWxrX2Vzc2VudGlhbF9qc190b2tlbnMsXG4gICAgICBycHJfdG9rZW4sXG4gICAgICBzdW1tYXJpemUsXG4gICAgICBpbnRlcm5hbHM6IHtcbiAgICAgICAgdG9rZW5fY2F0ZWdvcmllcyxcbiAgICAgICAgdG9rZW5zOiB7XG4gICAgICAgICAgSGFzaGJhbmdDb21tZW50LFxuICAgICAgICAgIElkZW50aWZpZXIsXG4gICAgICAgICAgSlNYSWRlbnRpZmllcixcbiAgICAgICAgICBKU1hQdW5jdHVhdG9yLFxuICAgICAgICAgIEpTWFN0cmluZyxcbiAgICAgICAgICBKU1hUZXh0LFxuICAgICAgICAgIEtleXdvcmRzV2l0aEV4cHJlc3Npb25BZnRlcixcbiAgICAgICAgICBLZXl3b3Jkc1dpdGhOb0xpbmVUZXJtaW5hdG9yQWZ0ZXIsXG4gICAgICAgICAgTGluZVRlcm1pbmF0b3JTZXF1ZW5jZSxcbiAgICAgICAgICBNdWx0aUxpbmVDb21tZW50LFxuICAgICAgICAgIE5ld2xpbmUsXG4gICAgICAgICAgTnVtZXJpY0xpdGVyYWwsXG4gICAgICAgICAgUHVuY3R1YXRvcixcbiAgICAgICAgICBSZWd1bGFyRXhwcmVzc2lvbkxpdGVyYWwsXG4gICAgICAgICAgU2luZ2xlTGluZUNvbW1lbnQsXG4gICAgICAgICAgU3RyaW5nTGl0ZXJhbCxcbiAgICAgICAgICBUZW1wbGF0ZSxcbiAgICAgICAgICBUb2tlbnNOb3RQcmVjZWRpbmdPYmplY3RMaXRlcmFsLFxuICAgICAgICAgIFRva2Vuc1ByZWNlZGluZ0V4cHJlc3Npb24sXG4gICAgICAgICAgV2hpdGVTcGFjZSwgfSwgfSwgfVxuXG4jPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT1cbk9iamVjdC5hc3NpZ24gbW9kdWxlLmV4cG9ydHMsIEJSSUNTXG5cblxuXG5cbiJdfQ==
