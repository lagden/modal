((root, factory) ->
  if typeof define is "function" and define.amd
    define [
        'classie/classie'
        'eventEmitter/EventEmitter'
      ], factory
  else
    root.Modal = factory root.classie,
                         root.EventEmitter
  return
) @, (classie, EventEmitter) ->

  'use strict'

  # Elements
  # docHtml = document.querySelector 'html'
  docBody = document.querySelector 'body'

  # Extend object
  # https://github.com/desandro/draggabilly/blob/master/draggabilly.js#L17
  extend = (a, b) ->
    a[prop] = b[prop] for prop of b
    return a

  # http://stackoverflow.com/a/384380/182183
  isElement = (obj) ->
    if typeof HTMLElement is "object"
      return obj instanceof HTMLElement
    else
      return obj and
             typeof obj is "object" and
             obj.nodeType is 1 and
             typeof obj.nodeName is "string"

  # https://github.com/EvandroLG/transitionEnd/blob/master/src/transition-end.js#L33
  whichTransitionEnd = ->
    transitions =
      'WebkitTransition' : 'webkitTransitionEnd'
      'MozTransition'    : 'transitionend'
      'OTransition'      : 'oTransitionEnd otransitionend'
      'transition'       : 'transitionend'

    for k, v of transitions
      return v unless typeof docBody.style[k] is 'undefined'
    return

  # Remove all children
  removeAllChildren = (el) ->
    while el.hasChildNodes()
      c = el.lastChild
      if c.hasChildNodes()
        el.removeChild removeAllChildren(c)
      else
        el.removeChild c
    return el

  # Transition property cross-browser
  transitionend = whichTransitionEnd()

  # Globally unique identifiers
  GUID = 0

  # Class
  class Modal

    # Private
    _p =
      getTemplate: ->
        return '
          <div tabindex="0" class="modalWidget modalWidget-slidedown {id}">
            <div class="modalWidget__close icon-close"></div>
            <div class="modalWidget__box">{content}</div>
          </div>'

      getContent: (c) ->
        return c.innerHTML if isElement c

        try
          out = document.querySelector c if typeof c == 'string'
          return out.innerHTML
        catch err
          # ...

        return c

      overlay: (add = false)->
        if @options.useOverlayClass
          method = if add then 'add' else 'remove'
          # classie[method] docHtml, @options.overlayClass
          classie[method] docBody, @options.overlayClass
        return

    # Event handler
    _handlers =
      onKeyUp: (event) ->
        switch event.keyCode
          when @keyCodes.esc
            trigger = true
          else
            trigger = false

        @handlers.close null if trigger is true
        trigger = null
        return

      onClose: (event) ->
        @closeTrigger = true

        if @isOpen() is true
          classie.remove @modal, @options.openClass

          # Fallback transitionend
          @handlers.end null if @transitionend is false

          @.emitEvent 'close'
        return

      onOpen: (event) ->
        @closeTrigger = false

        if @isOpen() is false
          if typeof @options.beforeOpen == 'function'
            @options.beforeOpen @modal, @closeHandler, @box

          classie.add @modal, @options.openClass
          _p.overlay.call @, true

          @modal.focus()
          @.emitEvent 'open'
        return

      onTransitionEnd: (event) ->
        if @closeTrigger is true
          _p.overlay.call @, false
          @closeTrigger = false
        return

    constructor: (options = {}) ->

      # Globally unique identifiers
      id = ++GUID

      # Options
      @options =
        esc             : true
        template        : _p.getTemplate
        content         : ''
        beforeOpen      : null
        openClass       : 'modalWidget-slidedown--open'
        overlayClass    : 'modalWidget--overlay'
        useOverlayClass : false
        selectors       :
          close   : '.modalWidget__close'
          box     : '.modalWidget__box'

      extend @options, options
      @options.selectors.modal = "modalWidget#{id}"

      # Template
      r =
        'content': _p.getContent @options.content
        'id': @options.selectors.modal

      render = @options.template().replace /\{(.*?)\}/g, (a, b) ->
        return r[b]

      # Add on DOM
      docBody.insertAdjacentHTML 'beforeend', render

      # Nullable
      r =
      render = null

      # Elements
      @modal        = docBody.querySelector ".#{@options.selectors.modal}"
      @closeHandler = @modal.querySelector @options.selectors.close
      @box          = @modal.querySelector @options.selectors.box

      # Keyboard
      @keyCodes =
        'esc': 27

      # Binding handlers to get success when call "removeListener"
      @handlers =
        'keyup': _handlers.onKeyUp.bind @
        'open' : _handlers.onOpen.bind @
        'close': _handlers.onClose.bind @
        'end'  : _handlers.onTransitionEnd.bind @

      # Listeners
      @closeHandler.addEventListener 'click', @handlers.close, false

      @transitionend = false
      @transitionend = true if typeof transitionend isnt 'undefined'

      if @transitionend
        @modal.addEventListener transitionend, @handlers.end, false

      if @options.esc is true
        @modal.addEventListener 'keyup', @handlers.keyup, false

      # Flag
      @closeTrigger = false
      @destroyed = false

      return

    # Open
    open: ->
      @handlers.open null
      return

    # Close
    close: ->
      @handlers.close null
      return

    # Is open?
    isOpen: ->
      isOpen = classie.has @modal, @options.openClass
      return isOpen

    destroy: ->
      if @destroyed is false
        # Remove Listeners
        @closeHandler.removeEventListener 'click', @handlers.close, false

        if @transitionend
          @modal.removeEventListener transitionend, @handlers.end, false

        if @options.esc is true
          @modal.removeEventListener 'keyup', @handlers.keyup, false

        # Remove Elements from DOM
        docBody.removeChild removeAllChildren(@modal)

        @destroyed = true
      return


  # Extends
  extend Modal::, EventEmitter::

  return Modal
