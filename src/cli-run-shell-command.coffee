
'use strict'

#===========================================================================================================
execSync = null

#===========================================================================================================
@run_shell_command = ( cwd, cmdline ) ->
  execSync ?= ( require 'node:child_process' ).execSync
  shell     = process.env.SHELL ? '/bin/bash'
  try
    stdout = execSync cmdline,
      cwd:      cwd
      shell:    shell
      encoding: 'utf8'
      maxBuffer: 10 * 1024 * 1024  # 10 MB, falls doch mal mehr Output kommt als erwartet
    return stdout
  catch error
    #-----------------------------------------------------------------------------------------------------
    # execSync hängt stdout/stderr/status/signal ans Error-Objekt; wir bauen daraus eine
    # aussagekräftige Message und werfen weiter, statt den Fehler zu schlucken.
    detail = """
      shell command failed (exit #{error.status}): #{cmdline}
      cwd:    #{cwd}
      stderr: #{error.stderr}
      """
    throw new Error detail, { cause: error }
  ;null
