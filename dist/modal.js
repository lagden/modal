(function() {
  (function(root, factory) {
    if (typeof define === "function" && define.amd) {
      define(['classie/classie', 'eventEmitter/EventEmitter', 'tap'], factory);
    } else {
      root.Modal = factory(root.classie, root.EventEmitter, root.Tap);
    }
  })(this, function(classie, EventEmitter, Tap) {
    'use strict';
    var $, GUID, Modal, docBody, docHtml, extend, isElement, removeAllChildren, scrollX, scrollY, transitionend, whichTransitionEnd;
    $ = document.querySelector.bind(document);
    docHtml = $('html');
    docBody = document.body || $('body');
    scrollX = function() {
      return window.scrollX || window.pageXOffset;
    };
    scrollY = function() {
      return window.scrollY || window.pageYOffset;
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
    GUID = 0;
    Modal = (function() {
      function Modal(options) {
        var contentIsStr, err, k, r, render, v, _ref;
        if (options == null) {
          options = {};
        }
        this.id = ++GUID;
        this.scrollY = this.scrollX = 0;
        this.options = {
          esc: true,
          template: this.getTemplate,
          content: '',
          beforeOpen: null,
          preventScroll: true,
          overlayElement: null,
          overlay: '',
          widget: '',
          close: '',
          box: '',
          hidden: '',
          visible: '',
          htmlBodyOpen: ''
        };
        extend(this.options, options);
        this.css = {
          overlay: 'l-modal__overlay',
          widget: 'l-modal',
          close: 'l-modal__close',
          box: 'l-modal__box',
          hidden: 'l-modal_hidden',
          visible: 'l-modal_visible',
          htmlBodyOpen: 'l-modal__htmlBody'
        };
        this.options.modal = "" + this.css.widget + this.id;
        _ref = this.css;
        for (k in _ref) {
          v = _ref[k];
          this.options[k] = ("" + v + " " + this.options[k]).trim();
        }
        this.content = null;
        contentIsStr = false;
        if (typeof this.options.content === 'string') {
          try {
            this.content = $(this.options.content);
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
          'hidden': this.options.hidden
        };
        render = this.options.template().replace(/\{(.*?)\}/g, function(a, b) {
          return r[b];
        });
        docBody.insertAdjacentHTML('beforeend', render.replace(/> </gi, '><'));
        r = render = null;
        this.modal = $("#" + this.options.modal);
        this.closeHandler = this.modal.querySelector("." + this.css.close);
        this.box = this.modal.querySelector("." + this.css.box);
        if (contentIsStr === false) {
          this.box.appendChild(this.content);
        }
        this.overlayElement = null;
        if (this.options.overlayElement !== null) {
          if (typeof this.options.overlayElement === 'string') {
            this.overlayElement = $(this.options.overlayElement);
          } else {
            if (isElement(this.options.overlayElement === true)) {
              this.overlayElement = this.options.overlayElement;
            }
          }
        }
        this.keyCodes = {
          'esc': 27
        };
        new Tap(this.closeHandler);
        this.closeHandler.addEventListener('tap', this, false);
        this.transitionend = false;
        if (typeof transitionend !== 'undefined') {
          this.transitionend = true;
        }
        if (this.transitionend) {
          this.modal.addEventListener(transitionend, this, false);
        }
        if (this.options.esc === true) {
          this.modal.addEventListener('keyup', this, false);
        }
        this.closeTrigger = false;
        this.destroyed = false;
        return;
      }

      Modal.prototype.getTemplate = function() {
        return '<div tabindex="0" id="{id}" class="{widget} {hidden}"> <div class="{close}"></div> <div class="{box}">{content}</div> </div>'.trim();
      };

      Modal.prototype.overlay = function(add) {
        var css, method, _i, _len, _ref;
        if (add == null) {
          add = false;
        }
        if (this.overlayElement !== null) {
          method = add ? 'add' : 'remove';
          _ref = this.options.overlay.split(' ');
          for (_i = 0, _len = _ref.length; _i < _len; _i++) {
            css = _ref[_i];
            classie[method](this.overlayElement, css);
          }
        }
      };

      Modal.prototype.overflow = function(hidden) {
        var css, method, preventScrollId, _i, _len, _ref;
        if (hidden == null) {
          hidden = false;
        }
        preventScrollId = +docBody.getAttribute('data-prevent');
        preventScrollId = preventScrollId || this.id;
        method = hidden ? 'add' : 'remove';
        if (this.options.preventScroll && preventScrollId === this.id) {
          if (hidden) {
            docBody.setAttribute('data-prevent', this.id);
            this.scrollY = scrollY();
            this.scrollX = scrollX();
          } else {
            docBody.removeAttribute('data-prevent');
            window.scrollTo(this.scrollX, this.scrollY);
          }
          _ref = this.options.htmlBodyOpen.split(' ');
          for (_i = 0, _len = _ref.length; _i < _len; _i++) {
            css = _ref[_i];
            classie[method](docHtml, css);
            classie[method](docBody, css);
          }
        }
      };

      Modal.prototype.onKeyUp = function(event) {
        var trigger;
        switch (event.keyCode) {
          case this.keyCodes.esc:
            trigger = true;
            break;
          default:
            trigger = false;
        }
        if (trigger === true) {
          this.close(null);
        }
        trigger = null;
      };

      Modal.prototype.onTransitionEnd = function() {
        if (this.closeTrigger === true) {
          this.overlay(false);
          this.overflow(false);
          this.closeTrigger = false;
        }
      };

      Modal.prototype.close = function() {
        var css, _i, _len, _ref;
        this.closeTrigger = true;
        if (this.isOpen() === true) {
          _ref = this.options.visible.split(' ');
          for (_i = 0, _len = _ref.length; _i < _len; _i++) {
            css = _ref[_i];
            classie.remove(this.modal, css);
          }
          if (this.transitionend === false) {
            this.onTransitionEnd(null);
          }
          this.emitEvent('close');
        }
      };

      Modal.prototype.open = function() {
        var css, _i, _len, _ref;
        this.closeTrigger = false;
        if (this.isOpen() === false) {
          if (typeof this.options.beforeOpen === 'function') {
            this.options.beforeOpen(this.modal, this.closeHandler, this.box);
          }
          _ref = this.options.visible.split(' ');
          for (_i = 0, _len = _ref.length; _i < _len; _i++) {
            css = _ref[_i];
            classie.add(this.modal, css);
          }
          this.overlay(true);
          this.overflow(true);
          this.modal.focus();
          this.emitEvent('open');
        }
      };

      Modal.prototype.isOpen = function() {
        var isOpen;
        isOpen = classie.has(this.modal, this.css.visible);
        return isOpen;
      };

      Modal.prototype.destroy = function() {
        if (this.destroyed === false) {
          this.closeHandler.removeEventListener('click', this, false);
          if (this.transitionend) {
            this.modal.removeEventListener(transitionend, this, false);
          }
          if (this.options.esc === true) {
            this.modal.removeEventListener('keyup', this, false);
          }
          docBody.removeChild(removeAllChildren(this.modal));
          this.destroyed = true;
        }
      };

      Modal.prototype.handleEvent = function(event) {
        switch (event.type) {
          case 'tap':
            this.close(event);
            break;
          case 'keyup':
            this.onKeyUp(event);
            break;
          case transitionend:
            this.onTransitionEnd(event);
        }
      };

      return Modal;

    })();
    extend(Modal.prototype, EventEmitter.prototype);
    return Modal;
  });

}).call(this);
