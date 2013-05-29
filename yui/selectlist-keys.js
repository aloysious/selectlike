/*
YUI 3.4.1 (build 4118)
Copyright 2011 Yahoo! Inc. All rights reserved.
Licensed under the BSD License.
http://yuilibrary.com/license/
*/
YUI.add('selectlist-keys', function(Y) {

/**
 * Mixes keyboard support into AutoCompleteList. By default, this module is not
 * loaded for iOS and Android devices.
 *
 * @module autocomplete
 * @submodule autocomplete-list-keys
 */

 // keyCode constants.
var KEY_DOWN  = 40,
    KEY_ENTER = 13,
    KEY_ESC   = 27,
    KEY_TAB   = 9,
    KEY_UP    = 38;

function ListKeys() {
        
    Y.before(this._unbindKeys, this, 'destructor');
    Y.before(this._bindKeys, this, 'bindUI');

    this._initKeys();
}

ListKeys.prototype = {
    // -- Lifecycle Methods ----------------------------------------------------

    /**
     * Initializes keyboard command mappings.
     *
     * @method _initKeys
     * @protected
     * @for AutoCompleteList
     */
    _initKeys: function () {
        var keys        = {},
            keysVisible = {};
        
        this._keyEvents = [];

        // Register keyboard command handlers. _keys contains handlers that will
        // always be called; _keysVisible contains handlers that will only be
        // called when the list is visible.
        keys[KEY_DOWN] = this._keyDown;

        keysVisible[KEY_ENTER] = this._keyEnter;
        keysVisible[KEY_ESC]   = this._keyEsc;
        keysVisible[KEY_TAB]   = this._keyTab;
        keysVisible[KEY_UP]    = this._keyUp;

        this._keys        = keys;
        this._keysVisible = keysVisible;
    },

    /**
     * Binds keyboard events.
     *
     * @method _bindKeys
     * @protected
     */
    _bindKeys: function () {
        var inputNode = this.get('inputNode');
        if (inputNode && inputNode._node) {
            this._inputNode = inputNode;
            this._keyEvents.push(this._inputNode.on('keydown', this._onInputKey, this));
        }
    },

    /**
     * Unbinds keyboard events.
     *
     * @method _unbindKeys
     * @protected
     */
    _unbindKeys: function () {
        while (this._keyEvents.length) {
            this._keyEvents.pop().detach();
        }
    },

    // -- Protected Methods ----------------------------------------------------

    /**
     * Called when the down arrow key is pressed.
     *
     * @method _keyDown
     * @protected
     */
    _keyDown: function () {
        if (this.get('visible')) {
            this.activateNextItem();
        } else {
            this.show();
        }
    },

    /**
     * Called when the enter key is pressed.
     *
     * @method _keyEnter
     * @protected
     */
    _keyEnter: function (e) {
        var item = this.get('activeItem');
        
        if (item) {
            this.selectItem(item, e);
        } else {
            // Don't prevent form submission when there's no active item.
            return false;
        }
    },

    /**
     * Called when the escape key is pressed.
     *
     * @method _keyEsc
     * @protected
     */
    _keyEsc: function () {
        this.hide();
    },

    /**
     * Called when the tab key is pressed.
     *
     * @method _keyTab
     * @protected
     */
    _keyTab: function (e) {
        var item;

        if (this.get('tabSelect')) {
            item = this.get('activeItem');

            if (item) {
                this.selectItem(item, e, false);
                return true;
            }
        }
        
        //else hide the list
        this.hide();

        return false;
    },

    /**
     * Called when the up arrow key is pressed.
     *
     * @method _keyUp
     * @protected
     */
    _keyUp: function () {
        this.activatePrevItem();
    },

    // -- Protected Event Handlers ---------------------------------------------

    /**
     * Handles <code>inputNode</code> key events.
     *
     * @method _onInputKey
     * @param {EventTarget} e
     * @protected
     */
    _onInputKey: function (e) {
        var handler,
            keyCode = e.keyCode;

        this._lastInputKey = keyCode;

        if (this.get('source').length) {
            handler = this._keys[keyCode];

            if (!handler && this.get('visible')) {
                handler = this._keysVisible[keyCode];
            }

            if (handler) {
                // A handler may return false to indicate that it doesn't wish
                // to prevent the default key behavior.
                if (handler.call(this, e) !== false) {
                    e.preventDefault();
                }
            }
        }
    }
};

Y.Base.mix(Y.SelectList, [ListKeys]);


}, '3.4.1' ,{requires:['selectlist', 'base-build']});
