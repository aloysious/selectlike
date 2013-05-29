

YUI.add('selectlist', function(Y) {

var Lang   = Y.Lang,
    Node   = Y.Node,
    YArray = Y.Array,

    // String shorthand.
    _CLASS_CONTAINER      = '_CLASS_CONTAINER',
    _CLASS_ITEM           = '_CLASS_ITEM',
    _CLASS_ITEM_ACTIVE    = '_CLASS_ITEM_ACTIVE',
    _CLASS_ITEM_HOVER     = '_CLASS_ITEM_HOVER',
    _CLASS_ITEM_SELECTED  = '_CLASS_ITEM_SELECTED',
    _SELECTOR_ITEM        = '_SELECTOR_ITEM',

    ACTIVE_ITEM      = 'activeItem',
    ALIGN            = 'align',
    ALWAYS_SHOW_LIST = 'alwaysShowList',
    CIRCULAR         = 'circular',
    CONTAINER        = 'container',
    DEF_PARENT_NODE  = 'defParentNode',
    HOVERED_ITEM     = 'hoveredItem',
    ID               = 'id',
    ITEM             = 'item',
    ITEM_DATA        = 'itemData',
    KEEP_ACTIVE      = 'keepActive',
    LIST             = 'list',
    SELECTED_ITEM    = 'selectedItem',
    SOURCE           = 'source',
	VALUE            = 'value',
    VISIBLE          = 'visible',
    WIDTH            = 'width',

    // Event names.
    EVT_SELECT = 'select',
    
    CON_TEMPLATE = '<div/>',
    
    List = Y.Base.create('selectlist', Y.Widget, [
        Y.WidgetPosition,
        Y.WidgetPositionAlign,
        Y.WidgetStack
    ], {

        // -- Prototype Properties -------------------------------------------------
        ITEM_TEMPLATE: '<li/>',
        LIST_TEMPLATE: '<ul/>',
        
        // -- Lifecycle Prototype Methods ------------------------------------------
        
        //done
        initializer: function () {

            this._listEvents = [];

            // Cache commonly used classnames and selectors for performance.
            this[_CLASS_CONTAINER]   = this.getClassName(CONTAINER);
            this[_CLASS_ITEM]        = this.getClassName(ITEM);
            this[_CLASS_ITEM_ACTIVE] = this.getClassName(ITEM, 'active');
            this[_CLASS_ITEM_HOVER]  = this.getClassName(ITEM, 'hover');
            this[_CLASS_ITEM_SELECTED]  = this.getClassName(ITEM, 'selected');
            this[_SELECTOR_ITEM]     = '.' + this[_CLASS_ITEM];
            
            //设置listNode的append的父元素
            this._setDefParentNode();

            this.publish(EVT_SELECT);
        },

        //done
        destructor: function () {
            while (this._listEvents.length) {
                this._listEvents.pop().detach();
            }
        },
        
        //done
        renderUI: function () {
            this._boundingBox = this.get('boundingBox'),
            this._contentBox  = this.get('contentBox'),
            this._listNode    = this._createListNode(),
            this._parentNode  = this._boundingBox.ancestor();
            
            this._defSelectedItem = null;

            // Force position: absolute on the boundingBox. This works around a
            // potential CSS loading race condition in Gecko that can cause the
            // boundingBox to become relatively positioned, which is all kinds of
            // no good.
            //强迫将position设置为absolute，防止CSS加载过慢将boundingBox设置成relative
            this._boundingBox.setStyle('position', 'absolute');
        },
        
        //done
        bindUI: function () {
            this._bindList();
        },
        
        //done
        syncUI: function () {
            // No need to call _syncPosition() here; the other _sync methods will
            // call it when necessary.
            this._syncAlign();
            this._syncWidth();
            this._syncSource();
            this._syncVisibility();
        }, 
        
        // -- Public Prototype Methods ---------------------------------------------
        
        //todo
        activateNextItem: function () {
            var item = this.get(ACTIVE_ITEM),
                nextItem;

            if (item) {
                nextItem = item.next(this[_SELECTOR_ITEM]) ||
                        (this.get(CIRCULAR) ? null : item);
                if (this.get(CIRCULAR) && !nextItem) {
                    nextItem = this.getFirstItemNode();
                }
            } else {
                nextItem = this.getFirstItemNode();
            }

            this.set(ACTIVE_ITEM, nextItem);

            return this;
        },
        
        //todo
        activatePrevItem: function () {
            var item     = this.get(ACTIVE_ITEM),
                prevItem;
            
            if (item) {
                prevItem = item.previous(this[_SELECTOR_ITEM]) ||
                        (this.get(CIRCULAR) ? null : item);
                if (this.get(CIRCULAR) && !prevItem) {
                    prevItem = this.getLastItemNode();
                }
            
            } else {
                prevItem = this.getLastItemNode();
            }

            this.set(ACTIVE_ITEM, prevItem || null);
            //this.set(ACTIVE_ITEM, prevItem || item);

            return this;
        },
        
        //done
        getFirstItemNode: function () {
            return this._listNode.one(this[_SELECTOR_ITEM]);
        },
        
        //done
        getLastItemNode: function () {
            return this._listNode.one(this[_SELECTOR_ITEM] + ':last-child');
        },
        
        //done
        hide: function () {
            return this.get(ALWAYS_SHOW_LIST) ? this : this.set(VISIBLE, false);
        },
        
        //done
        selectItem: function (itemNode, originEvent, focus) {
            if (itemNode) {
                if (!itemNode.hasClass(this[_CLASS_ITEM])) {
                    return this;
                }
            } else {
                itemNode = this.get(ACTIVE_ITEM);

                if (!itemNode) {
                    return this;
                }
            }
            
            //如果和当前选中项相同，则忽略
            /*if (itemNode === this.get(SELECTED_ITEM)) {
                this.hide();
                return this;
            }*/
            
            this._set(SELECTED_ITEM, itemNode);

            this.fire(EVT_SELECT, {
                itemNode   : itemNode,
                originEvent: originEvent || null,
                itemData   : itemNode.getData(ITEM_DATA),
                focus: this.get('focusAfterSelect')
            });

            return this;
        },

        // -- Protected Prototype Methods ------------------------------------------
        
        //done
        _addItemNodes: function (items) {
            var itemNodes = [];
            
            YArray.each(Lang.isArray(items) ? items : [items], function (item) {
                itemNodes.push(this._createItemNode(item).setData(ITEM_DATA, item));
            }, this);

            itemNodes = Y.all(itemNodes);
            this._listNode.append(itemNodes.toFrag());

            return itemNodes;
        },
        
        //todo
        _bindList: function () {
        
            this._listEvents.concat([
                
                this.after({
                    blur      : this._afterListBlur,
                    focus     : this._afterListFocus,
                    mouseover : this._afterMouseOver,
                    mouseout  : this._afterMouseOut,
                    mouseenter: this._afterMouseEnter,
                    mouseleave: this._afterMouseLeave,
                    
                    //不设置selectedItemChange事件，使用select事件就行
                    activeItemChange    : this._afterActiveItemChange,
                    //alignChange         : this._afterAlignChange,
                    alwaysShowListChange: this._afterAlwaysShowListChange,
                    hoveredItemChange   : this._afterHoveredItemChange,
                    selectedItemChange  : this._afterSelectedItemChange,
                    sourceChange        : this._afterSourceChange,
                    visibleChange       : this._afterVisibleChange
                }),

                this._listNode.delegate('click', this._onItemClick, this[_SELECTOR_ITEM], this)
            ]);
            
            //如果设置defParentNode的话，按理说就不用设置resize事件了
            //resize事件在IE6/7下有bug，浏览器兼容性，不推荐使用
            if (this.get('bindWindowResize')) {
                this._listEvents.push(
                    Y.on('windowresize', this._syncPosition, this)
                );
            }
        },
        
        //done
        _clearList: function () {
            this.set(ACTIVE_ITEM, null);
            this._set(HOVERED_ITEM, null);
            this._listNode.get('children').remove(true);
        },
        
        //todo 数据格式
        _createItemNode: function (itemData) {
            var itemNode = Node.create(this.ITEM_TEMPLATE);
            
            itemNode.addClass(this[_CLASS_ITEM]).setAttrs({
                id  : Y.stamp(itemNode),
                role: 'list-item'
            }).setAttribute('data-text', itemData.text).setAttribute('data-value', itemData.value).append(itemData.text);

            if (itemData.selected) {
                this._defSelectedItem = itemNode;
            }
            
            return itemNode;
        },
        
        //done
        _createListNode: function () {
            var listNode = this.get('listNode') || Node.create(this.LIST_TEMPLATE);

            listNode.addClass(this.getClassName(LIST)).setAttrs({
                //id  : Y.stamp(listNode),
                role: 'listbox'
            });
            
            this._set('listNode', listNode);
            this._contentBox.append(listNode);

            return listNode;
        },
        
        _parseSource: function() {
            var source = this.get(SOURCE),
                textLocator = this.get('textLocator'),
                valueLocator = this.get('valueLocator'),
                selectedLocator = this.get('selectedLocator');
                
            Y.Array.each(source, function(item) {
                if (textLocator !== '' && textLocator !== 'text') {
                    item['text'] = item[textLocator]
                }
                if (valueLocator !== '' && valueLocator !== 'value') {
                    item['value'] = item[valueLocator]
                }
                if (selectedLocator !== '' && selectedLocator !== 'selected') {
                    item['selected'] = item[selectedLocator]
                }
            });
        },
        
        //done
        _setDefParentNode: function() {
            var defParentNode = this.get(DEF_PARENT_NODE);
            
            if (defParentNode === 'useOwnContainer') {
                //style the container yourself, to fixed resize event
                if (!List.ownContainer) {
                    List.ownContainer = Node.create(CON_TEMPLATE);
                    List.ownContainer.addClass(this[_CLASS_CONTAINER]);
                    List.ownContainer.setStyle('position', 'relative');
                    Y.one('body').prepend(List.ownContainer);
                }
                defParentNode = List.ownContainer;
            }
            
            this.DEF_PARENT_NODE = defParentNode || null;
        },
        
        //done
        _setActivateFirstItem: function() {
            if (!this.get(ACTIVE_ITEM) && this.get('activateFirstItem')) {
                this.set(ACTIVE_ITEM, this.getFirstItemNode());
            }
        },
        
        //done
        _setDefSelectedItem: function() {
            
            if (!this._defSelectedItem || !this._defSelectedItem._node) {
                if (!this.get(SELECTED_ITEM) && this.get('defSelectFirstItem')) {
                    this._defSelectedItem =  this.getFirstItemNode();
                }
            }
            
            if (this._defSelectedItem && this._defSelectedItem._node) {
                this.set(ACTIVE_ITEM, this._defSelectedItem);
                this.selectItem(this._defSelectedItem);
                this._defSelectedItem = null;
            }
        },
        
        //done
        _syncAlign: function() {
            var align = this.get(ALIGN),
                alignNode;
            // Null align means we can auto-align. Set align to false to prevent
            // auto-alignment, or a valid alignment config to customize the
            // alignment.
            if (!align) {
                // If this is a tokenInput, align with its bounding box.
                // Otherwise, align with the inputNode. Bit of a cheat.
                alignNode = this._parentNode;

                this.set(ALIGN, {
                    node  : alignNode,
                    points: ['tl', 'bl'] //todo
                });
                
            }
        },

        //done
        _syncPosition: function () {
            // Force WidgetPositionAlign to refresh its alignment.
            var align = this.get(ALIGN);
            /*this.set(ALIGN, {
                node: align.node, 
                points: align.points
            });
            */
            this._syncWidth();
            this._syncUIPosAlign();

            // Resize the IE6 iframe shim to match the list's dimensions.
            //this._syncShim();
            this.sizeShim();
        },

        //todo 默认选中
        _syncSource: function (source) {
            if (!source) {
                source = this.get(SOURCE);
            }

            this._set(SELECTED_ITEM, null);
            this.set(ACTIVE_ITEM, null);
            this._set(HOVERED_ITEM, null);
            
            this._clearList();
            
            
            if (source.length) {
                this._parseSource();
                this._addItemNodes(source);
            }

            this._syncPosition();
            
            this._setActivateFirstItem();
            this._setDefSelectedItem();
        },
        
        //done
        _syncVisibility: function (visible) {

            if (typeof visible === 'undefined') {
                visible = this.get(VISIBLE);
            }
        
            if (this.get(ALWAYS_SHOW_LIST)) {
                visible = true;
                this.set(VISIBLE, visible);
            }

            if (visible) {
                this._syncPosition();
            } else {
            
                //隐藏后保持active状态
                if (!this.get(KEEP_ACTIVE)) {
                    this.set(ACTIVE_ITEM, null);
                    this._set(HOVERED_ITEM, null);
                }

                // Force a reflow to work around a glitch in IE6 and 7 where some of
                // the contents of the list will sometimes remain visible after the
                // container is hidden.
                this._boundingBox.get('offsetWidth');
            }
        },
        
        _syncWidth: function() {
            var align = this.get(ALIGN);
            // If no width config is set, attempt to set the list's width to the
            // width of the alignment node. If the alignment node's width is
            // falsy, do nothing.
            if (!this.get(WIDTH)) {
                this.set(WIDTH, align && align.node && align.node.get('offsetWidth'));
                //console.log(alignNode.get('offsetWidth'));
            }
        },
        
        // -- Protected Event Handlers ---------------------------------------------
        
        //done
        _afterActiveItemChange: function (e) {
            var newVal    = e.newVal,
                prevVal   = e.prevVal,
                node;

            // The previous item may have disappeared by the time this handler runs,
            // so we need to be careful.
            if (prevVal && prevVal._node) {
                prevVal.removeClass(this[_CLASS_ITEM_ACTIVE]);
            }

            if (newVal) {
                newVal.addClass(this[_CLASS_ITEM_ACTIVE]);
            }
            
            //scrollIntoView
            if (this.get('scrollIntoView')) {
                node = newVal || this.get(ALIGN).node;
                
                if (node && node._node) {
                    if (!node.inRegion(Y.DOM.viewportRegion(), true) || !node.inRegion(this._contentBox, true)) {
                        node.scrollIntoView();
                    }
                }
            }
        },
        
        //done
        _afterAlwaysShowListChange: function (e) {
            this.set(VISIBLE, e.newVal || this.get(SOURCE).length > 0);
        },
        
        //done
        /*_afterAlignChange: function() {
            this._syncAlign();
        },*/
 
        //done
        _afterSelectedItemChange: function (e) {
            var newVal    = e.newVal,
                prevVal   = e.prevVal;

            // The previous item may have disappeared by the time this handler runs,
            // so we need to be careful.
            if (prevVal && prevVal._node) {
                prevVal.removeClass(this[_CLASS_ITEM_SELECTED]);
            }

            if (newVal) {
                newVal.addClass(this[_CLASS_ITEM_SELECTED]);
            }
        },
 
        //done
        _afterHoveredItemChange: function (e) {
            var newVal  = e.newVal,
                prevVal = e.prevVal;

            if (prevVal) {
                prevVal.removeClass(this[_CLASS_ITEM_HOVER]);
            }

            if (newVal) {
                newVal.addClass(this[_CLASS_ITEM_HOVER]);
            }
        },
        
        //done
        _afterListBlur: function () {
            this.listFocused = false;
        },
        
        //done
        _afterListFocus: function () {
            this.listFocused = true;
        },
        
        //done
        //只设置值，不执行show/hide方法        
        _afterMouseEnter: function() {
            this.mouseOverList = true;
        },
        
        //done
        //只设置值，不执行show/hide方法
        _afterMouseLeave: function() {
            this.mouseOverList = false;
        },
        
        //done
        _afterMouseOver: function (e) {
            var itemNode = e.domEvent.target.ancestor(this[_SELECTOR_ITEM], true);
            
            if (itemNode) {
                this._set(HOVERED_ITEM, itemNode);
            }
        },
        
        //done
        _afterMouseOut: function (e) {
            this._set(HOVERED_ITEM, null);
        },
        
        //done
        _afterSourceChange: function (e) {
            this._syncSource(e.newVal);

            if (!this.get(ALWAYS_SHOW_LIST)) {
                //this.set(VISIBLE, !!e.newVal.length);
            }
        },
        
        //done
        _afterVisibleChange: function (e) {
            this._syncVisibility(!!e.newVal);
        },
        
        //done
        _onItemClick: function (e) {
            var itemNode = e.currentTarget;
            
            this.set(ACTIVE_ITEM, itemNode);
            this.selectItem(itemNode, e);
        }     
    
    }, {
    
        ATTRS: {

            activateFirstItem: {
                value: false
            },

            activeItem: {
                setter: Y.one,
                value: null
            },

            alwaysShowList: {
                value: false
            },
            
            bindWindowResize: {
                value: false
            },

            circular: {
                value: true
            },
            
            defParentNode: {
                setter: function(v) {
                    return v === 'useOwnContainer' ? 'useOwnContainer' : Y.one(v);
                }
            },
            
            defSelectFirstItem: {
                value: true
            },
			
			focusAfterSelect: {
				value: false
			},
            
            hoveredItem: {
                readOnly: true,
                value: null
            },
            
            inputNode: {
                setter: Y.one
            },
            
            keepActive: {
                value: true
            },

            listNode: {
                writeOnce: 'initOnly',
                value: null
            },
            
            selectedItem: {
                readOnly: true,
                value: null
            },
            
            selectedLocator: {
                value: 'selected'
            },
            
            scrollIntoView: {
                value: false
            },
            
            source: {
                value: null,
                setter: 'sourceSetter'
            },
            
            tabSelect: {
                value: false
            },
            
            textLocator: {
                value: 'text'
            },
            
            useOwnContainer: {
                value: false
            },
            
            valueLocator: {
                value: 'value'
            },

            visible: {
                value: false
            }
        },
        
        CSS_PREFIX: Y.ClassNameManager.getClassName('selectlist')
    });

Y.SelectList = List;      
  
}, '1.0.0', {
    requires: ['event-resize', 'node-screen', 'selector-css3', 'widget', 'widget-position', 'widget-position-align', 'widget-stack']
});