(function() {
  'use strict';
  var BRICS, debug, echo,
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
      ({strip_ansi} = (require('./ansi-brics')).require_strip_ansi());
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

  // #===========================================================================================================
// demo_show = ->
//   GUY                       = require '../../guy' ### bricabrac: skip-require ###
//   { rpr, } = GUY.trm
//   { show,
//     Show, } = BRICS.require_show()
//   debug 'Ω___3', show
//   debug 'Ω___4', show.state
//   debug 'Ω___5', show show.dent
//   debug 'Ω___6', show.go_down()
//   debug 'Ω___7', show show.dent
//   echo()
//   echo 'Ω___8', '————————————————————————————————————————————————————————————————'
//   echo 'Ω___9', show v_1 = "foo 'bar'"
//   echo 'Ω__10', '————————————————————————————————————————————————————————————————'
//   echo 'Ω__11', show v_2 = {}
//   echo 'Ω__12', '————————————————————————————————————————————————————————————————'
//   echo 'Ω__13', show v_3 = { kong: 108, low: 923, numbers: [ 10, 11, 12, ], }
//   echo 'Ω__14', '————————————————————————————————————————————————————————————————'
//   echo 'Ω__15', show v_4 = []
//   echo 'Ω__16', '————————————————————————————————————————————————————————————————'
//   echo 'Ω__17', show v_5 = [ 'some', 'words', 'to', 'show', 1, -1, false, ]
//   echo 'Ω__18', '————————————————————————————————————————————————————————————————'
//   echo 'Ω__19', show v_6 = new Map [ [ 'kong', 108, ], [ 'low', 923, ], [ 971, 'word', ], [ true, '+1', ], [ 'a b c', false, ] ]
//   echo 'Ω__20', '————————————————————————————————————————————————————————————————'
//   echo 'Ω__21', show v_7 = new Set [ 'some', 'words', true, false, null, undefined, 3.1415926, NaN, ]
//   echo 'Ω__22', '————————————————————————————————————————————————————————————————'
//   echo 'Ω__23', show v_8 = /abc[de]/
//   echo 'Ω__24', '————————————————————————————————————————————————————————————————'
//   echo 'Ω__25', show v_9 = Buffer.from 'abcäöü'
//   echo 'Ω__26', '————————————————————————————————————————————————————————————————'
//   echo 'Ω__27', show v_10 = { v_1, v_2, v_3, v_4, v_5, v_6, v_7, v_8, v_9, } # v_10, v_11, v_12, v_13, v_14, }
//   v_10.v_10 = v_10
//   echo 'Ω__28', '————————————————————————————————————————————————————————————————'
//   echo 'Ω__29', rpr v_10
//   echo 'Ω__30', show v_10 = { v_1, v_2, v_3, v_4, v_5, v_6, v_7, v_8, v_9, v_10, } # v_10, v_11, v_12, v_13, v_14, }
//   echo 'Ω__31', '————————————————————————————————————————————————————————————————'
//   a = [ 'a', ]
//   b = [ 'b', a, ]
//   echo 'Ω__32', rpr  b
//   echo 'Ω__33', show b
//   echo 'Ω__34', '————————————————————————————————————————————————————————————————'
//   b.push a
//   echo 'Ω__35', rpr  b
//   echo 'Ω__36', show b
//   echo 'Ω__37', '————————————————————————————————————————————————————————————————'
//   d = {}
//   c = { d, }
//   d.c = c
//   e = { d, c, }
//   echo 'Ω__38', rpr c
//   echo 'Ω__39', rpr e
//   # echo 'Ω__40', show b
//   echo 'Ω__41', '————————————————————————————————————————————————————————————————'
//   echo()
//   return null

  // demo_show()

}).call(this);

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vc3JjL3Vuc3RhYmxlLXJwci10eXBlX29mLWJyaWNzLmNvZmZlZSJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTtFQUFBO0FBQUEsTUFBQSxLQUFBLEVBQUEsS0FBQSxFQUFBLElBQUE7SUFBQTs7RUFFQSxDQUFBO0lBQUUsS0FBRjtJQUNFLEdBQUEsRUFBSztFQURQLENBQUEsR0FDaUIsT0FEakIsRUFGQTs7Ozs7RUFTQSxLQUFBLEdBTUUsQ0FBQTs7OztJQUFBLFlBQUEsRUFBYyxRQUFBLENBQUEsQ0FBQTtBQUVoQixVQUFBLElBQUEsRUFBQSxNQUFBLEVBQUEsT0FBQSxFQUFBLFNBQUEsRUFBQSxpQkFBQSxFQUFBLFFBQUEsRUFBQSxPQUFBLEVBQUEsSUFBQSxFQUFBLGNBQUEsRUFBQSxVQUFBLEVBQUEsU0FBQSxFQUFBLE9BQUEsRUFBQSxLQUFBOztNQUNJLEtBQUEsR0FBNEIsUUFBQSxDQUFFLENBQUYsQ0FBQTtlQUFTLE9BQU8sQ0FBQyxNQUFNLENBQUMsS0FBZixDQUFxQixDQUFyQjtNQUFULEVBRGhDOztNQUdJLENBQUEsQ0FBRSxPQUFGLEVBQ0UsaUJBREYsQ0FBQSxHQUM0QixLQUFLLENBQUMsZUFBTixDQUFBLENBRDVCO01BRUEsQ0FBQSxDQUFFLFVBQUYsQ0FBQSxHQUE0QixDQUFFLE9BQUEsQ0FBUSxjQUFSLENBQUYsQ0FBMEIsQ0FBQyxrQkFBM0IsQ0FBQSxDQUE1QixFQUxKOzs7Ozs7OztNQWFJLE9BQUEsR0FBWTtNQUNaLFFBQUEsR0FBWSxRQUFBLENBQUUsQ0FBRixDQUFBO2VBQVMsQ0FBRSxDQUFFLE9BQU8sQ0FBVCxDQUFBLEtBQWdCLFFBQWxCLENBQUEsSUFBaUMsT0FBTyxDQUFDLElBQVIsQ0FBYSxDQUFiO01BQTFDLEVBZGhCOztNQWdCSSxTQUFBLEdBQ0U7UUFBQSxJQUFBLEVBQ0U7VUFBQSxXQUFBLEVBQWMsSUFBZDtVQUNBLE1BQUEsRUFBYztRQURkO01BREYsRUFq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QkFBTyxRQUFQOztBQUVBLGdCQUFPLFVBQUEsR0FBYSxDQUFFLENBQUUsTUFBTSxDQUFBLFNBQUUsQ0FBQSxRQUFRLENBQUMsSUFBakIsQ0FBc0IsQ0FBdEIsQ0FBRixDQUEyQixDQUFDLE9BQTVCLENBQW9DLHVCQUFwQyxFQUE2RCxJQUE3RCxDQUFGLENBQXFFLENBQUMsV0FBdEUsQ0FBQSxDQUFwQjtBQUFBLGVBQ08sUUFEUDtBQUMyQyxtQkFBTztBQURsRDtBQUVBLGVBQU87TUF2QkMsRUFoQmQ7Ozs7Ozs7TUE4Q0ksWUFBQSxHQUFvQixRQUFBLENBQUUsQ0FBRixDQUFBO0FBQVksWUFBQTtxQkFBRyxPQUFBLENBQVEsQ0FBUixnQkFBZ0IsaUJBQWxCO01BQWI7TUFDcEIsaUJBQUEsR0FBb0IsUUFBQSxDQUFFLElBQUYsQ0FBQTs0QkFBK0IsaUJBQWxCO01BQWIsRUEvQ3hCOztNQWtESSxTQUFBLEdBQVksTUFBTSxDQUFDLE1BQVAsQ0FBYyxDQUFFLEdBQUEsU0FBRixDQUFkO0FBQ1osYUFBTyxPQUFBLEdBQVUsQ0FDZixPQURlLEVBRWYsWUFGZSxFQUdmLGlCQUhlLEVBSWYsU0FKZTtJQXJERjtFQXJYakIsRUFmRjs7O0VBZ2NBLE1BQU0sQ0FBQyxNQUFQLENBQWMsTUFBTSxDQUFDLE9BQXJCLEVBQThCLEtBQTlCOztFQWhjQTs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OztBQUFBIiwic291cmNlc0NvbnRlbnQiOlsiJ3VzZSBzdHJpY3QnXG5cbnsgZGVidWcsXG4gIGxvZzogZWNobywgfSA9IGNvbnNvbGVcblxuXG4jIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyNcbiNcbiM9PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PVxuQlJJQ1MgPVxuXG4gIFxuXG4gICM9PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT1cbiAgIyMjIE5PVEUgRnV0dXJlIFNpbmdsZS1GaWxlIE1vZHVsZSAjIyNcbiAgcmVxdWlyZV9zaG93OiAtPlxuXG4gICAgIz09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT1cbiAgICB3cml0ZSAgICAgICAgICAgICAgICAgICAgID0gKCBwICkgLT4gcHJvY2Vzcy5zdGRvdXQud3JpdGUgcFxuICAgICMgQyAgICAgICAgICAgICAgICAgICAgICAgICA9IHJlcXVpcmUgJy4uLy4uL2hlbmdpc3QtTkcvbm9kZV9tb2R1bGVzLy5wbnBtL2Fuc2lzQDQuMS4wL25vZGVfbW9kdWxlcy9hbnNpcy9pbmRleC5janMnXG4gICAgeyB0eXBlX29mLFxuICAgICAgaXNfcHJpbWl0aXZlX3R5cGUsICAgIH0gPSBCUklDUy5yZXF1aXJlX3R5cGVfb2YoKVxuICAgIHsgc3RyaXBfYW5zaSwgICAgICAgICAgIH0gPSAoIHJlcXVpcmUgJy4vYW5zaS1icmljcycgKS5yZXF1aXJlX3N0cmlwX2Fuc2koKVxuICAgICMgeyBoaWRlLFxuICAgICMgICBzZXRfZ2V0dGVyLCAgIH0gPSAoIHJlcXVpcmUgJy4vbWFpbicgKS5yZXF1aXJlX21hbmFnZWRfcHJvcGVydHlfdG9vbHMoKVxuICAgICMgU1FMSVRFICAgICAgICAgICAgPSByZXF1aXJlICdub2RlOnNxbGl0ZSdcbiAgICAjIHsgZGVidWcsICAgICAgICB9ID0gY29uc29sZVxuXG4gICAgIz09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT1cbiAgICAjIyMgdGh4IHRvIGh0dHBzOi8vZ2l0aHViLmNvbS9zaW5kcmVzb3JodXMvaWRlbnRpZmllci1yZWdleCAjIyNcbiAgICBqc2lkX3JlICAgPSAvLy9eIFsgJCBfIFxccHtJRF9TdGFydH0gXSBbICQgXyBcXHUyMDBDIFxcdTIwMEQgXFxwe0lEX0NvbnRpbnVlfSBdKiAkLy8vdlxuICAgIGlzYV9qc2lkICA9ICggeCApIC0+ICggKCB0eXBlb2YgeCApIGlzICdzdHJpbmcnICkgYW5kIGpzaWRfcmUudGVzdCB4XG4gICAgIy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiAgICB0ZW1wbGF0ZXMgPVxuICAgICAgc2hvdzpcbiAgICAgICAgaW5kZW50YXRpb246ICBudWxsXG4gICAgICAgIGNvbG9yczogICAgICAgdHJ1ZVxuXG4gICAgIz09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT1cbiAgICBpbnRlcm5hbHMgPSB7IGpzaWRfcmUsIGlzYV9qc2lkLCB0ZW1wbGF0ZXMsIH1cblxuICAgICM9PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09XG4gICAgY2xhc3MgU2hvd1xuXG4gICAgICAjLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiAgICAgIGNvbnN0cnVjdG9yOiAoIGNmZyApIC0+XG4gICAgICAgIG1lID0gKCB4ICkgPT5cbiAgICAgICAgICBSID0gKCB0ZXh0IGZvciB0ZXh0IGZyb20gQHBlbiB4ICkuam9pbiAnJ1xuICAgICAgICAgICMjIyBUQUlOVCBhdm9pZCB0byBhZGQgY29sb3JzIGluc3RlYWQgIyMjXG4gICAgICAgICAgUiA9IHN0cmlwX2Fuc2kgUiBpZiBAY2ZnLmNvbG9ycyBpcyBmYWxzZVxuICAgICAgICAgIHJldHVybiBSXG4gICAgICAgIE9iamVjdC5zZXRQcm90b3R5cGVPZiBtZSwgQFxuICAgICAgICBAY2ZnICAgID0geyB0ZW1wbGF0ZXMuc2hvdy4uLiwgY2ZnLi4uLCB9XG4gICAgICAgIEBzdGF0ZSAgPSB7IGxldmVsOiAwLCBlbmRlZF93aXRoX25sOiBmYWxzZSwgc2VlbjogKCBuZXcgU2V0KCkgKSwgfVxuICAgICAgICBAc3BhY2VyID0gJ1xceDIwXFx4MjAnXG4gICAgICAgIE9iamVjdC5kZWZpbmVQcm9wZXJ0eSBALCAnZGVudCcsXG4gICAgICAgICAgZ2V0OiA9PiBAc3BhY2VyLnJlcGVhdCBAc3RhdGUubGV2ZWxcbiAgICAgICAgcmV0dXJuIG1lXG5cbiAgICAgICMtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuICAgICAgcGVuOiAoIHggKSAtPlxuICAgICAgICBAc3RhdGUuc2Vlbi5jbGVhcigpXG4gICAgICAgIGZvciB0ZXh0IGZyb20gQGRpc3BhdGNoIHhcbiAgICAgICAgICBAc3RhdGUuZW5kZWRfd2l0aF9ubCA9IHRleHQuZW5kc1dpdGggJ1xcbidcbiAgICAgICAgICB5aWVsZCB0ZXh0XG4gICAgICAgIHVubGVzcyBAc3RhdGUuZW5kZWRfd2l0aF9ubFxuICAgICAgICAgIEBzdGF0ZS5lbmRlZF93aXRoX25sID0gdHJ1ZVxuICAgICAgICAgICMgeWllbGQgJ1xcbidcbiAgICAgICAgQHN0YXRlLnNlZW4uY2xlYXIoKVxuICAgICAgICByZXR1cm4gbnVsbFxuXG4gICAgICAjLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiAgICAgIGdvX2Rvd246IC0+XG4gICAgICAgIEBzdGF0ZS5sZXZlbCsrXG4gICAgICAgIHJldHVybiBAc3RhdGUubGV2ZWxcblxuICAgICAgIy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4gICAgICBnb191cDogLT5cbiAgICAgICAgaWYgQHN0YXRlLmxldmVsIDwgMVxuICAgICAgICAgIHRocm93IG5ldyBFcnJvciBcIs6pX19fMSB1bmFibGUgdG8gZ28gYmVsb3cgbGV2ZWwgMFwiXG4gICAgICAgIEBzdGF0ZS5sZXZlbC0tXG4gICAgICAgIHJldHVybiBAc3RhdGUubGV2ZWxcblxuICAgICAgIy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4gICAgICBkaXNwYXRjaDogKCB4ICkgLT5cbiAgICAgICAgdHlwZSAgICAgICAgPSB0eXBlX29mIHhcbiAgICAgICAgaXNfY2lyY3VsYXIgPSBmYWxzZVxuICAgICAgICBpZiAoIG5vdCBpc19wcmltaXRpdmVfdHlwZSB0eXBlIClcbiAgICAgICAgICBpZiBAc3RhdGUuc2Vlbi5oYXMgeFxuICAgICAgICAgICAgIyBkZWJ1ZyAnXl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5eXicsIFwic2VlblwiLCB0eXBlXG4gICAgICAgICAgICAjIG51bGxcbiAgICAgICAgICAgIGlzX2NpcmN1bGFyID0gdHJ1ZVxuICAgICAgICAgICAgeWllbGQgJyhDSVJDVUxBUiknXG4gICAgICAgICAgICByZXR1cm4gbnVsbFxuICAgICAgICBAc3RhdGUuc2Vlbi5hZGQgeFxuICAgICAgICAjIHVubGVzcyBpc19jaXJjdWxhclxuICAgICAgICBpZiAoIG1ldGhvZCA9IEBbIFwic2hvd18je3R5cGV9XCIgXSApP1xuICAgICAgICAgIHlpZWxkIGZyb20gbWV0aG9kLmNhbGwgQCwgeFxuICAgICAgICBlbHNlXG4gICAgICAgICAgeWllbGQgZnJvbSBAc2hvd19vdGhlciB4XG4gICAgICAgIHJldHVybiBudWxsXG5cbiAgICAgICMtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuICAgICAgX3Nob3dfa2V5OiAoIGtleSApIC0+XG4gICAgICAgIGlmIGlzYV9qc2lkIGtleSB0aGVuIHJldHVybiBjb2xvcnMuX2tleSBrZXlcbiAgICAgICAgcmV0dXJuIFsgKCB0IGZvciB0IGZyb20gQGRpc3BhdGNoIGtleSApLi4uLCBdLmpvaW4gJydcblxuICAgICAgIy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4gICAgICBzaG93X3BvZDogKCB4ICkgLT5cbiAgICAgICAgaGFzX2tleXMgPSBmYWxzZVxuICAgICAgICB5aWVsZCBjb2xvcnMucG9kICd7J1xuICAgICAgICAjLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uXG4gICAgICAgIGZvciBrZXksIHZhbHVlIG9mIHhcbiAgICAgICAgICAjIyMgVEFJTlQgY29kZSBkdXBsaWNhdGlvbiAjIyNcbiAgICAgICAgICBoYXNfa2V5cyA9IHRydWVcbiAgICAgICAgICB5aWVsZCAnICcgKyAoIEBfc2hvd19rZXkga2V5ICkgKyBjb2xvcnMucG9kICc6ICdcbiAgICAgICAgICBmb3IgdGV4dCBmcm9tIEBkaXNwYXRjaCB2YWx1ZVxuICAgICAgICAgICAgeWllbGQgdGV4dFxuICAgICAgICAgIHlpZWxkIGNvbG9ycy5wb2QgJywnXG4gICAgICAgICMuLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi5cbiAgICAgICAgeWllbGQgY29sb3JzLnBvZCBpZiAoIG5vdCBoYXNfa2V5cyApIHRoZW4gJ30nIGVsc2UgJyB9J1xuICAgICAgICByZXR1cm4gbnVsbFxuXG4gICAgICAjLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiAgICAgIHNob3dfbWFwOiAoIHggKSAtPlxuICAgICAgICBoYXNfa2V5cyA9IGZhbHNlXG4gICAgICAgIHlpZWxkIGNvbG9ycy5tYXAgJ21hcHsnXG4gICAgICAgICMuLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi5cbiAgICAgICAgZm9yIFsga2V5LCB2YWx1ZSwgXSBmcm9tIHguZW50cmllcygpXG4gICAgICAgICAgIyMjIFRBSU5UIGNvZGUgZHVwbGljYXRpb24gIyMjXG4gICAgICAgICAgaGFzX2tleXMgPSB0cnVlXG4gICAgICAgICAgeWllbGQgJyAnICsgKCBAX3Nob3dfa2V5IGtleSApICsgY29sb3JzLm1hcCAnOiAnXG4gICAgICAgICAgZm9yIHRleHQgZnJvbSBAZGlzcGF0Y2ggdmFsdWVcbiAgICAgICAgICAgIHlpZWxkIHRleHRcbiAgICAgICAgICB5aWVsZCBjb2xvcnMubWFwICcsJ1xuICAgICAgICAjLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uXG4gICAgICAgIHlpZWxkIGNvbG9ycy5tYXAgaWYgKCBub3QgaGFzX2tleXMgKSB0aGVuICd9JyBlbHNlICcgfSdcbiAgICAgICAgcmV0dXJuIG51bGxcblxuICAgICAgIy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4gICAgICBzaG93X2xpc3Q6ICggeCApIC0+XG4gICAgICAgIFIgPSAnJ1xuICAgICAgICBSICs9IGNvbG9ycy5saXN0ICdbJ1xuICAgICAgICBmb3IgZWxlbWVudCBpbiB4XG4gICAgICAgICAgIyMjIFRBSU5UIGNvZGUgZHVwbGljYXRpb24gIyMjXG4gICAgICAgICAgZm9yIHRleHQgZnJvbSBAZGlzcGF0Y2ggZWxlbWVudFxuICAgICAgICAgICAgUiArPSAnICcgKyB0ZXh0ICsgKCBjb2xvcnMubGlzdCAnLCcgKVxuICAgICAgICBSICs9IGNvbG9ycy5saXN0IGlmICggeC5sZW5ndGggaXMgMCApIHRoZW4gJ10nIGVsc2UgJyBdJ1xuICAgICAgICB5aWVsZCBSXG4gICAgICAgIHJldHVybiBudWxsXG5cbiAgICAgICMtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuICAgICAgc2hvd19zZXQ6ICggeCApIC0+XG4gICAgICAgIHlpZWxkIGNvbG9ycy5zZXQgJ3NldFsnXG4gICAgICAgIGZvciBlbGVtZW50IGZyb20geC5rZXlzKClcbiAgICAgICAgICAjIyMgVEFJTlQgY29kZSBkdXBsaWNhdGlvbiAjIyNcbiAgICAgICAgICBmb3IgdGV4dCBmcm9tIEBkaXNwYXRjaCBlbGVtZW50XG4gICAgICAgICAgICB5aWVsZCAnICcgKyB0ZXh0ICsgY29sb3JzLnNldCAnLCdcbiAgICAgICAgeWllbGQgY29sb3JzLnNldCBpZiAoIHgubGVuZ3RoIGlzIDAgKSB0aGVuICddJyBlbHNlICcgXSdcbiAgICAgICAgcmV0dXJuIG51bGxcblxuICAgICAgIy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4gICAgICBzaG93X3RleHQ6ICggeCApIC0+XG4gICAgICAgIGlmIFwiJ1wiIGluIHggdGhlbiAgeWllbGQgY29sb3JzLnRleHQgJ1wiJyArICggeC5yZXBsYWNlIC9cIi9nLCAnXFxcXFwiJyApICsgJ1wiJ1xuICAgICAgICBlbHNlICAgICAgICAgICAgICB5aWVsZCBjb2xvcnMudGV4dCBcIidcIiArICggeC5yZXBsYWNlIC8nL2csIFwiXFxcXCdcIiApICsgXCInXCJcbiAgICAgICAgcmV0dXJuIG51bGxcblxuICAgICAgIy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4gICAgICBzaG93X2Zsb2F0OiAoIHggKSAtPlxuICAgICAgICB5aWVsZCAoIGNvbG9ycy5mbG9hdCB4LnRvU3RyaW5nKCkgKVxuICAgICAgICByZXR1cm4gbnVsbFxuXG4gICAgICAjLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiAgICAgIHNob3dfcmVnZXg6ICggeCApIC0+XG4gICAgICAgIHlpZWxkICggY29sb3JzLnJlZ2V4IHgudG9TdHJpbmcoKSApXG4gICAgICAgIHJldHVybiBudWxsXG5cbiAgICAgICMtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuICAgICAgIyMjIGZ1bGwgd29yZHM6ICMjI1xuICAgICAgIyBzaG93X3RydWU6ICAgICAgKCB4ICkgLT4geWllbGQgKCBjb2xvcnMudHJ1ZSAgICAgICd0cnVlJyAgICAgIClcbiAgICAgICMgc2hvd19mYWxzZTogICAgICggeCApIC0+IHlpZWxkICggY29sb3JzLmZhbHNlICAgICAnZmFsc2UnICAgICApXG4gICAgICAjIHNob3dfdW5kZWZpbmVkOiAoIHggKSAtPiB5aWVsZCAoIGNvbG9ycy51bmRlZmluZWQgJ3VuZGVmaW5lZCcgKVxuICAgICAgIyBzaG93X251bGw6ICAgICAgKCB4ICkgLT4geWllbGQgKCBjb2xvcnMubnVsbCAgICAgICdudWxsJyAgICAgIClcbiAgICAgICMgc2hvd19uYW46ICAgICAgICggeCApIC0+IHlpZWxkICggY29sb3JzLm5hbiAgICAgICAnTmFOJyAgICAgICApXG4gICAgICAjIyMgKG1vc3RseSkgc2luZ2xlIGxldHRlcnM6ICMjI1xuICAgICAgc2hvd190cnVlOiAgICAgICggeCApIC0+IHlpZWxkICggY29sb3JzLnRydWUgICAgICAnIFQgJyAgICAgKVxuICAgICAgc2hvd19mYWxzZTogICAgICggeCApIC0+IHlpZWxkICggY29sb3JzLmZhbHNlICAgICAnIEYgJyAgICAgKVxuICAgICAgc2hvd191bmRlZmluZWQ6ICggeCApIC0+IHlpZWxkICggY29sb3JzLnVuZGVmaW5lZCAnIFUgJyAgICAgKVxuICAgICAgc2hvd19udWxsOiAgICAgICggeCApIC0+IHlpZWxkICggY29sb3JzLm51bGwgICAgICAnIE4gJyAgICAgKVxuICAgICAgc2hvd19uYW46ICAgICAgICggeCApIC0+IHlpZWxkICggY29sb3JzLm5hbiAgICAgICAnIE5hTiAnICAgKVxuXG4gICAgICAjLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiAgICAgIHNob3dfb3RoZXI6ICggeCApIC0+XG4gICAgICAgICMgeWllbGQgJ1xcbicgdW5sZXNzIEBzdGF0ZS5lbmRlZF93aXRoX25sXG4gICAgICAgIHlpZWxkIGNvbG9ycy5vdGhlciBcIiN7eH1cIlxuICAgICAgICByZXR1cm4gbnVsbFxuXG4gICAgIz09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT1cbiAgICAjIENPTE9SID0gbmV3IEMuQW5zaXMoKS5leHRlbmRcbiAgICAjICAgYWxpY2VibHVlOiAgICAgICAgICAgICAgICAgICcjZjBmOGZmJ1xuICAgICMgICBhbnRpcXVld2hpdGU6ICAgICAgICAgICAgICAgJyNmYWViZDcnXG4gICAgIyAgIGFxdWE6ICAgICAgICAgICAgICAgICAgICAgICAnIzAwZmZmZidcbiAgICAjICAgYXF1YW1hcmluZTogICAgICAgICAgICAgICAgICcjN2ZmZmQ0J1xuICAgICMgICBhenVyZTogICAgICAgICAgICAgICAgICAgICAgJyNmMGZmZmYnXG4gICAgIyAgIGJlaWdlOiAgICAgICAgICAgICAgICAgICAgICAnI2Y1ZjVkYydcbiAgICAjICAgYmlzcXVlOiAgICAgICAgICAgICAgICAgICAgICcjZmZlNGM0J1xuICAgICMgICBibGFjazogICAgICAgICAgICAgICAgICAgICAgJyMwMDAwMDAnXG4gICAgIyAgIGJsYW5jaGVkYWxtb25kOiAgICAgICAgICAgICAnI2ZmZWJjZCdcbiAgICAjICAgYmx1ZTogICAgICAgICAgICAgICAgICAgICAgICcjMDAwMGZmJ1xuICAgICMgICBibHVldmlvbGV0OiAgICAgICAgICAgICAgICAgJyM4YTJiZTInXG4gICAgIyAgIGJyb3duOiAgICAgICAgICAgICAgICAgICAgICAnI2E1MmEyYSdcbiAgICAjICAgYnVybHl3b29kOiAgICAgICAgICAgICAgICAgICcjZGViODg3J1xuICAgICMgICBjYWRldGJsdWU6ICAgICAgICAgICAgICAgICAgJyM1ZjllYTAnXG4gICAgIyAgIGNoYXJ0cmV1c2U6ICAgICAgICAgICAgICAgICAnIzdmZmYwMCdcbiAgICAjICAgY2hvY29sYXRlOiAgICAgICAgICAgICAgICAgICcjZDI2OTFlJ1xuICAgICMgICBjb3JhbDogICAgICAgICAgICAgICAgICAgICAgJyNmZjdmNTAnXG4gICAgIyAgIGNvcm5mbG93ZXJibHVlOiAgICAgICAgICAgICAnIzY0OTVlZCdcbiAgICAjICAgY29ybnNpbGs6ICAgICAgICAgICAgICAgICAgICcjZmZmOGRjJ1xuICAgICMgICBjcmltc29uOiAgICAgICAgICAgICAgICAgICAgJyNkYzE0M2MnXG4gICAgIyAgIGN5YW46ICAgICAgICAgICAgICAgICAgICAgICAnIzAwZmZmZidcbiAgICAjICAgZGFya2JsdWU6ICAgICAgICAgICAgICAgICAgICcjMDAwMDhiJ1xuICAgICMgICBkYXJrY3lhbjogICAgICAgICAgICAgICAgICAgJyMwMDhiOGInXG4gICAgIyAgIGRhcmtnb2xkZW5yb2Q6ICAgICAgICAgICAgICAnI2I4ODYwYidcbiAgICAjICAgZGFya2dyYXk6ICAgICAgICAgICAgICAgICAgICcjYTlhOWE5J1xuICAgICMgICBkYXJrZ3JlZW46ICAgICAgICAgICAgICAgICAgJyMwMDY0MDAnXG4gICAgIyAgIGRhcmtraGFraTogICAgICAgICAgICAgICAgICAnI2JkYjc2YidcbiAgICAjICAgZGFya21hZ2VudGE6ICAgICAgICAgICAgICAgICcjOGIwMDhiJ1xuICAgICMgICBkYXJrb2xpdmVncmVlbjogICAgICAgICAgICAgJyM1NTZiMmYnXG4gICAgIyAgIGRhcmtvcmFuZ2U6ICAgICAgICAgICAgICAgICAnI2ZmOGMwMCdcbiAgICAjICAgZGFya29yY2hpZDogICAgICAgICAgICAgICAgICcjOTkzMmNjJ1xuICAgICMgICBkYXJrcmVkOiAgICAgICAgICAgICAgICAgICAgJyM4YjAwMDAnXG4gICAgIyAgIGRhcmtzYWxtb246ICAgICAgICAgICAgICAgICAnI2U5OTY3YSdcbiAgICAjICAgZGFya3NlYWdyZWVuOiAgICAgICAgICAgICAgICcjOGZiYzhmJ1xuICAgICMgICBkYXJrc2xhdGVibHVlOiAgICAgICAgICAgICAgJyM0ODNkOGInXG4gICAgIyAgIGRhcmtzbGF0ZWdyYXk6ICAgICAgICAgICAgICAnIzJmNGY0ZidcbiAgICAjICAgZGFya3R1cnF1b2lzZTogICAgICAgICAgICAgICcjMDBjZWQxJ1xuICAgICMgICBkYXJrdmlvbGV0OiAgICAgICAgICAgICAgICAgJyM5NDAwZDMnXG4gICAgIyAgIGRlZXBwaW5rOiAgICAgICAgICAgICAgICAgICAnI2ZmMTQ5MydcbiAgICAjICAgZGVlcHNreWJsdWU6ICAgICAgICAgICAgICAgICcjMDBiZmZmJ1xuICAgICMgICBkaW1ncmF5OiAgICAgICAgICAgICAgICAgICAgJyM2OTY5NjknXG4gICAgIyAgIGRvZGdlcmJsdWU6ICAgICAgICAgICAgICAgICAnIzFlOTBmZidcbiAgICAjICAgZmlyZWJyaWNrOiAgICAgICAgICAgICAgICAgICcjYjIyMjIyJ1xuICAgICMgICBmbG9yYWx3aGl0ZTogICAgICAgICAgICAgICAgJyNmZmZhZjAnXG4gICAgIyAgIGZvcmVzdGdyZWVuOiAgICAgICAgICAgICAgICAnIzIyOGIyMidcbiAgICAjICAgZ2FpbnNib3JvOiAgICAgICAgICAgICAgICAgICcjZGNkY2RjJ1xuICAgICMgICBnaG9zdHdoaXRlOiAgICAgICAgICAgICAgICAgJyNmOGY4ZmYnXG4gICAgIyAgIGdvbGQ6ICAgICAgICAgICAgICAgICAgICAgICAnI2ZmZDcwMCdcbiAgICAjICAgZ29sZGVucm9kOiAgICAgICAgICAgICAgICAgICcjZGFhNTIwJ1xuICAgICMgICBncmF5OiAgICAgICAgICAgICAgICAgICAgICAgJyM4MDgwODAnXG4gICAgIyAgIGdyZWVuOiAgICAgICAgICAgICAgICAgICAgICAnIzAwODAwMCdcbiAgICAjICAgZ3JlZW55ZWxsb3c6ICAgICAgICAgICAgICAgICcjYWRmZjJmJ1xuICAgICMgICBob25leWRldzogICAgICAgICAgICAgICAgICAgJyNmMGZmZjAnXG4gICAgIyAgIGhvdHBpbms6ICAgICAgICAgICAgICAgICAgICAnI2ZmNjliNCdcbiAgICAjICAgaW5kaWFucmVkOiAgICAgICAgICAgICAgICAgICcjY2Q1YzVjJ1xuICAgICMgICBpbmRpZ286ICAgICAgICAgICAgICAgICAgICAgJyM0YjAwODInXG4gICAgIyAgIGl2b3J5OiAgICAgICAgICAgICAgICAgICAgICAnI2ZmZmZmMCdcbiAgICAjICAga2hha2k6ICAgICAgICAgICAgICAgICAgICAgICcjZjBlNjhjJ1xuICAgICMgICBsYXZlbmRlcjogICAgICAgICAgICAgICAgICAgJyNlNmU2ZmEnXG4gICAgIyAgIGxhdmVuZGVyYmx1c2g6ICAgICAgICAgICAgICAnI2ZmZjBmNSdcbiAgICAjICAgbGF3bmdyZWVuOiAgICAgICAgICAgICAgICAgICcjN2NmYzAwJ1xuICAgICMgICBsZW1vbmNoaWZmb246ICAgICAgICAgICAgICAgJyNmZmZhY2QnXG4gICAgIyAgIGxpZ2h0Ymx1ZTogICAgICAgICAgICAgICAgICAnI2FkZDhlNidcbiAgICAjICAgbGlnaHRjb3JhbDogICAgICAgICAgICAgICAgICcjZjA4MDgwJ1xuICAgICMgICBsaWdodGN5YW46ICAgICAgICAgICAgICAgICAgJyNlMGZmZmYnXG4gICAgIyAgIGxpZ2h0Z29sZGVucm9keWVsbG93OiAgICAgICAnI2ZhZmFkMidcbiAgICAjICAgbGlnaHRncmF5OiAgICAgICAgICAgICAgICAgICcjZDNkM2QzJ1xuICAgICMgICBsaWdodGdyZWVuOiAgICAgICAgICAgICAgICAgJyM5MGVlOTAnXG4gICAgIyAgIGxpZ2h0cGluazogICAgICAgICAgICAgICAgICAnI2ZmYjZjMSdcbiAgICAjICAgbGlnaHRzYWxtb246ICAgICAgICAgICAgICAgICcjZmZhMDdhJ1xuICAgICMgICBsaWdodHNlYWdyZWVuOiAgICAgICAgICAgICAgJyMyMGIyYWEnXG4gICAgIyAgIGxpZ2h0c2t5Ymx1ZTogICAgICAgICAgICAgICAnIzg3Y2VmYSdcbiAgICAjICAgbGlnaHRzbGF0ZWdyYXk6ICAgICAgICAgICAgICcjNzc4ODk5J1xuICAgICMgICBsaWdodHN0ZWVsYmx1ZTogICAgICAgICAgICAgJyNiMGM0ZGUnXG4gICAgIyAgIGxpZ2h0eWVsbG93OiAgICAgICAgICAgICAgICAnI2ZmZmZlMCdcbiAgICAjICAgbGltZTogICAgICAgICAgICAgICAgICAgICAgICcjMDBmZjAwJ1xuICAgICMgICBsaW1lZ3JlZW46ICAgICAgICAgICAgICAgICAgJyMzMmNkMzInXG4gICAgIyAgIGxpbmVuOiAgICAgICAgICAgICAgICAgICAgICAnI2ZhZjBlNidcbiAgICAjICAgbWFnZW50YTogICAgICAgICAgICAgICAgICAgICcjZmYwMGZmJ1xuICAgICMgICBtYXJvb246ICAgICAgICAgICAgICAgICAgICAgJyM4MDAwMDAnXG4gICAgIyAgIG1lZGl1bWFxdWFtYXJpbmU6ICAgICAgICAgICAnIzY2Y2RhYSdcbiAgICAjICAgbWVkaXVtYmx1ZTogICAgICAgICAgICAgICAgICcjMDAwMGNkJ1xuICAgICMgICBtZWRpdW1vcmNoaWQ6ICAgICAgICAgICAgICAgJyNiYTU1ZDMnXG4gICAgIyAgIG1lZGl1bXB1cnBsZTogICAgICAgICAgICAgICAnIzkzNzBkYidcbiAgICAjICAgbWVkaXVtc2VhZ3JlZW46ICAgICAgICAgICAgICcjM2NiMzcxJ1xuICAgICMgICBtZWRpdW1zbGF0ZWJsdWU6ICAgICAgICAgICAgJyM3YjY4ZWUnXG4gICAgIyAgIG1lZGl1bXNwcmluZ2dyZWVuOiAgICAgICAgICAnIzAwZmE5YSdcbiAgICAjICAgbWVkaXVtdHVycXVvaXNlOiAgICAgICAgICAgICcjNDhkMWNjJ1xuICAgICMgICBtZWRpdW12aW9sZXRyZWQ6ICAgICAgICAgICAgJyNjNzE1ODUnXG4gICAgIyAgIG1pZG5pZ2h0Ymx1ZTogICAgICAgICAgICAgICAnIzE5MTk3MCdcbiAgICAjICAgbWludGNyZWFtOiAgICAgICAgICAgICAgICAgICcjZjVmZmZhJ1xuICAgICMgICBtaXN0eXJvc2U6ICAgICAgICAgICAgICAgICAgJyNmZmU0ZTEnXG4gICAgIyAgIG1vY2Nhc2luOiAgICAgICAgICAgICAgICAgICAnI2ZmZTRiNSdcbiAgICAjICAgbmF2YWpvd2hpdGU6ICAgICAgICAgICAgICAgICcjZmZkZWFkJ1xuICAgICMgICBuYXZ5OiAgICAgICAgICAgICAgICAgICAgICAgJyMwMDAwODAnXG4gICAgIyAgIG9sZGxhY2U6ICAgICAgICAgICAgICAgICAgICAnI2ZkZjVlNidcbiAgICAjICAgb2xpdmU6ICAgICAgICAgICAgICAgICAgICAgICcjODA4MDAwJ1xuICAgICMgICBvbGl2ZWRyYWI6ICAgICAgICAgICAgICAgICAgJyM2YjhlMjMnXG4gICAgIyAgIG9yYW5nZTogICAgICAgICAgICAgICAgICAgICAnI2ZmYTUwMCdcbiAgICAjICAgb3JhbmdlcmVkOiAgICAgICAgICAgICAgICAgICcjZmY0NTAwJ1xuICAgICMgICBvcmNoaWQ6ICAgICAgICAgICAgICAgICAgICAgJyNkYTcwZDYnXG4gICAgIyAgIHBhbGVnb2xkZW5yb2Q6ICAgICAgICAgICAgICAnI2VlZThhYSdcbiAgICAjICAgcGFsZWdyZWVuOiAgICAgICAgICAgICAgICAgICcjOThmYjk4J1xuICAgICMgICBwYWxldHVycXVvaXNlOiAgICAgICAgICAgICAgJyNhZmVlZWUnXG4gICAgIyAgIHBhbGV2aW9sZXRyZWQ6ICAgICAgICAgICAgICAnI2RiNzA5MydcbiAgICAjICAgcGFwYXlhd2hpcDogICAgICAgICAgICAgICAgICcjZmZlZmQ1J1xuICAgICMgICBwZWFjaHB1ZmY6ICAgICAgICAgICAgICAgICAgJyNmZmRhYjknXG4gICAgIyAgIHBlcnU6ICAgICAgICAgICAgICAgICAgICAgICAnI2NkODUzZidcbiAgICAjICAgcGluazogICAgICAgICAgICAgICAgICAgICAgICcjZmZjMGNiJ1xuICAgICMgICBwbHVtOiAgICAgICAgICAgICAgICAgICAgICAgJyNkZGEwZGQnXG4gICAgIyAgIHBvd2RlcmJsdWU6ICAgICAgICAgICAgICAgICAnI2IwZTBlNidcbiAgICAjICAgcHVycGxlOiAgICAgICAgICAgICAgICAgICAgICcjODAwMDgwJ1xuICAgICMgICByZWQ6ICAgICAgICAgICAgICAgICAgICAgICAgJyNmZjAwMDAnXG4gICAgIyAgIHJvc3licm93bjogICAgICAgICAgICAgICAgICAnI2JjOGY4ZidcbiAgICAjICAgcm95YWxibHVlOiAgICAgICAgICAgICAgICAgICcjNDE2OWUxJ1xuICAgICMgICBzYWRkbGVicm93bjogICAgICAgICAgICAgICAgJyM4YjQ1MTMnXG4gICAgIyAgIHNhbG1vbjogICAgICAgICAgICAgICAgICAgICAnI2ZhODA3MidcbiAgICAjICAgc2FuZHlicm93bjogICAgICAgICAgICAgICAgICcjZjRhNDYwJ1xuICAgICMgICBzZWFncmVlbjogICAgICAgICAgICAgICAgICAgJyMyZThiNTcnXG4gICAgIyAgIHNlYXNoZWxsOiAgICAgICAgICAgICAgICAgICAnI2ZmZjVlZSdcbiAgICAjICAgc2llbm5hOiAgICAgICAgICAgICAgICAgICAgICcjYTA1MjJkJ1xuICAgICMgICBzaWx2ZXI6ICAgICAgICAgICAgICAgICAgICAgJyNjMGMwYzAnXG4gICAgIyAgIHNreWJsdWU6ICAgICAgICAgICAgICAgICAgICAnIzg3Y2VlYidcbiAgICAjICAgc2xhdGVibHVlOiAgICAgICAgICAgICAgICAgICcjNmE1YWNkJ1xuICAgICMgICBzbGF0ZWdyYXk6ICAgICAgICAgICAgICAgICAgJyM3MDgwOTAnXG4gICAgIyAgIHNub3c6ICAgICAgICAgICAgICAgICAgICAgICAnI2ZmZmFmYSdcbiAgICAjICAgc3ByaW5nZ3JlZW46ICAgICAgICAgICAgICAgICcjMDBmZjdmJ1xuICAgICMgICBzdGVlbGJsdWU6ICAgICAgICAgICAgICAgICAgJyM0NjgyYjQnXG4gICAgIyAgIHRhbjogICAgICAgICAgICAgICAgICAgICAgICAnI2QyYjQ4YydcbiAgICAjICAgdGVhbDogICAgICAgICAgICAgICAgICAgICAgICcjMDA4MDgwJ1xuICAgICMgICB0aGlzdGxlOiAgICAgICAgICAgICAgICAgICAgJyNkOGJmZDgnXG4gICAgIyAgIHRvbWF0bzogICAgICAgICAgICAgICAgICAgICAnI2ZmNjM0NydcbiAgICAjICAgdHVycXVvaXNlOiAgICAgICAgICAgICAgICAgICcjNDBlMGQwJ1xuICAgICMgICB2aW9sZXQ6ICAgICAgICAgICAgICAgICAgICAgJyNlZTgyZWUnXG4gICAgIyAgIHdoZWF0OiAgICAgICAgICAgICAgICAgICAgICAnI2Y1ZGViMydcbiAgICAjICAgd2hpdGU6ICAgICAgICAgICAgICAgICAgICAgICcjZmZmZmZmJ1xuICAgICMgICB3aGl0ZXNtb2tlOiAgICAgICAgICAgICAgICAgJyNmNWY1ZjUnXG4gICAgIyAgIHllbGxvdzogICAgICAgICAgICAgICAgICAgICAnI2ZmZmYwMCdcbiAgICAjICAgeWVsbG93Z3JlZW46ICAgICAgICAgICAgICAgICcjOWFjZDMyJ1xuICAgICMgICAjLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi5cbiAgICAjICAgRkFOQ1lSRUQ6ICAgICAgICAgICAgICAgICAgICcjZmQ1MjMwJ1xuICAgICMgICBGQU5DWU9SQU5HRTogICAgICAgICAgICAgICAgJyNmZDZkMzAnXG4gICAgIyAgICMgb29tcGg6ICggeCApIC0+IGRlYnVnICfOqV9fXzInLCB4OyByZXR1cm4gXCJ+fn4gI3t4fSB+fn5cIlxuXG4gICAgY29sb3JzID1cbiAgICAgIF9rZXk6ICAgICAgICggeCApIC0+IHhcbiAgICAgIHBvZDogICAgICAgICggeCApIC0+IHhcbiAgICAgIG1hcDogICAgICAgICggeCApIC0+IHhcbiAgICAgIGxpc3Q6ICAgICAgICggeCApIC0+IHhcbiAgICAgIHNldDogICAgICAgICggeCApIC0+IHhcbiAgICAgIHRleHQ6ICAgICAgICggeCApIC0+IHhcbiAgICAgIGZsb2F0OiAgICAgICggeCApIC0+IHhcbiAgICAgIHJlZ2V4OiAgICAgICggeCApIC0+IHhcbiAgICAgIHRydWU6ICAgICAgICggeCApIC0+IHhcbiAgICAgIGZhbHNlOiAgICAgICggeCApIC0+IHhcbiAgICAgIHVuZGVmaW5lZDogICggeCApIC0+IHhcbiAgICAgIG51bGw6ICAgICAgICggeCApIC0+IHhcbiAgICAgIG5hbjogICAgICAgICggeCApIC0+IHhcbiAgICAgIG90aGVyOiAgICAgICggeCApIC0+IHhcbiAgICAgICMgX2tleTogICAgICAgKCB4ICkgLT4gQ09MT1IuY3lhbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgeFxuICAgICAgIyBwb2Q6ICAgICAgICAoIHggKSAtPiBDT0xPUi5nb2xkICAgICAgICAgICAgICAgICAgICAgICAgICAgICB4XG4gICAgICAjIG1hcDogICAgICAgICggeCApIC0+IENPTE9SLmdvbGQgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHhcbiAgICAgICMgbGlzdDogICAgICAgKCB4ICkgLT4gQ09MT1IuZ29sZCAgICAgICAgICAgICAgICAgICAgICAgICAgICAgeFxuICAgICAgIyBzZXQ6ICAgICAgICAoIHggKSAtPiBDT0xPUi5nb2xkICAgICAgICAgICAgICAgICAgICAgICAgICAgICB4XG4gICAgICAjIHRleHQ6ICAgICAgICggeCApIC0+IENPTE9SLndoZWF0ICAgICAgICAgICAgICAgICAgICAgICAgICAgIHhcbiAgICAgICMgZmxvYXQ6ICAgICAgKCB4ICkgLT4gQ09MT1IuRkFOQ1lSRUQgICAgICAgICAgICAgICAgICAgICAgICAgeFxuICAgICAgIyByZWdleDogICAgICAoIHggKSAtPiBDT0xPUi5wbHVtICAgICAgICAgICAgICAgICAgICAgICAgICAgICB4XG4gICAgICAjIHRydWU6ICAgICAgICggeCApIC0+IENPTE9SLmludmVyc2UuYm9sZC5pdGFsaWMubGltZSAgICAgICAgIHhcbiAgICAgICMgZmFsc2U6ICAgICAgKCB4ICkgLT4gQ09MT1IuaW52ZXJzZS5ib2xkLml0YWxpYy5GQU5DWU9SQU5HRSAgeFxuICAgICAgIyB1bmRlZmluZWQ6ICAoIHggKSAtPiBDT0xPUi5pbnZlcnNlLmJvbGQuaXRhbGljLm1hZ2VudGEgICAgICB4XG4gICAgICAjIG51bGw6ICAgICAgICggeCApIC0+IENPTE9SLmludmVyc2UuYm9sZC5pdGFsaWMuYmx1ZSAgICAgICAgIHhcbiAgICAgICMgbmFuOiAgICAgICAgKCB4ICkgLT4gQ09MT1IuaW52ZXJzZS5ib2xkLml0YWxpYy5tYWdlbnRhICAgICAgeFxuICAgICAgIyBvdGhlcjogICAgICAoIHggKSAtPiBDT0xPUi5pbnZlcnNlLnJlZCAgICAgICAgICAgICAgICAgICAgICB4XG5cbiAgICAjPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PVxuICAgIHNob3cgICAgICAgICAgICA9IG5ldyBTaG93KClcbiAgICBzaG93X25vX2NvbG9ycyAgPSBuZXcgU2hvdyB7IGNvbG9yczogZmFsc2UsIH1cblxuICAgICM9PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09XG4gICAgaW50ZXJuYWxzID0gT2JqZWN0LmZyZWV6ZSB7IGludGVybmFscy4uLiwgfVxuICAgIHJldHVybiBleHBvcnRzID0ge1xuICAgICAgU2hvdyxcbiAgICAgIHNob3csXG4gICAgICBzaG93X25vX2NvbG9ycyxcbiAgICAgIGludGVybmFscywgfVxuXG5cbiAgIz09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PVxuICAjIyMgTk9URSBGdXR1cmUgU2luZ2xlLUZpbGUgTW9kdWxlICMjI1xuICByZXF1aXJlX3R5cGVfb2Y6IC0+XG5cbiAgICAjPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PVxuICAgIG9iamVjdF9wcm90b3R5cGUgID0gT2JqZWN0LmdldFByb3RvdHlwZU9mIHt9XG4gICAgcG9kX3Byb3RvdHlwZXMgICAgPSBPYmplY3QuZnJlZXplIFsgbnVsbCwgb2JqZWN0X3Byb3RvdHlwZSwgXVxuXG4gICAgIy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4gICAgcHJpbWl0aXZlX3R5cGVzICAgICA9IE9iamVjdC5mcmVlemUgW1xuICAgICAgJ251bGwnLCAndW5kZWZpbmVkJyxcbiAgICAgICdib29sZWFuJyxcbiAgICAgICdpbmZpbml0eScsICduYW4nLCAnZmxvYXQnLFxuICAgICAgJ3RleHQnLCAnc3ltYm9sJywgJ3JlZ2V4JyxcbiAgICAgIF1cblxuICAgICM9PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09XG4gICAgaW50ZXJuYWxzICAgICAgICAgPSB7IG9iamVjdF9wcm90b3R5cGUsIHBvZF9wcm90b3R5cGVzLCBwcmltaXRpdmVfdHlwZXMsIH1cblxuICAgICMtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuICAgIHR5cGVfb2YgPSAoIHggKSAtPlxuICAgICAgIy4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLlxuICAgICAgIyMjIFByaW1pdGl2ZXM6ICMjI1xuICAgICAgcmV0dXJuICdudWxsJyAgICAgICAgIGlmIHggaXMgbnVsbFxuICAgICAgcmV0dXJuICd1bmRlZmluZWQnICAgIGlmIHggaXMgdW5kZWZpbmVkXG4gICAgICByZXR1cm4gJ2luZmluaXR5JyAgICAgaWYgKCB4IGlzICtJbmZpbml0eSApIG9yICggeCBpcyAtSW5maW5pdHkgKVxuICAgICAgcmV0dXJuICdib29sZWFuJyAgICAgIGlmICggeCBpcyB0cnVlICkgb3IgKCB4IGlzIGZhbHNlIClcbiAgICAgICMgcmV0dXJuICd0cnVlJyAgICAgICAgIGlmICggeCBpcyB0cnVlIClcbiAgICAgICMgcmV0dXJuICdmYWxzZScgICAgICAgIGlmICggeCBpcyBmYWxzZSApXG4gICAgICByZXR1cm4gJ25hbicgICAgICAgICAgaWYgTnVtYmVyLmlzTmFOICAgICB4XG4gICAgICByZXR1cm4gJ2Zsb2F0JyAgICAgICAgaWYgTnVtYmVyLmlzRmluaXRlICB4XG4gICAgICAjIHJldHVybiAndW5zZXQnICAgICAgICBpZiB4IGlzIHVuc2V0XG4gICAgICByZXR1cm4gJ3BvZCcgICAgICAgICAgaWYgKCBPYmplY3QuZ2V0UHJvdG90eXBlT2YgeCApIGluIHBvZF9wcm90b3R5cGVzXG4gICAgICAjLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uXG4gICAgICBzd2l0Y2gganN0eXBlb2YgPSB0eXBlb2YgeFxuICAgICAgICB3aGVuICdzdHJpbmcnICAgICAgICAgICAgICAgICAgICAgICB0aGVuIHJldHVybiAndGV4dCdcbiAgICAgICAgd2hlbiAnc3ltYm9sJyAgICAgICAgICAgICAgICAgICAgICAgdGhlbiByZXR1cm4gJ3N5bWJvbCdcbiAgICAgICMuLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi5cbiAgICAgIHJldHVybiAnbGlzdCcgICAgICAgICBpZiBBcnJheS5pc0FycmF5ICB4XG4gICAgICByZXR1cm4gJ2Vycm9yJyAgICAgICAgaWYgKCBFcnJvci5pc0Vycm9yIHggKSBvciAoIHggaW5zdGFuY2VvZiBFcnJvciApXG4gICAgICAjIyMgVEFJTlQgY29uc2lkZXIgdG8gcmV0dXJuIHguY29uc3RydWN0b3IubmFtZSAjIyNcbiAgICAgIHN3aXRjaCBtaWxsZXJ0eXBlID0gKCAoIE9iamVjdDo6dG9TdHJpbmcuY2FsbCB4ICkucmVwbGFjZSAvXlxcW29iamVjdCAoW15cXF1dKylcXF0kLywgJyQxJyApLnRvTG93ZXJDYXNlKClcbiAgICAgICAgd2hlbiAncmVnZXhwJyAgICAgICAgICAgICAgICAgICAgICAgdGhlbiByZXR1cm4gJ3JlZ2V4J1xuICAgICAgcmV0dXJuIG1pbGxlcnR5cGVcbiAgICAgICMgc3dpdGNoIG1pbGxlcnR5cGUgPSBPYmplY3Q6OnRvU3RyaW5nLmNhbGwgeFxuICAgICAgIyAgIHdoZW4gJ1tvYmplY3QgRnVuY3Rpb25dJyAgICAgICAgICAgIHRoZW4gcmV0dXJuICdmdW5jdGlvbidcbiAgICAgICMgICB3aGVuICdbb2JqZWN0IEFzeW5jRnVuY3Rpb25dJyAgICAgICB0aGVuIHJldHVybiAnYXN5bmNmdW5jdGlvbidcbiAgICAgICMgICB3aGVuICdbb2JqZWN0IEdlbmVyYXRvckZ1bmN0aW9uXScgICB0aGVuIHJldHVybiAnZ2VuZXJhdG9yZnVuY3Rpb24nXG5cbiAgICAjLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiAgICBpc19wcmltaXRpdmUgICAgICA9ICggeCAgICAgKSAtPiAoIHR5cGVfb2YgeCApICBpbiBwcmltaXRpdmVfdHlwZXNcbiAgICBpc19wcmltaXRpdmVfdHlwZSA9ICggdHlwZSAgKSAtPiB0eXBlICAgICAgICAgICBpbiBwcmltaXRpdmVfdHlwZXNcblxuICAgICM9PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09XG4gICAgaW50ZXJuYWxzID0gT2JqZWN0LmZyZWV6ZSB7IGludGVybmFscy4uLiwgfVxuICAgIHJldHVybiBleHBvcnRzID0ge1xuICAgICAgdHlwZV9vZixcbiAgICAgIGlzX3ByaW1pdGl2ZSxcbiAgICAgIGlzX3ByaW1pdGl2ZV90eXBlLFxuICAgICAgaW50ZXJuYWxzLCB9XG5cbiM9PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PVxuT2JqZWN0LmFzc2lnbiBtb2R1bGUuZXhwb3J0cywgQlJJQ1NcblxuXG5cblxuIyAjPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT1cbiMgZGVtb19zaG93ID0gLT5cbiMgICBHVVkgICAgICAgICAgICAgICAgICAgICAgID0gcmVxdWlyZSAnLi4vLi4vZ3V5JyAjIyMgYnJpY2FicmFjOiBza2lwLXJlcXVpcmUgIyMjXG4jICAgeyBycHIsIH0gPSBHVVkudHJtXG4jICAgeyBzaG93LFxuIyAgICAgU2hvdywgfSA9IEJSSUNTLnJlcXVpcmVfc2hvdygpXG4jICAgZGVidWcgJ86pX19fMycsIHNob3dcbiMgICBkZWJ1ZyAnzqlfX180Jywgc2hvdy5zdGF0ZVxuIyAgIGRlYnVnICfOqV9fXzUnLCBzaG93IHNob3cuZGVudFxuIyAgIGRlYnVnICfOqV9fXzYnLCBzaG93LmdvX2Rvd24oKVxuIyAgIGRlYnVnICfOqV9fXzcnLCBzaG93IHNob3cuZGVudFxuIyAgIGVjaG8oKVxuIyAgIGVjaG8gJ86pX19fOCcsICfigJTigJTigJTigJTigJTigJTigJTigJTigJTigJTigJTigJTigJTigJTigJTigJTigJTigJTigJTigJTigJTigJTigJTigJTigJTigJTigJTigJTigJTigJTigJTigJTigJTigJTigJTigJTigJTigJTigJTigJTigJTigJTigJTigJTigJTigJTigJTigJTigJTigJTigJTigJTigJTigJTigJTigJTigJTigJTigJTigJTigJTigJTigJTigJQnXG4jICAgZWNobyAnzqlfX185Jywgc2hvdyB2XzEgPSBcImZvbyAnYmFyJ1wiXG4jICAgZWNobyAnzqlfXzEwJywgJ+KAlOKAlOKAlOKAlOKAlOKAlOKAlOKAlOKAlOKAlOKAlOKAlOKAlOKAlOKAlOKAlOKAlOKAlOKAlOKAlOKAlOKAlOKAlOKAlOKAlOKAlOKAlOKAlOKAlOKAlOKAlOKAlOKAlOKAlOKAlOKAlOKAlOKAlOKAlOKAlOKAlOKAlOKAlOKAlOKAlOKAlOKAlOKAlOKAlOKAlOKAlOKAlOKAlOKAlOKAlOKAlOKAlOKAlOKAlOKAlOKAlOKAlOKAlOKAlCdcbiMgICBlY2hvICfOqV9fMTEnLCBzaG93IHZfMiA9IHt9XG4jICAgZWNobyAnzqlfXzEyJywgJ+KAlOKAlOKAlOKAlOKAlOKAlOKAlOKAlOKAlOKAlOKAlOKAlOKAlOKAlOKAlOKAlOKAlOKAlOKAlOKAlOKAlOKAlOKAlOKAlOKAlOKAlOKAlOKAlOKAlOKAlOKAlOKAlOKAlOKAlOKAlOKAlOKAlOKAlOKAlOKAlOKAlOKAlOKAlOKAlOKAlOKAlOKAlOKAlOKAlOKAlOKAlOKAlOKAlOKAlOKAlOKAlOKAlOKAlOKAlOKAlOKAlOKAlOKAlOKAlCdcbiMgICBlY2hvICfOqV9fMTMnLCBzaG93IHZfMyA9IHsga29uZzogMTA4LCBsb3c6IDkyMywgbnVtYmVyczogWyAxMCwgMTEsIDEyLCBdLCB9XG4jICAgZWNobyAnzqlfXzE0JywgJ+KAlOKAlOKAlOKAlOKAlOKAlOKAlOKAlOKAlOKAlOKAlOKAlOKAlOKAlOKAlOKAlOKAlOKAlOKAlOKAlOKAlOKAlOKAlOKAlOKAlOKAlOKAlOKAlOKAlOKAlOKAlOKAlOKAlOKAlOKAlOKAlOKAlOKAlOKAlOKAlOKAlOKAlOKAlOKAlOKAlOKAlOKAlOKAlOKAlOKAlOKAlOKAlOKAlOKAlOKAlOKAlOKAlOKAlOKAlOKAlOKAlOKAlOKAlOKAlCdcbiMgICBlY2hvICfOqV9fMTUnLCBzaG93IHZfNCA9IFtdXG4jICAgZWNobyAnzqlfXzE2JywgJ+KAlOKAlOKAlOKAlOKAlOKAlOKAlOKAlOKAlOKAlOKAlOKAlOKAlOKAlOKAlOKAlOKAlOKAlOKAlOKAlOKAlOKAlOKAlOKAlOKAlOKAlOKAlOKAlOKAlOKAlOKAlOKAlOKAlOKAlOKAlOKAlOKAlOKAlOKAlOKAlOKAlOKAlOKAlOKAlOKAlOKAlOKAlOKAlOKAlOKAlOKAlOKAlOKAlOKAlOKAlOKAlOKAlOKAlOKAlOKAlOKAlOKAlOKAlOKAlCdcbiMgICBlY2hvICfOqV9fMTcnLCBzaG93IHZfNSA9IFsgJ3NvbWUnLCAnd29yZHMnLCAndG8nLCAnc2hvdycsIDEsIC0xLCBmYWxzZSwgXVxuIyAgIGVjaG8gJ86pX18xOCcsICfigJTigJTigJTigJTigJTigJTigJTigJTigJTigJTigJTigJTigJTigJTigJTigJTigJTigJTigJTigJTigJTigJTigJTigJTigJTigJTigJTigJTigJTigJTigJTigJTigJTigJTigJTigJTigJTigJTigJTigJTigJTigJTigJTigJTigJTigJTigJTigJTigJTigJTigJTigJTigJTigJTigJTigJTigJTigJTigJTigJTigJTigJTigJTigJQnXG4jICAgZWNobyAnzqlfXzE5Jywgc2hvdyB2XzYgPSBuZXcgTWFwIFsgWyAna29uZycsIDEwOCwgXSwgWyAnbG93JywgOTIzLCBdLCBbIDk3MSwgJ3dvcmQnLCBdLCBbIHRydWUsICcrMScsIF0sIFsgJ2EgYiBjJywgZmFsc2UsIF0gXVxuIyAgIGVjaG8gJ86pX18yMCcsICfigJTigJTigJTigJTigJTigJTigJTigJTigJTigJTigJTigJTigJTigJTigJTigJTigJTigJTigJTigJTigJTigJTigJTigJTigJTigJTigJTigJTigJTigJTigJTigJTigJTigJTigJTigJTigJTigJTigJTigJTigJTigJTigJTigJTigJTigJTigJTigJTigJTigJTigJTigJTigJTigJTigJTigJTigJTigJTigJTigJTigJTigJTigJTigJQnXG4jICAgZWNobyAnzqlfXzIxJywgc2hvdyB2XzcgPSBuZXcgU2V0IFsgJ3NvbWUnLCAnd29yZHMnLCB0cnVlLCBmYWxzZSwgbnVsbCwgdW5kZWZpbmVkLCAzLjE0MTU5MjYsIE5hTiwgXVxuIyAgIGVjaG8gJ86pX18yMicsICfigJTigJTigJTigJTigJTigJTigJTigJTigJTigJTigJTigJTigJTigJTigJTigJTigJTigJTigJTigJTigJTigJTigJTigJTigJTigJTigJTigJTigJTigJTigJTigJTigJTigJTigJTigJTigJTigJTigJTigJTigJTigJTigJTigJTigJTigJTigJTigJTigJTigJTigJTigJTigJTigJTigJTigJTigJTigJTigJTigJTigJTigJTigJTigJQnXG4jICAgZWNobyAnzqlfXzIzJywgc2hvdyB2XzggPSAvYWJjW2RlXS9cbiMgICBlY2hvICfOqV9fMjQnLCAn4oCU4oCU4oCU4oCU4oCU4oCU4oCU4oCU4oCU4oCU4oCU4oCU4oCU4oCU4oCU4oCU4oCU4oCU4oCU4oCU4oCU4oCU4oCU4oCU4oCU4oCU4oCU4oCU4oCU4oCU4oCU4oCU4oCU4oCU4oCU4oCU4oCU4oCU4oCU4oCU4oCU4oCU4oCU4oCU4oCU4oCU4oCU4oCU4oCU4oCU4oCU4oCU4oCU4oCU4oCU4oCU4oCU4oCU4oCU4oCU4oCU4oCU4oCU4oCUJ1xuIyAgIGVjaG8gJ86pX18yNScsIHNob3cgdl85ID0gQnVmZmVyLmZyb20gJ2FiY8Okw7bDvCdcbiMgICBlY2hvICfOqV9fMjYnLCAn4oCU4oCU4oCU4oCU4oCU4oCU4oCU4oCU4oCU4oCU4oCU4oCU4oCU4oCU4oCU4oCU4oCU4oCU4oCU4oCU4oCU4oCU4oCU4oCU4oCU4oCU4oCU4oCU4oCU4oCU4oCU4oCU4oCU4oCU4oCU4oCU4oCU4oCU4oCU4oCU4oCU4oCU4oCU4oCU4oCU4oCU4oCU4oCU4oCU4oCU4oCU4oCU4oCU4oCU4oCU4oCU4oCU4oCU4oCU4oCU4oCU4oCU4oCU4oCUJ1xuIyAgIGVjaG8gJ86pX18yNycsIHNob3cgdl8xMCA9IHsgdl8xLCB2XzIsIHZfMywgdl80LCB2XzUsIHZfNiwgdl83LCB2XzgsIHZfOSwgfSAjIHZfMTAsIHZfMTEsIHZfMTIsIHZfMTMsIHZfMTQsIH1cbiMgICB2XzEwLnZfMTAgPSB2XzEwXG4jICAgZWNobyAnzqlfXzI4JywgJ+KAlOKAlOKAlOKAlOKAlOKAlOKAlOKAlOKAlOKAlOKAlOKAlOKAlOKAlOKAlOKAlOKAlOKAlOKAlOKAlOKAlOKAlOKAlOKAlOKAlOKAlOKAlOKAlOKAlOKAlOKAlOKAlOKAlOKAlOKAlOKAlOKAlOKAlOKAlOKAlOKAlOKAlOKAlOKAlOKAlOKAlOKAlOKAlOKAlOKAlOKAlOKAlOKAlOKAlOKAlOKAlOKAlOKAlOKAlOKAlOKAlOKAlOKAlOKAlCdcbiMgICBlY2hvICfOqV9fMjknLCBycHIgdl8xMFxuIyAgIGVjaG8gJ86pX18zMCcsIHNob3cgdl8xMCA9IHsgdl8xLCB2XzIsIHZfMywgdl80LCB2XzUsIHZfNiwgdl83LCB2XzgsIHZfOSwgdl8xMCwgfSAjIHZfMTAsIHZfMTEsIHZfMTIsIHZfMTMsIHZfMTQsIH1cbiMgICBlY2hvICfOqV9fMzEnLCAn4oCU4oCU4oCU4oCU4oCU4oCU4oCU4oCU4oCU4oCU4oCU4oCU4oCU4oCU4oCU4oCU4oCU4oCU4oCU4oCU4oCU4oCU4oCU4oCU4oCU4oCU4oCU4oCU4oCU4oCU4oCU4oCU4oCU4oCU4oCU4oCU4oCU4oCU4oCU4oCU4oCU4oCU4oCU4oCU4oCU4oCU4oCU4oCU4oCU4oCU4oCU4oCU4oCU4oCU4oCU4oCU4oCU4oCU4oCU4oCU4oCU4oCU4oCU4oCUJ1xuIyAgIGEgPSBbICdhJywgXVxuIyAgIGIgPSBbICdiJywgYSwgXVxuIyAgIGVjaG8gJ86pX18zMicsIHJwciAgYlxuIyAgIGVjaG8gJ86pX18zMycsIHNob3cgYlxuIyAgIGVjaG8gJ86pX18zNCcsICfigJTigJTigJTigJTigJTigJTigJTigJTigJTigJTigJTigJTigJTigJTigJTigJTigJTigJTigJTigJTigJTigJTigJTigJTigJTigJTigJTigJTigJTigJTigJTigJTigJTigJTigJTigJTigJTigJTigJTigJTigJTigJTigJTigJTigJTigJTigJTigJTigJTigJTigJTigJTigJTigJTigJTigJTigJTigJTigJTigJTigJTigJTigJTigJQnXG4jICAgYi5wdXNoIGFcbiMgICBlY2hvICfOqV9fMzUnLCBycHIgIGJcbiMgICBlY2hvICfOqV9fMzYnLCBzaG93IGJcbiMgICBlY2hvICfOqV9fMzcnLCAn4oCU4oCU4oCU4oCU4oCU4oCU4oCU4oCU4oCU4oCU4oCU4oCU4oCU4oCU4oCU4oCU4oCU4oCU4oCU4oCU4oCU4oCU4oCU4oCU4oCU4oCU4oCU4oCU4oCU4oCU4oCU4oCU4oCU4oCU4oCU4oCU4oCU4oCU4oCU4oCU4oCU4oCU4oCU4oCU4oCU4oCU4oCU4oCU4oCU4oCU4oCU4oCU4oCU4oCU4oCU4oCU4oCU4oCU4oCU4oCU4oCU4oCU4oCU4oCUJ1xuIyAgIGQgPSB7fVxuIyAgIGMgPSB7IGQsIH1cbiMgICBkLmMgPSBjXG4jICAgZSA9IHsgZCwgYywgfVxuIyAgIGVjaG8gJ86pX18zOCcsIHJwciBjXG4jICAgZWNobyAnzqlfXzM5JywgcnByIGVcbiMgICAjIGVjaG8gJ86pX180MCcsIHNob3cgYlxuIyAgIGVjaG8gJ86pX180MScsICfigJTigJTigJTigJTigJTigJTigJTigJTigJTigJTigJTigJTigJTigJTigJTigJTigJTigJTigJTigJTigJTigJTigJTigJTigJTigJTigJTigJTigJTigJTigJTigJTigJTigJTigJTigJTigJTigJTigJTigJTigJTigJTigJTigJTigJTigJTigJTigJTigJTigJTigJTigJTigJTigJTigJTigJTigJTigJTigJTigJTigJTigJTigJTigJQnXG4jICAgZWNobygpXG4jICAgcmV0dXJuIG51bGxcblxuIyBkZW1vX3Nob3coKVxuXG5cblxuIl19
