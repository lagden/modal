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

  $ = document.querySelector.bind document

  # document.html
  docHtml = $ 'html'

  # document.body
  docBody = document.body || $ 'body'

  # Scroll
  scrollX = -> return window.scrollX || window.pageXOffset
  scrollY = -> return window.scrollY || window.pageYOffset

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

  # Transform property cross-browser
  transformProperty = getStyleProperty 'transform'

  # Globally unique identifiers
  GUID = 0

  # Class
  class Modal

    # Private
    _p =
      getTemplate: ->
        return '
          <div tabindex="0" class="{widget} {fx} {id}">
            <div class="{close}"></div>
            <div class="{box}">{content}</div>
          </div>'

      overlay: (add = false) ->
        if @overlayElement isnt null
          method = if add then 'add' else 'remove'
          classie[method] @overlayElement, @options.overlayClass
        return

      overflow: (hidden = false) ->
        preventScrollId = +docBody.getAttribute('data-prevent')
        preventScrollId = preventScrollId || @id
        method = if hidden then 'add' else 'remove'

        if @options.preventScroll and preventScrollId == @id

          if hidden
            docBody.setAttribute('data-prevent', @id)
            @scrollY = scrollY()
            @scrollX = scrollX()
          else
            docBody.removeAttribute('data-prevent')
            window.scrollTo @scrollX, @scrollY

          classie[method] docHtml, @options.htmlBodyOpen
          classie[method] docBody, @options.htmlBodyOpen

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
          classie.remove @modal, @options.fxOpen

          # Fallback transitionend
          @handlers.end null if @transitionend is false

          @.emitEvent 'close'
        return

      onOpen: (event) ->
        @closeTrigger = false

        if @isOpen() is false
          if typeof @options.beforeOpen == 'function'
            @options.beforeOpen @modal, @closeHandler, @box

          classie.add @modal, @options.fxOpen
          _p.overlay.call @, true
          _p.overflow.call @, true

          @modal.focus()
          @.emitEvent 'open'
        return

      onTransitionEnd: (event) ->
        if @closeTrigger is true
          _p.overlay.call @, false
          _p.overflow.call @, false
          @closeTrigger = false
        return

    constructor: (options = {}) ->

      # Globally unique identifiers
      @id = ++GUID

      @scrollY = @scrollX = 0

      # Options
      @options =
        esc            : true
        template       : _p.getTemplate
        content        : ''
        beforeOpen     : null
        preventScroll  : true
        overlayElement : null
        overlayClass   : 'modalWidget--overlay'
        modal          : null
        widget         : 'modalWidget'
        close          : 'modalWidget__close'
        box            : 'modalWidget__box'
        fx             : 'modalWidget-slidedown'
        fxOpen         : 'modalWidget-slidedown--open'
        htmlBodyOpen   : 'modalWidget-htmlBody--open'

      @options.modal = "#{@options.widget}#{@id}" if @options.modal is null

      extend @options, options

      # Content
      @content = null
      contentIsStr = false

      if typeof @options.content == 'string'
        try
          @content = $ @options.content
        catch err
          @content = @options.content
          contentIsStr = true
      else
        @content = @options.content if isElement @options.content

      # Template
      r =
        'content' : if contentIsStr then @content else ''
        'id'      : @options.modal
        'widget'  : @options.widget
        'close'   : @options.close
        'box'     : @options.box
        'fx'      : @options.fx

      render = @options.template().replace /\{(.*?)\}/g, (a, b) ->
        return r[b]

      # Add widget on DOM
      docBody.insertAdjacentHTML 'beforeend', render

      # Nullable
      r =
      render = null

      # Elements
      @modal        = docBody.querySelector ".#{@options.modal}"
      @closeHandler = @modal.querySelector ".#{@options.close}"
      @box          = @modal.querySelector ".#{@options.box}"

      # Move content
      if contentIsStr is false
        @box.appendChild(@content);

      # Overlay
      @overlayElement = null
      if @options.overlayElement isnt null
        if typeof  @options.overlayElement is 'string'
          @overlayElement = $ @options.overlayElement
        else
          if isElement @options.overlayElement is true
            @overlayElement = @options.overlayElement

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
      @closeHandler.addEventListener 'touchstart', @handlers.close, false

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
      isOpen = classie.has @modal, @options.fxOpen
      return isOpen

    destroy: ->
      if @destroyed is false
        # Remove Listeners
        @closeHandler.removeEventListener 'click', @handlers.close, false

        if @transitionend
          @modal.removeEventListener transitionend, @handlers.end, false

        if @options.esc is true
          @modal.removeEventListener 'keyup', @handlers.keyup, false

        # Remove all elements
        docBody.removeChild removeAllChildren(@modal)

        @destroyed = true
      return


  # Extends
  extend Modal::, EventEmitter::

  return Modal
