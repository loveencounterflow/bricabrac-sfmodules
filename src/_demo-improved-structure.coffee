

'use strict'
{ debug,          } = console
{ freeze,         } = Object
{ exports: here,  } = module


# { here: exports,  } = module
{ a: b, } = { a: 'A', b: 'B', }
# debug 'Ωdeimst___3', { a, }
debug 'Ωdeimst___3', { b, }

here.internals = internals = freeze {
  value: true, }

here.demo_attached = ->
  debug 'Ωdeimst___1', "here.demo_not_attached: ", here.demo_not_attached
  # debug 'Ωdeimst___2', "here:                ", here
  debug 'Ωdeimst___2', "here:                   ", here
  debug 'Ωdeimst___2', "internals:              ", internals

demo_not_attached = ->

debug 'Ωdeimst___3', @ is here

Object.assign here, { demo_not_attached, }

