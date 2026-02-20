(function() {
  'use strict';
  var Dbric_table_formatter, Table, debug, echo, f, output_query_as_csv, type_of, warn;

  ({
    //===========================================================================================================
    debug,
    log: echo,
    warn
  } = console);

  ({Table} = (require('./cli-table3a.brics')).require_cli_table3a());

  ({f} = require('effstring'));

  ({type_of} = (require('./unstable-rpr-type_of-brics')).require_type_of());

  //===========================================================================================================
  Dbric_table_formatter = class Dbric_table_formatter {
    //---------------------------------------------------------------------------------------------------------
    _tbl_get_column_names(sql) {
      var c;
      if (this.isa_statement(sql)) {
        return (function() {
          var i, len, ref, results;
          ref = sql.columns();
          results = [];
          for (i = 0, len = ref.length; i < len; i++) {
            c = ref[i];
            results.push(c.name);
          }
          return results;
        })();
      }
      return (function() {
        var i, len, ref, results;
        ref = this.state.columns;
        results = [];
        for (i = 0, len = ref.length; i < len; i++) {
          c = ref[i];
          results.push(c.name);
        }
        return results;
      }).call(this);
    }

    //---------------------------------------------------------------------------------------------------------
    tbl_as_text(sql, ...P) {
      /* TAINT assert P is empty */
      var caption, cell, cells, col_idx, col_name, col_names, count, i, len, row, rows, table, table_row, type;
      switch (type = type_of(sql)) {
        case 'generator':
          rows = sql;
          caption = '?';
          break;
        case 'generatorfunction':
          rows = sql.call(this, ...P);
          caption = sql.name;
          break;
        case 'text':
          rows = this.walk(sql, ...P);
          caption = sql;
          break;
        default:
          rows = this.walk(sql, ...P);
          caption = sql.toString();
      }
      // caption     = f"#{relation_type} #{relation_name} (#{row_count}:,.0f; rows)"
      col_names = this._tbl_get_column_names(sql);
      caption = ` ${caption} `;
      table = new Table({
        caption,
        head: ['', ...col_names]
      });
      count = 0;
//.......................................................................................................
      for (row of rows) {
        count++;
        //.....................................................................................................
        cells = [];
//.....................................................................................................
        for (col_idx = i = 0, len = col_names.length; i < len; col_idx = ++i) {
          col_name = col_names[col_idx];
          cell = row[col_name];
          // cell = color cell if ( color = col_colors[ col_idx ] )?
          cells.push(cell);
        }
        table.push(table_row = [`(${count})`, ...cells]);
      }
      return table.toString();
    }

    //---------------------------------------------------------------------------------------------------------
    tbl_echo_as_text(sql, ...P) {
      return echo(this.tbl_as_text(sql, ...P));
    }

  };

  //-----------------------------------------------------------------------------------------------------------
  output_query_as_csv = function(query) {
    var CSV, column, jzr, rows, werr, werrn, wout, woutn;
    CSV = require('csv-stringify/sync');
    jzr = new Jizura();
    wout = function(...P) {
      process.stdout.write(...P);
      return null;
    };
    woutn = function(...P) {
      process.stdout.write(...P);
      process.stdout.write('\n');
      return null;
    };
    werr = function(...P) {
      process.stderr.write(...P);
      return null;
    };
    werrn = function(...P) {
      process.stderr.write(...P);
      process.stderr.write('\n');
      return null;
    };
    // query = process.argv[ 2 ] ? null
    if ((query == null) || (query === '')) {
      werrn(reverse(red(" Ωdtf___2 no query given ")));
      process.exit(111);
      return null;
    }
    rows = jzr.dba.get_all(query);
    // woutn cli_commands.use_pspg
    wout(CSV.stringify([
      (function() {
        var i,
      len,
      ref,
      results;
        ref = jzr.dba.state.columns;
        results = [];
        for (i = 0, len = ref.length; i < len; i++) {
          column = ref[i];
          results.push(column.name);
        }
        return results;
      })()
    ]));
    wout(CSV.stringify(rows));
    return null;
  };

  //===========================================================================================================
  module.exports = (() => {
    var internals;
    internals = {};
    return {Dbric_table_formatter, internals};
  })();

}).call(this);

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vc3JjL2RicmljLXRhYmxlLWZvcm1hdHRlci5jb2ZmZWUiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBRUE7RUFBQTtBQUFBLE1BQUEscUJBQUEsRUFBQSxLQUFBLEVBQUEsS0FBQSxFQUFBLElBQUEsRUFBQSxDQUFBLEVBQUEsbUJBQUEsRUFBQSxPQUFBLEVBQUE7O0VBR0EsQ0FBQSxDQUFBOztJQUFFLEtBQUY7SUFDRSxHQUFBLEVBQUssSUFEUDtJQUVFO0VBRkYsQ0FBQSxHQUU0QixPQUY1Qjs7RUFHQSxDQUFBLENBQUUsS0FBRixDQUFBLEdBQTRCLENBQUUsT0FBQSxDQUFRLHFCQUFSLENBQUYsQ0FBaUMsQ0FBQyxtQkFBbEMsQ0FBQSxDQUE1Qjs7RUFDQSxDQUFBLENBQUUsQ0FBRixDQUFBLEdBQTRCLE9BQUEsQ0FBUSxXQUFSLENBQTVCOztFQUNBLENBQUEsQ0FBRSxPQUFGLENBQUEsR0FBNEIsQ0FBRSxPQUFBLENBQVEsOEJBQVIsQ0FBRixDQUEwQyxDQUFDLGVBQTNDLENBQUEsQ0FBNUIsRUFSQTs7O0VBWU0sd0JBQU4sTUFBQSxzQkFBQSxDQUFBOztJQUdFLHFCQUF1QixDQUFFLEdBQUYsQ0FBQTtBQUN6QixVQUFBO01BQUksSUFBNkMsSUFBQyxDQUFBLGFBQUQsQ0FBZSxHQUFmLENBQTdDO0FBQUE7O0FBQVM7QUFBQTtVQUFBLEtBQUEscUNBQUE7O3lCQUFBLENBQUMsQ0FBQztVQUFGLENBQUE7O2FBQVQ7O0FBQ0E7O0FBQVM7QUFBQTtRQUFBLEtBQUEscUNBQUE7O3VCQUFBLENBQUMsQ0FBQztRQUFGLENBQUE7OztJQUZZLENBRHpCOzs7SUFNRSxXQUFhLENBQUUsR0FBRixFQUFBLEdBQU8sQ0FBUCxDQUFBLEVBQUE7O0FBQ2YsVUFBQSxPQUFBLEVBQUEsSUFBQSxFQUFBLEtBQUEsRUFBQSxPQUFBLEVBQUEsUUFBQSxFQUFBLFNBQUEsRUFBQSxLQUFBLEVBQUEsQ0FBQSxFQUFBLEdBQUEs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QUFBLENBQUksMkJBQUosQ0FBUixDQUFOO01BQ0EsT0FBTyxDQUFDLElBQVIsQ0FBYSxHQUFiO0FBQ0EsYUFBTyxLQUhUOztJQUlBLElBQUEsR0FBUSxHQUFHLENBQUMsR0FBRyxDQUFDLE9BQVIsQ0FBZ0IsS0FBaEIsRUFYVjs7SUFhRSxJQUFBLENBQUssR0FBRyxDQUFDLFNBQUosQ0FBYzs7Ozs7O0FBQUk7QUFBQTtRQUFBLEtBQUEscUNBQUE7O3VCQUFBLE1BQU0sQ0FBQztRQUFQLENBQUE7O1VBQUo7S0FBZCxDQUFMO0lBQ0EsSUFBQSxDQUFLLEdBQUcsQ0FBQyxTQUFKLENBQWMsSUFBZCxDQUFMO1dBQ0M7RUFoQm1CLEVBMUR0Qjs7O0VBOEVBLE1BQU0sQ0FBQyxPQUFQLEdBQW9CLENBQUEsQ0FBQSxDQUFBLEdBQUE7QUFDcEIsUUFBQTtJQUFFLFNBQUEsR0FBWSxDQUFBO0FBQ1osV0FBTyxDQUNMLHFCQURLLEVBRUwsU0FGSztFQUZXLENBQUE7QUE5RXBCIiwic291cmNlc0NvbnRlbnQiOlsiXG5cbid1c2Ugc3RyaWN0J1xuXG4jPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT1cbnsgZGVidWcsXG4gIGxvZzogZWNobyxcbiAgd2FybiAgICAgICAgICAgICAgICAgIH0gPSBjb25zb2xlXG57IFRhYmxlLCB9ICAgICAgICAgICAgICAgID0gKCByZXF1aXJlICcuL2NsaS10YWJsZTNhLmJyaWNzJyApLnJlcXVpcmVfY2xpX3RhYmxlM2EoKVxueyBmLCB9ICAgICAgICAgICAgICAgICAgICA9IHJlcXVpcmUgJ2VmZnN0cmluZydcbnsgdHlwZV9vZiwgICAgICAgICAgICAgIH0gPSAoIHJlcXVpcmUgJy4vdW5zdGFibGUtcnByLXR5cGVfb2YtYnJpY3MnICkucmVxdWlyZV90eXBlX29mKClcblxuXG4jPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT1cbmNsYXNzIERicmljX3RhYmxlX2Zvcm1hdHRlclxuXG4gICMtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiAgX3RibF9nZXRfY29sdW1uX25hbWVzOiAoIHNxbCApIC0+XG4gICAgcmV0dXJuICggYy5uYW1lIGZvciBjIGluIHNxbC5jb2x1bW5zKCkgICkgaWYgQGlzYV9zdGF0ZW1lbnQgc3FsXG4gICAgcmV0dXJuICggYy5uYW1lIGZvciBjIGluIEBzdGF0ZS5jb2x1bW5zIClcblxuICAjLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4gIHRibF9hc190ZXh0OiAoIHNxbCwgUC4uLiApIC0+XG4gICAgc3dpdGNoIHR5cGUgPSB0eXBlX29mIHNxbFxuICAgICAgd2hlbiAnZ2VuZXJhdG9yJ1xuICAgICAgICAjIyMgVEFJTlQgYXNzZXJ0IFAgaXMgZW1wdHkgIyMjXG4gICAgICAgIHJvd3MgICAgPSBzcWxcbiAgICAgICAgY2FwdGlvbiA9ICc/J1xuICAgICAgd2hlbiAnZ2VuZXJhdG9yZnVuY3Rpb24nXG4gICAgICAgIHJvd3MgICAgPSBzcWwuY2FsbCBALCBQLi4uXG4gICAgICAgIGNhcHRpb24gPSBzcWwubmFtZVxuICAgICAgd2hlbiAndGV4dCdcbiAgICAgICAgcm93cyAgICA9IEB3YWxrIHNxbCwgUC4uLlxuICAgICAgICBjYXB0aW9uID0gc3FsXG4gICAgICBlbHNlXG4gICAgICAgIHJvd3MgICAgPSBAd2FsayBzcWwsIFAuLi5cbiAgICAgICAgY2FwdGlvbiA9IHNxbC50b1N0cmluZygpXG4gICAgIyBjYXB0aW9uICAgICA9IGZcIiN7cmVsYXRpb25fdHlwZX0gI3tyZWxhdGlvbl9uYW1lfSAoI3tyb3dfY291bnR9OiwuMGY7IHJvd3MpXCJcbiAgICBjb2xfbmFtZXMgICA9IEBfdGJsX2dldF9jb2x1bW5fbmFtZXMgc3FsXG4gICAgY2FwdGlvbiAgICAgPSBcIiAje2NhcHRpb259IFwiXG4gICAgdGFibGUgICAgICAgPSBuZXcgVGFibGUgeyBjYXB0aW9uLCBoZWFkOiBbICcnLCBjb2xfbmFtZXMuLi4sIF0sIH1cbiAgICBjb3VudCAgICAgICA9IDBcbiAgICAjLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLlxuICAgIGZvciByb3cgZnJvbSByb3dzXG4gICAgICBjb3VudCsrXG4gICAgICAjLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi5cbiAgICAgIGNlbGxzID0gW11cbiAgICAgICMuLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLlxuICAgICAgZm9yIGNvbF9uYW1lLCBjb2xfaWR4IGluIGNvbF9uYW1lc1xuICAgICAgICBjZWxsID0gcm93WyBjb2xfbmFtZSBdXG4gICAgICAgICMgY2VsbCA9IGNvbG9yIGNlbGwgaWYgKCBjb2xvciA9IGNvbF9jb2xvcnNbIGNvbF9pZHggXSApP1xuICAgICAgICBjZWxscy5wdXNoIGNlbGxcbiAgICAgIHRhYmxlLnB1c2ggdGFibGVfcm93ID0gWyBcIigje2NvdW50fSlcIiwgY2VsbHMuLi4sIF1cbiAgICByZXR1cm4gdGFibGUudG9TdHJpbmcoKVxuXG4gICMtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiAgdGJsX2VjaG9fYXNfdGV4dDogKCBzcWwsIFAuLi4gKSAtPiBlY2hvIEB0YmxfYXNfdGV4dCBzcWwsIFAuLi5cblxuXG4jLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbm91dHB1dF9xdWVyeV9hc19jc3YgPSAoIHF1ZXJ5ICkgLT5cbiAgQ1NWICAgPSByZXF1aXJlICdjc3Ytc3RyaW5naWZ5L3N5bmMnXG4gIGp6ciAgID0gbmV3IEppenVyYSgpXG4gIHdvdXQgID0gKCBQLi4uICkgLT4gcHJvY2Vzcy5zdGRvdXQud3JpdGUgUC4uLjsgICAgICAgICAgICAgICAgICAgICAgICAgICAgO251bGxcbiAgd291dG4gPSAoIFAuLi4gKSAtPiBwcm9jZXNzLnN0ZG91dC53cml0ZSBQLi4uOyBwcm9jZXNzLnN0ZG91dC53cml0ZSAnXFxuJyAgO251bGxcbiAgd2VyciAgPSAoIFAuLi4gKSAtPiBwcm9jZXNzLnN0ZGVyci53cml0ZSBQLi4uOyAgICAgICAgICAgICAgICAgICAgICAgICAgICA7bnVsbFxuICB3ZXJybiA9ICggUC4uLiApIC0+IHByb2Nlc3Muc3RkZXJyLndyaXRlIFAuLi47IHByb2Nlc3Muc3RkZXJyLndyaXRlICdcXG4nICA7bnVsbFxuICAjIHF1ZXJ5ID0gcHJvY2Vzcy5hcmd2WyAyIF0gPyBudWxsXG4gIGlmICggbm90IHF1ZXJ5PyApIG9yICggcXVlcnkgaXMgJycgKVxuICAgIHdlcnJuIHJldmVyc2UgcmVkIFwiIM6pZHRmX19fMiBubyBxdWVyeSBnaXZlbiBcIlxuICAgIHByb2Nlc3MuZXhpdCAxMTFcbiAgICByZXR1cm4gbnVsbFxuICByb3dzICA9IGp6ci5kYmEuZ2V0X2FsbCBxdWVyeVxuICAjIHdvdXRuIGNsaV9jb21tYW5kcy51c2VfcHNwZ1xuICB3b3V0IENTVi5zdHJpbmdpZnkgWyAoIGNvbHVtbi5uYW1lIGZvciBjb2x1bW4gaW4ganpyLmRiYS5zdGF0ZS5jb2x1bW5zICksIF1cbiAgd291dCBDU1Yuc3RyaW5naWZ5IHJvd3NcbiAgO251bGxcblxuXG4jPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT1cbm1vZHVsZS5leHBvcnRzID0gZG8gPT5cbiAgaW50ZXJuYWxzID0ge31cbiAgcmV0dXJuIHtcbiAgICBEYnJpY190YWJsZV9mb3JtYXR0ZXIsXG4gICAgaW50ZXJuYWxzLCB9XG4iXX0=
