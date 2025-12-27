(function() {
  'use strict';
  var require_unicode_range_tools, show_ranges;

  //###########################################################################################################

  //===========================================================================================================
  /* NOTE Future Single-File Module */
  require_unicode_range_tools = function() {
    var Range, Rangeset, SFMODULES, cid_matches_regex, debug, exports, internals, isas, nfa, rpr_string, templates, type_of, types, warn;
    //=========================================================================================================
    SFMODULES = require('./main');
    ({type_of} = SFMODULES.unstable.require_type_of());
    ({rpr_string} = SFMODULES.require_rpr_string());
    ({debug, warn} = console);
    ({nfa} = require('normalize-function-arguments'));
    //.........................................................................................................
    // { hide,
    //   set_getter,                 } = SFMODULES.require_managed_property_tools()
    // { lets,
    //   freeze,                     } = SFMODULES.require_letsfreezethat_infra().simple
    // misfit                          = Symbol 'misfit'

    //=========================================================================================================
    templates = {
      range: {
        lo: 0x000000,
        hi: 0x10ffff
      },
      from_regex: {
        regex: /|/,
        lo: 0x000000,
        hi: 0x10ffff,
        skip: [
          {
            // { lo: 0x00e000, hi: 0x00efff, } # BMP PUAs
            lo: 0x00d800,
            hi: 0x00dfff // Surrogates
          },
          {
            lo: 0x0f0000,
            hi: 0x10ffff // PUA-A, PUA-B
          }
        ]
      }
    };
    //---------------------------------------------------------------------------------------------------------
    // { lo: 0x0f0000, hi: 0x0fffff, } # PUA-A
    // { lo: 0x100000, hi: 0x10ffff, } # PUA-B
    types = {
      float: {
        isa: function(x) {
          return Number.isFinite(x);
        }
      },
      integer: {
        isa: function(x) {
          return Number.isInteger(x);
        }
      },
      cid: {
        isa: function(x) {
          if (!this.integer.isa(x)) {
            return false;
          }
          if (!((0x000000 <= x && x <= 0x10ffff))) {
            return false;
          }
          return true;
        }
      },
      cid_pair: {
        isa: function(x) {
          if (!Array.isArray(x)) {
            return false;
          }
          if (x.length !== 2) {
            return false;
          }
          if (!this.cid.isa(x[0])) {
            return false;
          }
          if (!this.cid.isa(x[1])) {
            return false;
          }
          if (!(x[0] <= x[1])) {
            return false;
          }
          return true;
        }
      }
    };
    //---------------------------------------------------------------------------------------------------------
    isas = {
      range: function(x) {
        // debug 'Ωucrt___1', x
        return true;
        return types.cid_pair([x.lo, x.hi]);
      }
    };
    //---------------------------------------------------------------------------------------------------------
    cid_matches_regex = function(cid, regex) {
      return regex.test(String.fromCodePoint(cid));
    };
    //=========================================================================================================
    internals = {templates, isas, cid_matches_regex};
    Range = (function() {
      var ctor;

      //=========================================================================================================
      class Range {
        constructor() {
          return ctor.apply(this, arguments);
        }

        //-------------------------------------------------------------------------------------------------------
        includes(cid) {
          return (this.lo <= cid && cid <= this.hi);
        }

      };

      ctor = nfa({
        isa: isas.range,
        template: templates.range
      }, function(lo, hi, cfg) {
        this.lo = cfg.lo;
        this.hi = cfg.hi;
        return void 0;
      });

      return Range;

    }).call(this);
    Rangeset = (function() {
      //=========================================================================================================
      class Rangeset {
        //-------------------------------------------------------------------------------------------------------
        constructor(...ranges) {
          var i, len, range;
          this.ranges = [];
          for (i = 0, len = ranges.length; i < len; i++) {
            range = ranges[i];
            if (!(range instanceof Range)) {
              range = new Range(range);
            }
            this.ranges.push(range);
          }
          void 0;
        }

        //-------------------------------------------------------------------------------------------------------
        includes(cid) {
          return this.ranges.some(function(r) {
            return r.includes(cid);
          });
        }

      };

      //-------------------------------------------------------------------------------------------------------
      Rangeset.from_regex = nfa({
        template: templates.from_regex
      }, function(regex, cfg) {
        var R, cid, i, range, ref, ref1, skip;
        skip = new Rangeset(...cfg.skip);
        R = [];
        range = null;
//.....................................................................................................
        for (cid = i = ref = cfg.lo, ref1 = cfg.hi; (ref <= ref1 ? i <= ref1 : i >= ref1); cid = ref <= ref1 ? ++i : --i) {
          //...................................................................................................
          if ((!/* TAINT allow multiple inclusion ranges */skip.includes(cid)) && (cid_matches_regex(cid, regex))) {
            if (range == null) {
              range = {
                lo: cid
              };
              R.push(range);
            }
          } else {
            //...................................................................................................
            if (range != null) {
              range.hi = cid - 1;
              range = null;
            }
          }
        }
        //.....................................................................................................
        debug('Ωucrt___1', R);
        return new Rangeset(...R);
      });

      return Rangeset;

    }).call(this);
    //=========================================================================================================
    return exports = {Range, Rangeset, internals};
  };

  //===========================================================================================================
  module.exports = {require_unicode_range_tools};

  //-----------------------------------------------------------------------------------------------------------
  show_ranges = function(ranges) {
    var cid, count, count_txt, first_cid, first_cid_hex, glyphs, i, j, k, last_cid, last_cid_hex, len, len1, range, ref, ref1, results;
    count = 0;
    for (i = 0, len = ranges.length; i < len; i++) {
      range = ranges[i];
      count += range[1] - range[0] + 1;
    }
    help(`found ${format_integer(count)} glyphs for ${rpr(pattern)}`);
    results = [];
    for (j = 0, len1 = ranges.length; j < len1; j++) {
      range = ranges[j];
      [first_cid, last_cid] = range;
      if (last_cid == null) {
        last_cid = first_cid;
      }
      glyphs = [];
      for (cid = k = ref = first_cid, ref1 = Math.min(first_cid + 10, last_cid); (ref <= ref1 ? k <= ref1 : k >= ref1); cid = ref <= ref1 ? ++k : --k) {
        glyphs.push(String.fromCodePoint(cid));
      }
      glyphs = glyphs.join('');
      first_cid_hex = `0x${first_cid.toString(16)}`;
      last_cid_hex = `0x${last_cid.toString(16)}`;
      count_txt = format_integer(last_cid - first_cid + 1);
      results.push(help(`${first_cid_hex} .. ${last_cid_hex} ${rpr(glyphs)} (${count_txt})`));
    }
    return results;
  };

  // #-----------------------------------------------------------------------------------------------------------
// # pattern_A   = /^\p{Script=Latin}$/u
// # pattern_B   = /^\p{Script_Extensions=Latin}$/u
// ### see https://github.com/mathiasbynens/regexpu-core/blob/master/property-escapes.md ###
// patterns    = []
// # patterns.push /^\p{Script_Extensions=Latin}$/u
// # patterns.push /^\p{Script=Latin}$/u
// # # patterns.push /^\p{Script_Extensions=Cyrillic}$/u
// # # patterns.push /^\p{Script_Extensions=Greek}$/u
// # patterns.push /^\p{Unified_Ideograph}$/u
// # patterns.push /^\p{Script=Han}$/u
// # patterns.push /^\p{Script_Extensions=Han}$/u
// # patterns.push /^\p{Ideographic}$/u
// # patterns.push /^\p{IDS_Binary_Operator}$/u
// # patterns.push /^\p{IDS_Trinary_Operator}$/u
// # patterns.push /^\p{Radical}$/u
// # patterns.push /^\p{Script_Extensions=Hiragana}$/u
// # patterns.push /^\p{Script=Hiragana}$/u
// # patterns.push /^\p{Script_Extensions=Katakana}$/u
// # patterns.push /^\p{Script=Katakana}$/u
// # patterns.push /^\p{ID_Continue}$/u
// patterns.push /^\p{Pattern_White_Space}$/u
// patterns.push /^\p{White_Space}$/u
// # patterns.push /^\p{Script_Extensions=Hangul}$/u
// for pattern in patterns
//   whisper '————————————————————————————'
//   whisper pattern
//   show_ranges walk_ranges_from_pattern pattern

  // # info isa.text_with_hiragana 'あいうえおか'
// # info isa.text_with_hiragana 'あいうえおかx'
// # info isa.text_with_hiragana 'abc'
// # info isa.text_hiragana      'あいうえおか'
// # info isa.text_hiragana      'あいうえおかx'

}).call(this);

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vc3JjL3VuaWNvZGUtcmFuZ2UtdG9vbHMuYnJpY3MuY29mZmVlIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBO0VBQUE7QUFBQSxNQUFBLDJCQUFBLEVBQUEsV0FBQTs7Ozs7O0VBT0EsMkJBQUEsR0FBOEIsUUFBQSxDQUFBLENBQUE7QUFFOUIsUUFBQSxLQUFBLEVBQUEsUUFBQSxFQUFBLFNBQUEsRUFBQSxpQkFBQSxFQUFBLEtBQUEsRUFBQSxPQUFBLEVBQUEsU0FBQSxFQUFBLElBQUEsRUFBQSxHQUFBLEVBQUEsVUFBQSxFQUFBLFNBQUEsRUFBQSxPQUFBLEVBQUEsS0FBQSxFQUFBLElBQUE7O0lBQ0UsU0FBQSxHQUFrQyxPQUFBLENBQVEsUUFBUjtJQUNsQyxDQUFBLENBQUUsT0FBRixDQUFBLEdBQWtDLFNBQVMsQ0FBQyxRQUFRLENBQUMsZUFBbkIsQ0FBQSxDQUFsQztJQUNBLENBQUEsQ0FBRSxVQUFGLENBQUEsR0FBa0MsU0FBUyxDQUFDLGtCQUFWLENBQUEsQ0FBbEM7SUFDQSxDQUFBLENBQUUsS0FBRixFQUNFLElBREYsQ0FBQSxHQUNrQyxPQURsQztJQUVBLENBQUEsQ0FBRSxHQUFGLENBQUEsR0FBa0MsT0FBQSxDQUFRLDhCQUFSLENBQWxDLEVBTkY7Ozs7Ozs7OztJQWVFLFNBQUEsR0FDRTtNQUFBLEtBQUEsRUFDRTtRQUFBLEVBQUEsRUFBWSxRQUFaO1FBQ0EsRUFBQSxFQUFZO01BRFosQ0FERjtNQUlBLFVBQUEsRUFDRTtRQUFBLEtBQUEsRUFBWSxHQUFaO1FBQ0EsRUFBQSxFQUFZLFFBRFo7UUFFQSxFQUFBLEVBQVksUUFGWjtRQUdBLElBQUEsRUFBTTtVQUVKLENBQUE7O1lBQUUsRUFBQSxFQUFJLFFBQU47WUFBZ0IsRUFBQSxFQUFJLFFBQXBCO1VBQUEsQ0FGSTtVQUdKO1lBQUUsRUFBQSxFQUFJLFFBQU47WUFBZ0IsRUFBQSxFQUFJLFFBQXBCO1VBQUEsQ0FISTs7TUFITjtJ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QUssQ0FBQSxDQUFBLENBQUcsYUFBSCxDQUFBLElBQUEsQ0FBQSxDQUF1QixZQUF2QixFQUFBLENBQUEsQ0FBdUMsR0FBQSxDQUFJLE1BQUosQ0FBdkMsQ0FBQSxFQUFBLENBQUEsQ0FBc0QsU0FBdEQsQ0FBQSxDQUFBLENBQUw7SUFWRixDQUFBOztFQUxZOztFQWhJZDs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OztBQUFBIiwic291cmNlc0NvbnRlbnQiOlsiJ3VzZSBzdHJpY3QnXG5cblxuIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjXG4jXG4jPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT1cbiMjIyBOT1RFIEZ1dHVyZSBTaW5nbGUtRmlsZSBNb2R1bGUgIyMjXG5yZXF1aXJlX3VuaWNvZGVfcmFuZ2VfdG9vbHMgPSAtPlxuXG4gICM9PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT1cbiAgU0ZNT0RVTEVTICAgICAgICAgICAgICAgICAgICAgICA9IHJlcXVpcmUgJy4vbWFpbidcbiAgeyB0eXBlX29mLCAgICAgICAgICAgICAgICAgICAgfSA9IFNGTU9EVUxFUy51bnN0YWJsZS5yZXF1aXJlX3R5cGVfb2YoKVxuICB7IHJwcl9zdHJpbmcsICAgICAgICAgICAgICAgICB9ID0gU0ZNT0RVTEVTLnJlcXVpcmVfcnByX3N0cmluZygpXG4gIHsgZGVidWcsXG4gICAgd2FybiAgICAgICAgICAgICAgICAgICAgICAgIH0gPSBjb25zb2xlXG4gIHsgbmZhLCAgICAgICAgICAgICAgICAgICAgICAgIH0gPSByZXF1aXJlICdub3JtYWxpemUtZnVuY3Rpb24tYXJndW1lbnRzJ1xuICAjLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uXG4gICMgeyBoaWRlLFxuICAjICAgc2V0X2dldHRlciwgICAgICAgICAgICAgICAgIH0gPSBTRk1PRFVMRVMucmVxdWlyZV9tYW5hZ2VkX3Byb3BlcnR5X3Rvb2xzKClcbiAgIyB7IGxldHMsXG4gICMgICBmcmVlemUsICAgICAgICAgICAgICAgICAgICAgfSA9IFNGTU9EVUxFUy5yZXF1aXJlX2xldHNmcmVlemV0aGF0X2luZnJhKCkuc2ltcGxlXG4gICMgbWlzZml0ICAgICAgICAgICAgICAgICAgICAgICAgICA9IFN5bWJvbCAnbWlzZml0J1xuXG4gICM9PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT1cbiAgdGVtcGxhdGVzID1cbiAgICByYW5nZTpcbiAgICAgIGxvOiAgICAgICAgIDB4MDAwMDAwXG4gICAgICBoaTogICAgICAgICAweDEwZmZmZlxuXG4gICAgZnJvbV9yZWdleDpcbiAgICAgIHJlZ2V4OiAgICAgIC98L1xuICAgICAgbG86ICAgICAgICAgMHgwMDAwMDBcbiAgICAgIGhpOiAgICAgICAgIDB4MTBmZmZmXG4gICAgICBza2lwOiBbXG4gICAgICAgICMgeyBsbzogMHgwMGUwMDAsIGhpOiAweDAwZWZmZiwgfSAjIEJNUCBQVUFzXG4gICAgICAgIHsgbG86IDB4MDBkODAwLCBoaTogMHgwMGRmZmYsIH0gIyBTdXJyb2dhdGVzXG4gICAgICAgIHsgbG86IDB4MGYwMDAwLCBoaTogMHgxMGZmZmYsIH0gIyBQVUEtQSwgUFVBLUJcbiAgICAgICAgIyB7IGxvOiAweDBmMDAwMCwgaGk6IDB4MGZmZmZmLCB9ICMgUFVBLUFcbiAgICAgICAgIyB7IGxvOiAweDEwMDAwMCwgaGk6IDB4MTBmZmZmLCB9ICMgUFVBLUJcbiAgICAgICAgXVxuXG4gICMtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiAgdHlwZXMgPVxuICAgIGZsb2F0OiAgICBpc2E6ICggeCApIC0+IE51bWJlci5pc0Zpbml0ZSB4XG4gICAgaW50ZWdlcjogIGlzYTogKCB4ICkgLT4gTnVtYmVyLmlzSW50ZWdlciB4XG4gICAgY2lkOiAgICAgIGlzYTogKCB4ICkgLT5cbiAgICAgIHJldHVybiBmYWxzZSB1bmxlc3MgQGludGVnZXIuaXNhIHhcbiAgICAgIHJldHVybiBmYWxzZSB1bmxlc3MgMHgwMDAwMDAgPD0geCA8PSAweDEwZmZmZlxuICAgICAgcmV0dXJuIHRydWVcbiAgICBjaWRfcGFpcjogaXNhOiAoIHggKSAtPlxuICAgICAgcmV0dXJuIGZhbHNlIHVubGVzcyBBcnJheS5pc0FycmF5IHhcbiAgICAgIHJldHVybiBmYWxzZSB1bmxlc3MgeC5sZW5ndGggaXMgMlxuICAgICAgcmV0dXJuIGZhbHNlIHVubGVzcyBAY2lkLmlzYSB4WyAwIF1cbiAgICAgIHJldHVybiBmYWxzZSB1bmxlc3MgQGNpZC5pc2EgeFsgMSBdXG4gICAgICByZXR1cm4gZmFsc2UgdW5sZXNzIHhbIDAgXSA8PSB4WyAxIF1cbiAgICAgIHJldHVybiB0cnVlXG5cbiAgIy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuICBpc2FzID1cbiAgICByYW5nZTogKCB4ICkgLT5cbiAgICAgICMgZGVidWcgJ86pdWNydF9fXzEnLCB4XG4gICAgICByZXR1cm4gdHJ1ZVxuICAgICAgdHlwZXMuY2lkX3BhaXIgWyB4LmxvLCB4LmhpLCBdXG5cbiAgIy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuICBjaWRfbWF0Y2hlc19yZWdleCA9ICggY2lkLCByZWdleCApIC0+IHJlZ2V4LnRlc3QgKCBTdHJpbmcuZnJvbUNvZGVQb2ludCBjaWQgKVxuXG4gICM9PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT1cbiAgaW50ZXJuYWxzID0geyB0ZW1wbGF0ZXMsIGlzYXMsIGNpZF9tYXRjaGVzX3JlZ2V4LCB9XG5cbiAgIz09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PVxuICBjbGFzcyBSYW5nZVxuXG4gICAgIy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiAgICBjb25zdHJ1Y3RvcjogbmZhIHsgaXNhOiBpc2FzLnJhbmdlLCB0ZW1wbGF0ZTogdGVtcGxhdGVzLnJhbmdlLCB9LCAoIGxvLCBoaSwgY2ZnICkgLT5cbiAgICAgIEBsbyA9IGNmZy5sb1xuICAgICAgQGhpID0gY2ZnLmhpXG4gICAgICA7dW5kZWZpbmVkXG5cbiAgICAjLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuICAgIGluY2x1ZGVzOiAoIGNpZCApIC0+IEBsbyA8PSBjaWQgPD0gQGhpXG5cblxuICAjPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09XG4gIGNsYXNzIFJhbmdlc2V0XG5cbiAgICAjLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuICAgIGNvbnN0cnVjdG9yOiAoIHJhbmdlcy4uLiApIC0+XG4gICAgICBAcmFuZ2VzID0gW11cbiAgICAgIGZvciByYW5nZSBpbiByYW5nZXNcbiAgICAgICAgcmFuZ2UgPSBuZXcgUmFuZ2UgcmFuZ2UgdW5sZXNzIHJhbmdlIGluc3RhbmNlb2YgUmFuZ2VcbiAgICAgICAgQHJhbmdlcy5wdXNoIHJhbmdlXG4gICAgICA7dW5kZWZpbmVkXG5cbiAgICAjLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuICAgIGluY2x1ZGVzOiAoIGNpZCApIC0+IEByYW5nZXMuc29tZSAoIHIgKSAtPiByLmluY2x1ZGVzIGNpZFxuXG4gICAgIy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiAgICBAZnJvbV9yZWdleDogbmZhIHsgdGVtcGxhdGU6IHRlbXBsYXRlcy5mcm9tX3JlZ2V4LCB9LCAoIHJlZ2V4LCBjZmcgKSAtPlxuICAgICAgc2tpcCAgICAgICAgPSBuZXcgUmFuZ2VzZXQgY2ZnLnNraXAuLi5cbiAgICAgIFIgICAgICAgICAgID0gW11cbiAgICAgIHJhbmdlICAgICAgID0gbnVsbFxuICAgICAgIy4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uXG4gICAgICBmb3IgY2lkIGluIFsgY2ZnLmxvIC4uIGNmZy5oaSBdICMjIyBUQUlOVCBhbGxvdyBtdWx0aXBsZSBpbmNsdXNpb24gcmFuZ2VzICMjI1xuICAgICAgICAjLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uXG4gICAgICAgIGlmICggbm90IHNraXAuaW5jbHVkZXMgY2lkICkgYW5kICggY2lkX21hdGNoZXNfcmVnZXggY2lkLCByZWdleCApXG4gICAgICAgICAgdW5sZXNzIHJhbmdlP1xuICAgICAgICAgICAgcmFuZ2UgPSB7IGxvOiBjaWQsIH1cbiAgICAgICAgICAgIFIucHVzaCByYW5nZVxuICAgICAgICAjLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uXG4gICAgICAgIGVsc2VcbiAgICAgICAgICBpZiByYW5nZT9cbiAgICAgICAgICAgIHJhbmdlLmhpICA9IGNpZCAtIDFcbiAgICAgICAgICAgIHJhbmdlICAgICA9IG51bGxcbiAgICAgICMuLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLlxuICAgICAgZGVidWcgJ86pdWNydF9fXzEnLCBSXG4gICAgICByZXR1cm4gbmV3IFJhbmdlc2V0IFIuLi5cblxuICAjPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09XG4gIHJldHVybiBleHBvcnRzID0geyBSYW5nZSwgUmFuZ2VzZXQsIGludGVybmFscywgfVxuXG4jPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT1cbm1vZHVsZS5leHBvcnRzID0geyByZXF1aXJlX3VuaWNvZGVfcmFuZ2VfdG9vbHMsIH1cblxuXG5cblxuIy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG5zaG93X3JhbmdlcyA9ICggcmFuZ2VzICkgLT5cbiAgY291bnQgPSAwXG4gIGZvciByYW5nZSBpbiByYW5nZXNcbiAgICBjb3VudCArPSByYW5nZVsgMSBdIC0gcmFuZ2VbIDAgXSArIDFcbiAgaGVscCBcImZvdW5kICN7Zm9ybWF0X2ludGVnZXIgY291bnR9IGdseXBocyBmb3IgI3tycHIgcGF0dGVybn1cIlxuICBmb3IgcmFuZ2UgaW4gcmFuZ2VzXG4gICAgWyBmaXJzdF9jaWQsIGxhc3RfY2lkLCBdICA9IHJhbmdlXG4gICAgbGFzdF9jaWQgICAgICAgICAgICAgICAgID89IGZpcnN0X2NpZFxuICAgIGdseXBocyAgICAgICAgICAgICAgICAgICAgPSBbXVxuICAgIGZvciBjaWQgaW4gWyBmaXJzdF9jaWQgLi4gKCBNYXRoLm1pbiBmaXJzdF9jaWQgKyAxMCwgbGFzdF9jaWQgKSBdXG4gICAgICBnbHlwaHMucHVzaCBTdHJpbmcuZnJvbUNvZGVQb2ludCBjaWRcbiAgICBnbHlwaHMgPSBnbHlwaHMuam9pbiAnJ1xuICAgIGZpcnN0X2NpZF9oZXggPSBcIjB4I3tmaXJzdF9jaWQudG9TdHJpbmcgMTZ9XCJcbiAgICBsYXN0X2NpZF9oZXggID0gXCIweCN7bGFzdF9jaWQudG9TdHJpbmcgMTZ9XCJcbiAgICBjb3VudF90eHQgICAgID0gZm9ybWF0X2ludGVnZXIgbGFzdF9jaWQgLSBmaXJzdF9jaWQgKyAxXG4gICAgaGVscCBcIiN7Zmlyc3RfY2lkX2hleH0gLi4gI3tsYXN0X2NpZF9oZXh9ICN7cnByIGdseXBoc30gKCN7Y291bnRfdHh0fSlcIlxuXG5cblxuIyAjLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiMgIyBwYXR0ZXJuX0EgICA9IC9eXFxwe1NjcmlwdD1MYXRpbn0kL3VcbiMgIyBwYXR0ZXJuX0IgICA9IC9eXFxwe1NjcmlwdF9FeHRlbnNpb25zPUxhdGlufSQvdVxuIyAjIyMgc2VlIGh0dHBzOi8vZ2l0aHViLmNvbS9tYXRoaWFzYnluZW5zL3JlZ2V4cHUtY29yZS9ibG9iL21hc3Rlci9wcm9wZXJ0eS1lc2NhcGVzLm1kICMjI1xuIyBwYXR0ZXJucyAgICA9IFtdXG4jICMgcGF0dGVybnMucHVzaCAvXlxccHtTY3JpcHRfRXh0ZW5zaW9ucz1MYXRpbn0kL3VcbiMgIyBwYXR0ZXJucy5wdXNoIC9eXFxwe1NjcmlwdD1MYXRpbn0kL3VcbiMgIyAjIHBhdHRlcm5zLnB1c2ggL15cXHB7U2NyaXB0X0V4dGVuc2lvbnM9Q3lyaWxsaWN9JC91XG4jICMgIyBwYXR0ZXJucy5wdXNoIC9eXFxwe1NjcmlwdF9FeHRlbnNpb25zPUdyZWVrfSQvdVxuIyAjIHBhdHRlcm5zLnB1c2ggL15cXHB7VW5pZmllZF9JZGVvZ3JhcGh9JC91XG4jICMgcGF0dGVybnMucHVzaCAvXlxccHtTY3JpcHQ9SGFufSQvdVxuIyAjIHBhdHRlcm5zLnB1c2ggL15cXHB7U2NyaXB0X0V4dGVuc2lvbnM9SGFufSQvdVxuIyAjIHBhdHRlcm5zLnB1c2ggL15cXHB7SWRlb2dyYXBoaWN9JC91XG4jICMgcGF0dGVybnMucHVzaCAvXlxccHtJRFNfQmluYXJ5X09wZXJhdG9yfSQvdVxuIyAjIHBhdHRlcm5zLnB1c2ggL15cXHB7SURTX1RyaW5hcnlfT3BlcmF0b3J9JC91XG4jICMgcGF0dGVybnMucHVzaCAvXlxccHtSYWRpY2FsfSQvdVxuIyAjIHBhdHRlcm5zLnB1c2ggL15cXHB7U2NyaXB0X0V4dGVuc2lvbnM9SGlyYWdhbmF9JC91XG4jICMgcGF0dGVybnMucHVzaCAvXlxccHtTY3JpcHQ9SGlyYWdhbmF9JC91XG4jICMgcGF0dGVybnMucHVzaCAvXlxccHtTY3JpcHRfRXh0ZW5zaW9ucz1LYXRha2FuYX0kL3VcbiMgIyBwYXR0ZXJucy5wdXNoIC9eXFxwe1NjcmlwdD1LYXRha2FuYX0kL3VcbiMgIyBwYXR0ZXJucy5wdXNoIC9eXFxwe0lEX0NvbnRpbnVlfSQvdVxuIyBwYXR0ZXJucy5wdXNoIC9eXFxwe1BhdHRlcm5fV2hpdGVfU3BhY2V9JC91XG4jIHBhdHRlcm5zLnB1c2ggL15cXHB7V2hpdGVfU3BhY2V9JC91XG4jICMgcGF0dGVybnMucHVzaCAvXlxccHtTY3JpcHRfRXh0ZW5zaW9ucz1IYW5ndWx9JC91XG4jIGZvciBwYXR0ZXJuIGluIHBhdHRlcm5zXG4jICAgd2hpc3BlciAn4oCU4oCU4oCU4oCU4oCU4oCU4oCU4oCU4oCU4oCU4oCU4oCU4oCU4oCU4oCU4oCU4oCU4oCU4oCU4oCU4oCU4oCU4oCU4oCU4oCU4oCU4oCU4oCUJ1xuIyAgIHdoaXNwZXIgcGF0dGVyblxuIyAgIHNob3dfcmFuZ2VzIHdhbGtfcmFuZ2VzX2Zyb21fcGF0dGVybiBwYXR0ZXJuXG5cbiMgIyBpbmZvIGlzYS50ZXh0X3dpdGhfaGlyYWdhbmEgJ+OBguOBhOOBhuOBiOOBiuOBiydcbiMgIyBpbmZvIGlzYS50ZXh0X3dpdGhfaGlyYWdhbmEgJ+OBguOBhOOBhuOBiOOBiuOBi3gnXG4jICMgaW5mbyBpc2EudGV4dF93aXRoX2hpcmFnYW5hICdhYmMnXG4jICMgaW5mbyBpc2EudGV4dF9oaXJhZ2FuYSAgICAgICfjgYLjgYTjgYbjgYjjgYrjgYsnXG4jICMgaW5mbyBpc2EudGV4dF9oaXJhZ2FuYSAgICAgICfjgYLjgYTjgYbjgYjjgYrjgYt4J1xuXG4iXX0=
