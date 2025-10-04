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
      var exports, jsTokens, rpr_string, rpr_token, summarize, token_categories, walk_essential_js_tokens, walk_js_tokens;
      ({rpr_string} = (require('./rpr-string.brics')).require_rpr_string());
      jsTokens = require('./_js-tokens');
      //-------------------------------------------------------------------------------------------------------
      token_categories = (() => {
        var R;
        R = {};
        //.....................................................................................................
        R.nonessentials = new Set([]);
        R.literals = new Set([]);
        R.newline = new Set([]);
        R.system = new Set([]);
        //.....................................................................................................
        R.eof = (new Set(['system'])).union(R.system);
        R.comments = (new Set(['nonessentials'])).union(R.nonessentials);
        R.whitespace = (new Set(['nonessentials'])).union(R.nonessentials);
        R.primitive_literals = (new Set(['literals'])).union(R.literals);
        //.....................................................................................................
        R.string_literals = (new Set(['primitive_literals'])).union(R.primitive_literals);
        //.....................................................................................................
        R.LineTerminatorSequence = (new Set(['newline'])).union(R.newline);
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
        yield ({
          type: 'eof'
        });
        return null;
      };
      //-------------------------------------------------------------------------------------------------------
      walk_essential_js_tokens = function*(source) {
        var ref, token;
        for (token of walk_js_tokens(source)) {
          if ((ref = token.categories) != null ? ref.has('nonessentials') : void 0) {
            continue;
          }
          yield token;
        }
        return null;
      };
      //-------------------------------------------------------------------------------------------------------
      rpr_token = function(token) {
        return token.type + (token.value != null ? rpr_string(token.value) : '');
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
      return exports = {walk_js_tokens, walk_essential_js_tokens, summarize};
    }
  };

  // return exports = {
  //   walk_js_tokens,
  //   walk_essential_js_tokens,
  //   rpr_token,
  //   summarize,
  //   internals: {
  //     token_categories,
  //     tokens: {
  //       HashbangComment,
  //       Identifier,
  //       JSXIdentifier,
  //       JSXPunctuator,
  //       JSXString,
  //       JSXText,
  //       KeywordsWithExpressionAfter,
  //       KeywordsWithNoLineTerminatorAfter,
  //       LineTerminatorSequence,
  //       MultiLineComment,
  //       Newline,
  //       NumericLiteral,
  //       Punctuator,
  //       RegularExpressionLiteral,
  //       SingleLineComment,
  //       StringLiteral,
  //       Template,
  //       TokensNotPrecedingObjectLiteral,
  //       TokensPrecedingExpression,
  //       WhiteSpace, }, }, }

  //===========================================================================================================
  Object.assign(module.exports, BRICS);

}).call(this);

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vc3JjL3dhbGstanMtdG9rZW5zLmJyaWNzLmNvZmZlZSJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFDQTtFQUFBO0FBQUEsTUFBQSxLQUFBLEVBQUEsS0FBQTs7O0VBR0EsQ0FBQSxDQUFFLEtBQUYsQ0FBQSxHQUFhLE9BQWIsRUFIQTs7Ozs7RUFTQSxLQUFBLEdBSUUsQ0FBQTs7O0lBQUEsc0JBQUEsRUFBd0IsUUFBQSxDQUFBLENBQUE7QUFDMUIsVUFBQSxPQUFBLEVBQUEsUUFBQSxFQUFBLFVBQUEsRUFBQSxTQUFBLEVBQUEsU0FBQSxFQUFBLGdCQUFBLEVBQUEsd0JBQUEsRUFBQTtNQUFJLENBQUEsQ0FBRSxVQUFGLENBQUEsR0FBa0IsQ0FBRSxPQUFBLENBQVEsb0JBQVIsQ0FBRixDQUFnQyxDQUFDLGtCQUFqQyxDQUFBLENBQWxCO01BQ0EsUUFBQSxHQUFrQixPQUFBLENBQVEsY0FBUixFQUR0Qjs7TUFJSSxnQkFBQSxHQUFzQixDQUFBLENBQUEsQ0FBQSxHQUFBO0FBQzFCLFlBQUE7UUFBTSxDQUFBLEdBQThCLENBQUEsRUFBcEM7O1FBRU0sQ0FBQyxDQUFDLGFBQUYsR0FBZ0MsSUFBSSxHQUFKLENBQVEsRUFBUjtRQUNoQyxDQUFDLENBQUMsUUFBRixHQUFnQyxJQUFJLEdBQUosQ0FBUSxFQUFSO1FBQ2hDLENBQUMsQ0FBQyxPQUFGLEdBQWdDLElBQUksR0FBSixDQUFRLEVBQVI7UUFDaEMsQ0FBQyxDQUFDLE1BQUYsR0FBZ0MsSUFBSSxHQUFKLENBQVEsRUFBUixFQUx0Qzs7UUFPTSxDQUFDLENBQUMsR0FBRixHQUE4QixDQUFFLElBQUksR0FBSixDQUFRLENBQUUsUUFBRixDQUFSLENBQUYsQ0FBdUMsQ0FBQyxLQUF4QyxDQUE4QyxDQUFDLENBQUMsTUFBaEQ7UUFDOUIsQ0FBQyxDQUFDLFFBQUYsR0FBOEIsQ0FBRSxJQUFJLEdBQUosQ0FBUSxDQUFFLGVBQUYsQ0FBUixDQUFGLENBQXVD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QUFaO0FBQUEscUJBQUE7O1VBQ0EsTUFBTTtRQUZSO0FBR0EsZUFBTztNQUprQixFQTFDL0I7O01BaURJLFNBQUEsR0FBWSxRQUFBLENBQUUsS0FBRixDQUFBO2VBQWEsS0FBSyxDQUFDLElBQU4sR0FBYSxDQUFLLG1CQUFILEdBQXVCLFVBQUEsQ0FBVyxLQUFLLENBQUMsS0FBakIsQ0FBdkIsR0FBcUQsRUFBdkQ7TUFBMUIsRUFqRGhCOztNQW9ESSxTQUFBLEdBQVksUUFBQSxDQUFFLE1BQUYsRUFBVSxTQUFTLEtBQW5CLENBQUE7QUFDaEIsWUFBQTtBQUFNLGVBQU8sTUFBQSxHQUFTLENBQUU7O0FBQUU7VUFBQSxLQUFBLFdBQUE7eUJBQUUsU0FBQSxDQUFVLENBQVY7VUFBRixDQUFBOztZQUFGLENBQXFDLENBQUMsSUFBdEMsQ0FBMkMsTUFBM0MsQ0FBRixDQUFULEdBQWlFO01BRDlELEVBcERoQjs7QUF3REksYUFBTyxPQUFBLEdBQVUsQ0FBRSxjQUFGLEVBQWtCLHdCQUFsQixFQUE0QyxTQUE1QztJQXpESztFQUF4QixFQWJGOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OztFQXFHQSxNQUFNLENBQUMsTUFBUCxDQUFjLE1BQU0sQ0FBQyxPQUFyQixFQUE4QixLQUE5QjtBQXJHQSIsInNvdXJjZXNDb250ZW50IjpbIlxuJ3VzZSBzdHJpY3QnXG5cbiM9PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PVxueyBkZWJ1ZywgfSA9IGNvbnNvbGVcblxuXG4jIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyNcbiNcbiM9PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PVxuQlJJQ1MgPVxuXG4gICM9PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT1cbiAgIyMjIE5PVEUgRnV0dXJlIFNpbmdsZS1GaWxlIE1vZHVsZSAjIyNcbiAgcmVxdWlyZV93YWxrX2pzX3Rva2VuczogLT5cbiAgICB7IHJwcl9zdHJpbmcsIH0gPSAoIHJlcXVpcmUgJy4vcnByLXN0cmluZy5icmljcycgKS5yZXF1aXJlX3Jwcl9zdHJpbmcoKVxuICAgIGpzVG9rZW5zICAgICAgICA9IHJlcXVpcmUgJy4vX2pzLXRva2VucydcblxuICAgICMtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4gICAgdG9rZW5fY2F0ZWdvcmllcyA9IGRvID0+XG4gICAgICBSICAgICAgICAgICAgICAgICAgICAgICAgICAgPSB7fVxuICAgICAgIy4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uXG4gICAgICBSLm5vbmVzc2VudGlhbHMgICAgICAgICAgICAgPSAoIG5ldyBTZXQgWyAgICAgICAgICAgICAgICAgICAgICAgICBdIClcbiAgICAgIFIubGl0ZXJhbHMgICAgICAgICAgICAgICAgICA9ICggbmV3IFNldCBbICAgICAgICAgICAgICAgICAgICAgICAgIF0gKVxuICAgICAgUi5uZXdsaW5lICAgICAgICAgICAgICAgICAgID0gKCBuZXcgU2V0IFsgICAgICAgICAgICAgICAgICAgICAgICAgXSApXG4gICAgICBSLnN5c3RlbSAgICAgICAgICAgICAgICAgICAgPSAoIG5ldyBTZXQgWyAgICAgICAgICAgICAgICAgICAgICAgICBdIClcbiAgICAgICMuLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLlxuICAgICAgUi5lb2YgICAgICAgICAgICAgICAgICAgICAgID0gKCBuZXcgU2V0IFsgJ3N5c3RlbScsICAgICAgICAgICAgICAgXSApLnVuaW9uIFIuc3lzdGVtXG4gICAgICBSLmNvbW1lbnRzICAgICAgICAgICAgICAgICAgPSAoIG5ldyBTZXQgWyAnbm9uZXNzZW50aWFscycsICAgICAgICBdICkudW5pb24gUi5ub25lc3NlbnRpYWxzXG4gICAgICBSLndoaXRlc3BhY2UgICAgICAgICAgICAgICAgPSAoIG5ldyBTZXQgWyAnbm9uZXNzZW50aWFscycsICAgICAgICBdICkudW5pb24gUi5ub25lc3NlbnRpYWxzXG4gICAgICBSLnByaW1pdGl2ZV9saXRlcmFscyAgICAgICAgPSAoIG5ldyBTZXQgWyAnbGl0ZXJhbHMnLCAgICAgICAgICAgICBdICkudW5pb24gUi5saXRlcmFsc1xuICAgICAgIy4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uXG4gICAgICBSLnN0cmluZ19saXRlcmFscyAgICAgICAgICAgPSAoIG5ldyBTZXQgWyAncHJpbWl0aXZlX2xpdGVyYWxzJywgICBdICkudW5pb24gUi5wcmltaXRpdmVfbGl0ZXJhbHNcbiAgICAgICMuLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLlxuICAgICAgUi5MaW5lVGVybWluYXRvclNlcXVlbmNlICAgID0gKCBuZXcgU2V0IFsgJ25ld2xpbmUnLCAgICAgICAgICAgICAgXSApLnVuaW9uIFIubmV3bGluZVxuICAgICAgUi5XaGl0ZVNwYWNlICAgICAgICAgICAgICAgID0gKCBuZXcgU2V0IFsgJ3doaXRlc3BhY2UnLCAgICAgICAgICAgXSApLnVuaW9uIFIud2hpdGVzcGFjZVxuICAgICAgUi5IYXNoYmFuZ0NvbW1lbnQgICAgICAgICAgID0gKCBuZXcgU2V0IFsgJ2NvbW1lbnRzJywgICAgICAgICAgICAgXSApLnVuaW9uIFIuY29tbWVudHNcbiAgICAgIFIuTXVsdGlMaW5lQ29tbWVudCAgICAgICAgICA9ICggbmV3IFNldCBbICdjb21tZW50cycsICAgICAgICAgICAgIF0gKS51bmlvbiBSLmNvbW1lbnRzXG4gICAgICBSLlNpbmdsZUxpbmVDb21tZW50ICAgICAgICAgPSAoIG5ldyBTZXQgWyAnY29tbWVudHMnLCAgICAgICAgICAgICBdICkudW5pb24gUi5jb21tZW50c1xuICAgICAgUi5TdHJpbmdMaXRlcmFsICAgICAgICAgICAgID0gKCBuZXcgU2V0IFsgJ3N0cmluZ19saXRlcmFscycsICAgICAgXSApLnVuaW9uIFIuc3RyaW5nX2xpdGVyYWxzXG4gICAgICBSLk5vU3Vic3RpdHV0aW9uVGVtcGxhdGUgICAgPSAoIG5ldyBTZXQgWyAnc3RyaW5nX2xpdGVyYWxzJywgICAgICBdICkudW5pb24gUi5zdHJpbmdfbGl0ZXJhbHNcbiAgICAgIFIuTnVtZXJpY0xpdGVyYWwgICAgICAgICAgICA9ICggbmV3IFNldCBbICdwcmltaXRpdmVfbGl0ZXJhbHMnLCAgIF0gKS51bmlvbiBSLnByaW1pdGl2ZV9saXRlcmFsc1xuICAgICAgUi5SZWd1bGFyRXhwcmVzc2lvbkxpdGVyYWwgID0gKCBuZXcgU2V0IFsgJ3ByaW1pdGl2ZV9saXRlcmFscycsICAgXSApLnVuaW9uIFIucHJpbWl0aXZlX2xpdGVyYWxzXG4gICAgICAjIFRva2Vuc05vdFByZWNlZGluZ09iamVjdExpdGVyYWw6ICBuZXcgU2V0IFsgJ2xpdGVyYWxzJywgXSAjIyMgPz8/ICMjI1xuICAgICAgcmV0dXJuIFJcblxuICAgICMtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4gICAgd2Fsa19qc190b2tlbnMgPSAoIHNvdXJjZSApIC0+XG4gICAgICBsaW5lX25yID0gMVxuICAgICAgZm9yIHRva2VuIGZyb20ganNUb2tlbnMgc291cmNlXG4gICAgICAgIGxpbmVfbnIrKyBpZiAoIHRva2VuLnR5cGUgaXMgJ0xpbmVUZXJtaW5hdG9yU2VxdWVuY2UnIClcbiAgICAgICAgY2F0ZWdvcmllcyA9IHRva2VuX2NhdGVnb3JpZXNbIHRva2VuLnR5cGUgXSA/IG5ldyBTZXQoKVxuICAgICAgICB5aWVsZCB7IHRva2VuLi4uLCBsaW5lX25yLCBjYXRlZ29yaWVzLCB9XG4gICAgICB5aWVsZCB7IHR5cGU6ICdlb2YnLCB9XG4gICAgICByZXR1cm4gbnVsbFxuXG4gICAgIy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiAgICB3YWxrX2Vzc2VudGlhbF9qc190b2tlbnMgPSAoIHNvdXJjZSApIC0+XG4gICAgICBmb3IgdG9rZW4gZnJvbSB3YWxrX2pzX3Rva2VucyBzb3VyY2VcbiAgICAgICAgY29udGludWUgaWYgdG9rZW4uY2F0ZWdvcmllcz8uaGFzICdub25lc3NlbnRpYWxzJ1xuICAgICAgICB5aWVsZCB0b2tlblxuICAgICAgcmV0dXJuIG51bGxcblxuICAgICMtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4gICAgcnByX3Rva2VuID0gKCB0b2tlbiApIC0+IHRva2VuLnR5cGUgKyAoIGlmIHRva2VuLnZhbHVlPyB0aGVuICggcnByX3N0cmluZyB0b2tlbi52YWx1ZSApIGVsc2UgJycgKVxuXG4gICAgIy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiAgICBzdW1tYXJpemUgPSAoIHRva2Vucywgam9pbmVyID0gJyYmJicgKSAtPlxuICAgICAgcmV0dXJuIGpvaW5lciArICggKCAoIHJwcl90b2tlbiB0ICkgZm9yIHQgZnJvbSB0b2tlbnMgKS5qb2luIGpvaW5lciApICsgam9pbmVyXG5cbiAgICAjLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLlxuICAgIHJldHVybiBleHBvcnRzID0geyB3YWxrX2pzX3Rva2Vucywgd2Fsa19lc3NlbnRpYWxfanNfdG9rZW5zLCBzdW1tYXJpemUsIH1cbiAgICAjIHJldHVybiBleHBvcnRzID0ge1xuICAgICMgICB3YWxrX2pzX3Rva2VucyxcbiAgICAjICAgd2Fsa19lc3NlbnRpYWxfanNfdG9rZW5zLFxuICAgICMgICBycHJfdG9rZW4sXG4gICAgIyAgIHN1bW1hcml6ZSxcbiAgICAjICAgaW50ZXJuYWxzOiB7XG4gICAgIyAgICAgdG9rZW5fY2F0ZWdvcmllcyxcbiAgICAjICAgICB0b2tlbnM6IHtcbiAgICAjICAgICAgIEhhc2hiYW5nQ29tbWVudCxcbiAgICAjICAgICAgIElkZW50aWZpZXIsXG4gICAgIyAgICAgICBKU1hJZGVudGlmaWVyLFxuICAgICMgICAgICAgSlNYUHVuY3R1YXRvcixcbiAgICAjICAgICAgIEpTWFN0cmluZyxcbiAgICAjICAgICAgIEpTWFRleHQsXG4gICAgIyAgICAgICBLZXl3b3Jkc1dpdGhFeHByZXNzaW9uQWZ0ZXIsXG4gICAgIyAgICAgICBLZXl3b3Jkc1dpdGhOb0xpbmVUZXJtaW5hdG9yQWZ0ZXIsXG4gICAgIyAgICAgICBMaW5lVGVybWluYXRvclNlcXVlbmNlLFxuICAgICMgICAgICAgTXVsdGlMaW5lQ29tbWVudCxcbiAgICAjICAgICAgIE5ld2xpbmUsXG4gICAgIyAgICAgICBOdW1lcmljTGl0ZXJhbCxcbiAgICAjICAgICAgIFB1bmN0dWF0b3IsXG4gICAgIyAgICAgICBSZWd1bGFyRXhwcmVzc2lvbkxpdGVyYWwsXG4gICAgIyAgICAgICBTaW5nbGVMaW5lQ29tbWVudCxcbiAgICAjICAgICAgIFN0cmluZ0xpdGVyYWwsXG4gICAgIyAgICAgICBUZW1wbGF0ZSxcbiAgICAjICAgICAgIFRva2Vuc05vdFByZWNlZGluZ09iamVjdExpdGVyYWwsXG4gICAgIyAgICAgICBUb2tlbnNQcmVjZWRpbmdFeHByZXNzaW9uLFxuICAgICMgICAgICAgV2hpdGVTcGFjZSwgfSwgfSwgfVxuXG4jPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT1cbk9iamVjdC5hc3NpZ24gbW9kdWxlLmV4cG9ydHMsIEJSSUNTXG5cblxuXG5cbiJdfQ==
