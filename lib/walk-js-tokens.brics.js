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
      var HashbangComment, Identifier, JSXIdentifier, JSXPunctuator, JSXString, JSXText, KeywordsWithExpressionAfter, KeywordsWithNoLineTerminatorAfter, LineTerminatorSequence, MultiLineComment, Newline, NumericLiteral, Punctuator, RegularExpressionLiteral, SingleLineComment, StringLiteral, Template, TokensNotPrecedingObjectLiteral, TokensPrecedingExpression, WhiteSpace, exports, jsTokens, rpr_string, summarize, walk_essential_js_tokens, walk_js_tokens;
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
      walk_js_tokens = function*(source) {
        return (yield* jsTokens(source));
      };
      //-------------------------------------------------------------------------------------------------------
      walk_essential_js_tokens = function*(source) {
        var token;
        for (token of jsTokens(source)) {
          if (token.type === 'WhiteSpace') {
            continue;
          }
          if (token.type === 'MultiLineComment') {
            continue;
          }
          if (token.type === 'SingleLineComment') {
            continue;
          }
          yield token;
        }
        return null;
      };
      //-------------------------------------------------------------------------------------------------------
      summarize = function(tokens, joiner = '&&&') {
        var t;
        return joiner + (((function() {
          var results;
          results = [];
          for (t of tokens) {
            results.push(t.type + (rpr_string(t.value)));
          }
          return results;
        })()).join(joiner)) + joiner;
      };
      //.......................................................................................................
      return exports = {
        walk_js_tokens,
        walk_essential_js_tokens,
        summarize,
        internals: {HashbangComment, Identifier, JSXIdentifier, JSXPunctuator, JSXString, JSXText, KeywordsWithExpressionAfter, KeywordsWithNoLineTerminatorAfter, LineTerminatorSequence, MultiLineComment, Newline, NumericLiteral, Punctuator, RegularExpressionLiteral, SingleLineComment, StringLiteral, Template, TokensNotPrecedingObjectLiteral, TokensPrecedingExpression, WhiteSpace}
      };
    }
  };

  //===========================================================================================================
  Object.assign(module.exports, BRICS);

}).call(this);

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vc3JjL3dhbGstanMtdG9rZW5zLmJyaWNzLmNvZmZlZSJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFDQTtFQUFBO0FBQUEsTUFBQSxLQUFBLEVBQUEsS0FBQTs7O0VBR0EsQ0FBQSxDQUFFLEtBQUYsQ0FBQSxHQUFhLE9BQWIsRUFIQTs7Ozs7RUFTQSxLQUFBLEdBSUUsQ0FBQTs7O0lBQUEsc0JBQUEsRUFBd0IsUUFBQSxDQUFBLENBQUE7QUFDMUIsVUFBQSxlQUFBLEVBQUEsVUFBQSxFQUFBLGFBQUEsRUFBQSxhQUFBLEVBQUEsU0FBQSxFQUFBLE9BQUEsRUFBQSwyQkFBQSxFQUFBLGlDQUFBLEVBQUEsc0JBQUEsRUFBQSxnQkFBQSxFQUFBLE9BQUEsRUFBQSxjQUFBLEVBQUEsVUFBQSxFQUFBLHdCQUFBLEVBQUEsaUJBQUEsRUFBQSxhQUFBLEVBQUEsUUFBQSxFQUFBLCtCQUFBLEVBQUEseUJBQUEsRUFBQSxVQUFBLEVBQUEsT0FBQSxFQUFBLFFBQUEsRUFBQSxVQUFBLEVBQUEsU0FBQSxFQUFBLHdCQUFBLEVBQUE7TUFBSSxDQUFBLENBQUUsVUFBRixDQUFBLEdBQWtCLENBQUUsT0FBQSxDQUFRLG9CQUFSLENBQUYsQ0FBZ0MsQ0FBQyxrQkFBakMsQ0FBQSxDQUFsQixFQUFKOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O01BNEJJLHdCQUFBLEdBQTJCO01BdUIzQixVQUFBLEdBQWEseUhBbkRqQjs7TUE4RUksVUFBQSxHQUFhO01BWWIsYUFBQSxHQUFnQjtNQVloQixjQUFBLEdBQWlCO01BOEJqQixRQUFBLEdBQVc7TUFZWCxVQUFBLEdBQWE7TUFJYixzQkFBQSxHQUF5QjtNQU16QixnQkFBQSxHQUFtQjtNQVVuQixpQkFBQSxHQUFvQjtNQUlwQixlQUFBLEdBQWtCO01BSWxCLGFBQUEsR0FBZ0I7TUFNaEIsYUFBQSxHQUFnQjtNQUtoQixTQUFBLEdBQVk7TUFVWixPQUFBLEdBQVU7TUFJVix5QkFB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QTtRQUFNLEtBQUEseUJBQUE7VUFDRSxJQUFZLEtBQUssQ0FBQyxJQUFOLEtBQWMsWUFBMUI7QUFBQSxxQkFBQTs7VUFDQSxJQUFZLEtBQUssQ0FBQyxJQUFOLEtBQWMsa0JBQTFCO0FBQUEscUJBQUE7O1VBQ0EsSUFBWSxLQUFLLENBQUMsSUFBTixLQUFjLG1CQUExQjtBQUFBLHFCQUFBOztVQUNBLE1BQU07UUFKUjtBQUtBLGVBQU87TUFOa0IsRUEza0IvQjs7TUFvbEJJLFNBQUEsR0FBWSxRQUFBLENBQUUsTUFBRixFQUFVLFNBQVMsS0FBbkIsQ0FBQTtBQUNoQixZQUFBO0FBQU0sZUFBTyxNQUFBLEdBQVMsQ0FBRTs7QUFBRTtVQUFBLEtBQUEsV0FBQTt5QkFBQSxDQUFDLENBQUMsSUFBRixHQUFTLENBQUUsVUFBQSxDQUFXLENBQUMsQ0FBQyxLQUFiLENBQUY7VUFBVCxDQUFBOztZQUFGLENBQXFELENBQUMsSUFBdEQsQ0FBMkQsTUFBM0QsQ0FBRixDQUFULEdBQWlGO01BRDlFLEVBcGxCaEI7O0FBd2xCSSxhQUFPLE9BQUEsR0FBVTtRQUNmLGNBRGU7UUFFZix3QkFGZTtRQUdmLFNBSGU7UUFJZixTQUFBLEVBQVcsQ0FDVCxlQURTLEVBRVQsVUFGUyxFQUdULGFBSFMsRUFJVCxhQUpTLEVBS1QsU0FMUyxFQU1ULE9BTlMsRUFPVCwyQkFQUyxFQVFULGlDQVJTLEVBU1Qsc0JBVFMsRUFVVCxnQkFWUyxFQVdULE9BWFMsRUFZVCxjQVpTLEVBYVQsVUFiUyxFQWNULHdCQWRTLEVBZVQsaUJBZlMsRUFnQlQsYUFoQlMsRUFpQlQsUUFqQlMsRUFrQlQsK0JBbEJTLEVBbUJULHlCQW5CUyxFQW9CVCxVQXBCUztNQUpJO0lBemxCSztFQUF4QixFQWJGOzs7RUFpb0JBLE1BQU0sQ0FBQyxNQUFQLENBQWMsTUFBTSxDQUFDLE9BQXJCLEVBQThCLEtBQTlCO0FBam9CQSIsInNvdXJjZXNDb250ZW50IjpbIlxuJ3VzZSBzdHJpY3QnXG5cbiM9PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PVxueyBkZWJ1ZywgfSA9IGNvbnNvbGVcblxuXG4jIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyNcbiNcbiM9PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PVxuQlJJQ1MgPVxuXG4gICM9PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT1cbiAgIyMjIE5PVEUgRnV0dXJlIFNpbmdsZS1GaWxlIE1vZHVsZSAjIyNcbiAgcmVxdWlyZV93YWxrX2pzX3Rva2VuczogLT5cbiAgICB7IHJwcl9zdHJpbmcsIH0gPSAoIHJlcXVpcmUgJy4vcnByLXN0cmluZy5icmljcycgKS5yZXF1aXJlX3Jwcl9zdHJpbmcoKVxuXG4gICAgIz09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09XG4gICAgIyMjIyAgICAjIyMjICAgICMjIyMgICAgIyMjIyAgICAjIyMjICAgICMjIyMgICAgIyMjIyAgICAjIyMjICAgICMjIyMgICAgIyMjIyAgICAjIyMjICAgICMjIyMgICAgIyMjI1xuICAgICMjIyMgICAgIyMjIyAgICAjIyMjICAgICMjIyMgICAgIyMjIyAgICAjIyMjICAgICMjIyMgICAgIyMjIyAgICAjIyMjICAgICMjIyMgICAgIyMjIyAgICAjIyMjICAgICMjIyNcbiAgICAgICAgIyMjIyAgICAjIyMjICAgICMjIyMgICAgIyMjIyAgICAjIyMjICAgICMjIyMgICAgIyMjIyAgICAjIyMjICAgICMjIyMgICAgIyMjIyAgICAjIyMjICAgICMjIyMgICAgIyMjI1xuICAgICAgICAjIyMjICAgICMjIyMgICAgIyMjIyAgICAjIyMjICAgICMjIyMgICAgIyMjIyAgICAjIyMjICAgICMjIyMgICAgIyMjIyAgICAjIyMjICAgICMjIyMgICAgIyMjIyAgICAjIyMjXG4gICAgIyMjIyAgICAjIyMjICAgICMjIyMgICAgIyMjIyAgICAjIyMjICAgICMjIyMgICAgIyMjIyAgICAjIyMjICAgICMjIyMgICAgIyMjIyAgICAjIyMjICAgICMjIyMgICAgIyMjI1xuICAgICMjIyMgICAgIyMjIyAgICAjIyMjICAgICMjIyMgICAgIyMjIyAgICAjIyMjICAgICMjIyMgICAgIyMjIyAgICAjIyMjICAgICMjIyMgICAgIyMjIyAgICAjIyMjICAgICMjIyNcbiAgICAgICAgIyMjIyAgICAjIyMjICAgICMjIyMgICAgIyMjIyAgICAjIyMjICAgICMjIyMgICAgIyMjIyAgICAjIyMjICAgICMjIyMgICAgIyMjIyAgICAjIyMjICAgICMjIyMgICAgIyMjI1xuICAgICAgICAjIyMjICAgICMjIyMgICAgIyMjIyAgICAjIyMjICAgICMjIyMgICAgIyMjIyAgICAjIyMjICAgICMjIyMgICAgIyMjIyAgICAjIyMjICAgICMjIyMgICAgIyMjIyAgICAjIyMjXG4gICAgIyMjIyAgICAjIyMjICAgICMjIyMgICAgIyMjIyAgICAjIyMjICAgICMjIyMgICAgIyMjIyAgICAjIyMjICAgICMjIyMgICAgIyMjIyAgICAjIyMjICAgICMjIyMgICAgIyMjI1xuICAgICMjIyMgICAgIyMjIyAgICAjIyMjICAgICMjIyMgICAgIyMjIyAgICAjIyMjICAgICMjIyMgICAgIyMjIyAgICAjIyMjICAgICMjIyMgICAgIyMjIyAgICAjIyMjICAgICMjIyNcbiAgICAgICAgIyMjIyAgICAjIyMjICAgICMjIyMgICAgIyMjIyAgICAjIyMjICAgICMjIyMgICAgIyMjIyAgICAjIyMjICAgICMjIyMgICAgIyMjIyAgICAjIyMjICAgICMjIyMgICAgIyMjI1xuICAgICAgICAjIyMjICAgICMjIyMgICAgIyMjIyAgICAjIyMjICAgICMjIyMgICAgIyMjIyAgICAjIyMjICAgICMjIyMgICAgIyMjIyAgICAjIyMjICAgICMjIyMgICAgIyMjIyAgICAjIyMjXG5cbiAgICAjIHRoeCB0byBodHRwczovL3Jhdy5naXRodWJ1c2VyY29udGVudC5jb20vbHlkZWxsL2pzLXRva2Vucy9kMTc0M2ExMjExMDNmOTcwYjlkMmU4MDc0NjljYmEwMmQyNGI4NTJhL2luZGV4LmNvZmZlZVxuXG5cbiAgICAjIENvcHlyaWdodCAyMDE0LCAyMDE1LCAyMDE2LCAyMDE3LCAyMDE4LCAyMDE5LCAyMDIwLCAyMDIxLCAyMDIyLCAyMDIzIFNpbW9uIEx5ZGVsbFxuICAgICMgTGljZW5zZTogTUlULlxuXG4gICAgIyBodHRwczovL3RjMzkuZXMvZWNtYTI2Mi8jc2VjLWxleGljYWwtZ3JhbW1hclxuICAgICMgaHR0cHM6Ly9tYXRoaWFzYnluZW5zLmJlL25vdGVzL2phdmFzY3JpcHQtaWRlbnRpZmllcnNcbiAgICAjIGh0dHBzOi8vZ2l0aHViLmNvbS90YzM5L3Byb3Bvc2FsLXJlZ2V4cC11bmljb2RlLXByb3BlcnR5LWVzY2FwZXMvI290aGVyLWV4YW1wbGVzXG4gICAgIyBodHRwczovL3VuaWNvZGUub3JnL3JlcG9ydHMvdHIzMS8jQmFja3dhcmRfQ29tcGF0aWJpbGl0eVxuICAgICMgaHR0cHM6Ly9zdGFja292ZXJmbG93LmNvbS9hLzI3MTIwMTEwLzIwMTA2MTZcblxuICAgIFJlZ3VsYXJFeHByZXNzaW9uTGl0ZXJhbCA9IC8vL1xuICAgICAgLyg/IVsgKiAvIF0pXG4gICAgICAoPzpcbiAgICAgICAgXFxbXG4gICAgICAgICg/OlxuICAgICAgICAgIFteIFxcXSBcXFxcIFxcbiBcXHIgXFx1MjAyOCBcXHUyMDI5IF0rXG4gICAgICAgICAgfFxuICAgICAgICAgIFxcXFwuXG4gICAgICAgICkqXG4gICAgICAgIFxcXT9cbiAgICAgICAgfFxuICAgICAgICBbXiAvIFsgXFxcXCBcXG4gXFxyIFxcdTIwMjggXFx1MjAyOSBdK1xuICAgICAgICB8XG4gICAgICAgIFxcXFwuXG4gICAgICApKlxuICAgICAgKFxuICAgICAgICAvXG4gICAgICAgIFsgJCBfIFxcdTIwMEMgXFx1MjAwRCBcXHB7SURfQ29udGludWV9IF0qXG4gICAgICAgIHxcbiAgICAgICAgXFxcXFxuICAgICAgKT9cbiAgICAvLy95dVxuXG4gICAgUHVuY3R1YXRvciA9IC8vL1xuICAgICAgLS0gfCBcXCtcXCtcbiAgICAgIHxcbiAgICAgID0+XG4gICAgICB8XG4gICAgICBcXC57M31cbiAgICAgIHxcbiAgICAgIFxcPz9cXC4gKD8hXFxkKVxuICAgICAgfFxuICAgICAgKD86XG4gICAgICAgICYmIHwgXFx8XFx8IHwgXFw/XFw/XG4gICAgICAgIHxcbiAgICAgICAgWyArIFxcLSAlICYgfCBeIF1cbiAgICAgICAgfFxuICAgICAgICBcXCp7MSwyfVxuICAgICAgICB8XG4gICAgICAgIDx7MSwyfSB8ID57MSwzfVxuICAgICAgICB8XG4gICAgICAgICE9PyB8ID17MSwyfVxuICAgICAgICB8XG4gICAgICAgIC8oPyFbIC8gKiBdKVxuICAgICAgKT0/XG4gICAgICB8XG4gICAgICBbID8gfiAsIDogOyBbIFxcXSAoICkgeyB9IF1cbiAgICAvLy95XG5cbiAgICAjIE5vdGU6IGBcXHgyM2AgaXMgYCNgLiBUaGUgZXNjYXBlIGlzIHVzZWQgc2luY2UgVlNDb2Rl4oCZcyBzeW50YXggaGlnaGxpZ2h0aW5nIGJyZWFrcyBvdGhlcndpc2UuXG4gICAgSWRlbnRpZmllciA9IC8vL1xuICAgICAgKFxceDIzPylcbiAgICAgICg/PVsgJCBfIFxccHtJRF9TdGFydH0gXFxcXCBdKVxuICAgICAgKD86XG4gICAgICAgIFsgJCBfIFxcdTIwMEMgXFx1MjAwRCBcXHB7SURfQ29udGludWV9IF0rXG4gICAgICAgIHxcbiAgICAgICAgXFxcXHVbIFxcZCBhLWYgQS1GIF17NH1cbiAgICAgICAgfFxuICAgICAgICBcXFxcdVxce1sgXFxkIGEtZiBBLUYgXStcXH1cbiAgICAgICkrXG4gICAgLy8veXVcblxuICAgIFN0cmluZ0xpdGVyYWwgPSAvLy9cbiAgICAgIChbICcgXCIgXSlcbiAgICAgICg/OlxuICAgICAgICBbXiAnIFwiIFxcXFwgXFxuIFxcciBdK1xuICAgICAgICB8XG4gICAgICAgICg/ISBcXDEgKVsgJyBcIiBdXG4gICAgICAgIHxcbiAgICAgICAgXFxcXCg/OiBcXHJcXG4gfCBbXl0gKVxuICAgICAgKSpcbiAgICAgIChcXDEpP1xuICAgIC8vL3lcblxuICAgIE51bWVyaWNMaXRlcmFsID0gLy8vXG4gICAgICAoPzpcbiAgICAgICAgMFt4WF1bIFxcZCBhLWYgQS1GIF0gKD86IF8/IFsgXFxkIGEtZiBBLUYgXSApKlxuICAgICAgICB8XG4gICAgICAgIDBbb09dWzAtN10gKD86IF8/IFswLTddICkqXG4gICAgICAgIHxcbiAgICAgICAgMFtiQl1bMDFdICg/OiBfPyBbMDFdICkqXG4gICAgICApbj9cbiAgICAgIHxcbiAgICAgIDBuXG4gICAgICB8XG4gICAgICBbMS05XSg/OiBfPyBcXGQgKSpuXG4gICAgICB8XG4gICAgICAoPzpcbiAgICAgICAgKD86XG4gICAgICAgICAgMCg/IVxcZClcbiAgICAgICAgICB8XG4gICAgICAgICAgMFxcZCpbODldXFxkKlxuICAgICAgICAgIHxcbiAgICAgICAgICBbMS05XSg/OiBfPyBcXGQgKSpcbiAgICAgICAgKVxuICAgICAgICAoPzogXFwuKD86IFxcZCAoPzogXz8gXFxkICkqICk/ICk/XG4gICAgICAgIHxcbiAgICAgICAgXFwuXFxkICg/OiBfPyBcXGQgKSpcbiAgICAgIClcbiAgICAgICg/OiBbZUVdWystXT9cXGQgKD86IF8/IFxcZCApKiApP1xuICAgICAgfFxuICAgICAgMFswLTddK1xuICAgIC8vL3lcblxuICAgIFRlbXBsYXRlID0gLy8vXG4gICAgICBbIGAgfSBdXG4gICAgICAoPzpcbiAgICAgICAgW14gYCBcXFxcICQgXStcbiAgICAgICAgfFxuICAgICAgICBcXFxcW15dXG4gICAgICAgIHxcbiAgICAgICAgXFwkKD8hXFx7KVxuICAgICAgKSpcbiAgICAgICggYCB8IFxcJFxceyApP1xuICAgIC8vL3lcblxuICAgIFdoaXRlU3BhY2UgPSAvLy9cbiAgICAgIFsgXFx0IFxcdiBcXGYgXFx1ZmVmZiBcXHB7WnN9IF0rXG4gICAgLy8veXVcblxuICAgIExpbmVUZXJtaW5hdG9yU2VxdWVuY2UgPSAvLy9cbiAgICAgIFxccj9cXG5cbiAgICAgIHxcbiAgICAgIFsgXFxyIFxcdTIwMjggXFx1MjAyOSBdXG4gICAgLy8veVxuXG4gICAgTXVsdGlMaW5lQ29tbWVudCA9IC8vL1xuICAgICAgL1xcKlxuICAgICAgKD86XG4gICAgICAgIFteKl0rXG4gICAgICAgIHxcbiAgICAgICAgXFwqKD8hLylcbiAgICAgICkqXG4gICAgICAoXFwqLyk/XG4gICAgLy8veVxuXG4gICAgU2luZ2xlTGluZUNvbW1lbnQgPSAvLy9cbiAgICAgIC8vLipcbiAgICAvLy95XG5cbiAgICBIYXNoYmFuZ0NvbW1lbnQgPSAvLy9cbiAgICAgIF4jIS4qXG4gICAgLy8vXG5cbiAgICBKU1hQdW5jdHVhdG9yID0gLy8vXG4gICAgICBbIDwgPiAuIDogPSB7IH0gXVxuICAgICAgfFxuICAgICAgLyg/IVsgLyAqIF0pXG4gICAgLy8veVxuXG4gICAgSlNYSWRlbnRpZmllciA9IC8vL1xuICAgICAgWyAkIF8gXFxwe0lEX1N0YXJ0fSBdXG4gICAgICBbICQgXyBcXHUyMDBDIFxcdTIwMEQgXFxwe0lEX0NvbnRpbnVlfSAtIF0qXG4gICAgLy8veXVcblxuICAgIEpTWFN0cmluZyA9IC8vL1xuICAgICAgKFsgJyBcIiBdKVxuICAgICAgKD86XG4gICAgICAgIFteICcgXCJdK1xuICAgICAgICB8XG4gICAgICAgICg/ISBcXDEgKVsgJyBcIiBdXG4gICAgICApKlxuICAgICAgKFxcMSk/XG4gICAgLy8veVxuXG4gICAgSlNYVGV4dCA9IC8vL1xuICAgICAgW14gPCA+IHsgfSBdK1xuICAgIC8vL3lcblxuICAgIFRva2Vuc1ByZWNlZGluZ0V4cHJlc3Npb24gPSAvLy9cbiAgICAgIF4oPzpcbiAgICAgICAgWy8rLV1cbiAgICAgICAgfFxuICAgICAgICBcXC57M31cbiAgICAgICAgfFxuICAgICAgICBcXD8oPzpJbnRlcnBvbGF0aW9uSW4oPzpKU1h8VGVtcGxhdGUpfE5vTGluZVRlcm1pbmF0b3JIZXJlfE5vbkV4cHJlc3Npb25QYXJlbkVuZHxVbmFyeUluY0RlYylcbiAgICAgICk/JFxuICAgICAgfFxuICAgICAgWyB7IH0gKCBbICwgOyA8ID4gPSAqICUgJiB8IF4gISB+ID8gOiBdJFxuICAgIC8vL1xuXG4gICAgVG9rZW5zTm90UHJlY2VkaW5nT2JqZWN0TGl0ZXJhbCA9IC8vL1xuICAgICAgXig/OlxuICAgICAgICA9PlxuICAgICAgICB8XG4gICAgICAgIFsgOyBcXF0gKSB7IH0gXVxuICAgICAgICB8XG4gICAgICAgIGVsc2VcbiAgICAgICAgfFxuICAgICAgICBcXD8oPzpOb0xpbmVUZXJtaW5hdG9ySGVyZXxOb25FeHByZXNzaW9uUGFyZW5FbmQpXG4gICAgICApPyRcbiAgICAvLy9cblxuICAgIEtleXdvcmRzV2l0aEV4cHJlc3Npb25BZnRlciA9IC8vL1xuICAgICAgXig/OmF3YWl0fGNhc2V8ZGVmYXVsdHxkZWxldGV8ZG98ZWxzZXxpbnN0YW5jZW9mfG5ld3xyZXR1cm58dGhyb3d8dHlwZW9mfHZvaWR8eWllbGQpJFxuICAgIC8vL1xuXG4gICAgS2V5d29yZHNXaXRoTm9MaW5lVGVybWluYXRvckFmdGVyID0gLy8vXG4gICAgICBeKD86cmV0dXJufHRocm93fHlpZWxkKSRcbiAgICAvLy9cblxuICAgIE5ld2xpbmUgPSBSZWdFeHAoTGluZVRlcm1pbmF0b3JTZXF1ZW5jZS5zb3VyY2UpXG5cbiAgICBtb2R1bGUuZXhwb3J0cyA9IGpzVG9rZW5zID0gKGlucHV0LCB7anN4ID0gZmFsc2V9ID0ge30pIC0+XG4gICAgICB7bGVuZ3RofSA9IGlucHV0XG4gICAgICBsYXN0SW5kZXggPSAwXG4gICAgICBsYXN0U2lnbmlmaWNhbnRUb2tlbiA9IFwiXCJcbiAgICAgIHN0YWNrID0gW3t0YWc6IFwiSlNcIn1dXG4gICAgICBicmFjZXMgPSBbXVxuICAgICAgcGFyZW5OZXN0aW5nID0gMFxuICAgICAgcG9zdGZpeEluY0RlYyA9IGZhbHNlXG5cbiAgICAgIGlmIG1hdGNoID0gSGFzaGJhbmdDb21tZW50LmV4ZWMoaW5wdXQpXG4gICAgICAgIHlpZWxkIHtcbiAgICAgICAgICB0eXBlOiBcIkhhc2hiYW5nQ29tbWVudFwiLFxuICAgICAgICAgIHZhbHVlOiBtYXRjaFswXSxcbiAgICAgICAgfVxuICAgICAgICBsYXN0SW5kZXggPSBtYXRjaFswXS5sZW5ndGhcblxuICAgICAgd2hpbGUgbGFzdEluZGV4IDwgbGVuZ3RoXG4gICAgICAgIG1vZGUgPSBzdGFja1tzdGFjay5sZW5ndGggLSAxXVxuXG4gICAgICAgIHN3aXRjaCBtb2RlLnRhZ1xuICAgICAgICAgIHdoZW4gXCJKU1wiLCBcIkpTTm9uRXhwcmVzc2lvblBhcmVuXCIsIFwiSW50ZXJwb2xhdGlvbkluVGVtcGxhdGVcIiwgXCJJbnRlcnBvbGF0aW9uSW5KU1hcIlxuICAgICAgICAgICAgaWYgaW5wdXRbbGFzdEluZGV4XSA9PSBcIi9cIiAmJiAoXG4gICAgICAgICAgICAgIFRva2Vuc1ByZWNlZGluZ0V4cHJlc3Npb24udGVzdChsYXN0U2lnbmlmaWNhbnRUb2tlbikgfHxcbiAgICAgICAgICAgICAgS2V5d29yZHNXaXRoRXhwcmVzc2lvbkFmdGVyLnRlc3QobGFzdFNpZ25pZmljYW50VG9rZW4pXG4gICAgICAgICAgICApXG4gICAgICAgICAgICAgIFJlZ3VsYXJFeHByZXNzaW9uTGl0ZXJhbC5sYXN0SW5kZXggPSBsYXN0SW5kZXhcbiAgICAgICAgICAgICAgaWYgbWF0Y2ggPSBSZWd1bGFyRXhwcmVzc2lvbkxpdGVyYWwuZXhlYyhpbnB1dClcbiAgICAgICAgICAgICAgICBsYXN0SW5kZXggPSBSZWd1bGFyRXhwcmVzc2lvbkxpdGVyYWwubGFzdEluZGV4XG4gICAgICAgICAgICAgICAgbGFzdFNpZ25pZmljYW50VG9rZW4gPSBtYXRjaFswXVxuICAgICAgICAgICAgICAgIHBvc3RmaXhJbmNEZWMgPSB0cnVlXG4gICAgICAgICAgICAgICAgeWllbGQge1xuICAgICAgICAgICAgICAgICAgdHlwZTogXCJSZWd1bGFyRXhwcmVzc2lvbkxpdGVyYWxcIixcbiAgICAgICAgICAgICAgICAgIHZhbHVlOiBtYXRjaFswXSxcbiAgICAgICAgICAgICAgICAgIGNsb3NlZDogbWF0Y2hbMV0gIT0gdW5kZWZpbmVkICYmIG1hdGNoWzFdICE9IFwiXFxcXFwiLFxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBjb250aW51ZVxuXG4gICAgICAgICAgICBQdW5jdHVhdG9yLmxhc3RJbmRleCA9IGxhc3RJbmRleFxuICAgICAgICAgICAgaWYgbWF0Y2ggPSBQdW5jdHVhdG9yLmV4ZWMoaW5wdXQpXG4gICAgICAgICAgICAgIHB1bmN0dWF0b3IgPSBtYXRjaFswXVxuICAgICAgICAgICAgICBuZXh0TGFzdEluZGV4ID0gUHVuY3R1YXRvci5sYXN0SW5kZXhcbiAgICAgICAgICAgICAgbmV4dExhc3RTaWduaWZpY2FudFRva2VuID0gcHVuY3R1YXRvclxuXG4gICAgICAgICAgICAgIHN3aXRjaCBwdW5jdHVhdG9yXG4gICAgICAgICAgICAgICAgd2hlbiBcIihcIlxuICAgICAgICAgICAgICAgICAgaWYgbGFzdFNpZ25pZmljYW50VG9rZW4gPT0gXCI/Tm9uRXhwcmVzc2lvblBhcmVuS2V5d29yZFwiXG4gICAgICAgICAgICAgICAgICAgIHN0YWNrLnB1c2goe3RhZzogXCJKU05vbkV4cHJlc3Npb25QYXJlblwiLCBuZXN0aW5nOiBwYXJlbk5lc3Rpbmd9KVxuICAgICAgICAgICAgICAgICAgcGFyZW5OZXN0aW5nKytcbiAgICAgICAgICAgICAgICAgIHBvc3RmaXhJbmNEZWMgPSBmYWxzZVxuXG4gICAgICAgICAgICAgICAgd2hlbiBcIilcIlxuICAgICAgICAgICAgICAgICAgcGFyZW5OZXN0aW5nLS1cbiAgICAgICAgICAgICAgICAgIHBvc3RmaXhJbmNEZWMgPSB0cnVlXG4gICAgICAgICAgICAgICAgICBpZiBtb2RlLnRhZyA9PSBcIkpTTm9uRXhwcmVzc2lvblBhcmVuXCIgJiYgcGFyZW5OZXN0aW5nID09IG1vZGUubmVzdGluZ1xuICAgICAgICAgICAgICAgICAgICBzdGFjay5wb3AoKVxuICAgICAgICAgICAgICAgICAgICBuZXh0TGFzdFNpZ25pZmljYW50VG9rZW4gPSBcIj9Ob25FeHByZXNzaW9uUGFyZW5FbmRcIlxuICAgICAgICAgICAgICAgICAgICBwb3N0Zml4SW5jRGVjID0gZmFsc2VcblxuICAgICAgICAgICAgICAgIHdoZW4gXCJ7XCJcbiAgICAgICAgICAgICAgICAgIFB1bmN0dWF0b3IubGFzdEluZGV4ID0gMFxuICAgICAgICAgICAgICAgICAgaXNFeHByZXNzaW9uID1cbiAgICAgICAgICAgICAgICAgICAgIVRva2Vuc05vdFByZWNlZGluZ09iamVjdExpdGVyYWwudGVzdChsYXN0U2lnbmlmaWNhbnRUb2tlbikgJiYgKFxuICAgICAgICAgICAgICAgICAgICAgIFRva2Vuc1ByZWNlZGluZ0V4cHJlc3Npb24udGVzdChsYXN0U2lnbmlmaWNhbnRUb2tlbikgfHxcbiAgICAgICAgICAgICAgICAgICAgICBLZXl3b3Jkc1dpdGhFeHByZXNzaW9uQWZ0ZXIudGVzdChsYXN0U2lnbmlmaWNhbnRUb2tlbilcbiAgICAgICAgICAgICAgICAgICAgKVxuICAgICAgICAgICAgICAgICAgYnJhY2VzLnB1c2goaXNFeHByZXNzaW9uKVxuICAgICAgICAgICAgICAgICAgcG9zdGZpeEluY0RlYyA9IGZhbHNlXG5cbiAgICAgICAgICAgICAgICB3aGVuIFwifVwiXG4gICAgICAgICAgICAgICAgICBzd2l0Y2ggbW9kZS50YWdcbiAgICAgICAgICAgICAgICAgICAgd2hlbiBcIkludGVycG9sYXRpb25JblRlbXBsYXRlXCJcbiAgICAgICAgICAgICAgICAgICAgICBpZiBicmFjZXMubGVuZ3RoID09IG1vZGUubmVzdGluZ1xuICAgICAgICAgICAgICAgICAgICAgICAgVGVtcGxhdGUubGFzdEluZGV4ID0gbGFzdEluZGV4XG4gICAgICAgICAgICAgICAgICAgICAgICBtYXRjaCA9IFRlbXBsYXRlLmV4ZWMoaW5wdXQpXG4gICAgICAgICAgICAgICAgICAgICAgICBsYXN0SW5kZXggPSBUZW1wbGF0ZS5sYXN0SW5kZXhcbiAgICAgICAgICAgICAgICAgICAgICAgIGxhc3RTaWduaWZpY2FudFRva2VuID0gbWF0Y2hbMF1cbiAgICAgICAgICAgICAgICAgICAgICAgIGlmIG1hdGNoWzFdID09IFwiJHtcIlxuICAgICAgICAgICAgICAgICAgICAgICAgICBsYXN0U2lnbmlmaWNhbnRUb2tlbiA9IFwiP0ludGVycG9sYXRpb25JblRlbXBsYXRlXCJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgcG9zdGZpeEluY0RlYyA9IGZhbHNlXG4gICAgICAgICAgICAgICAgICAgICAgICAgIHlpZWxkIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB0eXBlOiBcIlRlbXBsYXRlTWlkZGxlXCIsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdmFsdWU6IG1hdGNoWzBdLFxuICAgICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICBlbHNlXG4gICAgICAgICAgICAgICAgICAgICAgICAgIHN0YWNrLnBvcCgpXG4gICAgICAgICAgICAgICAgICAgICAgICAgIHBvc3RmaXhJbmNEZWMgPSB0cnVlXG4gICAgICAgICAgICAgICAgICAgICAgICAgIHlpZWxkIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB0eXBlOiBcIlRlbXBsYXRlVGFpbFwiLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHZhbHVlOiBtYXRjaFswXSxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBjbG9zZWQ6IG1hdGNoWzFdID09IFwiYFwiLFxuICAgICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICBjb250aW51ZVxuICAgICAgICAgICAgICAgICAgICB3aGVuIFwiSW50ZXJwb2xhdGlvbkluSlNYXCJcbiAgICAgICAgICAgICAgICAgICAgICBpZiBicmFjZXMubGVuZ3RoID09IG1vZGUubmVzdGluZ1xuICAgICAgICAgICAgICAgICAgICAgICAgc3RhY2sucG9wKClcbiAgICAgICAgICAgICAgICAgICAgICAgIGxhc3RJbmRleCArPSAxXG4gICAgICAgICAgICAgICAgICAgICAgICBsYXN0U2lnbmlmaWNhbnRUb2tlbiA9IFwifVwiXG4gICAgICAgICAgICAgICAgICAgICAgICB5aWVsZCB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgIHR5cGU6IFwiSlNYUHVuY3R1YXRvclwiLFxuICAgICAgICAgICAgICAgICAgICAgICAgICB2YWx1ZTogXCJ9XCJcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgIGNvbnRpbnVlXG4gICAgICAgICAgICAgICAgICBwb3N0Zml4SW5jRGVjID0gYnJhY2VzLnBvcCgpXG4gICAgICAgICAgICAgICAgICBuZXh0TGFzdFNpZ25pZmljYW50VG9rZW4gPVxuICAgICAgICAgICAgICAgICAgICBpZiBwb3N0Zml4SW5jRGVjIHRoZW4gXCI/RXhwcmVzc2lvbkJyYWNlRW5kXCIgZWxzZSBcIn1cIlxuXG4gICAgICAgICAgICAgICAgd2hlbiBcIl1cIlxuICAgICAgICAgICAgICAgICAgcG9zdGZpeEluY0RlYyA9IHRydWVcblxuICAgICAgICAgICAgICAgIHdoZW4gXCIrK1wiLCBcIi0tXCJcbiAgICAgICAgICAgICAgICAgIG5leHRMYXN0U2lnbmlmaWNhbnRUb2tlbiA9XG4gICAgICAgICAgICAgICAgICAgIGlmIHBvc3RmaXhJbmNEZWMgdGhlbiBcIj9Qb3N0Zml4SW5jRGVjXCIgZWxzZSBcIj9VbmFyeUluY0RlY1wiXG5cbiAgICAgICAgICAgICAgICB3aGVuIFwiPFwiXG4gICAgICAgICAgICAgICAgICBpZiBqc3ggJiYgKFxuICAgICAgICAgICAgICAgICAgICBUb2tlbnNQcmVjZWRpbmdFeHByZXNzaW9uLnRlc3QobGFzdFNpZ25pZmljYW50VG9rZW4pIHx8XG4gICAgICAgICAgICAgICAgICAgIEtleXdvcmRzV2l0aEV4cHJlc3Npb25BZnRlci50ZXN0KGxhc3RTaWduaWZpY2FudFRva2VuKVxuICAgICAgICAgICAgICAgICAgKVxuICAgICAgICAgICAgICAgICAgICBzdGFjay5wdXNoKHt0YWc6IFwiSlNYVGFnXCJ9KVxuICAgICAgICAgICAgICAgICAgICBsYXN0SW5kZXggKz0gMVxuICAgICAgICAgICAgICAgICAgICBsYXN0U2lnbmlmaWNhbnRUb2tlbiA9IFwiPFwiXG4gICAgICAgICAgICAgICAgICAgIHlpZWxkIHtcbiAgICAgICAgICAgICAgICAgICAgICB0eXBlOiBcIkpTWFB1bmN0dWF0b3JcIixcbiAgICAgICAgICAgICAgICAgICAgICB2YWx1ZTogcHVuY3R1YXRvcixcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICBjb250aW51ZVxuICAgICAgICAgICAgICAgICAgcG9zdGZpeEluY0RlYyA9IGZhbHNlXG5cbiAgICAgICAgICAgICAgICBlbHNlXG4gICAgICAgICAgICAgICAgICBwb3N0Zml4SW5jRGVjID0gZmFsc2VcblxuICAgICAgICAgICAgICBsYXN0SW5kZXggPSBuZXh0TGFzdEluZGV4XG4gICAgICAgICAgICAgIGxhc3RTaWduaWZpY2FudFRva2VuID0gbmV4dExhc3RTaWduaWZpY2FudFRva2VuXG4gICAgICAgICAgICAgIHlpZWxkIHtcbiAgICAgICAgICAgICAgICB0eXBlOiBcIlB1bmN0dWF0b3JcIixcbiAgICAgICAgICAgICAgICB2YWx1ZTogcHVuY3R1YXRvcixcbiAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICBjb250aW51ZVxuXG4gICAgICAgICAgICBJZGVudGlmaWVyLmxhc3RJbmRleCA9IGxhc3RJbmRleFxuICAgICAgICAgICAgaWYgbWF0Y2ggPSBJZGVudGlmaWVyLmV4ZWMoaW5wdXQpXG4gICAgICAgICAgICAgIGxhc3RJbmRleCA9IElkZW50aWZpZXIubGFzdEluZGV4XG4gICAgICAgICAgICAgIG5leHRMYXN0U2lnbmlmaWNhbnRUb2tlbiA9IG1hdGNoWzBdXG4gICAgICAgICAgICAgIHN3aXRjaCBtYXRjaFswXVxuICAgICAgICAgICAgICAgIHdoZW4gXCJmb3JcIiwgXCJpZlwiLCBcIndoaWxlXCIsIFwid2l0aFwiXG4gICAgICAgICAgICAgICAgICBpZiBsYXN0U2lnbmlmaWNhbnRUb2tlbiAhPSBcIi5cIiAmJiBsYXN0U2lnbmlmaWNhbnRUb2tlbiAhPSBcIj8uXCJcbiAgICAgICAgICAgICAgICAgICAgbmV4dExhc3RTaWduaWZpY2FudFRva2VuID0gXCI/Tm9uRXhwcmVzc2lvblBhcmVuS2V5d29yZFwiXG4gICAgICAgICAgICAgIGxhc3RTaWduaWZpY2FudFRva2VuID0gbmV4dExhc3RTaWduaWZpY2FudFRva2VuXG4gICAgICAgICAgICAgIHBvc3RmaXhJbmNEZWMgPSAhS2V5d29yZHNXaXRoRXhwcmVzc2lvbkFmdGVyLnRlc3QobWF0Y2hbMF0pXG4gICAgICAgICAgICAgIHlpZWxkIHtcbiAgICAgICAgICAgICAgICB0eXBlOiBpZiBtYXRjaFsxXSA9PSBcIiNcIiB0aGVuIFwiUHJpdmF0ZUlkZW50aWZpZXJcIiBlbHNlIFwiSWRlbnRpZmllck5hbWVcIixcbiAgICAgICAgICAgICAgICB2YWx1ZTogbWF0Y2hbMF0sXG4gICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgY29udGludWVcblxuICAgICAgICAgICAgU3RyaW5nTGl0ZXJhbC5sYXN0SW5kZXggPSBsYXN0SW5kZXhcbiAgICAgICAgICAgIGlmIG1hdGNoID0gU3RyaW5nTGl0ZXJhbC5leGVjKGlucHV0KVxuICAgICAgICAgICAgICBsYXN0SW5kZXggPSBTdHJpbmdMaXRlcmFsLmxhc3RJbmRleFxuICAgICAgICAgICAgICBsYXN0U2lnbmlmaWNhbnRUb2tlbiA9IG1hdGNoWzBdXG4gICAgICAgICAgICAgIHBvc3RmaXhJbmNEZWMgPSB0cnVlXG4gICAgICAgICAgICAgIHlpZWxkIHtcbiAgICAgICAgICAgICAgICB0eXBlOiBcIlN0cmluZ0xpdGVyYWxcIixcbiAgICAgICAgICAgICAgICB2YWx1ZTogbWF0Y2hbMF0sXG4gICAgICAgICAgICAgICAgY2xvc2VkOiBtYXRjaFsyXSAhPSB1bmRlZmluZWQsXG4gICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgY29udGludWVcblxuICAgICAgICAgICAgTnVtZXJpY0xpdGVyYWwubGFzdEluZGV4ID0gbGFzdEluZGV4XG4gICAgICAgICAgICBpZiBtYXRjaCA9IE51bWVyaWNMaXRlcmFsLmV4ZWMoaW5wdXQpXG4gICAgICAgICAgICAgIGxhc3RJbmRleCA9IE51bWVyaWNMaXRlcmFsLmxhc3RJbmRleFxuICAgICAgICAgICAgICBsYXN0U2lnbmlmaWNhbnRUb2tlbiA9IG1hdGNoWzBdXG4gICAgICAgICAgICAgIHBvc3RmaXhJbmNEZWMgPSB0cnVlXG4gICAgICAgICAgICAgIHlpZWxkIHtcbiAgICAgICAgICAgICAgICB0eXBlOiBcIk51bWVyaWNMaXRlcmFsXCIsXG4gICAgICAgICAgICAgICAgdmFsdWU6IG1hdGNoWzBdLFxuICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgIGNvbnRpbnVlXG5cbiAgICAgICAgICAgIFRlbXBsYXRlLmxhc3RJbmRleCA9IGxhc3RJbmRleFxuICAgICAgICAgICAgaWYgbWF0Y2ggPSBUZW1wbGF0ZS5leGVjKGlucHV0KVxuICAgICAgICAgICAgICBsYXN0SW5kZXggPSBUZW1wbGF0ZS5sYXN0SW5kZXhcbiAgICAgICAgICAgICAgbGFzdFNpZ25pZmljYW50VG9rZW4gPSBtYXRjaFswXVxuICAgICAgICAgICAgICBpZiBtYXRjaFsxXSA9PSBcIiR7XCJcbiAgICAgICAgICAgICAgICBsYXN0U2lnbmlmaWNhbnRUb2tlbiA9IFwiP0ludGVycG9sYXRpb25JblRlbXBsYXRlXCJcbiAgICAgICAgICAgICAgICBzdGFjay5wdXNoKHt0YWc6IFwiSW50ZXJwb2xhdGlvbkluVGVtcGxhdGVcIiwgbmVzdGluZzogYnJhY2VzLmxlbmd0aH0pXG4gICAgICAgICAgICAgICAgcG9zdGZpeEluY0RlYyA9IGZhbHNlXG4gICAgICAgICAgICAgICAgeWllbGQge1xuICAgICAgICAgICAgICAgICAgdHlwZTogXCJUZW1wbGF0ZUhlYWRcIixcbiAgICAgICAgICAgICAgICAgIHZhbHVlOiBtYXRjaFswXSxcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgIGVsc2VcbiAgICAgICAgICAgICAgICBwb3N0Zml4SW5jRGVjID0gdHJ1ZVxuICAgICAgICAgICAgICAgIHlpZWxkIHtcbiAgICAgICAgICAgICAgICAgIHR5cGU6IFwiTm9TdWJzdGl0dXRpb25UZW1wbGF0ZVwiLFxuICAgICAgICAgICAgICAgICAgdmFsdWU6IG1hdGNoWzBdLFxuICAgICAgICAgICAgICAgICAgY2xvc2VkOiBtYXRjaFsxXSA9PSBcImBcIixcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgIGNvbnRpbnVlXG5cbiAgICAgICAgICB3aGVuIFwiSlNYVGFnXCIsIFwiSlNYVGFnRW5kXCJcbiAgICAgICAgICAgIEpTWFB1bmN0dWF0b3IubGFzdEluZGV4ID0gbGFzdEluZGV4XG4gICAgICAgICAgICBpZiBtYXRjaCA9IEpTWFB1bmN0dWF0b3IuZXhlYyhpbnB1dClcbiAgICAgICAgICAgICAgbGFzdEluZGV4ID0gSlNYUHVuY3R1YXRvci5sYXN0SW5kZXhcbiAgICAgICAgICAgICAgbmV4dExhc3RTaWduaWZpY2FudFRva2VuID0gbWF0Y2hbMF1cbiAgICAgICAgICAgICAgc3dpdGNoIG1hdGNoWzBdXG4gICAgICAgICAgICAgICAgd2hlbiBcIjxcIlxuICAgICAgICAgICAgICAgICAgc3RhY2sucHVzaCh7dGFnOiBcIkpTWFRhZ1wifSlcbiAgICAgICAgICAgICAgICB3aGVuIFwiPlwiXG4gICAgICAgICAgICAgICAgICBzdGFjay5wb3AoKVxuICAgICAgICAgICAgICAgICAgaWYgbGFzdFNpZ25pZmljYW50VG9rZW4gPT0gXCIvXCIgfHwgbW9kZS50YWcgPT0gXCJKU1hUYWdFbmRcIlxuICAgICAgICAgICAgICAgICAgICBuZXh0TGFzdFNpZ25pZmljYW50VG9rZW4gPSBcIj9KU1hcIlxuICAgICAgICAgICAgICAgICAgICBwb3N0Zml4SW5jRGVjID0gdHJ1ZVxuICAgICAgICAgICAgICAgICAgZWxzZVxuICAgICAgICAgICAgICAgICAgICBzdGFjay5wdXNoKHt0YWc6IFwiSlNYQ2hpbGRyZW5cIn0pXG4gICAgICAgICAgICAgICAgd2hlbiBcIntcIlxuICAgICAgICAgICAgICAgICAgc3RhY2sucHVzaCh7dGFnOiBcIkludGVycG9sYXRpb25JbkpTWFwiLCBuZXN0aW5nOiBicmFjZXMubGVuZ3RofSlcbiAgICAgICAgICAgICAgICAgIG5leHRMYXN0U2lnbmlmaWNhbnRUb2tlbiA9IFwiP0ludGVycG9sYXRpb25JbkpTWFwiXG4gICAgICAgICAgICAgICAgICBwb3N0Zml4SW5jRGVjID0gZmFsc2VcbiAgICAgICAgICAgICAgICB3aGVuIFwiL1wiXG4gICAgICAgICAgICAgICAgICBpZiBsYXN0U2lnbmlmaWNhbnRUb2tlbiA9PSBcIjxcIlxuICAgICAgICAgICAgICAgICAgICBzdGFjay5wb3AoKVxuICAgICAgICAgICAgICAgICAgICBpZiBzdGFja1tzdGFjay5sZW5ndGggLSAxXS50YWcgPT0gXCJKU1hDaGlsZHJlblwiXG4gICAgICAgICAgICAgICAgICAgICAgc3RhY2sucG9wKClcbiAgICAgICAgICAgICAgICAgICAgc3RhY2sucHVzaCh7dGFnOiBcIkpTWFRhZ0VuZFwifSlcbiAgICAgICAgICAgICAgbGFzdFNpZ25pZmljYW50VG9rZW4gPSBuZXh0TGFzdFNpZ25pZmljYW50VG9rZW5cbiAgICAgICAgICAgICAgeWllbGQge1xuICAgICAgICAgICAgICAgIHR5cGU6IFwiSlNYUHVuY3R1YXRvclwiLFxuICAgICAgICAgICAgICAgIHZhbHVlOiBtYXRjaFswXSxcbiAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICBjb250aW51ZVxuXG4gICAgICAgICAgICBKU1hJZGVudGlmaWVyLmxhc3RJbmRleCA9IGxhc3RJbmRleFxuICAgICAgICAgICAgaWYgbWF0Y2ggPSBKU1hJZGVudGlmaWVyLmV4ZWMoaW5wdXQpXG4gICAgICAgICAgICAgIGxhc3RJbmRleCA9IEpTWElkZW50aWZpZXIubGFzdEluZGV4XG4gICAgICAgICAgICAgIGxhc3RTaWduaWZpY2FudFRva2VuID0gbWF0Y2hbMF1cbiAgICAgICAgICAgICAgeWllbGQge1xuICAgICAgICAgICAgICAgIHR5cGU6IFwiSlNYSWRlbnRpZmllclwiLFxuICAgICAgICAgICAgICAgIHZhbHVlOiBtYXRjaFswXSxcbiAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICBjb250aW51ZVxuXG4gICAgICAgICAgICBKU1hTdHJpbmcubGFzdEluZGV4ID0gbGFzdEluZGV4XG4gICAgICAgICAgICBpZiBtYXRjaCA9IEpTWFN0cmluZy5leGVjKGlucHV0KVxuICAgICAgICAgICAgICBsYXN0SW5kZXggPSBKU1hTdHJpbmcubGFzdEluZGV4XG4gICAgICAgICAgICAgIGxhc3RTaWduaWZpY2FudFRva2VuID0gbWF0Y2hbMF1cbiAgICAgICAgICAgICAgeWllbGQge1xuICAgICAgICAgICAgICAgIHR5cGU6IFwiSlNYU3RyaW5nXCIsXG4gICAgICAgICAgICAgICAgdmFsdWU6IG1hdGNoWzBdLFxuICAgICAgICAgICAgICAgIGNsb3NlZDogbWF0Y2hbMl0gIT0gdW5kZWZpbmVkLFxuICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgIGNvbnRpbnVlXG5cbiAgICAgICAgICB3aGVuIFwiSlNYQ2hpbGRyZW5cIlxuICAgICAgICAgICAgSlNYVGV4dC5sYXN0SW5kZXggPSBsYXN0SW5kZXhcbiAgICAgICAgICAgIGlmIG1hdGNoID0gSlNYVGV4dC5leGVjKGlucHV0KVxuICAgICAgICAgICAgICBsYXN0SW5kZXggPSBKU1hUZXh0Lmxhc3RJbmRleFxuICAgICAgICAgICAgICBsYXN0U2lnbmlmaWNhbnRUb2tlbiA9IG1hdGNoWzBdXG4gICAgICAgICAgICAgIHlpZWxkIHtcbiAgICAgICAgICAgICAgICB0eXBlOiBcIkpTWFRleHRcIixcbiAgICAgICAgICAgICAgICB2YWx1ZTogbWF0Y2hbMF0sXG4gICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgY29udGludWVcblxuICAgICAgICAgICAgc3dpdGNoIGlucHV0W2xhc3RJbmRleF1cbiAgICAgICAgICAgICAgd2hlbiBcIjxcIlxuICAgICAgICAgICAgICAgIHN0YWNrLnB1c2goe3RhZzogXCJKU1hUYWdcIn0pXG4gICAgICAgICAgICAgICAgbGFzdEluZGV4KytcbiAgICAgICAgICAgICAgICBsYXN0U2lnbmlmaWNhbnRUb2tlbiA9IFwiPFwiXG4gICAgICAgICAgICAgICAgeWllbGQge1xuICAgICAgICAgICAgICAgICAgdHlwZTogXCJKU1hQdW5jdHVhdG9yXCIsXG4gICAgICAgICAgICAgICAgICB2YWx1ZTogXCI8XCIsXG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGNvbnRpbnVlXG4gICAgICAgICAgICAgIHdoZW4gXCJ7XCJcbiAgICAgICAgICAgICAgICBzdGFjay5wdXNoKHt0YWc6IFwiSW50ZXJwb2xhdGlvbkluSlNYXCIsIG5lc3Rpbmc6IGJyYWNlcy5sZW5ndGh9KVxuICAgICAgICAgICAgICAgIGxhc3RJbmRleCsrXG4gICAgICAgICAgICAgICAgbGFzdFNpZ25pZmljYW50VG9rZW4gPSBcIj9JbnRlcnBvbGF0aW9uSW5KU1hcIlxuICAgICAgICAgICAgICAgIHBvc3RmaXhJbmNEZWMgPSBmYWxzZVxuICAgICAgICAgICAgICAgIHlpZWxkIHtcbiAgICAgICAgICAgICAgICAgIHR5cGU6IFwiSlNYUHVuY3R1YXRvclwiLFxuICAgICAgICAgICAgICAgICAgdmFsdWU6IFwie1wiLFxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBjb250aW51ZVxuXG4gICAgICAgIFdoaXRlU3BhY2UubGFzdEluZGV4ID0gbGFzdEluZGV4XG4gICAgICAgIGlmIG1hdGNoID0gV2hpdGVTcGFjZS5leGVjKGlucHV0KVxuICAgICAgICAgIGxhc3RJbmRleCA9IFdoaXRlU3BhY2UubGFzdEluZGV4XG4gICAgICAgICAgeWllbGQge1xuICAgICAgICAgICAgdHlwZTogXCJXaGl0ZVNwYWNlXCIsXG4gICAgICAgICAgICB2YWx1ZTogbWF0Y2hbMF0sXG4gICAgICAgICAgfVxuICAgICAgICAgIGNvbnRpbnVlXG5cbiAgICAgICAgTGluZVRlcm1pbmF0b3JTZXF1ZW5jZS5sYXN0SW5kZXggPSBsYXN0SW5kZXhcbiAgICAgICAgaWYgbWF0Y2ggPSBMaW5lVGVybWluYXRvclNlcXVlbmNlLmV4ZWMoaW5wdXQpXG4gICAgICAgICAgbGFzdEluZGV4ID0gTGluZVRlcm1pbmF0b3JTZXF1ZW5jZS5sYXN0SW5kZXhcbiAgICAgICAgICBwb3N0Zml4SW5jRGVjID0gZmFsc2VcbiAgICAgICAgICBpZiBLZXl3b3Jkc1dpdGhOb0xpbmVUZXJtaW5hdG9yQWZ0ZXIudGVzdChsYXN0U2lnbmlmaWNhbnRUb2tlbilcbiAgICAgICAgICAgIGxhc3RTaWduaWZpY2FudFRva2VuID0gXCI/Tm9MaW5lVGVybWluYXRvckhlcmVcIlxuICAgICAgICAgIHlpZWxkIHtcbiAgICAgICAgICAgIHR5cGU6IFwiTGluZVRlcm1pbmF0b3JTZXF1ZW5jZVwiLFxuICAgICAgICAgICAgdmFsdWU6IG1hdGNoWzBdLFxuICAgICAgICAgIH1cbiAgICAgICAgICBjb250aW51ZVxuXG4gICAgICAgIE11bHRpTGluZUNvbW1lbnQubGFzdEluZGV4ID0gbGFzdEluZGV4XG4gICAgICAgIGlmIG1hdGNoID0gTXVsdGlMaW5lQ29tbWVudC5leGVjKGlucHV0KVxuICAgICAgICAgIGxhc3RJbmRleCA9IE11bHRpTGluZUNvbW1lbnQubGFzdEluZGV4XG4gICAgICAgICAgaWYgTmV3bGluZS50ZXN0KG1hdGNoWzBdKVxuICAgICAgICAgICAgcG9zdGZpeEluY0RlYyA9IGZhbHNlXG4gICAgICAgICAgICBpZiBLZXl3b3Jkc1dpdGhOb0xpbmVUZXJtaW5hdG9yQWZ0ZXIudGVzdChsYXN0U2lnbmlmaWNhbnRUb2tlbilcbiAgICAgICAgICAgICAgbGFzdFNpZ25pZmljYW50VG9rZW4gPSBcIj9Ob0xpbmVUZXJtaW5hdG9ySGVyZVwiXG4gICAgICAgICAgeWllbGQge1xuICAgICAgICAgICAgdHlwZTogXCJNdWx0aUxpbmVDb21tZW50XCIsXG4gICAgICAgICAgICB2YWx1ZTogbWF0Y2hbMF0sXG4gICAgICAgICAgICBjbG9zZWQ6IG1hdGNoWzFdICE9IHVuZGVmaW5lZCxcbiAgICAgICAgICB9XG4gICAgICAgICAgY29udGludWVcblxuICAgICAgICBTaW5nbGVMaW5lQ29tbWVudC5sYXN0SW5kZXggPSBsYXN0SW5kZXhcbiAgICAgICAgaWYgbWF0Y2ggPSBTaW5nbGVMaW5lQ29tbWVudC5leGVjKGlucHV0KVxuICAgICAgICAgIGxhc3RJbmRleCA9IFNpbmdsZUxpbmVDb21tZW50Lmxhc3RJbmRleFxuICAgICAgICAgIHBvc3RmaXhJbmNEZWMgPSBmYWxzZVxuICAgICAgICAgIHlpZWxkIHtcbiAgICAgICAgICAgIHR5cGU6IFwiU2luZ2xlTGluZUNvbW1lbnRcIixcbiAgICAgICAgICAgIHZhbHVlOiBtYXRjaFswXSxcbiAgICAgICAgICB9XG4gICAgICAgICAgY29udGludWVcblxuICAgICAgICBmaXJzdENvZGVQb2ludCA9IFN0cmluZy5mcm9tQ29kZVBvaW50KGlucHV0LmNvZGVQb2ludEF0KGxhc3RJbmRleCkpXG4gICAgICAgIGxhc3RJbmRleCArPSBmaXJzdENvZGVQb2ludC5sZW5ndGhcbiAgICAgICAgbGFzdFNpZ25pZmljYW50VG9rZW4gPSBmaXJzdENvZGVQb2ludFxuICAgICAgICBwb3N0Zml4SW5jRGVjID0gZmFsc2VcbiAgICAgICAgeWllbGQge1xuICAgICAgICAgIHR5cGU6IGlmIG1vZGUudGFnLnN0YXJ0c1dpdGgoXCJKU1hcIikgdGhlbiBcIkpTWEludmFsaWRcIiBlbHNlIFwiSW52YWxpZFwiLFxuICAgICAgICAgIHZhbHVlOiBmaXJzdENvZGVQb2ludCxcbiAgICAgICAgfVxuXG4gICAgICB1bmRlZmluZWRcbiAgICAjIyMjICAgICMjIyMgICAgIyMjIyAgICAjIyMjICAgICMjIyMgICAgIyMjIyAgICAjIyMjICAgICMjIyMgICAgIyMjIyAgICAjIyMjICAgICMjIyMgICAgIyMjIyAgICAjIyMjXG4gICAgIyMjIyAgICAjIyMjICAgICMjIyMgICAgIyMjIyAgICAjIyMjICAgICMjIyMgICAgIyMjIyAgICAjIyMjICAgICMjIyMgICAgIyMjIyAgICAjIyMjICAgICMjIyMgICAgIyMjI1xuICAgICAgICAjIyMjICAgICMjIyMgICAgIyMjIyAgICAjIyMjICAgICMjIyMgICAgIyMjIyAgICAjIyMjICAgICMjIyMgICAgIyMjIyAgICAjIyMjICAgICMjIyMgICAgIyMjIyAgICAjIyMjXG4gICAgICAgICMjIyMgICAgIyMjIyAgICAjIyMjICAgICMjIyMgICAgIyMjIyAgICAjIyMjICAgICMjIyMgICAgIyMjIyAgICAjIyMjICAgICMjIyMgICAgIyMjIyAgICAjIyMjICAgICMjIyNcbiAgICAjIyMjICAgICMjIyMgICAgIyMjIyAgICAjIyMjICAgICMjIyMgICAgIyMjIyAgICAjIyMjICAgICMjIyMgICAgIyMjIyAgICAjIyMjICAgICMjIyMgICAgIyMjIyAgICAjIyMjXG4gICAgIyMjIyAgICAjIyMjICAgICMjIyMgICAgIyMjIyAgICAjIyMjICAgICMjIyMgICAgIyMjIyAgICAjIyMjICAgICMjIyMgICAgIyMjIyAgICAjIyMjICAgICMjIyMgICAgIyMjI1xuICAgICAgICAjIyMjICAgICMjIyMgICAgIyMjIyAgICAjIyMjICAgICMjIyMgICAgIyMjIyAgICAjIyMjICAgICMjIyMgICAgIyMjIyAgICAjIyMjICAgICMjIyMgICAgIyMjIyAgICAjIyMjXG4gICAgICAgICMjIyMgICAgIyMjIyAgICAjIyMjICAgICMjIyMgICAgIyMjIyAgICAjIyMjICAgICMjIyMgICAgIyMjIyAgICAjIyMjICAgICMjIyMgICAgIyMjIyAgICAjIyMjICAgICMjIyNcbiAgICAjIyMjICAgICMjIyMgICAgIyMjIyAgICAjIyMjICAgICMjIyMgICAgIyMjIyAgICAjIyMjICAgICMjIyMgICAgIyMjIyAgICAjIyMjICAgICMjIyMgICAgIyMjIyAgICAjIyMjXG4gICAgIyMjIyAgICAjIyMjICAgICMjIyMgICAgIyMjIyAgICAjIyMjICAgICMjIyMgICAgIyMjIyAgICAjIyMjICAgICMjIyMgICAgIyMjIyAgICAjIyMjICAgICMjIyMgICAgIyMjI1xuICAgICAgICAjIyMjICAgICMjIyMgICAgIyMjIyAgICAjIyMjICAgICMjIyMgICAgIyMjIyAgICAjIyMjICAgICMjIyMgICAgIyMjIyAgICAjIyMjICAgICMjIyMgICAgIyMjIyAgICAjIyMjXG4gICAgICAgICMjIyMgICAgIyMjIyAgICAjIyMjICAgICMjIyMgICAgIyMjIyAgICAjIyMjICAgICMjIyMgICAgIyMjIyAgICAjIyMjICAgICMjIyMgICAgIyMjIyAgICAjIyMjICAgICMjIyNcblxuICAgICMtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4gICAgd2Fsa19qc190b2tlbnMgPSAoIHNvdXJjZSApIC0+IHlpZWxkIGZyb20ganNUb2tlbnMgc291cmNlXG5cbiAgICAjLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuICAgIHdhbGtfZXNzZW50aWFsX2pzX3Rva2VucyA9ICggc291cmNlICkgLT5cbiAgICAgIGZvciB0b2tlbiBmcm9tIGpzVG9rZW5zIHNvdXJjZVxuICAgICAgICBjb250aW51ZSBpZiB0b2tlbi50eXBlIGlzICdXaGl0ZVNwYWNlJ1xuICAgICAgICBjb250aW51ZSBpZiB0b2tlbi50eXBlIGlzICdNdWx0aUxpbmVDb21tZW50J1xuICAgICAgICBjb250aW51ZSBpZiB0b2tlbi50eXBlIGlzICdTaW5nbGVMaW5lQ29tbWVudCdcbiAgICAgICAgeWllbGQgdG9rZW5cbiAgICAgIHJldHVybiBudWxsXG5cbiAgICAjLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuICAgIHN1bW1hcml6ZSA9ICggdG9rZW5zLCBqb2luZXIgPSAnJiYmJyApIC0+XG4gICAgICByZXR1cm4gam9pbmVyICsgKCAoIHQudHlwZSArICggcnByX3N0cmluZyB0LnZhbHVlICkgZm9yIHQgZnJvbSB0b2tlbnMgKS5qb2luIGpvaW5lciApICsgam9pbmVyXG5cbiAgICAjLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLlxuICAgIHJldHVybiBleHBvcnRzID0ge1xuICAgICAgd2Fsa19qc190b2tlbnMsXG4gICAgICB3YWxrX2Vzc2VudGlhbF9qc190b2tlbnMsXG4gICAgICBzdW1tYXJpemUsXG4gICAgICBpbnRlcm5hbHM6IHtcbiAgICAgICAgSGFzaGJhbmdDb21tZW50LFxuICAgICAgICBJZGVudGlmaWVyLFxuICAgICAgICBKU1hJZGVudGlmaWVyLFxuICAgICAgICBKU1hQdW5jdHVhdG9yLFxuICAgICAgICBKU1hTdHJpbmcsXG4gICAgICAgIEpTWFRleHQsXG4gICAgICAgIEtleXdvcmRzV2l0aEV4cHJlc3Npb25BZnRlcixcbiAgICAgICAgS2V5d29yZHNXaXRoTm9MaW5lVGVybWluYXRvckFmdGVyLFxuICAgICAgICBMaW5lVGVybWluYXRvclNlcXVlbmNlLFxuICAgICAgICBNdWx0aUxpbmVDb21tZW50LFxuICAgICAgICBOZXdsaW5lLFxuICAgICAgICBOdW1lcmljTGl0ZXJhbCxcbiAgICAgICAgUHVuY3R1YXRvcixcbiAgICAgICAgUmVndWxhckV4cHJlc3Npb25MaXRlcmFsLFxuICAgICAgICBTaW5nbGVMaW5lQ29tbWVudCxcbiAgICAgICAgU3RyaW5nTGl0ZXJhbCxcbiAgICAgICAgVGVtcGxhdGUsXG4gICAgICAgIFRva2Vuc05vdFByZWNlZGluZ09iamVjdExpdGVyYWwsXG4gICAgICAgIFRva2Vuc1ByZWNlZGluZ0V4cHJlc3Npb24sXG4gICAgICAgIFdoaXRlU3BhY2UsIH0sIH1cblxuIz09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09XG5PYmplY3QuYXNzaWduIG1vZHVsZS5leHBvcnRzLCBCUklDU1xuXG5cblxuXG4iXX0=
