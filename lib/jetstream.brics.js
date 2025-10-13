(function() {
  'use strict';
  var debug, require_jetstream;

  //===========================================================================================================
  ({debug} = console);

  //###########################################################################################################

  //===========================================================================================================
  require_jetstream = function() {
    var $, CFG, Jetstream, Selector, _normalize_selectors, _type_of, exports, hide, id_from_symbol, internals, nameit, normalize_selectors, selectors_as_list, set_getter, type_of;
    ({nameit} = (require('./various-brics')).require_nameit());
    ({
      type_of: _type_of
    } = (require('./unstable-rpr-type_of-brics')).require_type_of());
    ({hide, set_getter} = (require('./various-brics')).require_managed_property_tools());
    CFG = Symbol('CFG');
    //=========================================================================================================
    type_of = function(x) {
      if (x instanceof Jetstream) {
        return 'jetstream';
      } else {
        return _type_of(x);
      }
    };
    //=========================================================================================================
    Selector = class Selector {
      constructor(...selectors) {
        var match, ref, selector, selectors_rpr;
        ({selectors_rpr, selectors} = _normalize_selectors(...selectors));
        this.selectors_rpr = selectors_rpr;
        this.data = selectors.size === 0 ? true : false;
        this.cues = false;
        for (selector of selectors) {
          switch (true) {
            case selector === 'data#*':
              this.data = true;
              break;
            case selector === 'cue#*':
              this.cues = true;
              break;
            case (match = selector.match(/^data#(?<id>.+)$/)) != null:
              /* TAINT mention original selector next to normalized form */
              throw new Error(`Ωjstrm_188 IDs on data items not supported, got ${selector}`);
            case (match = selector.match(/^cue#(?<id>.+)$/)) != null:
              if ((ref = this.cues) === true || ref === false) {
                this.cues = new Set();
              }
              this.cues.add(match.groups.id);
              break;
            default:
              null;
          }
        }
        this.accept_all = (this.data === true) && (this.cues === true);
        return void 0;
      }

      //-------------------------------------------------------------------------------------------------------
      _get_excerpt() {
        return {
          data: this.data,
          cues: this.cues,
          accept_all: this.accept_all
        };
      }

      //-------------------------------------------------------------------------------------------------------
      select(item) {
        var is_cue;
        if (this.accept_all) {
          return true;
        }
        if (is_cue = (typeof item) === 'symbol') {
          if (this.cues === true) {
            return true;
          }
          if (this.cues === false) {
            return false;
          }
          return this.cues.has(id_from_symbol(item));
        }
        if (this.data === true) {
          return true;
        }
        if (this.data === false) {
          return false;
        }
        throw new Error(`Ωjstrm_189 IDs on data items not supported in selector ${rpr(this.toString)}`);
      }

      // return @data.has id_from_value item

        //-------------------------------------------------------------------------------------------------------
      /* TAINT should provide method to generate normalized representation */
      toString() {
        return this.selectors_rpr;
      }

    };
    //---------------------------------------------------------------------------------------------------------
    id_from_symbol = function(symbol) {
      var R;
      R = String(symbol);
      return R.slice(7, R.length - 1);
    };
    //---------------------------------------------------------------------------------------------------------
    selectors_as_list = function(...selectors) {
      if (selectors.length === 0) {
        return [];
      }
      selectors = selectors.flat(2e308);
      if (selectors.length === 0) {
        return [];
      }
      if (selectors.length === 1 && selectors[0] === '') {
        return [''];
      }
      selectors = selectors.join(',');
      selectors = selectors.replace(/\s+/g, '');
      selectors = selectors.split(',');
/* TAINT not generally possible */      return selectors;
    };
    //---------------------------------------------------------------------------------------------------------
    normalize_selectors = function(...selectors) {
      return (_normalize_selectors(...selectors)).selectors;
    };
    //---------------------------------------------------------------------------------------------------------
    _normalize_selectors = function(...selectors) {
      var R, i, len, selector, selectors_rpr;
      selectors = selectors_as_list(...selectors);
      selectors_rpr = selectors.join(', ');
      R = new Set();
      for (i = 0, len = selectors.length; i < len; i++) {
        selector = selectors[i];
        switch (true) {
          case selector === '':
            null;
            break;
          case selector === '#':
            R.add("cue#*");
            break;
          case /^#.+/.test(selector):
            R.add(`cue${selector}`);
            break;
          case /.+#$/.test(selector):
            R.add(`${selector}*`);
            break;
          case !/#/.test(selector):
            R.add(`${selector}#*`);
            break;
          default:
            R.add(selector);
        }
      }
      if (R.size === 0) {
        R.add('data#*');
      }
      if (R.size !== 1) {
        R.delete('');
      }
      return {
        selectors: R,
        selectors_rpr
      };
    };
    //=========================================================================================================
    $ = function(cfg, gfn) {
      var R, type;
      switch (type = type_of(gfn)) {
        case 'jetstream':
          R = nameit('(cfg)_(jetstream)', function*(d) {
            return (yield* gfn.walk.call(this, d));
          });
          break;
        case 'function':
          R = nameit(`(cfg)_(watcher)_${gfn.name}`, function*(d) {
            gfn.call(this, d);
            return (yield d);
          });
          break;
        case 'generatorfunction':
          R = nameit(`(cfg)_${gfn.name}`, function*(d) {
            return (yield* gfn.call(this, d));
          });
      }
      R[CFG] = cfg;
      return R;
    };
    Jetstream = (function() {
      //=========================================================================================================
      class Jetstream {
        //-------------------------------------------------------------------------------------------------------
        constructor() {
          /* TAINT use Object.freeze, push sets new array */
          this.transforms = [];
          this.shelf = [];
          return void 0;
        }

        //=======================================================================================================
        send(...ds) {
          this.shelf.splice(this.shelf.length, 0, ...ds);
          return null;
        }

        //-------------------------------------------------------------------------------------------------------
        cue(names) {
          var name;
          return this.send(...((function() {
            var i, len, results;
            results = [];
            for (i = 0, len = names.length; i < len; i++) {
              name = names[i];
              results.push(Symbol(name));
            }
            return results;
          })()));
        }

        //=======================================================================================================
        get_first(...P) {
          var R;
          if ((R = this.run(...P)).length === 0) {
            throw new Error("Ωjstrm___1 no result");
          }
          return R[0];
        }

        //-------------------------------------------------------------------------------------------------------
        run(...P) {
          return [...(this.walk(...P))];
        }

        //-------------------------------------------------------------------------------------------------------
        walk(...ds) {
          this.send(...ds);
          return this._walk();
        }

        //-------------------------------------------------------------------------------------------------------
        * _walk() {
          if (this.is_empty) {
            while (this.shelf.length > 0) {
              yield this.shelf.shift();
            }
            return null;
          }
          //.....................................................................................................
          while (this.shelf.length > 0) {
            yield* this.transforms[0](this.shelf.shift());
          }
          return null;
        }

        //-------------------------------------------------------------------------------------------------------
        push(gfn) {
          var R, cfg, my_idx, nxt, original_gfn, type, yielder;
          switch (type = type_of(gfn)) {
            case 'jetstream':
              original_gfn = gfn;
              gfn = nameit('(jetstream)', function*(d) {
                return (yield* original_gfn.walk(d));
              });
              break;
            case 'function':
              original_gfn = gfn;
              gfn = nameit(`(watcher)_${original_gfn.name}`, function*(d) {
                original_gfn(d);
                return (yield d);
              });
              break;
            case 'generatorfunction':
              null;
              break;
            default:
              throw new Error(`Ωjstrm___2 expected a jetstream or a synchronous function or generator function, got a ${type}`);
          }
          //.....................................................................................................
          my_idx = this.transforms.length;
          //.....................................................................................................
          if ((cfg = gfn[CFG]) != null) {
            null;
          }
          //.....................................................................................................
          nxt = null;
          yielder = null;
          //.....................................................................................................
          R = nameit(`(managed)_${gfn.name}`, (function(me) {
            return function*(d) {
              if (nxt == null) {
                nxt = me.transforms[my_idx + 1];
                if (nxt != null) {
                  yielder = function*(d) {
                    var j, results;
                    results = [];
                    for (j of gfn(d)) {
                      results.push((yield* nxt(j)));
                    }
                    return results;
                  };
                } else {
                  yielder = function*(d) {
                    var j, results;
                    results = [];
                    for (j of gfn(d)) {
                      results.push((yield j));
                    }
                    return results;
                  };
                }
              }
              yield* yielder(d);
              //...................................................................................................
              return null;
            };
          })(this));
          //.....................................................................................................
          this.transforms.push(R);
          return R;
        }

      };

      //-------------------------------------------------------------------------------------------------------
      Jetstream.$ = $;

      Jetstream.prototype.$ = $;

      //-------------------------------------------------------------------------------------------------------
      set_getter(Jetstream.prototype, 'length', function() {
        return this.transforms.length;
      });

      set_getter(Jetstream.prototype, 'is_empty', function() {
        return this.transforms.length === 0;
      });

      return Jetstream;

    }).call(this);
    //=========================================================================================================
    internals = Object.freeze({CFG, type_of, Selector, _normalize_selectors, normalize_selectors, selectors_as_list, id_from_symbol});
    return exports = {Jetstream, $, internals};
  };

  //===========================================================================================================
  Object.assign(module.exports, (() => {
    return {require_jetstream};
  })());

}).call(this);

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vc3JjL2pldHN0cmVhbS5icmljcy5jb2ZmZWUiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQ0E7RUFBQTtBQUFBLE1BQUEsS0FBQSxFQUFBLGlCQUFBOzs7RUFHQSxDQUFBLENBQUUsS0FBRixDQUFBLEdBQWEsT0FBYixFQUhBOzs7OztFQVNBLGlCQUFBLEdBQW9CLFFBQUEsQ0FBQSxDQUFBO0FBQ3BCLFFBQUEsQ0FBQSxFQUFBLEdBQUEsRUFBQSxTQUFBLEVBQUEsUUFBQSxFQUFBLG9CQUFBLEVBQUEsUUFBQSxFQUFBLE9BQUEsRUFBQSxJQUFBLEVBQUEsY0FBQSxFQUFBLFNBQUEsRUFBQSxNQUFBLEVBQUEsbUJBQUEsRUFBQSxpQkFBQSxFQUFBLFVBQUEsRUFBQTtJQUFFLENBQUEsQ0FBRSxNQUFGLENBQUEsR0FBNEIsQ0FBRSxPQUFBLENBQVEsaUJBQVIsQ0FBRixDQUE2QixDQUFDLGNBQTlCLENBQUEsQ0FBNUI7SUFDQSxDQUFBO01BQUUsT0FBQSxFQUFTO0lBQVgsQ0FBQSxHQUE0QixDQUFFLE9BQUEsQ0FBUSw4QkFBUixDQUFGLENBQTBDLENBQUMsZUFBM0MsQ0FBQSxDQUE1QjtJQUNBLENBQUEsQ0FBRSxJQUFGLEVBQ0UsVUFERixDQUFBLEdBQzRCLENBQUUsT0FBQSxDQUFRLGlCQUFSLENBQUYsQ0FBNkIsQ0FBQyw4QkFBOUIsQ0FBQSxDQUQ1QjtJQUVBLEdBQUEsR0FBNEIsTUFBQSxDQUFPLEtBQVAsRUFKOUI7O0lBT0UsT0FBQSxHQUFVLFFBQUEsQ0FBRSxDQUFGLENBQUE7TUFBUyxJQUFLLENBQUEsWUFBYSxTQUFsQjtlQUFtQyxZQUFuQztPQUFBLE1BQUE7ZUFBb0QsUUFBQSxDQUFTLENBQVQsRUFBcEQ7O0lBQVQsRUFQWjs7SUFVUSxXQUFOLE1BQUEsU0FBQTtNQUNFLFdBQWEsQ0FBQSxHQUFFLFNBQUYsQ0FBQTtBQUNqQixZQUFBLEtBQUEsRUFBQSxHQUFBLEVBQUEsUUFBQSxFQUFB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QWdCLFFBQWhCLEVBQTRCLFFBQUEsQ0FBQSxDQUFBO2VBQUcsSUFBQyxDQUFBLFVBQVUsQ0FBQztNQUFmLENBQTVCOztNQUNBLFVBQUEsQ0FBVyxTQUFDLENBQUEsU0FBWixFQUFnQixVQUFoQixFQUE0QixRQUFBLENBQUEsQ0FBQTtlQUFHLElBQUMsQ0FBQSxVQUFVLENBQUMsTUFBWixLQUFzQjtNQUF6QixDQUE1Qjs7OztrQkFoSEo7O0lBc0xFLFNBQUEsR0FBWSxNQUFNLENBQUMsTUFBUCxDQUFjLENBQ3hCLEdBRHdCLEVBRXhCLE9BRndCLEVBR3hCLFFBSHdCLEVBSXhCLG9CQUp3QixFQUt4QixtQkFMd0IsRUFNeEIsaUJBTndCLEVBT3hCLGNBUHdCLENBQWQ7QUFRWixXQUFPLE9BQUEsR0FBVSxDQUFFLFNBQUYsRUFBYSxDQUFiLEVBQWdCLFNBQWhCO0VBL0xDLEVBVHBCOzs7RUE2TUEsTUFBTSxDQUFDLE1BQVAsQ0FBYyxNQUFNLENBQUMsT0FBckIsRUFBaUMsQ0FBQSxDQUFBLENBQUEsR0FBQTtXQUFHLENBQUUsaUJBQUY7RUFBSCxDQUFBLEdBQWpDO0FBN01BIiwic291cmNlc0NvbnRlbnQiOlsiXG4ndXNlIHN0cmljdCdcblxuIz09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09XG57IGRlYnVnLCB9ID0gY29uc29sZVxuXG5cbiMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjI1xuI1xuIz09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09XG5yZXF1aXJlX2pldHN0cmVhbSA9IC0+XG4gIHsgbmFtZWl0LCAgICAgICAgICAgICAgIH0gPSAoIHJlcXVpcmUgJy4vdmFyaW91cy1icmljcycgKS5yZXF1aXJlX25hbWVpdCgpXG4gIHsgdHlwZV9vZjogX3R5cGVfb2YsICAgIH0gPSAoIHJlcXVpcmUgJy4vdW5zdGFibGUtcnByLXR5cGVfb2YtYnJpY3MnICkucmVxdWlyZV90eXBlX29mKClcbiAgeyBoaWRlLFxuICAgIHNldF9nZXR0ZXIsICAgICAgICAgICB9ID0gKCByZXF1aXJlICcuL3ZhcmlvdXMtYnJpY3MnICkucmVxdWlyZV9tYW5hZ2VkX3Byb3BlcnR5X3Rvb2xzKClcbiAgQ0ZHICAgICAgICAgICAgICAgICAgICAgICA9IFN5bWJvbCAnQ0ZHJ1xuXG4gICM9PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT1cbiAgdHlwZV9vZiA9ICggeCApIC0+IGlmICggeCBpbnN0YW5jZW9mIEpldHN0cmVhbSApIHRoZW4gJ2pldHN0cmVhbScgZWxzZSBfdHlwZV9vZiB4XG5cbiAgIz09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PVxuICBjbGFzcyBTZWxlY3RvclxuICAgIGNvbnN0cnVjdG9yOiAoIHNlbGVjdG9ycy4uLiApIC0+XG4gICAgICB7IHNlbGVjdG9yc19ycHIsXG4gICAgICAgIHNlbGVjdG9ycywgIH0gPSBfbm9ybWFsaXplX3NlbGVjdG9ycyBzZWxlY3RvcnMuLi5cbiAgICAgIEBzZWxlY3RvcnNfcnByICA9IHNlbGVjdG9yc19ycHJcbiAgICAgIEBkYXRhICAgICAgICAgICA9IGlmIHNlbGVjdG9ycy5zaXplIGlzIDAgdGhlbiB0cnVlIGVsc2UgZmFsc2VcbiAgICAgIEBjdWVzICAgICAgICAgICA9IGZhbHNlXG4gICAgICBmb3Igc2VsZWN0b3IgZnJvbSBzZWxlY3RvcnNcbiAgICAgICAgc3dpdGNoIHRydWVcbiAgICAgICAgICB3aGVuIHNlbGVjdG9yIGlzICdkYXRhIyonIHRoZW4gQGRhdGEgPSB0cnVlXG4gICAgICAgICAgd2hlbiBzZWxlY3RvciBpcyAnY3VlIyonIHRoZW4gQGN1ZXMgPSB0cnVlXG4gICAgICAgICAgd2hlbiAoIG1hdGNoID0gc2VsZWN0b3IubWF0Y2ggL15kYXRhIyg/PGlkPi4rKSQvICk/XG4gICAgICAgICAgICAjIyMgVEFJTlQgbWVudGlvbiBvcmlnaW5hbCBzZWxlY3RvciBuZXh0IHRvIG5vcm1hbGl6ZWQgZm9ybSAjIyNcbiAgICAgICAgICAgIHRocm93IG5ldyBFcnJvciBcIs6panN0cm1fMTg4IElEcyBvbiBkYXRhIGl0ZW1zIG5vdCBzdXBwb3J0ZWQsIGdvdCAje3NlbGVjdG9yfVwiXG4gICAgICAgICAgd2hlbiAoIG1hdGNoID0gc2VsZWN0b3IubWF0Y2ggL15jdWUjKD88aWQ+LispJC8gKT9cbiAgICAgICAgICAgIEBjdWVzID0gbmV3IFNldCgpIGlmIEBjdWVzIGluIFsgdHJ1ZSwgZmFsc2UsIF1cbiAgICAgICAgICAgIEBjdWVzLmFkZCBtYXRjaC5ncm91cHMuaWRcbiAgICAgICAgICBlbHNlIG51bGxcbiAgICAgIEBhY2NlcHRfYWxsICAgICA9ICggQGRhdGEgaXMgdHJ1ZSApIGFuZCAoIEBjdWVzIGlzIHRydWUgKVxuICAgICAgcmV0dXJuIHVuZGVmaW5lZFxuXG4gICAgIy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiAgICBfZ2V0X2V4Y2VycHQ6IC0+IHsgZGF0YTogQGRhdGEsIGN1ZXM6IEBjdWVzLCBhY2NlcHRfYWxsOiBAYWNjZXB0X2FsbCwgfVxuXG4gICAgIy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiAgICBzZWxlY3Q6ICggaXRlbSApIC0+XG4gICAgICByZXR1cm4gdHJ1ZSBpZiBAYWNjZXB0X2FsbFxuICAgICAgaWYgaXNfY3VlID0gKCB0eXBlb2YgaXRlbSApIGlzICdzeW1ib2wnXG4gICAgICAgIHJldHVybiB0cnVlICAgaWYgQGN1ZXMgaXMgdHJ1ZVxuICAgICAgICByZXR1cm4gZmFsc2UgIGlmIEBjdWVzIGlzIGZhbHNlXG4gICAgICAgIHJldHVybiBAY3Vlcy5oYXMgaWRfZnJvbV9zeW1ib2wgaXRlbVxuICAgICAgcmV0dXJuIHRydWUgICBpZiBAZGF0YSBpcyB0cnVlXG4gICAgICByZXR1cm4gZmFsc2UgIGlmIEBkYXRhIGlzIGZhbHNlXG4gICAgICB0aHJvdyBuZXcgRXJyb3IgXCLOqWpzdHJtXzE4OSBJRHMgb24gZGF0YSBpdGVtcyBub3Qgc3VwcG9ydGVkIGluIHNlbGVjdG9yICN7cnByIEB0b1N0cmluZ31cIlxuICAgICAgIyByZXR1cm4gQGRhdGEuaGFzIGlkX2Zyb21fdmFsdWUgaXRlbVxuXG4gICAgIy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiAgICAjIyMgVEFJTlQgc2hvdWxkIHByb3ZpZGUgbWV0aG9kIHRvIGdlbmVyYXRlIG5vcm1hbGl6ZWQgcmVwcmVzZW50YXRpb24gIyMjXG4gICAgdG9TdHJpbmc6IC0+IEBzZWxlY3RvcnNfcnByXG5cbiAgIy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuICBpZF9mcm9tX3N5bWJvbCA9ICggc3ltYm9sICkgLT5cbiAgICBSID0gU3RyaW5nIHN5bWJvbFxuICAgIHJldHVybiAoIFIgKVsgNyAuLi4gUi5sZW5ndGggLSAxIF1cblxuICAjLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4gIHNlbGVjdG9yc19hc19saXN0ID0gKCBzZWxlY3RvcnMuLi4gKSAtPlxuICAgIHJldHVybiBbXSBpZiBzZWxlY3RvcnMubGVuZ3RoIGlzIDBcbiAgICBzZWxlY3RvcnMgPSBzZWxlY3RvcnMuZmxhdCBJbmZpbml0eVxuICAgIHJldHVybiBbXSBpZiBzZWxlY3RvcnMubGVuZ3RoIGlzIDBcbiAgICByZXR1cm4gWyAnJywgXSBpZiBzZWxlY3RvcnMubGVuZ3RoIGlzIDEgYW5kIHNlbGVjdG9yc1sgMCBdIGlzICcnXG4gICAgc2VsZWN0b3JzID0gc2VsZWN0b3JzLmpvaW4gJywnXG4gICAgc2VsZWN0b3JzID0gc2VsZWN0b3JzLnJlcGxhY2UgL1xccysvZywgJycgIyMjIFRBSU5UIG5vdCBnZW5lcmFsbHkgcG9zc2libGUgIyMjXG4gICAgc2VsZWN0b3JzID0gc2VsZWN0b3JzLnNwbGl0ICcsJyAjIyMgVEFJTlQgbm90IGdlbmVyYWxseSBwb3NzaWJsZSAjIyNcbiAgICByZXR1cm4gc2VsZWN0b3JzXG5cbiAgIy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuICBub3JtYWxpemVfc2VsZWN0b3JzID0gKCBzZWxlY3RvcnMuLi4gKSAtPiAoIF9ub3JtYWxpemVfc2VsZWN0b3JzIHNlbGVjdG9ycy4uLiApLnNlbGVjdG9yc1xuXG4gICMtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiAgX25vcm1hbGl6ZV9zZWxlY3RvcnMgPSAoIHNlbGVjdG9ycy4uLiApIC0+XG4gICAgc2VsZWN0b3JzICAgICA9IHNlbGVjdG9yc19hc19saXN0IHNlbGVjdG9ycy4uLlxuICAgIHNlbGVjdG9yc19ycHIgPSBzZWxlY3RvcnMuam9pbiAnLCAnXG4gICAgUiAgICAgICAgICAgICA9IG5ldyBTZXQoKVxuICAgIGZvciBzZWxlY3RvciBpbiBzZWxlY3RvcnNcbiAgICAgIHN3aXRjaCB0cnVlXG4gICAgICAgIHdoZW4gc2VsZWN0b3IgaXMgJycgICAgICAgICAgICAgdGhlbiBudWxsXG4gICAgICAgIHdoZW4gc2VsZWN0b3IgaXMgJyMnICAgICAgICAgICAgdGhlbiBSLmFkZCBcImN1ZSMqXCJcbiAgICAgICAgd2hlbiAvXiMuKy8udGVzdCBzZWxlY3RvciAgICAgICB0aGVuIFIuYWRkIFwiY3VlI3tzZWxlY3Rvcn1cIlxuICAgICAgICB3aGVuIC8uKyMkLy50ZXN0IHNlbGVjdG9yICAgICAgIHRoZW4gUi5hZGQgXCIje3NlbGVjdG9yfSpcIlxuICAgICAgICB3aGVuIG5vdCAvIy8udGVzdCBzZWxlY3RvciAgICAgIHRoZW4gUi5hZGQgXCIje3NlbGVjdG9yfSMqXCJcbiAgICAgICAgZWxzZSBSLmFkZCBzZWxlY3RvclxuICAgIFIuYWRkICdkYXRhIyonIGlmIFIuc2l6ZSBpcyAwXG4gICAgUi5kZWxldGUgJycgaWYgUi5zaXplIGlzbnQgMVxuICAgIHJldHVybiB7IHNlbGVjdG9yczogUiwgc2VsZWN0b3JzX3JwciwgfVxuXG5cbiAgIz09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PVxuICAkID0gKCBjZmcsIGdmbiApIC0+XG4gICAgc3dpdGNoIHR5cGUgPSB0eXBlX29mIGdmblxuICAgICAgd2hlbiAnamV0c3RyZWFtJyAgICAgICAgIHRoZW4gUiA9IG5hbWVpdCAnKGNmZylfKGpldHN0cmVhbSknLCAgICAgICAgICAgKCBkICkgLT4geWllbGQgZnJvbSBnZm4ud2Fsay5jYWxsIEAsIGRcbiAgICAgIHdoZW4gJ2Z1bmN0aW9uJyAgICAgICAgICB0aGVuIFIgPSBuYW1laXQgXCIoY2ZnKV8od2F0Y2hlcilfI3tnZm4ubmFtZX1cIiwgKCBkICkgLT4gZ2ZuLmNhbGwgQCwgZDsgeWllbGQgZFxuICAgICAgd2hlbiAnZ2VuZXJhdG9yZnVuY3Rpb24nIHRoZW4gUiA9IG5hbWVpdCBcIihjZmcpXyN7Z2ZuLm5hbWV9XCIsICAgICAgICAgICAoIGQgKSAtPiB5aWVsZCBmcm9tIGdmbi5jYWxsIEAsIGRcbiAgICBSW0NGR10gPSBjZmdcbiAgICByZXR1cm4gUlxuXG4gICM9PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT1cbiAgY2xhc3MgSmV0c3RyZWFtXG5cbiAgICAjLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuICAgIEAkOiAkXG4gICAgJDogICRcblxuICAgICMtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4gICAgY29uc3RydWN0b3I6IC0+XG4gICAgICAjIyMgVEFJTlQgdXNlIE9iamVjdC5mcmVlemUsIHB1c2ggc2V0cyBuZXcgYXJyYXkgIyMjXG4gICAgICBAdHJhbnNmb3JtcyA9IFtdXG4gICAgICBAc2hlbGYgICAgICA9IFtdXG4gICAgICByZXR1cm4gdW5kZWZpbmVkXG5cbiAgICAjLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuICAgIHNldF9nZXR0ZXIgQDo6LCAnbGVuZ3RoJywgICAtPiBAdHJhbnNmb3Jtcy5sZW5ndGhcbiAgICBzZXRfZ2V0dGVyIEA6OiwgJ2lzX2VtcHR5JywgLT4gQHRyYW5zZm9ybXMubGVuZ3RoIGlzIDBcblxuICAgICM9PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09XG4gICAgc2VuZDogKCBkcy4uLiApIC0+XG4gICAgICBAc2hlbGYuc3BsaWNlIEBzaGVsZi5sZW5ndGgsIDAsIGRzLi4uXG4gICAgICByZXR1cm4gbnVsbFxuXG4gICAgIy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiAgICBjdWU6ICggbmFtZXMgKSAtPiBAc2VuZCAoIFN5bWJvbCBuYW1lIGZvciBuYW1lIGluIG5hbWVzICkuLi5cblxuICAgICM9PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09XG4gICAgZ2V0X2ZpcnN0OiAoIFAuLi4gKSAtPlxuICAgICAgaWYgKCBSID0gQHJ1biBQLi4uICkubGVuZ3RoIGlzIDBcbiAgICAgICAgdGhyb3cgbmV3IEVycm9yIFwizqlqc3RybV9fXzEgbm8gcmVzdWx0XCJcbiAgICAgIHJldHVybiBSWyAwIF1cblxuICAgICMtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4gICAgcnVuOiAoIFAuLi4gKSAtPiBbICggQHdhbGsgUC4uLiApLi4uLCBdXG5cbiAgICAjLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuICAgIHdhbGs6ICggZHMuLi4gKSAtPlxuICAgICAgQHNlbmQgZHMuLi5cbiAgICAgIHJldHVybiBAX3dhbGsoKVxuXG4gICAgIy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiAgICBfd2FsazogLT5cbiAgICAgIGlmIEBpc19lbXB0eVxuICAgICAgICB3aGlsZSBAc2hlbGYubGVuZ3RoID4gMFxuICAgICAgICAgIHlpZWxkIEBzaGVsZi5zaGlmdCgpXG4gICAgICAgIHJldHVybiBudWxsXG4gICAgICAjLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi5cbiAgICAgIHdoaWxlIEBzaGVsZi5sZW5ndGggPiAwXG4gICAgICAgIHlpZWxkIGZyb20gQHRyYW5zZm9ybXNbIDAgXSBAc2hlbGYuc2hpZnQoKVxuICAgICAgcmV0dXJuIG51bGxcblxuICAgICMtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4gICAgcHVzaDogKCBnZm4gKSAtPlxuICAgICAgc3dpdGNoIHR5cGUgPSB0eXBlX29mIGdmblxuICAgICAgICB3aGVuICdqZXRzdHJlYW0nXG4gICAgICAgICAgb3JpZ2luYWxfZ2ZuICA9IGdmblxuICAgICAgICAgIGdmbiAgICAgICAgICAgPSBuYW1laXQgJyhqZXRzdHJlYW0pJywgKCBkICkgLT4geWllbGQgZnJvbSBvcmlnaW5hbF9nZm4ud2FsayBkXG4gICAgICAgIHdoZW4gJ2Z1bmN0aW9uJ1xuICAgICAgICAgIG9yaWdpbmFsX2dmbiAgPSBnZm5cbiAgICAgICAgICBnZm4gICAgICAgICAgID0gbmFtZWl0IFwiKHdhdGNoZXIpXyN7b3JpZ2luYWxfZ2ZuLm5hbWV9XCIsICggZCApIC0+IG9yaWdpbmFsX2dmbiBkOyB5aWVsZCBkXG4gICAgICAgIHdoZW4gJ2dlbmVyYXRvcmZ1bmN0aW9uJ1xuICAgICAgICAgIG51bGxcbiAgICAgICAgZWxzZSB0aHJvdyBuZXcgRXJyb3IgXCLOqWpzdHJtX19fMiBleHBlY3RlZCBhIGpldHN0cmVhbSBvciBhIHN5bmNocm9ub3VzIGZ1bmN0aW9uIG9yIGdlbmVyYXRvciBmdW5jdGlvbiwgZ290IGEgI3t0eXBlfVwiXG4gICAgICAjLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi5cbiAgICAgIG15X2lkeCAgICAgID0gQHRyYW5zZm9ybXMubGVuZ3RoXG4gICAgICAjLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi5cbiAgICAgIGlmICggY2ZnID0gZ2ZuWyBDRkcgXSApP1xuICAgICAgICBudWxsXG4gICAgICAjLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi5cbiAgICAgIG54dCAgICAgICAgID0gbnVsbFxuICAgICAgeWllbGRlciAgICAgPSBudWxsXG4gICAgICAjLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi5cbiAgICAgIFIgPSBuYW1laXQgXCIobWFuYWdlZClfI3tnZm4ubmFtZX1cIiwgZG8gKCBtZSA9IEAgKSAtPiAoIGQgKSAtPlxuICAgICAgICB1bmxlc3Mgbnh0P1xuICAgICAgICAgIG54dCA9IG1lLnRyYW5zZm9ybXNbIG15X2lkeCArIDEgXVxuICAgICAgICAgIGlmIG54dD8gdGhlbiAgeWllbGRlciA9ICggZCApIC0+ICggeWllbGQgZnJvbSBueHQgaiAgKSBmb3IgaiBmcm9tIGdmbiBkXG4gICAgICAgICAgZWxzZSAgICAgICAgICB5aWVsZGVyID0gKCBkICkgLT4gKCB5aWVsZCBqICAgICAgICAgICApIGZvciBqIGZyb20gZ2ZuIGRcbiAgICAgICAgIy4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLlxuICAgICAgICB5aWVsZCBmcm9tIHlpZWxkZXIgZFxuICAgICAgICAjLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uXG4gICAgICAgIHJldHVybiBudWxsXG4gICAgICAjLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi5cbiAgICAgIEB0cmFuc2Zvcm1zLnB1c2ggUlxuICAgICAgcmV0dXJuIFJcblxuICAjPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09XG4gIGludGVybmFscyA9IE9iamVjdC5mcmVlemUge1xuICAgIENGRyxcbiAgICB0eXBlX29mLFxuICAgIFNlbGVjdG9yLFxuICAgIF9ub3JtYWxpemVfc2VsZWN0b3JzLFxuICAgIG5vcm1hbGl6ZV9zZWxlY3RvcnMsXG4gICAgc2VsZWN0b3JzX2FzX2xpc3QsXG4gICAgaWRfZnJvbV9zeW1ib2wsIH1cbiAgcmV0dXJuIGV4cG9ydHMgPSB7IEpldHN0cmVhbSwgJCwgaW50ZXJuYWxzLCB9XG5cblxuXG4jPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT1cbk9iamVjdC5hc3NpZ24gbW9kdWxlLmV4cG9ydHMsIGRvID0+IHsgcmVxdWlyZV9qZXRzdHJlYW0sIH1cbiJdfQ==
