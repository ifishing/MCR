/* 
 * MCRV Framework core javascript file ,according to MCRV design pattern
 * 
 * @author fisher
 * @time 2011-06-23
 * 
 */

var _BaseLirary;
(function($)
{
    if(!$) $=window;
    $.MCR=window.MCR=MCR;
    MCR.fn=MCR.prototype=_getMCRPrototype();
    MCR.extend=_extend;
    MCR.extend(MCR,{
        makeInheritance:_makeInheritance
        ,makeNameplace:_makeNameplace
        ,isString:isString
        ,isFunction:_isFunction
        ,isArray:_isArray
        ,isPlainObject:_isPlainObject
        ,isWindow:isWindow
        ,isHtmlElement:isHtmlElement
        ,bind:bind
        ,unbind:unbind
        ,getFuncName:_getFuncName
        ,_mcrCollection:[]
        ,Model:_buildModel
        ,Controller:_buildController
        ,Renderer:_buildRenderer
        ,Cache:Cache
        ,debug:undefined  //调试函数
        ,debugOption:undefined //调试选项 
    });
    MCR.makeInheritance(Cache,  _getCachePrototype());
    
    function MCR(model,controller,renderer)
    {
         return new MCR.fn.init( model,controller,renderer );
    }
     
    /*
     *返回MCR原型扩展 
     */
    function _getMCRPrototype()
    {
        
        var _prototype= 
        {
            init:function(model,controller,renderer)
            {
                var me=this;
                me.controller=_buildController(controller);
                me.model=_buildModel(model);
                me.renderer=_buildRenderer(renderer);
                if(!me.controller||!me.controller||!me.controller)
                {
                    throw "MCR参数传递错误: model:"+typeof(model)+";controller:"+typeof(controller)+";renderer:"+typeof(renderer);
                    return null;
                }

               
                me.controller.model=me.model;
                me.controller.renderer=me.renderer;
                me.renderer.controller=me.controller;
                me.model.controller=me.controller;
                //me.controller.mcr=me;
                //me.model.mcr=me;
                //me.renderer.mcr=me;

                if(typeof me.model.init=="function")
                {
                    me.model.init();
                }
                if(typeof me.renderer.init=="function")
                {
                    me.renderer.init();
                }
                if(typeof me.controller.init=="function")
                {
                    me.controller.init();
                }

                MCR.bind(window,"unload",me.dispose);
                
                MCR._mcrCollection.push(me);
                
                return me;
                
                
            }
            ,dispose:function()
            {
                if(MCR.isWindow(this)) //如果是被window的unload事件自动调用
                {
                    for(var ix=0;ix<MCR._mcrCollection.length;ix++)
                    {
                         _disposeMCR(MCR._mcrCollection[ix]);
                    }
                }
                else if(typeof(this)=="object"&&this.isMCR) //通过mcr.dispose()调用
                {
                    _disposeMCR(this);
                }
                
                /*
                 *销毁MCR对象
                 */
                function _disposeMCR(_mcr)
                {
                    if(typeof(_mcr.controller._dispose)=="function")
                    {
                        _mcr.controller._dispose();
                    }
                    if(typeof(_mcr.model._dispose)=="function")
                    {
                        _mcr.model._dispose();
                    }
                    if(typeof(_mcr.renderer._dispose)=="function")
                    {
                        _mcr.renderer._dispose();
                    }

                    _mcr.controller=null;
                    _mcr.model=null;
                    _mcr.renderer=null;
                }
                    
                

            }
            ,getController:function()
            {
                return this.controller;
            }
            ,getModel:function()
            {
                return this.model;
            }
            ,getRenderer:function()
            {
                return this.renderer;
            }
            ,isMCR:true //标志是否是MCR构造的对象
        };
        _prototype.init.prototype=_prototype;
        return _prototype;
    }
    
    /*
     * 构造控制器
     */
    function _buildController(controller)
    {
        var _type=typeof controller;
        var tobeExtended={
                _dispose:function()
                {
                    if(typeof(controller.dispose)=="function")
                    {
                        controller.dispose();
                    }
                    controller.model=null;
                    controller.renderer=null;
                    //controller.mcr=null;
                }
                ,isMCRController:true
          };
      
        if(_type=="object"||_type=="function")
        {
            if(_type=="function") 
                controller= new controller();
            if(controller.isMCRController)
                return controller;
            else
            {
                controller=MCR.extend(controller, tobeExtended);
                for(var key in controller)
                {
                    if(typeof controller[key]=="function")
                    {
                        controller[key]=_rebuildFunctionForDebug(controller[key],key,"Controller");
                    }
                }
                return controller;
            }  
        }
        else 
            return null;
    }
    
     /*
     * 构造模型
     */
    function _buildModel(model)
    {
        var _type=typeof model;
        var tobeExtended={
            _dispose:function()
            {
                if(typeof(model.dispose)=="function")
                {
                    model.dispose();
                }
                model.controller=null;
                //model.mcr=null;
            }
            ,isMCRModel:true
            ,cache:(new Cache())
            ,asyncCall:function(func,data)
            {
                var _type=typeof(func),funcname;
                if(_type=="string" && typeof(this.controller[func])=="function")
                {
                    funcname=func;
                    func=this.controller[funcname]; 
                }
                else if(_type=="function")
                {
                    funcname=MCR.getFuncName(func);
                }
                else
                {
                    return ;
                }
                
                if(typeof MCR.debug=="function")
                {
                    MCR.debug(data,this.controller,func,funcname,"Controller");    
                }
                else
                {
                    func.call(this.controller,data);
                }
                  
            }
        }
        /*if(_type=="object"||_type=="function")
        {
            if(_type=="function") 
                model= new model();
            
            if(model.isMCRModel)
                return model;
            else
            {
                model=MCR.extend({},model, tobeExtended);
                return model;
            }
               
        }
        else 
            return null;*/
        if(_type=="object"||_type=="function")
        {
            if(_type=="function") 
                model= new model();
            if(model.isMCRRenderer)
                return model;
            else
            {
                model=MCR.extend(model, tobeExtended);
                for(var key in model)
                {
                    if(typeof model[key]=="function")
                    {
                        model[key]=_rebuildFunctionForDebug(model[key],key,"Model");
                    }
                }
                return model;
            }
               
        }
        else 
            return null;
    }  
    
    /*
     * 构造呈现器
     */
    function _buildRenderer(renderer)
    {
        var _type=typeof renderer;
        var tobeExtended={
            _dispose:function()
            {
                if(typeof(renderer.dispose)=="function")
                {
                    renderer.dispose();
                }
                renderer.controller=null;
                //renderer.mcr=null;
            }
            ,isMCRRenderer:true
           };
           
        if(_type=="object"||_type=="function")
        {
            if(_type=="function") 
                renderer= new renderer();
            if(renderer.isMCRRenderer)
                return renderer;
            else
            {
                renderer=MCR.extend(renderer, tobeExtended);
                for(var key in renderer)
                {
                    if(typeof renderer[key]=="function")
                    {
                        renderer[key]=_rebuildFunctionForDebug(renderer[key],key,"Renderer");
                    }
                }
                return renderer;
            }
               
        }
        else 
            return null;
    }
    
     /*
     *重新构造函数，使可以调试
     */
    function _rebuildFunctionForDebug(func,funcname,type)
    {
        return function()
        {
            var data= arguments[0];
            if(typeof MCR.debug=="function"&&(!(data===undefined||data===null)))
            {
                return MCR.debug(data,this,func,funcname,type);
            }
            else
              return func.call(this,data);
        }
    }
    
    
    /*
     * 继承
     */
    function _makeInheritance(Child,Parent)
    {
        var _parentType=typeof Parent
        ,_childType=typeof Child;
        
        if(_childType=="function")
        {
            if(_parentType=="function")
            {
                var F = function(){};
                F.prototype = Parent.prototype;
                Child.prototype = new F();
                Child.prototype.constructor = Child;
            }
            else if(_parentType=="object")
            {
                Child.prototype=Parent;
                Child.prototype.constructor = Child;
            }
        }
        else if(_childType=="object")
        {
            if(_parentType=="function")
            {
                _extend(Child, new Parent())
            }
            else if(_parentType=="object")
            {
                _extend(Child, Parent);
            }
        }
       
    }
    
    /*
     *扩展命名空间
     */
    function _makeNameplace(obj,nameplace)
    {
        var _type=typeof(obj);
        if(!( _type=="object"|| _type=="function")) return false;
        if(!isString(nameplace))
        {
            return false;
        }
        var subNameplaces=nameplace.split(".");
        for(var ix=0;ix<subNameplaces.length;ix++)
        {
            if(typeof obj[subNameplaces[ix]]!="object")
            {
                obj[subNameplaces[ix]]={};
            }
        }
        return obj;
    }
    
    /*
     * 是否是字符串
     */
    function isString(str)
    {
        if(typeof(str)=="string"||(typeof(str)=="object"&&str.constructor==String))
        {
            return true;
        }
        else
            return false;
    }
    
    /*
     * copy from jQuery,then modify it
     */
    function _extend()
    {
        // copy reference to target object
            var target = arguments[0] || {}, i = 1, length = arguments.length, deep = false, options, name, src, copy, copyIsArray;

            // Handle a deep copy situation
            if ( typeof target === "boolean" ) 
            {
                deep = target;
                target = arguments[1] || {};
                // skip the boolean and the target
                i = 2;
            }

            // Handle case when target is a string or something (possible in deep copy)
            if ( typeof target !== "object" && !_isFunction(target)) 
            {
                target = {};
            }

            // extend jQuery itself if only one argument is passed
            if ( length === i ) 
            {
                target = MCR;
                --i;
            }

            for ( ; i < length; i++ ) 
            {
                // Only deal with non-null/undefined values
                if ( (options = arguments[i]) != null ) 
                {
                    // Extend the base object
                    for ( name in options ) 
                    {
                        src = target[ name ];
                        copy = options[ name ];

                        // Prevent never-ending loop
                        if ( target === copy ) 
                        {
                            continue;
                        }

                        // Recurse if we're merging plain objects or arrays
                        var clone;
                        if ( deep && copy && ( _isPlainObject(copy) || (copyIsArray = _isArray(copy)) ) ) 
                        {
                            if ( copyIsArray ) 
                            {
                                copyIsArray = false;
                                clone = src && _isArray(src) ? src : [];

                            } 
                            else 
                            {
                                clone = src && _isPlainObject(src) ? src : {};
                            }

                            // Never move original objects, clone them
                            target[ name ] = _extend( deep, clone, copy );

                        // Don't bring in undefined values
                        }
                        else if ( copy !== undefined ) 
                        {
                            target[ name ] = copy;
                        }
                    }
                }
            }

            // Return the modified object
            return target;
    }
    
    /*
     * 是否是函数
     */
    function _isFunction(func)
    {
        return (typeof(func)=="function");
    }
    
    /*
     * 是否是数组
     */
    function  _isArray( obj ) 
    {
        if(Array.isArray) 
            return Array.isArray(obj);
        else
            return (obj&&(typeof obj == "object")&&(obj.constructor==Array)); //notice that typeof null=="object" is true
       
    }
    
    /*
     * 是否是普通对象
     */
    function _isPlainObject( obj ) 
    {
            var hasOwn = Object.prototype.hasOwnProperty;
            // Must be an Object.
            // Because of IE, we also have to check the presence of the constructor property.
            // Make sure that DOM nodes and window objects don't pass through, as well
            if ( !obj || typeof(obj) !== "object" || obj.nodeType || isWindow( obj ) ) 
            {
                return false;
            }

            // Not own constructor property must be Object
            if ( obj.constructor &&
                !hasOwn.call(obj, "constructor") &&
                !hasOwn.call(obj.constructor.prototype, "isPrototypeOf") ) {
                return false;
            }

            // Own properties are enumerated firstly, so to speed up,
            // if last one is own, then all properties are own.

            var key;
            for ( key in obj ) {}

            return key === undefined || hasOwn.call( obj, key );
    }
    
    /*
     *是否是window对象
     */ 
    function isWindow( obj ) 
    {
        return obj && typeof obj === "object" && "setInterval" in obj;
    }
    
      /*
      * 判断对象是否是Html元素
      * @elem  元素
      */
     function isHtmlElement(elem)
     {
         return typeof(elem)=="object" &&elem.nodeType==1||elem.nodeType==9
     }
    
    /*
     * 缓存对象
     */
    function Cache()
    {
        this._cache={};
    }
    
    /*
     * Cache原型扩展
     */
    function _getCachePrototype()
    {
        var _prototype={
            size:function()
            {
                var count=0;
                for(var key in this._cache)
                {
                    count++;
                }
                return count;
            }
            ,get:function(key)
            {
               return this._cache[key];
            }
            ,set:function(key,value)
            {
                this._cache[key]=value;
            }
            ,remove:function(key)
            {
                delete this._cache[key];
            }
        };
        return _prototype;
    }
    
     /*
     * 获得函数名称
     */
    function _getFuncName(func)
    {
        if(typeof func=="function")
        {
            var funcname=func.toString();
            var reg=/^function(?:\s)+(\S+)\(/
            var arr=funcname.match(reg);
            if(arr)
            {
               funcname=arr[1] ;
            }
            else   
              funcname="";
        }
        else
        {
            funcname= "";
        }
        return funcname;
    }
  
   /*
    * 绑定事件
    */
    function  bind(element,type,listener)
    {
        if(!(MCR.isHtmlElement(element)||MCR.isWindow(element))||!MCR.isString(type)||!(typeof listener=="function")) return;
         type=type.toLowerCase();
         type = type.replace(/^on/, '');
         element.attachEvent?element.attachEvent('on' +type,listener):element.addEventListener(type, listener, false);
    }
    
    /*
    * 解除绑定事件
    */
    function  unbind(element,type,listener)
    {
        if(!(MCR.isHtmlElement(element)||MCR.isWindow(element))||!MCR.isString(type)||!(typeof listener=="function")) return;
         type=type.toLowerCase();
         type = type.replace(/^on/, '');
         element.attachEvent?element.detachEvent('on' +type,listener):element.removeEventListener(type, listener, false);
    }
    
    
})(_BaseLirary);



