(function() {
  /* thx to https://raw.githubusercontent.com/lydell/js-tokens/d1743a121103f970b9d2e807469cba02d24b852a/index.coffee */
  var HashbangComment, Identifier, JSXIdentifier, JSXPunctuator, JSXString, JSXText, KeywordsWithExpressionAfter, KeywordsWithNoLineTerminatorAfter, LineTerminatorSequence, MultiLineComment, Newline, NumericLiteral, Punctuator, RegularExpressionLiteral, SingleLineComment, StringLiteral, Template, TokensNotPrecedingObjectLiteral, TokensPrecedingExpression, WhiteSpace, jsTokens;

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

}).call(this);

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vc3JjL19qcy10b2tlbnMuY29mZmVlIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUN1SDtFQUFBO0FBQUEsTUFBQSxlQUFBLEVBQUEsVUFBQSxFQUFBLGFBQUEsRUFBQSxhQUFBLEVBQUEsU0FBQSxFQUFBLE9BQUEsRUFBQSwyQkFBQSxFQUFBLGlDQUFBLEVBQUEsc0JBQUEsRUFBQSxnQkFBQSxFQUFBLE9BQUEsRUFBQSxjQUFBLEVBQUEsVUFBQSxFQUFBLHdCQUFBLEVBQUEsaUJBQUEsRUFBQSxhQUFBLEVBQUEsUUFBQSxFQUFBLCtCQUFBLEVBQUEseUJBQUEsRUFBQSxVQUFBLEVBQUEsUUFBQTs7Ozs7Ozs7OztFQVl2SCx3QkFBQSxHQUEyQjs7RUF1QjNCLFVBQUEsR0FBYSx5SEFuQzBHOzs7RUE4RHZILFVBQUEsR0FBYTs7RUFZYixhQUFBLEdBQWdCOztFQVloQixjQUFBLEdBQWlCOztFQThCakIsUUFBQSxHQUFXOztFQVlYLFVBQUEsR0FBYTs7RUFJYixzQkFBQSxHQUF5Qjs7RUFNekIsZ0JBQUEsR0FBbUI7O0VBVW5CLGlCQUFBLEdBQW9COztFQUlwQixlQUFBLEdBQWtCOztFQUlsQixhQUFBLEdBQWdCOztFQU1oQixhQUFBLEdBQWdCOztFQUtoQixTQUFBLEdBQVk7O0VBVVosT0FBQSxHQUFVOztFQUlWLHlCQUFBLEdBQTRCOztFQVk1QiwrQkFBQSxHQUFrQzs7RUFZbEMsMkJBQUEsR0FBOEI7O0VBSTlCLGlDQUFBLEdBQW9DOztFQUlwQyxPQUFBLEdBQVUsTUFBQSxDQUFPLHNCQUFzQixDQUFDLE1BQTlCOztFQUVWLE1BQU0sQ0FBQyxPQUFQLEdBQWlCLFFBQUEsR0FBVyxTQUFBLENBQUMsS0FBRCxFQUFRLENBQUMsR0FBQSxHQUFNLEtBQVAsSUFBZ0IsQ0FBQSxDQUF4QixDQUFBO0FBQzVCLFFBQUEsTUFBQSxFQUFBLGNBQUEsRUFBQSxZQUFBLEVBQUEsU0FBQSxFQUFBLG9CQUFBLEVBQUEs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QUM5QixhQUFBLEdBQWdCO1FBQ2hCLE1BQU0sQ0FBQTtVQUNKLElBQUEsRUFBTSxtQkFERjtVQUVKLEtBQUEsRUFBTyxLQUFLLENBQUMsQ0FBRDtRQUZSLENBQUE7QUFJTixpQkFQRjs7TUFTQSxjQUFBLEdBQWlCLE1BQU0sQ0FBQyxhQUFQLENBQXFCLEtBQUssQ0FBQyxXQUFOLENBQWtCLFNBQWxCLENBQXJCO01BQ2pCLFNBQUEsSUFBYSxjQUFjLENBQUM7TUFDNUIsb0JBQUEsR0FBdUI7TUFDdkIsYUFBQSxHQUFnQjtNQUNoQixNQUFNLENBQUE7UUFDSixJQUFBLEVBQVMsSUFBSSxDQUFDLEdBQUcsQ0FBQyxVQUFULENBQW9CLEtBQXBCLENBQUgsR0FBbUMsWUFBbkMsR0FBcUQsU0FEdkQ7UUFFSixLQUFBLEVBQU87TUFGSCxDQUFBO0lBN1RSO1dBa1VBO0VBbFYwQjtBQXZOMkYiLCJzb3VyY2VzQ29udGVudCI6WyJcbiMjIyB0aHggdG8gaHR0cHM6Ly9yYXcuZ2l0aHVidXNlcmNvbnRlbnQuY29tL2x5ZGVsbC9qcy10b2tlbnMvZDE3NDNhMTIxMTAzZjk3MGI5ZDJlODA3NDY5Y2JhMDJkMjRiODUyYS9pbmRleC5jb2ZmZWUgIyMjXG5cblxuIyBDb3B5cmlnaHQgMjAxNCwgMjAxNSwgMjAxNiwgMjAxNywgMjAxOCwgMjAxOSwgMjAyMCwgMjAyMSwgMjAyMiwgMjAyMyBTaW1vbiBMeWRlbGxcbiMgTGljZW5zZTogTUlULlxuXG4jIGh0dHBzOi8vdGMzOS5lcy9lY21hMjYyLyNzZWMtbGV4aWNhbC1ncmFtbWFyXG4jIGh0dHBzOi8vbWF0aGlhc2J5bmVucy5iZS9ub3Rlcy9qYXZhc2NyaXB0LWlkZW50aWZpZXJzXG4jIGh0dHBzOi8vZ2l0aHViLmNvbS90YzM5L3Byb3Bvc2FsLXJlZ2V4cC11bmljb2RlLXByb3BlcnR5LWVzY2FwZXMvI290aGVyLWV4YW1wbGVzXG4jIGh0dHBzOi8vdW5pY29kZS5vcmcvcmVwb3J0cy90cjMxLyNCYWNrd2FyZF9Db21wYXRpYmlsaXR5XG4jIGh0dHBzOi8vc3RhY2tvdmVyZmxvdy5jb20vYS8yNzEyMDExMC8yMDEwNjE2XG5cblJlZ3VsYXJFeHByZXNzaW9uTGl0ZXJhbCA9IC8vL1xuICAvKD8hWyAqIC8gXSlcbiAgKD86XG4gICAgXFxbXG4gICAgKD86XG4gICAgICBbXiBcXF0gXFxcXCBcXG4gXFxyIFxcdTIwMjggXFx1MjAyOSBdK1xuICAgICAgfFxuICAgICAgXFxcXC5cbiAgICApKlxuICAgIFxcXT9cbiAgICB8XG4gICAgW14gLyBbIFxcXFwgXFxuIFxcciBcXHUyMDI4IFxcdTIwMjkgXStcbiAgICB8XG4gICAgXFxcXC5cbiAgKSpcbiAgKFxuICAgIC9cbiAgICBbICQgXyBcXHUyMDBDIFxcdTIwMEQgXFxwe0lEX0NvbnRpbnVlfSBdKlxuICAgIHxcbiAgICBcXFxcXG4gICk/XG4vLy95dVxuXG5QdW5jdHVhdG9yID0gLy8vXG4gIC0tIHwgXFwrXFwrXG4gIHxcbiAgPT5cbiAgfFxuICBcXC57M31cbiAgfFxuICBcXD8/XFwuICg/IVxcZClcbiAgfFxuICAoPzpcbiAgICAmJiB8IFxcfFxcfCB8IFxcP1xcP1xuICAgIHxcbiAgICBbICsgXFwtICUgJiB8IF4gXVxuICAgIHxcbiAgICBcXCp7MSwyfVxuICAgIHxcbiAgICA8ezEsMn0gfCA+ezEsM31cbiAgICB8XG4gICAgIT0/IHwgPXsxLDJ9XG4gICAgfFxuICAgIC8oPyFbIC8gKiBdKVxuICApPT9cbiAgfFxuICBbID8gfiAsIDogOyBbIFxcXSAoICkgeyB9IF1cbi8vL3lcblxuIyBOb3RlOiBgXFx4MjNgIGlzIGAjYC4gVGhlIGVzY2FwZSBpcyB1c2VkIHNpbmNlIFZTQ29kZeKAmXMgc3ludGF4IGhpZ2hsaWdodGluZyBicmVha3Mgb3RoZXJ3aXNlLlxuSWRlbnRpZmllciA9IC8vL1xuICAoXFx4MjM/KVxuICAoPz1bICQgXyBcXHB7SURfU3RhcnR9IFxcXFwgXSlcbiAgKD86XG4gICAgWyAkIF8gXFx1MjAwQyBcXHUyMDBEIFxccHtJRF9Db250aW51ZX0gXStcbiAgICB8XG4gICAgXFxcXHVbIFxcZCBhLWYgQS1GIF17NH1cbiAgICB8XG4gICAgXFxcXHVcXHtbIFxcZCBhLWYgQS1GIF0rXFx9XG4gICkrXG4vLy95dVxuXG5TdHJpbmdMaXRlcmFsID0gLy8vXG4gIChbICcgXCIgXSlcbiAgKD86XG4gICAgW14gJyBcIiBcXFxcIFxcbiBcXHIgXStcbiAgICB8XG4gICAgKD8hIFxcMSApWyAnIFwiIF1cbiAgICB8XG4gICAgXFxcXCg/OiBcXHJcXG4gfCBbXl0gKVxuICApKlxuICAoXFwxKT9cbi8vL3lcblxuTnVtZXJpY0xpdGVyYWwgPSAvLy9cbiAgKD86XG4gICAgMFt4WF1bIFxcZCBhLWYgQS1GIF0gKD86IF8/IFsgXFxkIGEtZiBBLUYgXSApKlxuICAgIHxcbiAgICAwW29PXVswLTddICg/OiBfPyBbMC03XSApKlxuICAgIHxcbiAgICAwW2JCXVswMV0gKD86IF8/IFswMV0gKSpcbiAgKW4/XG4gIHxcbiAgMG5cbiAgfFxuICBbMS05XSg/OiBfPyBcXGQgKSpuXG4gIHxcbiAgKD86XG4gICAgKD86XG4gICAgICAwKD8hXFxkKVxuICAgICAgfFxuICAgICAgMFxcZCpbODldXFxkKlxuICAgICAgfFxuICAgICAgWzEtOV0oPzogXz8gXFxkICkqXG4gICAgKVxuICAgICg/OiBcXC4oPzogXFxkICg/OiBfPyBcXGQgKSogKT8gKT9cbiAgICB8XG4gICAgXFwuXFxkICg/OiBfPyBcXGQgKSpcbiAgKVxuICAoPzogW2VFXVsrLV0/XFxkICg/OiBfPyBcXGQgKSogKT9cbiAgfFxuICAwWzAtN10rXG4vLy95XG5cblRlbXBsYXRlID0gLy8vXG4gIFsgYCB9IF1cbiAgKD86XG4gICAgW14gYCBcXFxcICQgXStcbiAgICB8XG4gICAgXFxcXFteXVxuICAgIHxcbiAgICBcXCQoPyFcXHspXG4gICkqXG4gICggYCB8IFxcJFxceyApP1xuLy8veVxuXG5XaGl0ZVNwYWNlID0gLy8vXG4gIFsgXFx0IFxcdiBcXGYgXFx1ZmVmZiBcXHB7WnN9IF0rXG4vLy95dVxuXG5MaW5lVGVybWluYXRvclNlcXVlbmNlID0gLy8vXG4gIFxccj9cXG5cbiAgfFxuICBbIFxcciBcXHUyMDI4IFxcdTIwMjkgXVxuLy8veVxuXG5NdWx0aUxpbmVDb21tZW50ID0gLy8vXG4gIC9cXCpcbiAgKD86XG4gICAgW14qXStcbiAgICB8XG4gICAgXFwqKD8hLylcbiAgKSpcbiAgKFxcKi8pP1xuLy8veVxuXG5TaW5nbGVMaW5lQ29tbWVudCA9IC8vL1xuICAvLy4qXG4vLy95XG5cbkhhc2hiYW5nQ29tbWVudCA9IC8vL1xuICBeIyEuKlxuLy8vXG5cbkpTWFB1bmN0dWF0b3IgPSAvLy9cbiAgWyA8ID4gLiA6ID0geyB9IF1cbiAgfFxuICAvKD8hWyAvICogXSlcbi8vL3lcblxuSlNYSWRlbnRpZmllciA9IC8vL1xuICBbICQgXyBcXHB7SURfU3RhcnR9IF1cbiAgWyAkIF8gXFx1MjAwQyBcXHUyMDBEIFxccHtJRF9Db250aW51ZX0gLSBdKlxuLy8veXVcblxuSlNYU3RyaW5nID0gLy8vXG4gIChbICcgXCIgXSlcbiAgKD86XG4gICAgW14gJyBcIl0rXG4gICAgfFxuICAgICg/ISBcXDEgKVsgJyBcIiBdXG4gICkqXG4gIChcXDEpP1xuLy8veVxuXG5KU1hUZXh0ID0gLy8vXG4gIFteIDwgPiB7IH0gXStcbi8vL3lcblxuVG9rZW5zUHJlY2VkaW5nRXhwcmVzc2lvbiA9IC8vL1xuICBeKD86XG4gICAgWy8rLV1cbiAgICB8XG4gICAgXFwuezN9XG4gICAgfFxuICAgIFxcPyg/OkludGVycG9sYXRpb25Jbig/OkpTWHxUZW1wbGF0ZSl8Tm9MaW5lVGVybWluYXRvckhlcmV8Tm9uRXhwcmVzc2lvblBhcmVuRW5kfFVuYXJ5SW5jRGVjKVxuICApPyRcbiAgfFxuICBbIHsgfSAoIFsgLCA7IDwgPiA9ICogJSAmIHwgXiAhIH4gPyA6IF0kXG4vLy9cblxuVG9rZW5zTm90UHJlY2VkaW5nT2JqZWN0TGl0ZXJhbCA9IC8vL1xuICBeKD86XG4gICAgPT5cbiAgICB8XG4gICAgWyA7IFxcXSApIHsgfSBdXG4gICAgfFxuICAgIGVsc2VcbiAgICB8XG4gICAgXFw/KD86Tm9MaW5lVGVybWluYXRvckhlcmV8Tm9uRXhwcmVzc2lvblBhcmVuRW5kKVxuICApPyRcbi8vL1xuXG5LZXl3b3Jkc1dpdGhFeHByZXNzaW9uQWZ0ZXIgPSAvLy9cbiAgXig/OmF3YWl0fGNhc2V8ZGVmYXVsdHxkZWxldGV8ZG98ZWxzZXxpbnN0YW5jZW9mfG5ld3xyZXR1cm58dGhyb3d8dHlwZW9mfHZvaWR8eWllbGQpJFxuLy8vXG5cbktleXdvcmRzV2l0aE5vTGluZVRlcm1pbmF0b3JBZnRlciA9IC8vL1xuICBeKD86cmV0dXJufHRocm93fHlpZWxkKSRcbi8vL1xuXG5OZXdsaW5lID0gUmVnRXhwKExpbmVUZXJtaW5hdG9yU2VxdWVuY2Uuc291cmNlKVxuXG5tb2R1bGUuZXhwb3J0cyA9IGpzVG9rZW5zID0gKGlucHV0LCB7anN4ID0gZmFsc2V9ID0ge30pIC0+XG4gIHtsZW5ndGh9ID0gaW5wdXRcbiAgbGFzdEluZGV4ID0gMFxuICBsYXN0U2lnbmlmaWNhbnRUb2tlbiA9IFwiXCJcbiAgc3RhY2sgPSBbe3RhZzogXCJKU1wifV1cbiAgYnJhY2VzID0gW11cbiAgcGFyZW5OZXN0aW5nID0gMFxuICBwb3N0Zml4SW5jRGVjID0gZmFsc2VcblxuICBpZiBtYXRjaCA9IEhhc2hiYW5nQ29tbWVudC5leGVjKGlucHV0KVxuICAgIHlpZWxkIHtcbiAgICAgIHR5cGU6IFwiSGFzaGJhbmdDb21tZW50XCIsXG4gICAgICB2YWx1ZTogbWF0Y2hbMF0sXG4gICAgfVxuICAgIGxhc3RJbmRleCA9IG1hdGNoWzBdLmxlbmd0aFxuXG4gIHdoaWxlIGxhc3RJbmRleCA8IGxlbmd0aFxuICAgIG1vZGUgPSBzdGFja1tzdGFjay5sZW5ndGggLSAxXVxuXG4gICAgc3dpdGNoIG1vZGUudGFnXG4gICAgICB3aGVuIFwiSlNcIiwgXCJKU05vbkV4cHJlc3Npb25QYXJlblwiLCBcIkludGVycG9sYXRpb25JblRlbXBsYXRlXCIsIFwiSW50ZXJwb2xhdGlvbkluSlNYXCJcbiAgICAgICAgaWYgaW5wdXRbbGFzdEluZGV4XSA9PSBcIi9cIiAmJiAoXG4gICAgICAgICAgVG9rZW5zUHJlY2VkaW5nRXhwcmVzc2lvbi50ZXN0KGxhc3RTaWduaWZpY2FudFRva2VuKSB8fFxuICAgICAgICAgIEtleXdvcmRzV2l0aEV4cHJlc3Npb25BZnRlci50ZXN0KGxhc3RTaWduaWZpY2FudFRva2VuKVxuICAgICAgICApXG4gICAgICAgICAgUmVndWxhckV4cHJlc3Npb25MaXRlcmFsLmxhc3RJbmRleCA9IGxhc3RJbmRleFxuICAgICAgICAgIGlmIG1hdGNoID0gUmVndWxhckV4cHJlc3Npb25MaXRlcmFsLmV4ZWMoaW5wdXQpXG4gICAgICAgICAgICBsYXN0SW5kZXggPSBSZWd1bGFyRXhwcmVzc2lvbkxpdGVyYWwubGFzdEluZGV4XG4gICAgICAgICAgICBsYXN0U2lnbmlmaWNhbnRUb2tlbiA9IG1hdGNoWzBdXG4gICAgICAgICAgICBwb3N0Zml4SW5jRGVjID0gdHJ1ZVxuICAgICAgICAgICAgeWllbGQge1xuICAgICAgICAgICAgICB0eXBlOiBcIlJlZ3VsYXJFeHByZXNzaW9uTGl0ZXJhbFwiLFxuICAgICAgICAgICAgICB2YWx1ZTogbWF0Y2hbMF0sXG4gICAgICAgICAgICAgIGNsb3NlZDogbWF0Y2hbMV0gIT0gdW5kZWZpbmVkICYmIG1hdGNoWzFdICE9IFwiXFxcXFwiLFxuICAgICAgICAgICAgfVxuICAgICAgICAgICAgY29udGludWVcblxuICAgICAgICBQdW5jdHVhdG9yLmxhc3RJbmRleCA9IGxhc3RJbmRleFxuICAgICAgICBpZiBtYXRjaCA9IFB1bmN0dWF0b3IuZXhlYyhpbnB1dClcbiAgICAgICAgICBwdW5jdHVhdG9yID0gbWF0Y2hbMF1cbiAgICAgICAgICBuZXh0TGFzdEluZGV4ID0gUHVuY3R1YXRvci5sYXN0SW5kZXhcbiAgICAgICAgICBuZXh0TGFzdFNpZ25pZmljYW50VG9rZW4gPSBwdW5jdHVhdG9yXG5cbiAgICAgICAgICBzd2l0Y2ggcHVuY3R1YXRvclxuICAgICAgICAgICAgd2hlbiBcIihcIlxuICAgICAgICAgICAgICBpZiBsYXN0U2lnbmlmaWNhbnRUb2tlbiA9PSBcIj9Ob25FeHByZXNzaW9uUGFyZW5LZXl3b3JkXCJcbiAgICAgICAgICAgICAgICBzdGFjay5wdXNoKHt0YWc6IFwiSlNOb25FeHByZXNzaW9uUGFyZW5cIiwgbmVzdGluZzogcGFyZW5OZXN0aW5nfSlcbiAgICAgICAgICAgICAgcGFyZW5OZXN0aW5nKytcbiAgICAgICAgICAgICAgcG9zdGZpeEluY0RlYyA9IGZhbHNlXG5cbiAgICAgICAgICAgIHdoZW4gXCIpXCJcbiAgICAgICAgICAgICAgcGFyZW5OZXN0aW5nLS1cbiAgICAgICAgICAgICAgcG9zdGZpeEluY0RlYyA9IHRydWVcbiAgICAgICAgICAgICAgaWYgbW9kZS50YWcgPT0gXCJKU05vbkV4cHJlc3Npb25QYXJlblwiICYmIHBhcmVuTmVzdGluZyA9PSBtb2RlLm5lc3RpbmdcbiAgICAgICAgICAgICAgICBzdGFjay5wb3AoKVxuICAgICAgICAgICAgICAgIG5leHRMYXN0U2lnbmlmaWNhbnRUb2tlbiA9IFwiP05vbkV4cHJlc3Npb25QYXJlbkVuZFwiXG4gICAgICAgICAgICAgICAgcG9zdGZpeEluY0RlYyA9IGZhbHNlXG5cbiAgICAgICAgICAgIHdoZW4gXCJ7XCJcbiAgICAgICAgICAgICAgUHVuY3R1YXRvci5sYXN0SW5kZXggPSAwXG4gICAgICAgICAgICAgIGlzRXhwcmVzc2lvbiA9XG4gICAgICAgICAgICAgICAgIVRva2Vuc05vdFByZWNlZGluZ09iamVjdExpdGVyYWwudGVzdChsYXN0U2lnbmlmaWNhbnRUb2tlbikgJiYgKFxuICAgICAgICAgICAgICAgICAgVG9rZW5zUHJlY2VkaW5nRXhwcmVzc2lvbi50ZXN0KGxhc3RTaWduaWZpY2FudFRva2VuKSB8fFxuICAgICAgICAgICAgICAgICAgS2V5d29yZHNXaXRoRXhwcmVzc2lvbkFmdGVyLnRlc3QobGFzdFNpZ25pZmljYW50VG9rZW4pXG4gICAgICAgICAgICAgICAgKVxuICAgICAgICAgICAgICBicmFjZXMucHVzaChpc0V4cHJlc3Npb24pXG4gICAgICAgICAgICAgIHBvc3RmaXhJbmNEZWMgPSBmYWxzZVxuXG4gICAgICAgICAgICB3aGVuIFwifVwiXG4gICAgICAgICAgICAgIHN3aXRjaCBtb2RlLnRhZ1xuICAgICAgICAgICAgICAgIHdoZW4gXCJJbnRlcnBvbGF0aW9uSW5UZW1wbGF0ZVwiXG4gICAgICAgICAgICAgICAgICBpZiBicmFjZXMubGVuZ3RoID09IG1vZGUubmVzdGluZ1xuICAgICAgICAgICAgICAgICAgICBUZW1wbGF0ZS5sYXN0SW5kZXggPSBsYXN0SW5kZXhcbiAgICAgICAgICAgICAgICAgICAgbWF0Y2ggPSBUZW1wbGF0ZS5leGVjKGlucHV0KVxuICAgICAgICAgICAgICAgICAgICBsYXN0SW5kZXggPSBUZW1wbGF0ZS5sYXN0SW5kZXhcbiAgICAgICAgICAgICAgICAgICAgbGFzdFNpZ25pZmljYW50VG9rZW4gPSBtYXRjaFswXVxuICAgICAgICAgICAgICAgICAgICBpZiBtYXRjaFsxXSA9PSBcIiR7XCJcbiAgICAgICAgICAgICAgICAgICAgICBsYXN0U2lnbmlmaWNhbnRUb2tlbiA9IFwiP0ludGVycG9sYXRpb25JblRlbXBsYXRlXCJcbiAgICAgICAgICAgICAgICAgICAgICBwb3N0Zml4SW5jRGVjID0gZmFsc2VcbiAgICAgICAgICAgICAgICAgICAgICB5aWVsZCB7XG4gICAgICAgICAgICAgICAgICAgICAgICB0eXBlOiBcIlRlbXBsYXRlTWlkZGxlXCIsXG4gICAgICAgICAgICAgICAgICAgICAgICB2YWx1ZTogbWF0Y2hbMF0sXG4gICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICBlbHNlXG4gICAgICAgICAgICAgICAgICAgICAgc3RhY2sucG9wKClcbiAgICAgICAgICAgICAgICAgICAgICBwb3N0Zml4SW5jRGVjID0gdHJ1ZVxuICAgICAgICAgICAgICAgICAgICAgIHlpZWxkIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHR5cGU6IFwiVGVtcGxhdGVUYWlsXCIsXG4gICAgICAgICAgICAgICAgICAgICAgICB2YWx1ZTogbWF0Y2hbMF0sXG4gICAgICAgICAgICAgICAgICAgICAgICBjbG9zZWQ6IG1hdGNoWzFdID09IFwiYFwiLFxuICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgY29udGludWVcbiAgICAgICAgICAgICAgICB3aGVuIFwiSW50ZXJwb2xhdGlvbkluSlNYXCJcbiAgICAgICAgICAgICAgICAgIGlmIGJyYWNlcy5sZW5ndGggPT0gbW9kZS5uZXN0aW5nXG4gICAgICAgICAgICAgICAgICAgIHN0YWNrLnBvcCgpXG4gICAgICAgICAgICAgICAgICAgIGxhc3RJbmRleCArPSAxXG4gICAgICAgICAgICAgICAgICAgIGxhc3RTaWduaWZpY2FudFRva2VuID0gXCJ9XCJcbiAgICAgICAgICAgICAgICAgICAgeWllbGQge1xuICAgICAgICAgICAgICAgICAgICAgIHR5cGU6IFwiSlNYUHVuY3R1YXRvclwiLFxuICAgICAgICAgICAgICAgICAgICAgIHZhbHVlOiBcIn1cIlxuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIGNvbnRpbnVlXG4gICAgICAgICAgICAgIHBvc3RmaXhJbmNEZWMgPSBicmFjZXMucG9wKClcbiAgICAgICAgICAgICAgbmV4dExhc3RTaWduaWZpY2FudFRva2VuID1cbiAgICAgICAgICAgICAgICBpZiBwb3N0Zml4SW5jRGVjIHRoZW4gXCI/RXhwcmVzc2lvbkJyYWNlRW5kXCIgZWxzZSBcIn1cIlxuXG4gICAgICAgICAgICB3aGVuIFwiXVwiXG4gICAgICAgICAgICAgIHBvc3RmaXhJbmNEZWMgPSB0cnVlXG5cbiAgICAgICAgICAgIHdoZW4gXCIrK1wiLCBcIi0tXCJcbiAgICAgICAgICAgICAgbmV4dExhc3RTaWduaWZpY2FudFRva2VuID1cbiAgICAgICAgICAgICAgICBpZiBwb3N0Zml4SW5jRGVjIHRoZW4gXCI/UG9zdGZpeEluY0RlY1wiIGVsc2UgXCI/VW5hcnlJbmNEZWNcIlxuXG4gICAgICAgICAgICB3aGVuIFwiPFwiXG4gICAgICAgICAgICAgIGlmIGpzeCAmJiAoXG4gICAgICAgICAgICAgICAgVG9rZW5zUHJlY2VkaW5nRXhwcmVzc2lvbi50ZXN0KGxhc3RTaWduaWZpY2FudFRva2VuKSB8fFxuICAgICAgICAgICAgICAgIEtleXdvcmRzV2l0aEV4cHJlc3Npb25BZnRlci50ZXN0KGxhc3RTaWduaWZpY2FudFRva2VuKVxuICAgICAgICAgICAgICApXG4gICAgICAgICAgICAgICAgc3RhY2sucHVzaCh7dGFnOiBcIkpTWFRhZ1wifSlcbiAgICAgICAgICAgICAgICBsYXN0SW5kZXggKz0gMVxuICAgICAgICAgICAgICAgIGxhc3RTaWduaWZpY2FudFRva2VuID0gXCI8XCJcbiAgICAgICAgICAgICAgICB5aWVsZCB7XG4gICAgICAgICAgICAgICAgICB0eXBlOiBcIkpTWFB1bmN0dWF0b3JcIixcbiAgICAgICAgICAgICAgICAgIHZhbHVlOiBwdW5jdHVhdG9yLFxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBjb250aW51ZVxuICAgICAgICAgICAgICBwb3N0Zml4SW5jRGVjID0gZmFsc2VcblxuICAgICAgICAgICAgZWxzZVxuICAgICAgICAgICAgICBwb3N0Zml4SW5jRGVjID0gZmFsc2VcblxuICAgICAgICAgIGxhc3RJbmRleCA9IG5leHRMYXN0SW5kZXhcbiAgICAgICAgICBsYXN0U2lnbmlmaWNhbnRUb2tlbiA9IG5leHRMYXN0U2lnbmlmaWNhbnRUb2tlblxuICAgICAgICAgIHlpZWxkIHtcbiAgICAgICAgICAgIHR5cGU6IFwiUHVuY3R1YXRvclwiLFxuICAgICAgICAgICAgdmFsdWU6IHB1bmN0dWF0b3IsXG4gICAgICAgICAgfVxuICAgICAgICAgIGNvbnRpbnVlXG5cbiAgICAgICAgSWRlbnRpZmllci5sYXN0SW5kZXggPSBsYXN0SW5kZXhcbiAgICAgICAgaWYgbWF0Y2ggPSBJZGVudGlmaWVyLmV4ZWMoaW5wdXQpXG4gICAgICAgICAgbGFzdEluZGV4ID0gSWRlbnRpZmllci5sYXN0SW5kZXhcbiAgICAgICAgICBuZXh0TGFzdFNpZ25pZmljYW50VG9rZW4gPSBtYXRjaFswXVxuICAgICAgICAgIHN3aXRjaCBtYXRjaFswXVxuICAgICAgICAgICAgd2hlbiBcImZvclwiLCBcImlmXCIsIFwid2hpbGVcIiwgXCJ3aXRoXCJcbiAgICAgICAgICAgICAgaWYgbGFzdFNpZ25pZmljYW50VG9rZW4gIT0gXCIuXCIgJiYgbGFzdFNpZ25pZmljYW50VG9rZW4gIT0gXCI/LlwiXG4gICAgICAgICAgICAgICAgbmV4dExhc3RTaWduaWZpY2FudFRva2VuID0gXCI/Tm9uRXhwcmVzc2lvblBhcmVuS2V5d29yZFwiXG4gICAgICAgICAgbGFzdFNpZ25pZmljYW50VG9rZW4gPSBuZXh0TGFzdFNpZ25pZmljYW50VG9rZW5cbiAgICAgICAgICBwb3N0Zml4SW5jRGVjID0gIUtleXdvcmRzV2l0aEV4cHJlc3Npb25BZnRlci50ZXN0KG1hdGNoWzBdKVxuICAgICAgICAgIHlpZWxkIHtcbiAgICAgICAgICAgIHR5cGU6IGlmIG1hdGNoWzFdID09IFwiI1wiIHRoZW4gXCJQcml2YXRlSWRlbnRpZmllclwiIGVsc2UgXCJJZGVudGlmaWVyTmFtZVwiLFxuICAgICAgICAgICAgdmFsdWU6IG1hdGNoWzBdLFxuICAgICAgICAgIH1cbiAgICAgICAgICBjb250aW51ZVxuXG4gICAgICAgIFN0cmluZ0xpdGVyYWwubGFzdEluZGV4ID0gbGFzdEluZGV4XG4gICAgICAgIGlmIG1hdGNoID0gU3RyaW5nTGl0ZXJhbC5leGVjKGlucHV0KVxuICAgICAgICAgIGxhc3RJbmRleCA9IFN0cmluZ0xpdGVyYWwubGFzdEluZGV4XG4gICAgICAgICAgbGFzdFNpZ25pZmljYW50VG9rZW4gPSBtYXRjaFswXVxuICAgICAgICAgIHBvc3RmaXhJbmNEZWMgPSB0cnVlXG4gICAgICAgICAgeWllbGQge1xuICAgICAgICAgICAgdHlwZTogXCJTdHJpbmdMaXRlcmFsXCIsXG4gICAgICAgICAgICB2YWx1ZTogbWF0Y2hbMF0sXG4gICAgICAgICAgICBjbG9zZWQ6IG1hdGNoWzJdICE9IHVuZGVmaW5lZCxcbiAgICAgICAgICB9XG4gICAgICAgICAgY29udGludWVcblxuICAgICAgICBOdW1lcmljTGl0ZXJhbC5sYXN0SW5kZXggPSBsYXN0SW5kZXhcbiAgICAgICAgaWYgbWF0Y2ggPSBOdW1lcmljTGl0ZXJhbC5leGVjKGlucHV0KVxuICAgICAgICAgIGxhc3RJbmRleCA9IE51bWVyaWNMaXRlcmFsLmxhc3RJbmRleFxuICAgICAgICAgIGxhc3RTaWduaWZpY2FudFRva2VuID0gbWF0Y2hbMF1cbiAgICAgICAgICBwb3N0Zml4SW5jRGVjID0gdHJ1ZVxuICAgICAgICAgIHlpZWxkIHtcbiAgICAgICAgICAgIHR5cGU6IFwiTnVtZXJpY0xpdGVyYWxcIixcbiAgICAgICAgICAgIHZhbHVlOiBtYXRjaFswXSxcbiAgICAgICAgICB9XG4gICAgICAgICAgY29udGludWVcblxuICAgICAgICBUZW1wbGF0ZS5sYXN0SW5kZXggPSBsYXN0SW5kZXhcbiAgICAgICAgaWYgbWF0Y2ggPSBUZW1wbGF0ZS5leGVjKGlucHV0KVxuICAgICAgICAgIGxhc3RJbmRleCA9IFRlbXBsYXRlLmxhc3RJbmRleFxuICAgICAgICAgIGxhc3RTaWduaWZpY2FudFRva2VuID0gbWF0Y2hbMF1cbiAgICAgICAgICBpZiBtYXRjaFsxXSA9PSBcIiR7XCJcbiAgICAgICAgICAgIGxhc3RTaWduaWZpY2FudFRva2VuID0gXCI/SW50ZXJwb2xhdGlvbkluVGVtcGxhdGVcIlxuICAgICAgICAgICAgc3RhY2sucHVzaCh7dGFnOiBcIkludGVycG9sYXRpb25JblRlbXBsYXRlXCIsIG5lc3Rpbmc6IGJyYWNlcy5sZW5ndGh9KVxuICAgICAgICAgICAgcG9zdGZpeEluY0RlYyA9IGZhbHNlXG4gICAgICAgICAgICB5aWVsZCB7XG4gICAgICAgICAgICAgIHR5cGU6IFwiVGVtcGxhdGVIZWFkXCIsXG4gICAgICAgICAgICAgIHZhbHVlOiBtYXRjaFswXSxcbiAgICAgICAgICAgIH1cbiAgICAgICAgICBlbHNlXG4gICAgICAgICAgICBwb3N0Zml4SW5jRGVjID0gdHJ1ZVxuICAgICAgICAgICAgeWllbGQge1xuICAgICAgICAgICAgICB0eXBlOiBcIk5vU3Vic3RpdHV0aW9uVGVtcGxhdGVcIixcbiAgICAgICAgICAgICAgdmFsdWU6IG1hdGNoWzBdLFxuICAgICAgICAgICAgICBjbG9zZWQ6IG1hdGNoWzFdID09IFwiYFwiLFxuICAgICAgICAgICAgfVxuICAgICAgICAgIGNvbnRpbnVlXG5cbiAgICAgIHdoZW4gXCJKU1hUYWdcIiwgXCJKU1hUYWdFbmRcIlxuICAgICAgICBKU1hQdW5jdHVhdG9yLmxhc3RJbmRleCA9IGxhc3RJbmRleFxuICAgICAgICBpZiBtYXRjaCA9IEpTWFB1bmN0dWF0b3IuZXhlYyhpbnB1dClcbiAgICAgICAgICBsYXN0SW5kZXggPSBKU1hQdW5jdHVhdG9yLmxhc3RJbmRleFxuICAgICAgICAgIG5leHRMYXN0U2lnbmlmaWNhbnRUb2tlbiA9IG1hdGNoWzBdXG4gICAgICAgICAgc3dpdGNoIG1hdGNoWzBdXG4gICAgICAgICAgICB3aGVuIFwiPFwiXG4gICAgICAgICAgICAgIHN0YWNrLnB1c2goe3RhZzogXCJKU1hUYWdcIn0pXG4gICAgICAgICAgICB3aGVuIFwiPlwiXG4gICAgICAgICAgICAgIHN0YWNrLnBvcCgpXG4gICAgICAgICAgICAgIGlmIGxhc3RTaWduaWZpY2FudFRva2VuID09IFwiL1wiIHx8IG1vZGUudGFnID09IFwiSlNYVGFnRW5kXCJcbiAgICAgICAgICAgICAgICBuZXh0TGFzdFNpZ25pZmljYW50VG9rZW4gPSBcIj9KU1hcIlxuICAgICAgICAgICAgICAgIHBvc3RmaXhJbmNEZWMgPSB0cnVlXG4gICAgICAgICAgICAgIGVsc2VcbiAgICAgICAgICAgICAgICBzdGFjay5wdXNoKHt0YWc6IFwiSlNYQ2hpbGRyZW5cIn0pXG4gICAgICAgICAgICB3aGVuIFwie1wiXG4gICAgICAgICAgICAgIHN0YWNrLnB1c2goe3RhZzogXCJJbnRlcnBvbGF0aW9uSW5KU1hcIiwgbmVzdGluZzogYnJhY2VzLmxlbmd0aH0pXG4gICAgICAgICAgICAgIG5leHRMYXN0U2lnbmlmaWNhbnRUb2tlbiA9IFwiP0ludGVycG9sYXRpb25JbkpTWFwiXG4gICAgICAgICAgICAgIHBvc3RmaXhJbmNEZWMgPSBmYWxzZVxuICAgICAgICAgICAgd2hlbiBcIi9cIlxuICAgICAgICAgICAgICBpZiBsYXN0U2lnbmlmaWNhbnRUb2tlbiA9PSBcIjxcIlxuICAgICAgICAgICAgICAgIHN0YWNrLnBvcCgpXG4gICAgICAgICAgICAgICAgaWYgc3RhY2tbc3RhY2subGVuZ3RoIC0gMV0udGFnID09IFwiSlNYQ2hpbGRyZW5cIlxuICAgICAgICAgICAgICAgICAgc3RhY2sucG9wKClcbiAgICAgICAgICAgICAgICBzdGFjay5wdXNoKHt0YWc6IFwiSlNYVGFnRW5kXCJ9KVxuICAgICAgICAgIGxhc3RTaWduaWZpY2FudFRva2VuID0gbmV4dExhc3RTaWduaWZpY2FudFRva2VuXG4gICAgICAgICAgeWllbGQge1xuICAgICAgICAgICAgdHlwZTogXCJKU1hQdW5jdHVhdG9yXCIsXG4gICAgICAgICAgICB2YWx1ZTogbWF0Y2hbMF0sXG4gICAgICAgICAgfVxuICAgICAgICAgIGNvbnRpbnVlXG5cbiAgICAgICAgSlNYSWRlbnRpZmllci5sYXN0SW5kZXggPSBsYXN0SW5kZXhcbiAgICAgICAgaWYgbWF0Y2ggPSBKU1hJZGVudGlmaWVyLmV4ZWMoaW5wdXQpXG4gICAgICAgICAgbGFzdEluZGV4ID0gSlNYSWRlbnRpZmllci5sYXN0SW5kZXhcbiAgICAgICAgICBsYXN0U2lnbmlmaWNhbnRUb2tlbiA9IG1hdGNoWzBdXG4gICAgICAgICAgeWllbGQge1xuICAgICAgICAgICAgdHlwZTogXCJKU1hJZGVudGlmaWVyXCIsXG4gICAgICAgICAgICB2YWx1ZTogbWF0Y2hbMF0sXG4gICAgICAgICAgfVxuICAgICAgICAgIGNvbnRpbnVlXG5cbiAgICAgICAgSlNYU3RyaW5nLmxhc3RJbmRleCA9IGxhc3RJbmRleFxuICAgICAgICBpZiBtYXRjaCA9IEpTWFN0cmluZy5leGVjKGlucHV0KVxuICAgICAgICAgIGxhc3RJbmRleCA9IEpTWFN0cmluZy5sYXN0SW5kZXhcbiAgICAgICAgICBsYXN0U2lnbmlmaWNhbnRUb2tlbiA9IG1hdGNoWzBdXG4gICAgICAgICAgeWllbGQge1xuICAgICAgICAgICAgdHlwZTogXCJKU1hTdHJpbmdcIixcbiAgICAgICAgICAgIHZhbHVlOiBtYXRjaFswXSxcbiAgICAgICAgICAgIGNsb3NlZDogbWF0Y2hbMl0gIT0gdW5kZWZpbmVkLFxuICAgICAgICAgIH1cbiAgICAgICAgICBjb250aW51ZVxuXG4gICAgICB3aGVuIFwiSlNYQ2hpbGRyZW5cIlxuICAgICAgICBKU1hUZXh0Lmxhc3RJbmRleCA9IGxhc3RJbmRleFxuICAgICAgICBpZiBtYXRjaCA9IEpTWFRleHQuZXhlYyhpbnB1dClcbiAgICAgICAgICBsYXN0SW5kZXggPSBKU1hUZXh0Lmxhc3RJbmRleFxuICAgICAgICAgIGxhc3RTaWduaWZpY2FudFRva2VuID0gbWF0Y2hbMF1cbiAgICAgICAgICB5aWVsZCB7XG4gICAgICAgICAgICB0eXBlOiBcIkpTWFRleHRcIixcbiAgICAgICAgICAgIHZhbHVlOiBtYXRjaFswXSxcbiAgICAgICAgICB9XG4gICAgICAgICAgY29udGludWVcblxuICAgICAgICBzd2l0Y2ggaW5wdXRbbGFzdEluZGV4XVxuICAgICAgICAgIHdoZW4gXCI8XCJcbiAgICAgICAgICAgIHN0YWNrLnB1c2goe3RhZzogXCJKU1hUYWdcIn0pXG4gICAgICAgICAgICBsYXN0SW5kZXgrK1xuICAgICAgICAgICAgbGFzdFNpZ25pZmljYW50VG9rZW4gPSBcIjxcIlxuICAgICAgICAgICAgeWllbGQge1xuICAgICAgICAgICAgICB0eXBlOiBcIkpTWFB1bmN0dWF0b3JcIixcbiAgICAgICAgICAgICAgdmFsdWU6IFwiPFwiLFxuICAgICAgICAgICAgfVxuICAgICAgICAgICAgY29udGludWVcbiAgICAgICAgICB3aGVuIFwie1wiXG4gICAgICAgICAgICBzdGFjay5wdXNoKHt0YWc6IFwiSW50ZXJwb2xhdGlvbkluSlNYXCIsIG5lc3Rpbmc6IGJyYWNlcy5sZW5ndGh9KVxuICAgICAgICAgICAgbGFzdEluZGV4KytcbiAgICAgICAgICAgIGxhc3RTaWduaWZpY2FudFRva2VuID0gXCI/SW50ZXJwb2xhdGlvbkluSlNYXCJcbiAgICAgICAgICAgIHBvc3RmaXhJbmNEZWMgPSBmYWxzZVxuICAgICAgICAgICAgeWllbGQge1xuICAgICAgICAgICAgICB0eXBlOiBcIkpTWFB1bmN0dWF0b3JcIixcbiAgICAgICAgICAgICAgdmFsdWU6IFwie1wiLFxuICAgICAgICAgICAgfVxuICAgICAgICAgICAgY29udGludWVcblxuICAgIFdoaXRlU3BhY2UubGFzdEluZGV4ID0gbGFzdEluZGV4XG4gICAgaWYgbWF0Y2ggPSBXaGl0ZVNwYWNlLmV4ZWMoaW5wdXQpXG4gICAgICBsYXN0SW5kZXggPSBXaGl0ZVNwYWNlLmxhc3RJbmRleFxuICAgICAgeWllbGQge1xuICAgICAgICB0eXBlOiBcIldoaXRlU3BhY2VcIixcbiAgICAgICAgdmFsdWU6IG1hdGNoWzBdLFxuICAgICAgfVxuICAgICAgY29udGludWVcblxuICAgIExpbmVUZXJtaW5hdG9yU2VxdWVuY2UubGFzdEluZGV4ID0gbGFzdEluZGV4XG4gICAgaWYgbWF0Y2ggPSBMaW5lVGVybWluYXRvclNlcXVlbmNlLmV4ZWMoaW5wdXQpXG4gICAgICBsYXN0SW5kZXggPSBMaW5lVGVybWluYXRvclNlcXVlbmNlLmxhc3RJbmRleFxuICAgICAgcG9zdGZpeEluY0RlYyA9IGZhbHNlXG4gICAgICBpZiBLZXl3b3Jkc1dpdGhOb0xpbmVUZXJtaW5hdG9yQWZ0ZXIudGVzdChsYXN0U2lnbmlmaWNhbnRUb2tlbilcbiAgICAgICAgbGFzdFNpZ25pZmljYW50VG9rZW4gPSBcIj9Ob0xpbmVUZXJtaW5hdG9ySGVyZVwiXG4gICAgICB5aWVsZCB7XG4gICAgICAgIHR5cGU6IFwiTGluZVRlcm1pbmF0b3JTZXF1ZW5jZVwiLFxuICAgICAgICB2YWx1ZTogbWF0Y2hbMF0sXG4gICAgICB9XG4gICAgICBjb250aW51ZVxuXG4gICAgTXVsdGlMaW5lQ29tbWVudC5sYXN0SW5kZXggPSBsYXN0SW5kZXhcbiAgICBpZiBtYXRjaCA9IE11bHRpTGluZUNvbW1lbnQuZXhlYyhpbnB1dClcbiAgICAgIGxhc3RJbmRleCA9IE11bHRpTGluZUNvbW1lbnQubGFzdEluZGV4XG4gICAgICBpZiBOZXdsaW5lLnRlc3QobWF0Y2hbMF0pXG4gICAgICAgIHBvc3RmaXhJbmNEZWMgPSBmYWxzZVxuICAgICAgICBpZiBLZXl3b3Jkc1dpdGhOb0xpbmVUZXJtaW5hdG9yQWZ0ZXIudGVzdChsYXN0U2lnbmlmaWNhbnRUb2tlbilcbiAgICAgICAgICBsYXN0U2lnbmlmaWNhbnRUb2tlbiA9IFwiP05vTGluZVRlcm1pbmF0b3JIZXJlXCJcbiAgICAgIHlpZWxkIHtcbiAgICAgICAgdHlwZTogXCJNdWx0aUxpbmVDb21tZW50XCIsXG4gICAgICAgIHZhbHVlOiBtYXRjaFswXSxcbiAgICAgICAgY2xvc2VkOiBtYXRjaFsxXSAhPSB1bmRlZmluZWQsXG4gICAgICB9XG4gICAgICBjb250aW51ZVxuXG4gICAgU2luZ2xlTGluZUNvbW1lbnQubGFzdEluZGV4ID0gbGFzdEluZGV4XG4gICAgaWYgbWF0Y2ggPSBTaW5nbGVMaW5lQ29tbWVudC5leGVjKGlucHV0KVxuICAgICAgbGFzdEluZGV4ID0gU2luZ2xlTGluZUNvbW1lbnQubGFzdEluZGV4XG4gICAgICBwb3N0Zml4SW5jRGVjID0gZmFsc2VcbiAgICAgIHlpZWxkIHtcbiAgICAgICAgdHlwZTogXCJTaW5nbGVMaW5lQ29tbWVudFwiLFxuICAgICAgICB2YWx1ZTogbWF0Y2hbMF0sXG4gICAgICB9XG4gICAgICBjb250aW51ZVxuXG4gICAgZmlyc3RDb2RlUG9pbnQgPSBTdHJpbmcuZnJvbUNvZGVQb2ludChpbnB1dC5jb2RlUG9pbnRBdChsYXN0SW5kZXgpKVxuICAgIGxhc3RJbmRleCArPSBmaXJzdENvZGVQb2ludC5sZW5ndGhcbiAgICBsYXN0U2lnbmlmaWNhbnRUb2tlbiA9IGZpcnN0Q29kZVBvaW50XG4gICAgcG9zdGZpeEluY0RlYyA9IGZhbHNlXG4gICAgeWllbGQge1xuICAgICAgdHlwZTogaWYgbW9kZS50YWcuc3RhcnRzV2l0aChcIkpTWFwiKSB0aGVuIFwiSlNYSW52YWxpZFwiIGVsc2UgXCJJbnZhbGlkXCIsXG4gICAgICB2YWx1ZTogZmlyc3RDb2RlUG9pbnQsXG4gICAgfVxuXG4gIHVuZGVmaW5lZFxuXG4iXX0=
