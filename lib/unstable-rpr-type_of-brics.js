(function() {
  'use strict';
  var BRICS, debug, demo_show, echo,
    indexOf = [].indexOf;

  ({
    debug,
    log: echo
  } = console);

  //###########################################################################################################

  //===========================================================================================================
  BRICS = {
    
    //=========================================================================================================
    /* NOTE Future Single-File Module */
    require_show: function() {
      var Show, colors, exports, internals, is_primitive_type, isa_jsid, jsid_re, show, show_no_colors, strip_ansi, templates, type_of, write;
      //=======================================================================================================
      write = function(p) {
        return process.stdout.write(p);
      };
      // C                         = require '../../hengist-NG/node_modules/.pnpm/ansis@4.1.0/node_modules/ansis/index.cjs'
      ({type_of, is_primitive_type} = BRICS.require_type_of());
      ({strip_ansi} = (require('./main')).require_strip_ansi());
      // { hide,
      //   set_getter,   } = ( require './main' ).require_managed_property_tools()
      // SQLITE            = require 'node:sqlite'
      // { debug,        } = console

      //=======================================================================================================
      /* thx to https://github.com/sindresorhus/identifier-regex */
      jsid_re = /^[$_\p{ID_Start}][$_\u200C\u200D\p{ID_Continue}]*$/v;
      isa_jsid = function(x) {
        return ((typeof x) === 'string') && jsid_re.test(x);
      };
      //-------------------------------------------------------------------------------------------------------
      templates = {
        show: {
          indentation: null,
          colors: true
        }
      };
      //=======================================================================================================
      internals = {jsid_re, isa_jsid, templates};
      //=======================================================================================================
      Show = class Show {
        //-----------------------------------------------------------------------------------------------------
        constructor(cfg) {
          var me;
          me = (x) => {
            /* TAINT avoid to add colors instead */
            var R, text;
            R = ((function() {
              var results;
              results = [];
              for (text of this.pen(x)) {
                results.push(text);
              }
              return results;
            }).call(this)).join('');
            if (this.cfg.colors === false) {
              R = strip_ansi(R);
            }
            return R;
          };
          Object.setPrototypeOf(me, this);
          this.cfg = {...templates.show, ...cfg};
          this.state = {
            level: 0,
            ended_with_nl: false,
            seen: new Set()
          };
          this.spacer = '\x20\x20';
          Object.defineProperty(this, 'dent', {
            get: () => {
              return this.spacer.repeat(this.state.level);
            }
          });
          return me;
        }

        //-----------------------------------------------------------------------------------------------------
        * pen(x) {
          var text;
          this.state.seen.clear();
          for (text of this.dispatch(x)) {
            this.state.ended_with_nl = text.endsWith('\n');
            yield text;
          }
          if (!this.state.ended_with_nl) {
            this.state.ended_with_nl = true;
          }
          // yield '\n'
          this.state.seen.clear();
          return null;
        }

        //-----------------------------------------------------------------------------------------------------
        go_down() {
          this.state.level++;
          return this.state.level;
        }

        //-----------------------------------------------------------------------------------------------------
        go_up() {
          if (this.state.level < 1) {
            throw new Error("Ω___1 unable to go below level 0");
          }
          this.state.level--;
          return this.state.level;
        }

        //-----------------------------------------------------------------------------------------------------
        * dispatch(x) {
          var is_circular, method, type;
          type = type_of(x);
          is_circular = false;
          if (!is_primitive_type(type)) {
            if (this.state.seen.has(x)) {
              // debug '^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^', "seen", type
              // null
              is_circular = true;
              yield '(CIRCULAR)';
              return null;
            }
          }
          this.state.seen.add(x);
          // unless is_circular
          if ((method = this[`show_${type}`]) != null) {
            yield* method.call(this, x);
          } else {
            yield* this.show_other(x);
          }
          return null;
        }

        //-----------------------------------------------------------------------------------------------------
        _show_key(key) {
          var t;
          if (isa_jsid(key)) {
            return colors._key(key);
          }
          return [
            ...((function() {
              var results;
              results = [];
              for (t of this.dispatch(key)) {
                results.push(t);
              }
              return results;
            }).call(this))
          ].join('');
        }

        //-----------------------------------------------------------------------------------------------------
        * show_pod(x) {
          /* TAINT code duplication */
          var has_keys, key, text, value;
          has_keys = false;
          yield colors.pod('{');
//...................................................................................................
          for (key in x) {
            value = x[key];
            has_keys = true;
            yield ' ' + (this._show_key(key)) + colors.pod(': ');
            for (text of this.dispatch(value)) {
              yield text;
            }
            yield colors.pod(',');
          }
          //...................................................................................................
          yield colors.pod(!has_keys ? '}' : ' }');
          return null;
        }

        //-----------------------------------------------------------------------------------------------------
        * show_map(x) {
          /* TAINT code duplication */
          var has_keys, key, text, value, y;
          has_keys = false;
          yield colors.map('map{');
//...................................................................................................
          for (y of x.entries()) {
            [key, value] = y;
            has_keys = true;
            yield ' ' + (this._show_key(key)) + colors.map(': ');
            for (text of this.dispatch(value)) {
              yield text;
            }
            yield colors.map(',');
          }
          //...................................................................................................
          yield colors.map(!has_keys ? '}' : ' }');
          return null;
        }

        //-----------------------------------------------------------------------------------------------------
        * show_list(x) {
          var R, element, i, len, text;
          R = '';
          R += colors.list('[');
          for (i = 0, len = x.length; i < len; i++) {
            element = x[i];
/* TAINT code duplication */
            for (text of this.dispatch(element)) {
              R += ' ' + text + (colors.list(','));
            }
          }
          R += colors.list((x.length === 0) ? ']' : ' ]');
          yield R;
          return null;
        }

        //-----------------------------------------------------------------------------------------------------
        * show_set(x) {
          var element, text;
          yield colors.set('set[');
          for (element of x.keys()) {
/* TAINT code duplication */
            for (text of this.dispatch(element)) {
              yield ' ' + text + colors.set(',');
            }
          }
          yield colors.set((x.length === 0) ? ']' : ' ]');
          return null;
        }

        //-----------------------------------------------------------------------------------------------------
        * show_text(x) {
          if (indexOf.call(x, "'") >= 0) {
            yield colors.text('"' + (x.replace(/"/g, '\\"')) + '"');
          } else {
            yield colors.text("'" + (x.replace(/'/g, "\\'")) + "'");
          }
          return null;
        }

        //-----------------------------------------------------------------------------------------------------
        * show_float(x) {
          yield (colors.float(x.toString()));
          return null;
        }

        //-----------------------------------------------------------------------------------------------------
        * show_regex(x) {
          yield (colors.regex(x.toString()));
          return null;
        }

        //-----------------------------------------------------------------------------------------------------
        /* full words: */
        // show_true:      ( x ) -> yield ( colors.true      'true'      )
        // show_false:     ( x ) -> yield ( colors.false     'false'     )
        // show_undefined: ( x ) -> yield ( colors.undefined 'undefined' )
        // show_null:      ( x ) -> yield ( colors.null      'null'      )
        // show_nan:       ( x ) -> yield ( colors.nan       'NaN'       )
        /* (mostly) single letters: */
        * show_true(x) {
          return (yield (colors.true(' T ')));
        }

        * show_false(x) {
          return (yield (colors.false(' F ')));
        }

        * show_undefined(x) {
          return (yield (colors.undefined(' U ')));
        }

        * show_null(x) {
          return (yield (colors.null(' N ')));
        }

        * show_nan(x) {
          return (yield (colors.nan(' NaN ')));
        }

        //-----------------------------------------------------------------------------------------------------
        * show_other(x) {
          // yield '\n' unless @state.ended_with_nl
          yield colors.other(`${x}`);
          return null;
        }

      };
      //=======================================================================================================
      // COLOR = new C.Ansis().extend
      //   aliceblue:                  '#f0f8ff'
      //   antiquewhite:               '#faebd7'
      //   aqua:                       '#00ffff'
      //   aquamarine:                 '#7fffd4'
      //   azure:                      '#f0ffff'
      //   beige:                      '#f5f5dc'
      //   bisque:                     '#ffe4c4'
      //   black:                      '#000000'
      //   blanchedalmond:             '#ffebcd'
      //   blue:                       '#0000ff'
      //   blueviolet:                 '#8a2be2'
      //   brown:                      '#a52a2a'
      //   burlywood:                  '#deb887'
      //   cadetblue:                  '#5f9ea0'
      //   chartreuse:                 '#7fff00'
      //   chocolate:                  '#d2691e'
      //   coral:                      '#ff7f50'
      //   cornflowerblue:             '#6495ed'
      //   cornsilk:                   '#fff8dc'
      //   crimson:                    '#dc143c'
      //   cyan:                       '#00ffff'
      //   darkblue:                   '#00008b'
      //   darkcyan:                   '#008b8b'
      //   darkgoldenrod:              '#b8860b'
      //   darkgray:                   '#a9a9a9'
      //   darkgreen:                  '#006400'
      //   darkkhaki:                  '#bdb76b'
      //   darkmagenta:                '#8b008b'
      //   darkolivegreen:             '#556b2f'
      //   darkorange:                 '#ff8c00'
      //   darkorchid:                 '#9932cc'
      //   darkred:                    '#8b0000'
      //   darksalmon:                 '#e9967a'
      //   darkseagreen:               '#8fbc8f'
      //   darkslateblue:              '#483d8b'
      //   darkslategray:              '#2f4f4f'
      //   darkturquoise:              '#00ced1'
      //   darkviolet:                 '#9400d3'
      //   deeppink:                   '#ff1493'
      //   deepskyblue:                '#00bfff'
      //   dimgray:                    '#696969'
      //   dodgerblue:                 '#1e90ff'
      //   firebrick:                  '#b22222'
      //   floralwhite:                '#fffaf0'
      //   forestgreen:                '#228b22'
      //   gainsboro:                  '#dcdcdc'
      //   ghostwhite:                 '#f8f8ff'
      //   gold:                       '#ffd700'
      //   goldenrod:                  '#daa520'
      //   gray:                       '#808080'
      //   green:                      '#008000'
      //   greenyellow:                '#adff2f'
      //   honeydew:                   '#f0fff0'
      //   hotpink:                    '#ff69b4'
      //   indianred:                  '#cd5c5c'
      //   indigo:                     '#4b0082'
      //   ivory:                      '#fffff0'
      //   khaki:                      '#f0e68c'
      //   lavender:                   '#e6e6fa'
      //   lavenderblush:              '#fff0f5'
      //   lawngreen:                  '#7cfc00'
      //   lemonchiffon:               '#fffacd'
      //   lightblue:                  '#add8e6'
      //   lightcoral:                 '#f08080'
      //   lightcyan:                  '#e0ffff'
      //   lightgoldenrodyellow:       '#fafad2'
      //   lightgray:                  '#d3d3d3'
      //   lightgreen:                 '#90ee90'
      //   lightpink:                  '#ffb6c1'
      //   lightsalmon:                '#ffa07a'
      //   lightseagreen:              '#20b2aa'
      //   lightskyblue:               '#87cefa'
      //   lightslategray:             '#778899'
      //   lightsteelblue:             '#b0c4de'
      //   lightyellow:                '#ffffe0'
      //   lime:                       '#00ff00'
      //   limegreen:                  '#32cd32'
      //   linen:                      '#faf0e6'
      //   magenta:                    '#ff00ff'
      //   maroon:                     '#800000'
      //   mediumaquamarine:           '#66cdaa'
      //   mediumblue:                 '#0000cd'
      //   mediumorchid:               '#ba55d3'
      //   mediumpurple:               '#9370db'
      //   mediumseagreen:             '#3cb371'
      //   mediumslateblue:            '#7b68ee'
      //   mediumspringgreen:          '#00fa9a'
      //   mediumturquoise:            '#48d1cc'
      //   mediumvioletred:            '#c71585'
      //   midnightblue:               '#191970'
      //   mintcream:                  '#f5fffa'
      //   mistyrose:                  '#ffe4e1'
      //   moccasin:                   '#ffe4b5'
      //   navajowhite:                '#ffdead'
      //   navy:                       '#000080'
      //   oldlace:                    '#fdf5e6'
      //   olive:                      '#808000'
      //   olivedrab:                  '#6b8e23'
      //   orange:                     '#ffa500'
      //   orangered:                  '#ff4500'
      //   orchid:                     '#da70d6'
      //   palegoldenrod:              '#eee8aa'
      //   palegreen:                  '#98fb98'
      //   paleturquoise:              '#afeeee'
      //   palevioletred:              '#db7093'
      //   papayawhip:                 '#ffefd5'
      //   peachpuff:                  '#ffdab9'
      //   peru:                       '#cd853f'
      //   pink:                       '#ffc0cb'
      //   plum:                       '#dda0dd'
      //   powderblue:                 '#b0e0e6'
      //   purple:                     '#800080'
      //   red:                        '#ff0000'
      //   rosybrown:                  '#bc8f8f'
      //   royalblue:                  '#4169e1'
      //   saddlebrown:                '#8b4513'
      //   salmon:                     '#fa8072'
      //   sandybrown:                 '#f4a460'
      //   seagreen:                   '#2e8b57'
      //   seashell:                   '#fff5ee'
      //   sienna:                     '#a0522d'
      //   silver:                     '#c0c0c0'
      //   skyblue:                    '#87ceeb'
      //   slateblue:                  '#6a5acd'
      //   slategray:                  '#708090'
      //   snow:                       '#fffafa'
      //   springgreen:                '#00ff7f'
      //   steelblue:                  '#4682b4'
      //   tan:                        '#d2b48c'
      //   teal:                       '#008080'
      //   thistle:                    '#d8bfd8'
      //   tomato:                     '#ff6347'
      //   turquoise:                  '#40e0d0'
      //   violet:                     '#ee82ee'
      //   wheat:                      '#f5deb3'
      //   white:                      '#ffffff'
      //   whitesmoke:                 '#f5f5f5'
      //   yellow:                     '#ffff00'
      //   yellowgreen:                '#9acd32'
      //   #.....................................................................................................
      //   FANCYRED:                   '#fd5230'
      //   FANCYORANGE:                '#fd6d30'
      //   # oomph: ( x ) -> debug 'Ω___2', x; return "~~~ #{x} ~~~"
      colors = {
        _key: function(x) {
          return x;
        },
        pod: function(x) {
          return x;
        },
        map: function(x) {
          return x;
        },
        list: function(x) {
          return x;
        },
        set: function(x) {
          return x;
        },
        text: function(x) {
          return x;
        },
        float: function(x) {
          return x;
        },
        regex: function(x) {
          return x;
        },
        true: function(x) {
          return x;
        },
        false: function(x) {
          return x;
        },
        undefined: function(x) {
          return x;
        },
        null: function(x) {
          return x;
        },
        nan: function(x) {
          return x;
        },
        other: function(x) {
          return x;
        }
      };
      // _key:       ( x ) -> COLOR.cyan                             x
      // pod:        ( x ) -> COLOR.gold                             x
      // map:        ( x ) -> COLOR.gold                             x
      // list:       ( x ) -> COLOR.gold                             x
      // set:        ( x ) -> COLOR.gold                             x
      // text:       ( x ) -> COLOR.wheat                            x
      // float:      ( x ) -> COLOR.FANCYRED                         x
      // regex:      ( x ) -> COLOR.plum                             x
      // true:       ( x ) -> COLOR.inverse.bold.italic.lime         x
      // false:      ( x ) -> COLOR.inverse.bold.italic.FANCYORANGE  x
      // undefined:  ( x ) -> COLOR.inverse.bold.italic.magenta      x
      // null:       ( x ) -> COLOR.inverse.bold.italic.blue         x
      // nan:        ( x ) -> COLOR.inverse.bold.italic.magenta      x
      // other:      ( x ) -> COLOR.inverse.red                      x

      //=======================================================================================================
      show = new Show();
      show_no_colors = new Show({
        colors: false
      });
      //=======================================================================================================
      internals = Object.freeze({...internals});
      return exports = {Show, show, show_no_colors, internals};
    },
    //=========================================================================================================
    /* NOTE Future Single-File Module */
    require_type_of: function() {
      var exports, internals, is_primitive, is_primitive_type, object_prototype, pod_prototypes, primitive_types, type_of;
      //=======================================================================================================
      object_prototype = Object.getPrototypeOf({});
      pod_prototypes = Object.freeze([null, object_prototype]);
      //-----------------------------------------------------------------------------------------------------------
      primitive_types = Object.freeze(['null', 'undefined', 'boolean', 'infinity', 'nan', 'float', 'text', 'symbol', 'regex']);
      //=======================================================================================================
      internals = {object_prototype, pod_prototypes, primitive_types};
      //-----------------------------------------------------------------------------------------------------------
      type_of = function(x) {
        /* TAINT consider to return x.constructor.name */
        var jstypeof, millertype, ref;
        if (x === null) {
          //.........................................................................................................
          /* Primitives: */
          return 'null';
        }
        if (x === void 0) {
          return 'undefined';
        }
        if ((x === +2e308) || (x === -2e308)) {
          return 'infinity';
        }
        if ((x === true) || (x === false)) {
          return 'boolean';
        }
        if (Number.isNaN(x)) {
          // return 'true'         if ( x is true )
          // return 'false'        if ( x is false )
          return 'nan';
        }
        if (Number.isFinite(x)) {
          return 'float';
        }
        if (ref = Object.getPrototypeOf(x), indexOf.call(pod_prototypes, ref) >= 0) {
          // return 'unset'        if x is unset
          return 'pod';
        }
        //.........................................................................................................
        switch (jstypeof = typeof x) {
          case 'string':
            return 'text';
          case 'symbol':
            return 'symbol';
        }
        if (Array.isArray(x)) {
          //.........................................................................................................
          return 'list';
        }
        if ((Error.isError(x)) || (x instanceof Error)) {
          return 'error';
        }
        switch (millertype = ((Object.prototype.toString.call(x)).replace(/^\[object ([^\]]+)\]$/, '$1')).toLowerCase()) {
          case 'regexp':
            return 'regex';
        }
        return millertype;
      };
      // switch millertype = Object::toString.call x
      //   when '[object Function]'            then return 'function'
      //   when '[object AsyncFunction]'       then return 'asyncfunction'
      //   when '[object GeneratorFunction]'   then return 'generatorfunction'

      //-----------------------------------------------------------------------------------------------------------
      is_primitive = function(x) {
        var ref;
        return ref = type_of(x), indexOf.call(primitive_types, ref) >= 0;
      };
      is_primitive_type = function(type) {
        return indexOf.call(primitive_types, type) >= 0;
      };
      //=======================================================================================================
      internals = Object.freeze({...internals});
      return exports = {type_of, is_primitive, is_primitive_type, internals};
    }
  };

  //===========================================================================================================
  Object.assign(module.exports, BRICS);

  //===========================================================================================================
  demo_show = function() {
    var GUY, Show, a, b, c, d, e, rpr, show, v_1, v_10, v_2, v_3, v_4, v_5, v_6, v_7, v_8, v_9;
    GUY = require('../../guy');
    ({rpr} = GUY.trm);
    ({show, Show} = BRICS.require_show());
    debug('Ω___3', show);
    debug('Ω___4', show.state);
    debug('Ω___5', show(show.dent));
    debug('Ω___6', show.go_down());
    debug('Ω___7', show(show.dent));
    echo();
    echo('Ω___8', '————————————————————————————————————————————————————————————————');
    echo('Ω___9', show(v_1 = "foo 'bar'"));
    echo('Ω__10', '————————————————————————————————————————————————————————————————');
    echo('Ω__11', show(v_2 = {}));
    echo('Ω__12', '————————————————————————————————————————————————————————————————');
    echo('Ω__13', show(v_3 = {
      kong: 108,
      low: 923,
      numbers: [10, 11, 12]
    }));
    echo('Ω__14', '————————————————————————————————————————————————————————————————');
    echo('Ω__15', show(v_4 = []));
    echo('Ω__16', '————————————————————————————————————————————————————————————————');
    echo('Ω__17', show(v_5 = ['some', 'words', 'to', 'show', 1, -1, false]));
    echo('Ω__18', '————————————————————————————————————————————————————————————————');
    echo('Ω__19', show(v_6 = new Map([['kong', 108], ['low', 923], [971, 'word'], [true, '+1'], ['a b c', false]])));
    echo('Ω__20', '————————————————————————————————————————————————————————————————');
    echo('Ω__21', show(v_7 = new Set(['some', 'words', true, false, null, void 0, 3.1415926, 0/0])));
    echo('Ω__22', '————————————————————————————————————————————————————————————————');
    echo('Ω__23', show(v_8 = /abc[de]/));
    echo('Ω__24', '————————————————————————————————————————————————————————————————');
    echo('Ω__25', show(v_9 = Buffer.from('abcäöü')));
    echo('Ω__26', '————————————————————————————————————————————————————————————————');
    echo('Ω__27', show(v_10 = {v_1, v_2, v_3, v_4, v_5, v_6, v_7, v_8, v_9})); // v_10, v_11, v_12, v_13, v_14, }
    v_10.v_10 = v_10;
    echo('Ω__28', '————————————————————————————————————————————————————————————————');
    echo('Ω__29', rpr(v_10));
    echo('Ω__30', show(v_10 = {v_1, v_2, v_3, v_4, v_5, v_6, v_7, v_8, v_9, v_10})); // v_10, v_11, v_12, v_13, v_14, }
    echo('Ω__31', '————————————————————————————————————————————————————————————————');
    a = ['a'];
    b = ['b', a];
    echo('Ω__32', rpr(b));
    echo('Ω__33', show(b));
    echo('Ω__34', '————————————————————————————————————————————————————————————————');
    b.push(a);
    echo('Ω__35', rpr(b));
    echo('Ω__36', show(b));
    echo('Ω__37', '————————————————————————————————————————————————————————————————');
    d = {};
    c = {d};
    d.c = c;
    e = {d, c};
    echo('Ω__38', rpr(c));
    echo('Ω__39', rpr(e));
    // echo 'Ω__40', show b
    echo('Ω__41', '————————————————————————————————————————————————————————————————');
    echo();
    return null;
  };

  // demo_show()

}).call(this);

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vc3JjL3Vuc3RhYmxlLXJwci10eXBlX29mLWJyaWNzLmNvZmZlZSJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTtFQUFBO0FBQUEsTUFBQSxLQUFBLEVBQUEsS0FBQSxFQUFBLFNBQUEsRUFBQSxJQUFBO0lBQUE7O0VBRUEsQ0FBQTtJQUFFLEtBQUY7SUFDRSxHQUFBLEVBQUs7RUFEUCxDQUFBLEdBQ2lCLE9BRGpCLEVBRkE7Ozs7O0VBU0EsS0FBQSxHQU1FLENBQUE7Ozs7SUFBQSxZQUFBLEVBQWMsUUFBQSxDQUFBLENBQUE7QUFFaEIsVUFBQSxJQUFBLEVBQUEsTUFBQSxFQUFBLE9BQUEsRUFBQSxTQUFBLEVBQUEsaUJBQUEsRUFBQSxRQUFBLEVBQUEsT0FBQSxFQUFBLElBQUEsRUFBQSxjQUFBLEVBQUEsVUFBQSxFQUFBLFNBQUEsRUFBQSxPQUFBLEVBQUEsS0FBQTs7TUFDSSxLQUFBLEdBQTRCLFFBQUEsQ0FBRSxDQUFGLENBQUE7ZUFBUyxPQUFPLENBQUMsTUFBTSxDQUFDLEtBQWYsQ0FBcUIsQ0FBckI7TUFBVCxFQURoQzs7TUFHSSxDQUFBLENBQUUsT0FBRixFQUNFLGlCQURGLENBQUEsR0FDNEIsS0FBSyxDQUFDLGVBQU4sQ0FBQSxDQUQ1QjtNQUVBLENBQUEsQ0FBRSxVQUFGLENBQUEsR0FBNEIsQ0FBRSxPQUFBLENBQVEsUUFBUixDQUFGLENBQW9CLENBQUMsa0JBQXJCLENBQUEsQ0FBNUIsRUFMSjs7Ozs7Ozs7TUFhSSxPQUFBLEdBQVk7TUFDWixRQUFBLEdBQVksUUFBQSxDQUFFLENBQUYsQ0FBQTtlQUFTLENBQUUsQ0FBRSxPQUFPLENBQVQsQ0FBQSxLQUFnQixRQUFsQixDQUFBLElBQWlDLE9BQU8sQ0FBQyxJQUFSLENBQWEsQ0FBYjtNQUExQyxFQWRoQjs7TUFnQkksU0FBQSxHQUNFO1FBQUEsSUFBQSxFQUNFO1VBQUEsV0FBQSxFQUFjLElBQWQ7VUFDQSxNQUFBLEVBQWM7UUFE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dCI6WyIndXNlIHN0cmljdCdcblxueyBkZWJ1ZyxcbiAgbG9nOiBlY2hvLCB9ID0gY29uc29sZVxuXG5cbiMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjI1xuI1xuIz09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09XG5CUklDUyA9XG5cbiAgXG5cbiAgIz09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PVxuICAjIyMgTk9URSBGdXR1cmUgU2luZ2xlLUZpbGUgTW9kdWxlICMjI1xuICByZXF1aXJlX3Nob3c6IC0+XG5cbiAgICAjPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PVxuICAgIHdyaXRlICAgICAgICAgICAgICAgICAgICAgPSAoIHAgKSAtPiBwcm9jZXNzLnN0ZG91dC53cml0ZSBwXG4gICAgIyBDICAgICAgICAgICAgICAgICAgICAgICAgID0gcmVxdWlyZSAnLi4vLi4vaGVuZ2lzdC1ORy9ub2RlX21vZHVsZXMvLnBucG0vYW5zaXNANC4xLjAvbm9kZV9tb2R1bGVzL2Fuc2lzL2luZGV4LmNqcydcbiAgICB7IHR5cGVfb2YsXG4gICAgICBpc19wcmltaXRpdmVfdHlwZSwgICAgfSA9IEJSSUNTLnJlcXVpcmVfdHlwZV9vZigpXG4gICAgeyBzdHJpcF9hbnNpLCAgICAgICAgICAgfSA9ICggcmVxdWlyZSAnLi9tYWluJyApLnJlcXVpcmVfc3RyaXBfYW5zaSgpXG4gICAgIyB7IGhpZGUsXG4gICAgIyAgIHNldF9nZXR0ZXIsICAgfSA9ICggcmVxdWlyZSAnLi9tYWluJyApLnJlcXVpcmVfbWFuYWdlZF9wcm9wZXJ0eV90b29scygpXG4gICAgIyBTUUxJVEUgICAgICAgICAgICA9IHJlcXVpcmUgJ25vZGU6c3FsaXRlJ1xuICAgICMgeyBkZWJ1ZywgICAgICAgIH0gPSBjb25zb2xlXG5cbiAgICAjPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PVxuICAgICMjIyB0aHggdG8gaHR0cHM6Ly9naXRodWIuY29tL3NpbmRyZXNvcmh1cy9pZGVudGlmaWVyLXJlZ2V4ICMjI1xuICAgIGpzaWRfcmUgICA9IC8vL14gWyAkIF8gXFxwe0lEX1N0YXJ0fSBdIFsgJCBfIFxcdTIwMEMgXFx1MjAwRCBcXHB7SURfQ29udGludWV9IF0qICQvLy92XG4gICAgaXNhX2pzaWQgID0gKCB4ICkgLT4gKCAoIHR5cGVvZiB4ICkgaXMgJ3N0cmluZycgKSBhbmQganNpZF9yZS50ZXN0IHhcbiAgICAjLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuICAgIHRlbXBsYXRlcyA9XG4gICAgICBzaG93OlxuICAgICAgICBpbmRlbnRhdGlvbjogIG51bGxcbiAgICAgICAgY29sb3JzOiAgICAgICB0cnVlXG5cbiAgICAjPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PVxuICAgIGludGVybmFscyA9IHsganNpZF9yZSwgaXNhX2pzaWQsIHRlbXBsYXRlcywgfVxuXG4gICAgIz09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT1cbiAgICBjbGFzcyBTaG93XG5cbiAgICAgICMtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuICAgICAgY29uc3RydWN0b3I6ICggY2ZnICkgLT5cbiAgICAgICAgbWUgPSAoIHggKSA9PlxuICAgICAgICAgIFIgPSAoIHRleHQgZm9yIHRleHQgZnJvbSBAcGVuIHggKS5qb2luICcnXG4gICAgICAgICAgIyMjIFRBSU5UIGF2b2lkIHRvIGFkZCBjb2xvcnMgaW5zdGVhZCAjIyNcbiAgICAgICAgICBSID0gc3RyaXBfYW5zaSBSIGlmIEBjZmcuY29sb3JzIGlzIGZhbHNlXG4gICAgICAgICAgcmV0dXJuIFJcbiAgICAgICAgT2JqZWN0LnNldFByb3RvdHlwZU9mIG1lLCBAXG4gICAgICAgIEBjZmcgICAgPSB7IHRlbXBsYXRlcy5zaG93Li4uLCBjZmcuLi4sIH1cbiAgICAgICAgQHN0YXRlICA9IHsgbGV2ZWw6IDAsIGVuZGVkX3dpdGhfbmw6IGZhbHNlLCBzZWVuOiAoIG5ldyBTZXQoKSApLCB9XG4gICAgICAgIEBzcGFjZXIgPSAnXFx4MjBcXHgyMCdcbiAgICAgICAgT2JqZWN0LmRlZmluZVByb3BlcnR5IEAsICdkZW50JyxcbiAgICAgICAgICBnZXQ6ID0+IEBzcGFjZXIucmVwZWF0IEBzdGF0ZS5sZXZlbFxuICAgICAgICByZXR1cm4gbWVcblxuICAgICAgIy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4gICAgICBwZW46ICggeCApIC0+XG4gICAgICAgIEBzdGF0ZS5zZWVuLmNsZWFyKClcbiAgICAgICAgZm9yIHRleHQgZnJvbSBAZGlzcGF0Y2ggeFxuICAgICAgICAgIEBzdGF0ZS5lbmRlZF93aXRoX25sID0gdGV4dC5lbmRzV2l0aCAnXFxuJ1xuICAgICAgICAgIHlpZWxkIHRleHRcbiAgICAgICAgdW5sZXNzIEBzdGF0ZS5lbmRlZF93aXRoX25sXG4gICAgICAgICAgQHN0YXRlLmVuZGVkX3dpdGhfbmwgPSB0cnVlXG4gICAgICAgICAgIyB5aWVsZCAnXFxuJ1xuICAgICAgICBAc3RhdGUuc2Vlbi5jbGVhcigpXG4gICAgICAgIHJldHVybiBudWxsXG5cbiAgICAgICMtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuICAgICAgZ29fZG93bjogLT5cbiAgICAgICAgQHN0YXRlLmxldmVsKytcbiAgICAgICAgcmV0dXJuIEBzdGF0ZS5sZXZlbFxuXG4gICAgICAjLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiAgICAgIGdvX3VwOiAtPlxuICAgICAgICBpZiBAc3RhdGUubGV2ZWwgPCAxXG4gICAgICAgICAgdGhyb3cgbmV3IEVycm9yIFwizqlfX18xIHVuYWJsZSB0byBnbyBiZWxvdyBsZXZlbCAwXCJcbiAgICAgICAgQHN0YXRlLmxldmVsLS1cbiAgICAgICAgcmV0dXJuIEBzdGF0ZS5sZXZlbFxuXG4gICAgICAjLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiAgICAgIGRpc3BhdGNoOiAoIHggKSAtPlxuICAgICAgICB0eXBlICAgICAgICA9IHR5cGVfb2YgeFxuICAgICAgICBpc19jaXJjdWxhciA9IGZhbHNlXG4gICAgICAgIGlmICggbm90IGlzX3ByaW1pdGl2ZV90eXBlIHR5cGUgKVxuICAgICAgICAgIGlmIEBzdGF0ZS5zZWVuLmhhcyB4XG4gICAgICAgICAgICAjIGRlYnVnICdeXl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5eJywgXCJzZWVuXCIsIHR5cGVcbiAgICAgICAgICAgICMgbnVsbFxuICAgICAgICAgICAgaXNfY2lyY3VsYXIgPSB0cnVlXG4gICAgICAgICAgICB5aWVsZCAnKENJUkNVTEFSKSdcbiAgICAgICAgICAgIHJldHVybiBudWxsXG4gICAgICAgIEBzdGF0ZS5zZWVuLmFkZCB4XG4gICAgICAgICMgdW5sZXNzIGlzX2NpcmN1bGFyXG4gICAgICAgIGlmICggbWV0aG9kID0gQFsgXCJzaG93XyN7dHlwZX1cIiBdICk/XG4gICAgICAgICAgeWllbGQgZnJvbSBtZXRob2QuY2FsbCBALCB4XG4gICAgICAgIGVsc2VcbiAgICAgICAgICB5aWVsZCBmcm9tIEBzaG93X290aGVyIHhcbiAgICAgICAgcmV0dXJuIG51bGxcblxuICAgICAgIy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4gICAgICBfc2hvd19rZXk6ICgga2V5ICkgLT5cbiAgICAgICAgaWYgaXNhX2pzaWQga2V5IHRoZW4gcmV0dXJuIGNvbG9ycy5fa2V5IGtleVxuICAgICAgICByZXR1cm4gWyAoIHQgZm9yIHQgZnJvbSBAZGlzcGF0Y2gga2V5ICkuLi4sIF0uam9pbiAnJ1xuXG4gICAgICAjLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiAgICAgIHNob3dfcG9kOiAoIHggKSAtPlxuICAgICAgICBoYXNfa2V5cyA9IGZhbHNlXG4gICAgICAgIHlpZWxkIGNvbG9ycy5wb2QgJ3snXG4gICAgICAgICMuLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi5cbiAgICAgICAgZm9yIGtleSwgdmFsdWUgb2YgeFxuICAgICAgICAgICMjIyBUQUlOVCBjb2RlIGR1cGxpY2F0aW9uICMjI1xuICAgICAgICAgIGhhc19rZXlzID0gdHJ1ZVxuICAgICAgICAgIHlpZWxkICcgJyArICggQF9zaG93X2tleSBrZXkgKSArIGNvbG9ycy5wb2QgJzogJ1xuICAgICAgICAgIGZvciB0ZXh0IGZyb20gQGRpc3BhdGNoIHZhbHVlXG4gICAgICAgICAgICB5aWVsZCB0ZXh0XG4gICAgICAgICAgeWllbGQgY29sb3JzLnBvZCAnLCdcbiAgICAgICAgIy4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLlxuICAgICAgICB5aWVsZCBjb2xvcnMucG9kIGlmICggbm90IGhhc19rZXlzICkgdGhlbiAnfScgZWxzZSAnIH0nXG4gICAgICAgIHJldHVybiBudWxsXG5cbiAgICAgICMtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuICAgICAgc2hvd19tYXA6ICggeCApIC0+XG4gICAgICAgIGhhc19rZXlzID0gZmFsc2VcbiAgICAgICAgeWllbGQgY29sb3JzLm1hcCAnbWFweydcbiAgICAgICAgIy4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLlxuICAgICAgICBmb3IgWyBrZXksIHZhbHVlLCBdIGZyb20geC5lbnRyaWVzKClcbiAgICAgICAgICAjIyMgVEFJTlQgY29kZSBkdXBsaWNhdGlvbiAjIyNcbiAgICAgICAgICBoYXNfa2V5cyA9IHRydWVcbiAgICAgICAgICB5aWVsZCAnICcgKyAoIEBfc2hvd19rZXkga2V5ICkgKyBjb2xvcnMubWFwICc6ICdcbiAgICAgICAgICBmb3IgdGV4dCBmcm9tIEBkaXNwYXRjaCB2YWx1ZVxuICAgICAgICAgICAgeWllbGQgdGV4dFxuICAgICAgICAgIHlpZWxkIGNvbG9ycy5tYXAgJywnXG4gICAgICAgICMuLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi5cbiAgICAgICAgeWllbGQgY29sb3JzLm1hcCBpZiAoIG5vdCBoYXNfa2V5cyApIHRoZW4gJ30nIGVsc2UgJyB9J1xuICAgICAgICByZXR1cm4gbnVsbFxuXG4gICAgICAjLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiAgICAgIHNob3dfbGlzdDogKCB4ICkgLT5cbiAgICAgICAgUiA9ICcnXG4gICAgICAgIFIgKz0gY29sb3JzLmxpc3QgJ1snXG4gICAgICAgIGZvciBlbGVtZW50IGluIHhcbiAgICAgICAgICAjIyMgVEFJTlQgY29kZSBkdXBsaWNhdGlvbiAjIyNcbiAgICAgICAgICBmb3IgdGV4dCBmcm9tIEBkaXNwYXRjaCBlbGVtZW50XG4gICAgICAgICAgICBSICs9ICcgJyArIHRleHQgKyAoIGNvbG9ycy5saXN0ICcsJyApXG4gICAgICAgIFIgKz0gY29sb3JzLmxpc3QgaWYgKCB4Lmxlbmd0aCBpcyAwICkgdGhlbiAnXScgZWxzZSAnIF0nXG4gICAgICAgIHlpZWxkIFJcbiAgICAgICAgcmV0dXJuIG51bGxcblxuICAgICAgIy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4gICAgICBzaG93X3NldDogKCB4ICkgLT5cbiAgICAgICAgeWllbGQgY29sb3JzLnNldCAnc2V0WydcbiAgICAgICAgZm9yIGVsZW1lbnQgZnJvbSB4LmtleXMoKVxuICAgICAgICAgICMjIyBUQUlOVCBjb2RlIGR1cGxpY2F0aW9uICMjI1xuICAgICAgICAgIGZvciB0ZXh0IGZyb20gQGRpc3BhdGNoIGVsZW1lbnRcbiAgICAgICAgICAgIHlpZWxkICcgJyArIHRleHQgKyBjb2xvcnMuc2V0ICcsJ1xuICAgICAgICB5aWVsZCBjb2xvcnMuc2V0IGlmICggeC5sZW5ndGggaXMgMCApIHRoZW4gJ10nIGVsc2UgJyBdJ1xuICAgICAgICByZXR1cm4gbnVsbFxuXG4gICAgICAjLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiAgICAgIHNob3dfdGV4dDogKCB4ICkgLT5cbiAgICAgICAgaWYgXCInXCIgaW4geCB0aGVuICB5aWVsZCBjb2xvcnMudGV4dCAnXCInICsgKCB4LnJlcGxhY2UgL1wiL2csICdcXFxcXCInICkgKyAnXCInXG4gICAgICAgIGVsc2UgICAgICAgICAgICAgIHlpZWxkIGNvbG9ycy50ZXh0IFwiJ1wiICsgKCB4LnJlcGxhY2UgLycvZywgXCJcXFxcJ1wiICkgKyBcIidcIlxuICAgICAgICByZXR1cm4gbnVsbFxuXG4gICAgICAjLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiAgICAgIHNob3dfZmxvYXQ6ICggeCApIC0+XG4gICAgICAgIHlpZWxkICggY29sb3JzLmZsb2F0IHgudG9TdHJpbmcoKSApXG4gICAgICAgIHJldHVybiBudWxsXG5cbiAgICAgICMtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuICAgICAgc2hvd19yZWdleDogKCB4ICkgLT5cbiAgICAgICAgeWllbGQgKCBjb2xvcnMucmVnZXggeC50b1N0cmluZygpIClcbiAgICAgICAgcmV0dXJuIG51bGxcblxuICAgICAgIy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4gICAgICAjIyMgZnVsbCB3b3JkczogIyMjXG4gICAgICAjIHNob3dfdHJ1ZTogICAgICAoIHggKSAtPiB5aWVsZCAoIGNvbG9ycy50cnVlICAgICAgJ3RydWUnICAgICAgKVxuICAgICAgIyBzaG93X2ZhbHNlOiAgICAgKCB4ICkgLT4geWllbGQgKCBjb2xvcnMuZmFsc2UgICAgICdmYWxzZScgICAgIClcbiAgICAgICMgc2hvd191bmRlZmluZWQ6ICggeCApIC0+IHlpZWxkICggY29sb3JzLnVuZGVmaW5lZCAndW5kZWZpbmVkJyApXG4gICAgICAjIHNob3dfbnVsbDogICAgICAoIHggKSAtPiB5aWVsZCAoIGNvbG9ycy5udWxsICAgICAgJ251bGwnICAgICAgKVxuICAgICAgIyBzaG93X25hbjogICAgICAgKCB4ICkgLT4geWllbGQgKCBjb2xvcnMubmFuICAgICAgICdOYU4nICAgICAgIClcbiAgICAgICMjIyAobW9zdGx5KSBzaW5nbGUgbGV0dGVyczogIyMjXG4gICAgICBzaG93X3RydWU6ICAgICAgKCB4ICkgLT4geWllbGQgKCBjb2xvcnMudHJ1ZSAgICAgICcgVCAnICAgICApXG4gICAgICBzaG93X2ZhbHNlOiAgICAgKCB4ICkgLT4geWllbGQgKCBjb2xvcnMuZmFsc2UgICAgICcgRiAnICAgICApXG4gICAgICBzaG93X3VuZGVmaW5lZDogKCB4ICkgLT4geWllbGQgKCBjb2xvcnMudW5kZWZpbmVkICcgVSAnICAgICApXG4gICAgICBzaG93X251bGw6ICAgICAgKCB4ICkgLT4geWllbGQgKCBjb2xvcnMubnVsbCAgICAgICcgTiAnICAgICApXG4gICAgICBzaG93X25hbjogICAgICAgKCB4ICkgLT4geWllbGQgKCBjb2xvcnMubmFuICAgICAgICcgTmFOICcgICApXG5cbiAgICAgICMtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuICAgICAgc2hvd19vdGhlcjogKCB4ICkgLT5cbiAgICAgICAgIyB5aWVsZCAnXFxuJyB1bmxlc3MgQHN0YXRlLmVuZGVkX3dpdGhfbmxcbiAgICAgICAgeWllbGQgY29sb3JzLm90aGVyIFwiI3t4fVwiXG4gICAgICAgIHJldHVybiBudWxsXG5cbiAgICAjPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PVxuICAgICMgQ09MT1IgPSBuZXcgQy5BbnNpcygpLmV4dGVuZFxuICAgICMgICBhbGljZWJsdWU6ICAgICAgICAgICAgICAgICAgJyNmMGY4ZmYnXG4gICAgIyAgIGFudGlxdWV3aGl0ZTogICAgICAgICAgICAgICAnI2ZhZWJkNydcbiAgICAjICAgYXF1YTogICAgICAgICAgICAgICAgICAgICAgICcjMDBmZmZmJ1xuICAgICMgICBhcXVhbWFyaW5lOiAgICAgICAgICAgICAgICAgJyM3ZmZmZDQnXG4gICAgIyAgIGF6dXJlOiAgICAgICAgICAgICAgICAgICAgICAnI2YwZmZmZidcbiAgICAjICAgYmVpZ2U6ICAgICAgICAgICAgICAgICAgICAgICcjZjVmNWRjJ1xuICAgICMgICBiaXNxdWU6ICAgICAgICAgICAgICAgICAgICAgJyNmZmU0YzQnXG4gICAgIyAgIGJsYWNrOiAgICAgICAgICAgICAgICAgICAgICAnIzAwMDAwMCdcbiAgICAjICAgYmxhbmNoZWRhbG1vbmQ6ICAgICAgICAgICAgICcjZmZlYmNkJ1xuICAgICMgICBibHVlOiAgICAgICAgICAgICAgICAgICAgICAgJyMwMDAwZmYnXG4gICAgIyAgIGJsdWV2aW9sZXQ6ICAgICAgICAgICAgICAgICAnIzhhMmJlMidcbiAgICAjICAgYnJvd246ICAgICAgICAgICAgICAgICAgICAgICcjYTUyYTJhJ1xuICAgICMgICBidXJseXdvb2Q6ICAgICAgICAgICAgICAgICAgJyNkZWI4ODcnXG4gICAgIyAgIGNhZGV0Ymx1ZTogICAgICAgICAgICAgICAgICAnIzVmOWVhMCdcbiAgICAjICAgY2hhcnRyZXVzZTogICAgICAgICAgICAgICAgICcjN2ZmZjAwJ1xuICAgICMgICBjaG9jb2xhdGU6ICAgICAgICAgICAgICAgICAgJyNkMjY5MWUnXG4gICAgIyAgIGNvcmFsOiAgICAgICAgICAgICAgICAgICAgICAnI2ZmN2Y1MCdcbiAgICAjICAgY29ybmZsb3dlcmJsdWU6ICAgICAgICAgICAgICcjNjQ5NWVkJ1xuICAgICMgICBjb3Juc2lsazogICAgICAgICAgICAgICAgICAgJyNmZmY4ZGMnXG4gICAgIyAgIGNyaW1zb246ICAgICAgICAgICAgICAgICAgICAnI2RjMTQzYydcbiAgICAjICAgY3lhbjogICAgICAgICAgICAgICAgICAgICAgICcjMDBmZmZmJ1xuICAgICMgICBkYXJrYmx1ZTogICAgICAgICAgICAgICAgICAgJyMwMDAwOGInXG4gICAgIyAgIGRhcmtjeWFuOiAgICAgICAgICAgICAgICAgICAnIzAwOGI4YidcbiAgICAjICAgZGFya2dvbGRlbnJvZDogICAgICAgICAgICAgICcjYjg4NjBiJ1xuICAgICMgICBkYXJrZ3JheTogICAgICAgICAgICAgICAgICAgJyNhOWE5YTknXG4gICAgIyAgIGRhcmtncmVlbjogICAgICAgICAgICAgICAgICAnIzAwNjQwMCdcbiAgICAjICAgZGFya2toYWtpOiAgICAgICAgICAgICAgICAgICcjYmRiNzZiJ1xuICAgICMgICBkYXJrbWFnZW50YTogICAgICAgICAgICAgICAgJyM4YjAwOGInXG4gICAgIyAgIGRhcmtvbGl2ZWdyZWVuOiAgICAgICAgICAgICAnIzU1NmIyZidcbiAgICAjICAgZGFya29yYW5nZTogICAgICAgICAgICAgICAgICcjZmY4YzAwJ1xuICAgICMgICBkYXJrb3JjaGlkOiAgICAgICAgICAgICAgICAgJyM5OTMyY2MnXG4gICAgIyAgIGRhcmtyZWQ6ICAgICAgICAgICAgICAgICAgICAnIzhiMDAwMCdcbiAgICAjICAgZGFya3NhbG1vbjogICAgICAgICAgICAgICAgICcjZTk5NjdhJ1xuICAgICMgICBkYXJrc2VhZ3JlZW46ICAgICAgICAgICAgICAgJyM4ZmJjOGYnXG4gICAgIyAgIGRhcmtzbGF0ZWJsdWU6ICAgICAgICAgICAgICAnIzQ4M2Q4YidcbiAgICAjICAgZGFya3NsYXRlZ3JheTogICAgICAgICAgICAgICcjMmY0ZjRmJ1xuICAgICMgICBkYXJrdHVycXVvaXNlOiAgICAgICAgICAgICAgJyMwMGNlZDEnXG4gICAgIyAgIGRhcmt2aW9sZXQ6ICAgICAgICAgICAgICAgICAnIzk0MDBkMydcbiAgICAjICAgZGVlcHBpbms6ICAgICAgICAgICAgICAgICAgICcjZmYxNDkzJ1xuICAgICMgICBkZWVwc2t5Ymx1ZTogICAgICAgICAgICAgICAgJyMwMGJmZmYnXG4gICAgIyAgIGRpbWdyYXk6ICAgICAgICAgICAgICAgICAgICAnIzY5Njk2OSdcbiAgICAjICAgZG9kZ2VyYmx1ZTogICAgICAgICAgICAgICAgICcjMWU5MGZmJ1xuICAgICMgICBmaXJlYnJpY2s6ICAgICAgICAgICAgICAgICAgJyNiMjIyMjInXG4gICAgIyAgIGZsb3JhbHdoaXRlOiAgICAgICAgICAgICAgICAnI2ZmZmFmMCdcbiAgICAjICAgZm9yZXN0Z3JlZW46ICAgICAgICAgICAgICAgICcjMjI4YjIyJ1xuICAgICMgICBnYWluc2Jvcm86ICAgICAgICAgICAgICAgICAgJyNkY2RjZGMnXG4gICAgIyAgIGdob3N0d2hpdGU6ICAgICAgICAgICAgICAgICAnI2Y4ZjhmZidcbiAgICAjICAgZ29sZDogICAgICAgICAgICAgICAgICAgICAgICcjZmZkNzAwJ1xuICAgICMgICBnb2xkZW5yb2Q6ICAgICAgICAgICAgICAgICAgJyNkYWE1MjAnXG4gICAgIyAgIGdyYXk6ICAgICAgICAgICAgICAgICAgICAgICAnIzgwODA4MCdcbiAgICAjICAgZ3JlZW46ICAgICAgICAgICAgICAgICAgICAgICcjMDA4MDAwJ1xuICAgICMgICBncmVlbnllbGxvdzogICAgICAgICAgICAgICAgJyNhZGZmMmYnXG4gICAgIyAgIGhvbmV5ZGV3OiAgICAgICAgICAgICAgICAgICAnI2YwZmZmMCdcbiAgICAjICAgaG90cGluazogICAgICAgICAgICAgICAgICAgICcjZmY2OWI0J1xuICAgICMgICBpbmRpYW5yZWQ6ICAgICAgICAgICAgICAgICAgJyNjZDVjNWMnXG4gICAgIyAgIGluZGlnbzogICAgICAgICAgICAgICAgICAgICAnIzRiMDA4MidcbiAgICAjICAgaXZvcnk6ICAgICAgICAgICAgICAgICAgICAgICcjZmZmZmYwJ1xuICAgICMgICBraGFraTogICAgICAgICAgICAgICAgICAgICAgJyNmMGU2OGMnXG4gICAgIyAgIGxhdmVuZGVyOiAgICAgICAgICAgICAgICAgICAnI2U2ZTZmYSdcbiAgICAjICAgbGF2ZW5kZXJibHVzaDogICAgICAgICAgICAgICcjZmZmMGY1J1xuICAgICMgICBsYXduZ3JlZW46ICAgICAgICAgICAgICAgICAgJyM3Y2ZjMDAnXG4gICAgIyAgIGxlbW9uY2hpZmZvbjogICAgICAgICAgICAgICAnI2ZmZmFjZCdcbiAgICAjICAgbGlnaHRibHVlOiAgICAgICAgICAgICAgICAgICcjYWRkOGU2J1xuICAgICMgICBsaWdodGNvcmFsOiAgICAgICAgICAgICAgICAgJyNmMDgwODAnXG4gICAgIyAgIGxpZ2h0Y3lhbjogICAgICAgICAgICAgICAgICAnI2UwZmZmZidcbiAgICAjICAgbGlnaHRnb2xkZW5yb2R5ZWxsb3c6ICAgICAgICcjZmFmYWQyJ1xuICAgICMgICBsaWdodGdyYXk6ICAgICAgICAgICAgICAgICAgJyNkM2QzZDMnXG4gICAgIyAgIGxpZ2h0Z3JlZW46ICAgICAgICAgICAgICAgICAnIzkwZWU5MCdcbiAgICAjICAgbGlnaHRwaW5rOiAgICAgICAgICAgICAgICAgICcjZmZiNmMxJ1xuICAgICMgICBsaWdodHNhbG1vbjogICAgICAgICAgICAgICAgJyNmZmEwN2EnXG4gICAgIyAgIGxpZ2h0c2VhZ3JlZW46ICAgICAgICAgICAgICAnIzIwYjJhYSdcbiAgICAjICAgbGlnaHRza3libHVlOiAgICAgICAgICAgICAgICcjODdjZWZhJ1xuICAgICMgICBsaWdodHNsYXRlZ3JheTogICAgICAgICAgICAgJyM3Nzg4OTknXG4gICAgIyAgIGxpZ2h0c3RlZWxibHVlOiAgICAgICAgICAgICAnI2IwYzRkZSdcbiAgICAjICAgbGlnaHR5ZWxsb3c6ICAgICAgICAgICAgICAgICcjZmZmZmUwJ1xuICAgICMgICBsaW1lOiAgICAgICAgICAgICAgICAgICAgICAgJyMwMGZmMDAnXG4gICAgIyAgIGxpbWVncmVlbjogICAgICAgICAgICAgICAgICAnIzMyY2QzMidcbiAgICAjICAgbGluZW46ICAgICAgICAgICAgICAgICAgICAgICcjZmFmMGU2J1xuICAgICMgICBtYWdlbnRhOiAgICAgICAgICAgICAgICAgICAgJyNmZjAwZmYnXG4gICAgIyAgIG1hcm9vbjogICAgICAgICAgICAgICAgICAgICAnIzgwMDAwMCdcbiAgICAjICAgbWVkaXVtYXF1YW1hcmluZTogICAgICAgICAgICcjNjZjZGFhJ1xuICAgICMgICBtZWRpdW1ibHVlOiAgICAgICAgICAgICAgICAgJyMwMDAwY2QnXG4gICAgIyAgIG1lZGl1bW9yY2hpZDogICAgICAgICAgICAgICAnI2JhNTVkMydcbiAgICAjICAgbWVkaXVtcHVycGxlOiAgICAgICAgICAgICAgICcjOTM3MGRiJ1xuICAgICMgICBtZWRpdW1zZWFncmVlbjogICAgICAgICAgICAgJyMzY2IzNzEnXG4gICAgIyAgIG1lZGl1bXNsYXRlYmx1ZTogICAgICAgICAgICAnIzdiNjhlZSdcbiAgICAjICAgbWVkaXVtc3ByaW5nZ3JlZW46ICAgICAgICAgICcjMDBmYTlhJ1xuICAgICMgICBtZWRpdW10dXJxdW9pc2U6ICAgICAgICAgICAgJyM0OGQxY2MnXG4gICAgIyAgIG1lZGl1bXZpb2xldHJlZDogICAgICAgICAgICAnI2M3MTU4NSdcbiAgICAjICAgbWlkbmlnaHRibHVlOiAgICAgICAgICAgICAgICcjMTkxOTcwJ1xuICAgICMgICBtaW50Y3JlYW06ICAgICAgICAgICAgICAgICAgJyNmNWZmZmEnXG4gICAgIyAgIG1pc3R5cm9zZTogICAgICAgICAgICAgICAgICAnI2ZmZTRlMSdcbiAgICAjICAgbW9jY2FzaW46ICAgICAgICAgICAgICAgICAgICcjZmZlNGI1J1xuICAgICMgICBuYXZham93aGl0ZTogICAgICAgICAgICAgICAgJyNmZmRlYWQnXG4gICAgIyAgIG5hdnk6ICAgICAgICAgICAgICAgICAgICAgICAnIzAwMDA4MCdcbiAgICAjICAgb2xkbGFjZTogICAgICAgICAgICAgICAgICAgICcjZmRmNWU2J1xuICAgICMgICBvbGl2ZTogICAgICAgICAgICAgICAgICAgICAgJyM4MDgwMDAnXG4gICAgIyAgIG9saXZlZHJhYjogICAgICAgICAgICAgICAgICAnIzZiOGUyMydcbiAgICAjICAgb3JhbmdlOiAgICAgICAgICAgICAgICAgICAgICcjZmZhNTAwJ1xuICAgICMgICBvcmFuZ2VyZWQ6ICAgICAgICAgICAgICAgICAgJyNmZjQ1MDAnXG4gICAgIyAgIG9yY2hpZDogICAgICAgICAgICAgICAgICAgICAnI2RhNzBkNidcbiAgICAjICAgcGFsZWdvbGRlbnJvZDogICAgICAgICAgICAgICcjZWVlOGFhJ1xuICAgICMgICBwYWxlZ3JlZW46ICAgICAgICAgICAgICAgICAgJyM5OGZiOTgnXG4gICAgIyAgIHBhbGV0dXJxdW9pc2U6ICAgICAgICAgICAgICAnI2FmZWVlZSdcbiAgICAjICAgcGFsZXZpb2xldHJlZDogICAgICAgICAgICAgICcjZGI3MDkzJ1xuICAgICMgICBwYXBheWF3aGlwOiAgICAgICAgICAgICAgICAgJyNmZmVmZDUnXG4gICAgIyAgIHBlYWNocHVmZjogICAgICAgICAgICAgICAgICAnI2ZmZGFiOSdcbiAgICAjICAgcGVydTogICAgICAgICAgICAgICAgICAgICAgICcjY2Q4NTNmJ1xuICAgICMgICBwaW5rOiAgICAgICAgICAgICAgICAgICAgICAgJyNmZmMwY2InXG4gICAgIyAgIHBsdW06ICAgICAgICAgICAgICAgICAgICAgICAnI2RkYTBkZCdcbiAgICAjICAgcG93ZGVyYmx1ZTogICAgICAgICAgICAgICAgICcjYjBlMGU2J1xuICAgICMgICBwdXJwbGU6ICAgICAgICAgICAgICAgICAgICAgJyM4MDAwODAnXG4gICAgIyAgIHJlZDogICAgICAgICAgICAgICAgICAgICAgICAnI2ZmMDAwMCdcbiAgICAjICAgcm9zeWJyb3duOiAgICAgICAgICAgICAgICAgICcjYmM4ZjhmJ1xuICAgICMgICByb3lhbGJsdWU6ICAgICAgICAgICAgICAgICAgJyM0MTY5ZTEnXG4gICAgIyAgIHNhZGRsZWJyb3duOiAgICAgICAgICAgICAgICAnIzhiNDUxMydcbiAgICAjICAgc2FsbW9uOiAgICAgICAgICAgICAgICAgICAgICcjZmE4MDcyJ1xuICAgICMgICBzYW5keWJyb3duOiAgICAgICAgICAgICAgICAgJyNmNGE0NjAnXG4gICAgIyAgIHNlYWdyZWVuOiAgICAgICAgICAgICAgICAgICAnIzJlOGI1NydcbiAgICAjICAgc2Vhc2hlbGw6ICAgICAgICAgICAgICAgICAgICcjZmZmNWVlJ1xuICAgICMgICBzaWVubmE6ICAgICAgICAgICAgICAgICAgICAgJyNhMDUyMmQnXG4gICAgIyAgIHNpbHZlcjogICAgICAgICAgICAgICAgICAgICAnI2MwYzBjMCdcbiAgICAjICAgc2t5Ymx1ZTogICAgICAgICAgICAgICAgICAgICcjODdjZWViJ1xuICAgICMgICBzbGF0ZWJsdWU6ICAgICAgICAgICAgICAgICAgJyM2YTVhY2QnXG4gICAgIyAgIHNsYXRlZ3JheTogICAgICAgICAgICAgICAgICAnIzcwODA5MCdcbiAgICAjICAgc25vdzogICAgICAgICAgICAgICAgICAgICAgICcjZmZmYWZhJ1xuICAgICMgICBzcHJpbmdncmVlbjogICAgICAgICAgICAgICAgJyMwMGZmN2YnXG4gICAgIyAgIHN0ZWVsYmx1ZTogICAgICAgICAgICAgICAgICAnIzQ2ODJiNCdcbiAgICAjICAgdGFuOiAgICAgICAgICAgICAgICAgICAgICAgICcjZDJiNDhjJ1xuICAgICMgICB0ZWFsOiAgICAgICAgICAgICAgICAgICAgICAgJyMwMDgwODAnXG4gICAgIyAgIHRoaXN0bGU6ICAgICAgICAgICAgICAgICAgICAnI2Q4YmZkOCdcbiAgICAjICAgdG9tYXRvOiAgICAgICAgICAgICAgICAgICAgICcjZmY2MzQ3J1xuICAgICMgICB0dXJxdW9pc2U6ICAgICAgICAgICAgICAgICAgJyM0MGUwZDAnXG4gICAgIyAgIHZpb2xldDogICAgICAgICAgICAgICAgICAgICAnI2VlODJlZSdcbiAgICAjICAgd2hlYXQ6ICAgICAgICAgICAgICAgICAgICAgICcjZjVkZWIzJ1xuICAgICMgICB3aGl0ZTogICAgICAgICAgICAgICAgICAgICAgJyNmZmZmZmYnXG4gICAgIyAgIHdoaXRlc21va2U6ICAgICAgICAgICAgICAgICAnI2Y1ZjVmNSdcbiAgICAjICAgeWVsbG93OiAgICAgICAgICAgICAgICAgICAgICcjZmZmZjAwJ1xuICAgICMgICB5ZWxsb3dncmVlbjogICAgICAgICAgICAgICAgJyM5YWNkMzInXG4gICAgIyAgICMuLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLlxuICAgICMgICBGQU5DWVJFRDogICAgICAgICAgICAgICAgICAgJyNmZDUyMzAnXG4gICAgIyAgIEZBTkNZT1JBTkdFOiAgICAgICAgICAgICAgICAnI2ZkNmQzMCdcbiAgICAjICAgIyBvb21waDogKCB4ICkgLT4gZGVidWcgJ86pX19fMicsIHg7IHJldHVybiBcIn5+fiAje3h9IH5+flwiXG5cbiAgICBjb2xvcnMgPVxuICAgICAgX2tleTogICAgICAgKCB4ICkgLT4geFxuICAgICAgcG9kOiAgICAgICAgKCB4ICkgLT4geFxuICAgICAgbWFwOiAgICAgICAgKCB4ICkgLT4geFxuICAgICAgbGlzdDogICAgICAgKCB4ICkgLT4geFxuICAgICAgc2V0OiAgICAgICAgKCB4ICkgLT4geFxuICAgICAgdGV4dDogICAgICAgKCB4ICkgLT4geFxuICAgICAgZmxvYXQ6ICAgICAgKCB4ICkgLT4geFxuICAgICAgcmVnZXg6ICAgICAgKCB4ICkgLT4geFxuICAgICAgdHJ1ZTogICAgICAgKCB4ICkgLT4geFxuICAgICAgZmFsc2U6ICAgICAgKCB4ICkgLT4geFxuICAgICAgdW5kZWZpbmVkOiAgKCB4ICkgLT4geFxuICAgICAgbnVsbDogICAgICAgKCB4ICkgLT4geFxuICAgICAgbmFuOiAgICAgICAgKCB4ICkgLT4geFxuICAgICAgb3RoZXI6ICAgICAgKCB4ICkgLT4geFxuICAgICAgIyBfa2V5OiAgICAgICAoIHggKSAtPiBDT0xPUi5jeWFuICAgICAgICAgICAgICAgICAgICAgICAgICAgICB4XG4gICAgICAjIHBvZDogICAgICAgICggeCApIC0+IENPTE9SLmdvbGQgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHhcbiAgICAgICMgbWFwOiAgICAgICAgKCB4ICkgLT4gQ09MT1IuZ29sZCAgICAgICAgICAgICAgICAgICAgICAgICAgICAgeFxuICAgICAgIyBsaXN0OiAgICAgICAoIHggKSAtPiBDT0xPUi5nb2xkICAgICAgICAgICAgICAgICAgICAgICAgICAgICB4XG4gICAgICAjIHNldDogICAgICAgICggeCApIC0+IENPTE9SLmdvbGQgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHhcbiAgICAgICMgdGV4dDogICAgICAgKCB4ICkgLT4gQ09MT1Iud2hlYXQgICAgICAgICAgICAgICAgICAgICAgICAgICAgeFxuICAgICAgIyBmbG9hdDogICAgICAoIHggKSAtPiBDT0xPUi5GQU5DWVJFRCAgICAgICAgICAgICAgICAgICAgICAgICB4XG4gICAgICAjIHJlZ2V4OiAgICAgICggeCApIC0+IENPTE9SLnBsdW0gICAgICAgICAgICAgICAgICAgICAgICAgICAgIHhcbiAgICAgICMgdHJ1ZTogICAgICAgKCB4ICkgLT4gQ09MT1IuaW52ZXJzZS5ib2xkLml0YWxpYy5saW1lICAgICAgICAgeFxuICAgICAgIyBmYWxzZTogICAgICAoIHggKSAtPiBDT0xPUi5pbnZlcnNlLmJvbGQuaXRhbGljLkZBTkNZT1JBTkdFICB4XG4gICAgICAjIHVuZGVmaW5lZDogICggeCApIC0+IENPTE9SLmludmVyc2UuYm9sZC5pdGFsaWMubWFnZW50YSAgICAgIHhcbiAgICAgICMgbnVsbDogICAgICAgKCB4ICkgLT4gQ09MT1IuaW52ZXJzZS5ib2xkLml0YWxpYy5ibHVlICAgICAgICAgeFxuICAgICAgIyBuYW46ICAgICAgICAoIHggKSAtPiBDT0xPUi5pbnZlcnNlLmJvbGQuaXRhbGljLm1hZ2VudGEgICAgICB4XG4gICAgICAjIG90aGVyOiAgICAgICggeCApIC0+IENPTE9SLmludmVyc2UucmVkICAgICAgICAgICAgICAgICAgICAgIHhcblxuICAgICM9PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09XG4gICAgc2hvdyAgICAgICAgICAgID0gbmV3IFNob3coKVxuICAgIHNob3dfbm9fY29sb3JzICA9IG5ldyBTaG93IHsgY29sb3JzOiBmYWxzZSwgfVxuXG4gICAgIz09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT1cbiAgICBpbnRlcm5hbHMgPSBPYmplY3QuZnJlZXplIHsgaW50ZXJuYWxzLi4uLCB9XG4gICAgcmV0dXJuIGV4cG9ydHMgPSB7XG4gICAgICBTaG93LFxuICAgICAgc2hvdyxcbiAgICAgIHNob3dfbm9fY29sb3JzLFxuICAgICAgaW50ZXJuYWxzLCB9XG5cblxuICAjPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09XG4gICMjIyBOT1RFIEZ1dHVyZSBTaW5nbGUtRmlsZSBNb2R1bGUgIyMjXG4gIHJlcXVpcmVfdHlwZV9vZjogLT5cblxuICAgICM9PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09XG4gICAgb2JqZWN0X3Byb3RvdHlwZSAgPSBPYmplY3QuZ2V0UHJvdG90eXBlT2Yge31cbiAgICBwb2RfcHJvdG90eXBlcyAgICA9IE9iamVjdC5mcmVlemUgWyBudWxsLCBvYmplY3RfcHJvdG90eXBlLCBdXG5cbiAgICAjLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiAgICBwcmltaXRpdmVfdHlwZXMgICAgID0gT2JqZWN0LmZyZWV6ZSBbXG4gICAgICAnbnVsbCcsICd1bmRlZmluZWQnLFxuICAgICAgJ2Jvb2xlYW4nLFxuICAgICAgJ2luZmluaXR5JywgJ25hbicsICdmbG9hdCcsXG4gICAgICAndGV4dCcsICdzeW1ib2wnLCAncmVnZXgnLFxuICAgICAgXVxuXG4gICAgIz09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT1cbiAgICBpbnRlcm5hbHMgICAgICAgICA9IHsgb2JqZWN0X3Byb3RvdHlwZSwgcG9kX3Byb3RvdHlwZXMsIHByaW1pdGl2ZV90eXBlcywgfVxuXG4gICAgIy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4gICAgdHlwZV9vZiA9ICggeCApIC0+XG4gICAgICAjLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uXG4gICAgICAjIyMgUHJpbWl0aXZlczogIyMjXG4gICAgICByZXR1cm4gJ251bGwnICAgICAgICAgaWYgeCBpcyBudWxsXG4gICAgICByZXR1cm4gJ3VuZGVmaW5lZCcgICAgaWYgeCBpcyB1bmRlZmluZWRcbiAgICAgIHJldHVybiAnaW5maW5pdHknICAgICBpZiAoIHggaXMgK0luZmluaXR5ICkgb3IgKCB4IGlzIC1JbmZpbml0eSApXG4gICAgICByZXR1cm4gJ2Jvb2xlYW4nICAgICAgaWYgKCB4IGlzIHRydWUgKSBvciAoIHggaXMgZmFsc2UgKVxuICAgICAgIyByZXR1cm4gJ3RydWUnICAgICAgICAgaWYgKCB4IGlzIHRydWUgKVxuICAgICAgIyByZXR1cm4gJ2ZhbHNlJyAgICAgICAgaWYgKCB4IGlzIGZhbHNlIClcbiAgICAgIHJldHVybiAnbmFuJyAgICAgICAgICBpZiBOdW1iZXIuaXNOYU4gICAgIHhcbiAgICAgIHJldHVybiAnZmxvYXQnICAgICAgICBpZiBOdW1iZXIuaXNGaW5pdGUgIHhcbiAgICAgICMgcmV0dXJuICd1bnNldCcgICAgICAgIGlmIHggaXMgdW5zZXRcbiAgICAgIHJldHVybiAncG9kJyAgICAgICAgICBpZiAoIE9iamVjdC5nZXRQcm90b3R5cGVPZiB4ICkgaW4gcG9kX3Byb3RvdHlwZXNcbiAgICAgICMuLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi5cbiAgICAgIHN3aXRjaCBqc3R5cGVvZiA9IHR5cGVvZiB4XG4gICAgICAgIHdoZW4gJ3N0cmluZycgICAgICAgICAgICAgICAgICAgICAgIHRoZW4gcmV0dXJuICd0ZXh0J1xuICAgICAgICB3aGVuICdzeW1ib2wnICAgICAgICAgICAgICAgICAgICAgICB0aGVuIHJldHVybiAnc3ltYm9sJ1xuICAgICAgIy4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLlxuICAgICAgcmV0dXJuICdsaXN0JyAgICAgICAgIGlmIEFycmF5LmlzQXJyYXkgIHhcbiAgICAgIHJldHVybiAnZXJyb3InICAgICAgICBpZiAoIEVycm9yLmlzRXJyb3IgeCApIG9yICggeCBpbnN0YW5jZW9mIEVycm9yIClcbiAgICAgICMjIyBUQUlOVCBjb25zaWRlciB0byByZXR1cm4geC5jb25zdHJ1Y3Rvci5uYW1lICMjI1xuICAgICAgc3dpdGNoIG1pbGxlcnR5cGUgPSAoICggT2JqZWN0Ojp0b1N0cmluZy5jYWxsIHggKS5yZXBsYWNlIC9eXFxbb2JqZWN0IChbXlxcXV0rKVxcXSQvLCAnJDEnICkudG9Mb3dlckNhc2UoKVxuICAgICAgICB3aGVuICdyZWdleHAnICAgICAgICAgICAgICAgICAgICAgICB0aGVuIHJldHVybiAncmVnZXgnXG4gICAgICByZXR1cm4gbWlsbGVydHlwZVxuICAgICAgIyBzd2l0Y2ggbWlsbGVydHlwZSA9IE9iamVjdDo6dG9TdHJpbmcuY2FsbCB4XG4gICAgICAjICAgd2hlbiAnW29iamVjdCBGdW5jdGlvbl0nICAgICAgICAgICAgdGhlbiByZXR1cm4gJ2Z1bmN0aW9uJ1xuICAgICAgIyAgIHdoZW4gJ1tvYmplY3QgQXN5bmNGdW5jdGlvbl0nICAgICAgIHRoZW4gcmV0dXJuICdhc3luY2Z1bmN0aW9uJ1xuICAgICAgIyAgIHdoZW4gJ1tvYmplY3QgR2VuZXJhdG9yRnVuY3Rpb25dJyAgIHRoZW4gcmV0dXJuICdnZW5lcmF0b3JmdW5jdGlvbidcblxuICAgICMtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuICAgIGlzX3ByaW1pdGl2ZSAgICAgID0gKCB4ICAgICApIC0+ICggdHlwZV9vZiB4ICkgIGluIHByaW1pdGl2ZV90eXBlc1xuICAgIGlzX3ByaW1pdGl2ZV90eXBlID0gKCB0eXBlICApIC0+IHR5cGUgICAgICAgICAgIGluIHByaW1pdGl2ZV90eXBlc1xuXG4gICAgIz09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT1cbiAgICBpbnRlcm5hbHMgPSBPYmplY3QuZnJlZXplIHsgaW50ZXJuYWxzLi4uLCB9XG4gICAgcmV0dXJuIGV4cG9ydHMgPSB7XG4gICAgICB0eXBlX29mLFxuICAgICAgaXNfcHJpbWl0aXZlLFxuICAgICAgaXNfcHJpbWl0aXZlX3R5cGUsXG4gICAgICBpbnRlcm5hbHMsIH1cblxuIz09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09XG5PYmplY3QuYXNzaWduIG1vZHVsZS5leHBvcnRzLCBCUklDU1xuXG5cblxuXG4jPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT1cbmRlbW9fc2hvdyA9IC0+XG4gIEdVWSAgICAgICAgICAgICAgICAgICAgICAgPSByZXF1aXJlICcuLi8uLi9ndXknXG4gIHsgcnByLCB9ID0gR1VZLnRybVxuICB7IHNob3csXG4gICAgU2hvdywgfSA9IEJSSUNTLnJlcXVpcmVfc2hvdygpXG4gIGRlYnVnICfOqV9fXzMnLCBzaG93XG4gIGRlYnVnICfOqV9fXzQnLCBzaG93LnN0YXRlXG4gIGRlYnVnICfOqV9fXzUnLCBzaG93IHNob3cuZGVudFxuICBkZWJ1ZyAnzqlfX182Jywgc2hvdy5nb19kb3duKClcbiAgZGVidWcgJ86pX19fNycsIHNob3cgc2hvdy5kZW50XG4gIGVjaG8oKVxuICBlY2hvICfOqV9fXzgnLCAn4oCU4oCU4oCU4oCU4oCU4oCU4oCU4oCU4oCU4oCU4oCU4oCU4oCU4oCU4oCU4oCU4oCU4oCU4oCU4oCU4oCU4oCU4oCU4oCU4oCU4oCU4oCU4oCU4oCU4oCU4oCU4oCU4oCU4oCU4oCU4oCU4oCU4oCU4oCU4oCU4oCU4oCU4oCU4oCU4oCU4oCU4oCU4oCU4oCU4oCU4oCU4oCU4oCU4oCU4oCU4oCU4oCU4oCU4oCU4oCU4oCU4oCU4oCU4oCUJ1xuICBlY2hvICfOqV9fXzknLCBzaG93IHZfMSA9IFwiZm9vICdiYXInXCJcbiAgZWNobyAnzqlfXzEwJywgJ+KAlOKAlOKAlOKAlOKAlOKAlOKAlOKAlOKAlOKAlOKAlOKAlOKAlOKAlOKAlOKAlOKAlOKAlOKAlOKAlOKAlOKAlOKAlOKAlOKAlOKAlOKAlOKAlOKAlOKAlOKAlOKAlOKAlOKAlOKAlOKAlOKAlOKAlOKAlOKAlOKAlOKAlOKAlOKAlOKAlOKAlOKAlOKAlOKAlOKAlOKAlOKAlOKAlOKAlOKAlOKAlOKAlOKAlOKAlOKAlOKAlOKAlOKAlOKAlCdcbiAgZWNobyAnzqlfXzExJywgc2hvdyB2XzIgPSB7fVxuICBlY2hvICfOqV9fMTInLCAn4oCU4oCU4oCU4oCU4oCU4oCU4oCU4oCU4oCU4oCU4oCU4oCU4oCU4oCU4oCU4oCU4oCU4oCU4oCU4oCU4oCU4oCU4oCU4oCU4oCU4oCU4oCU4oCU4oCU4oCU4oCU4oCU4oCU4oCU4oCU4oCU4oCU4oCU4oCU4oCU4oCU4oCU4oCU4oCU4oCU4oCU4oCU4oCU4oCU4oCU4oCU4oCU4oCU4oCU4oCU4oCU4oCU4oCU4oCU4oCU4oCU4oCU4oCU4oCUJ1xuICBlY2hvICfOqV9fMTMnLCBzaG93IHZfMyA9IHsga29uZzogMTA4LCBsb3c6IDkyMywgbnVtYmVyczogWyAxMCwgMTEsIDEyLCBdLCB9XG4gIGVjaG8gJ86pX18xNCcsICfigJTigJTigJTigJTigJTigJTigJTigJTigJTigJTigJTigJTigJTigJTigJTigJTigJTigJTigJTigJTigJTigJTigJTigJTigJTigJTigJTigJTigJTigJTigJTigJTigJTigJTigJTigJTigJTigJTigJTigJTigJTigJTigJTigJTigJTigJTigJTigJTigJTigJTigJTigJTigJTigJTigJTigJTigJTigJTigJTigJTigJTigJTigJTigJQnXG4gIGVjaG8gJ86pX18xNScsIHNob3cgdl80ID0gW11cbiAgZWNobyAnzqlfXzE2JywgJ+KAlOKAlOKAlOKAlOKAlOKAlOKAlOKAlOKAlOKAlOKAlOKAlOKAlOKAlOKAlOKAlOKAlOKAlOKAlOKAlOKAlOKAlOKAlOKAlOKAlOKAlOKAlOKAlOKAlOKAlOKAlOKAlOKAlOKAlOKAlOKAlOKAlOKAlOKAlOKAlOKAlOKAlOKAlOKAlOKAlOKAlOKAlOKAlOKAlOKAlOKAlOKAlOKAlOKAlOKAlOKAlOKAlOKAlOKAlOKAlOKAlOKAlOKAlOKAlCdcbiAgZWNobyAnzqlfXzE3Jywgc2hvdyB2XzUgPSBbICdzb21lJywgJ3dvcmRzJywgJ3RvJywgJ3Nob3cnLCAxLCAtMSwgZmFsc2UsIF1cbiAgZWNobyAnzqlfXzE4JywgJ+KAlOKAlOKAlOKAlOKAlOKAlOKAlOKAlOKAlOKAlOKAlOKAlOKAlOKAlOKAlOKAlOKAlOKAlOKAlOKAlOKAlOKAlOKAlOKAlOKAlOKAlOKAlOKAlOKAlOKAlOKAlOKAlOKAlOKAlOKAlOKAlOKAlOKAlOKAlOKAlOKAlOKAlOKAlOKAlOKAlOKAlOKAlOKAlOKAlOKAlOKAlOKAlOKAlOKAlOKAlOKAlOKAlOKAlOKAlOKAlOKAlOKAlOKAlOKAlCdcbiAgZWNobyAnzqlfXzE5Jywgc2hvdyB2XzYgPSBuZXcgTWFwIFsgWyAna29uZycsIDEwOCwgXSwgWyAnbG93JywgOTIzLCBdLCBbIDk3MSwgJ3dvcmQnLCBdLCBbIHRydWUsICcrMScsIF0sIFsgJ2EgYiBjJywgZmFsc2UsIF0gXVxuICBlY2hvICfOqV9fMjAnLCAn4oCU4oCU4oCU4oCU4oCU4oCU4oCU4oCU4oCU4oCU4oCU4oCU4oCU4oCU4oCU4oCU4oCU4oCU4oCU4oCU4oCU4oCU4oCU4oCU4oCU4oCU4oCU4oCU4oCU4oCU4oCU4oCU4oCU4oCU4oCU4oCU4oCU4oCU4oCU4oCU4oCU4oCU4oCU4oCU4oCU4oCU4oCU4oCU4oCU4oCU4oCU4oCU4oCU4oCU4oCU4oCU4oCU4oCU4oCU4oCU4oCU4oCU4oCU4oCUJ1xuICBlY2hvICfOqV9fMjEnLCBzaG93IHZfNyA9IG5ldyBTZXQgWyAnc29tZScsICd3b3JkcycsIHRydWUsIGZhbHNlLCBudWxsLCB1bmRlZmluZWQsIDMuMTQxNTkyNiwgTmFOLCBdXG4gIGVjaG8gJ86pX18yMicsICfigJTigJTigJTigJTigJTigJTigJTigJTigJTigJTigJTigJTigJTigJTigJTigJTigJTigJTigJTigJTigJTigJTigJTigJTigJTigJTigJTigJTigJTigJTigJTigJTigJTigJTigJTigJTigJTigJTigJTigJTigJTigJTigJTigJTigJTigJTigJTigJTigJTigJTigJTigJTigJTigJTigJTigJTigJTigJTigJTigJTigJTigJTigJTigJQnXG4gIGVjaG8gJ86pX18yMycsIHNob3cgdl84ID0gL2FiY1tkZV0vXG4gIGVjaG8gJ86pX18yNCcsICfigJTigJTigJTigJTigJTigJTigJTigJTigJTigJTigJTigJTigJTigJTigJTigJTigJTigJTigJTigJTigJTigJTigJTigJTigJTigJTigJTigJTigJTigJTigJTigJTigJTigJTigJTigJTigJTigJTigJTigJTigJTigJTigJTigJTigJTigJTigJTigJTigJTigJTigJTigJTigJTigJTigJTigJTigJTigJTigJTigJTigJTigJTigJTigJQnXG4gIGVjaG8gJ86pX18yNScsIHNob3cgdl85ID0gQnVmZmVyLmZyb20gJ2FiY8Okw7bDvCdcbiAgZWNobyAnzqlfXzI2JywgJ+KAlOKAlOKAlOKAlOKAlOKAlOKAlOKAlOKAlOKAlOKAlOKAlOKAlOKAlOKAlOKAlOKAlOKAlOKAlOKAlOKAlOKAlOKAlOKAlOKAlOKAlOKAlOKAlOKAlOKAlOKAlOKAlOKAlOKAlOKAlOKAlOKAlOKAlOKAlOKAlOKAlOKAlOKAlOKAlOKAlOKAlOKAlOKAlOKAlOKAlOKAlOKAlOKAlOKAlOKAlOKAlOKAlOKAlOKAlOKAlOKAlOKAlOKAlOKAlCdcbiAgZWNobyAnzqlfXzI3Jywgc2hvdyB2XzEwID0geyB2XzEsIHZfMiwgdl8zLCB2XzQsIHZfNSwgdl82LCB2XzcsIHZfOCwgdl85LCB9ICMgdl8xMCwgdl8xMSwgdl8xMiwgdl8xMywgdl8xNCwgfVxuICB2XzEwLnZfMTAgPSB2XzEwXG4gIGVjaG8gJ86pX18yOCcsICfigJTigJTigJTigJTigJTigJTigJTigJTigJTigJTigJTigJTigJTigJTigJTigJTigJTigJTigJTigJTigJTigJTigJTigJTigJTigJTigJTigJTigJTigJTigJTigJTigJTigJTigJTigJTigJTigJTigJTigJTigJTigJTigJTigJTigJTigJTigJTigJTigJTigJTigJTigJTigJTigJTigJTigJTigJTigJTigJTigJTigJTigJTigJTigJQnXG4gIGVjaG8gJ86pX18yOScsIHJwciB2XzEwXG4gIGVjaG8gJ86pX18zMCcsIHNob3cgdl8xMCA9IHsgdl8xLCB2XzIsIHZfMywgdl80LCB2XzUsIHZfNiwgdl83LCB2XzgsIHZfOSwgdl8xMCwgfSAjIHZfMTAsIHZfMTEsIHZfMTIsIHZfMTMsIHZfMTQsIH1cbiAgZWNobyAnzqlfXzMxJywgJ+KAlOKAlOKAlOKAlOKAlOKAlOKAlOKAlOKAlOKAlOKAlOKAlOKAlOKAlOKAlOKAlOKAlOKAlOKAlOKAlOKAlOKAlOKAlOKAlOKAlOKAlOKAlOKAlOKAlOKAlOKAlOKAlOKAlOKAlOKAlOKAlOKAlOKAlOKAlOKAlOKAlOKAlOKAlOKAlOKAlOKAlOKAlOKAlOKAlOKAlOKAlOKAlOKAlOKAlOKAlOKAlOKAlOKAlOKAlOKAlOKAlOKAlOKAlOKAlCdcbiAgYSA9IFsgJ2EnLCBdXG4gIGIgPSBbICdiJywgYSwgXVxuICBlY2hvICfOqV9fMzInLCBycHIgIGJcbiAgZWNobyAnzqlfXzMzJywgc2hvdyBiXG4gIGVjaG8gJ86pX18zNCcsICfigJTigJTigJTigJTigJTigJTigJTigJTigJTigJTigJTigJTigJTigJTigJTigJTigJTigJTigJTigJTigJTigJTigJTigJTigJTigJTigJTigJTigJTigJTigJTigJTigJTigJTigJTigJTigJTigJTigJTigJTigJTigJTigJTigJTigJTigJTigJTigJTigJTigJTigJTigJTigJTigJTigJTigJTigJTigJTigJTigJTigJTigJTigJTigJQnXG4gIGIucHVzaCBhXG4gIGVjaG8gJ86pX18zNScsIHJwciAgYlxuICBlY2hvICfOqV9fMzYnLCBzaG93IGJcbiAgZWNobyAnzqlfXzM3JywgJ+KAlOKAlOKAlOKAlOKAlOKAlOKAlOKAlOKAlOKAlOKAlOKAlOKAlOKAlOKAlOKAlOKAlOKAlOKAlOKAlOKAlOKAlOKAlOKAlOKAlOKAlOKAlOKAlOKAlOKAlOKAlOKAlOKAlOKAlOKAlOKAlOKAlOKAlOKAlOKAlOKAlOKAlOKAlOKAlOKAlOKAlOKAlOKAlOKAlOKAlOKAlOKAlOKAlOKAlOKAlOKAlOKAlOKAlOKAlOKAlOKAlOKAlOKAlOKAlCdcbiAgZCA9IHt9XG4gIGMgPSB7IGQsIH1cbiAgZC5jID0gY1xuICBlID0geyBkLCBjLCB9XG4gIGVjaG8gJ86pX18zOCcsIHJwciBjXG4gIGVjaG8gJ86pX18zOScsIHJwciBlXG4gICMgZWNobyAnzqlfXzQwJywgc2hvdyBiXG4gIGVjaG8gJ86pX180MScsICfigJTigJTigJTigJTigJTigJTigJTigJTigJTigJTigJTigJTigJTigJTigJTigJTigJTigJTigJTigJTigJTigJTigJTigJTigJTigJTigJTigJTigJTigJTigJTigJTigJTigJTigJTigJTigJTigJTigJTigJTigJTigJTigJTigJTigJTigJTigJTigJTigJTigJTigJTigJTigJTigJTigJTigJTigJTigJTigJTigJTigJTigJTigJTigJQnXG4gIGVjaG8oKVxuICByZXR1cm4gbnVsbFxuXG4jIGRlbW9fc2hvdygpXG5cblxuXG4iXX0=
