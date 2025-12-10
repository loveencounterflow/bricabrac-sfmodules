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
            lo: 0x00e000,
            hi: 0x00efff // BMP PUAs
          },
          {
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

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vc3JjL3VuaWNvZGUtcmFuZ2UtdG9vbHMuYnJpY3MuY29mZmVlIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBO0VBQUE7QUFBQSxNQUFBLDJCQUFBLEVBQUEsV0FBQTs7Ozs7O0VBT0EsMkJBQUEsR0FBOEIsUUFBQSxDQUFBLENBQUE7QUFFOUIsUUFBQSxLQUFBLEVBQUEsUUFBQSxFQUFBLFNBQUEsRUFBQSxpQkFBQSxFQUFBLEtBQUEsRUFBQSxPQUFBLEVBQUEsU0FBQSxFQUFBLElBQUEsRUFBQSxHQUFBLEVBQUEsVUFBQSxFQUFBLFNBQUEsRUFBQSxPQUFBLEVBQUEsS0FBQSxFQUFBLElBQUE7O0lBQ0UsU0FBQSxHQUFrQyxPQUFBLENBQVEsUUFBUjtJQUNsQyxDQUFBLENBQUUsT0FBRixDQUFBLEdBQWtDLFNBQVMsQ0FBQyxRQUFRLENBQUMsZUFBbkIsQ0FBQSxDQUFsQztJQUNBLENBQUEsQ0FBRSxVQUFGLENBQUEsR0FBa0MsU0FBUyxDQUFDLGtCQUFWLENBQUEsQ0FBbEM7SUFDQSxDQUFBLENBQUUsS0FBRixFQUNFLElBREYsQ0FBQSxHQUNrQyxPQURsQztJQUVBLENBQUEsQ0FBRSxHQUFGLENBQUEsR0FBa0MsT0FBQSxDQUFRLDhCQUFSLENBQWxDLEVBTkY7Ozs7Ozs7OztJQWVFLFNBQUEsR0FDRTtNQUFBLEtBQUEsRUFDRTtRQUFBLEVBQUEsRUFBWSxRQUFaO1FBQ0EsRUFBQSxFQUFZO01BRFosQ0FERjtNQUlBLFVBQUEsRUFDRTtRQUFBLEtBQUEsRUFBWSxHQUFaO1FBQ0EsRUFBQSxFQUFZLFFBRFo7UUFFQSxFQUFBLEVBQVksUUFGWjtRQUdBLElBQUEsRUFBTTtVQUNKO1lBQUUsRUFBQSxFQUFJLFFBQU47WUFBZ0IsRUFBQSxFQUFJLFFBQXBCO1VBQUEsQ0FESTtVQUVKO1lBQUUsRUFBQSxFQUFJLFFBQU47WUFBZ0IsRUFBQSxFQUFJLFFBQXBCO1VBQUEsQ0FGSTtVQUdKO1lBQUUsRUFB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Y0FBQSxDQUFlLFFBQUEsR0FBVyxTQUFYLEdBQXVCLENBQXRDO21CQUNoQixJQUFBLENBQUssQ0FBQSxDQUFBLENBQUcsYUFBSCxDQUFBLElBQUEsQ0FBQSxDQUF1QixZQUF2QixFQUFBLENBQUEsQ0FBdUMsR0FBQSxDQUFJLE1BQUosQ0FBdkMsQ0FBQSxFQUFBLENBQUEsQ0FBc0QsU0FBdEQsQ0FBQSxDQUFBLENBQUw7SUFWRixDQUFBOztFQUxZOztFQWhJZDs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OztBQUFBIiwic291cmNlc0NvbnRlbnQiOlsiJ3VzZSBzdHJpY3QnXG5cblxuIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjXG4jXG4jPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT1cbiMjIyBOT1RFIEZ1dHVyZSBTaW5nbGUtRmlsZSBNb2R1bGUgIyMjXG5yZXF1aXJlX3VuaWNvZGVfcmFuZ2VfdG9vbHMgPSAtPlxuXG4gICM9PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT1cbiAgU0ZNT0RVTEVTICAgICAgICAgICAgICAgICAgICAgICA9IHJlcXVpcmUgJy4vbWFpbidcbiAgeyB0eXBlX29mLCAgICAgICAgICAgICAgICAgICAgfSA9IFNGTU9EVUxFUy51bnN0YWJsZS5yZXF1aXJlX3R5cGVfb2YoKVxuICB7IHJwcl9zdHJpbmcsICAgICAgICAgICAgICAgICB9ID0gU0ZNT0RVTEVTLnJlcXVpcmVfcnByX3N0cmluZygpXG4gIHsgZGVidWcsXG4gICAgd2FybiAgICAgICAgICAgICAgICAgICAgICAgIH0gPSBjb25zb2xlXG4gIHsgbmZhLCAgICAgICAgICAgICAgICAgICAgICAgIH0gPSByZXF1aXJlICdub3JtYWxpemUtZnVuY3Rpb24tYXJndW1lbnRzJ1xuICAjLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uXG4gICMgeyBoaWRlLFxuICAjICAgc2V0X2dldHRlciwgICAgICAgICAgICAgICAgIH0gPSBTRk1PRFVMRVMucmVxdWlyZV9tYW5hZ2VkX3Byb3BlcnR5X3Rvb2xzKClcbiAgIyB7IGxldHMsXG4gICMgICBmcmVlemUsICAgICAgICAgICAgICAgICAgICAgfSA9IFNGTU9EVUxFUy5yZXF1aXJlX2xldHNmcmVlemV0aGF0X2luZnJhKCkuc2ltcGxlXG4gICMgbWlzZml0ICAgICAgICAgICAgICAgICAgICAgICAgICA9IFN5bWJvbCAnbWlzZml0J1xuXG4gICM9PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT1cbiAgdGVtcGxhdGVzID1cbiAgICByYW5nZTpcbiAgICAgIGxvOiAgICAgICAgIDB4MDAwMDAwXG4gICAgICBoaTogICAgICAgICAweDEwZmZmZlxuXG4gICAgZnJvbV9yZWdleDpcbiAgICAgIHJlZ2V4OiAgICAgIC98L1xuICAgICAgbG86ICAgICAgICAgMHgwMDAwMDBcbiAgICAgIGhpOiAgICAgICAgIDB4MTBmZmZmXG4gICAgICBza2lwOiBbXG4gICAgICAgIHsgbG86IDB4MDBlMDAwLCBoaTogMHgwMGVmZmYsIH0gIyBCTVAgUFVBc1xuICAgICAgICB7IGxvOiAweDAwZDgwMCwgaGk6IDB4MDBkZmZmLCB9ICMgU3Vycm9nYXRlc1xuICAgICAgICB7IGxvOiAweDBmMDAwMCwgaGk6IDB4MTBmZmZmLCB9ICMgUFVBLUEsIFBVQS1CXG4gICAgICAgICMgeyBsbzogMHgwZjAwMDAsIGhpOiAweDBmZmZmZiwgfSAjIFBVQS1BXG4gICAgICAgICMgeyBsbzogMHgxMDAwMDAsIGhpOiAweDEwZmZmZiwgfSAjIFBVQS1CXG4gICAgICAgIF1cblxuICAjLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4gIHR5cGVzID1cbiAgICBmbG9hdDogICAgaXNhOiAoIHggKSAtPiBOdW1iZXIuaXNGaW5pdGUgeFxuICAgIGludGVnZXI6ICBpc2E6ICggeCApIC0+IE51bWJlci5pc0ludGVnZXIgeFxuICAgIGNpZDogICAgICBpc2E6ICggeCApIC0+XG4gICAgICByZXR1cm4gZmFsc2UgdW5sZXNzIEBpbnRlZ2VyLmlzYSB4XG4gICAgICByZXR1cm4gZmFsc2UgdW5sZXNzIDB4MDAwMDAwIDw9IHggPD0gMHgxMGZmZmZcbiAgICAgIHJldHVybiB0cnVlXG4gICAgY2lkX3BhaXI6IGlzYTogKCB4ICkgLT5cbiAgICAgIHJldHVybiBmYWxzZSB1bmxlc3MgQXJyYXkuaXNBcnJheSB4XG4gICAgICByZXR1cm4gZmFsc2UgdW5sZXNzIHgubGVuZ3RoIGlzIDJcbiAgICAgIHJldHVybiBmYWxzZSB1bmxlc3MgQGNpZC5pc2EgeFsgMCBdXG4gICAgICByZXR1cm4gZmFsc2UgdW5sZXNzIEBjaWQuaXNhIHhbIDEgXVxuICAgICAgcmV0dXJuIGZhbHNlIHVubGVzcyB4WyAwIF0gPD0geFsgMSBdXG4gICAgICByZXR1cm4gdHJ1ZVxuXG4gICMtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiAgaXNhcyA9XG4gICAgcmFuZ2U6ICggeCApIC0+XG4gICAgICAjIGRlYnVnICfOqXVjcnRfX18xJywgeFxuICAgICAgcmV0dXJuIHRydWVcbiAgICAgIHR5cGVzLmNpZF9wYWlyIFsgeC5sbywgeC5oaSwgXVxuXG4gICMtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiAgY2lkX21hdGNoZXNfcmVnZXggPSAoIGNpZCwgcmVnZXggKSAtPiByZWdleC50ZXN0ICggU3RyaW5nLmZyb21Db2RlUG9pbnQgY2lkIClcblxuICAjPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09XG4gIGludGVybmFscyA9IHsgdGVtcGxhdGVzLCBpc2FzLCBjaWRfbWF0Y2hlc19yZWdleCwgfVxuXG4gICM9PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT1cbiAgY2xhc3MgUmFuZ2VcblxuICAgICMtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4gICAgY29uc3RydWN0b3I6IG5mYSB7IGlzYTogaXNhcy5yYW5nZSwgdGVtcGxhdGU6IHRlbXBsYXRlcy5yYW5nZSwgfSwgKCBsbywgaGksIGNmZyApIC0+XG4gICAgICBAbG8gPSBjZmcubG9cbiAgICAgIEBoaSA9IGNmZy5oaVxuICAgICAgO3VuZGVmaW5lZFxuXG4gICAgIy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiAgICBpbmNsdWRlczogKCBjaWQgKSAtPiBAbG8gPD0gY2lkIDw9IEBoaVxuXG5cbiAgIz09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PVxuICBjbGFzcyBSYW5nZXNldFxuXG4gICAgIy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiAgICBjb25zdHJ1Y3RvcjogKCByYW5nZXMuLi4gKSAtPlxuICAgICAgQHJhbmdlcyA9IFtdXG4gICAgICBmb3IgcmFuZ2UgaW4gcmFuZ2VzXG4gICAgICAgIHJhbmdlID0gbmV3IFJhbmdlIHJhbmdlIHVubGVzcyByYW5nZSBpbnN0YW5jZW9mIFJhbmdlXG4gICAgICAgIEByYW5nZXMucHVzaCByYW5nZVxuICAgICAgO3VuZGVmaW5lZFxuXG4gICAgIy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiAgICBpbmNsdWRlczogKCBjaWQgKSAtPiBAcmFuZ2VzLnNvbWUgKCByICkgLT4gci5pbmNsdWRlcyBjaWRcblxuICAgICMtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4gICAgQGZyb21fcmVnZXg6IG5mYSB7IHRlbXBsYXRlOiB0ZW1wbGF0ZXMuZnJvbV9yZWdleCwgfSwgKCByZWdleCwgY2ZnICkgLT5cbiAgICAgIHNraXAgICAgICAgID0gbmV3IFJhbmdlc2V0IGNmZy5za2lwLi4uXG4gICAgICBSICAgICAgICAgICA9IFtdXG4gICAgICByYW5nZSAgICAgICA9IG51bGxcbiAgICAgICMuLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLlxuICAgICAgZm9yIGNpZCBpbiBbIGNmZy5sbyAuLiBjZmcuaGkgXSAjIyMgVEFJTlQgYWxsb3cgbXVsdGlwbGUgaW5jbHVzaW9uIHJhbmdlcyAjIyNcbiAgICAgICAgIy4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLlxuICAgICAgICBpZiAoIG5vdCBza2lwLmluY2x1ZGVzIGNpZCApIGFuZCAoIGNpZF9tYXRjaGVzX3JlZ2V4IGNpZCwgcmVnZXggKVxuICAgICAgICAgIHVubGVzcyByYW5nZT9cbiAgICAgICAgICAgIHJhbmdlID0geyBsbzogY2lkLCB9XG4gICAgICAgICAgICBSLnB1c2ggcmFuZ2VcbiAgICAgICAgIy4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLlxuICAgICAgICBlbHNlXG4gICAgICAgICAgaWYgcmFuZ2U/XG4gICAgICAgICAgICByYW5nZS5oaSAgPSBjaWQgLSAxXG4gICAgICAgICAgICByYW5nZSAgICAgPSBudWxsXG4gICAgICAjLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi5cbiAgICAgIGRlYnVnICfOqXVjcnRfX18xJywgUlxuICAgICAgcmV0dXJuIG5ldyBSYW5nZXNldCBSLi4uXG5cbiAgIz09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PVxuICByZXR1cm4gZXhwb3J0cyA9IHsgUmFuZ2UsIFJhbmdlc2V0LCBpbnRlcm5hbHMsIH1cblxuIz09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09XG5tb2R1bGUuZXhwb3J0cyA9IHsgcmVxdWlyZV91bmljb2RlX3JhbmdlX3Rvb2xzLCB9XG5cblxuXG5cbiMtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuc2hvd19yYW5nZXMgPSAoIHJhbmdlcyApIC0+XG4gIGNvdW50ID0gMFxuICBmb3IgcmFuZ2UgaW4gcmFuZ2VzXG4gICAgY291bnQgKz0gcmFuZ2VbIDEgXSAtIHJhbmdlWyAwIF0gKyAxXG4gIGhlbHAgXCJmb3VuZCAje2Zvcm1hdF9pbnRlZ2VyIGNvdW50fSBnbHlwaHMgZm9yICN7cnByIHBhdHRlcm59XCJcbiAgZm9yIHJhbmdlIGluIHJhbmdlc1xuICAgIFsgZmlyc3RfY2lkLCBsYXN0X2NpZCwgXSAgPSByYW5nZVxuICAgIGxhc3RfY2lkICAgICAgICAgICAgICAgICA/PSBmaXJzdF9jaWRcbiAgICBnbHlwaHMgICAgICAgICAgICAgICAgICAgID0gW11cbiAgICBmb3IgY2lkIGluIFsgZmlyc3RfY2lkIC4uICggTWF0aC5taW4gZmlyc3RfY2lkICsgMTAsIGxhc3RfY2lkICkgXVxuICAgICAgZ2x5cGhzLnB1c2ggU3RyaW5nLmZyb21Db2RlUG9pbnQgY2lkXG4gICAgZ2x5cGhzID0gZ2x5cGhzLmpvaW4gJydcbiAgICBmaXJzdF9jaWRfaGV4ID0gXCIweCN7Zmlyc3RfY2lkLnRvU3RyaW5nIDE2fVwiXG4gICAgbGFzdF9jaWRfaGV4ICA9IFwiMHgje2xhc3RfY2lkLnRvU3RyaW5nIDE2fVwiXG4gICAgY291bnRfdHh0ICAgICA9IGZvcm1hdF9pbnRlZ2VyIGxhc3RfY2lkIC0gZmlyc3RfY2lkICsgMVxuICAgIGhlbHAgXCIje2ZpcnN0X2NpZF9oZXh9IC4uICN7bGFzdF9jaWRfaGV4fSAje3JwciBnbHlwaHN9ICgje2NvdW50X3R4dH0pXCJcblxuXG5cbiMgIy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4jICMgcGF0dGVybl9BICAgPSAvXlxccHtTY3JpcHQ9TGF0aW59JC91XG4jICMgcGF0dGVybl9CICAgPSAvXlxccHtTY3JpcHRfRXh0ZW5zaW9ucz1MYXRpbn0kL3VcbiMgIyMjIHNlZSBodHRwczovL2dpdGh1Yi5jb20vbWF0aGlhc2J5bmVucy9yZWdleHB1LWNvcmUvYmxvYi9tYXN0ZXIvcHJvcGVydHktZXNjYXBlcy5tZCAjIyNcbiMgcGF0dGVybnMgICAgPSBbXVxuIyAjIHBhdHRlcm5zLnB1c2ggL15cXHB7U2NyaXB0X0V4dGVuc2lvbnM9TGF0aW59JC91XG4jICMgcGF0dGVybnMucHVzaCAvXlxccHtTY3JpcHQ9TGF0aW59JC91XG4jICMgIyBwYXR0ZXJucy5wdXNoIC9eXFxwe1NjcmlwdF9FeHRlbnNpb25zPUN5cmlsbGljfSQvdVxuIyAjICMgcGF0dGVybnMucHVzaCAvXlxccHtTY3JpcHRfRXh0ZW5zaW9ucz1HcmVla30kL3VcbiMgIyBwYXR0ZXJucy5wdXNoIC9eXFxwe1VuaWZpZWRfSWRlb2dyYXBofSQvdVxuIyAjIHBhdHRlcm5zLnB1c2ggL15cXHB7U2NyaXB0PUhhbn0kL3VcbiMgIyBwYXR0ZXJucy5wdXNoIC9eXFxwe1NjcmlwdF9FeHRlbnNpb25zPUhhbn0kL3VcbiMgIyBwYXR0ZXJucy5wdXNoIC9eXFxwe0lkZW9ncmFwaGljfSQvdVxuIyAjIHBhdHRlcm5zLnB1c2ggL15cXHB7SURTX0JpbmFyeV9PcGVyYXRvcn0kL3VcbiMgIyBwYXR0ZXJucy5wdXNoIC9eXFxwe0lEU19UcmluYXJ5X09wZXJhdG9yfSQvdVxuIyAjIHBhdHRlcm5zLnB1c2ggL15cXHB7UmFkaWNhbH0kL3VcbiMgIyBwYXR0ZXJucy5wdXNoIC9eXFxwe1NjcmlwdF9FeHRlbnNpb25zPUhpcmFnYW5hfSQvdVxuIyAjIHBhdHRlcm5zLnB1c2ggL15cXHB7U2NyaXB0PUhpcmFnYW5hfSQvdVxuIyAjIHBhdHRlcm5zLnB1c2ggL15cXHB7U2NyaXB0X0V4dGVuc2lvbnM9S2F0YWthbmF9JC91XG4jICMgcGF0dGVybnMucHVzaCAvXlxccHtTY3JpcHQ9S2F0YWthbmF9JC91XG4jICMgcGF0dGVybnMucHVzaCAvXlxccHtJRF9Db250aW51ZX0kL3VcbiMgcGF0dGVybnMucHVzaCAvXlxccHtQYXR0ZXJuX1doaXRlX1NwYWNlfSQvdVxuIyBwYXR0ZXJucy5wdXNoIC9eXFxwe1doaXRlX1NwYWNlfSQvdVxuIyAjIHBhdHRlcm5zLnB1c2ggL15cXHB7U2NyaXB0X0V4dGVuc2lvbnM9SGFuZ3VsfSQvdVxuIyBmb3IgcGF0dGVybiBpbiBwYXR0ZXJuc1xuIyAgIHdoaXNwZXIgJ+KAlOKAlOKAlOKAlOKAlOKAlOKAlOKAlOKAlOKAlOKAlOKAlOKAlOKAlOKAlOKAlOKAlOKAlOKAlOKAlOKAlOKAlOKAlOKAlOKAlOKAlOKAlOKAlCdcbiMgICB3aGlzcGVyIHBhdHRlcm5cbiMgICBzaG93X3JhbmdlcyB3YWxrX3Jhbmdlc19mcm9tX3BhdHRlcm4gcGF0dGVyblxuXG4jICMgaW5mbyBpc2EudGV4dF93aXRoX2hpcmFnYW5hICfjgYLjgYTjgYbjgYjjgYrjgYsnXG4jICMgaW5mbyBpc2EudGV4dF93aXRoX2hpcmFnYW5hICfjgYLjgYTjgYbjgYjjgYrjgYt4J1xuIyAjIGluZm8gaXNhLnRleHRfd2l0aF9oaXJhZ2FuYSAnYWJjJ1xuIyAjIGluZm8gaXNhLnRleHRfaGlyYWdhbmEgICAgICAn44GC44GE44GG44GI44GK44GLJ1xuIyAjIGluZm8gaXNhLnRleHRfaGlyYWdhbmEgICAgICAn44GC44GE44GG44GI44GK44GLeCdcblxuIl19
