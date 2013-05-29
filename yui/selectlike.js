/**
 * 模拟下拉菜单
 * selectlike
 * @author huya.nzb@taobao.com
 * @date 2011-12-23
 * @version 1.0.0
 */

YUI.add('selectlike', function(Y) {

/**
 * 模拟下拉菜单
 *
 * @module selectlike
 */
    
    var NAME = 'selectlike',
    
        CLS_PARENT_NODE = 'CLS_PARENT_NODE',
        CLS_INPUT_NODE = 'CLS_INPUT_NODE',
        CLS_PLACE_HOLDER = 'CLS_PLACE_HOLDER',
        CLS_FOCUSED = 'CLS_FOCUSED',
        CLS_HOVERED = 'CLS_HOVERED';
    
    function SelectLike() {
        SelectLike.superclass.constructor.apply(this, arguments);
        SelectLike._instances[Y.stamp(this)] = this;
    }
 
    /**
     *  ------------------------ Public Static Properties ---------------------
     */
    
    /**
     * 保存实例的对象
     *
     * @property _instances
     * @type {Object}
     * @static
     */
	SelectLike._instances = {};
    
    /**
     * 点击文档的回调
     *
     * @property _documentClickEvent
     * @type {Function}
     * @static
     */
    SelectLike._documentClickEvent = null;
    
    //全局Document Click回调，不需要每个实例都绑定一次
    SelectLike._onDocumentClick = function(e) {
        Y.Object.each(SelectLike._instances, function(instance) {
            instance._onDocumentClick.call(instance, e);
        });
    };
    
    SelectLike.NAME = NAME;
    
    SelectLike.ATTRS = {
    
        /**
         * 绑定的input输入框（必需）
         *
         * @attribute inputNode
         * @type Node
         */
        inputNode: {
            setter: Y.one,
            writeOnce: 'initOnly'
        },
        
        /**
         * 输入框的readOnly属性
         *
         * @attribute readOnly
         * @type Boolean
         * @default true
         */
        readOnly: {
            value: true
        },
        
        /**
         * 保存选中的value值的输入框
         *
         * @attribute valueInputNode
         * @type Node
         */
        valueInputNode: {
            setter: Y.one
        },
        
        /**
         * 是否在init时render
         *
         * @attribute render
         * @type Boolean
         * @default false
         */
        render: {
            value: false
        }
    };
    
    Y.extend(SelectLike, Y.Base, {

        /**
         * ---------------------- Lifecycle 方法 ------------------------------
         */
        
        /**
         * 初始化
         * @method initializer
         * @param {Object} 参数对象 
         * @chainable
         */
        initializer: function(cfg) {
            var inputNode = this.get('inputNode');
            
            this.rendered = false;
            
            if (!inputNode) {
                return this;
            }
            
            this._inputNode = inputNode;
            this._parentNode = inputNode.ancestor();
            this._valueInputNode = this.get('valueInputNode');
            
            if (!this._valueInputNode) {
                this._valueInputNode = inputNode.next('input');
                this.set('valueInputNode', this._valueInputNode);
            }
            
            this._cfg = cfg;
            
            this._inputEvents = [];
            this._listEvents = [];
            
            this[CLS_PARENT_NODE] = Y.ClassNameManager.getClassName(NAME);
            this[CLS_INPUT_NODE] = Y.ClassNameManager.getClassName(NAME, 'input');
            this[CLS_PLACE_HOLDER] = Y.ClassNameManager.getClassName(NAME, 'placeholder');
            this[CLS_FOCUSED] = Y.ClassNameManager.getClassName(NAME, 'focused');
            this[CLS_HOVERED] = Y.ClassNameManager.getClassName(NAME, 'hovered');
            
            this._inputNode.addClass(this[CLS_INPUT_NODE]);
            this._parentNode.addClass(this[CLS_PARENT_NODE]);
            
            this._parseCfg();
            
            this.publish('select', {
                defaultFn: this._defSelectFn
            });
            
            if (this.get('render')) {
                this.render(cfg);
            }
        },
        
        /**
         * 析构函数
         * @method destructor
         * @chainable
         */
        destructor: function() {
            while (this._inputEvents.length) {
                this._inputEvents.pop().detach();
            }
            while (this._listEvents.length) {
                this._listEvents.pop().detach();
            }
            if (this.List) {
                this.List.destroy();
            }
            delete SelectLike._instances[Y.stamp(this)];  
        },
        
        /**
         * 渲染实例
         * @method render
         * @chainable
         */
        render: function() {
            if (!this._inputNode) {
                return this;
            }
            this.renderUI();
            this.bindUI();
            this.syncUI();
            this.rendered = true;
            return this;
        },
        
        /**
         * 渲染实例UI
         * @method renderUI
         * @chainable
         */
        renderUI: function() {
           this._setAutocompleteAttr();
           this._setReadOnly();
           this._renderList();
           this._setDefSelected();
        },
        
        /**
         * 绑定实例UI事件
         * @method bindUI
         * @chainable
         */
        bindUI: function() {
            this._bindInput();
            this._bindList();
            this._bindDocument();
        },
        
        /**
         * 更新UI
         * @method syncUI
         * @chainable
         */
        syncUI: function() {
        
        },
        
        
        /**
         * ---------------------- 公用 Public API 方法 ------------------------------
         */
        
        /**
         * 隐藏下拉列表
         * @method hide
         * @chainable
         */
        hide: function() {
            this.List.hide();
            return this;
        },
        
        /**
         * 显示下拉列表
         * @method hide
         * @chainable
         */
        show: function() {
            this.List.show();
            return this;
        },
        
        /**
         * 更新选中选项的文字
         * @method updateText
         * @param text {String} 选中项的文字
         * @param focus {Boolean} 是否获得焦点
         * @chainable
         */
        updateText: function(text, focus) {
            if (focus) {
                this._inputNode.focus();
            } else {
                this._inputNode.blur();
            }
            this._inputNode.set('value', text);
            this._checkPlaceholder();
            return this;
        },
        
        /**
         * 更新选中选项的值
         * @method updateValue
         * @param value {String} 选中项的值
         * @chainable
         */
        updateValue: function(value) {
            var valueInputNode = this._valueInputNode;
            if (valueInputNode) {
                valueInputNode.set('value', value);
            }
            return this;
        },
        
        
        
        /**
         * ---------------------- 私有 API 方法 ------------------------------
         */        
        
        /**
         * 绑定Document点击事件
         * @method _bindDocument
         * @protected
         */
        _bindDocument: function() {
            if (!SelectLike._documentClickEvent) {
                SelectLike._documentClickEvent = Y.on('click', SelectLike._onDocumentClick, document);
            }
        },
        
        /**
         * 绑定输入框相关事件
         * @method _bindInput
         * @protected
         */
        _bindInput: function() {
            this._inputEvents.concat([
                this._parentNode.on('click', this._onParentClick, this),
                this._parentNode.on('mouseenter', this._onParentMouseEnter, this),
                this._parentNode.on('mouseleave', this._onParentMouseLeave, this),
                
                this._inputNode.on('focus', this._onInputFocus, this),
                this._inputNode.on('blur', this._onInputBlur, this)
            ]);
        },
        
        /**
         * 绑定列表相关事件
         * @method _bindList
         * @protected
         */
        _bindList: function() {
            this._listEvents.concat([
                
                this.List.after('activeItemChange', this._afterListActiveItemChange, this),
                this.List.after('visibleChange', this._afterListVisibleChange, this),
                
                this.List.on('select', this._onListSelect, this)
            ]);
        },
        
        /**
         * 检查是否是占位符
         * @method _checkPlaceholder
         * @protected
         */
        _checkPlaceholder: function() {
            var plh = this._inputNode.getAttribute('placeholder'),
                val = this._inputNode.get('value');
                
            if (plh !== '') {
                if (plh === val) {
                    this._inputNode.addClass(this[CLS_PLACE_HOLDER]);
                } else {
                    this._inputNode.removeClass(this[CLS_PLACE_HOLDER]);
                }
            } else {
                this._inputNode.removeClass(this[CLS_PLACE_HOLDER]);
            }
        },
        
        /**
         * 配置参数
         * @method _parseCfg
         * @protected
         */
        _parseCfg: function() {
        
            //设置list的align与width
            this._setListAlign();
            
            //配置list参数
            Y.mix(this._cfg, {
                alwaysShowList: false,
                circular: true,
                defSelectFirstItem: true,
                keepActive: true,
                scrollIntoView: false,
                shim: true,
                tabSelect: true,
                visible: false,
                zIndex: 999
            }, false);
        },
        
        /**
         * 渲染list
         * @method _renderList
         * @protected
         */
        _renderList: function() {
            var List = new Y.SelectList(this._cfg);
            List.render();
            this.List = List;
        },
        
        /**
         * 设置autocomplete为off
         * @method _setAutocompleteAttr
         * @protected
         */
        _setAutocompleteAttr: function() {
            this._inputNode.setAttribute('autocomplete', 'off');
        },
        
        /**
         * 初始化默认选项
         * @method _setDefSelected
         * @protected
         */
        _setDefSelected: function() {
            var defSelectedItem = this.List.get('selectedItem'),
                itemData;
            if (defSelectedItem) {
                itemData = defSelectedItem.getData('itemData');
                this.updateText(itemData.text, false);
                this.updateValue(itemData.value);
            } else {
                var val = this._inputNode.get('value'),
                    plh = this._inputNode.getAttribute('placeholder');
                
                if (val === '' || val === plh) {
                    //this.updateText('', false);
                    this.updateValue('');
                }
            }
        },
        
        /**
         * 设置list的align与width
         * @method _setListAlign
         * @protected
         */
        _setListAlign: function() {
            var cfg = this._cfg,
                align = cfg.align,
                alignNode,
                alignWidth;

            if (!align) {
            
                alignNode = this._inputNode.ancestor();
                
                cfg.align = {
                    node  : alignNode,
                    points: ['tl', 'bl']
                };
                
            } else {   
                alignNode = align.node;
            }    
            
            if (!this.get('width') && (alignWidth = Y.one(alignNode).get('offsetWidth'))) {
                cfg.width = alignWidth;
            }
        },
        
        /**
         * 设置ReadOnly属性
         * @method _setReadOnly
         * @protected
         */
        _setReadOnly: function() {
            this._inputNode.setAttribute('readonly', !!this.get('readOnly'));
        },
        
        
        /**
         * ---------------------- 私有 Callback 函数 ------------------------------
         */        
        
        /**
         * activeItem改变后的回调
         * @method _afterListActiveItemChange
         * @param {EventFacade} e
         * @protected
         */
        _afterListActiveItemChange: function(e) {
            var newVal = e.newVal,
                itemData;
                
            if (newVal) {
                itemData = newVal.getData('itemData');
                this.updateText(itemData.text, true);
            }
        },
        
        /**
         * Document Click回调
         * @method _onDocumentClick
         * @param {EventFacade} e
         * @protected
         */
        _onDocumentClick: function(e) {
            if (!this.mouseOverInput && !this.List.mouseOverList) {
                this.hide();
            }
        },
        
        /**
         * input失去焦点回调
         * @method _onInputBlur
         * @param {EventFacade} e
         * @protected
         */
        _onInputBlur: function(e) {
            this.inputFocused = false;
            this._parentNode.removeClass(this[CLS_FOCUSED]);
        },
        
        /**
         * input获得焦点回调
         * @method _onInputFocus
         * @param {EventFacade} e
         * @protected
         */
        _onInputFocus: function() {
            this.inputFocused = true;
            this._parentNode.addClass(this[CLS_FOCUSED]);
            this.show();
        },
        
        /**
         * 选择选项回调
         * @method _onListSelect
         * @param {EventFacade} e
         * @protected
         */
        _onListSelect: function(e) {
            this.fire('select', e);
        },
        
        /**
         * 下拉列表显示隐藏回调
         * @method _afterListVisibleChange
         * @param {EventFacade} e
         * @protected
         */
        _afterListVisibleChange: function(e) {
            var newVal = e.newVal,
                activeItem = this.List.get('activeItem'),
                selectedItem = this.List.get('selectedItem');
            
            if (!newVal && activeItem && activeItem !== selectedItem) {
                this.List.selectItem(activeItem, e, false);
            }
        },
        
        /**
         * 输入框父节点点击回调
         * @method _onParentClick
         * @param {EventFacade} e
         * @protected
         */
        _onParentClick: function(e) {
            if (e.target !== this._inputNode) {
                if (!this.inputFocused) {
                    this._inputNode.focus();
                    this._inputNode.set('value', this._inputNode.get('value'));
                } else {
                    this.show();
                }
            } else {
                if (this.inputFocused) {
                    this.show();
                }
            }
        },
        
        /**
         * 输入框父节点mouseenter回调
         * @method _onParentMouseEnter
         * @param {EventFacade} e
         * @protected
         */
        _onParentMouseEnter: function() {
            this.mouseOverInput = true;
            this._parentNode.addClass(this[CLS_HOVERED]);
        },
        
        /**
         * 输入框父节点mouseleave回调
         * @method _onParentMouseLeave
         * @param {EventFacade} e
         * @protected
         */
        _onParentMouseLeave: function() {
            this.mouseOverInput = false;
            this._parentNode.removeClass(this[CLS_HOVERED]);
        },
        
        /**
         * ---------------------- 私有默认自定义事件 Select Callback 函数 ------------------------------
         */       
        
        /**
         * 默认自定义事件select的回调
         * @method _defSelectFn
         * @param {EventFacade} e
         * @protected
         */
        _defSelectFn: function(e) {
            this.updateText(e.itemData.text, e.focus);
            this.updateValue(e.itemData.value);
            this.hide();
        }
        
    });
    
    Y.SelectLike = SelectLike;
    
}, '1.0.0', {
    requires: ['base', 'selectlist', 'selectlist-keys']
});