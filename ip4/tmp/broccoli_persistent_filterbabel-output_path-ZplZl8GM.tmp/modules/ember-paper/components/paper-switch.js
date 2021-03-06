/**
 * @module ember-paper
 */
import Ember from 'ember';
import layout from '../templates/components/paper-switch';
import FocusableMixin from 'ember-paper/mixins/focusable-mixin';
import RippleMixin from 'ember-paper/mixins/ripple-mixin';
import ColorMixin from 'ember-paper/mixins/color-mixin';
import ProxiableMixin from 'ember-paper/mixins/proxiable-mixin';

var Component = Ember.Component;
var assert = Ember.assert;
var computed = Ember.computed;
var get = Ember.get;
var run = Ember.run;
var htmlSafe = Ember.String.htmlSafe;
var inject = Ember.inject;

/* global Hammer */

/**
 * @class PaperSwitch
 * @extends Ember.Component
 * @uses FocusableMixin
 * @uses RippleMixin
 * @uses ColorMixin
 * @uses ProxiableMixin
 */
export default Component.extend(FocusableMixin, RippleMixin, ColorMixin, ProxiableMixin, {
  layout: layout,
  tagName: 'md-switch',
  classNames: ['paper-switch', 'md-default-theme'],
  classNameBindings: ['value:md-checked', 'dragging:md-dragging'],
  toggle: true,
  constants: inject.service(),

  /* Ripple Overrides */
  rippleContainerSelector: '.md-thumb',
  center: true,
  dimBackground: false,
  fitRipple: true,

  value: false,
  disabled: false,
  dragging: false,

  thumbContainerStyle: computed('dragging', 'dragAmount', function () {
    if (!this.get('dragging')) {
      return htmlSafe('');
    }

    var translate = Math.max(0, Math.min(100, this.get('dragAmount') * 100));
    var transformProp = 'translate3d(' + translate + '%, 0, 0)';
    return htmlSafe('transform: ' + transformProp + ';-webkit-transform: ' + transformProp);
  }),

  didInsertElement: function didInsertElement() {
    this._super.apply(this, arguments);

    // Only setup if the switch is not disabled
    if (!this.get('disabled')) {
      this._setupSwitch();
    }
  },

  init: function init() {
    this._super.apply(this, arguments);
    assert('{{paper-switch}} requires an `onChange` action or null for no action.', this.get('onChange') !== undefined);
  },

  willDestroyElement: function willDestroyElement() {
    this._super.apply(this, arguments);
    this._teardownSwitch();
  },

  didUpdateAttrs: function didUpdateAttrs() {
    this._super.apply(this, arguments);

    if (!this.get('disabled') && !this._switchContainerHammer) {
      this._setupSwitch();
    } else if (!this.get('disabled') && this._switchContainerHammer) {
      this._switchContainerHammer.set({ enable: true });
    } else if (this.get('disabled') && this._switchContainerHammer) {
      this._switchContainerHammer.set({ enable: false });
    }
  },

  _setupSwitch: function _setupSwitch() {
    this.set('switchWidth', this.$('.md-thumb-container').innerWidth());

    var switchContainer = this.$('.md-container').get(0);
    var switchHammer = new Hammer(switchContainer);
    this._switchContainerHammer = switchHammer;

    // Enable dragging the switch container
    switchHammer.get('pan').set({ threshold: 1 });
    switchHammer.on('panstart', run.bind(this, this._dragStart)).on('panmove', run.bind(this, this._drag)).on('panend', run.bind(this, this._dragEnd));

    // Enable tapping gesture on the switch
    this._switchHammer = new Hammer(this.element);
    this._switchHammer.on('tap', run.bind(this, this._dragEnd));
    this.$('.md-container').on('click', run.bind(this, this._handleNativeClick));
  },

  _handleNativeClick: function _handleNativeClick() {
    return get(this, 'bubbles');
  },

  _teardownSwitch: function _teardownSwitch() {
    if (this._switchContainerHammer) {
      this._switchContainerHammer.destroy();
      this._switchHammer.destroy();
    }
  },

  _dragStart: function _dragStart() {
    this.set('dragAmount', +this.get('value'));
    this.set('dragging', true);
  },

  _drag: function _drag(event) {
    if (!this.get('disabled')) {
      // Set the amount the switch has been dragged
      this.set('dragAmount', +this.get('value') + event.deltaX / this.get('switchWidth'));
    }
  },

  _dragEnd: function _dragEnd() {
    if (!this.get('disabled')) {
      var value = this.get('value');
      var dragAmount = this.get('dragAmount');

      if (!this.get('dragging') || value && dragAmount < 0.5 || !value && dragAmount > 0.5) {
        this.sendAction('onChange', !value);
      }
      this.set('dragging', false);
      this.set('dragAmount', null);
    }
  },

  focusIn: function focusIn() {
    // Focusing in w/o being pressed should use the default behavior
    if (!this.get('pressed')) {
      this._super.apply(this, arguments);
    }
  },

  keyPress: function keyPress(ev) {
    if (ev.which === this.get('constants.KEYCODE.SPACE') || ev.which === this.get('constants.KEYCODE.ENTER')) {
      ev.preventDefault();
      this._dragEnd();
    }
  },

  processProxy: function processProxy() {
    this.sendAction('onChange', !this.get('value'));
  }

});