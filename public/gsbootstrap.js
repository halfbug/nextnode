/*!
 * Bootstrap v5.1.3 (https://getbootstrap.com/)
 * Copyright 2011-2022 The Bootstrap Authors (https://github.com/twbs/bootstrap/graphs/contributors)
 * Licensed under MIT (https://github.com/twbs/bootstrap/blob/main/LICENSE)
 */
(function (global, factory) {
  typeof exports === 'object' && typeof module !== 'undefined'
    ? (module.exports = factory())
    : typeof define === 'function' && define.amd
    ? define(factory)
    : ((global =
        typeof globalThis !== 'undefined' ? globalThis : global || self),
      (global.gsbootstrap = factory()));
})(this, function () {
  'use strict';

  /**
   * --------------------------------------------------------------------------
   * Bootstrap (v5.1.3): util/index.js
   * Licensed under MIT (https://github.com/twbs/bootstrap/blob/main/LICENSE)
   * --------------------------------------------------------------------------
   */
  const MILLISECONDS_MULTIPLIER = 1000;
  const TRANSITION_END = 'transitionend'; // Shoutout AngusCroll (https://goo.gl/pxwQGp)

  const toType = (object) => {
    if (object === null || object === undefined) {
      return `${object}`;
    }

    return Object.prototype.toString
      .call(object)
      .match(/\s([a-z]+)/i)[1]
      .toLowerCase();
  };

  const getSelector = (element) => {
    let selector = element.getAttribute('data-gs-target');

    if (!selector || selector === '#') {
      let hrefAttribute = element.getAttribute('href'); // The only valid content that could double as a selector are IDs or classes,
      // so everything starting with `#` or `.`. If a "real" URL is used as the selector,
      // `document.querySelector` will rightfully complain it is invalid.
      // See https://github.com/twbs/bootstrap/issues/32273

      if (
        !hrefAttribute ||
        (!hrefAttribute.includes('#') && !hrefAttribute.startsWith('.'))
      ) {
        return null;
      } // Just in case some CMS puts out a full URL with the anchor appended

      if (hrefAttribute.includes('#') && !hrefAttribute.startsWith('#')) {
        hrefAttribute = `#${hrefAttribute.split('#')[1]}`;
      }

      selector =
        hrefAttribute && hrefAttribute !== '#' ? hrefAttribute.trim() : null;
    }

    return selector;
  };

  const getSelectorFromElement = (element) => {
    const selector = getSelector(element);

    if (selector) {
      return document.querySelector(selector) ? selector : null;
    }

    return null;
  };

  const getElementFromSelector = (element) => {
    const selector = getSelector(element);
    return selector ? document.querySelector(selector) : null;
  };

  const getTransitionDurationFromElement = (element) => {
    if (!element) {
      return 0;
    } // Get transition-duration of the element

    let { transitionDuration, transitionDelay } =
      window.getComputedStyle(element);
    const floatTransitionDuration = Number.parseFloat(transitionDuration);
    const floatTransitionDelay = Number.parseFloat(transitionDelay); // Return 0 if element or transition duration is not found

    if (!floatTransitionDuration && !floatTransitionDelay) {
      return 0;
    } // If multiple durations are defined, take the first

    transitionDuration = transitionDuration.split(',')[0];
    transitionDelay = transitionDelay.split(',')[0];
    return (
      (Number.parseFloat(transitionDuration) +
        Number.parseFloat(transitionDelay)) *
      MILLISECONDS_MULTIPLIER
    );
  };

  const triggerTransitionEnd = (element) => {
    element.dispatchEvent(new Event(TRANSITION_END));
  };

  const isElement = (object) => {
    if (!object || typeof object !== 'object') {
      return false;
    }

    if (typeof object.jquery !== 'undefined') {
      object = object[0];
    }

    return typeof object.nodeType !== 'undefined';
  };

  const getElement = (object) => {
    // it's a jQuery object or a node element
    if (isElement(object)) {
      return object.jquery ? object[0] : object;
    }

    if (typeof object === 'string' && object.length > 0) {
      return document.querySelector(object);
    }

    return null;
  };

  const isVisible = (element) => {
    if (!isElement(element) || element.getClientRects().length === 0) {
      return false;
    }

    const elementIsVisible =
      getComputedStyle(element).getPropertyValue('visibility') === 'visible'; // Handle `details` element as its content may falsie appear visible when it is closed

    const closedDetails = element.closest('details:not([open])');

    if (!closedDetails) {
      return elementIsVisible;
    }

    if (closedDetails !== element) {
      const summary = element.closest('summary');

      if (summary && summary.parentNode !== closedDetails) {
        return false;
      }

      if (summary === null) {
        return false;
      }
    }

    return elementIsVisible;
  };

  const isDisabled = (element) => {
    if (!element || element.nodeType !== Node.ELEMENT_NODE) {
      return true;
    }

    if (element.classList.contains('disabled')) {
      return true;
    }

    if (typeof element.disabled !== 'undefined') {
      return element.disabled;
    }

    return (
      element.hasAttribute('disabled') &&
      element.getAttribute('disabled') !== 'false'
    );
  };
  /**
   * Trick to restart an element's animation
   *
   * @param {HTMLElement} element
   * @return void
   *
   * @see https://www.charistheo.io/blog/2021/02/restart-a-css-animation-with-javascript/#restarting-a-css-animation
   */

  const reflow = (element) => {
    element.offsetHeight; // eslint-disable-line no-unused-expressions
  };

  const getjQuery = () => {
    if (window.jQuery && !document.body.hasAttribute('data-gs-no-jquery')) {
      return window.jQuery;
    }

    return null;
  };

  const DOMContentLoadedCallbacks = [];

  const onDOMContentLoaded = (callback) => {
    if (document.readyState === 'loading') {
      // add listener on the first call when the document is in loading state
      if (!DOMContentLoadedCallbacks.length) {
        document.addEventListener('DOMContentLoaded', () => {
          for (const callback of DOMContentLoadedCallbacks) {
            callback();
          }
        });
      }

      DOMContentLoadedCallbacks.push(callback);
    } else {
      callback();
    }
  };

  const isRTL = () => document.documentElement.dir === 'rtl';

  const defineJQueryPlugin = (plugin) => {
    onDOMContentLoaded(() => {
      const $ = getjQuery();
      /* istanbul ignore if */

      if ($) {
        const name = plugin.NAME;
        const JQUERY_NO_CONFLICT = $.fn[name];
        $.fn[name] = plugin.jQueryInterface;
        $.fn[name].Constructor = plugin;

        $.fn[name].noConflict = () => {
          $.fn[name] = JQUERY_NO_CONFLICT;
          return plugin.jQueryInterface;
        };
      }
    });
  };

  const execute = (callback) => {
    if (typeof callback === 'function') {
      callback();
    }
  };

  const executeAfterTransition = (
    callback,
    transitionElement,
    waitForTransition = true,
  ) => {
    if (!waitForTransition) {
      execute(callback);
      return;
    }

    const durationPadding = 5;
    const emulatedDuration =
      getTransitionDurationFromElement(transitionElement) + durationPadding;
    let called = false;

    const handler = ({ target }) => {
      if (target !== transitionElement) {
        return;
      }

      called = true;
      transitionElement.removeEventListener(TRANSITION_END, handler);
      execute(callback);
    };

    transitionElement.addEventListener(TRANSITION_END, handler);
    setTimeout(() => {
      if (!called) {
        triggerTransitionEnd(transitionElement);
      }
    }, emulatedDuration);
  };

  /**
   * --------------------------------------------------------------------------
   * Bootstrap (v5.1.3): dom/event-handler.js
   * Licensed under MIT (https://github.com/twbs/bootstrap/blob/main/LICENSE)
   * --------------------------------------------------------------------------
   */
  /**
   * Constants
   */

  const namespaceRegex = /[^.]*(?=\..*)\.|.*/;
  const stripNameRegex = /\..*/;
  const stripUidRegex = /::\d+$/;
  const eventRegistry = {}; // Events storage

  let uidEvent = 1;
  const customEvents = {
    mouseenter: 'mouseover',
    mouseleave: 'mouseout',
  };
  const customEventsRegex = /^(mouseenter|mouseleave)/i;
  const nativeEvents = new Set([
    'click',
    'dblclick',
    'mouseup',
    'mousedown',
    'contextmenu',
    'mousewheel',
    'DOMMouseScroll',
    'mouseover',
    'mouseout',
    'mousemove',
    'selectstart',
    'selectend',
    'keydown',
    'keypress',
    'keyup',
    'orientationchange',
    'touchstart',
    'touchmove',
    'touchend',
    'touchcancel',
    'pointerdown',
    'pointermove',
    'pointerup',
    'pointerleave',
    'pointercancel',
    'gesturestart',
    'gesturechange',
    'gestureend',
    'focus',
    'blur',
    'change',
    'reset',
    'select',
    'submit',
    'focusin',
    'focusout',
    'load',
    'unload',
    'beforeunload',
    'resize',
    'move',
    'DOMContentLoaded',
    'readystatechange',
    'error',
    'abort',
    'scroll',
  ]);
  /**
   * Private methods
   */

  function getUidEvent(element, uid) {
    return (uid && `${uid}::${uidEvent++}`) || element.uidEvent || uidEvent++;
  }

  function getEvent(element) {
    const uid = getUidEvent(element);
    element.uidEvent = uid;
    eventRegistry[uid] = eventRegistry[uid] || {};
    return eventRegistry[uid];
  }

  function bootstrapHandler(element, fn) {
    return function handler(event) {
      event.delegateTarget = element;

      if (handler.oneOff) {
        EventHandler.off(element, event.type, fn);
      }

      return fn.apply(element, [event]);
    };
  }

  function bootstrapDelegationHandler(element, selector, fn) {
    return function handler(event) {
      const domElements = element.querySelectorAll(selector);

      for (
        let { target } = event;
        target && target !== this;
        target = target.parentNode
      ) {
        for (const domElement of domElements) {
          if (domElement !== target) {
            continue;
          }

          event.delegateTarget = target;

          if (handler.oneOff) {
            EventHandler.off(element, event.type, selector, fn);
          }

          return fn.apply(target, [event]);
        }
      }
    };
  }

  function findHandler(events, handler, delegationSelector = null) {
    return Object.values(events).find(
      (event) =>
        event.originalHandler === handler &&
        event.delegationSelector === delegationSelector,
    );
  }

  function normalizeParameters(originalTypeEvent, handler, delegationFunction) {
    const delegation = typeof handler === 'string';
    const originalHandler = delegation ? delegationFunction : handler;
    let typeEvent = getTypeEvent(originalTypeEvent);

    if (!nativeEvents.has(typeEvent)) {
      typeEvent = originalTypeEvent;
    }

    return [delegation, originalHandler, typeEvent];
  }

  function addHandler(
    element,
    originalTypeEvent,
    handler,
    delegationFunction,
    oneOff,
  ) {
    if (typeof originalTypeEvent !== 'string' || !element) {
      return;
    }

    if (!handler) {
      handler = delegationFunction;
      delegationFunction = null;
    } // in case of mouseenter or mouseleave wrap the handler within a function that checks for its DOM position
    // this prevents the handler from being dispatched the same way as mouseover or mouseout does

    if (customEventsRegex.test(originalTypeEvent)) {
      const wrapFunction = (fn) => {
        return function (event) {
          if (
            !event.relatedTarget ||
            (event.relatedTarget !== event.delegateTarget &&
              !event.delegateTarget.contains(event.relatedTarget))
          ) {
            return fn.call(this, event);
          }
        };
      };

      if (delegationFunction) {
        delegationFunction = wrapFunction(delegationFunction);
      } else {
        handler = wrapFunction(handler);
      }
    }

    const [delegation, originalHandler, typeEvent] = normalizeParameters(
      originalTypeEvent,
      handler,
      delegationFunction,
    );
    const events = getEvent(element);
    const handlers = events[typeEvent] || (events[typeEvent] = {});
    const previousFunction = findHandler(
      handlers,
      originalHandler,
      delegation ? handler : null,
    );

    if (previousFunction) {
      previousFunction.oneOff = previousFunction.oneOff && oneOff;
      return;
    }

    const uid = getUidEvent(
      originalHandler,
      originalTypeEvent.replace(namespaceRegex, ''),
    );
    const fn = delegation
      ? bootstrapDelegationHandler(element, handler, delegationFunction)
      : bootstrapHandler(element, handler);
    fn.delegationSelector = delegation ? handler : null;
    fn.originalHandler = originalHandler;
    fn.oneOff = oneOff;
    fn.uidEvent = uid;
    handlers[uid] = fn;
    element.addEventListener(typeEvent, fn, delegation);
  }

  function removeHandler(
    element,
    events,
    typeEvent,
    handler,
    delegationSelector,
  ) {
    const fn = findHandler(events[typeEvent], handler, delegationSelector);

    if (!fn) {
      return;
    }

    element.removeEventListener(typeEvent, fn, Boolean(delegationSelector));
    delete events[typeEvent][fn.uidEvent];
  }

  function removeNamespacedHandlers(element, events, typeEvent, namespace) {
    const storeElementEvent = events[typeEvent] || {};

    for (const handlerKey of Object.keys(storeElementEvent)) {
      if (handlerKey.includes(namespace)) {
        const event = storeElementEvent[handlerKey];
        removeHandler(
          element,
          events,
          typeEvent,
          event.originalHandler,
          event.delegationSelector,
        );
      }
    }
  }

  function getTypeEvent(event) {
    // allow to get the native events from namespaced events ('click.gsbutton' --> 'click')
    event = event.replace(stripNameRegex, '');
    return customEvents[event] || event;
  }

  const EventHandler = {
    on(element, event, handler, delegationFunction) {
      addHandler(element, event, handler, delegationFunction, false);
    },

    one(element, event, handler, delegationFunction) {
      addHandler(element, event, handler, delegationFunction, true);
    },

    off(element, originalTypeEvent, handler, delegationFunction) {
      if (typeof originalTypeEvent !== 'string' || !element) {
        return;
      }

      const [delegation, originalHandler, typeEvent] = normalizeParameters(
        originalTypeEvent,
        handler,
        delegationFunction,
      );
      const inNamespace = typeEvent !== originalTypeEvent;
      const events = getEvent(element);
      const isNamespace = originalTypeEvent.startsWith('.');

      if (typeof originalHandler !== 'undefined') {
        // Simplest case: handler is passed, remove that listener ONLY.
        if (!events || !events[typeEvent]) {
          return;
        }

        removeHandler(
          element,
          events,
          typeEvent,
          originalHandler,
          delegation ? handler : null,
        );
        return;
      }

      if (isNamespace) {
        for (const elementEvent of Object.keys(events)) {
          removeNamespacedHandlers(
            element,
            events,
            elementEvent,
            originalTypeEvent.slice(1),
          );
        }
      }

      const storeElementEvent = events[typeEvent] || {};

      for (const keyHandlers of Object.keys(storeElementEvent)) {
        const handlerKey = keyHandlers.replace(stripUidRegex, '');

        if (!inNamespace || originalTypeEvent.includes(handlerKey)) {
          const event = storeElementEvent[keyHandlers];
          removeHandler(
            element,
            events,
            typeEvent,
            event.originalHandler,
            event.delegationSelector,
          );
        }
      }
    },

    trigger(element, event, args) {
      if (typeof event !== 'string' || !element) {
        return null;
      }

      const $ = getjQuery();
      const typeEvent = getTypeEvent(event);
      const inNamespace = event !== typeEvent;
      let jQueryEvent = null;
      let bubbles = true;
      let nativeDispatch = true;
      let defaultPrevented = false;

      if (inNamespace && $) {
        jQueryEvent = $.Event(event, args);
        $(element).trigger(jQueryEvent);
        bubbles = !jQueryEvent.isPropagationStopped();
        nativeDispatch = !jQueryEvent.isImmediatePropagationStopped();
        defaultPrevented = jQueryEvent.isDefaultPrevented();
      }

      const evt = new Event(event, {
        bubbles,
        cancelable: true,
      }); // merge custom information in our event

      if (typeof args !== 'undefined') {
        for (const key of Object.keys(args)) {
          Object.defineProperty(evt, key, {
            get() {
              return args[key];
            },
          });
        }
      }

      if (defaultPrevented) {
        evt.preventDefault();
      }

      if (nativeDispatch) {
        element.dispatchEvent(evt);
      }

      if (evt.defaultPrevented && jQueryEvent) {
        jQueryEvent.preventDefault();
      }

      return evt;
    },
  };

  /**
   * --------------------------------------------------------------------------
   * Bootstrap (v5.1.3): dom/data.js
   * Licensed under MIT (https://github.com/twbs/bootstrap/blob/main/LICENSE)
   * --------------------------------------------------------------------------
   */

  /**
   * Constants
   */
  const elementMap = new Map();
  const Data = {
    set(element, key, instance) {
      if (!elementMap.has(element)) {
        elementMap.set(element, new Map());
      }

      const instanceMap = elementMap.get(element); // make it clear we only want one instance per element
      // can be removed later when multiple key/instances are fine to be used

      if (!instanceMap.has(key) && instanceMap.size !== 0) {
        // eslint-disable-next-line no-console
        console.error(
          `Bootstrap doesn't allow more than one instance per element. Bound instance: ${
            Array.from(instanceMap.keys())[0]
          }.`,
        );
        return;
      }

      instanceMap.set(key, instance);
    },

    get(element, key) {
      if (elementMap.has(element)) {
        return elementMap.get(element).get(key) || null;
      }

      return null;
    },

    remove(element, key) {
      if (!elementMap.has(element)) {
        return;
      }

      const instanceMap = elementMap.get(element);
      instanceMap.delete(key); // free up element references if there are no instances left for an element

      if (instanceMap.size === 0) {
        elementMap.delete(element);
      }
    },
  };

  /**
   * --------------------------------------------------------------------------
   * Bootstrap (v5.1.3): dom/manipulator.js
   * Licensed under MIT (https://github.com/twbs/bootstrap/blob/main/LICENSE)
   * --------------------------------------------------------------------------
   */
  function normalizeData(value) {
    if (value === 'true') {
      return true;
    }

    if (value === 'false') {
      return false;
    }

    if (value === Number(value).toString()) {
      return Number(value);
    }

    if (value === '' || value === 'null') {
      return null;
    }

    return value;
  }

  function normalizeDataKey(key) {
    return key.replace(/[A-Z]/g, (chr) => `-${chr.toLowerCase()}`);
  }

  const Manipulator = {
    setDataAttribute(element, key, value) {
      element.setAttribute(`data-gs-${normalizeDataKey(key)}`, value);
    },

    removeDataAttribute(element, key) {
      element.removeAttribute(`data-gs-${normalizeDataKey(key)}`);
    },

    getDataAttributes(element) {
      if (!element) {
        return {};
      }

      const attributes = {};
      const bsKeys = Object.keys(element.dataset).filter((key) =>
        key.startsWith('bs'),
      );

      for (const key of bsKeys) {
        let pureKey = key.replace(/^bs/, '');
        pureKey =
          pureKey.charAt(0).toLowerCase() + pureKey.slice(1, pureKey.length);
        attributes[pureKey] = normalizeData(element.dataset[key]);
      }

      return attributes;
    },

    getDataAttribute(element, key) {
      return normalizeData(
        element.getAttribute(`data-gs-${normalizeDataKey(key)}`),
      );
    },

    offset(element) {
      const rect = element.getBoundingClientRect();
      return {
        top: rect.top + window.pageYOffset,
        left: rect.left + window.pageXOffset,
      };
    },

    position(element) {
      return {
        top: element.offsetTop,
        left: element.offsetLeft,
      };
    },
  };

  /**
   * --------------------------------------------------------------------------
   * Bootstrap (v5.1.3): util/config.js
   * Licensed under MIT (https://github.com/twbs/bootstrap/blob/main/LICENSE)
   * --------------------------------------------------------------------------
   */
  /**
   * Class definition
   */

  class Config {
    // Getters
    static get Default() {
      return {};
    }

    static get DefaultType() {
      return {};
    }

    static get NAME() {
      throw new Error(
        'You have to implement the static method "NAME", for each component!',
      );
    }

    _getConfig(config) {
      config = this._mergeConfigObj(config);
      config = this._configAfterMerge(config);

      this._typeCheckConfig(config);

      return config;
    }

    _configAfterMerge(config) {
      return config;
    }

    _mergeConfigObj(config, element) {
      return {
        ...this.constructor.Default,
        ...(isElement(element) ? Manipulator.getDataAttributes(element) : {}),
        ...(typeof config === 'object' ? config : {}),
      };
    }

    _typeCheckConfig(config, configTypes = this.constructor.DefaultType) {
      for (const property of Object.keys(configTypes)) {
        const expectedTypes = configTypes[property];
        const value = config[property];
        const valueType = isElement(value) ? 'element' : toType(value);

        if (!new RegExp(expectedTypes).test(valueType)) {
          throw new TypeError(
            `${this.constructor.NAME.toUpperCase()}: Option "${property}" provided type "${valueType}" but expected type "${expectedTypes}".`,
          );
        }
      }
    }
  }

  /**
   * --------------------------------------------------------------------------
   * Bootstrap (v5.1.3): base-component.js
   * Licensed under MIT (https://github.com/twbs/bootstrap/blob/main/LICENSE)
   * --------------------------------------------------------------------------
   */
  /**
   * Constants
   */

  const VERSION = '5.1.3';
  /**
   * Class definition
   */

  class BaseComponent extends Config {
    constructor(element, config) {
      super();
      element = getElement(element);

      if (!element) {
        return;
      }

      this._element = element;
      this._config = this._getConfig(config);
      Data.set(this._element, this.constructor.DATA_KEY, this);
    } // Public

    dispose() {
      Data.remove(this._element, this.constructor.DATA_KEY);
      EventHandler.off(this._element, this.constructor.EVENT_KEY);

      for (const propertyName of Object.getOwnPropertyNames(this)) {
        this[propertyName] = null;
      }
    }

    _queueCallback(callback, element, isAnimated = true) {
      executeAfterTransition(callback, element, isAnimated);
    }

    _getConfig(config) {
      config = this._mergeConfigObj(config, this._element);
      config = this._configAfterMerge(config);

      this._typeCheckConfig(config);

      return config;
    } // Static

    static getInstance(element) {
      return Data.get(getElement(element), this.DATA_KEY);
    }

    static getOrCreateInstance(element, config = {}) {
      return (
        this.getInstance(element) ||
        new this(element, typeof config === 'object' ? config : null)
      );
    }

    static get VERSION() {
      return VERSION;
    }

    static get DATA_KEY() {
      return `gs.${this.NAME}`;
    }

    static get EVENT_KEY() {
      return `.${this.DATA_KEY}`;
    }

    static eventName(name) {
      return `${name}${this.EVENT_KEY}`;
    }
  }

  /**
   * --------------------------------------------------------------------------
   * Bootstrap (v5.1.3): button.js
   * Licensed under MIT (https://github.com/twbs/bootstrap/blob/main/LICENSE)
   * --------------------------------------------------------------------------
   */
  /**
   * Constants
   */

  const NAME$4 = 'groupshop_button';
  const DATA_KEY$3 = 'gs.groupshop_button';
  const EVENT_KEY$3 = `.${DATA_KEY$3}`;
  const DATA_API_KEY$2 = '.groupshop_data-api';
  const CLASS_NAME_ACTIVE$1 = 'active';
  const SELECTOR_DATA_TOGGLE$1 = '[data-gs-toggle="button"]';
  const EVENT_CLICK_DATA_API$1 = `click${EVENT_KEY$3}${DATA_API_KEY$2}`;
  /**
   * Class definition
   */

  class Button extends BaseComponent {
    // Getters
    static get NAME() {
      return NAME$4;
    } // Public

    toggle() {
      // Toggle class and sync the `aria-pressed` attribute with the return value of the `.toggle()` method
      this._element.setAttribute(
        'aria-pressed',
        this._element.classList.toggle(CLASS_NAME_ACTIVE$1),
      );
    } // Static

    static jQueryInterface(config) {
      return this.each(function () {
        const data = Button.getOrCreateInstance(this);

        if (config === 'toggle') {
          data[config]();
        }
      });
    }
  }
  /**
   * Data API implementation
   */

  EventHandler.on(
    document,
    EVENT_CLICK_DATA_API$1,
    SELECTOR_DATA_TOGGLE$1,
    (event) => {
      event.preventDefault();
      const button = event.target.closest(SELECTOR_DATA_TOGGLE$1);
      const data = Button.getOrCreateInstance(button);
      data.toggle();
    },
  );
  /**
   * jQuery
   */

  defineJQueryPlugin(Button);

  /**
   * --------------------------------------------------------------------------
   * Bootstrap (v5.1.3): dom/selector-engine.js
   * Licensed under MIT (https://github.com/twbs/bootstrap/blob/main/LICENSE)
   * --------------------------------------------------------------------------
   */
  /**
   * Constants
   */

  const SelectorEngine = {
    find(selector, element = document.documentElement) {
      return [].concat(
        ...Element.prototype.querySelectorAll.call(element, selector),
      );
    },

    findOne(selector, element = document.documentElement) {
      return Element.prototype.querySelector.call(element, selector);
    },

    children(element, selector) {
      return []
        .concat(...element.children)
        .filter((child) => child.matches(selector));
    },

    parents(element, selector) {
      const parents = [];
      let ancestor = element.parentNode.closest(selector);

      while (ancestor) {
        parents.push(ancestor);
        ancestor = ancestor.parentNode.closest(selector);
      }

      return parents;
    },

    prev(element, selector) {
      let previous = element.previousElementSibling;

      while (previous) {
        if (previous.matches(selector)) {
          return [previous];
        }

        previous = previous.previousElementSibling;
      }

      return [];
    },

    // TODO: this is now unused; remove later along with prev()
    next(element, selector) {
      let next = element.nextElementSibling;

      while (next) {
        if (next.matches(selector)) {
          return [next];
        }

        next = next.nextElementSibling;
      }

      return [];
    },

    focusableChildren(element) {
      const focusables = [
        'a',
        'button',
        'input',
        'textarea',
        'select',
        'details',
        '[tabindex]',
        '[contenteditable="true"]',
      ]
        .map((selector) => `${selector}:not([tabindex^="-"])`)
        .join(',');
      return this.find(focusables, element).filter(
        (el) => !isDisabled(el) && isVisible(el),
      );
    },
  };

  /**
   * --------------------------------------------------------------------------
   * Bootstrap (v5.1.3): util/scrollBar.js
   * Licensed under MIT (https://github.com/twbs/bootstrap/blob/main/LICENSE)
   * --------------------------------------------------------------------------
   */
  /**
   * Constants
   */

  const SELECTOR_FIXED_CONTENT =
    '.fixed-top, .fixed-bottom, .is-fixed, .sticky-top';
  const SELECTOR_STICKY_CONTENT = '.sticky-top';
  const PROPERTY_PADDING = 'padding-right';
  const PROPERTY_MARGIN = 'margin-right';
  /**
   * Class definition
   */

  class ScrollBarHelper {
    constructor() {
      this._element = document.body;
    } // Public

    getWidth() {
      // https://developer.mozilla.org/en-US/docs/Web/API/Window/innerWidth#usage_notes
      const documentWidth = document.documentElement.clientWidth;
      return Math.abs(window.innerWidth - documentWidth);
    }

    hide() {
      const width = this.getWidth();

      this._disableOverFlow(); // give padding to element to balance the hidden scrollbar width

      this._setElementAttributes(
        this._element,
        PROPERTY_PADDING,
        (calculatedValue) => calculatedValue + width,
      ); // trick: We adjust positive paddingRight and negative marginRight to sticky-top elements to keep showing fullwidth

      this._setElementAttributes(
        SELECTOR_FIXED_CONTENT,
        PROPERTY_PADDING,
        (calculatedValue) => calculatedValue + width,
      );

      this._setElementAttributes(
        SELECTOR_STICKY_CONTENT,
        PROPERTY_MARGIN,
        (calculatedValue) => calculatedValue - width,
      );
    }

    reset() {
      this._resetElementAttributes(this._element, 'overflow');

      this._resetElementAttributes(this._element, PROPERTY_PADDING);

      this._resetElementAttributes(SELECTOR_FIXED_CONTENT, PROPERTY_PADDING);

      this._resetElementAttributes(SELECTOR_STICKY_CONTENT, PROPERTY_MARGIN);
    }

    isOverflowing() {
      return this.getWidth() > 0;
    } // Private

    _disableOverFlow() {
      this._saveInitialAttribute(this._element, 'overflow');

      this._element.style.overflow = 'hidden';
    }

    _setElementAttributes(selector, styleProperty, callback) {
      const scrollbarWidth = this.getWidth();

      const manipulationCallBack = (element) => {
        if (
          element !== this._element &&
          window.innerWidth > element.clientWidth + scrollbarWidth
        ) {
          return;
        }

        this._saveInitialAttribute(element, styleProperty);

        const calculatedValue = window
          .getComputedStyle(element)
          .getPropertyValue(styleProperty);
        element.style.setProperty(
          styleProperty,
          `${callback(Number.parseFloat(calculatedValue))}px`,
        );
      };

      this._applyManipulationCallback(selector, manipulationCallBack);
    }

    _saveInitialAttribute(element, styleProperty) {
      const actualValue = element.style.getPropertyValue(styleProperty);

      if (actualValue) {
        Manipulator.setDataAttribute(element, styleProperty, actualValue);
      }
    }

    _resetElementAttributes(selector, styleProperty) {
      const manipulationCallBack = (element) => {
        const value = Manipulator.getDataAttribute(element, styleProperty); // We only want to remove the property if the value is `null`; the value can also be zero

        if (value === null) {
          element.style.removeProperty(styleProperty);
          return;
        }

        Manipulator.removeDataAttribute(element, styleProperty);
        element.style.setProperty(styleProperty, value);
      };

      this._applyManipulationCallback(selector, manipulationCallBack);
    }

    _applyManipulationCallback(selector, callBack) {
      if (isElement(selector)) {
        callBack(selector);
        return;
      }

      for (const sel of SelectorEngine.find(selector, this._element)) {
        callBack(sel);
      }
    }
  }

  /**
   * --------------------------------------------------------------------------
   * Bootstrap (v5.1.3): util/backdrop.js
   * Licensed under MIT (https://github.com/twbs/bootstrap/blob/main/LICENSE)
   * --------------------------------------------------------------------------
   */
  /**
   * Constants
   */

  const NAME$3 = 'groupshop_backdrop';
  const CLASS_NAME_FADE$1 = 'groupshop_fade';
  const CLASS_NAME_SHOW$1 = 'groupshop_show';
  const EVENT_MOUSEDOWN = `mousedown.gs${NAME$3}`;
  const Default$3 = {
    className: 'groupshop_modal-backdrop',
    isVisible: true,
    // if false, we use the backdrop helper without adding any element to the dom
    isAnimated: false,
    rootElement: 'body',
    // give the choice to place backdrop under different elements
    clickCallback: null,
  };
  const DefaultType$3 = {
    className: 'string',
    isVisible: 'boolean',
    isAnimated: 'boolean',
    rootElement: '(element|string)',
    clickCallback: '(function|null)',
  };
  /**
   * Class definition
   */

  class Backdrop extends Config {
    constructor(config) {
      super();
      this._config = this._getConfig(config);
      this._isAppended = false;
      this._element = null;
    } // Getters

    static get Default() {
      return Default$3;
    }

    static get DefaultType() {
      return DefaultType$3;
    }

    static get NAME() {
      return NAME$3;
    } // Public

    show(callback) {
      if (!this._config.isVisible) {
        execute(callback);
        return;
      }

      this._append();

      const element = this._getElement();

      if (this._config.isAnimated) {
        reflow(element);
      }

      element.classList.add(CLASS_NAME_SHOW$1);

      this._emulateAnimation(() => {
        execute(callback);
      });
    }

    hide(callback) {
      if (!this._config.isVisible) {
        execute(callback);
        return;
      }

      this._getElement().classList.remove(CLASS_NAME_SHOW$1);

      this._emulateAnimation(() => {
        this.dispose();
        execute(callback);
      });
    }

    dispose() {
      if (!this._isAppended) {
        return;
      }

      EventHandler.off(this._element, EVENT_MOUSEDOWN);

      this._element.remove();

      this._isAppended = false;
    } // Private

    _getElement() {
      if (!this._element) {
        const backdrop = document.createElement('div');
        backdrop.className = this._config.className;

        if (this._config.isAnimated) {
          backdrop.classList.add(CLASS_NAME_FADE$1);
        }

        this._element = backdrop;
      }

      return this._element;
    }

    _configAfterMerge(config) {
      // use getElement() with the default "body" to get a fresh Element on each instantiation
      config.rootElement = getElement(config.rootElement);
      return config;
    }

    _append() {
      if (this._isAppended) {
        return;
      }

      const element = this._getElement();

      this._config.rootElement.append(element);

      EventHandler.on(element, EVENT_MOUSEDOWN, () => {
        execute(this._config.clickCallback);
      });
      this._isAppended = true;
    }

    _emulateAnimation(callback) {
      executeAfterTransition(
        callback,
        this._getElement(),
        this._config.isAnimated,
      );
    }
  }

  /**
   * --------------------------------------------------------------------------
   * Bootstrap (v5.1.3): util/focustrap.js
   * Licensed under MIT (https://github.com/twbs/bootstrap/blob/main/LICENSE)
   * --------------------------------------------------------------------------
   */
  /**
   * Constants
   */

  const NAME$2 = 'groupshop_focustrap';
  const DATA_KEY$2 = 'gs.focustrap';
  const EVENT_KEY$2 = `.${DATA_KEY$2}`;
  const EVENT_FOCUSIN = `focusin${EVENT_KEY$2}`;
  const EVENT_KEYDOWN_TAB = `keydown.tab${EVENT_KEY$2}`;
  const TAB_KEY = 'Tab';
  const TAB_NAV_FORWARD = 'forward';
  const TAB_NAV_BACKWARD = 'backward';
  const Default$2 = {
    trapElement: null,
    // The element to trap focus inside of
    autofocus: true,
  };
  const DefaultType$2 = {
    trapElement: 'element',
    autofocus: 'boolean',
  };
  /**
   * Class definition
   */

  class FocusTrap extends Config {
    constructor(config) {
      super();
      this._config = this._getConfig(config);
      this._isActive = false;
      this._lastTabNavDirection = null;
    } // Getters

    static get Default() {
      return Default$2;
    }

    static get DefaultType() {
      return DefaultType$2;
    }

    static get NAME() {
      return NAME$2;
    } // Public

    activate() {
      if (this._isActive) {
        return;
      }

      if (this._config.autofocus) {
        this._config.trapElement.focus();
      }

      EventHandler.off(document, EVENT_KEY$2); // guard against infinite focus loop

      EventHandler.on(document, EVENT_FOCUSIN, (event) =>
        this._handleFocusin(event),
      );
      EventHandler.on(document, EVENT_KEYDOWN_TAB, (event) =>
        this._handleKeydown(event),
      );
      this._isActive = true;
    }

    deactivate() {
      if (!this._isActive) {
        return;
      }

      this._isActive = false;
      EventHandler.off(document, EVENT_KEY$2);
    } // Private

    _handleFocusin(event) {
      const { trapElement } = this._config;

      if (
        event.target === document ||
        event.target === trapElement ||
        trapElement.contains(event.target)
      ) {
        return;
      }

      const elements = SelectorEngine.focusableChildren(trapElement);

      if (elements.length === 0) {
        trapElement.focus();
      } else if (this._lastTabNavDirection === TAB_NAV_BACKWARD) {
        elements[elements.length - 1].focus();
      } else {
        elements[0].focus();
      }
    }

    _handleKeydown(event) {
      if (event.key !== TAB_KEY) {
        return;
      }

      this._lastTabNavDirection = event.shiftKey
        ? TAB_NAV_BACKWARD
        : TAB_NAV_FORWARD;
    }
  }

  /**
   * --------------------------------------------------------------------------
   * Bootstrap (v5.1.3): util/component-functions.js
   * Licensed under MIT (https://github.com/twbs/bootstrap/blob/main/LICENSE)
   * --------------------------------------------------------------------------
   */

  const enableDismissTrigger = (component, method = 'hide') => {
    const clickEvent = `click.dismiss${component.EVENT_KEY}`;
    const name = component.NAME;
    EventHandler.on(
      document,
      clickEvent,
      `[data-gs-dismiss="${name}"]`,
      function (event) {
        if (['A', 'AREA'].includes(this.tagName)) {
          event.preventDefault();
        }

        if (isDisabled(this)) {
          return;
        }

        const target = getElementFromSelector(this) || this.closest(`.${name}`);
        const instance = component.getOrCreateInstance(target); // Method argument is left, for Alert and only, as it doesn't implement the 'hide' method

        instance[method]();
      },
    );
  };

  /**
   * --------------------------------------------------------------------------
   * Bootstrap (v5.1.3): modal.js
   * Licensed under MIT (https://github.com/twbs/bootstrap/blob/main/LICENSE)
   * --------------------------------------------------------------------------
   */
  /**
   * Constants
   */

  const NAME$1 = 'groupshop_modal';
  const DATA_KEY$1 = 'gs.groupshop_modal';
  const EVENT_KEY$1 = `.${DATA_KEY$1}`;
  const DATA_API_KEY$1 = '.groupshop_data-api';
  const ESCAPE_KEY = 'Escape';
  const EVENT_HIDE = `hide${EVENT_KEY$1}`;
  const EVENT_HIDE_PREVENTED = `hidePrevented${EVENT_KEY$1}`;
  const EVENT_HIDDEN = `hidden${EVENT_KEY$1}`;
  const EVENT_SHOW = `show${EVENT_KEY$1}`;
  const EVENT_SHOWN = `shown${EVENT_KEY$1}`;
  const EVENT_RESIZE = `resize${EVENT_KEY$1}`;
  const EVENT_KEYDOWN_DISMISS = `keydown.dismiss${EVENT_KEY$1}`;
  const EVENT_CLICK_DATA_API = `click${EVENT_KEY$1}${DATA_API_KEY$1}`;
  const CLASS_NAME_OPEN = 'groupshop_modal-open';
  const CLASS_NAME_FADE = 'groupshop_fade';
  const CLASS_NAME_SHOW = 'groupshop_show';
  const CLASS_NAME_STATIC = 'groupshop_modal-static';
  const OPEN_SELECTOR = '.groupshop_modal.groupshop_show';
  const SELECTOR_DIALOG = '.groupshop_modal-dialog';
  const SELECTOR_MODAL_BODY = '.groupshop_modal-body';
  const SELECTOR_DATA_TOGGLE = '[data-gs-toggle="groupshop_modal"]';
  const Default$1 = {
    backdrop: true,
    keyboard: true,
    focus: true,
  };
  const DefaultType$1 = {
    backdrop: '(boolean|string)',
    keyboard: 'boolean',
    focus: 'boolean',
  };
  /**
   * Class definition
   */

  class Modal extends BaseComponent {
    constructor(element, config) {
      super(element, config);
      this._dialog = SelectorEngine.findOne(SELECTOR_DIALOG, this._element);
      this._backdrop = this._initializeBackDrop();
      this._focustrap = this._initializeFocusTrap();
      this._isShown = false;
      this._isTransitioning = false;
      this._scrollBar = new ScrollBarHelper();

      this._addEventListeners();
    } // Getters

    static get Default() {
      return Default$1;
    }

    static get DefaultType() {
      return DefaultType$1;
    }

    static get NAME() {
      return NAME$1;
    } // Public

    toggle(relatedTarget) {
      return this._isShown ? this.hide() : this.show(relatedTarget);
    }

    show(relatedTarget) {
      if (this._isShown || this._isTransitioning) {
        return;
      }

      const showEvent = EventHandler.trigger(this._element, EVENT_SHOW, {
        relatedTarget,
      });

      if (showEvent.defaultPrevented) {
        return;
      }

      this._isShown = true;
      this._isTransitioning = true;

      this._scrollBar.hide();

      document.body.classList.add(CLASS_NAME_OPEN);

      this._adjustDialog();

      this._backdrop.show(() => this._showElement(relatedTarget));
    }

    hide() {
      if (!this._isShown || this._isTransitioning) {
        return;
      }

      const hideEvent = EventHandler.trigger(this._element, EVENT_HIDE);

      if (hideEvent.defaultPrevented) {
        return;
      }

      this._isShown = false;
      this._isTransitioning = true;

      this._focustrap.deactivate();

      this._element.classList.remove(CLASS_NAME_SHOW);

      this._queueCallback(
        () => this._hideModal(),
        this._element,
        this._isAnimated(),
      );
    }

    dispose() {
      for (const htmlElement of [window, this._dialog]) {
        EventHandler.off(htmlElement, EVENT_KEY$1);
      }

      this._backdrop.dispose();

      this._focustrap.deactivate();

      super.dispose();
    }

    handleUpdate() {
      this._adjustDialog();
    } // Private

    _initializeBackDrop() {
      const clickCallback = () => {
        if (this._config.backdrop === 'static') {
          this._triggerBackdropTransition();

          return;
        }

        this.hide();
      }; // 'static' option will be translated to true, and booleans will keep their value

      const isVisible = Boolean(this._config.backdrop);
      return new Backdrop({
        isVisible,
        isAnimated: this._isAnimated(),
        clickCallback: isVisible ? clickCallback : null,
      });
    }

    _initializeFocusTrap() {
      return new FocusTrap({
        trapElement: this._element,
      });
    }

    _showElement(relatedTarget) {
      // try to append dynamic modal
      if (!document.body.contains(this._element)) {
        document.body.append(this._element);
      }

      this._element.style.display = 'block';

      this._element.removeAttribute('aria-hidden');

      this._element.setAttribute('aria-modal', true);

      this._element.setAttribute('role', 'dialog');

      this._element.scrollTop = 0;
      const modalBody = SelectorEngine.findOne(
        SELECTOR_MODAL_BODY,
        this._dialog,
      );

      if (modalBody) {
        modalBody.scrollTop = 0;
      }

      reflow(this._element);

      this._element.classList.add(CLASS_NAME_SHOW);

      const transitionComplete = () => {
        if (this._config.focus) {
          this._focustrap.activate();
        }

        this._isTransitioning = false;
        EventHandler.trigger(this._element, EVENT_SHOWN, {
          relatedTarget,
        });
      };

      this._queueCallback(transitionComplete, this._dialog, this._isAnimated());
    }

    _addEventListeners() {
      EventHandler.on(this._element, EVENT_KEYDOWN_DISMISS, (event) => {
        if (event.key !== ESCAPE_KEY) {
          return;
        }

        if (this._config.keyboard) {
          event.preventDefault();
          this.hide();
          return;
        }

        this._triggerBackdropTransition();
      });
      EventHandler.on(window, EVENT_RESIZE, () => {
        if (this._isShown && !this._isTransitioning) {
          this._adjustDialog();
        }
      });
    }

    _hideModal() {
      this._element.style.display = 'none';

      this._element.setAttribute('aria-hidden', true);

      this._element.removeAttribute('aria-modal');

      this._element.removeAttribute('role');

      this._isTransitioning = false;

      this._backdrop.hide(() => {
        document.body.classList.remove(CLASS_NAME_OPEN);

        this._resetAdjustments();

        this._scrollBar.reset();

        EventHandler.trigger(this._element, EVENT_HIDDEN);
      });
    }

    _isAnimated() {
      return this._element.classList.contains(CLASS_NAME_FADE);
    }

    _triggerBackdropTransition() {
      const hideEvent = EventHandler.trigger(
        this._element,
        EVENT_HIDE_PREVENTED,
      );

      if (hideEvent.defaultPrevented) {
        return;
      }

      const isModalOverflowing =
        this._element.scrollHeight > document.documentElement.clientHeight;
      const initialOverflowY = this._element.style.overflowY; // return if the following background transition hasn't yet completed

      if (
        initialOverflowY === 'hidden' ||
        this._element.classList.contains(CLASS_NAME_STATIC)
      ) {
        return;
      }

      if (!isModalOverflowing) {
        this._element.style.overflowY = 'hidden';
      }

      this._element.classList.add(CLASS_NAME_STATIC);

      this._queueCallback(() => {
        this._element.classList.remove(CLASS_NAME_STATIC);

        this._queueCallback(() => {
          this._element.style.overflowY = initialOverflowY;
        }, this._dialog);
      }, this._dialog);

      this._element.focus();
    }
    /**
     * The following methods are used to handle overflowing modals
     */

    _adjustDialog() {
      const isModalOverflowing =
        this._element.scrollHeight > document.documentElement.clientHeight;

      const scrollbarWidth = this._scrollBar.getWidth();

      const isBodyOverflowing = scrollbarWidth > 0;

      if (isBodyOverflowing && !isModalOverflowing) {
        const property = isRTL() ? 'paddingLeft' : 'paddingRight';
        this._element.style[property] = `${scrollbarWidth}px`;
      }

      if (!isBodyOverflowing && isModalOverflowing) {
        const property = isRTL() ? 'paddingRight' : 'paddingLeft';
        this._element.style[property] = `${scrollbarWidth}px`;
      }
    }

    _resetAdjustments() {
      this._element.style.paddingLeft = '';
      this._element.style.paddingRight = '';
    } // Static

    static jQueryInterface(config, relatedTarget) {
      return this.each(function () {
        const data = Modal.getOrCreateInstance(this, config);

        if (typeof config !== 'string') {
          return;
        }

        if (typeof data[config] === 'undefined') {
          throw new TypeError(`No method named "${config}"`);
        }

        data[config](relatedTarget);
      });
    }
  }
  /**
   * Data API implementation
   */

  EventHandler.on(
    document,
    EVENT_CLICK_DATA_API,
    SELECTOR_DATA_TOGGLE,
    function (event) {
      const target = getElementFromSelector(this);

      if (['A', 'AREA'].includes(this.tagName)) {
        event.preventDefault();
      }

      EventHandler.one(target, EVENT_SHOW, (showEvent) => {
        if (showEvent.defaultPrevented) {
          // only register focus restorer if modal will actually get shown
          return;
        }

        EventHandler.one(target, EVENT_HIDDEN, () => {
          if (isVisible(this)) {
            this.focus();
          }
        });
      }); // avoid conflict when clicking modal toggler while another one is open

      const alreadyOpen = SelectorEngine.findOne(OPEN_SELECTOR);

      if (alreadyOpen) {
        Modal.getInstance(alreadyOpen).hide();
      }

      const data = Modal.getOrCreateInstance(target);
      data.toggle(this);
    },
  );
  enableDismissTrigger(Modal);
  /**
   * jQuery
   */

  defineJQueryPlugin(Modal);

  /**
   * --------------------------------------------------------------------------
   * Bootstrap (v5.1.3): scrollspy.js
   * Licensed under MIT (https://github.com/twbs/bootstrap/blob/main/LICENSE)
   * --------------------------------------------------------------------------
   */
  /**
   * Constants
   */

  const NAME = 'groupshop_scrollspy';
  const DATA_KEY = 'gs.scrollspy';
  const EVENT_KEY = `.${DATA_KEY}`;
  const DATA_API_KEY = '.groupshop_data-api';
  const EVENT_ACTIVATE = `activate${EVENT_KEY}`;
  const EVENT_SCROLL = `scroll${EVENT_KEY}`;
  const EVENT_LOAD_DATA_API = `load${EVENT_KEY}${DATA_API_KEY}`;
  const CLASS_NAME_DROPDOWN_ITEM = 'dropdown-item';
  const CLASS_NAME_ACTIVE = 'active';
  const SELECTOR_DATA_SPY = '[data-gs-spy="scroll"]';
  const SELECTOR_NAV_LIST_GROUP = '.nav, .list-group';
  const SELECTOR_NAV_LINKS = '.nav-link';
  const SELECTOR_NAV_ITEMS = '.nav-item';
  const SELECTOR_LIST_ITEMS = '.list-group-item';
  const SELECTOR_LINK_ITEMS = `${SELECTOR_NAV_LINKS}, ${SELECTOR_LIST_ITEMS}, .${CLASS_NAME_DROPDOWN_ITEM}`;
  const SELECTOR_DROPDOWN = '.dropdown';
  const SELECTOR_DROPDOWN_TOGGLE = '.dropdown-toggle';
  const METHOD_OFFSET = 'offset';
  const METHOD_POSITION = 'position';
  const Default = {
    offset: 10,
    method: 'auto',
    target: '',
  };
  const DefaultType = {
    offset: 'number',
    method: 'string',
    target: '(string|element)',
  };
  /**
   * Class definition
   */

  class ScrollSpy extends BaseComponent {
    constructor(element, config) {
      super(element, config);
      this._scrollElement =
        this._element.tagName === 'BODY' ? window : this._element;
      this._offsets = [];
      this._targets = [];
      this._activeTarget = null;
      this._scrollHeight = 0;
      EventHandler.on(this._scrollElement, EVENT_SCROLL, () => this._process());
      this.refresh();

      this._process();
    } // Getters

    static get Default() {
      return Default;
    }

    static get DefaultType() {
      return DefaultType;
    }

    static get NAME() {
      return NAME;
    } // Public

    refresh() {
      this._offsets = [];
      this._targets = [];
      this._scrollHeight = this._getScrollHeight();
      const autoMethod =
        this._scrollElement === this._scrollElement.window
          ? METHOD_OFFSET
          : METHOD_POSITION;
      const offsetMethod =
        this._config.method === 'auto' ? autoMethod : this._config.method;
      const offsetBase =
        offsetMethod === METHOD_POSITION ? this._getScrollTop() : 0;
      const targets = SelectorEngine.find(
        SELECTOR_LINK_ITEMS,
        this._config.target,
      )
        .map((element) => {
          const targetSelector = getSelectorFromElement(element);
          const target = targetSelector
            ? SelectorEngine.findOne(targetSelector)
            : null;

          if (!target) {
            return null;
          }

          const targetBCR = target.getBoundingClientRect();
          return targetBCR.width || targetBCR.height
            ? [
                Manipulator[offsetMethod](target).top + offsetBase,
                targetSelector,
              ]
            : null;
        })
        .filter(Boolean)
        .sort((a, b) => a[0] - b[0]);

      for (const target of targets) {
        this._offsets.push(target[0]);

        this._targets.push(target[1]);
      }
    }

    dispose() {
      EventHandler.off(this._scrollElement, EVENT_KEY);
      super.dispose();
    } // Private

    _configAfterMerge(config) {
      config.target = getElement(config.target) || document.documentElement;
      return config;
    }

    _getScrollTop() {
      return this._scrollElement === window
        ? this._scrollElement.pageYOffset
        : this._scrollElement.scrollTop;
    }

    _getScrollHeight() {
      return (
        this._scrollElement.scrollHeight ||
        Math.max(
          document.body.scrollHeight,
          document.documentElement.scrollHeight,
        )
      );
    }

    _getOffsetHeight() {
      return this._scrollElement === window
        ? window.innerHeight
        : this._scrollElement.getBoundingClientRect().height;
    }

    _process() {
      const scrollTop = this._getScrollTop() + this._config.offset;

      const scrollHeight = this._getScrollHeight();

      const maxScroll =
        this._config.offset + scrollHeight - this._getOffsetHeight();

      if (this._scrollHeight !== scrollHeight) {
        this.refresh();
      }

      if (scrollTop >= maxScroll) {
        const target = this._targets[this._targets.length - 1];

        if (this._activeTarget !== target) {
          this._activate(target);
        }

        return;
      }

      if (
        this._activeTarget &&
        scrollTop < this._offsets[0] &&
        this._offsets[0] > 0
      ) {
        this._activeTarget = null;

        this._clear();

        return;
      }

      for (const i of this._offsets.keys()) {
        const isActiveTarget =
          this._activeTarget !== this._targets[i] &&
          scrollTop >= this._offsets[i] &&
          (typeof this._offsets[i + 1] === 'undefined' ||
            scrollTop < this._offsets[i + 1]);

        if (isActiveTarget) {
          this._activate(this._targets[i]);
        }
      }
    }

    _activate(target) {
      this._activeTarget = target;

      this._clear();

      const queries = SELECTOR_LINK_ITEMS.split(',').map(
        (selector) =>
          `${selector}[data-gs-target="${target}"],${selector}[href="${target}"]`,
      );
      const link = SelectorEngine.findOne(
        queries.join(','),
        this._config.target,
      );
      link.classList.add(CLASS_NAME_ACTIVE);

      if (link.classList.contains(CLASS_NAME_DROPDOWN_ITEM)) {
        SelectorEngine.findOne(
          SELECTOR_DROPDOWN_TOGGLE,
          link.closest(SELECTOR_DROPDOWN),
        ).classList.add(CLASS_NAME_ACTIVE);
      } else {
        for (const listGroup of SelectorEngine.parents(
          link,
          SELECTOR_NAV_LIST_GROUP,
        )) {
          // Set triggered links parents as active
          // With both <ul> and <nav> markup a parent is the previous sibling of any nav ancestor
          for (const item of SelectorEngine.prev(
            listGroup,
            `${SELECTOR_NAV_LINKS}, ${SELECTOR_LIST_ITEMS}`,
          )) {
            item.classList.add(CLASS_NAME_ACTIVE);
          } // Handle special case when .nav-link is inside .nav-item

          for (const navItem of SelectorEngine.prev(
            listGroup,
            SELECTOR_NAV_ITEMS,
          )) {
            for (const item of SelectorEngine.children(
              navItem,
              SELECTOR_NAV_LINKS,
            )) {
              item.classList.add(CLASS_NAME_ACTIVE);
            }
          }
        }
      }

      EventHandler.trigger(this._scrollElement, EVENT_ACTIVATE, {
        relatedTarget: target,
      });
    }

    _clear() {
      const activeNodes = SelectorEngine.find(
        SELECTOR_LINK_ITEMS,
        this._config.target,
      ).filter((node) => node.classList.contains(CLASS_NAME_ACTIVE));

      for (const node of activeNodes) {
        node.classList.remove(CLASS_NAME_ACTIVE);
      }
    } // Static

    static jQueryInterface(config) {
      return this.each(function () {
        const data = ScrollSpy.getOrCreateInstance(this, config);

        if (typeof config !== 'string') {
          return;
        }

        if (typeof data[config] === 'undefined') {
          throw new TypeError(`No method named "${config}"`);
        }

        data[config]();
      });
    }
  }
  /**
   * Data API implementation
   */

  EventHandler.on(window, EVENT_LOAD_DATA_API, () => {
    for (const spy of SelectorEngine.find(SELECTOR_DATA_SPY)) {
      new ScrollSpy(spy); // eslint-disable-line no-new
    }
  });
  /**
   * jQuery
   */

  defineJQueryPlugin(ScrollSpy);

  /**
   * --------------------------------------------------------------------------
   * Bootstrap (v5.1.3): index.umd.js
   * Licensed under MIT (https://github.com/twbs/bootstrap/blob/main/LICENSE)
   * --------------------------------------------------------------------------
   */
  const index_umd = {
    // Alert,
    Button,
    // Carousel,
    // Collapse,
    // Dropdown,
    Modal,
    // Offcanvas,
    // Popover,
    ScrollSpy, // Tab,
    // Toast,
    // Tooltip
  };

  return index_umd;
});

