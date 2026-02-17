(function() {
  'use strict';
  var Dbric_table_formatter, Table, debug, f, warn;

  //===========================================================================================================
  ({debug, warn} = console);

  ({Table} = (require('./cli-table3a.brics')).require_cli_table3a());

  ({f} = require('effstring'));

  Dbric_table_formatter = (function() {
    var echo_cli_table;

    // { type_of,              } = ( require './unstable-rpr-type_of-brics' ).require_type_of()

      //===========================================================================================================
    class Dbric_table_formatter {
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
        var caption, cell, cells, col_idx, col_name, col_names, count, i, len, row, rows, table, table_row;
        rows = this.walk(sql, ...P);
        // caption     = f"#{relation_type} #{relation_name} (#{row_count}:,.0f; rows)"
        col_names = this._tbl_get_column_names(sql);
        caption = "(caption here)";
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

    };

    //---------------------------------------------------------------------------------------------------------
    echo_cli_table = function(...P) {
      return echo(this.tbl_as_text(...P));
    };

    return Dbric_table_formatter;

  }).call(this);

  //===========================================================================================================
  module.exports = (() => {
    var internals;
    internals = {};
    return {Dbric_table_formatter, internals};
  })();

}).call(this);

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vc3JjL2RicmljLXRhYmxlLWZvcm1hdHRlci5jb2ZmZWUiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBRUE7RUFBQTtBQUFBLE1BQUEscUJBQUEsRUFBQSxLQUFBLEVBQUEsS0FBQSxFQUFBLENBQUEsRUFBQSxJQUFBOzs7RUFHQSxDQUFBLENBQUUsS0FBRixFQUNFLElBREYsQ0FBQSxHQUM0QixPQUQ1Qjs7RUFFQSxDQUFBLENBQUUsS0FBRixDQUFBLEdBQTRCLENBQUUsT0FBQSxDQUFRLHFCQUFSLENBQUYsQ0FBaUMsQ0FBQyxtQkFBbEMsQ0FBQSxDQUE1Qjs7RUFDQSxDQUFBLENBQUUsQ0FBRixDQUFBLEdBQTRCLE9BQUEsQ0FBUSxXQUFSLENBQTVCOztFQUtNOzs7Ozs7SUFBTixNQUFBLHNCQUFBLENBQUE7O01BR0UscUJBQXVCLENBQUUsR0FBRixDQUFBO0FBQ3pCLFlBQUE7UUFBSSxJQUE2QyxJQUFDLENBQUEsYUFBRCxDQUFlLEdBQWYsQ0FBN0M7QUFBQTs7QUFBUztBQUFBO1lBQUEsS0FBQSxxQ0FBQTs7MkJBQUEsQ0FBQyxDQUFDO1lBQUYsQ0FBQTs7ZUFBVDs7QUFDQTs7QUFBUztBQUFBO1VBQUEsS0FBQSxxQ0FBQTs7eUJBQUEsQ0FBQyxDQUFDO1VBQUYsQ0FBQTs7O01BRlksQ0FEekI7OztNQU1FLFdBQWEsQ0FBRSxHQUFGLEVBQUEsR0FBTyxDQUFQLENBQUE7QUFDZixZQUFBLE9BQUEsRUFBQSxJQUFBLEVBQUEsS0FBQSxFQUFBLE9BQUEsRUFBQSxRQUFBLEVBQUEsU0FBQSxFQUFBLEtBQUEsRUFBQSxDQUFBLEVBQUEsR0FBQSxFQUFBLEdBQUEsRUFBQSxJQUFBLEVBQUEsS0FBQSxFQUFBO1FBQUksSUFBQSxHQUFjLElBQUMsQ0FBQSxJQUFELENBQU0sR0FBTixFQUFXLEdBQUEsQ0FBWCxFQUFsQjs7UUFFSSxTQUFBLEdBQWMsSUFBQyxDQUFBLHFCQUFELENBQXVCLEdBQXZCO1FBQ2QsT0FBQSxHQUFjO1FBQ2QsS0FBQSxHQUFjLElBQUksS0FBSixDQUFVO1VBQUUsT0FBRjtVQUFXLElBQUEsRUFBTSxDQUFFLEVBQUYsRUFBTSxHQUFBLFNBQU47UUFBakIsQ0FBVjtRQUNkLEtBQUEsR0FBYyxFQUxsQjs7UUFPSSxLQUFBLFdBQUE7VUFDRSxLQUFBLEdBQU47O1VBRU0sS0FBQSxHQUFRLEdBRmQ7O1VBSU0sS0FBQSwrREFBQTs7WUFDRSxJQUFBLEdBQU8sR0FBRyxDQUFFLFFBQUYsRUFBbEI7O1lBRVEsS0FBSyxDQUFDLElBQU4sQ0FBVyxJQUFYO1VBSEY7VUFJQSxLQUFLLENBQUMsSUFBTixDQUFXLFNBQUEsR0FBWSxDQUFFLENBQUEsQ0FBQSxDQUFBLENBQUksS0FBSixDQUFBLENBQUEsQ0FBRixFQUFnQixHQUFBLEtBQWhCLENBQXZCO1FBVEY7QUFVQSxlQUFPLEtBQUssQ0FBQyxRQUFOLENBQUE7TUFsQkk7O0lBUmY7OztJQTZCRSxjQUFBLEdBQWlCLFFBQUEsQ0FBQSxHQUFFLENBQUYsQ0FBQTthQUFZLElBQUEsQ0FBSyxJQUFDLENBQUEsV0FBRCxDQUFhLEdBQUEsQ0FBYixDQUFMO0lBQVo7Ozs7Z0JBeENuQjs7O0VBMkNBLE1BQU0sQ0FBQyxPQUFQLEdBQW9CLENBQUEsQ0FBQSxDQUFBLEdBQUE7QUFDcEIsUUFBQTtJQUFFLFNBQUEsR0FBWSxDQUFBO0FBQ1osV0FBTyxDQUNMLHFCQURLLEVBRUwsU0FGSztFQUZXLENBQUE7QUEzQ3BCIiwic291cmNlc0NvbnRlbnQiOlsiXG5cbid1c2Ugc3RyaWN0J1xuXG4jPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT1cbnsgZGVidWcsXG4gIHdhcm4gICAgICAgICAgICAgICAgICB9ID0gY29uc29sZVxueyBUYWJsZSwgfSAgICAgICAgICAgICAgICA9ICggcmVxdWlyZSAnLi9jbGktdGFibGUzYS5icmljcycgKS5yZXF1aXJlX2NsaV90YWJsZTNhKClcbnsgZiwgfSAgICAgICAgICAgICAgICAgICAgPSByZXF1aXJlICdlZmZzdHJpbmcnXG4jIHsgdHlwZV9vZiwgICAgICAgICAgICAgIH0gPSAoIHJlcXVpcmUgJy4vdW5zdGFibGUtcnByLXR5cGVfb2YtYnJpY3MnICkucmVxdWlyZV90eXBlX29mKClcblxuXG4jPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT1cbmNsYXNzIERicmljX3RhYmxlX2Zvcm1hdHRlclxuXG4gICMtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiAgX3RibF9nZXRfY29sdW1uX25hbWVzOiAoIHNxbCApIC0+XG4gICAgcmV0dXJuICggYy5uYW1lIGZvciBjIGluIHNxbC5jb2x1bW5zKCkgICkgaWYgQGlzYV9zdGF0ZW1lbnQgc3FsXG4gICAgcmV0dXJuICggYy5uYW1lIGZvciBjIGluIEBzdGF0ZS5jb2x1bW5zIClcblxuICAjLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4gIHRibF9hc190ZXh0OiAoIHNxbCwgUC4uLiApIC0+XG4gICAgcm93cyAgICAgICAgPSBAd2FsayBzcWwsIFAuLi5cbiAgICAjIGNhcHRpb24gICAgID0gZlwiI3tyZWxhdGlvbl90eXBlfSAje3JlbGF0aW9uX25hbWV9ICgje3Jvd19jb3VudH06LC4wZjsgcm93cylcIlxuICAgIGNvbF9uYW1lcyAgID0gQF90YmxfZ2V0X2NvbHVtbl9uYW1lcyBzcWxcbiAgICBjYXB0aW9uICAgICA9IFwiKGNhcHRpb24gaGVyZSlcIlxuICAgIHRhYmxlICAgICAgID0gbmV3IFRhYmxlIHsgY2FwdGlvbiwgaGVhZDogWyAnJywgY29sX25hbWVzLi4uLCBdLCB9XG4gICAgY291bnQgICAgICAgPSAwXG4gICAgIy4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi5cbiAgICBmb3Igcm93IGZyb20gcm93c1xuICAgICAgY291bnQrK1xuICAgICAgIy4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uXG4gICAgICBjZWxscyA9IFtdXG4gICAgICAjLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi5cbiAgICAgIGZvciBjb2xfbmFtZSwgY29sX2lkeCBpbiBjb2xfbmFtZXNcbiAgICAgICAgY2VsbCA9IHJvd1sgY29sX25hbWUgXVxuICAgICAgICAjIGNlbGwgPSBjb2xvciBjZWxsIGlmICggY29sb3IgPSBjb2xfY29sb3JzWyBjb2xfaWR4IF0gKT9cbiAgICAgICAgY2VsbHMucHVzaCBjZWxsXG4gICAgICB0YWJsZS5wdXNoIHRhYmxlX3JvdyA9IFsgXCIoI3tjb3VudH0pXCIsIGNlbGxzLi4uLCBdXG4gICAgcmV0dXJuIHRhYmxlLnRvU3RyaW5nKClcblxuICAjLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4gIGVjaG9fY2xpX3RhYmxlID0gKCBQLi4uICkgLT4gZWNobyBAdGJsX2FzX3RleHQgUC4uLlxuXG4jPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT1cbm1vZHVsZS5leHBvcnRzID0gZG8gPT5cbiAgaW50ZXJuYWxzID0ge31cbiAgcmV0dXJuIHtcbiAgICBEYnJpY190YWJsZV9mb3JtYXR0ZXIsXG4gICAgaW50ZXJuYWxzLCB9XG4iXX0=
