(function() {
  'use strict';
  var VARIOUS_BRICS;

  //###########################################################################################################

  //===========================================================================================================
  VARIOUS_BRICS = {
    //===========================================================================================================
    /* NOTE Future Single-File Module */
    require_list_tools: function() {
      var append, is_empty;
      append = function(list, ...P) {
        return list.splice(list.length, 0, ...P);
      };
      is_empty = function(list) {
        return list.length === 0;
      };
      return {append, is_empty};
    },
    //===========================================================================================================
    /* NOTE Future Single-File Module */
    require_escape_html_text: function() {
      var escape_html_text;
      escape_html_text = function(text) {
        var R;
        R = text;
        R = R.replace(/&/g, '&amp;');
        R = R.replace(/</g, '&lt;');
        R = R.replace(/>/g, '&gt;');
        return R;
      };
      return {escape_html_text};
    },
    //===========================================================================================================
    /* NOTE Future Single-File Module */
    require_tagfun_tools: function() {
      var is_tagfun_call, walk_nonempty_parts, walk_parts, walk_raw_nonempty_parts, walk_raw_parts;
      // ### Given the arguments of either a tagged template function call ('tagfun call') or the single
      // argument of a conventional function call, `get_first_argument()` will return either

      // * the result of applying `as_text()` to the sole argument, or

      // * the result of concatenating the constant parts and the interpolated expressions, which each
      // expression replaced by the result of applying `as_text()` to it.

      // Another way to describe this behavior is to say that this function treats a conventional call with
      // a single expression the same way that it treats a funtag call with a string that contains nothing but
      // that same expression, so the invariant `( get_first_argument exp ) == ( get_first_argument"#{ exp }"
      // )` holds.

      // * intended for string producers, text processing, markup production;
      // * list some examples. ###

      // #---------------------------------------------------------------------------------------------------------
      // create_get_first_argument_fn = ( as_text = null ) ->
      //   as_text ?= ( expression ) -> "#{expression}"
      //   ### TAINT use proper validation ###
      //   unless ( typeof as_text ) is 'function'
      //     throw new Error "Ωidsp___1 expected a function, got #{rpr as_text}"
      //   #-------------------------------------------------------------------------------------------------------
      //   get_first_argument = ( P... ) ->
      //     unless is_tagfun_call P...
      //       unless P.length is 1
      //         throw new Error "Ωidsp___2 expected 1 argument, got #{P.length}"
      //       return as_text P[ 0 ]
      //     #.....................................................................................................
      //     [ parts, expressions..., ] = P
      //     R = parts[ 0 ]
      //     for expression, idx in expressions
      //       R += ( as_text expression ) + parts[ idx + 1 ]
      //     return R
      //   #-------------------------------------------------------------------------------------------------------
      //   get_first_argument.create = create_get_first_argument_fn
      //   return get_first_argument

      //---------------------------------------------------------------------------------------------------------
      is_tagfun_call = function(...P) {
        if (!Array.isArray(P[0])) {
          return false;
        }
        if (!Object.isFrozen(P[0])) {
          return false;
        }
        if (P[0].raw == null) {
          return false;
        }
        return true;
      };
      //---------------------------------------------------------------------------------------------------------
      walk_raw_parts = function*(chunks, ...values) {
        var chunk;
        chunks = (function() {
          var i, len, ref, results;
          ref = chunks.raw;
          results = [];
          for (i = 0, len = ref.length; i < len; i++) {
            chunk = ref[i];
            results.push(chunk);
          }
          return results;
        })();
        chunks.raw = chunks.slice(0);
        Object.freeze(chunks);
        return (yield* walk_parts(chunks, ...values));
      };
      //---------------------------------------------------------------------------------------------------------
      walk_parts = function*(chunks, ...values) {
        var i, idx, len, value;
        if (!is_tagfun_call(chunks, ...values)) {
          if (values.length !== 0) {
            throw new Error(`Ω___3 expected 1 argument in non-template call, got ${arguments.length}`);
          }
          if (typeof chunks === 'string') {
            [chunks, values] = [[chunks], []];
          } else {
            [chunks, values] = [['', ''], [chunks]];
          }
        }
        yield ({
          //.......................................................................................................
          chunk: chunks[0],
          isa: 'chunk'
        });
        for (idx = i = 0, len = values.length; i < len; idx = ++i) {
          value = values[idx];
          yield ({
            value,
            isa: 'value'
          });
          yield ({
            chunk: chunks[idx + 1],
            isa: 'chunk'
          });
        }
        //.......................................................................................................
        return null;
      };
      //---------------------------------------------------------------------------------------------------------
      walk_raw_nonempty_parts = function*(chunks, ...values) {
        var part;
        for (part of walk_raw_parts(chunks, ...values)) {
          if (!((part.chunk === '') || (part.value === ''))) {
            yield part;
          }
        }
        return null;
      };
      //---------------------------------------------------------------------------------------------------------
      walk_nonempty_parts = function*(chunks, ...values) {
        var part;
        for (part of walk_parts(chunks, ...values)) {
          if (!((part.chunk === '') || (part.value === ''))) {
            yield part;
          }
        }
        return null;
      };
      //---------------------------------------------------------------------------------------------------------
      // return do exports = ( get_first_argument = create_get_first_argument_fn() ) -> {
      //   get_first_argument, is_tagfun_call,
      //   walk_parts, walk_nonempty_parts, walk_raw_parts, walk_raw_nonempty_parts, }
      return {is_tagfun_call, walk_parts, walk_raw_parts, walk_nonempty_parts, walk_raw_nonempty_parts};
    },
    //===========================================================================================================
    /* NOTE Future Single-File Module */
    require_managed_property_tools: function() {
      /* TAINT should use `Object.defineProperty()` for `set_getter()` */
      var hide, set_getter, set_hidden_readonly, set_readonly;
      set_readonly = function(object, name, value) {
        return Object.defineProperty(object, name, {
          enumerable: true,
          writable: false,
          configurable: false,
          value: value
        });
      };
      set_hidden_readonly = function(object, name, value) {
        return Object.defineProperty(object, name, {
          enumerable: false,
          writable: false,
          configurable: false,
          value: value
        });
      };
      set_getter = function(object, name, get) {
        return Object.defineProperties(object, {
          [name]: {get}
        });
      };
      hide = (object, name, value) => {
        return Object.defineProperty(object, name, {
          enumerable: false,
          writable: true,
          configurable: true,
          value: value
        });
      };
      //---------------------------------------------------------------------------------------------------------
      return {set_readonly, set_hidden_readonly, set_getter, hide};
    },
    //===========================================================================================================
    /* NOTE Future Single-File Module */
    require_nameit: function() {
      var nameit;
      nameit = function(name, fn) {
        Object.defineProperty(fn, 'name', {
          value: name
        });
        return fn;
      };
      //---------------------------------------------------------------------------------------------------------
      return {nameit};
    },
    //===========================================================================================================
    /* NOTE Future Single-File Module */
    require_stack_classes: function() {
      var Stack, XXX_Stack_error, hide, misfit, set_getter;
      ({set_getter, hide} = VARIOUS_BRICS.require_managed_property_tools());
      misfit = Symbol('misfit');
      XXX_Stack_error = class XXX_Stack_error extends Error {};
      Stack = (function() {
        //===========================================================================================================
        class Stack {
          //---------------------------------------------------------------------------------------------------------
          constructor() {
            this.data = [];
            return void 0;
          }

          //---------------------------------------------------------------------------------------------------------
          toString() {
            var e;
            return `[${((function() {
              var i, len, ref, results;
              ref = this.data;
              results = [];
              for (i = 0, len = ref.length; i < len; i++) {
                e = ref[i];
                results.push(`${e}`);
              }
              return results;
            }).call(this)).join`.`}]`;
          }

          clear() {
            this.data.length = 0;
            return null;
          }

          * [Symbol.iterator]() {
            return (yield* this.data);
          }

          //---------------------------------------------------------------------------------------------------------
          push(x) {
            this.data.push(x);
            return null;
          }

          unshift(x) {
            this.data.unshift(x);
            return null;
          }

          //---------------------------------------------------------------------------------------------------------
          pop(fallback = misfit) {
            if (this.is_empty) {
              if (fallback !== misfit) {
                return fallback;
              }
              throw new XXX_Stack_error("Ωidsp___4 unable to pop value from empty stack");
            }
            return this.data.pop();
          }

          //---------------------------------------------------------------------------------------------------------
          shift(fallback = misfit) {
            if (this.is_empty) {
              if (fallback !== misfit) {
                return fallback;
              }
              throw new XXX_Stack_error("Ωidsp___5 unable to shift value from empty stack");
            }
            return this.data.shift();
          }

          //---------------------------------------------------------------------------------------------------------
          peek(fallback = misfit) {
            if (this.is_empty) {
              if (fallback !== misfit) {
                return fallback;
              }
              throw new XXX_Stack_error("Ωidsp___6 unable to peek value of empty stack");
            }
            return this.data.at(-1);
          }

        };

        //---------------------------------------------------------------------------------------------------------
        set_getter(Stack.prototype, 'length', function() {
          return this.data.length;
        });

        set_getter(Stack.prototype, 'is_empty', function() {
          return this.data.length === 0;
        });

        return Stack;

      }).call(this);
      //-----------------------------------------------------------------------------------------------------------
      return {Stack};
    },
    //===========================================================================================================
    /* NOTE Future Single-File Module */
    require_infiniproxy: function() {
      /*

      ## To Do

      * **`[—]`** allow to set context to be used by `apply()`
      * **`[—]`** allow to call `sys.stack.clear()` manually where seen fit

       */
      /* TAINT in this simulation of single-file modules, a new distinct symbol is produced with each call to
         `require_infiniproxy()` */
      var Stack, create_infinyproxy, hide, sys_symbol, template;
      ({hide} = VARIOUS_BRICS.require_managed_property_tools());
      ({Stack} = VARIOUS_BRICS.require_stack_classes());
      sys_symbol = Symbol('sys');
      // misfit                  = Symbol 'misfit'
      template = {
        /* An object that will be checked for existing properties to return; when no provider is given or a
             provider lacks a requested property, `sys.sub_level_proxy` will be returned for property accesses: */
        provider: Object.create(null),
        /* A function to be called when the proxy (either `sys.top_level_proxy` or `sys.sub_level_proxy`) is
             called; notice that if the `provider` provides a method for a given key, that method will be called
             instead of the `callee`: */
        callee: null
      };
      //=========================================================================================================
      create_infinyproxy = function(cfg) {
        var new_proxy, sys;
        cfg = {...template, ...cfg};
        //.......................................................................................................
        new_proxy = function({is_top_level}) {
          var R, callee_ctx, get_ctx;
          callee_ctx = null;
          get_ctx = function() {
            return callee_ctx != null ? callee_ctx : callee_ctx = {is_top_level, ...cfg, ...sys};
          };
          //.....................................................................................................
          R = new Proxy(cfg.callee, {
            //-----------------------------------------------------------------------------------------------------
            apply: function(target, key, P) {
              // urge 'Ωbrcs___7', "apply #{rpr { target, key, P, is_top_level, }}"
              R = Reflect.apply(target, get_ctx(), P);
              sys.stack.clear();
              return R;
            },
            //-----------------------------------------------------------------------------------------------------
            get: function(target, key) {
              if (key === sys_symbol) {
                // urge 'Ωbrcs___8', "get #{rpr { target, key, }}"
                return get_ctx();
              }
              if ((typeof key) === 'symbol') {
                return target[key];
              }
              if (Reflect.has(cfg.provider, key)) {
                return Reflect.get(cfg.provider, key);
              }
              if (is_top_level) {
                sys.stack.clear();
              }
              sys.stack.push(key);
              // return "[result for getting non-preset key #{rpr key}] from #{rpr provider}"
              return sys.sub_level_proxy;
            }
          });
          //.....................................................................................................
          return R;
        };
        //.......................................................................................................
        sys = {
          stack: new Stack()
        };
        sys.top_level_proxy = new_proxy({
          is_top_level: true
        });
        sys.sub_level_proxy = new_proxy({
          is_top_level: false
        });
        //.......................................................................................................
        return sys.top_level_proxy;
      };
      //---------------------------------------------------------------------------------------------------------
      return {create_infinyproxy, sys_symbol};
    }
  };

  //===========================================================================================================
  Object.assign(module.exports, VARIOUS_BRICS);

}).call(this);

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vc3JjL3ZhcmlvdXMtYnJpY3MuY29mZmVlIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUNBO0VBQUE7QUFBQSxNQUFBLGFBQUE7Ozs7O0VBS0EsYUFBQSxHQUlFLENBQUE7OztJQUFBLGtCQUFBLEVBQW9CLFFBQUEsQ0FBQSxDQUFBO0FBQ3RCLFVBQUEsTUFBQSxFQUFBO01BQUksTUFBQSxHQUFZLFFBQUEsQ0FBRSxJQUFGLEVBQUEsR0FBUSxDQUFSLENBQUE7ZUFBa0IsSUFBSSxDQUFDLE1BQUwsQ0FBWSxJQUFJLENBQUMsTUFBakIsRUFBeUIsQ0FBekIsRUFBNEIsR0FBQSxDQUE1QjtNQUFsQjtNQUNaLFFBQUEsR0FBWSxRQUFBLENBQUUsSUFBRixDQUFBO2VBQVksSUFBSSxDQUFDLE1BQUwsS0FBZTtNQUEzQjtBQUNaLGFBQU8sQ0FBRSxNQUFGLEVBQVUsUUFBVjtJQUhXLENBQXBCOzs7SUFPQSx3QkFBQSxFQUEwQixRQUFBLENBQUEsQ0FBQTtBQUM1QixVQUFBO01BQUksZ0JBQUEsR0FBbUIsUUFBQSxDQUFFLElBQUYsQ0FBQTtBQUN2QixZQUFBO1FBQU0sQ0FBQSxHQUFJO1FBQ0osQ0FBQSxHQUFJLENBQUMsQ0FBQyxPQUFGLENBQVUsSUFBVixFQUFnQixPQUFoQjtRQUNKLENBQUEsR0FBSSxDQUFDLENBQUMsT0FBRixDQUFVLElBQVYsRUFBZ0IsTUFBaEI7UUFDSixDQUFBLEdBQUksQ0FBQyxDQUFDLE9BQUYsQ0FBVSxJQUFWLEVBQWdCLE1BQWhCO0FBQ0osZUFBTztNQUxVO0FBTW5CLGFBQU8sQ0FBRSxnQkFBRjtJQVBpQixDQVAxQjs7O0lBa0JBLG9CQUFBLEVBQXNCLFFBQUEsQ0FBQSxDQUFBO0FBRXhCLFVBQUEsY0FBQSxFQUFBLG1CQUFBLEVBQUEsVUFBQSxFQUFBLHVCQUFBLEVBQUEsY0FBQTs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OztNQXVDSSxjQUFBLEdB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IyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjXG4jXG4jPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT1cblZBUklPVVNfQlJJQ1MgPVxuXG4gICM9PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PVxuICAjIyMgTk9URSBGdXR1cmUgU2luZ2xlLUZpbGUgTW9kdWxlICMjI1xuICByZXF1aXJlX2xpc3RfdG9vbHM6IC0+XG4gICAgYXBwZW5kICAgID0gKCBsaXN0LCBQLi4uICkgLT4gbGlzdC5zcGxpY2UgbGlzdC5sZW5ndGgsIDAsIFAuLi5cbiAgICBpc19lbXB0eSAgPSAoIGxpc3QgKSAtPiBsaXN0Lmxlbmd0aCBpcyAwXG4gICAgcmV0dXJuIHsgYXBwZW5kLCBpc19lbXB0eSwgfVxuXG4gICM9PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PVxuICAjIyMgTk9URSBGdXR1cmUgU2luZ2xlLUZpbGUgTW9kdWxlICMjI1xuICByZXF1aXJlX2VzY2FwZV9odG1sX3RleHQ6IC0+XG4gICAgZXNjYXBlX2h0bWxfdGV4dCA9ICggdGV4dCApIC0+XG4gICAgICBSID0gdGV4dFxuICAgICAgUiA9IFIucmVwbGFjZSAvJi9nLCAnJmFtcDsnXG4gICAgICBSID0gUi5yZXBsYWNlIC88L2csICcmbHQ7J1xuICAgICAgUiA9IFIucmVwbGFjZSAvPi9nLCAnJmd0OydcbiAgICAgIHJldHVybiBSXG4gICAgcmV0dXJuIHsgZXNjYXBlX2h0bWxfdGV4dCwgfVxuXG4gICM9PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PVxuICAjIyMgTk9URSBGdXR1cmUgU2luZ2xlLUZpbGUgTW9kdWxlICMjI1xuICByZXF1aXJlX3RhZ2Z1bl90b29sczogLT5cblxuICAgICMgIyMjIEdpdmVuIHRoZSBhcmd1bWVudHMgb2YgZWl0aGVyIGEgdGFnZ2VkIHRlbXBsYXRlIGZ1bmN0aW9uIGNhbGwgKCd0YWdmdW4gY2FsbCcpIG9yIHRoZSBzaW5nbGVcbiAgICAjIGFyZ3VtZW50IG9mIGEgY29udmVudGlvbmFsIGZ1bmN0aW9uIGNhbGwsIGBnZXRfZmlyc3RfYXJndW1lbnQoKWAgd2lsbCByZXR1cm4gZWl0aGVyXG5cbiAgICAjICogdGhlIHJlc3VsdCBvZiBhcHBseWluZyBgYXNfdGV4dCgpYCB0byB0aGUgc29sZSBhcmd1bWVudCwgb3JcblxuICAgICMgKiB0aGUgcmVzdWx0IG9mIGNvbmNhdGVuYXRpbmcgdGhlIGNvbnN0YW50IHBhcnRzIGFuZCB0aGUgaW50ZXJwb2xhdGVkIGV4cHJlc3Npb25zLCB3aGljaCBlYWNoXG4gICAgIyBleHByZXNzaW9uIHJlcGxhY2VkIGJ5IHRoZSByZXN1bHQgb2YgYXBwbHlpbmcgYGFzX3RleHQoKWAgdG8gaXQuXG5cbiAgICAjIEFub3RoZXIgd2F5IHRvIGRlc2NyaWJlIHRoaXMgYmVoYXZpb3IgaXMgdG8gc2F5IHRoYXQgdGhpcyBmdW5jdGlvbiB0cmVhdHMgYSBjb252ZW50aW9uYWwgY2FsbCB3aXRoXG4gICAgIyBhIHNpbmdsZSBleHByZXNzaW9uIHRoZSBzYW1lIHdheSB0aGF0IGl0IHRyZWF0cyBhIGZ1bnRhZyBjYWxsIHdpdGggYSBzdHJpbmcgdGhhdCBjb250YWlucyBub3RoaW5nIGJ1dFxuICAgICMgdGhhdCBzYW1lIGV4cHJlc3Npb24sIHNvIHRoZSBpbnZhcmlhbnQgYCggZ2V0X2ZpcnN0X2FyZ3VtZW50IGV4cCApID09ICggZ2V0X2ZpcnN0X2FyZ3VtZW50XCIjeyBleHAgfVwiXG4gICAgIyApYCBob2xkcy5cblxuICAgICMgKiBpbnRlbmRlZCBmb3Igc3RyaW5nIHByb2R1Y2VycywgdGV4dCBwcm9jZXNzaW5nLCBtYXJrdXAgcHJvZHVjdGlvbjtcbiAgICAjICogbGlzdCBzb21lIGV4YW1wbGVzLiAjIyNcblxuICAgICMgIy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuICAgICMgY3JlYXRlX2dldF9maXJzdF9hcmd1bWVudF9mbiA9ICggYXNfdGV4dCA9IG51bGwgKSAtPlxuICAgICMgICBhc190ZXh0ID89ICggZXhwcmVzc2lvbiApIC0+IFwiI3tleHByZXNzaW9ufVwiXG4gICAgIyAgICMjIyBUQUlOVCB1c2UgcHJvcGVyIHZhbGlkYXRpb24gIyMjXG4gICAgIyAgIHVubGVzcyAoIHR5cGVvZiBhc190ZXh0ICkgaXMgJ2Z1bmN0aW9uJ1xuICAgICMgICAgIHRocm93IG5ldyBFcnJvciBcIs6paWRzcF9fXzEgZXhwZWN0ZWQgYSBmdW5jdGlvbiwgZ290ICN7cnByIGFzX3RleHR9XCJcbiAgICAjICAgIy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiAgICAjICAgZ2V0X2ZpcnN0X2FyZ3VtZW50ID0gKCBQLi4uICkgLT5cbiAgICAjICAgICB1bmxlc3MgaXNfdGFnZnVuX2NhbGwgUC4uLlxuICAgICMgICAgICAgdW5sZXNzIFAubGVuZ3RoIGlzIDFcbiAgICAjICAgICAgICAgdGhyb3cgbmV3IEVycm9yIFwizqlpZHNwX19fMiBleHBlY3RlZCAxIGFyZ3VtZW50LCBnb3QgI3tQLmxlbmd0aH1cIlxuICAgICMgICAgICAgcmV0dXJuIGFzX3RleHQgUFsgMCBdXG4gICAgIyAgICAgIy4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uXG4gICAgIyAgICAgWyBwYXJ0cywgZXhwcmVzc2lvbnMuLi4sIF0gPSBQXG4gICAgIyAgICAgUiA9IHBhcnRzWyAwIF1cbiAgICAjICAgICBmb3IgZXhwcmVzc2lvbiwgaWR4IGluIGV4cHJlc3Npb25zXG4gICAgIyAgICAgICBSICs9ICggYXNfdGV4dCBleHByZXNzaW9uICkgKyBwYXJ0c1sgaWR4ICsgMSBdXG4gICAgIyAgICAgcmV0dXJuIFJcbiAgICAjICAgIy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiAgICAjICAgZ2V0X2ZpcnN0X2FyZ3VtZW50LmNyZWF0ZSA9IGNyZWF0ZV9nZXRfZmlyc3RfYXJndW1lbnRfZm5cbiAgICAjICAgcmV0dXJuIGdldF9maXJzdF9hcmd1bWVudFxuXG4gICAgIy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuICAgIGlzX3RhZ2Z1bl9jYWxsID0gKCBQLi4uICkgLT5cbiAgICAgIHJldHVybiBmYWxzZSB1bmxlc3MgQXJyYXkuaXNBcnJheSAgIFBbIDAgXVxuICAgICAgcmV0dXJuIGZhbHNlIHVubGVzcyBPYmplY3QuaXNGcm96ZW4gUFsgMCBdXG4gICAgICByZXR1cm4gZmFsc2UgdW5sZXNzIFBbIDAgXS5yYXc/XG4gICAgICByZXR1cm4gdHJ1ZVxuXG4gICAgIy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuICAgIHdhbGtfcmF3X3BhcnRzID0gKCBjaHVua3MsIHZhbHVlcy4uLiApIC0+XG4gICAgICBjaHVua3MgICAgICA9ICggY2h1bmsgZm9yIGNodW5rIGluIGNodW5rcy5yYXcgKVxuICAgICAgY2h1bmtzLnJhdyAgPSBjaHVua3NbIC4uLiBdXG4gICAgICBPYmplY3QuZnJlZXplIGNodW5rc1xuICAgICAgeWllbGQgZnJvbSB3YWxrX3BhcnRzIGNodW5rcywgdmFsdWVzLi4uXG5cbiAgICAjLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4gICAgd2Fsa19wYXJ0cyA9ICggY2h1bmtzLCB2YWx1ZXMuLi4gKSAtPlxuICAgICAgdW5sZXNzIGlzX3RhZ2Z1bl9jYWxsIGNodW5rcywgdmFsdWVzLi4uXG4gICAgICAgIGlmIHZhbHVlcy5sZW5ndGggaXNudCAwXG4gICAgICAgICAgdGhyb3cgbmV3IEVycm9yIFwizqlfX18zIGV4cGVjdGVkIDEgYXJndW1lbnQgaW4gbm9uLXRlbXBsYXRlIGNhbGwsIGdvdCAje2FyZ3VtZW50cy5sZW5ndGh9XCJcbiAgICAgICAgaWYgdHlwZW9mIGNodW5rcyBpcyAnc3RyaW5nJyB0aGVuIFsgY2h1bmtzLCB2YWx1ZXMsIF0gPSBbIFsgY2h1bmtzLCBdLCBbXSwgICAgICAgICAgXVxuICAgICAgICBlbHNlICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgWyBjaHVua3MsIHZhbHVlcywgXSA9IFsgWyAnJywgJycsIF0sIFsgY2h1bmtzLCBdLCBdXG4gICAgICAjLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLlxuICAgICAgeWllbGQgeyBjaHVuazogY2h1bmtzWyAwIF0sIGlzYTogJ2NodW5rJywgfVxuICAgICAgZm9yIHZhbHVlLCBpZHggaW4gdmFsdWVzXG4gICAgICAgIHlpZWxkIHsgdmFsdWUsIGlzYTogJ3ZhbHVlJywgfVxuICAgICAgICB5aWVsZCB7IGNodW5rOiBjaHVua3NbIGlkeCArIDEgXSwgaXNhOiAnY2h1bmsnLCB9XG4gICAgICAjLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLlxuICAgICAgcmV0dXJuIG51bGxcblxuICAgICMtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiAgICB3YWxrX3Jhd19ub25lbXB0eV9wYXJ0cyA9ICggY2h1bmtzLCB2YWx1ZXMuLi4gKSAtPlxuICAgICAgZm9yIHBhcnQgZnJvbSB3YWxrX3Jhd19wYXJ0cyBjaHVua3MsIHZhbHVlcy4uLlxuICAgICAgICB5aWVsZCBwYXJ0IHVubGVzcyAoIHBhcnQuY2h1bmsgaXMgJycgKSBvciAoIHBhcnQudmFsdWUgaXMgJycgKVxuICAgICAgcmV0dXJuIG51bGxcblxuICAgICMtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiAgICB3YWxrX25vbmVtcHR5X3BhcnRzID0gKCBjaHVua3MsIHZhbHVlcy4uLiApIC0+XG4gICAgICBmb3IgcGFydCBmcm9tIHdhbGtfcGFydHMgY2h1bmtzLCB2YWx1ZXMuLi5cbiAgICAgICAgeWllbGQgcGFydCB1bmxlc3MgKCBwYXJ0LmNodW5rIGlzICcnICkgb3IgKCBwYXJ0LnZhbHVlIGlzICcnIClcbiAgICAgIHJldHVybiBudWxsXG5cbiAgICAjLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4gICAgIyByZXR1cm4gZG8gZXhwb3J0cyA9ICggZ2V0X2ZpcnN0X2FyZ3VtZW50ID0gY3JlYXRlX2dldF9maXJzdF9hcmd1bWVudF9mbigpICkgLT4ge1xuICAgICMgICBnZXRfZmlyc3RfYXJndW1lbnQsIGlzX3RhZ2Z1bl9jYWxsLFxuICAgICMgICB3YWxrX3BhcnRzLCB3YWxrX25vbmVtcHR5X3BhcnRzLCB3YWxrX3Jhd19wYXJ0cywgd2Fsa19yYXdfbm9uZW1wdHlfcGFydHMsIH1cbiAgICByZXR1cm4ge1xuICAgICAgaXNfdGFnZnVuX2NhbGwsXG4gICAgICB3YWxrX3BhcnRzLCAgICAgICAgICAgd2Fsa19yYXdfcGFydHMsXG4gICAgICB3YWxrX25vbmVtcHR5X3BhcnRzLCAgd2Fsa19yYXdfbm9uZW1wdHlfcGFydHMsIH1cblxuXG4gICM9PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PVxuICAjIyMgTk9URSBGdXR1cmUgU2luZ2xlLUZpbGUgTW9kdWxlICMjI1xuICByZXF1aXJlX21hbmFnZWRfcHJvcGVydHlfdG9vbHM6IC0+XG4gICAgc2V0X3JlYWRvbmx5ID0gKCBvYmplY3QsIG5hbWUsIHZhbHVlICkgLT4gT2JqZWN0LmRlZmluZVByb3BlcnR5IG9iamVjdCwgbmFtZSxcbiAgICAgICAgZW51bWVyYWJsZTogICB0cnVlXG4gICAgICAgIHdyaXRhYmxlOiAgICAgZmFsc2VcbiAgICAgICAgY29uZmlndXJhYmxlOiBmYWxzZVxuICAgICAgICB2YWx1ZTogICAgICAgIHZhbHVlXG4gICAgc2V0X2hpZGRlbl9yZWFkb25seSA9ICggb2JqZWN0LCBuYW1lLCB2YWx1ZSApIC0+IE9iamVjdC5kZWZpbmVQcm9wZXJ0eSBvYmplY3QsIG5hbWUsXG4gICAgICAgIGVudW1lcmFibGU6ICAgZmFsc2VcbiAgICAgICAgd3JpdGFibGU6ICAgICBmYWxzZVxuICAgICAgICBjb25maWd1cmFibGU6IGZhbHNlXG4gICAgICAgIHZhbHVlOiAgICAgICAgdmFsdWVcbiAgICAjIyMgVEFJTlQgc2hvdWxkIHVzZSBgT2JqZWN0LmRlZmluZVByb3BlcnR5KClgIGZvciBgc2V0X2dldHRlcigpYCAjIyNcbiAgICBzZXRfZ2V0dGVyID0gKCBvYmplY3QsIG5hbWUsIGdldCApIC0+IE9iamVjdC5kZWZpbmVQcm9wZXJ0aWVzIG9iamVjdCwgeyBbbmFtZV06IHsgZ2V0LCB9LCB9XG4gICAgaGlkZSA9ICggb2JqZWN0LCBuYW1lLCB2YWx1ZSApID0+IE9iamVjdC5kZWZpbmVQcm9wZXJ0eSBvYmplY3QsIG5hbWUsXG4gICAgICAgIGVudW1lcmFibGU6ICAgZmFsc2VcbiAgICAgICAgd3JpdGFibGU6ICAgICB0cnVlXG4gICAgICAgIGNvbmZpZ3VyYWJsZTogdHJ1ZVxuICAgICAgICB2YWx1ZTogICAgICAgIHZhbHVlXG5cbiAgICAjLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4gICAgcmV0dXJuIHsgc2V0X3JlYWRvbmx5LCBzZXRfaGlkZGVuX3JlYWRvbmx5LCBzZXRfZ2V0dGVyLCBoaWRlLCB9XG5cbiAgIz09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09XG4gICMjIyBOT1RFIEZ1dHVyZSBTaW5nbGUtRmlsZSBNb2R1bGUgIyMjXG4gIHJlcXVpcmVfbmFtZWl0OiAtPlxuICAgIG5hbWVpdCA9ICggbmFtZSwgZm4gKSAtPiBPYmplY3QuZGVmaW5lUHJvcGVydHkgZm4sICduYW1lJywgeyB2YWx1ZTogbmFtZSwgfTsgZm5cbiAgICAjLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4gICAgcmV0dXJuIHsgbmFtZWl0LCB9XG5cbiAgIz09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09XG4gICMjIyBOT1RFIEZ1dHVyZSBTaW5nbGUtRmlsZSBNb2R1bGUgIyMjXG4gIHJlcXVpcmVfc3RhY2tfY2xhc3NlczogLT5cbiAgICB7IHNldF9nZXR0ZXIsXG4gICAgICBoaWRlLCAgICAgICB9ID0gVkFSSU9VU19CUklDUy5yZXF1aXJlX21hbmFnZWRfcHJvcGVydHlfdG9vbHMoKVxuICAgIG1pc2ZpdCAgICAgICAgICA9IFN5bWJvbCAnbWlzZml0J1xuICAgIGNsYXNzIFhYWF9TdGFja19lcnJvciBleHRlbmRzIEVycm9yXG5cbiAgICAjPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT1cbiAgICBjbGFzcyBTdGFja1xuXG4gICAgICAjLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4gICAgICBjb25zdHJ1Y3RvcjogLT5cbiAgICAgICAgQGRhdGEgPSBbXVxuICAgICAgICByZXR1cm4gdW5kZWZpbmVkXG5cbiAgICAgICMtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiAgICAgIHRvU3RyaW5nOiAtPiBcIlsjeyAoIFwiI3tlfVwiIGZvciBlIGluIEBkYXRhICkuam9pbicuJyB9XVwiXG5cbiAgICAgICMtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiAgICAgIHNldF9nZXR0ZXIgQDo6LCAnbGVuZ3RoJywgICAtPiBAZGF0YS5sZW5ndGhcbiAgICAgIHNldF9nZXR0ZXIgQDo6LCAnaXNfZW1wdHknLCAtPiBAZGF0YS5sZW5ndGggaXMgMFxuICAgICAgY2xlYXI6IC0+IEBkYXRhLmxlbmd0aCA9IDA7IG51bGxcbiAgICAgIFtTeW1ib2wuaXRlcmF0b3JdOiAtPiB5aWVsZCBmcm9tIEBkYXRhXG5cbiAgICAgICMtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiAgICAgIHB1c2g6ICAgICAoIHggKSAtPiBAZGF0YS5wdXNoIHg7ICAgIG51bGxcbiAgICAgIHVuc2hpZnQ6ICAoIHggKSAtPiBAZGF0YS51bnNoaWZ0IHg7IG51bGxcblxuICAgICAgIy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuICAgICAgcG9wOiAoIGZhbGxiYWNrID0gbWlzZml0ICkgLT5cbiAgICAgICAgaWYgQGlzX2VtcHR5XG4gICAgICAgICAgcmV0dXJuIGZhbGxiYWNrIHVubGVzcyBmYWxsYmFjayBpcyBtaXNmaXRcbiAgICAgICAgICB0aHJvdyBuZXcgWFhYX1N0YWNrX2Vycm9yIFwizqlpZHNwX19fNCB1bmFibGUgdG8gcG9wIHZhbHVlIGZyb20gZW1wdHkgc3RhY2tcIlxuICAgICAgICByZXR1cm4gQGRhdGEucG9wKClcblxuICAgICAgIy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuICAgICAgc2hpZnQ6ICggZmFsbGJhY2sgPSBtaXNmaXQgKSAtPlxuICAgICAgICBpZiBAaXNfZW1wdHlcbiAgICAgICAgICByZXR1cm4gZmFsbGJhY2sgdW5sZXNzIGZhbGxiYWNrIGlzIG1pc2ZpdFxuICAgICAgICAgIHRocm93IG5ldyBYWFhfU3RhY2tfZXJyb3IgXCLOqWlkc3BfX181IHVuYWJsZSB0byBzaGlmdCB2YWx1ZSBmcm9tIGVtcHR5IHN0YWNrXCJcbiAgICAgICAgcmV0dXJuIEBkYXRhLnNoaWZ0KClcblxuICAgICAgIy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuICAgICAgcGVlazogKCBmYWxsYmFjayA9IG1pc2ZpdCApIC0+XG4gICAgICAgIGlmIEBpc19lbXB0eVxuICAgICAgICAgIHJldHVybiBmYWxsYmFjayB1bmxlc3MgZmFsbGJhY2sgaXMgbWlzZml0XG4gICAgICAgICAgdGhyb3cgbmV3IFhYWF9TdGFja19lcnJvciBcIs6paWRzcF9fXzYgdW5hYmxlIHRvIHBlZWsgdmFsdWUgb2YgZW1wdHkgc3RhY2tcIlxuICAgICAgICByZXR1cm4gQGRhdGEuYXQgLTFcblxuICAgICMtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuICAgIHJldHVybiB7IFN0YWNrLCB9XG5cbiAgIz09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09XG4gICMjIyBOT1RFIEZ1dHVyZSBTaW5nbGUtRmlsZSBNb2R1bGUgIyMjXG4gIHJlcXVpcmVfaW5maW5pcHJveHk6IC0+XG4gICAgIyMjXG5cbiAgICAjIyBUbyBEb1xuXG4gICAgKiAqKmBb4oCUXWAqKiBhbGxvdyB0byBzZXQgY29udGV4dCB0byBiZSB1c2VkIGJ5IGBhcHBseSgpYFxuICAgICogKipgW+KAlF1gKiogYWxsb3cgdG8gY2FsbCBgc3lzLnN0YWNrLmNsZWFyKClgIG1hbnVhbGx5IHdoZXJlIHNlZW4gZml0XG5cbiAgICAjIyNcbiAgICB7IGhpZGUsICAgICAgICAgICAgICAgfSA9IFZBUklPVVNfQlJJQ1MucmVxdWlyZV9tYW5hZ2VkX3Byb3BlcnR5X3Rvb2xzKClcbiAgICB7IFN0YWNrLCAgICAgICAgICAgICAgfSA9IFZBUklPVVNfQlJJQ1MucmVxdWlyZV9zdGFja19jbGFzc2VzKClcbiAgICAjIyMgVEFJTlQgaW4gdGhpcyBzaW11bGF0aW9uIG9mIHNpbmdsZS1maWxlIG1vZHVsZXMsIGEgbmV3IGRpc3RpbmN0IHN5bWJvbCBpcyBwcm9kdWNlZCB3aXRoIGVhY2ggY2FsbCB0b1xuICAgIGByZXF1aXJlX2luZmluaXByb3h5KClgICMjI1xuICAgIHN5c19zeW1ib2wgICAgICAgICAgICAgID0gU3ltYm9sICdzeXMnXG4gICAgIyBtaXNmaXQgICAgICAgICAgICAgICAgICA9IFN5bWJvbCAnbWlzZml0J1xuICAgIHRlbXBsYXRlICAgICAgICAgICAgICAgID1cbiAgICAgICMjIyBBbiBvYmplY3QgdGhhdCB3aWxsIGJlIGNoZWNrZWQgZm9yIGV4aXN0aW5nIHByb3BlcnRpZXMgdG8gcmV0dXJuOyB3aGVuIG5vIHByb3ZpZGVyIGlzIGdpdmVuIG9yIGFcbiAgICAgIHByb3ZpZGVyIGxhY2tzIGEgcmVxdWVzdGVkIHByb3BlcnR5LCBgc3lzLnN1Yl9sZXZlbF9wcm94eWAgd2lsbCBiZSByZXR1cm5lZCBmb3IgcHJvcGVydHkgYWNjZXNzZXM6ICMjI1xuICAgICAgcHJvdmlkZXI6ICAgICBPYmplY3QuY3JlYXRlIG51bGxcbiAgICAgICMjIyBBIGZ1bmN0aW9uIHRvIGJlIGNhbGxlZCB3aGVuIHRoZSBwcm94eSAoZWl0aGVyIGBzeXMudG9wX2xldmVsX3Byb3h5YCBvciBgc3lzLnN1Yl9sZXZlbF9wcm94eWApIGlzXG4gICAgICBjYWxsZWQ7IG5vdGljZSB0aGF0IGlmIHRoZSBgcHJvdmlkZXJgIHByb3ZpZGVzIGEgbWV0aG9kIGZvciBhIGdpdmVuIGtleSwgdGhhdCBtZXRob2Qgd2lsbCBiZSBjYWxsZWRcbiAgICAgIGluc3RlYWQgb2YgdGhlIGBjYWxsZWVgOiAjIyNcbiAgICAgIGNhbGxlZTogICAgICAgbnVsbFxuXG4gICAgIz09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PVxuICAgIGNyZWF0ZV9pbmZpbnlwcm94eSA9ICggY2ZnICkgLT5cbiAgICAgICMjIyBUQUlOVCB1c2UgcHJvcGVyIHR5cGVjaGVja2luZyAjIyNcbiAgICAgIGNmZyA9IHsgdGVtcGxhdGUuLi4sICBjZmcuLi4sIH1cbiAgICAgICMuLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uXG4gICAgICBuZXdfcHJveHkgPSAoeyBpc190b3BfbGV2ZWwsIH0pIC0+XG4gICAgICAgIGNhbGxlZV9jdHggID0gbnVsbFxuICAgICAgICBnZXRfY3R4ICAgICA9IC0+IGNhbGxlZV9jdHggPz0geyBpc190b3BfbGV2ZWwsIGNmZy4uLiwgc3lzLi4uLCB9XG4gICAgICAgICMuLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLlxuICAgICAgICBSID0gbmV3IFByb3h5IGNmZy5jYWxsZWUsXG5cbiAgICAgICAgICAjLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiAgICAgICAgICBhcHBseTogKCB0YXJnZXQsIGtleSwgUCApIC0+XG4gICAgICAgICAgICAjIHVyZ2UgJ86pYnJjc19fXzcnLCBcImFwcGx5ICN7cnByIHsgdGFyZ2V0LCBrZXksIFAsIGlzX3RvcF9sZXZlbCwgfX1cIlxuXG4gICAgICAgICAgICBSID0gUmVmbGVjdC5hcHBseSB0YXJnZXQsIGdldF9jdHgoKSwgUFxuICAgICAgICAgICAgc3lzLnN0YWNrLmNsZWFyKClcbiAgICAgICAgICAgIHJldHVybiBSXG5cbiAgICAgICAgICAjLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiAgICAgICAgICBnZXQ6ICggdGFyZ2V0LCBrZXkgKSAtPlxuICAgICAgICAgICAgIyB1cmdlICfOqWJyY3NfX184JywgXCJnZXQgI3tycHIgeyB0YXJnZXQsIGtleSwgfX1cIlxuICAgICAgICAgICAgcmV0dXJuIGdldF9jdHgoKSAgICAgICAgICAgICAgICAgICAgICBpZiBrZXkgaXMgc3lzX3N5bWJvbFxuICAgICAgICAgICAgcmV0dXJuIHRhcmdldFsga2V5IF0gICAgICAgICAgICAgICAgICBpZiAoIHR5cGVvZiBrZXkgKSBpcyAnc3ltYm9sJ1xuICAgICAgICAgICAgcmV0dXJuIFJlZmxlY3QuZ2V0IGNmZy5wcm92aWRlciwga2V5ICBpZiBSZWZsZWN0LmhhcyBjZmcucHJvdmlkZXIsIGtleVxuICAgICAgICAgICAgc3lzLnN0YWNrLmNsZWFyKCkgaWYgaXNfdG9wX2xldmVsXG4gICAgICAgICAgICBzeXMuc3RhY2sucHVzaCBrZXlcbiAgICAgICAgICAgICMgcmV0dXJuIFwiW3Jlc3VsdCBmb3IgZ2V0dGluZyBub24tcHJlc2V0IGtleSAje3JwciBrZXl9XSBmcm9tICN7cnByIHByb3ZpZGVyfVwiXG4gICAgICAgICAgICByZXR1cm4gc3lzLnN1Yl9sZXZlbF9wcm94eVxuICAgICAgICAjLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi5cbiAgICAgICAgcmV0dXJuIFJcbiAgICAgICMuLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uXG4gICAgICBzeXMgPSB7IHN0YWNrOiBuZXcgU3RhY2soKSwgfVxuICAgICAgc3lzLnRvcF9sZXZlbF9wcm94eSA9IG5ld19wcm94eSB7IGlzX3RvcF9sZXZlbDogdHJ1ZSwgIH1cbiAgICAgIHN5cy5zdWJfbGV2ZWxfcHJveHkgPSBuZXdfcHJveHkgeyBpc190b3BfbGV2ZWw6IGZhbHNlLCB9XG4gICAgICAjLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLlxuICAgICAgcmV0dXJuIHN5cy50b3BfbGV2ZWxfcHJveHlcblxuICAgICMtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiAgICByZXR1cm4geyBjcmVhdGVfaW5maW55cHJveHksIHN5c19zeW1ib2wsIH1cblxuXG4jPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT1cbk9iamVjdC5hc3NpZ24gbW9kdWxlLmV4cG9ydHMsIFZBUklPVVNfQlJJQ1NcblxuIl19
