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
  docHtml = document.querySelector 'html'
  docBody = document.querySelector 'body'

  # Extend object
  extend = (a, b) ->
    a[prop] = b[prop] for prop of b
    return a

  isElement = (obj) ->
    if typeof HTMLElement is "object"
      return obj instanceof HTMLElement
    else
      return obj and
             typeof obj is "object" and
             obj.nodeType is 1 and
             typeof obj.nodeName is "string"

  # Exception
  class ModalException
    constructor: (@message, @name='ModalException') ->

  # Class
  class Modal

    # Private
    _p =
      getTemplate: ->
        return '
          <div class="modalWidget modalWidget-slidedown">
            <div class="modalWidget__close icon-close"></div>
            <div class="modalWidget__box">{content}</div>
          </div>'

      getElement: (el) ->
        el = el || false
        if el is false
          return false

        out = if typeof el == 'string' then document.querySelector el else el
        return if isElement out then out else false

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
        isOpen = classie.has @modal, @options.openClass
        if isOpen is true
          classie.remove @modal, @options.openClass
          classie.remove docHtml, @options.overlayClass
          classie.remove docBody, @options.overlayClass
          @.emitEvent 'close'
        return

      onOpen: (event) ->
        isOpen = classie.has @modal, @options.openClass
        if isOpen is false
          if typeof @options.beforeOpen == 'function'
            @options.beforeOpen @modal, @close, @box
          classie.add @modal, @options.openClass
          classie.add docHtml, @options.overlayClass
          classie.add docBody, @options.overlayClass
          @.emitEvent 'open'
        return

    constructor: (container = docBody, options = {}) ->

      # Container
      @container = _p.getElement container

      # Exception
      if @container is false
        throw new ModalException '✖ No valid container'
      else

        # Options
        @options =
          esc          : true
          template     : _p.getTemplate
          content      : ''
          beforeOpen   : null
          openClass    : 'modalWidget-slidedown--open'
          overlayClass : 'modalWidget--overlay'
          selectors  :
            modal   : '.modalWidget'
            close   : '.modalWidget__close'
            box     : '.modalWidget__box'

        extend @options, options

        # Template
        content = _p.getElement @options.content
        if content is false
          contentStr = @options.content
        else
          contentStr = content.innerHTML

        r = 'content': contentStr
        render = @options.template().replace /\{(.*?)\}/g, (a, b) ->
          return r[b]

        @container.insertAdjacentHTML 'beforeend', render

        # Nullable
        r =
        render =
        content =
        contentStr = null

        # Elements
        @modal = @container.querySelector @options.selectors.modal
        @close = @modal.querySelector @options.selectors.close
        @box   = @modal.querySelector @options.selectors.box

        # Keyboard
        @keyCodes =
          'esc': 27

        # Binding handlers to get success when call "removeListener"
        @handlers =
          'keyup': _handlers.onKeyUp.bind @
          'open' : _handlers.onOpen.bind @
          'close': _handlers.onClose.bind @

        # Listeners
        @close.addEventListener 'click', @handlers.close, false
        window.addEventListener 'keyup', @handlers.keyup, false

      return

    # Open
    open: ->
      @handlers.open null
      return

    # Close
    close: ->
      @handlers.close null
      return

  # Extends
  extend Modal::, EventEmitter::

  return Modal
