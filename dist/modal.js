(function() {
  (function(root, factory) {
    if (typeof define === "function" && define.amd) {
      define(['classie/classie', 'eventEmitter/EventEmitter'], factory);
    } else {
      root.Modal = factory(root.classie, root.EventEmitter);
    }
  })(this, function(classie, EventEmitter) {
    'use strict';
    var GUID, Modal, docBody, extend, isElement, removeAllChildren, transitionend, whichTransitionEnd;
    docBody = document.querySelector('body');
    extend = function(a, b) {
      var prop;
      for (prop in b) {
        a[prop] = b[prop];
      }
      return a;
    };
    isElement = function(obj) {
      if (typeof HTMLElement === "object") {
        return obj instanceof HTMLElement;
      } else {
        return obj && typeof obj === "object" && obj.nodeType === 1 && typeof obj.nodeName === "string";
      }
    };
    whichTransitionEnd = function() {
      var k, transitions, v;
      transitions = {
        'WebkitTransition': 'webkitTransitionEnd',
        'MozTransition': 'transitionend',
        'OTransition': 'oTransitionEnd otransitionend',
        'transition': 'transitionend'
      };
      for (k in transitions) {
        v = transitions[k];
        if (typeof docBody.style[k] !== 'undefined') {
          return v;
        }
      }
    };
    removeAllChildren = function(el) {
      var c;
      while (el.hasChildNodes()) {
        c = el.lastChild;
        if (c.hasChildNodes()) {
          el.removeChild(removeAllChildren(c));
        } else {
          el.removeChild(c);
        }
      }
      return el;
    };
    transitionend = whichTransitionEnd();
    GUID = 0;
    Modal = (function() {
      var _handlers, _p;

      _p = {
        getTemplate: function() {
          return '<div tabindex="0" class="modalWidget modalWidget-slidedown {id}"> <div class="modalWidget__close icon-close"></div> <div class="modalWidget__box">{content}</div> </div>';
        },
        getContent: function(c) {
          var err, out;
          if (isElement(c)) {
            return c.innerHTML;
          }
          try {
            if (typeof c === 'string') {
              out = document.querySelector(c);
            }
            return out.innerHTML;
          } catch (_error) {
            err = _error;
          }
          return c;
        },
        overlay: function(add) {
          var method;
          if (add == null) {
            add = false;
          }
          if (this.options.useOverlayClass) {
            method = add ? 'add' : 'remove';
            classie[method](docBody, this.options.overlayClass);
          }
        }
      };

      _handlers = {
        onKeyUp: function(event) {
          var trigger;
          switch (event.keyCode) {
            case this.keyCodes.esc:
              trigger = true;
              break;
            default:
              trigger = false;
          }
          if (trigger === true) {
            this.handlers.close(null);
          }
          trigger = null;
        },
        onClose: function(event) {
          this.closeTrigger = true;
          if (this.isOpen() === true) {
            classie.remove(this.modal, this.options.openClass);
            if (this.transitionend === false) {
              this.handlers.end(null);
            }
            this.emitEvent('close');
          }
        },
        onOpen: function(event) {
          this.closeTrigger = false;
          if (this.isOpen() === false) {
            if (typeof this.options.beforeOpen === 'function') {
              this.options.beforeOpen(this.modal, this.closeHandler, this.box);
            }
            classie.add(this.modal, this.options.openClass);
            _p.overlay.call(this, true);
            this.modal.focus();
            this.emitEvent('open');
          }
        },
        onTransitionEnd: function(event) {
          if (this.closeTrigger === true) {
            _p.overlay.call(this, false);
            this.closeTrigger = false;
          }
        }
      };

      function Modal(options) {
        var id, r, render;
        if (options == null) {
          options = {};
        }
        id = ++GUID;
        this.options = {
          esc: true,
          template: _p.getTemplate,
          content: '',
          beforeOpen: null,
          openClass: 'modalWidget-slidedown--open',
          overlayClass: 'modalWidget--overlay',
          useOverlayClass: false,
          selectors: {
            close: '.modalWidget__close',
            box: '.modalWidget__box'
          }
        };
        extend(this.options, options);
        this.options.selectors.modal = "modalWidget" + id;
        r = {
          'content': _p.getContent(this.options.content),
          'id': this.options.selectors.modal
        };
        render = this.options.template().replace(/\{(.*?)\}/g, function(a, b) {
          return r[b];
        });
        docBody.insertAdjacentHTML('beforeend', render);
        r = render = null;
        this.modal = docBody.querySelector("." + this.options.selectors.modal);
        this.closeHandler = this.modal.querySelector(this.options.selectors.close);
        this.box = this.modal.querySelector(this.options.selectors.box);
        this.keyCodes = {
          'esc': 27
        };
        this.handlers = {
          'keyup': _handlers.onKeyUp.bind(this),
          'open': _handlers.onOpen.bind(this),
          'close': _handlers.onClose.bind(this),
          'end': _handlers.onTransitionEnd.bind(this)
        };
        this.closeHandler.addEventListener('click', this.handlers.close, false);
        this.transitionend = false;
        if (typeof transitionend !== 'undefined') {
          this.transitionend = true;
        }
        if (this.transitionend) {
          this.modal.addEventListener(transitionend, this.handlers.end, false);
        }
        if (this.options.esc === true) {
          this.modal.addEventListener('keyup', this.handlers.keyup, false);
        }
        this.closeTrigger = false;
        this.destroyed = false;
        return;
      }

      Modal.prototype.open = function() {
        this.handlers.open(null);
      };

      Modal.prototype.close = function() {
        this.handlers.close(null);
      };

      Modal.prototype.isOpen = function() {
        var isOpen;
        isOpen = classie.has(this.modal, this.options.openClass);
        return isOpen;
      };

      Modal.prototype.destroy = function() {
        if (this.destroyed === false) {
          this.closeHandler.removeEventListener('click', this.handlers.close, false);
          if (this.transitionend) {
            this.modal.removeEventListener(transitionend, this.handlers.end, false);
          }
          if (this.options.esc === true) {
            this.modal.removeEventListener('keyup', this.handlers.keyup, false);
          }
          docBody.removeChild(removeAllChildren(this.modal));
          this.destroyed = true;
        }
      };

      return Modal;

    })();
    extend(Modal.prototype, EventEmitter.prototype);
    return Modal;
  });

}).call(this);
