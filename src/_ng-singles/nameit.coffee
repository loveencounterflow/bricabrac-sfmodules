
'use strict'

@nameit = ( name, fn ) -> Object.defineProperty fn, 'name', { value: name, }; fn
