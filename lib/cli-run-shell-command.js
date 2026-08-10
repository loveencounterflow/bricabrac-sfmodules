(function() {
  'use strict';
  var execSync;

  //===========================================================================================================
  execSync = null;

  //===========================================================================================================
  this.run_shell_command = function(cwd, cmdline) {
    var detail, error, ref, shell, stdout;
    if (execSync == null) {
      execSync = (require('node:child_process')).execSync;
    }
    shell = (ref = process.env.SHELL) != null ? ref : '/bin/bash';
    try {
      stdout = execSync(cmdline, {
        cwd: cwd,
        shell: shell,
        encoding: 'utf8',
        maxBuffer: 10 * 1024 * 1024 // 10 MB, falls doch mal mehr Output kommt als erwartet
      });
      return stdout;
    } catch (error1) {
      error = error1;
      //-----------------------------------------------------------------------------------------------------
      // execSync hängt stdout/stderr/status/signal ans Error-Objekt; wir bauen daraus eine
      // aussagekräftige Message und werfen weiter, statt den Fehler zu schlucken.
      detail = `shell command failed (exit ${error.status}): ${cmdline}
cwd:    ${cwd}
stderr: ${error.stderr}`;
      throw new Error(detail, {
        cause: error
      });
    }
    return null;
  };

}).call(this);

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vc3JjL2NsaS1ydW4tc2hlbGwtY29tbWFuZC5jb2ZmZWUiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQ0E7RUFBQTtBQUFBLE1BQUEsUUFBQTs7O0VBR0EsUUFBQSxHQUFXLEtBSFg7OztFQU1BLElBQUMsQ0FBQSxpQkFBRCxHQUFxQixRQUFBLENBQUUsR0FBRixFQUFPLE9BQVAsQ0FBQTtBQUNyQixRQUFBLE1BQUEsRUFBQSxLQUFBLEVBQUEsR0FBQSxFQUFBLEtBQUEsRUFBQTs7TUFBRSxXQUFZLENBQUUsT0FBQSxDQUFRLG9CQUFSLENBQUYsQ0FBZ0MsQ0FBQzs7SUFDN0MsS0FBQSw2Q0FBZ0M7QUFDaEM7TUFDRSxNQUFBLEdBQVMsUUFBQSxDQUFTLE9BQVQsRUFDUDtRQUFBLEdBQUEsRUFBVSxHQUFWO1FBQ0EsS0FBQSxFQUFVLEtBRFY7UUFFQSxRQUFBLEVBQVUsTUFGVjtRQUdBLFNBQUEsRUFBVyxFQUFBLEdBQUssSUFBTCxHQUFZLElBSHZCO01BQUEsQ0FETztBQUtULGFBQU8sT0FOVDtLQU9BLGNBQUE7TUFBTSxlQUNSOzs7O01BR0ksTUFBQSxHQUFTLENBQUEsMkJBQUEsQ0FBQSxDQUNzQixLQUFLLENBQUMsTUFENUIsQ0FBQSxHQUFBLENBQUEsQ0FDd0MsT0FEeEMsQ0FBQTtRQUFBLENBQUEsQ0FFRyxHQUZILENBQUE7UUFBQSxDQUFBLENBR0csS0FBSyxDQUFDLE1BSFQsQ0FBQTtNQUtULE1BQU0sSUFBSSxLQUFKLENBQVUsTUFBVixFQUFrQjtRQUFFLEtBQUEsRUFBTztNQUFULENBQWxCLEVBVFI7O1dBVUM7RUFwQmtCO0FBTnJCIiwic291cmNlc0NvbnRlbnQiOlsiXG4ndXNlIHN0cmljdCdcblxuIz09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09XG5leGVjU3luYyA9IG51bGxcblxuIz09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09XG5AcnVuX3NoZWxsX2NvbW1hbmQgPSAoIGN3ZCwgY21kbGluZSApIC0+XG4gIGV4ZWNTeW5jID89ICggcmVxdWlyZSAnbm9kZTpjaGlsZF9wcm9jZXNzJyApLmV4ZWNTeW5jXG4gIHNoZWxsICAgICA9IHByb2Nlc3MuZW52LlNIRUxMID8gJy9iaW4vYmFzaCdcbiAgdHJ5XG4gICAgc3Rkb3V0ID0gZXhlY1N5bmMgY21kbGluZSxcbiAgICAgIGN3ZDogICAgICBjd2RcbiAgICAgIHNoZWxsOiAgICBzaGVsbFxuICAgICAgZW5jb2Rpbmc6ICd1dGY4J1xuICAgICAgbWF4QnVmZmVyOiAxMCAqIDEwMjQgKiAxMDI0ICAjIDEwIE1CLCBmYWxscyBkb2NoIG1hbCBtZWhyIE91dHB1dCBrb21tdCBhbHMgZXJ3YXJ0ZXRcbiAgICByZXR1cm4gc3Rkb3V0XG4gIGNhdGNoIGVycm9yXG4gICAgIy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4gICAgIyBleGVjU3luYyBow6RuZ3Qgc3Rkb3V0L3N0ZGVyci9zdGF0dXMvc2lnbmFsIGFucyBFcnJvci1PYmpla3Q7IHdpciBiYXVlbiBkYXJhdXMgZWluZVxuICAgICMgYXVzc2FnZWtyw6RmdGlnZSBNZXNzYWdlIHVuZCB3ZXJmZW4gd2VpdGVyLCBzdGF0dCBkZW4gRmVobGVyIHp1IHNjaGx1Y2tlbi5cbiAgICBkZXRhaWwgPSBcIlwiXCJcbiAgICAgIHNoZWxsIGNvbW1hbmQgZmFpbGVkIChleGl0ICN7ZXJyb3Iuc3RhdHVzfSk6ICN7Y21kbGluZX1cbiAgICAgIGN3ZDogICAgI3tjd2R9XG4gICAgICBzdGRlcnI6ICN7ZXJyb3Iuc3RkZXJyfVxuICAgICAgXCJcIlwiXG4gICAgdGhyb3cgbmV3IEVycm9yIGRldGFpbCwgeyBjYXVzZTogZXJyb3IgfVxuICA7bnVsbFxuIl19
