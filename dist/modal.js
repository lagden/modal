(function() {
  (function(root, factory) {
    if (typeof define === "function" && define.amd) {
      define(['classie/classie', 'eventEmitter/EventEmitter', 'get-style-property/get-style-property'], factory);
    } else {
      root.Modal = factory(root.classie, root.EventEmitter, root.getStyleProperty);
    }
  })(this, function(classie, EventEmitter, getStyleProperty) {
    'use strict';
    var GUID, Modal, docBody, extend, injectElementWithStyles, isElement, isTouch, mod, prefixes, removeAllChildren, scrollX, scrollY, transformProperty, transitionend, whichTransitionEnd;
    docBody = document.querySelector('body');
    scrollX = function() {
      return window.scrollX || window.pageXOffset;
    };
    scrollY = function() {
      return window.scrollY || window.pageYOffset;
    };
    mod = 'modernizr';
    prefixes = '-webkit- -moz- -o- -ms- '.split(' ');
    injectElementWithStyles = function(rule, callback) {
      var body, div, docOverflow, fakeBody, ret, style;
      div = document.createElement('div');
      body = document.body;
      fakeBody = body || document.createElement('body');
      style = ['&#173;', '<style id="s', mod, '">', rule, '</style>'].join('');
      div.id = mod;
      (body ? div : fakeBody).innerHTML += style;
      fakeBody.appendChild(div);
      if (!body) {
        fakeBody.style.background = '';
        fakeBody.style.overflow = 'hidden';
        docOverflow = docElement.style.overflow;
        docElement.style.overflow = 'hidden';
        docElement.appendChild(fakeBody);
      }
      ret = callback(div, rule);
      if (!body) {
        fakeBody.parentNode.removeChild(fakeBody);
        docElement.style.overflow = docOverflow;
      } else {
        div.parentNode.removeChild(div);
      }
      return !!ret;
    };
    isTouch = function() {
      var bool;
      bool = false;
      if (('ontouchstart' in window) || (window.DocumentTouch && document instanceof DocumentTouch)) {
        bool = true;
      } else {
        injectElementWithStyles(['@media (', prefixes.join('touch-enabled),('), mod, ')', '{#modernizr{top:9px;position:absolute}}'].join(''), function(node) {
          bool = node.offsetTop === 9;
        });
      }
      return bool;
    };
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
    transformProperty = getStyleProperty('transform');
    GUID = 0;
    Modal = (function() {
      var _handlers, _p;

      _p = {
        getTemplate: function() {
          return '<div tabindex="0" class="{widget} {fx} {id}"> <div class="{close}"></div> <div class="{box}">{content}</div> </div>';
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
          var k, preventScrollId, styles, v;
          if (hidden == null) {
            hidden = false;
          }
          preventScrollId = +docBody.getAttribute('data-prevent');
          preventScrollId = preventScrollId || this.id;
          if (this.options.preventScroll && preventScrollId === this.id) {
            styles = {};
            if (hidden) {
              docBody.setAttribute('data-prevent', this.id);
              this.scrollY = scrollY();
              this.scrollX = scrollX();
              styles.overflow = 'hidden';
              if (isTouch()) {
                styles[transformProperty] = 'translate3d(0, 0, 0)';
                styles.position = 'fixed';
                styles.top = 0;
                styles.left = 0;
                styles.width = '100%';
                styles.height = '100%';
              }
              for (k in styles) {
                v = styles[k];
                docBody.style[k] = v;
              }
            } else {
              docBody.removeAttribute('data-prevent');
              styles.overflow = '';
              if (isTouch()) {
                styles[transformProperty] = '';
                styles.position = '';
                styles.top = '';
                styles.left = '';
                styles.width = '';
                styles.height = '';
              }
              for (k in styles) {
                v = styles[k];
                docBody.style[k] = v;
              }
              window.scrollTo(this.scrollX, this.scrollY);
            }
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
            classie.remove(this.modal, this.options.fxOpen);
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
            classie.add(this.modal, this.options.fxOpen);
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
        var contentIsStr, err, r, render;
        if (options == null) {
          options = {};
        }
        this.id = ++GUID;
        this.scrollY = this.scrollX = 0;
        this.options = {
          esc: true,
          template: _p.getTemplate,
          content: '',
          beforeOpen: null,
          preventScroll: true,
          overlayElement: null,
          overlayClass: 'modalWidget--overlay',
          modal: null,
          widget: 'modalWidget',
          close: 'modalWidget__close',
          box: 'modalWidget__box',
          fx: 'modalWidget-slidedown',
          fxOpen: 'modalWidget-slidedown--open'
        };
        if (this.options.modal === null) {
          this.options.modal = "" + this.options.widget + this.id;
        }
        extend(this.options, options);
        this.content = null;
        contentIsStr = false;
        if (typeof this.options.content === 'string') {
          try {
            this.content = document.querySelector(this.options.content);
          } catch (_error) {
            err = _error;
            this.content = this.options.content;
            contentIsStr = true;
          }
        } else {
          if (isElement(this.options.content)) {
            this.content = this.options.content;
          }
        }
        r = {
          'content': contentIsStr ? this.content : '',
          'id': this.options.modal,
          'widget': this.options.widget,
          'close': this.options.close,
          'box': this.options.box,
          'fx': this.options.fx
        };
        render = this.options.template().replace(/\{(.*?)\}/g, function(a, b) {
          return r[b];
        });
        docBody.insertAdjacentHTML('beforeend', render);
        r = render = null;
        this.modal = docBody.querySelector("." + this.options.modal);
        this.closeHandler = this.modal.querySelector("." + this.options.close);
        this.box = this.modal.querySelector("." + this.options.box);
        if (contentIsStr === false) {
          this.box.appendChild(this.content);
        }
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
        this.closeHandler.addEventListener('touchstart', this.handlers.close, false);
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
        isOpen = classie.has(this.modal, this.options.fxOpen);
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
