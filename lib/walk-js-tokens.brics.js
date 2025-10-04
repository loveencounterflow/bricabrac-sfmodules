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

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vc3JjL3dhbGstanMtdG9rZW5zLmJyaWNzLmNvZmZlZSJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFDQTtFQUFBO0FBQUEsTUFBQSxLQUFBLEVBQUEsS0FBQTs7O0VBR0EsQ0FBQSxDQUFFLEtBQUYsQ0FBQSxHQUFhLE9BQWIsRUFIQTs7Ozs7RUFTQSxLQUFBLEdBSUUsQ0FBQTs7O0lBQUEsc0JBQUEsRUFBd0IsUUFBQSxDQUFBLENBQUE7QUFDMUIsVUFBQSxPQUFBLEVBQUEsUUFBQSxFQUFBLFVBQUEsRUFBQSxTQUFBLEVBQUEsU0FBQSxFQUFBLGdCQUFBLEVBQUEsd0JBQUEsRUFBQTtNQUFJLENBQUEsQ0FBRSxVQUFGLENBQUEsR0FBa0IsQ0FBRSxPQUFBLENBQVEsb0JBQVIsQ0FBRixDQUFnQyxDQUFDLGtCQUFqQyxDQUFBLENBQWxCO01BQ0EsUUFBQSxHQUFrQixPQUFBLENBQVEsY0FBUixFQUR0Qjs7TUFJSSxnQkFBQSxHQUFzQixDQUFBLENBQUEsQ0FBQSxHQUFBO0FBQzFCLFlBQUE7UUFBTSxDQUFBLEdBQThCLENBQUEsRUFBcEM7O1FBRU0sQ0FBQyxDQUFDLGFBQUYsR0FBZ0MsSUFBSSxHQUFKLENBQVEsRUFBUjtRQUNoQyxDQUFDLENBQUMsUUFBRixHQUFnQyxJQUFJLEdBQUosQ0FBUSxFQUFSLEVBSHRDOztRQUtNLENBQUMsQ0FBQyxRQUFGLEdBQThCLENBQUUsSUFBSSxHQUFKLENBQVEsQ0FBRSxlQUFGLENBQVIsQ0FBRixDQUF1QyxDQUFDLEtBQXhDLENBQThDLENBQUMsQ0FBQyxhQUFoRDtRQUM5QixDQUFDLENBQUMsVUFBRixHQUE4QixDQUFFLElBQUksR0FBSixDQUFRLENBQUUsZUFBRixDQUFSLENBQUYsQ0FBdUMsQ0FBQyxLQUF4QyxDQUE4QyxDQUFDLENBQUMsYUFBaEQ7UUFDOUIsQ0FBQyxDQUFDLGtCQUFGLEdBQThCLENBQUUsSUFBSSxHQUFKLENBQVEsQ0FBRSxVQUFGLENB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UyxDQUFFOztBQUFFO1VBQUEsS0FBQSxXQUFBO3lCQUFFLFNBQUEsQ0FBVSxDQUFWO1VBQUYsQ0FBQTs7WUFBRixDQUFxQyxDQUFDLElBQXRDLENBQTJDLE1BQTNDLENBQUYsQ0FBVCxHQUFpRTtNQUQ5RCxFQWhEaEI7O0FBb0RJLGFBQU8sT0FBQSxHQUFVLENBQUUsY0FBRixFQUFrQix3QkFBbEIsRUFBNEMsU0FBNUM7SUFyREs7RUFBeEIsRUFiRjs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7RUFpR0EsTUFBTSxDQUFDLE1BQVAsQ0FBYyxNQUFNLENBQUMsT0FBckIsRUFBOEIsS0FBOUI7QUFqR0EiLCJzb3VyY2VzQ29udGVudCI6WyJcbid1c2Ugc3RyaWN0J1xuXG4jPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT1cbnsgZGVidWcsIH0gPSBjb25zb2xlXG5cblxuIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjXG4jXG4jPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT1cbkJSSUNTID1cblxuICAjPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09XG4gICMjIyBOT1RFIEZ1dHVyZSBTaW5nbGUtRmlsZSBNb2R1bGUgIyMjXG4gIHJlcXVpcmVfd2Fsa19qc190b2tlbnM6IC0+XG4gICAgeyBycHJfc3RyaW5nLCB9ID0gKCByZXF1aXJlICcuL3Jwci1zdHJpbmcuYnJpY3MnICkucmVxdWlyZV9ycHJfc3RyaW5nKClcbiAgICBqc1Rva2VucyAgICAgICAgPSByZXF1aXJlICcuL19qcy10b2tlbnMnXG5cbiAgICAjLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuICAgIHRva2VuX2NhdGVnb3JpZXMgPSBkbyA9PlxuICAgICAgUiAgICAgICAgICAgICAgICAgICAgICAgICAgID0ge31cbiAgICAgICMuLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLlxuICAgICAgUi5ub25lc3NlbnRpYWxzICAgICAgICAgICAgID0gKCBuZXcgU2V0IFsgICAgICAgICAgICAgICAgICAgICAgICAgXSApXG4gICAgICBSLmxpdGVyYWxzICAgICAgICAgICAgICAgICAgPSAoIG5ldyBTZXQgWyAgICAgICAgICAgICAgICAgICAgICAgICBdIClcbiAgICAgICMuLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLlxuICAgICAgUi5jb21tZW50cyAgICAgICAgICAgICAgICAgID0gKCBuZXcgU2V0IFsgJ25vbmVzc2VudGlhbHMnLCAgICAgICAgXSApLnVuaW9uIFIubm9uZXNzZW50aWFsc1xuICAgICAgUi53aGl0ZXNwYWNlICAgICAgICAgICAgICAgID0gKCBuZXcgU2V0IFsgJ25vbmVzc2VudGlhbHMnLCAgICAgICAgXSApLnVuaW9uIFIubm9uZXNzZW50aWFsc1xuICAgICAgUi5wcmltaXRpdmVfbGl0ZXJhbHMgICAgICAgID0gKCBuZXcgU2V0IFsgJ2xpdGVyYWxzJywgICAgICAgICAgICAgXSApLnVuaW9uIFIubGl0ZXJhbHNcbiAgICAgICMuLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLlxuICAgICAgUi5zdHJpbmdfbGl0ZXJhbHMgICAgICAgICAgID0gKCBuZXcgU2V0IFsgJ3ByaW1pdGl2ZV9saXRlcmFscycsICAgXSApLnVuaW9uIFIucHJpbWl0aXZlX2xpdGVyYWxzXG4gICAgICAjLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi5cbiAgICAgIFIuTGluZVRlcm1pbmF0b3JTZXF1ZW5jZSAgICA9ICggbmV3IFNldCBbICd3aGl0ZXNwYWNlJywgICAgICAgICAgIF0gKS51bmlvbiBSLndoaXRlc3BhY2VcbiAgICAgIFIuV2hpdGVTcGFjZSAgICAgICAgICAgICAgICA9ICggbmV3IFNldCBbICd3aGl0ZXNwYWNlJywgICAgICAgICAgIF0gKS51bmlvbiBSLndoaXRlc3BhY2VcbiAgICAgIFIuSGFzaGJhbmdDb21tZW50ICAgICAgICAgICA9ICggbmV3IFNldCBbICdjb21tZW50cycsICAgICAgICAgICAgIF0gKS51bmlvbiBSLmNvbW1lbnRzXG4gICAgICBSLk11bHRpTGluZUNvbW1lbnQgICAgICAgICAgPSAoIG5ldyBTZXQgWyAnY29tbWVudHMnLCAgICAgICAgICAgICBdICkudW5pb24gUi5jb21tZW50c1xuICAgICAgUi5TaW5nbGVMaW5lQ29tbWVudCAgICAgICAgID0gKCBuZXcgU2V0IFsgJ2NvbW1lbnRzJywgICAgICAgICAgICAgXSApLnVuaW9uIFIuY29tbWVudHNcbiAgICAgIFIuU3RyaW5nTGl0ZXJhbCAgICAgICAgICAgICA9ICggbmV3IFNldCBbICdzdHJpbmdfbGl0ZXJhbHMnLCAgICAgIF0gKS51bmlvbiBSLnN0cmluZ19saXRlcmFsc1xuICAgICAgUi5Ob1N1YnN0aXR1dGlvblRlbXBsYXRlICAgID0gKCBuZXcgU2V0IFsgJ3N0cmluZ19saXRlcmFscycsICAgICAgXSApLnVuaW9uIFIuc3RyaW5nX2xpdGVyYWxzXG4gICAgICBSLk51bWVyaWNMaXRlcmFsICAgICAgICAgICAgPSAoIG5ldyBTZXQgWyAncHJpbWl0aXZlX2xpdGVyYWxzJywgICBdICkudW5pb24gUi5wcmltaXRpdmVfbGl0ZXJhbHNcbiAgICAgIFIuUmVndWxhckV4cHJlc3Npb25MaXRlcmFsICA9ICggbmV3IFNldCBbICdwcmltaXRpdmVfbGl0ZXJhbHMnLCAgIF0gKS51bmlvbiBSLnByaW1pdGl2ZV9saXRlcmFsc1xuICAgICAgIyBUb2tlbnNOb3RQcmVjZWRpbmdPYmplY3RMaXRlcmFsOiAgbmV3IFNldCBbICdsaXRlcmFscycsIF0gIyMjID8/PyAjIyNcbiAgICAgIHJldHVybiBSXG5cbiAgICAjLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuICAgIHdhbGtfanNfdG9rZW5zID0gKCBzb3VyY2UgKSAtPlxuICAgICAgbGluZV9uciA9IDFcbiAgICAgIGZvciB0b2tlbiBmcm9tIGpzVG9rZW5zIHNvdXJjZVxuICAgICAgICBsaW5lX25yKysgaWYgKCB0b2tlbi50eXBlIGlzICdMaW5lVGVybWluYXRvclNlcXVlbmNlJyApXG4gICAgICAgIGNhdGVnb3JpZXMgPSB0b2tlbl9jYXRlZ29yaWVzWyB0b2tlbi50eXBlIF0gPyBuZXcgU2V0KClcbiAgICAgICAgeWllbGQgeyB0b2tlbi4uLiwgbGluZV9uciwgY2F0ZWdvcmllcywgfVxuICAgICAgcmV0dXJuIG51bGxcblxuICAgICMtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4gICAgd2Fsa19lc3NlbnRpYWxfanNfdG9rZW5zID0gKCBzb3VyY2UgKSAtPlxuICAgICAgZm9yIHRva2VuIGZyb20gd2Fsa19qc190b2tlbnMgc291cmNlXG4gICAgICAgIGNvbnRpbnVlIGlmIHRva2VuLmNhdGVnb3JpZXMuaGFzICdub25lc3NlbnRpYWxzJ1xuICAgICAgICB5aWVsZCB0b2tlblxuICAgICAgcmV0dXJuIG51bGxcblxuICAgICMtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4gICAgcnByX3Rva2VuID0gKCB0b2tlbiApIC0+IHRva2VuLnR5cGUgKyBycHJfc3RyaW5nIHRva2VuLnZhbHVlXG5cbiAgICAjLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuICAgIHN1bW1hcml6ZSA9ICggdG9rZW5zLCBqb2luZXIgPSAnJiYmJyApIC0+XG4gICAgICByZXR1cm4gam9pbmVyICsgKCAoICggcnByX3Rva2VuIHQgKSBmb3IgdCBmcm9tIHRva2VucyApLmpvaW4gam9pbmVyICkgKyBqb2luZXJcblxuICAgICMuLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uXG4gICAgcmV0dXJuIGV4cG9ydHMgPSB7IHdhbGtfanNfdG9rZW5zLCB3YWxrX2Vzc2VudGlhbF9qc190b2tlbnMsIHN1bW1hcml6ZSwgfVxuICAgICMgcmV0dXJuIGV4cG9ydHMgPSB7XG4gICAgIyAgIHdhbGtfanNfdG9rZW5zLFxuICAgICMgICB3YWxrX2Vzc2VudGlhbF9qc190b2tlbnMsXG4gICAgIyAgIHJwcl90b2tlbixcbiAgICAjICAgc3VtbWFyaXplLFxuICAgICMgICBpbnRlcm5hbHM6IHtcbiAgICAjICAgICB0b2tlbl9jYXRlZ29yaWVzLFxuICAgICMgICAgIHRva2Vuczoge1xuICAgICMgICAgICAgSGFzaGJhbmdDb21tZW50LFxuICAgICMgICAgICAgSWRlbnRpZmllcixcbiAgICAjICAgICAgIEpTWElkZW50aWZpZXIsXG4gICAgIyAgICAgICBKU1hQdW5jdHVhdG9yLFxuICAgICMgICAgICAgSlNYU3RyaW5nLFxuICAgICMgICAgICAgSlNYVGV4dCxcbiAgICAjICAgICAgIEtleXdvcmRzV2l0aEV4cHJlc3Npb25BZnRlcixcbiAgICAjICAgICAgIEtleXdvcmRzV2l0aE5vTGluZVRlcm1pbmF0b3JBZnRlcixcbiAgICAjICAgICAgIExpbmVUZXJtaW5hdG9yU2VxdWVuY2UsXG4gICAgIyAgICAgICBNdWx0aUxpbmVDb21tZW50LFxuICAgICMgICAgICAgTmV3bGluZSxcbiAgICAjICAgICAgIE51bWVyaWNMaXRlcmFsLFxuICAgICMgICAgICAgUHVuY3R1YXRvcixcbiAgICAjICAgICAgIFJlZ3VsYXJFeHByZXNzaW9uTGl0ZXJhbCxcbiAgICAjICAgICAgIFNpbmdsZUxpbmVDb21tZW50LFxuICAgICMgICAgICAgU3RyaW5nTGl0ZXJhbCxcbiAgICAjICAgICAgIFRlbXBsYXRlLFxuICAgICMgICAgICAgVG9rZW5zTm90UHJlY2VkaW5nT2JqZWN0TGl0ZXJhbCxcbiAgICAjICAgICAgIFRva2Vuc1ByZWNlZGluZ0V4cHJlc3Npb24sXG4gICAgIyAgICAgICBXaGl0ZVNwYWNlLCB9LCB9LCB9XG5cbiM9PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PVxuT2JqZWN0LmFzc2lnbiBtb2R1bGUuZXhwb3J0cywgQlJJQ1NcblxuXG5cblxuIl19
