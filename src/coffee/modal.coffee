((root, factory) ->
  if typeof define is "function" and define.amd
    define [
        'classie/classie'
        'eventEmitter/EventEmitter'
        'tap'
      ], factory
  else
    root.Modal = factory root.classie,
                         root.EventEmitter
                         root.Tap
  return
) @, (classie, EventEmitter, Tap) ->

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

  # Globally unique identifiers
  GUID = 0

  # Class
  class Modal

    constructor: (options = {}) ->

      # Globally unique identifiers
      @id = ++GUID

      @scrollY = @scrollX = 0

      # Options
      @options =
        esc            : true
        template       : @getTemplate
        content        : ''
        beforeOpen     : null
        preventScroll  : true
        overlayElement : null
        overlay        : ''
        widget         : ''
        close          : ''
        box            : ''
        hidden         : ''
        visible        : ''
        htmlBodyOpen   : ''

      extend @options, options

      @css =
        overlay        : 'l-modal__overlay'
        widget         : 'l-modal'
        close          : 'l-modal__close'
        box            : 'l-modal__box'
        hidden         : 'l-modal_hidden'
        visible        : 'l-modal_visible'
        htmlBodyOpen   : 'l-modal__htmlBody'

      @options.modal = "#{@css.widget}#{@id}"

      for k, v of @css
        @options[k] = "#{v} #{@options[k]}".trim()

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
        'hidden'  : @options.hidden

      render = @options.template().replace /\{(.*?)\}/g, (a, b) ->
        return r[b]

      # Add widget on DOM
      docBody.insertAdjacentHTML 'beforeend', render.replace(/> </gi, '><')

      # Nullable
      r =
      render = null

      # Elements
      @modal        = $ "##{@options.modal}"
      @closeHandler = @modal.querySelector ".#{@css.close}"
      @box          = @modal.querySelector ".#{@css.box}"

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

      # Listeners
      new Tap @closeHandler
      @closeHandler.addEventListener 'tap', @, false # close

      @transitionend = false
      @transitionend = true if typeof transitionend isnt 'undefined'

      if @transitionend
        @modal.addEventListener transitionend, @, false

      if @options.esc is true
        @modal.addEventListener 'keyup', @, false

      # Flag
      @closeTrigger = false
      @destroyed = false

      return

    getTemplate: ->
      return '
        <div tabindex="0" id="{id}" class="{widget} {hidden}">
          <div class="{close}"></div>
          <div class="{box}">{content}</div>
        </div>
      '.trim()

    overlay: (add = false) ->
      if @overlayElement isnt null
        method = if add then 'add' else 'remove'
        for css in @options.overlay.split(' ')
          classie[method] @overlayElement, css
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

        for css in @options.htmlBodyOpen.split(' ')
          classie[method] docHtml, css
          classie[method] docBody, css
      return

    # Event handler
    onKeyUp: (event) ->
      switch event.keyCode
        when @keyCodes.esc
          trigger = true
        else
          trigger = false

      @close null if trigger is true
      trigger = null
      return

    onTransitionEnd: ->
      if @closeTrigger is true
        @overlay false
        @overflow false
        @closeTrigger = false
      return

    close: ->
      @closeTrigger = true

      if @isOpen() is true
        for css in @options.visible.split(' ')
          classie.remove @modal, css

        # Fallback transitionend
        @onTransitionEnd null if @transitionend is false

        @.emitEvent 'close'
      return

    open: ->
      @closeTrigger = false

      if @isOpen() is false
        if typeof @options.beforeOpen == 'function'
          @options.beforeOpen @modal, @closeHandler, @box

        for css in @options.visible.split(' ')
          classie.add @modal, css

        @overlay true
        @overflow true

        @modal.focus()
        @.emitEvent 'open'
      return

    # Is open?
    isOpen: ->
      isOpen = classie.has @modal, @css.visible
      return isOpen

    destroy: ->
      if @destroyed is false
        # Remove Listeners
        @closeHandler.removeEventListener 'click', @, false

        if @transitionend
          @modal.removeEventListener transitionend, @, false

        if @options.esc is true
          @modal.removeEventListener 'keyup', @, false

        # Remove all elements
        docBody.removeChild removeAllChildren(@modal)

        @destroyed = true
      return

    handleEvent: (event) ->
      switch event.type
        when 'tap' then @close event
        when 'keyup' then @onKeyUp event
        when transitionend then @onTransitionEnd event
      return

  # Extends
  extend Modal::, EventEmitter::

  return Modal
