(function() {
  (function(root, factory) {
    if (typeof define === "function" && define.amd) {
      define(['classie/classie', 'eventEmitter/EventEmitter'], factory);
    } else {
      root.Modal = factory(root.classie, root.EventEmitter);
    }
  })(this, function(classie, EventEmitter) {
    'use strict';
    var GUID, Modal, deepExtend, docBody, extend, isElement, removeAllChildren, transitionend, whichTransitionEnd;
    docBody = document.querySelector('body');
    extend = function(a, b) {
      var prop;
      for (prop in b) {
        a[prop] = b[prop];
      }
      return a;
    };
    deepExtend = function(out) {
      var i, key, obj;
      out = out || {};
      i = 1;
      while (i < arguments.length) {
        obj = arguments[i];
        if (!obj) {
          continue;
        }
        for (key in obj) {
          if (obj.hasOwnProperty(key)) {
            if (typeof obj[key] === "object") {
              deepExtend(out[key], obj[key]);
            } else {
              out[key] = obj[key];
            }
          }
        }
        i++;
      }
      return out;
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
          return '<div tabindex="0" class="{widget} {fx} {id}"> <div class="{close}"></div> <div class="{box}">{content}</div> </div>';
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
          if (this.overlayElement !== null) {
            method = add ? 'add' : 'remove';
            classie[method](this.overlayElement, this.options.overlayClass);
          }
        },
        overflow: function(hidden) {
          var v;
          if (hidden == null) {
            hidden = false;
          }
          if (this.options.useOverflow) {
            v = hidden ? 'hidden' : 'visible';
            docBody.style.overflow = v;
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
            classie.remove(this.modal, this.options.selectors.fxOpen);
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
            classie.add(this.modal, this.options.selectors.fxOpen);
            _p.overlay.call(this, true);
            _p.overflow.call(this, true);
            this.modal.focus();
            this.emitEvent('open');
          }
        },
        onTransitionEnd: function(event) {
          if (this.closeTrigger === true) {
            _p.overlay.call(this, false);
            _p.overflow.call(this, false);
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
          overlayClass: 'modalWidget--overlay',
          overlayElement: null,
          useOverflow: true,
          selectors: {
            widget: 'modalWidget',
            modal: "modalWidget" + id,
            close: 'modalWidget__close',
            box: 'modalWidget__box',
            fx: 'modalWidget-slidedown',
            fxOpen: 'modalWidget-slidedown--open'
          }
        };
        deepExtend(this.options, options);
        r = {
          'content': _p.getContent(this.options.content),
          'id': this.options.selectors.modal,
          'widget': this.options.selectors.widget,
          'close': this.options.selectors.close,
          'box': this.options.selectors.box,
          'fx': this.options.selectors.fx
        };
        render = this.options.template().replace(/\{(.*?)\}/g, function(a, b) {
          return r[b];
        });
        docBody.insertAdjacentHTML('beforeend', render);
        r = render = null;
        this.modal = docBody.querySelector("." + this.options.selectors.modal);
        this.closeHandler = this.modal.querySelector("." + this.options.selectors.close);
        this.box = this.modal.querySelector("." + this.options.selectors.box);
        this.overlayElement = null;
        if (this.options.overlayElement !== null) {
          if (typeof this.options.overlayElement === 'string') {
            this.overlayElement = document.querySelector(this.options.overlayElement);
          } else {
            if (isElement(this.options.overlayElement === true)) {
              this.overlayElement = this.options.overlayElement;
            }
          }
        }
        if (isElement(this.container === false)) {
          throw new SwitchSlideException('✖ Container must be an HTMLElement');
        }
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
        isOpen = classie.has(this.modal, this.options.selectors.fxOpen);
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
