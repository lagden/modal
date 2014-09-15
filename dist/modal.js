(function() {
  (function(root, factory) {
    if (typeof define === "function" && define.amd) {
      define(['classie/classie', 'eventEmitter/EventEmitter'], factory);
    } else {
      root.Modal = factory(root.classie, root.EventEmitter);
    }
  })(this, function(classie, EventEmitter) {
    'use strict';
    var Modal, ModalException, docBody, docHtml, extend, isElement;
    docHtml = document.querySelector('html');
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
    ModalException = (function() {
      function ModalException(message, name) {
        this.message = message;
        this.name = name != null ? name : 'ModalException';
      }

      return ModalException;

    })();
    Modal = (function() {
      var _handlers, _p;

      _p = {
        getTemplate: function() {
          return '<div class="modalWidget modalWidget-slidedown"> <div class="modalWidget__close icon-close"></div> <div class="modalWidget__box">{content}</div> </div>';
        },
        getElement: function(el) {
          var out;
          el = el || false;
          if (el === false) {
            return false;
          }
          out = typeof el === 'string' ? document.querySelector(el) : el;
          if (isElement(out)) {
            return out;
          } else {
            return false;
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
          var isOpen;
          isOpen = classie.has(this.modal, this.options.openClass);
          if (isOpen === true) {
            classie.remove(this.modal, this.options.openClass);
            classie.remove(docHtml, this.options.overlayClass);
            classie.remove(docBody, this.options.overlayClass);
            this.emitEvent('close');
          }
        },
        onOpen: function(event) {
          var isOpen;
          isOpen = classie.has(this.modal, this.options.openClass);
          if (isOpen === false) {
            if (typeof this.options.beforeOpen === 'function') {
              this.options.beforeOpen(this.modal, this.close, this.box);
            }
            classie.add(this.modal, this.options.openClass);
            classie.add(docHtml, this.options.overlayClass);
            classie.add(docBody, this.options.overlayClass);
            this.emitEvent('open');
          }
        }
      };

      function Modal(container, options) {
        var content, contentStr, r, render;
        if (container == null) {
          container = docBody;
        }
        if (options == null) {
          options = {};
        }
        this.container = _p.getElement(container);
        if (this.container === false) {
          throw new ModalException('✖ No valid container');
        } else {
          this.options = {
            esc: true,
            template: _p.getTemplate,
            content: '',
            beforeOpen: null,
            openClass: 'modalWidget-slidedown--open',
            overlayClass: 'modalWidget--overlay',
            selectors: {
              modal: '.modalWidget',
              close: '.modalWidget__close',
              box: '.modalWidget__box'
            }
          };
          extend(this.options, options);
          content = _p.getElement(this.options.content);
          if (content === false) {
            contentStr = this.options.content;
          } else {
            contentStr = content.innerHTML;
          }
          r = {
            'content': contentStr
          };
          render = this.options.template().replace(/\{(.*?)\}/g, function(a, b) {
            return r[b];
          });
          this.container.insertAdjacentHTML('beforeend', render);
          r = render = content = contentStr = null;
          this.modal = this.container.querySelector(this.options.selectors.modal);
          this.close = this.modal.querySelector(this.options.selectors.close);
          this.box = this.modal.querySelector(this.options.selectors.box);
          this.keyCodes = {
            'esc': 27
          };
          this.handlers = {
            'keyup': _handlers.onKeyUp.bind(this),
            'open': _handlers.onOpen.bind(this),
            'close': _handlers.onClose.bind(this)
          };
          this.close.addEventListener('click', this.handlers.close, false);
          window.addEventListener('keyup', this.handlers.keyup, false);
        }
        return;
      }

      Modal.prototype.open = function() {
        this.handlers.open(null);
      };

      Modal.prototype.close = function() {
        this.handlers.close(null);
      };

      return Modal;

    })();
    extend(Modal.prototype, EventEmitter.prototype);
    return Modal;
  });

}).call(this);
