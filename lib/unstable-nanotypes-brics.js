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
    require_nanotypes_v1: function() {
      var CFG, Type, Typespace, clean_assign, exports, freeze, hide, nameit, remap, rpr, set_getter;
      //=======================================================================================================
      ({freeze} = Object);
      ({clean_assign} = (require('./unstable-object-tools-brics')).require_clean_assign());
      ({hide, set_getter} = (require('./various-brics')).require_managed_property_tools());
      ({nameit} = (require('./various-brics')).require_nameit());
      ({remap} = (require('./unstable-object-tools-brics')).require_remap());
      ({
        show_no_colors: rpr
      } = (require('./unstable-rpr-type_of-brics')).require_show());
      // { type_of,              } = SFMODULES.unstable.require_type_of()
      CFG = Symbol.for('cfg');
      //=======================================================================================================
      Type = class Type {
        //-----------------------------------------------------------------------------------------------------
        constructor(typespace, name, isa) {
          hide(this, 'name', name);
          hide(this, 'T', typespace);
          hide(this, '_isa', isa);
          set_getter(this, CFG, () => {
            return this.T[CFG];
          });
          this.data = {}; // new Bounded_list()
          return void 0;
        }

        //-----------------------------------------------------------------------------------------------------
        isa(x, data = null, mapping = null) {
          var R;
          this.data = {};
          R = this._isa.call(this, x);
          //...................................................................................................
          if (data != null) {
            if (mapping != null) {
              clean_assign(data, remap(clean_assign({}, this.data), mapping));
            } else {
              /* d1 m1 */              clean_assign(data, this.data);
            }
          } else /* d1 m0 */if (mapping != null) {
            remap(this.data, mapping);
          }
/* d0 m1 */          return R/* d0 m0 */;
        }

        //-----------------------------------------------------------------------------------------------------
        validate(x, data = null, mapping = null) {
          if (this.isa(x, data, mapping)) {
            return x;
          }
          /* TAINT use better rpr() */
          throw new Error(`Ωbbnt___1 not a valid ${this.name}: ${x}`);
        }

        //-----------------------------------------------------------------------------------------------------
        assign(...P) {
          return clean_assign(this.data, ...P);
        }

        //-----------------------------------------------------------------------------------------------------
        fail(message, ...P) {
          clean_assign(this.data, {message}, ...P);
          return false;
        }

      };
      Typespace = (function() {
        //=======================================================================================================
        class Typespace {
          //=====================================================================================================
          constructor(cfg = null) {
            var Typeclass, clasz, i, isa, len, name, ref, ref1;
            clasz = this.constructor;
            this[CFG] = freeze(clean_assign({}, (ref = clasz[CFG]) != null ? ref : void 0, cfg != null ? cfg : void 0));
            ref1 = Object.getOwnPropertyNames(clasz);
            for (i = 0, len = ref1.length; i < len; i++) {
              name = ref1[i];
              Typeclass = class Typeclass extends Type {};
              nameit(name, Typeclass);
              this[name] = new Typeclass(this, name, isa = clasz[name]);
            }
            return void 0;
          }

        };

        //-----------------------------------------------------------------------------------------------------
        Typespace[CFG] = null;

        return Typespace;

      }).call(this);
      //=======================================================================================================
      return exports = {Type, Typespace, CFG};
    },
    //=========================================================================================================
    /* NOTE Future Single-File Module */
    require_nanotypes_v2: function() {
      var CFG, Type, Typespace, clean_assign, exports, freeze, hide, nameit, remap, rpr, set_getter;
      //=======================================================================================================
      ({freeze} = Object);
      ({clean_assign} = (require('./unstable-object-tools-brics')).require_clean_assign());
      ({hide, set_getter} = (require('./various-brics')).require_managed_property_tools());
      ({nameit} = (require('./various-brics')).require_nameit());
      ({remap} = (require('./unstable-object-tools-brics')).require_remap());
      ({
        show_no_colors: rpr
      } = (require('./unstable-rpr-type_of-brics')).require_show());
      // { type_of,              } = SFMODULES.unstable.require_type_of()
      CFG = Symbol.for('cfg');
      Type = (function() {
        //=======================================================================================================
        class Type {
          //-----------------------------------------------------------------------------------------------------
          constructor(typespace, name, isa) {
            hide(this, 'name', name);
            hide(this, 'T', typespace);
            hide(this, '_isa', isa);
            hide(this, 'inputs', {});
            set_getter(this, CFG, () => {
              return this.T[CFG];
            });
            this.data = {};
            return void 0;
          }

          //-----------------------------------------------------------------------------------------------------
          dm_isa(data, mapping, x, ...P) {
            /* Like `Type::isa()`, but capture data and optionally remap it */
            var R;
            R = this.isa(x, ...P);
            //...................................................................................................
            if (data != null) {
              if (mapping != null) {
                clean_assign(data, remap(clean_assign({}, this.data), mapping));
              } else {
                /* d1 m1 */                clean_assign(data, this.data);
              }
            } else /* d1 m0 */if (mapping != null) {
              remap(this.data, mapping);
            }
/* d0 m1 */            return R/* d0 m0 */;
          }

          //-----------------------------------------------------------------------------------------------------
          isa(x, ...P) {
            var R;
            this.data = {};
            this.inputs = {x, ...P};
            R = this._isa.call(this, x, ...P);
            return R;
          }

          // #-----------------------------------------------------------------------------------------------------
          // dm_validate: ( data, mapping, x, P... ) ->
          //   return x if @isa x, P...
          //   message   = "not a valid #{@full_name}: #{x}"
          //   message  += " – #{@data.message}" if @data.message?
          //   throw new Error message

            //-----------------------------------------------------------------------------------------------------
          _get_validation_failure_message(x) {
            var R;
            R = `(${this.full_name}) not a valid ${this.full_name}: ${x}`;
            if (this.data.message != null) {
              R += ` – ${this.data.message}`;
            }
            return R;
          }

          //-----------------------------------------------------------------------------------------------------
          dm_validate(data, mapping, x, ...P) {
            if (this.dm_isa(data, mapping, x, ...P)) {
              return x;
            }
            throw new Error(this._get_validation_failure_message(x));
          }

          //-----------------------------------------------------------------------------------------------------
          validate(x, ...P) {
            if (this.isa(x, ...P)) {
              return x;
            }
            throw new Error(this._get_validation_failure_message(x));
          }

          //-----------------------------------------------------------------------------------------------------
          assign(...P) {
            return clean_assign(this.data, ...P);
          }

          //-----------------------------------------------------------------------------------------------------
          fail(message, ...P) {
            clean_assign(this.data, {message}, ...P);
            return false;
          }

        };

        //-----------------------------------------------------------------------------------------------------
        set_getter(Type.prototype, 'full_name', function() {
          if (!(this.inputs[0] instanceof Type)) {
            return this.name;
          }
          return `${this.name} <${this.inputs[0].full_name}>`;
        });

        return Type;

      }).call(this);
      Typespace = (function() {
        //=======================================================================================================
        class Typespace {
          //=====================================================================================================
          constructor(cfg = null) {
            var Typeclass, clasz, i, isa, len, name, ref, ref1;
            clasz = this.constructor;
            this[CFG] = freeze(clean_assign({}, (ref = clasz[CFG]) != null ? ref : void 0, cfg != null ? cfg : void 0));
            ref1 = Object.getOwnPropertyNames(clasz);
            for (i = 0, len = ref1.length; i < len; i++) {
              name = ref1[i];
              Typeclass = class Typeclass extends Type {};
              nameit(name, Typeclass);
              this[name] = new Typeclass(this, name, isa = clasz[name]);
            }
            return void 0;
          }

        };

        //-----------------------------------------------------------------------------------------------------
        Typespace[CFG] = null;

        return Typespace;

      }).call(this);
      //=======================================================================================================
      return exports = {Type, Typespace, CFG};
    }
  };

  //===========================================================================================================
  BRICS.require_nanotypes = BRICS.require_nanotypes_v2;

  Object.assign(module.exports, BRICS);

}).call(this);

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vc3JjL3Vuc3RhYmxlLW5hbm90eXBlcy1icmljcy5jb2ZmZWUiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQ0E7RUFBQTtBQUFBLE1BQUEsS0FBQSxFQUFBLEtBQUE7OztFQUdBLENBQUEsQ0FBRSxLQUFGLENBQUEsR0FBYSxPQUFiLEVBSEE7Ozs7O0VBU0EsS0FBQSxHQUlFLENBQUE7OztJQUFBLG9CQUFBLEVBQXNCLFFBQUEsQ0FBQSxDQUFBO0FBRXhCLFVBQUEsR0FBQSxFQUFBLElBQUEsRUFBQSxTQUFBLEVBQUEsWUFBQSxFQUFBLE9BQUEsRUFBQSxNQUFBLEVBQUEsSUFBQSxFQUFBLE1BQUEsRUFBQSxLQUFBLEVBQUEsR0FBQSxFQUFBLFVBQUE7O01BQ0ksQ0FBQSxDQUFFLE1BQUYsQ0FBQSxHQUE0QixNQUE1QjtNQUNBLENBQUEsQ0FBRSxZQUFGLENBQUEsR0FBNEIsQ0FBRSxPQUFBLENBQVEsK0JBQVIsQ0FBRixDQUEyQyxDQUFDLG9CQUE1QyxDQUFBLENBQTVCO01BQ0EsQ0FBQSxDQUFFLElBQUYsRUFDRSxVQURGLENBQUEsR0FDNEIsQ0FBRSxPQUFBLENBQVEsaUJBQVIsQ0FBRixDQUE2QixDQUFDLDhCQUE5QixDQUFBLENBRDVCO01BRUEsQ0FBQSxDQUFFLE1BQUYsQ0FBQSxHQUE0QixDQUFFLE9BQUEsQ0FBUSxpQkFBUixDQUFGLENBQTZCLENBQUMsY0FBOUIsQ0FBQSxDQUE1QjtNQUNBLENBQUEsQ0FBRSxLQUFGLENBQUEsR0FBNEIsQ0FBRSxPQUFBLENBQVEsK0JBQVIsQ0FBRixDQUEyQyxDQUFDLGFBQTVDLENBQUEsQ0FBNUI7TUFDQSxDQUFBO1FBQUUsY0FBQSxFQUFnQjtNQUFsQixDQUFBLEdBQTRCLENBQUUsT0FBQSxDQUFRLDhCQUFSLENBQUYsQ0FBMEMsQ0FBQyxZQUEzQyxDQUFBLENBQTVCLEVBUEo7O01BU0ksR0FBQSxHQUE0QixNQUFNLENBQUMsR0FBUCxDQUFXLEtBQVgs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OztvQkFqRmQ7O0FBOEZJLGFBQU8sT0FBQSxHQUFVLENBQUUsSUFBRixFQUFRLFNBQVIsRUFBbUIsR0FBbkI7SUFoR0c7RUF2RXRCLEVBYkY7OztFQXlMQSxLQUFLLENBQUMsaUJBQU4sR0FBMEIsS0FBSyxDQUFDOztFQUNoQyxNQUFNLENBQUMsTUFBUCxDQUFjLE1BQU0sQ0FBQyxPQUFyQixFQUE4QixLQUE5QjtBQTFMQSIsInNvdXJjZXNDb250ZW50IjpbIlxuJ3VzZSBzdHJpY3QnXG5cbiM9PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PVxueyBkZWJ1ZywgfSA9IGNvbnNvbGVcblxuXG4jIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyNcbiNcbiM9PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PVxuQlJJQ1MgPVxuXG4gICM9PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT1cbiAgIyMjIE5PVEUgRnV0dXJlIFNpbmdsZS1GaWxlIE1vZHVsZSAjIyNcbiAgcmVxdWlyZV9uYW5vdHlwZXNfdjE6IC0+XG5cbiAgICAjPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PVxuICAgIHsgZnJlZXplLCAgICAgICAgICAgICAgIH0gPSBPYmplY3RcbiAgICB7IGNsZWFuX2Fzc2lnbiwgICAgICAgICB9ID0gKCByZXF1aXJlICcuL3Vuc3RhYmxlLW9iamVjdC10b29scy1icmljcycgKS5yZXF1aXJlX2NsZWFuX2Fzc2lnbigpXG4gICAgeyBoaWRlLFxuICAgICAgc2V0X2dldHRlciwgICAgICAgICAgIH0gPSAoIHJlcXVpcmUgJy4vdmFyaW91cy1icmljcycgKS5yZXF1aXJlX21hbmFnZWRfcHJvcGVydHlfdG9vbHMoKVxuICAgIHsgbmFtZWl0LCAgICAgICAgICAgICAgIH0gPSAoIHJlcXVpcmUgJy4vdmFyaW91cy1icmljcycgKS5yZXF1aXJlX25hbWVpdCgpXG4gICAgeyByZW1hcCwgICAgICAgICAgICAgICAgfSA9ICggcmVxdWlyZSAnLi91bnN0YWJsZS1vYmplY3QtdG9vbHMtYnJpY3MnICkucmVxdWlyZV9yZW1hcCgpXG4gICAgeyBzaG93X25vX2NvbG9yczogcnByLCAgfSA9ICggcmVxdWlyZSAnLi91bnN0YWJsZS1ycHItdHlwZV9vZi1icmljcycgKS5yZXF1aXJlX3Nob3coKVxuICAgICMgeyB0eXBlX29mLCAgICAgICAgICAgICAgfSA9IFNGTU9EVUxFUy51bnN0YWJsZS5yZXF1aXJlX3R5cGVfb2YoKVxuICAgIENGRyAgICAgICAgICAgICAgICAgICAgICAgPSBTeW1ib2wuZm9yICdjZmcnXG5cbiAgICAjPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PVxuICAgIGNsYXNzIFR5cGVcblxuICAgICAgIy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4gICAgICBjb25zdHJ1Y3RvcjogKCB0eXBlc3BhY2UsIG5hbWUsIGlzYSApIC0+XG4gICAgICAgIGhpZGUgQCwgJ25hbWUnLCAgICAgbmFtZVxuICAgICAgICBoaWRlIEAsICdUJywgICAgICAgIHR5cGVzcGFjZVxuICAgICAgICBoaWRlIEAsICdfaXNhJywgICAgIGlzYVxuICAgICAgICBzZXRfZ2V0dGVyIEAsIENGRywgID0+IEBUW0NGR11cbiAgICAgICAgQGRhdGEgICAgICAgICAgICAgPSB7fSAjIG5ldyBCb3VuZGVkX2xpc3QoKVxuICAgICAgICByZXR1cm4gdW5kZWZpbmVkXG5cbiAgICAgICMtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuICAgICAgaXNhOiAoIHgsIGRhdGEgPSBudWxsLCBtYXBwaW5nID0gbnVsbCApIC0+XG4gICAgICAgIEBkYXRhICAgPSB7fVxuICAgICAgICBSICAgICAgID0gQF9pc2EuY2FsbCBALCB4XG4gICAgICAgICMuLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi5cbiAgICAgICAgaWYgZGF0YT9cbiAgICAgICAgICBpZiBtYXBwaW5nPyAgICAgdGhlbiAgY2xlYW5fYXNzaWduIGRhdGEsICggcmVtYXAgKCBjbGVhbl9hc3NpZ24ge30sIEBkYXRhICksIG1hcHBpbmcgKSAgIyMjIGQxIG0xICMjI1xuICAgICAgICAgIGVsc2UgICAgICAgICAgICAgICAgICBjbGVhbl9hc3NpZ24gZGF0YSwgICAgICAgICAgICAgICAgICAgICAgICAgICAgQGRhdGEgICAgICAgICAgICAgICAjIyMgZDEgbTAgIyMjXG4gICAgICAgIGVsc2UgaWYgbWFwcGluZz8gIHRoZW4gICAgICAgICAgICAgICAgICAgICAgIHJlbWFwICAgICAgICAgICAgICAgICAgICBAZGF0YSwgICBtYXBwaW5nICAgICMjIyBkMCBtMSAjIyNcbiAgICAgICAgcmV0dXJuIFIgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIyMjIGQwIG0wICMjI1xuXG4gICAgICAjLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiAgICAgIHZhbGlkYXRlOiAoIHgsIGRhdGEgPSBudWxsLCBtYXBwaW5nID0gbnVsbCApIC0+XG4gICAgICAgIHJldHVybiB4IGlmIEBpc2EgeCwgZGF0YSwgbWFwcGluZ1xuICAgICAgICAjIyMgVEFJTlQgdXNlIGJldHRlciBycHIoKSAjIyNcbiAgICAgICAgdGhyb3cgbmV3IEVycm9yIFwizqliYm50X19fMSBub3QgYSB2YWxpZCAje0BuYW1lfTogI3t4fVwiXG5cbiAgICAgICMtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuICAgICAgYXNzaWduOiAoIFAuLi4gKSAtPiBjbGVhbl9hc3NpZ24gQGRhdGEsIFAuLi5cblxuICAgICAgIy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4gICAgICBmYWlsOiAoIG1lc3NhZ2UsIFAuLi4gKSAtPiBjbGVhbl9hc3NpZ24gQGRhdGEsIHsgbWVzc2FnZSwgfSwgUC4uLjsgZmFsc2VcblxuXG4gICAgIz09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT1cbiAgICBjbGFzcyBUeXBlc3BhY2VcblxuICAgICAgIy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4gICAgICBAW0NGR106IG51bGxcblxuICAgICAgIz09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09XG4gICAgICBjb25zdHJ1Y3RvcjogKCBjZmcgPSBudWxsICkgLT5cbiAgICAgICAgY2xhc3ogICA9IEBjb25zdHJ1Y3RvclxuICAgICAgICBAW0NGR10gID0gZnJlZXplIGNsZWFuX2Fzc2lnbiB7fSwgKCBjbGFzeltDRkddID8gdW5kZWZpbmVkICksICggY2ZnID8gdW5kZWZpbmVkIClcbiAgICAgICAgZm9yIG5hbWUgaW4gT2JqZWN0LmdldE93blByb3BlcnR5TmFtZXMgY2xhc3pcbiAgICAgICAgICBjbGFzcyBUeXBlY2xhc3MgZXh0ZW5kcyBUeXBlXG4gICAgICAgICAgbmFtZWl0IG5hbWUsIFR5cGVjbGFzc1xuICAgICAgICAgIEBbIG5hbWUgXSA9IG5ldyBUeXBlY2xhc3MgQCwgbmFtZSwgaXNhID0gY2xhc3pbIG5hbWUgXVxuICAgICAgICByZXR1cm4gdW5kZWZpbmVkXG5cbiAgICAjPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PVxuICAgIHJldHVybiBleHBvcnRzID0geyBUeXBlLCBUeXBlc3BhY2UsIENGRywgfVxuXG5cbiAgIz09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PVxuICAjIyMgTk9URSBGdXR1cmUgU2luZ2xlLUZpbGUgTW9kdWxlICMjI1xuICByZXF1aXJlX25hbm90eXBlc192MjogLT5cblxuICAgICM9PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09XG4gICAgeyBmcmVlemUsICAgICAgICAgICAgICAgfSA9IE9iamVjdFxuICAgIHsgY2xlYW5fYXNzaWduLCAgICAgICAgIH0gPSAoIHJlcXVpcmUgJy4vdW5zdGFibGUtb2JqZWN0LXRvb2xzLWJyaWNzJyApLnJlcXVpcmVfY2xlYW5fYXNzaWduKClcbiAgICB7IGhpZGUsXG4gICAgICBzZXRfZ2V0dGVyLCAgICAgICAgICAgfSA9ICggcmVxdWlyZSAnLi92YXJpb3VzLWJyaWNzJyApLnJlcXVpcmVfbWFuYWdlZF9wcm9wZXJ0eV90b29scygpXG4gICAgeyBuYW1laXQsICAgICAgICAgICAgICAgfSA9ICggcmVxdWlyZSAnLi92YXJpb3VzLWJyaWNzJyApLnJlcXVpcmVfbmFtZWl0KClcbiAgICB7IHJlbWFwLCAgICAgICAgICAgICAgICB9ID0gKCByZXF1aXJlICcuL3Vuc3RhYmxlLW9iamVjdC10b29scy1icmljcycgKS5yZXF1aXJlX3JlbWFwKClcbiAgICB7IHNob3dfbm9fY29sb3JzOiBycHIsICB9ID0gKCByZXF1aXJlICcuL3Vuc3RhYmxlLXJwci10eXBlX29mLWJyaWNzJyApLnJlcXVpcmVfc2hvdygpXG4gICAgIyB7IHR5cGVfb2YsICAgICAgICAgICAgICB9ID0gU0ZNT0RVTEVTLnVuc3RhYmxlLnJlcXVpcmVfdHlwZV9vZigpXG4gICAgQ0ZHICAgICAgICAgICAgICAgICAgICAgICA9IFN5bWJvbC5mb3IgJ2NmZydcblxuICAgICM9PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09XG4gICAgY2xhc3MgVHlwZVxuXG4gICAgICAjLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiAgICAgIGNvbnN0cnVjdG9yOiAoIHR5cGVzcGFjZSwgbmFtZSwgaXNhICkgLT5cbiAgICAgICAgaGlkZSBALCAnbmFtZScsICAgICAgIG5hbWVcbiAgICAgICAgaGlkZSBALCAnVCcsICAgICAgICAgIHR5cGVzcGFjZVxuICAgICAgICBoaWRlIEAsICdfaXNhJywgICAgICAgaXNhXG4gICAgICAgIGhpZGUgQCwgJ2lucHV0cycsICAgICB7fVxuICAgICAgICBzZXRfZ2V0dGVyIEAsIENGRywgID0+IEBUW0NGR11cbiAgICAgICAgQGRhdGEgICAgICAgICAgICAgPSB7fVxuICAgICAgICByZXR1cm4gdW5kZWZpbmVkXG5cbiAgICAgICMtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuICAgICAgc2V0X2dldHRlciBAOjosICdmdWxsX25hbWUnLCAtPlxuICAgICAgICByZXR1cm4gQG5hbWUgdW5sZXNzIEBpbnB1dHNbIDAgXSBpbnN0YW5jZW9mIFR5cGVcbiAgICAgICAgcmV0dXJuIFwiI3tAbmFtZX0gPCN7QGlucHV0c1sgMCBdLmZ1bGxfbmFtZX0+XCJcblxuICAgICAgIy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4gICAgICBkbV9pc2E6ICggZGF0YSwgbWFwcGluZywgeCwgUC4uLiApIC0+XG4gICAgICAgICMjIyBMaWtlIGBUeXBlOjppc2EoKWAsIGJ1dCBjYXB0dXJlIGRhdGEgYW5kIG9wdGlvbmFsbHkgcmVtYXAgaXQgIyMjXG4gICAgICAgIFIgPSBAaXNhIHgsIFAuLi5cbiAgICAgICAgIy4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLlxuICAgICAgICBpZiBkYXRhP1xuICAgICAgICAgIGlmIG1hcHBpbmc/ICAgICB0aGVuICBjbGVhbl9hc3NpZ24gZGF0YSwgKCByZW1hcCAoIGNsZWFuX2Fzc2lnbiB7fSwgQGRhdGEgKSwgbWFwcGluZyApICAjIyMgZDEgbTEgIyMjXG4gICAgICAgICAgZWxzZSAgICAgICAgICAgICAgICAgIGNsZWFuX2Fzc2lnbiBkYXRhLCAgICAgICAgICAgICAgICAgICAgICAgICAgICBAZGF0YSAgICAgICAgICAgICAgICMjIyBkMSBtMCAjIyNcbiAgICAgICAgZWxzZSBpZiBtYXBwaW5nPyAgdGhlbiAgICAgICAgICAgICAgICAgICAgICAgcmVtYXAgICAgICAgICAgICAgICAgICAgIEBkYXRhLCAgIG1hcHBpbmcgICAgIyMjIGQwIG0xICMjI1xuICAgICAgICByZXR1cm4gUiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAjIyMgZDAgbTAgIyMjXG5cbiAgICAgICMtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuICAgICAgaXNhOiAoIHgsIFAuLi4gKSAtPlxuICAgICAgICBAZGF0YSAgID0ge31cbiAgICAgICAgQGlucHV0cyA9IHsgeCwgUC4uLiwgfVxuICAgICAgICBSICAgICAgID0gQF9pc2EuY2FsbCBALCB4LCBQLi4uXG4gICAgICAgIHJldHVybiBSXG5cbiAgICAgICMgIy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4gICAgICAjIGRtX3ZhbGlkYXRlOiAoIGRhdGEsIG1hcHBpbmcsIHgsIFAuLi4gKSAtPlxuICAgICAgIyAgIHJldHVybiB4IGlmIEBpc2EgeCwgUC4uLlxuICAgICAgIyAgIG1lc3NhZ2UgICA9IFwibm90IGEgdmFsaWQgI3tAZnVsbF9uYW1lfTogI3t4fVwiXG4gICAgICAjICAgbWVzc2FnZSAgKz0gXCIg4oCTICN7QGRhdGEubWVzc2FnZX1cIiBpZiBAZGF0YS5tZXNzYWdlP1xuICAgICAgIyAgIHRocm93IG5ldyBFcnJvciBtZXNzYWdlXG5cbiAgICAgICMtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuICAgICAgX2dldF92YWxpZGF0aW9uX2ZhaWx1cmVfbWVzc2FnZTogKCB4ICkgLT5cbiAgICAgICAgUiAgID0gXCIoI3tAZnVsbF9uYW1lfSkgbm90IGEgdmFsaWQgI3tAZnVsbF9uYW1lfTogI3t4fVwiXG4gICAgICAgIFIgICs9IFwiIOKAkyAje0BkYXRhLm1lc3NhZ2V9XCIgaWYgQGRhdGEubWVzc2FnZT9cbiAgICAgICAgcmV0dXJuIFJcblxuICAgICAgIy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4gICAgICBkbV92YWxpZGF0ZTogKCBkYXRhLCBtYXBwaW5nLCAgeCwgUC4uLiApIC0+XG4gICAgICAgIHJldHVybiB4IGlmIEBkbV9pc2EgZGF0YSwgbWFwcGluZywgeCwgUC4uLlxuICAgICAgICB0aHJvdyBuZXcgRXJyb3IgQF9nZXRfdmFsaWRhdGlvbl9mYWlsdXJlX21lc3NhZ2UgeFxuXG4gICAgICAjLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiAgICAgIHZhbGlkYXRlOiAoIHgsIFAuLi4gKSAtPlxuICAgICAgICByZXR1cm4geCBpZiBAaXNhIHgsIFAuLi5cbiAgICAgICAgdGhyb3cgbmV3IEVycm9yIEBfZ2V0X3ZhbGlkYXRpb25fZmFpbHVyZV9tZXNzYWdlIHhcblxuICAgICAgIy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4gICAgICBhc3NpZ246ICggUC4uLiApIC0+IGNsZWFuX2Fzc2lnbiBAZGF0YSwgUC4uLlxuXG4gICAgICAjLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiAgICAgIGZhaWw6ICggbWVzc2FnZSwgUC4uLiApIC0+IGNsZWFuX2Fzc2lnbiBAZGF0YSwgeyBtZXNzYWdlLCB9LCBQLi4uOyBmYWxzZVxuXG5cbiAgICAjPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PVxuICAgIGNsYXNzIFR5cGVzcGFjZVxuXG4gICAgICAjLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiAgICAgIEBbQ0ZHXTogbnVsbFxuXG4gICAgICAjPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT1cbiAgICAgIGNvbnN0cnVjdG9yOiAoIGNmZyA9IG51bGwgKSAtPlxuICAgICAgICBjbGFzeiAgID0gQGNvbnN0cnVjdG9yXG4gICAgICAgIEBbQ0ZHXSAgPSBmcmVlemUgY2xlYW5fYXNzaWduIHt9LCAoIGNsYXN6W0NGR10gPyB1bmRlZmluZWQgKSwgKCBjZmcgPyB1bmRlZmluZWQgKVxuICAgICAgICBmb3IgbmFtZSBpbiBPYmplY3QuZ2V0T3duUHJvcGVydHlOYW1lcyBjbGFzelxuICAgICAgICAgIGNsYXNzIFR5cGVjbGFzcyBleHRlbmRzIFR5cGVcbiAgICAgICAgICBuYW1laXQgbmFtZSwgVHlwZWNsYXNzXG4gICAgICAgICAgQFsgbmFtZSBdID0gbmV3IFR5cGVjbGFzcyBALCBuYW1lLCBpc2EgPSBjbGFzelsgbmFtZSBdXG4gICAgICAgIHJldHVybiB1bmRlZmluZWRcblxuICAgICM9PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09XG4gICAgcmV0dXJuIGV4cG9ydHMgPSB7IFR5cGUsIFR5cGVzcGFjZSwgQ0ZHLCB9XG5cblxuXG4jPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT1cbkJSSUNTLnJlcXVpcmVfbmFub3R5cGVzID0gQlJJQ1MucmVxdWlyZV9uYW5vdHlwZXNfdjJcbk9iamVjdC5hc3NpZ24gbW9kdWxlLmV4cG9ydHMsIEJSSUNTXG4iXX0=
