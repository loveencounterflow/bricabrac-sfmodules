(function() {
  'use strict';
  var BRICS,
    modulo = function(a, b) { return (+a % (b = +b) + b) % b; },
    indexOf = [].indexOf;

  //###########################################################################################################

  //===========================================================================================================
  BRICS = {
    
    //===========================================================================================================
    /* NOTE Future Single-File Module */
    require_next_free_filename: function() {
      var FS, PATH, TMP_exhaustion_error, TMP_validation_error, cache_filename_re, cfg, errors, exists, exports, get_next_filename, get_next_free_filename, rpr;
      cfg = {
        max_retries: 9999,
        prefix: '~.',
        suffix: '.bricabrac-cache'
      };
      cache_filename_re = RegExp(`^(?:${RegExp.escape(cfg.prefix)})(?<first>.*)\\.(?<nr>[0-9]{4})(?:${RegExp.escape(cfg.suffix)})$`, "v");
      // cache_suffix_re = ///
      //   (?: #{RegExp.escape cfg.suffix} )
      //   $
      //   ///v
      rpr = function(x) {
        return `'${(typeof x) === 'string' ? x.replace(/'/g, "\\'") : void 0}'`;
        return `${x}`;
      };
      errors = {
        TMP_exhaustion_error: TMP_exhaustion_error = class TMP_exhaustion_error extends Error {},
        TMP_validation_error: TMP_validation_error = class TMP_validation_error extends Error {}
      };
      FS = require('node:fs');
      PATH = require('node:path');
      //.......................................................................................................
      exists = function(path) {
        var error;
        try {
          FS.statSync(path);
        } catch (error1) {
          error = error1;
          return false;
        }
        return true;
      };
      //.......................................................................................................
      get_next_filename = function(path) {
        var basename, dirname, first, match, nr;
        if ((typeof path) !== 'string') {
          /* TAINT use proper type checking */
          throw new errors.TMP_validation_error(`Ω___1 expected a text, got ${rpr(path)}`);
        }
        if (!(path.length > 0)) {
          throw new errors.TMP_validation_error(`Ω___2 expected a nonempty text, got ${rpr(path)}`);
        }
        dirname = PATH.dirname(path);
        basename = PATH.basename(path);
        if ((match = basename.match(cache_filename_re)) == null) {
          return PATH.join(dirname, `${cfg.prefix}${basename}.0001${cfg.suffix}`);
        }
        ({first, nr} = match.groups);
        nr = `${(parseInt(nr, 10)) + 1}`.padStart(4, '0');
        path = first;
        return PATH.join(dirname, `${cfg.prefix}${first}.${nr}${cfg.suffix}`);
      };
      //.......................................................................................................
      get_next_free_filename = function(path) {
        var R, failure_count;
        R = path;
        failure_count = -1;
        while (true) {
          //...................................................................................................
          //.....................................................................................................
          failure_count++;
          if (failure_count > cfg.max_retries) {
            throw new errors.TMP_exhaustion_error(`Ω___3 too many (${failure_count}) retries;  path ${rpr(R)} exists`);
          }
          //...................................................................................................
          R = get_next_filename(R);
          if (!exists(R)) {
            break;
          }
        }
        return R;
      };
      //.......................................................................................................
      // swap_suffix = ( path, suffix ) -> path.replace cache_suffix_re, suffix
      //.......................................................................................................
      return exports = {get_next_free_filename, get_next_filename, exists, cache_filename_re, errors};
    },
    //===========================================================================================================
    /* NOTE Future Single-File Module */
    require_command_line_tools: function() {
      var CP, exports, get_command_line_result, get_wc_max_line_length;
      CP = require('node:child_process');
      //-----------------------------------------------------------------------------------------------------------
      get_command_line_result = function(command, input) {
        return (CP.execSync(command, {
          encoding: 'utf-8',
          input
        })).replace(/\n$/s, '');
      };
      //-----------------------------------------------------------------------------------------------------------
      get_wc_max_line_length = function(text) {
        /* thx to https://unix.stackexchange.com/a/258551/280204 */
        return parseInt(get_command_line_result('wc --max-line-length', text), 10);
      };
      //.......................................................................................................
      return exports = {get_command_line_result, get_wc_max_line_length};
    },
    //===========================================================================================================
    /* NOTE Future Single-File Module */
    require_progress_indicators: function() {
      var C, bg, bg0, exports, fg, fg0, get_percentage_bar, hollow_percentage_bar;
      ({
        ansi_colors_and_effects: C
      } = (require('./ansi-brics')).require_ansi_colors_and_effects());
      fg = C.green;
      bg = C.bg_red;
      fg0 = C.default;
      bg0 = C.bg_default;
      //-----------------------------------------------------------------------------------------------------------
      get_percentage_bar = function(percentage) {
        /* 🮂🮃🮄🮅🮆 ▁▂▃▄▅▆▇█ ▉▊▋▌▍▎▏🮇🮈🮉🮊🮋 ▐ 🭰 🭱 🭲 🭳 🭴 🭵 🮀 🮁 🭶 🭷 🭸 🭹 🭺 🭻 🭽 🭾 🭼 🭿 */
        var R, percentage_rpr;
        percentage_rpr = (Math.round(percentage)).toString().padStart(3);
        if (percentage === null || percentage <= 0) {
          return `${percentage_rpr} %▕             ▏`;
        }
        if (percentage >= 100) {
          return `${percentage_rpr} %▕█████████████▏`;
        }
        percentage = Math.round(percentage / 100 * 104);
        R = '█'.repeat(Math.floor(percentage / 8));
        switch (modulo(percentage, 8)) {
          case 0:
            R += ' ';
            break;
          case 1:
            R += '▏';
            break;
          case 2:
            R += '▎';
            break;
          case 3:
            R += '▍';
            break;
          case 4:
            R += '▌';
            break;
          case 5:
            R += '▋';
            break;
          case 6:
            R += '▊';
            break;
          case 7:
            R += '▉';
        }
        return `${percentage_rpr} %▕${fg + bg}${R.padEnd(13)}${fg0 + bg0}▏`;
      };
      //-----------------------------------------------------------------------------------------------------------
      hollow_percentage_bar = function(n) {
        var R;
        if (n === null || n <= 0) {
          return '             ';
        }
        // if n >= 100             then return '░░░░░░░░░░░░░'
        if (n >= 100) {
          return '▓▓▓▓▓▓▓▓▓▓▓▓▓';
        }
        n = Math.round(n / 100 * 104);
        // R = '░'.repeat n // 8
        R = '▓'.repeat(Math.floor(n / 8));
        switch (modulo(n, 8)) {
          case 0:
            R += ' ';
            break;
          case 1:
            R += '▏';
            break;
          case 2:
            R += '▎';
            break;
          case 3:
            R += '▍';
            break;
          case 4:
            R += '▌';
            break;
          case 5:
            R += '▋';
            break;
          case 6:
            R += '▊';
            break;
          case 7:
            R += '▉';
        }
        // when 8 then R += '█'
        return R.padEnd(13);
      };
      //.......................................................................................................
      return exports = {get_percentage_bar};
    },
    //===========================================================================================================
    /* NOTE Future Single-File Module */
    require_format_stack: function() {
      /* TAINT make use of `FS` optional like `get_relative_path()` */
      var C, FS, Format_stack, dependency_c, exports, external_c, headline_c, hide, internal_c, internals, linkline_c, main_c, rpr, stack_line_re, strip_ansi, templates, type_of, unparsable_c;
      ({
        ansi_colors_and_effects: C
      } = (require('./ansi-brics')).require_ansi_colors_and_effects());
      ({strip_ansi} = (require('./ansi-brics')).require_strip_ansi());
      ({type_of} = (require('./unstable-rpr-type_of-brics')).require_type_of());
      ({hide} = (require('./various-brics')).require_managed_property_tools());
      ({
        show_no_colors: rpr
      } = (require('./main')).unstable.require_show());
      FS = require('node:fs');
      //=======================================================================================================
      main_c = {};
      main_c.reset = C.reset; // C.default + C.bg_default  + C.bold0
      main_c.folder_path = C.black + C.bg_lime + C.bold;
      main_c.file_name = C.wine + C.bg_lime + C.bold;
      main_c.callee = C.black + C.bg_lime + C.bold;
      main_c.line_nr = C.black + C.bg_blue + C.bold;
      main_c.column_nr = C.black + C.bg_blue + C.bold;
      main_c.context = C.lightslategray + C.bg_darkslatish;
      // main_c.context            = C.lightslategray  + C.bg_darkslategray
      main_c.hit = C.white + C.bg_darkslatish + C.bold;
      main_c.spot = C.yellow + C.bg_wine + C.bold;
      // main_c.hit                = C.white          + C.bg_forest + C.bold
      main_c.reference = C.lightslategray + C.bg_black;
      //.......................................................................................................
      external_c = Object.create(main_c);
      external_c.folder_path = C.black + C.bg_yellow + C.bold;
      external_c.file_name = C.wine + C.bg_yellow + C.bold;
      external_c.callee = C.black + C.bg_yellow + C.bold;
      //.......................................................................................................
      dependency_c = Object.create(main_c);
      dependency_c.folder_path = C.black + C.bg_orpiment + C.bold;
      dependency_c.file_name = C.wine + C.bg_orpiment + C.bold;
      dependency_c.callee = C.black + C.bg_orpiment + C.bold;
      //.......................................................................................................
      internal_c = Object.create(main_c);
      internal_c.folder_path = C.gray + C.bg_darkslatish;
      internal_c.file_name = C.gray + C.bg_darkslatish;
      internal_c.line_nr = C.gray + C.bg_darkslatish;
      internal_c.column_nr = C.gray + C.bg_darkslatish;
      internal_c.callee = C.gray + C.bg_darkslatish;
      //.......................................................................................................
      unparsable_c = {};
      unparsable_c.text = C.black + C.bg_violet + C.bold;
      unparsable_c.reset = main_c.reset;
      //.......................................................................................................
      headline_c = {};
      headline_c.headline = C.black + C.bg_red + C.bold;
      headline_c.reset = main_c.reset;
      //.......................................................................................................
      linkline_c = {};
      linkline_c.linkline = C.black + C.bg_turquoise + C.bold;
      linkline_c.reset = main_c.reset;
      //.......................................................................................................
      templates = {
        format_stack: {
          relative: true, // boolean to use CWD, or specify reference path
          context: 2,
          padding: {
            path: 90,
            callee: 60
          },
          color: {
            main: main_c,
            internal: internal_c,
            external: external_c,
            dependency: dependency_c,
            unparsable: unparsable_c,
            headline: headline_c,
            linkline: linkline_c
          }
        }
      };
      //-------------------------------------------------------------------------------------------------------
      stack_line_re = /^\s*at\s+(?:(?<callee>.*?)\s+\()?(?<path>(?<folder_path>.*?)(?<file_name>[^\/]+)):(?<line_nr>\d+):(?<column_nr>\d+)\)?$/;
      internals = Object.freeze({templates});
      //=======================================================================================================
      Format_stack = class Format_stack {
        //-----------------------------------------------------------------------------------------------------
        constructor(cfg) {
          var me;
          this.cfg = {...templates.format_stack, ...cfg};
          this.cfg.padding.line = this.cfg.padding.path + this.cfg.padding.callee;
          me = (...P) => {
            return this.format(...P);
          };
          Object.setPrototypeOf(me, this);
          hide(this, 'get_relative_path', (() => {
            var PATH, error;
            try {
              PATH = require('node:path');
            } catch (error1) {
              error = error1;
              return null;
            }
            return PATH.relative.bind(PATH);
          })());
          hide(this, 'state', {
            cache: new Map()
          });
          return me;
        }

        //-----------------------------------------------------------------------------------------------------
        format(error_or_stack) {
          /* TAINT use proper validation */
          var R, cause, error, headline, line, lines, ref, stack, type;
          switch (type = type_of(error_or_stack)) {
            case 'error':
              error = error_or_stack;
              cause = (ref = error.cause) != null ? ref : null;
              stack = error.stack;
              break;
            case 'text':
              error = null;
              cause = null;
              stack = error_or_stack;
              break;
            default:
              throw new Error(`Ω___6 expected an error or a text, got a ${type}`);
          }
          //...................................................................................................
          if ((lines = stack.split('\n')).length === 1) {
            R = this.format_line(line);
          } else {
            headline = this.format_headline(lines.shift(), error);
            lines = lines.reverse();
            lines = (function() {
              var i, len, results;
              results = [];
              for (i = 0, len = lines.length; i < len; i++) {
                line = lines[i];
                results.push(this.format_line(line));
              }
              return results;
            }).call(this);
            R = [headline, ...lines, headline].join('\n');
          }
          //...................................................................................................
          if (cause != null) {
            R = (this.format(cause)) + this.get_linkline() + R;
          }
          return R;
        }

        //-----------------------------------------------------------------------------------------------------
        parse_line(line) {
          /* TAINT use proper validation */
          var R, is_internal, match, reference, type;
          if ((type = type_of(line)) !== 'text') {
            throw new Error(`Ω___7 expected a text, got a ${type}`);
          }
          //...................................................................................................
          if ((indexOf.call(line, '\n') >= 0)) {
            throw new Error("Ω___8 expected a single line, got a text with line breaks");
          }
          if ((match = line.match(stack_line_re)) == null) {
            return {
              //...................................................................................................
              text: line,
              type: 'unparsable'
            };
          }
          //...................................................................................................
          R = {...match.groups};
          is_internal = R.path.startsWith('node:');
          if (R.callee == null) {
            R.callee = '[anonymous]';
          }
          R.line_nr = parseInt(R.line_nr, 10);
          R.column_nr = parseInt(R.column_nr, 10);
          //...................................................................................................
          if ((this.get_relative_path != null) && (!is_internal) && (this.cfg.relative !== false)) {
            reference = (this.cfg.relative === true) ? process.cwd() : this.cfg.relative;
            R.path = this.get_relative_path(reference, R.path);
            R.folder_path = (this.get_relative_path(reference, R.folder_path)) + '/';
          }
          // R.path        = './' + R.path        unless R.path[ 0 ]         in './'
          // R.folder_path = './' + R.folder_path unless R.folder_path[ 0 ]  in './'
          //...................................................................................................
          switch (true) {
            case is_internal:
              R.type = 'internal';
              break;
            case /\bnode_modules\//.test(R.path):
              R.type = 'dependency';
              break;
            case R.path.startsWith('../'):
              R.type = 'external';
              break;
            default:
              R.type = 'main';
          }
          return R;
        }

        //-----------------------------------------------------------------------------------------------------
        format_line(line) {
          var context, source_reference, stack_info;
          ({stack_info, source_reference} = this._format_source_reference(line));
          context = this.cfg.context === false ? [] : this._get_context(stack_info);
          return [source_reference, ...context].join('\n');
        }

        //-----------------------------------------------------------------------------------------------------
        format_headline(line, error = null) {
          var error_class, ref, theme;
          /* TAINT also show code, name where aprropriate */
          //   show_error_with_source_context error.cause, " Cause: #{error.cause.constructor.name}: #{error.cause.message} "
          theme = this.cfg.color.headline;
          error_class = (ref = error != null ? error.constructor.name : void 0) != null ? ref : '(no error class)';
          line = ` [${error_class}] ${line}`;
          line = line.padEnd(this.cfg.padding.line, ' ');
          return theme.headline + line + theme.reset;
        }

        //-----------------------------------------------------------------------------------------------------
        get_linkline() {
          var line, theme;
          theme = this.cfg.color.linkline;
          line = "  the below error was caused by the one above  △  △  △  ";
          line = line.padStart(this.cfg.padding.line, ' △ ');
          return '\n' + theme.linkline + line + theme.reset + '\n';
        }

        //-----------------------------------------------------------------------------------------------------
        _format_source_reference(line) {
          var callee, callee_length, column_nr, file_name, folder_path, line_nr, padding_callee, padding_path, path_length, source_reference, stack_info, theme;
          stack_info = this.parse_line(line);
          theme = this.cfg.color[stack_info.type];
          //...................................................................................................
          if (stack_info.type === 'unparsable') {
            source_reference = theme.text + stack_info.text + theme.reset;
            return {stack_info, source_reference};
          }
          //...................................................................................................
          folder_path = theme.folder_path + ' ' + stack_info.folder_path + '' + theme.reset;
          file_name = theme.file_name + '' + stack_info.file_name + ' ' + theme.reset;
          line_nr = theme.line_nr + ' (' + stack_info.line_nr + '' + theme.reset;
          column_nr = theme.column_nr + ':' + stack_info.column_nr + ') ' + theme.reset;
          callee = theme.callee + ' # ' + stack_info.callee + '() ' + theme.reset;
          //...................................................................................................
          path_length = (strip_ansi(folder_path + file_name + line_nr + column_nr)).length;
          callee_length = (strip_ansi(callee)).length;
          //...................................................................................................
          path_length = Math.max(0, this.cfg.padding.path - path_length);
          callee_length = Math.max(0, this.cfg.padding.callee - callee_length);
          //...................................................................................................
          padding_path = theme.folder_path + (' '.repeat(path_length)) + theme.reset;
          padding_callee = theme.callee + (' '.repeat(callee_length)) + theme.reset;
          //...................................................................................................
          source_reference = folder_path + file_name + line_nr + column_nr + padding_path + callee + padding_callee;
          return {stack_info, source_reference};
        }

        //-----------------------------------------------------------------------------------------------------
        _get_context(stack_info) {
          var R, before, behind, error, first_idx, hit_idx, i, idx, last_idx, line, ref, ref1, ref2, ref_width, reference, source, spot, theme, width;
          if (((ref = stack_info.type) === 'internal' || ref === 'unparsable') || (stack_info.path === '')) {
            return [];
          }
          try {
            source = FS.readFileSync(stack_info.path, {
              encoding: 'utf-8'
            });
          } catch (error1) {
            error = error1;
            if (error.code !== 'ENOENT') {
              throw error;
            }
            return [`unable to read file ${rpr(stack_info.path)}`];
          }
          //...................................................................................................
          theme = this.cfg.color[stack_info.type];
          ref_width = 7;
          width = this.cfg.padding.path + this.cfg.padding.callee - ref_width;
          source = source.split('\n');
          hit_idx = stack_info.line_nr - 1;
          // return source[ hit_idx ] if @cfg.context < 1
          //...................................................................................................
          first_idx = Math.max(hit_idx - this.cfg.context, 0);
          last_idx = Math.min(hit_idx + this.cfg.context, source.length - 1);
          R = [];
//...................................................................................................
          for (idx = i = ref1 = first_idx, ref2 = last_idx; (ref1 <= ref2 ? i <= ref2 : i >= ref2); idx = ref1 <= ref2 ? ++i : --i) {
            line = source[idx];
            reference = theme.reference + (`${idx + 1} `.padStart(ref_width, ' '));
            if (idx === hit_idx) {
              before = line.slice(0, stack_info.column_nr - 1);
              spot = line.slice(stack_info.column_nr - 1);
              behind = ' '.repeat(Math.max(0, width - line.length));
              R.push(reference + theme.hit + before + theme.spot + spot + theme.hit + behind + theme.reset);
            } else {
              line = line.padEnd(width, ' ');
              R.push(reference + theme.context + line + theme.reset);
            }
          }
          //...................................................................................................
          return R;
        }

      };
      //.......................................................................................................
      return exports = (() => {
        var format_stack;
        format_stack = new Format_stack();
        return {format_stack, Format_stack, internals};
      })();
    }
  };

  //===========================================================================================================
  Object.assign(module.exports, BRICS);

}).call(this);

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vc3JjL3Vuc3RhYmxlLWJyaWNzLmNvZmZlZSJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTtFQUFBO0FBQUEsTUFBQSxLQUFBO0lBQUE7d0JBQUE7Ozs7O0VBS0EsS0FBQSxHQUtFLENBQUE7Ozs7SUFBQSwwQkFBQSxFQUE0QixRQUFBLENBQUEsQ0FBQTtBQUM5QixVQUFBLEVBQUEsRUFBQSxJQUFBLEVBQUEsb0JBQUEsRUFBQSxvQkFBQSxFQUFBLGlCQUFBLEVBQUEsR0FBQSxFQUFBLE1BQUEsRUFBQSxNQUFBLEVBQUEsT0FBQSxFQUFBLGlCQUFBLEVBQUEsc0JBQUEsRUFBQTtNQUFJLEdBQUEsR0FDRTtRQUFBLFdBQUEsRUFBZ0IsSUFBaEI7UUFDQSxNQUFBLEVBQWdCLElBRGhCO1FBRUEsTUFBQSxFQUFnQjtNQUZoQjtNQUdGLGlCQUFBLEdBQW9CLE1BQUEsQ0FBQSxDQUFBLElBQUEsQ0FBQSxDQUVaLE1BQU0sQ0FBQyxNQUFQLENBQWMsR0FBRyxDQUFDLE1BQWxCLENBRlksQ0FBQSxrQ0FBQSxDQUFBLENBTVosTUFBTSxDQUFDLE1BQVAsQ0FBYyxHQUFHLENBQUMsTUFBbEIsQ0FOWSxDQUFBLEVBQUEsQ0FBQSxFQVFmLEdBUmUsRUFKeEI7Ozs7O01BaUJJLEdBQUEsR0FBb0IsUUFBQSxDQUFFLENBQUYsQ0FBQTtBQUNsQixlQUFPLENBQUEsQ0FBQSxDQUFBLENBQTZCLENBQUUsT0FBTyxDQUFULENBQUEsS0FBZ0IsUUFBekMsR0FBQSxDQUFDLENBQUMsT0FBRixDQUFVLElBQVYsRUFBZ0IsS0FBaEIsQ0FBQSxHQUFBLE1BQUosQ0FBQSxDQUFBO0FBQ1AsZUFBTyxDQUFBLENBQUEsQ0FBRyxDQUFILENBQUE7TUFGVztNQUdwQixNQUFBLEdBQ0U7UUFBQSxvQkFBQSxFQUE0Qix1QkFBTixNQUFBLHFCQUFBLFFBQW1DLE1BQW5DLENBQUEsQ0FBdEI7UUFDQSxvQkFBQSxFQUE0Qix1QkFBTixNQUFB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SUFBQSxHQUFZLElBQUksQ0FBQyxNQUFMLENBQVksS0FBWixFQUFtQixHQUFuQjtjQUNaLENBQUMsQ0FBQyxJQUFGLENBQU8sU0FBQSxHQUFZLEtBQUssQ0FBQyxPQUFsQixHQUE2QixJQUE3QixHQUFvQyxLQUFLLENBQUMsS0FBakQsRUFQRjs7VUFIRixDQWxCUjs7QUE4QlEsaUJBQU87UUEvQks7O01BM0hoQixFQXJGSjs7QUFrUEksYUFBTyxPQUFBLEdBQWEsQ0FBQSxDQUFBLENBQUEsR0FBQTtBQUN4QixZQUFBO1FBQU0sWUFBQSxHQUFlLElBQUksWUFBSixDQUFBO0FBQ2YsZUFBTyxDQUFFLFlBQUYsRUFBZ0IsWUFBaEIsRUFBOEIsU0FBOUI7TUFGVyxDQUFBO0lBblBBO0VBcEl0QixFQVZGOzs7RUF1WUEsTUFBTSxDQUFDLE1BQVAsQ0FBYyxNQUFNLENBQUMsT0FBckIsRUFBOEIsS0FBOUI7QUF2WUEiLCJzb3VyY2VzQ29udGVudCI6WyIndXNlIHN0cmljdCdcblxuIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjXG4jXG4jPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT1cbkJSSUNTID1cbiAgXG5cbiAgIz09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09XG4gICMjIyBOT1RFIEZ1dHVyZSBTaW5nbGUtRmlsZSBNb2R1bGUgIyMjXG4gIHJlcXVpcmVfbmV4dF9mcmVlX2ZpbGVuYW1lOiAtPlxuICAgIGNmZyA9XG4gICAgICBtYXhfcmV0cmllczogICAgOTk5OVxuICAgICAgcHJlZml4OiAgICAgICAgICd+LidcbiAgICAgIHN1ZmZpeDogICAgICAgICAnLmJyaWNhYnJhYy1jYWNoZSdcbiAgICBjYWNoZV9maWxlbmFtZV9yZSA9IC8vL1xuICAgICAgXlxuICAgICAgKD86ICN7UmVnRXhwLmVzY2FwZSBjZmcucHJlZml4fSApXG4gICAgICAoPzxmaXJzdD4uKilcbiAgICAgIFxcLlxuICAgICAgKD88bnI+WzAtOV17NH0pXG4gICAgICAoPzogI3tSZWdFeHAuZXNjYXBlIGNmZy5zdWZmaXh9IClcbiAgICAgICRcbiAgICAgIC8vL3ZcbiAgICAjIGNhY2hlX3N1ZmZpeF9yZSA9IC8vL1xuICAgICMgICAoPzogI3tSZWdFeHAuZXNjYXBlIGNmZy5zdWZmaXh9IClcbiAgICAjICAgJFxuICAgICMgICAvLy92XG4gICAgcnByICAgICAgICAgICAgICAgPSAoIHggKSAtPlxuICAgICAgcmV0dXJuIFwiJyN7eC5yZXBsYWNlIC8nL2csIFwiXFxcXCdcIiBpZiAoIHR5cGVvZiB4ICkgaXMgJ3N0cmluZyd9J1wiXG4gICAgICByZXR1cm4gXCIje3h9XCJcbiAgICBlcnJvcnMgPVxuICAgICAgVE1QX2V4aGF1c3Rpb25fZXJyb3I6IGNsYXNzIFRNUF9leGhhdXN0aW9uX2Vycm9yIGV4dGVuZHMgRXJyb3JcbiAgICAgIFRNUF92YWxpZGF0aW9uX2Vycm9yOiBjbGFzcyBUTVBfdmFsaWRhdGlvbl9lcnJvciBleHRlbmRzIEVycm9yXG4gICAgRlMgICAgICAgICAgICA9IHJlcXVpcmUgJ25vZGU6ZnMnXG4gICAgUEFUSCAgICAgICAgICA9IHJlcXVpcmUgJ25vZGU6cGF0aCdcbiAgICAjLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLlxuICAgIGV4aXN0cyA9ICggcGF0aCApIC0+XG4gICAgICB0cnkgRlMuc3RhdFN5bmMgcGF0aCBjYXRjaCBlcnJvciB0aGVuIHJldHVybiBmYWxzZVxuICAgICAgcmV0dXJuIHRydWVcbiAgICAjLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLlxuICAgIGdldF9uZXh0X2ZpbGVuYW1lID0gKCBwYXRoICkgLT5cbiAgICAgICMjIyBUQUlOVCB1c2UgcHJvcGVyIHR5cGUgY2hlY2tpbmcgIyMjXG4gICAgICB0aHJvdyBuZXcgZXJyb3JzLlRNUF92YWxpZGF0aW9uX2Vycm9yIFwizqlfX18xIGV4cGVjdGVkIGEgdGV4dCwgZ290ICN7cnByIHBhdGh9XCIgdW5sZXNzICggdHlwZW9mIHBhdGggKSBpcyAnc3RyaW5nJ1xuICAgICAgdGhyb3cgbmV3IGVycm9ycy5UTVBfdmFsaWRhdGlvbl9lcnJvciBcIs6pX19fMiBleHBlY3RlZCBhIG5vbmVtcHR5IHRleHQsIGdvdCAje3JwciBwYXRofVwiIHVubGVzcyBwYXRoLmxlbmd0aCA+IDBcbiAgICAgIGRpcm5hbWUgID0gUEFUSC5kaXJuYW1lIHBhdGhcbiAgICAgIGJhc2VuYW1lID0gUEFUSC5iYXNlbmFtZSBwYXRoXG4gICAgICB1bmxlc3MgKCBtYXRjaCA9IGJhc2VuYW1lLm1hdGNoIGNhY2hlX2ZpbGVuYW1lX3JlICk/XG4gICAgICAgIHJldHVybiBQQVRILmpvaW4gZGlybmFtZSwgXCIje2NmZy5wcmVmaXh9I3tiYXNlbmFtZX0uMDAwMSN7Y2ZnLnN1ZmZpeH1cIlxuICAgICAgeyBmaXJzdCwgbnIsICB9ID0gbWF0Y2guZ3JvdXBzXG4gICAgICBuciAgICAgICAgICAgICAgPSBcIiN7KCBwYXJzZUludCBuciwgMTAgKSArIDF9XCIucGFkU3RhcnQgNCwgJzAnXG4gICAgICBwYXRoICAgICAgICAgICAgPSBmaXJzdFxuICAgICAgcmV0dXJuIFBBVEguam9pbiBkaXJuYW1lLCBcIiN7Y2ZnLnByZWZpeH0je2ZpcnN0fS4je25yfSN7Y2ZnLnN1ZmZpeH1cIlxuICAgICMuLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uXG4gICAgZ2V0X25leHRfZnJlZV9maWxlbmFtZSA9ICggcGF0aCApIC0+XG4gICAgICBSICAgICAgICAgICAgID0gcGF0aFxuICAgICAgZmFpbHVyZV9jb3VudCA9IC0xXG4gICAgICAjLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi5cbiAgICAgIGxvb3BcbiAgICAgICAgIy4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLlxuICAgICAgICBmYWlsdXJlX2NvdW50KytcbiAgICAgICAgaWYgZmFpbHVyZV9jb3VudCA+IGNmZy5tYXhfcmV0cmllc1xuICAgICAgICAgICB0aHJvdyBuZXcgZXJyb3JzLlRNUF9leGhhdXN0aW9uX2Vycm9yIFwizqlfX18zIHRvbyBtYW55ICgje2ZhaWx1cmVfY291bnR9KSByZXRyaWVzOyAgcGF0aCAje3JwciBSfSBleGlzdHNcIlxuICAgICAgICAjLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uXG4gICAgICAgIFIgPSBnZXRfbmV4dF9maWxlbmFtZSBSXG4gICAgICAgIGJyZWFrIHVubGVzcyBleGlzdHMgUlxuICAgICAgcmV0dXJuIFJcbiAgICAjLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLlxuICAgICMgc3dhcF9zdWZmaXggPSAoIHBhdGgsIHN1ZmZpeCApIC0+IHBhdGgucmVwbGFjZSBjYWNoZV9zdWZmaXhfcmUsIHN1ZmZpeFxuICAgICMuLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uXG4gICAgcmV0dXJuIGV4cG9ydHMgPSB7IGdldF9uZXh0X2ZyZWVfZmlsZW5hbWUsIGdldF9uZXh0X2ZpbGVuYW1lLCBleGlzdHMsIGNhY2hlX2ZpbGVuYW1lX3JlLCBlcnJvcnMsIH1cblxuICAjPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT1cbiAgIyMjIE5PVEUgRnV0dXJlIFNpbmdsZS1GaWxlIE1vZHVsZSAjIyNcbiAgcmVxdWlyZV9jb21tYW5kX2xpbmVfdG9vbHM6IC0+XG4gICAgQ1AgPSByZXF1aXJlICdub2RlOmNoaWxkX3Byb2Nlc3MnXG4gICAgIy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4gICAgZ2V0X2NvbW1hbmRfbGluZV9yZXN1bHQgPSAoIGNvbW1hbmQsIGlucHV0ICkgLT5cbiAgICAgIHJldHVybiAoIENQLmV4ZWNTeW5jIGNvbW1hbmQsIHsgZW5jb2Rpbmc6ICd1dGYtOCcsIGlucHV0LCB9ICkucmVwbGFjZSAvXFxuJC9zLCAnJ1xuXG4gICAgIy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4gICAgZ2V0X3djX21heF9saW5lX2xlbmd0aCA9ICggdGV4dCApIC0+XG4gICAgICAjIyMgdGh4IHRvIGh0dHBzOi8vdW5peC5zdGFja2V4Y2hhbmdlLmNvbS9hLzI1ODU1MS8yODAyMDQgIyMjXG4gICAgICByZXR1cm4gcGFyc2VJbnQgKCBnZXRfY29tbWFuZF9saW5lX3Jlc3VsdCAnd2MgLS1tYXgtbGluZS1sZW5ndGgnLCB0ZXh0ICksIDEwXG5cbiAgICAjLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLlxuICAgIHJldHVybiBleHBvcnRzID0geyBnZXRfY29tbWFuZF9saW5lX3Jlc3VsdCwgZ2V0X3djX21heF9saW5lX2xlbmd0aCwgfVxuXG5cbiAgIz09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09XG4gICMjIyBOT1RFIEZ1dHVyZSBTaW5nbGUtRmlsZSBNb2R1bGUgIyMjXG4gIHJlcXVpcmVfcHJvZ3Jlc3NfaW5kaWNhdG9yczogLT5cbiAgICB7IGFuc2lfY29sb3JzX2FuZF9lZmZlY3RzOiBDLCB9ID0gKCByZXF1aXJlICcuL2Fuc2ktYnJpY3MnICkucmVxdWlyZV9hbnNpX2NvbG9yc19hbmRfZWZmZWN0cygpXG4gICAgZmcgID0gQy5ncmVlblxuICAgIGJnICA9IEMuYmdfcmVkXG4gICAgZmcwID0gQy5kZWZhdWx0XG4gICAgYmcwID0gQy5iZ19kZWZhdWx0XG5cbiAgICAjLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiAgICBnZXRfcGVyY2VudGFnZV9iYXIgPSAoIHBlcmNlbnRhZ2UgKSAtPlxuICAgICAgIyMjIPCfroLwn66D8J+uhPCfroXwn66GIOKWgeKWguKWg+KWhOKWheKWhuKWh+KWiCDilonilorilovilozilo3ilo7ilo/wn66H8J+uiPCfronwn66K8J+uiyDilpAg8J+tsCDwn62xIPCfrbIg8J+tsyDwn620IPCfrbUg8J+ugCDwn66BIPCfrbYg8J+ttyDwn624IPCfrbkg8J+tuiDwn627IPCfrb0g8J+tviDwn628IPCfrb8gIyMjXG4gICAgICBwZXJjZW50YWdlX3JwciAgPSAoIE1hdGgucm91bmQgcGVyY2VudGFnZSApLnRvU3RyaW5nKCkucGFkU3RhcnQgM1xuICAgICAgaWYgcGVyY2VudGFnZSBpcyBudWxsIG9yIHBlcmNlbnRhZ2UgPD0gMCAgdGhlbiByZXR1cm4gXCIje3BlcmNlbnRhZ2VfcnByfSAl4paVICAgICAgICAgICAgIOKWj1wiXG4gICAgICBpZiBwZXJjZW50YWdlID49IDEwMCAgICAgICAgICAgICAgICAgICAgICB0aGVuIHJldHVybiBcIiN7cGVyY2VudGFnZV9ycHJ9ICXilpXilojilojilojilojilojilojilojilojilojilojilojilojilojilo9cIlxuICAgICAgcGVyY2VudGFnZSAgICAgID0gKCBNYXRoLnJvdW5kIHBlcmNlbnRhZ2UgLyAxMDAgKiAxMDQgKVxuICAgICAgUiAgICAgICAgICAgICAgID0gJ+KWiCcucmVwZWF0IHBlcmNlbnRhZ2UgLy8gOFxuICAgICAgc3dpdGNoIHBlcmNlbnRhZ2UgJSUgOFxuICAgICAgICB3aGVuIDAgdGhlbiBSICs9ICcgJ1xuICAgICAgICB3aGVuIDEgdGhlbiBSICs9ICfilo8nXG4gICAgICAgIHdoZW4gMiB0aGVuIFIgKz0gJ+KWjidcbiAgICAgICAgd2hlbiAzIHRoZW4gUiArPSAn4paNJ1xuICAgICAgICB3aGVuIDQgdGhlbiBSICs9ICfilownXG4gICAgICAgIHdoZW4gNSB0aGVuIFIgKz0gJ+KWiydcbiAgICAgICAgd2hlbiA2IHRoZW4gUiArPSAn4paKJ1xuICAgICAgICB3aGVuIDcgdGhlbiBSICs9ICfiloknXG4gICAgICByZXR1cm4gXCIje3BlcmNlbnRhZ2VfcnByfSAl4paVI3tmZytiZ30je1IucGFkRW5kIDEzfSN7ZmcwK2JnMH3ilo9cIlxuXG4gICAgIy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4gICAgaG9sbG93X3BlcmNlbnRhZ2VfYmFyID0gKCBuICkgLT5cbiAgICAgIGlmIG4gaXMgbnVsbCBvciBuIDw9IDAgIHRoZW4gcmV0dXJuICcgICAgICAgICAgICAgJ1xuICAgICAgIyBpZiBuID49IDEwMCAgICAgICAgICAgICB0aGVuIHJldHVybiAn4paR4paR4paR4paR4paR4paR4paR4paR4paR4paR4paR4paR4paRJ1xuICAgICAgaWYgbiA+PSAxMDAgICAgICAgICAgICAgdGhlbiByZXR1cm4gJ+KWk+KWk+KWk+KWk+KWk+KWk+KWk+KWk+KWk+KWk+KWk+KWk+KWkydcbiAgICAgIG4gPSAoIE1hdGgucm91bmQgbiAvIDEwMCAqIDEwNCApXG4gICAgICAjIFIgPSAn4paRJy5yZXBlYXQgbiAvLyA4XG4gICAgICBSID0gJ+KWkycucmVwZWF0IG4gLy8gOFxuICAgICAgc3dpdGNoIG4gJSUgOFxuICAgICAgICB3aGVuIDAgdGhlbiBSICs9ICcgJ1xuICAgICAgICB3aGVuIDEgdGhlbiBSICs9ICfilo8nXG4gICAgICAgIHdoZW4gMiB0aGVuIFIgKz0gJ+KWjidcbiAgICAgICAgd2hlbiAzIHRoZW4gUiArPSAn4paNJ1xuICAgICAgICB3aGVuIDQgdGhlbiBSICs9ICfilownXG4gICAgICAgIHdoZW4gNSB0aGVuIFIgKz0gJ+KWiydcbiAgICAgICAgd2hlbiA2IHRoZW4gUiArPSAn4paKJ1xuICAgICAgICB3aGVuIDcgdGhlbiBSICs9ICfiloknXG4gICAgICAgICMgd2hlbiA4IHRoZW4gUiArPSAn4paIJ1xuICAgICAgcmV0dXJuIFIucGFkRW5kIDEzXG5cbiAgICAjLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLlxuICAgIHJldHVybiBleHBvcnRzID0geyBnZXRfcGVyY2VudGFnZV9iYXIsIH1cblxuICAjPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT1cbiAgIyMjIE5PVEUgRnV0dXJlIFNpbmdsZS1GaWxlIE1vZHVsZSAjIyNcbiAgcmVxdWlyZV9mb3JtYXRfc3RhY2s6IC0+XG4gICAgeyBhbnNpX2NvbG9yc19hbmRfZWZmZWN0czogQywgfSA9ICggcmVxdWlyZSAnLi9hbnNpLWJyaWNzJyApLnJlcXVpcmVfYW5zaV9jb2xvcnNfYW5kX2VmZmVjdHMoKVxuICAgIHsgc3RyaXBfYW5zaSwgICAgICAgICAgICAgICAgIH0gPSAoIHJlcXVpcmUgJy4vYW5zaS1icmljcycgKS5yZXF1aXJlX3N0cmlwX2Fuc2koKVxuICAgIHsgdHlwZV9vZiwgICAgICAgICAgICAgICAgICAgIH0gPSAoIHJlcXVpcmUgJy4vdW5zdGFibGUtcnByLXR5cGVfb2YtYnJpY3MnICkucmVxdWlyZV90eXBlX29mKClcbiAgICB7IGhpZGUsICAgICAgICAgICAgICAgICAgICAgICB9ID0gKCByZXF1aXJlICcuL3ZhcmlvdXMtYnJpY3MnICkucmVxdWlyZV9tYW5hZ2VkX3Byb3BlcnR5X3Rvb2xzKClcbiAgICB7IHNob3dfbm9fY29sb3JzOiBycHIsICAgICAgICB9ID0gKCByZXF1aXJlICcuL21haW4nICkudW5zdGFibGUucmVxdWlyZV9zaG93KClcbiAgICAjIyMgVEFJTlQgbWFrZSB1c2Ugb2YgYEZTYCBvcHRpb25hbCBsaWtlIGBnZXRfcmVsYXRpdmVfcGF0aCgpYCAjIyNcbiAgICBGUyAgICAgICAgICAgICAgICAgICAgICAgICAgICAgID0gcmVxdWlyZSAnbm9kZTpmcydcblxuICAgICM9PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09XG4gICAgbWFpbl9jICAgICAgICAgICAgICAgICAgICA9IHt9XG4gICAgbWFpbl9jLnJlc2V0ICAgICAgICAgICAgICA9IEMucmVzZXQgIyBDLmRlZmF1bHQgKyBDLmJnX2RlZmF1bHQgICsgQy5ib2xkMFxuICAgIG1haW5fYy5mb2xkZXJfcGF0aCAgICAgICAgPSBDLmJsYWNrICAgKyBDLmJnX2xpbWUgICAgICsgQy5ib2xkXG4gICAgbWFpbl9jLmZpbGVfbmFtZSAgICAgICAgICA9IEMud2luZSAgICArIEMuYmdfbGltZSAgICAgKyBDLmJvbGRcbiAgICBtYWluX2MuY2FsbGVlICAgICAgICAgICAgID0gQy5ibGFjayAgICsgQy5iZ19saW1lICAgICArIEMuYm9sZFxuICAgIG1haW5fYy5saW5lX25yICAgICAgICAgICAgPSBDLmJsYWNrICAgKyBDLmJnX2JsdWUgICAgICsgQy5ib2xkXG4gICAgbWFpbl9jLmNvbHVtbl9uciAgICAgICAgICA9IEMuYmxhY2sgICArIEMuYmdfYmx1ZSAgICAgKyBDLmJvbGRcbiAgICBtYWluX2MuY29udGV4dCAgICAgICAgICAgID0gQy5saWdodHNsYXRlZ3JheSAgKyBDLmJnX2RhcmtzbGF0aXNoXG4gICAgIyBtYWluX2MuY29udGV4dCAgICAgICAgICAgID0gQy5saWdodHNsYXRlZ3JheSAgKyBDLmJnX2RhcmtzbGF0ZWdyYXlcbiAgICBtYWluX2MuaGl0ICAgICAgICAgICAgICAgID0gQy53aGl0ZSAgICAgICAgICAgKyBDLmJnX2RhcmtzbGF0aXNoICsgQy5ib2xkXG4gICAgbWFpbl9jLnNwb3QgICAgICAgICAgICAgICA9IEMueWVsbG93ICAgICAgICAgICAgICsgQy5iZ193aW5lICsgQy5ib2xkXG4gICAgIyBtYWluX2MuaGl0ICAgICAgICAgICAgICAgID0gQy53aGl0ZSAgICAgICAgICArIEMuYmdfZm9yZXN0ICsgQy5ib2xkXG4gICAgbWFpbl9jLnJlZmVyZW5jZSAgICAgICAgICA9IEMubGlnaHRzbGF0ZWdyYXkgICsgQy5iZ19ibGFja1xuICAgICMuLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uXG4gICAgZXh0ZXJuYWxfYyAgICAgICAgICAgICAgICA9IE9iamVjdC5jcmVhdGUgbWFpbl9jXG4gICAgZXh0ZXJuYWxfYy5mb2xkZXJfcGF0aCAgICA9IEMuYmxhY2sgICArIEMuYmdfeWVsbG93ICAgKyBDLmJvbGRcbiAgICBleHRlcm5hbF9jLmZpbGVfbmFtZSAgICAgID0gQy53aW5lICAgICsgQy5iZ195ZWxsb3cgICArIEMuYm9sZFxuICAgIGV4dGVybmFsX2MuY2FsbGVlICAgICAgICAgPSBDLmJsYWNrICAgKyBDLmJnX3llbGxvdyAgICsgQy5ib2xkXG4gICAgIy4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi5cbiAgICBkZXBlbmRlbmN5X2MgICAgICAgICAgICAgID0gT2JqZWN0LmNyZWF0ZSBtYWluX2NcbiAgICBkZXBlbmRlbmN5X2MuZm9sZGVyX3BhdGggID0gQy5ibGFjayAgICsgQy5iZ19vcnBpbWVudCArIEMuYm9sZFxuICAgIGRlcGVuZGVuY3lfYy5maWxlX25hbWUgICAgPSBDLndpbmUgICAgKyBDLmJnX29ycGltZW50ICsgQy5ib2xkXG4gICAgZGVwZW5kZW5jeV9jLmNhbGxlZSAgICAgICA9IEMuYmxhY2sgICArIEMuYmdfb3JwaW1lbnQgKyBDLmJvbGRcbiAgICAjLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLlxuICAgIGludGVybmFsX2MgICAgICAgICAgICAgICAgPSBPYmplY3QuY3JlYXRlIG1haW5fY1xuICAgIGludGVybmFsX2MuZm9sZGVyX3BhdGggICAgPSBDLmdyYXkgICAgKyBDLmJnX2RhcmtzbGF0aXNoXG4gICAgaW50ZXJuYWxfYy5maWxlX25hbWUgICAgICA9IEMuZ3JheSAgICArIEMuYmdfZGFya3NsYXRpc2hcbiAgICBpbnRlcm5hbF9jLmxpbmVfbnIgICAgICAgID0gQy5ncmF5ICAgICsgQy5iZ19kYXJrc2xhdGlzaFxuICAgIGludGVybmFsX2MuY29sdW1uX25yICAgICAgPSBDLmdyYXkgICAgKyBDLmJnX2RhcmtzbGF0aXNoXG4gICAgaW50ZXJuYWxfYy5jYWxsZWUgICAgICAgICA9IEMuZ3JheSAgICArIEMuYmdfZGFya3NsYXRpc2hcbiAgICAjLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLlxuICAgIHVucGFyc2FibGVfYyAgICAgICAgICAgICAgPSB7fVxuICAgIHVucGFyc2FibGVfYy50ZXh0ICAgICAgICAgPSBDLmJsYWNrICAgKyBDLmJnX3Zpb2xldCAgICAgICsgQy5ib2xkXG4gICAgdW5wYXJzYWJsZV9jLnJlc2V0ICAgICAgICA9IG1haW5fYy5yZXNldFxuICAgICMuLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uXG4gICAgaGVhZGxpbmVfYyAgICAgICAgICAgICAgICA9IHt9XG4gICAgaGVhZGxpbmVfYy5oZWFkbGluZSAgICAgICA9IEMuYmxhY2sgICArIEMuYmdfcmVkICAgICAgKyBDLmJvbGRcbiAgICBoZWFkbGluZV9jLnJlc2V0ICAgICAgICAgID0gbWFpbl9jLnJlc2V0XG4gICAgIy4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi5cbiAgICBsaW5rbGluZV9jICAgICAgICAgICAgICAgID0ge31cbiAgICBsaW5rbGluZV9jLmxpbmtsaW5lICAgICAgID0gQy5ibGFjayAgICsgQy5iZ190dXJxdW9pc2UgICAgICArIEMuYm9sZFxuICAgIGxpbmtsaW5lX2MucmVzZXQgICAgICAgICAgPSBtYWluX2MucmVzZXRcbiAgICAjLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLlxuICAgIHRlbXBsYXRlcyA9XG4gICAgICBmb3JtYXRfc3RhY2s6XG4gICAgICAgIHJlbGF0aXZlOiAgICAgICB0cnVlICMgYm9vbGVhbiB0byB1c2UgQ1dELCBvciBzcGVjaWZ5IHJlZmVyZW5jZSBwYXRoXG4gICAgICAgIGNvbnRleHQ6ICAgICAgICAyXG4gICAgICAgIHBhZGRpbmc6XG4gICAgICAgICAgcGF0aDogICAgICAgICAgIDkwXG4gICAgICAgICAgY2FsbGVlOiAgICAgICAgIDYwXG4gICAgICAgIGNvbG9yOlxuICAgICAgICAgIG1haW46ICAgICAgICAgICBtYWluX2NcbiAgICAgICAgICBpbnRlcm5hbDogICAgICAgaW50ZXJuYWxfY1xuICAgICAgICAgIGV4dGVybmFsOiAgICAgICBleHRlcm5hbF9jXG4gICAgICAgICAgZGVwZW5kZW5jeTogICAgIGRlcGVuZGVuY3lfY1xuICAgICAgICAgIHVucGFyc2FibGU6ICAgICB1bnBhcnNhYmxlX2NcbiAgICAgICAgICBoZWFkbGluZTogICAgICAgaGVhZGxpbmVfY1xuICAgICAgICAgIGxpbmtsaW5lOiAgICAgICBsaW5rbGluZV9jXG5cbiAgICAjLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuICAgIHN0YWNrX2xpbmVfcmUgPSAvLy8gXlxuICAgICAgXFxzKiBhdCBcXHMrXG4gICAgICAoPzpcbiAgICAgICAgKD88Y2FsbGVlPiAuKj8gICAgKVxuICAgICAgICBcXHMrIFxcKFxuICAgICAgICApP1xuICAgICAgKD88cGF0aD4gICAgICAoPzxmb2xkZXJfcGF0aD4gLio/ICkgKD88ZmlsZV9uYW1lPiBbXiBcXC8gXSsgKSAgKSA6XG4gICAgICAoPzxsaW5lX25yPiAgIFxcZCsgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICApIDpcbiAgICAgICg/PGNvbHVtbl9ucj4gXFxkKyAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIClcbiAgICAgIFxcKT9cbiAgICAgICQgLy8vO1xuXG4gICAgIz09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT1cbiAgICBpbnRlcm5hbHMgPSBPYmplY3QuZnJlZXplIHsgdGVtcGxhdGVzLCB9XG5cbiAgICAjPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PVxuICAgIGNsYXNzIEZvcm1hdF9zdGFja1xuXG4gICAgICAjLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiAgICAgIGNvbnN0cnVjdG9yOiAoIGNmZyApIC0+XG4gICAgICAgIEBjZmcgICAgICAgICAgICAgID0geyB0ZW1wbGF0ZXMuZm9ybWF0X3N0YWNrLi4uLCBjZmcuLi4sIH1cbiAgICAgICAgQGNmZy5wYWRkaW5nLmxpbmUgPSBAY2ZnLnBhZGRpbmcucGF0aCArIEBjZmcucGFkZGluZy5jYWxsZWVcbiAgICAgICAgbWUgICAgICAgICAgICAgICAgPSAoIFAuLi4gKSA9PiBAZm9ybWF0IFAuLi5cbiAgICAgICAgT2JqZWN0LnNldFByb3RvdHlwZU9mIG1lLCBAXG4gICAgICAgIGhpZGUgQCwgJ2dldF9yZWxhdGl2ZV9wYXRoJywgZG8gPT5cbiAgICAgICAgICB0cnkgUEFUSCA9IHJlcXVpcmUgJ25vZGU6cGF0aCcgY2F0Y2ggZXJyb3IgdGhlbiByZXR1cm4gbnVsbFxuICAgICAgICAgIHJldHVybiBQQVRILnJlbGF0aXZlLmJpbmQgUEFUSFxuICAgICAgICBoaWRlIEAsICdzdGF0ZScsIHsgY2FjaGU6IG5ldyBNYXAoKSwgfVxuICAgICAgICByZXR1cm4gbWVcblxuICAgICAgIy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4gICAgICBmb3JtYXQ6ICggZXJyb3Jfb3Jfc3RhY2sgKSAtPlxuICAgICAgICAjIyMgVEFJTlQgdXNlIHByb3BlciB2YWxpZGF0aW9uICMjI1xuICAgICAgICBzd2l0Y2ggdHlwZSA9IHR5cGVfb2YgZXJyb3Jfb3Jfc3RhY2tcbiAgICAgICAgICB3aGVuICdlcnJvcidcbiAgICAgICAgICAgIGVycm9yICAgICA9IGVycm9yX29yX3N0YWNrXG4gICAgICAgICAgICBjYXVzZSAgICAgPSBlcnJvci5jYXVzZSA/IG51bGxcbiAgICAgICAgICAgIHN0YWNrICAgICA9IGVycm9yLnN0YWNrXG4gICAgICAgICAgd2hlbiAndGV4dCdcbiAgICAgICAgICAgIGVycm9yICAgICA9IG51bGxcbiAgICAgICAgICAgIGNhdXNlICAgICA9IG51bGxcbiAgICAgICAgICAgIHN0YWNrICAgICA9IGVycm9yX29yX3N0YWNrXG4gICAgICAgICAgZWxzZSB0aHJvdyBuZXcgRXJyb3IgXCLOqV9fXzYgZXhwZWN0ZWQgYW4gZXJyb3Igb3IgYSB0ZXh0LCBnb3QgYSAje3R5cGV9XCJcbiAgICAgICAgIy4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLlxuICAgICAgICBpZiAoIGxpbmVzID0gc3RhY2suc3BsaXQgJ1xcbicgKS5sZW5ndGggaXMgMVxuICAgICAgICAgIFIgPSBAZm9ybWF0X2xpbmUgbGluZVxuICAgICAgICBlbHNlXG4gICAgICAgICAgaGVhZGxpbmUgID0gQGZvcm1hdF9oZWFkbGluZSBsaW5lcy5zaGlmdCgpLCBlcnJvclxuICAgICAgICAgIGxpbmVzICAgICA9IGxpbmVzLnJldmVyc2UoKVxuICAgICAgICAgIGxpbmVzICAgICA9ICggKCBAZm9ybWF0X2xpbmUgbGluZSApIGZvciBsaW5lIGluIGxpbmVzIClcbiAgICAgICAgICBSICAgICAgICAgPSBbIGhlYWRsaW5lLCBsaW5lcy4uLiwgaGVhZGxpbmUsIF0uam9pbiAnXFxuJ1xuICAgICAgICAjLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uXG4gICAgICAgIGlmIGNhdXNlP1xuICAgICAgICAgIFIgPSAoIEBmb3JtYXQgY2F1c2UgKSArIEBnZXRfbGlua2xpbmUoKSArIFJcbiAgICAgICAgcmV0dXJuIFJcblxuICAgICAgIy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4gICAgICBwYXJzZV9saW5lOiAoIGxpbmUgKSAtPlxuICAgICAgICAjIyMgVEFJTlQgdXNlIHByb3BlciB2YWxpZGF0aW9uICMjI1xuICAgICAgICB1bmxlc3MgKCB0eXBlID0gdHlwZV9vZiBsaW5lICkgaXMgJ3RleHQnXG4gICAgICAgICAgdGhyb3cgbmV3IEVycm9yIFwizqlfX183IGV4cGVjdGVkIGEgdGV4dCwgZ290IGEgI3t0eXBlfVwiXG4gICAgICAgICMuLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi5cbiAgICAgICAgaWYgKCAnXFxuJyBpbiBsaW5lIClcbiAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IgXCLOqV9fXzggZXhwZWN0ZWQgYSBzaW5nbGUgbGluZSwgZ290IGEgdGV4dCB3aXRoIGxpbmUgYnJlYWtzXCJcbiAgICAgICAgIy4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLlxuICAgICAgICByZXR1cm4geyB0ZXh0OiBsaW5lLCB0eXBlOiAndW5wYXJzYWJsZScsIH0gdW5sZXNzICggbWF0Y2ggPSBsaW5lLm1hdGNoIHN0YWNrX2xpbmVfcmUgKT9cbiAgICAgICAgIy4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLlxuICAgICAgICBSICAgICAgICAgICA9IHsgbWF0Y2guZ3JvdXBzLi4uLCB9XG4gICAgICAgIGlzX2ludGVybmFsID0gUi5wYXRoLnN0YXJ0c1dpdGggJ25vZGU6J1xuICAgICAgICBSLmNhbGxlZSAgID89ICdbYW5vbnltb3VzXSdcbiAgICAgICAgUi5saW5lX25yICAgPSBwYXJzZUludCBSLmxpbmVfbnIsICAgMTBcbiAgICAgICAgUi5jb2x1bW5fbnIgPSBwYXJzZUludCBSLmNvbHVtbl9uciwgMTBcbiAgICAgICAgIy4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLlxuICAgICAgICBpZiBAZ2V0X3JlbGF0aXZlX3BhdGg/IGFuZCAoIG5vdCBpc19pbnRlcm5hbCApIGFuZCAoIEBjZmcucmVsYXRpdmUgaXNudCBmYWxzZSApXG4gICAgICAgICAgcmVmZXJlbmNlICAgICA9IGlmICggQGNmZy5yZWxhdGl2ZSBpcyB0cnVlICkgdGhlbiBwcm9jZXNzLmN3ZCgpIGVsc2UgQGNmZy5yZWxhdGl2ZVxuICAgICAgICAgIFIucGF0aCAgICAgICAgPSAoIEBnZXRfcmVsYXRpdmVfcGF0aCByZWZlcmVuY2UsIFIucGF0aCAgICAgICAgKVxuICAgICAgICAgIFIuZm9sZGVyX3BhdGggPSAoIEBnZXRfcmVsYXRpdmVfcGF0aCByZWZlcmVuY2UsIFIuZm9sZGVyX3BhdGggKSArICcvJ1xuICAgICAgICAgICMgUi5wYXRoICAgICAgICA9ICcuLycgKyBSLnBhdGggICAgICAgIHVubGVzcyBSLnBhdGhbIDAgXSAgICAgICAgIGluICcuLydcbiAgICAgICAgICAjIFIuZm9sZGVyX3BhdGggPSAnLi8nICsgUi5mb2xkZXJfcGF0aCB1bmxlc3MgUi5mb2xkZXJfcGF0aFsgMCBdICBpbiAnLi8nXG4gICAgICAgICMuLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi5cbiAgICAgICAgc3dpdGNoIHRydWVcbiAgICAgICAgICB3aGVuIGlzX2ludGVybmFsICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB0aGVuICBSLnR5cGUgPSAnaW50ZXJuYWwnXG4gICAgICAgICAgd2hlbiAvXFxibm9kZV9tb2R1bGVzXFwvLy50ZXN0IFIucGF0aCAgICAgICAgICAgICB0aGVuICBSLnR5cGUgPSAnZGVwZW5kZW5jeSdcbiAgICAgICAgICB3aGVuIFIucGF0aC5zdGFydHNXaXRoICcuLi8nICAgICAgICAgICAgICAgICAgICB0aGVuICBSLnR5cGUgPSAnZXh0ZXJuYWwnXG4gICAgICAgICAgZWxzZSAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgUi50eXBlID0gJ21haW4nXG4gICAgICAgIHJldHVybiBSXG5cbiAgICAgICMtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuICAgICAgZm9ybWF0X2xpbmU6ICggbGluZSApIC0+XG4gICAgICAgIHsgc3RhY2tfaW5mbyxcbiAgICAgICAgICBzb3VyY2VfcmVmZXJlbmNlLCAgIH0gPSBAX2Zvcm1hdF9zb3VyY2VfcmVmZXJlbmNlIGxpbmVcbiAgICAgICAgY29udGV4dCA9IGlmIEBjZmcuY29udGV4dCBpcyBmYWxzZSB0aGVuIFtdIGVsc2UgQF9nZXRfY29udGV4dCBzdGFja19pbmZvXG4gICAgICAgIHJldHVybiBbIHNvdXJjZV9yZWZlcmVuY2UsIGNvbnRleHQuLi4sIF0uam9pbiAnXFxuJ1xuXG4gICAgICAjLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiAgICAgIGZvcm1hdF9oZWFkbGluZTogKCBsaW5lLCBlcnJvciA9IG51bGwgKSAtPlxuICAgICAgICAjIyMgVEFJTlQgYWxzbyBzaG93IGNvZGUsIG5hbWUgd2hlcmUgYXBycm9wcmlhdGUgIyMjXG4gICAgICAgICMgICBzaG93X2Vycm9yX3dpdGhfc291cmNlX2NvbnRleHQgZXJyb3IuY2F1c2UsIFwiIENhdXNlOiAje2Vycm9yLmNhdXNlLmNvbnN0cnVjdG9yLm5hbWV9OiAje2Vycm9yLmNhdXNlLm1lc3NhZ2V9IFwiXG4gICAgICAgIHRoZW1lICAgICAgID0gQGNmZy5jb2xvci5oZWFkbGluZVxuICAgICAgICBlcnJvcl9jbGFzcyA9IGVycm9yPy5jb25zdHJ1Y3Rvci5uYW1lID8gJyhubyBlcnJvciBjbGFzcyknXG4gICAgICAgIGxpbmUgICAgICAgID0gXCIgWyN7ZXJyb3JfY2xhc3N9XSAje2xpbmV9XCJcbiAgICAgICAgbGluZSAgICAgICAgPSBsaW5lLnBhZEVuZCBAY2ZnLnBhZGRpbmcubGluZSwgJyAnXG4gICAgICAgIHJldHVybiB0aGVtZS5oZWFkbGluZSArIGxpbmUgKyB0aGVtZS5yZXNldFxuXG4gICAgICAjLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiAgICAgIGdldF9saW5rbGluZTogLT5cbiAgICAgICAgdGhlbWUgICAgICAgPSBAY2ZnLmNvbG9yLmxpbmtsaW5lXG4gICAgICAgIGxpbmUgICAgICAgID0gXCIgIHRoZSBiZWxvdyBlcnJvciB3YXMgY2F1c2VkIGJ5IHRoZSBvbmUgYWJvdmUgIOKWsyAg4pazICDilrMgIFwiXG4gICAgICAgIGxpbmUgICAgICAgID0gbGluZS5wYWRTdGFydCBAY2ZnLnBhZGRpbmcubGluZSwgJyDilrMgJ1xuICAgICAgICByZXR1cm4gJ1xcbicgKyB0aGVtZS5saW5rbGluZSArIGxpbmUgKyB0aGVtZS5yZXNldCArICdcXG4nXG5cbiAgICAgICMtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuICAgICAgX2Zvcm1hdF9zb3VyY2VfcmVmZXJlbmNlOiAoIGxpbmUgKSAtPlxuICAgICAgICBzdGFja19pbmZvICAgICAgPSBAcGFyc2VfbGluZSBsaW5lXG4gICAgICAgIHRoZW1lICAgICAgICAgICA9IEBjZmcuY29sb3JbIHN0YWNrX2luZm8udHlwZSBdXG4gICAgICAgICMuLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi5cbiAgICAgICAgaWYgc3RhY2tfaW5mby50eXBlIGlzICd1bnBhcnNhYmxlJ1xuICAgICAgICAgIHNvdXJjZV9yZWZlcmVuY2UgPSB0aGVtZS50ZXh0ICsgc3RhY2tfaW5mby50ZXh0ICsgdGhlbWUucmVzZXRcbiAgICAgICAgICByZXR1cm4geyBzdGFja19pbmZvLCBzb3VyY2VfcmVmZXJlbmNlLCB9XG4gICAgICAgICMuLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi5cbiAgICAgICAgZm9sZGVyX3BhdGggICAgID0gdGhlbWUuZm9sZGVyX3BhdGggICsgJyAnICAgICsgc3RhY2tfaW5mby5mb2xkZXJfcGF0aCAgKyAnJyAgICAgKyB0aGVtZS5yZXNldFxuICAgICAgICBmaWxlX25hbWUgICAgICAgPSB0aGVtZS5maWxlX25hbWUgICAgKyAnJyAgICAgKyBzdGFja19pbmZvLmZpbGVfbmFtZSAgICArICcgJyAgICArIHRoZW1lLnJlc2V0XG4gICAgICAgIGxpbmVfbnIgICAgICAgICA9IHRoZW1lLmxpbmVfbnIgICAgICArICcgKCcgICArIHN0YWNrX2luZm8ubGluZV9uciAgICAgICsgJycgICAgICsgdGhlbWUucmVzZXRcbiAgICAgICAgY29sdW1uX25yICAgICAgID0gdGhlbWUuY29sdW1uX25yICAgICsgJzonICAgICsgc3RhY2tfaW5mby5jb2x1bW5fbnIgICAgKyAnKSAnICAgKyB0aGVtZS5yZXNldFxuICAgICAgICBjYWxsZWUgICAgICAgICAgPSB0aGVtZS5jYWxsZWUgICAgICAgKyAnICMgJyAgKyBzdGFja19pbmZvLmNhbGxlZSAgICAgICArICcoKSAnICArIHRoZW1lLnJlc2V0XG4gICAgICAgICMuLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi5cbiAgICAgICAgcGF0aF9sZW5ndGggICAgID0gKCBzdHJpcF9hbnNpIGZvbGRlcl9wYXRoICsgZmlsZV9uYW1lICsgbGluZV9uciArIGNvbHVtbl9uciAgKS5sZW5ndGhcbiAgICAgICAgY2FsbGVlX2xlbmd0aCAgID0gKCBzdHJpcF9hbnNpIGNhbGxlZSAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgKS5sZW5ndGhcbiAgICAgICAgIy4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLlxuICAgICAgICBwYXRoX2xlbmd0aCAgICAgPSBNYXRoLm1heCAwLCBAY2ZnLnBhZGRpbmcucGF0aCAgICAtICAgcGF0aF9sZW5ndGhcbiAgICAgICAgY2FsbGVlX2xlbmd0aCAgID0gTWF0aC5tYXggMCwgQGNmZy5wYWRkaW5nLmNhbGxlZSAgLSBjYWxsZWVfbGVuZ3RoXG4gICAgICAgICMuLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi5cbiAgICAgICAgcGFkZGluZ19wYXRoICAgID0gdGhlbWUuZm9sZGVyX3BhdGggKyAoICcgJy5yZXBlYXQgICAgcGF0aF9sZW5ndGggKSArIHRoZW1lLnJlc2V0XG4gICAgICAgIHBhZGRpbmdfY2FsbGVlICA9IHRoZW1lLmNhbGxlZSAgICAgICsgKCAnICcucmVwZWF0ICBjYWxsZWVfbGVuZ3RoICkgKyB0aGVtZS5yZXNldFxuICAgICAgICAjLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uXG4gICAgICAgIHNvdXJjZV9yZWZlcmVuY2UgID0gZm9sZGVyX3BhdGggKyBmaWxlX25hbWUgKyBsaW5lX25yICsgY29sdW1uX25yICsgcGFkZGluZ19wYXRoICsgY2FsbGVlICsgcGFkZGluZ19jYWxsZWVcbiAgICAgICAgcmV0dXJuIHsgc3RhY2tfaW5mbywgc291cmNlX3JlZmVyZW5jZSwgfVxuXG4gICAgICAjLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiAgICAgIF9nZXRfY29udGV4dDogKCBzdGFja19pbmZvICkgLT5cbiAgICAgICAgcmV0dXJuIFtdIGlmICggc3RhY2tfaW5mby50eXBlIGluIFsgJ2ludGVybmFsJywgJ3VucGFyc2FibGUnLCBdICkgb3IgKCBzdGFja19pbmZvLnBhdGggaXMgJycgKVxuICAgICAgICB0cnlcbiAgICAgICAgICBzb3VyY2UgPSBGUy5yZWFkRmlsZVN5bmMgc3RhY2tfaW5mby5wYXRoLCB7IGVuY29kaW5nOiAndXRmLTgnLCB9XG4gICAgICAgIGNhdGNoIGVycm9yXG4gICAgICAgICAgdGhyb3cgZXJyb3IgdW5sZXNzIGVycm9yLmNvZGUgaXMgJ0VOT0VOVCdcbiAgICAgICAgICByZXR1cm4gWyBcInVuYWJsZSB0byByZWFkIGZpbGUgI3tycHIgc3RhY2tfaW5mby5wYXRofVwiLCBdXG4gICAgICAgICMuLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi5cbiAgICAgICAgdGhlbWUgICAgID0gQGNmZy5jb2xvclsgc3RhY2tfaW5mby50eXBlIF1cbiAgICAgICAgcmVmX3dpZHRoID0gN1xuICAgICAgICB3aWR0aCAgICAgPSBAY2ZnLnBhZGRpbmcucGF0aCArIEBjZmcucGFkZGluZy5jYWxsZWUgLSByZWZfd2lkdGhcbiAgICAgICAgc291cmNlICAgID0gc291cmNlLnNwbGl0ICdcXG4nXG4gICAgICAgIGhpdF9pZHggICA9IHN0YWNrX2luZm8ubGluZV9uciAtIDFcbiAgICAgICAgIyByZXR1cm4gc291cmNlWyBoaXRfaWR4IF0gaWYgQGNmZy5jb250ZXh0IDwgMVxuICAgICAgICAjLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uXG4gICAgICAgIGZpcnN0X2lkeCA9IE1hdGgubWF4ICggaGl0X2lkeCAtIEBjZmcuY29udGV4dCApLCAwXG4gICAgICAgIGxhc3RfaWR4ICA9IE1hdGgubWluICggaGl0X2lkeCArIEBjZmcuY29udGV4dCApLCBzb3VyY2UubGVuZ3RoIC0gMVxuICAgICAgICBSICAgICAgICAgPSBbXVxuICAgICAgICAjLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uXG4gICAgICAgIGZvciBpZHggaW4gWyBmaXJzdF9pZHggLi4gbGFzdF9pZHggXVxuICAgICAgICAgIGxpbmUgICAgICA9IHNvdXJjZVsgaWR4IF1cbiAgICAgICAgICByZWZlcmVuY2UgPSB0aGVtZS5yZWZlcmVuY2UgKyAoIFwiI3tpZHggKyAxfSBcIi5wYWRTdGFydCByZWZfd2lkdGgsICcgJyApXG4gICAgICAgICAgaWYgKCBpZHggaXMgaGl0X2lkeCApXG4gICAgICAgICAgICBiZWZvcmUgICAgPSBsaW5lWyAuLi4gc3RhY2tfaW5mby5jb2x1bW5fbnIgLSAxICAgIF1cbiAgICAgICAgICAgIHNwb3QgICAgICA9IGxpbmVbICAgICBzdGFja19pbmZvLmNvbHVtbl9uciAtIDEgLi4gXVxuICAgICAgICAgICAgYmVoaW5kICAgID0gJyAnLnJlcGVhdCBNYXRoLm1heCAwLCB3aWR0aCAtIGxpbmUubGVuZ3RoXG4gICAgICAgICAgICBSLnB1c2ggcmVmZXJlbmNlICsgdGhlbWUuaGl0ICsgYmVmb3JlICsgdGhlbWUuc3BvdCArIHNwb3QgKyB0aGVtZS5oaXQgKyBiZWhpbmQgKyB0aGVtZS5yZXNldFxuICAgICAgICAgIGVsc2VcbiAgICAgICAgICAgIGxpbmUgICAgICA9IGxpbmUucGFkRW5kIHdpZHRoLCAnICdcbiAgICAgICAgICAgIFIucHVzaCByZWZlcmVuY2UgKyB0aGVtZS5jb250ZXh0ICArIGxpbmUgKyB0aGVtZS5yZXNldFxuICAgICAgICAjLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uXG4gICAgICAgIHJldHVybiBSXG5cbiAgICAjLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLlxuICAgIHJldHVybiBleHBvcnRzID0gZG8gPT5cbiAgICAgIGZvcm1hdF9zdGFjayA9IG5ldyBGb3JtYXRfc3RhY2soKVxuICAgICAgcmV0dXJuIHsgZm9ybWF0X3N0YWNrLCBGb3JtYXRfc3RhY2ssIGludGVybmFscywgfVxuXG5cbiM9PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PVxuT2JqZWN0LmFzc2lnbiBtb2R1bGUuZXhwb3J0cywgQlJJQ1NcblxuIl19
