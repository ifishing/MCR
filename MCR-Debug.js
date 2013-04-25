/* 
 * To change this template, choose Tools | Templates
 * and open the template in the editor.
 */


(function(MCR)
{
    var ___BeforeSendAjax="BeforeSendAjax",___AjaxSuccess="AjaxSuccess";
    if(typeof MCR!="function")  return;
    (function()
    {
          MCR.extend(MCR,{
            getQueryString:getQueryString
            ,getDOMNode:getDOMNode
            ,insertHTML:insertHTML
            ,parseJSON:parseJSON
            ,stringify:getStringifyFunction() 
            ,ready:ready
            ,isReady:false //DOM 是否加载完毕
            ,readyList:[] //DOM加载完毕后调用的函数列表
            ,getOffset: getOffset
            ,getDocumentSize:getDocumentSize
            ,getViewpointSize:getViewpointSize
            ,getCss:getCss
            ,contains:contains
            ,getHeight:getHeight
            ,getWidth:getWidth
        });
        var debugOption=MCR.extend(getDefaultDebugOption(), MCR.debugOption) ;
        MCR.debugOption=debugOption;
        MCR.showDebugUI=_showDebugUI;
        var debug=MCR.getQueryString("debug"),debugAjax=MCR.getQueryString("debugAjax");
        debug=MCR.parseJSON(debug);
        if(MCR.isArray(debug)) MCR.debugOption.debug=debug;
        if(debugAjax) MCR.debugOption.debugAjax=debugAjax;
        MCR.debug=function(data,context,func,funcname,type)
        {
            if(data===undefined||data===null)
            {
                return data;
            }

            if(typeof func !="function") return data;

            //如果不是调试ajax
            if(type!=___BeforeSendAjax&& type!=___AjaxSuccess)
            {
                //根据funcname过滤，决定是否显示调试窗口
               if(funcname&&typeof(MCR.debugOption.debug)=="object")
               {
                    var filter=MCR.debugOption.debug , key;
                    for(key in filter)
                    {
                        if(filter[key]==funcname)
                        {
                            return MCR.showDebugUI(data,context,func,funcname,type);
                        }
                    }  
               }
               return func.call(context,data);
            }
            else //如果调试ajax直接弹出
            {
                MCR.showDebugUI(data,context,func,funcname,type);
            }

        };  
        if(MCR.debugOption.debug||MCR.debugOption.debugAjax)
        {  
            MCR.ready(function(){_createDebugUI();}) //创建调试窗口
        }
        if(MCR.debugOption.debugAjax) //如果调试ajax
               _setDebugAjax(debugOption);
           
    })();
    
    /*
     *make ajax debug
     */
    function _setDebugAjax(debugOption)
    {
        //调试jQuery Ajax
        if(typeof jQuery=="function"&&typeof(jQuery.ajax)=="function")
        {
             debugJQueryAjax(debugOption);
        }
        
        if(typeof baidu=="object"&&baidu.ajax)
        {
            debugTangramAjax(debugOption);
        }
    }
    /*
     *调试jQuery ajax
     */
    function debugJQueryAjax(debugOption)
    {
           /*
           *针对发起ajax请求之前就做处理
           */
            function beforeSendHandler(jqXHR,settings)
            {
                if(settings.___buildDebug) return true;
                var _success=settings.success;
                var funcname=MCR.getFuncName(_success);
                var context=this;
                if(MCR.debugOption.debugAjax)
                {      
                    if(MCR.debugOption.debugAjax=="before")
                    {
                        settings.___buildDebug=true;
                        MCR.debug({},context,_success,funcname,___BeforeSendAjax);
                        return false;
                    }
                    else //success
                    {
                        settings.___buildDebug=true;
                        _buildSuccessHandler(context,jqXHR,settings);  
                    }
                }
                return true;
            }
            
            /*
             *针对ajaxSend事件，如果beforeSend被用户自定义事件覆盖则使用这个来建立调试
             */
            function ajaxSendHandler(event, jqXHR, settings)
            {
                if(settings.___buildDebug) return true;
                var _success=settings.success;
                var funcname=MCR.getFuncName(_success);
                var context=this;
                if(MCR.debugOption.debugAjax)
                {      
                    if(MCR.debugOption.debugAjax=="before")
                    {
                        settings.___buildDebug=true;
                        MCR.debug({},context,_success,funcname,___BeforeSendAjax);
                        return false;
                    }
                    else //success
                    {
                        settings.___buildDebug=true;
                        _buildSuccessHandler(context,jqXHR,settings);  
                    }
                }
                return true;
            }
            
            /*
             *针对发起ajax请求返回数据之后再做处理，实质是替换success
             */
            function _buildSuccessHandler(ajaxContext,jqXHR,settings)
            {
                var _success=settings.success;
                var funcname=MCR.getFuncName(_success);
                settings.success=function(json, textStatus, jqXHR)
                {
                    MCR.debug(json,ajaxContext,_success,funcname,"AjaxSuccess");  
                    // _success.call(ajaxContext,data,textStatus, jqXHR);
                }
                return false;
            }
            
            jQuery.ajaxSetup({beforeSend:beforeSendHandler}); //防止global==false
            jQuery(document.body).ajaxSend(ajaxSendHandler);
           
    }
    
    /*
     *调试百度tangram Ajax
     */
    function debugTangramAjax()
    {
        
    }
   
    /*
     * 默认调试选项
     */
    function getDefaultDebugOption()
    {
        return {
            debug:false
            ,debugAjax:false   //在发起ajax获取数据之前就构造数据 
            ,_uiCreated:false //调试UI是否已经创建
        }
    }
    
    /*
     * 显示调试UI
     */
    function _showDebugUI(data,context,func,funcname,type)
    {
        if(!MCR.debugOption._uiCreated)
        {
             _createDebugUI();
        }
        try
        {
            var dialog= MCR.getDOMNode("___dvMCRDebugDataWindow");
            dialog.style.display="block";
            var docuSize=MCR.getDocumentSize();
            var dgWidth=MCR.getWidth(dialog),dgHeight=MCR.getHeight(dialog);
            dialog.style.top=(docuSize.height/2-dgHeight/2)+"px";
            dialog.style.left=(docuSize.width/2-dgWidth/2)+"px";
            
            var jsonString=MCR.stringify(data);
            MCR.getDOMNode("___txtMCRDebugData").value=jsonString; 
            MCR.getDOMNode("___hdMCRDebugOriginalData").value=jsonString;
            MCR.getDOMNode("___dvMCRDebugErrorMsg").style.display="none";
            if(type==___BeforeSendAjax )
            {
                MCR.getDOMNode("___dvMCRDebugCaption").innerHTML="构造返给ajax请求的数据";
            }
            else if(type==___AjaxSuccess)
            {
                MCR.getDOMNode("___dvMCRDebugCaption").innerHTML="返回的ajax数据";
            }
            else
            {
                MCR.getDOMNode("___dvMCRDebugCaption").innerHTML="函数function("+funcname+")的第一个参数";
            }
            
            MCR.getDOMNode("___spMCRDebugType").innerHTML="--"+type;
            
            MCR.bind(MCR.getDOMNode("___btnMCRDebugCloseButton"),"click", __Cancel);
            MCR.bind(MCR.getDOMNode("___btnMCRDebugCancelButton"),"click", __Cancel);
            MCR.bind(MCR.getDOMNode("___btnMCRDebugResetButton"),"click", __Reset);
            MCR.bind(MCR.getDOMNode("___btnMCRDebugOKButton"),"click",__OK);
        }
        catch(e){ throw e;}
        
        function __closeDebugWindow(){ __Clear();MCR.getDOMNode("___dvMCRDebugDataWindow").style.display="none";}
        function __OK()
        { var jsonText= MCR.getDOMNode("___txtMCRDebugData").value,valid=true,parsedData;
                try
                {     
                     if(typeof(JSON)=="object"&&JSON.parse)  parsedData= JSON.parse(jsonText);
                     else  parsedData= (new Function('return '+jsonText))();
                     __closeDebugWindow();
                }
                catch(e)
                {
                    var ___dvMCRDebugErrorMsg=MCR.getDOMNode("___dvMCRDebugErrorMsg");
                    ___dvMCRDebugErrorMsg.innerHTML=e.message;
                    ___dvMCRDebugErrorMsg.style.display="block";
                    valid=false;
                }
                if(valid) func.call(context,parsedData);
        }
        function __Cancel(){__closeDebugWindow();func.call(context,data);}
        function __Reset(){ MCR.getDOMNode("___txtMCRDebugData").value= MCR.getDOMNode("___hdMCRDebugOriginalData").value; }
        function __Clear()
        { 
            MCR.unbind(MCR.getDOMNode("___btnMCRDebugCloseButton"),"click", __Cancel);
            MCR.unbind(MCR.getDOMNode("___btnMCRDebugCancelButton"),"click", __Cancel);
            MCR.unbind(MCR.getDOMNode("___btnMCRDebugResetButton"),"click", __Reset);
            MCR.unbind(MCR.getDOMNode("___btnMCRDebugOKButton"),"click",__OK);
        }
        
    }
    
    /*
     * 创建调试窗口
     */
    function _createDebugUI()
    {
        if( MCR.debugOption._uiCreated) return;
        
        var tpl="<div id='___dvMCRDebugDataWindow' style='display:none;width:400px;z-index:10001;position:absolute;border:1px solid #6B97C1;text-align:center;box-shadow: 0 2px 2px #AAAAAA;'>\n\
                    <div  style='text-align:center;background: none repeat-x scroll 0 0 #8BACCF;height: 28px;'> \n\
                        <h3  style='color: #FFFFFF;float: left;font-size: 13px;height: 28px;line-height: 28px;margin: 0;overflow: hidden;text-indent: 8px;'>MCR调试窗口<span id='___spMCRDebugType'></span></h3>\n\
                        <span id='___btnMCRDebugCloseButton' style='color:white;font-size: 18px;cursor: pointer;float: right;height: 19px;margin:0px 5px 0px 0px;'>x</span> \n\
                    </div>\n\
                    <div id='___dvMCRDebugCaption'>function:</div>\n\
                    <textarea id='___txtMCRDebugData' style='width:390px;height:200px;overflow:auto;border:1px solid #CCCCCC;'></textarea>\n\
                    <input type='hidden' id='___hdMCRDebugOriginalData'/>\n\
                    <div style='padding:10px;'><button type='button' id='___btnMCRDebugOKButton' style='margin:0 15px;'>确认</button><button type='button' id='___btnMCRDebugCancelButton' style='margin:0 15px;'>取消</button><button type='button' id='___btnMCRDebugResetButton' style='margin:0 15px;'>重置</button></div>\n\
                    <div id='___dvMCRDebugErrorMsg'></div>\n\
                </div>"
            MCR.insertHTML(document.body,"beforeEnd", tpl);
            var dialog= MCR.getDOMNode("___dvMCRDebugDataWindow");
            var docuSize=MCR.getDocumentSize();
            var dgWidth=MCR.getWidth(dialog),dgHeight=MCR.getHeight(dialog);
            dialog.style.top=(docuSize.height/2-dgHeight/2)+"px";
            dialog.style.left=(docuSize.width/2-dgWidth/2)+"px";
        
            MCR.debugOption._uiCreated=true;
    }
    
    
      /*
     * 转换成json
     */
    function parseJSON(jsonText )
    {
        if(!jsonText ) 
            return jsonText ;
        else
        {
            if( MCR.isString(jsonText))
            {
                //return  eval('(' + JSONtext + ')')
                var r;
                try
                {
                     if(typeof(JSON)=="object"&&JSON.parse)
                       r= JSON.parse(jsonText);
                     else
                       r= (new Function('return '+jsonText))();
                }
                catch(e)
                { 
                    //alert("The jsonText format which will be parsed for json is wrong!\nThe jsonText is '"+jsonText+"'"); 
                }
                return r;
            }
            else
              return jsonText;
        }
    }
    
    /*
     *获取json格式化函数
     */
    function getStringifyFunction() 
    {
            /**
             * 字符串处理时需要转义的字符表
             * @private
             */
            var escapeMap = {
                "\b": '\\b',
                "\t": '\\t',
                "\n": '\\n',
                "\f": '\\f',
                "\r": '\\r',
                '"' : '\\"',
                "\\": '\\\\'
            };

            /**
             * 字符串序列化
             * @private
             */
            function encodeString(source) {
                if (/["\\\x00-\x1f]/.test(source)) {
                    source = source.replace(
                        /["\\\x00-\x1f]/g, 
                        function (match) {
                            var c = escapeMap[match];
                            if (c) {
                                return c;
                            }
                            c = match.charCodeAt();
                            return "\\u00" 
                                    + Math.floor(c / 16).toString(16) 
                                    + (c % 16).toString(16);
                        });
                }
                return '"' + source + '"';
            }

            /**
             * 数组序列化
             * @private
             */
            function encodeArray(source) {
                var result = ["["], 
                    l = source.length,
                    preComma, i, item;

                for (i = 0; i < l; i++) {
                    item = source[i];

                    switch (typeof item) {
                    case "undefined":
                    case "function":
                    case "unknown":
                        break;
                    default:
                        if(preComma) 
                        {
                            result.push(',');
                        }
                        result.push(MCR.stringify(item))//result.push(baidu.json.stringify(item));
                        preComma = 1;
                    }
                }
                result.push("]");
                return result.join("");
            }

            /**
             * 处理日期序列化时的补零
             * @private
             */
            function pad(source) {
                return source < 10 ? '0' + source : source;
            }

            /**
             * 日期序列化
             * @private
             */
            function encodeDate(source){
                return '"' + source.getFullYear() + "-" 
                        + pad(source.getMonth() + 1) + "-" 
                        + pad(source.getDate()) + "T" 
                        + pad(source.getHours()) + ":" 
                        + pad(source.getMinutes()) + ":" 
                        + pad(source.getSeconds()) + '"';
            }

            return function (value) {
                switch (typeof value) {
                case 'undefined':
                    return 'undefined';
                case 'number':
                    return isFinite(value) ? String(value) : "null";
                case 'string':
                    return encodeString(value);
                case 'boolean':
                    return String(value);
                default:
                    if (value === null) 
                    {
                        return 'null';
                    } 
                    else if (value instanceof Array) 
                    {
                        return encodeArray(value);
                    } 
                    else if (value instanceof Date) 
                    {
                        return encodeDate(value);
                    } 
                    else 
                    {
                        var result = ['{'],
                            encode=arguments.callee//encode = baidu.json.stringify,
                            ,preComma
                            ,item;

                        for (var key in value) {
                            if (Object.prototype.hasOwnProperty.call(value, key)) {
                                item = value[key];
                                switch (typeof item) {
                                case 'undefined':
                                case 'unknown':
                                case 'function':
                                    break;
                                default:
                                    if (preComma) {
                                        result.push(',');
                                    }
                                    preComma = 1;
                                    result.push(encode(key) + ':' + encode(item));
                                }
                            }
                        }
                        result.push('}');
                        return result.join('');
                    }
                }
            };
    };
    

    /*
     * 获得查询字符串
     */
    function getQueryString(item)
    {
         var sValue=document.location.search.match(new RegExp("[\?\&]"+item+"=([^\&]*)(\&?)","i"));
         return sValue?decodeURIComponent(sValue[1]):sValue
    }
    
    
    /*
     *绑定ready事件
     */
    function ready(fn) 
    {
        bindReady();
        if ( MCR.isReady )
            fn();
        else
            MCR.readyList.push( fn );
        return MCR;
   }
    
    /*
     * 执行DOM Ready函数列表
     */
    function readyDo() 
    {
        // Make sure that the DOM is not already loaded
        if ( !MCR.isReady ) 
        {
                // Remember that the DOM is ready
                MCR.isReady = true;

                // If there are functions bound, to execute
                if (MCR.readyList instanceof Array ) 
                {
                        // Execute all of them
                        for(var ix=0;ix< MCR.readyList.length;ix++)
                        {
                            if(typeof MCR.readyList[ix] =="function")
                             MCR.readyList[ix]();
                        }

                        // Reset the list of functions
                        MCR.readyList = null;
                }
        }
    }
    
    /*
     * 绑定DOM Ready事件
     */
    function bindReady()
    {
            if ( MCR.readyBound ) return;
              MCR.readyBound = true;

            // Mozilla, Opera and webkit nightlies currently support this event
            if ( document.addEventListener ) 
            {
                    document.addEventListener( "DOMContentLoaded", function()
                    {
                            document.removeEventListener( "DOMContentLoaded", arguments.callee, false );
                            readyDo();
                    }, false );

            } 
            else if ( document.attachEvent ) 
            {
                    document.attachEvent("onreadystatechange", function()
                    {
                            if ( document.readyState === "complete" ) 
                            {
                                    document.detachEvent( "onreadystatechange", arguments.callee );
                                    readyDo();
                            }
                    });

                    // If IE and not an iframe
                    // continually check to see if the document is ready
                    if ( document.documentElement.doScroll && window == window.top ) 
                    (function()
                    {
                            if ( MCR.isReady ) return;

                            try { document.documentElement.doScroll("left"); } 
                            catch( error ) 
                            { setTimeout( arguments.callee, 0 );return;}
                            
                            readyDo();
                    })();
            }

            window.onload=readyDo;
    }
    
    /*
     * 获取DOM元素
     */
    function getDOMNode(id)
    {
        if ('string' == typeof id || id instanceof String) {
            return document.getElementById(id);
        } else if (id && id.nodeName && (id.nodeType == 1 || id.nodeType == 9)) {
            return id;
        }
        return null;
    }
    
    /*
     * 插入HTML,tangram
     */
     function insertHTML(element, position, html) 
     {
        if(!element||!element.tagName) return;
        var range,begin;

        if (element.insertAdjacentHTML) {
            element.insertAdjacentHTML(position, html);
        } else {
            range = element.ownerDocument.createRange();
            position = position.toUpperCase();
            if (position == 'AFTERBEGIN' || position == 'BEFOREEND') 
            {
                range.selectNodeContents(element);
                range.collapse(position == 'AFTERBEGIN');
            }
            else 
            {
                begin = position == 'BEFOREBEGIN';
                range[begin ? 'setStartBefore' : 'setEndAfter'](element);
                range.collapse(begin);
            }
            range.insertNode(range.createContextualFragment(html));
        }
        return element;
     };    
    
     /*
      * 获取元素的文档坐标
      */
      function getOffset(elem) 
      {
		if ( !isHtmlElement(elem) ) return { top: 0, left: 0 };                
		var box  = elem.getBoundingClientRect(), doc = elem.ownerDocument, body = doc.body, docElem = doc.documentElement,
			clientTop = docElem.clientTop || body.clientTop || 0, clientLeft = docElem.clientLeft || body.clientLeft || 0,
			top  = box.top  + (self.pageYOffset || jQuery.boxModel && docElem.scrollTop  || body.scrollTop ) - clientTop,
			left = box.left + (self.pageXOffset || jQuery.boxModel && docElem.scrollLeft || body.scrollLeft) - clientLeft;
		return { top: top, left: left };
     };
     
     /*
      *获取文档(document)尺寸
      */
     function getDocumentSize()
     {
          return {"width": _getDocumentSizeByName("Width"),"height": _getDocumentSizeByName("Height")};
     }
     function _getDocumentSizeByName(name)
     {
          return Math.max( document.documentElement["client" + name], document.body["scroll" + name]
          ,  document.documentElement["scroll" + name]
          ,document.body["offset" + name],  document.documentElement["offset" + name]) ;
     }
     
     /*
      *获取视口尺寸
      */
     function getViewpointSize()
     {
         return {"width": _getViewpointSizeByName("Width"),"height": _getViewpointSizeByName("Height")};      
     }
     function _getViewpointSizeByName(name)
     {
        return  document.compatMode === "CSS1Compat" && document.documentElement[ "client" + name ] ||document.body[ "client" + name ] ;
     }
     
   
   
     var curCSS; //根据不同的浏览器计算不同的css获取函数
    //计算curCss
    (function()
    {
         var  rupper = /([A-Z])/g
         , rnumpx = /^-?\d+(?:px)?$/i //用(正负)数字开头且以px结尾或者全部为数字的字符串
         , rnum = /^-?\d/; //用(正负)数字开头的字符串

         var getComputedStyle = document.defaultView && document.defaultView.getComputedStyle;

         //curCss()
         if ( getComputedStyle ) 
         {
                curCSS = function( elem, computedName, camelName ) 
                {
                    var ret, defaultView, computedStyle;

                    camelName = camelName.replace( rupper, "-$1" ).toLowerCase();  //rupper = /([A-Z])/g；此语句的功能类似将marginLeft转化成margin-left

                    if ( !(defaultView = elem.ownerDocument.defaultView) ) 
                    {
                        return undefined;
                    }

                    if ( (computedStyle = defaultView.getComputedStyle( elem, null )) ) 
                    {
                        ret = computedStyle.getPropertyValue( camelName );
                        if ( ret === "" && !contains( elem.ownerDocument.documentElement, elem ) ) 
                        {
                            ret = elem.style.name;
                        }
                    }

                    return ret;
                };

         } 
         else if ( document.documentElement.currentStyle ) 
         {
                 curCSS = function( elem,computedName ) 
                 {
                      var left, rsLeft, ret = elem.currentStyle && elem.currentStyle[ computedName ], style = elem.style;

                    // From the awesome hack by Dean Edwards
                    // http://erik.eae.net/archives/2007/07/27/18.54.15/#comment-102291

                    // If we're not dealing with a regular pixel number
                    // but a number that has a weird ending, we need to convert it to pixels 
                    //即：如果IE下获得的返回值不是以像素作为单位的，比如用em等，那么需要用特殊方法将其转化为像素
                    if ( !rnumpx.test( ret ) && rnum.test( ret ) ) 
                    {
                        // Remember the original values
                        left = style.left;
                        rsLeft = elem.runtimeStyle.left;

                        // Put in the new values to get a computed value out
                        elem.runtimeStyle.left = elem.currentStyle.left;
                        style.left = computedName === "fontSize" ? "1em" : (ret || 0);
                        ret = style.pixelLeft + "px";

                        // Revert the changed values
                        style.left = left;
                        elem.runtimeStyle.left = rsLeft;
                    }
                    return ret;
                };
         }
     })();
     /*
      * 获取CSS属性值
      */
     function getCss(elem,name)
     {
         // Don't get css on text and comment nodes
         if ( !elem || elem.nodeType === 3 || elem.nodeType === 8  ) 
         {
            return;
         }
         var origName  = camelCase( name ),computedName; //获得css样式名的驼峰值，即将 margin-left 转化为 marginLeft
         if(name.toLowerCase=="float" )
         {
              computedName=elem.style.styleFloat?"styleFloat":"cssFloat";
         }
         else
         {
             computedName=origName ;
         }           
         return curCSS(elem,computedName,origName);      
     }
     
      
     /*
      *获取css样式名驼峰形式
      */
     function camelCase( string ) 
     {
        var rdashAlpha = /-([a-z])/ig;
        return string.replace( rdashAlpha, function( all, letter ) {return letter.toUpperCase();} );  
     }
   
     var _contains;
     (function()
     {
           _contains = document.documentElement.contains ? function(a, b)
           {
              return a !== b && (a.contains ? a.contains(b) : true);
           } 
           : function(a, b)
           {
              return !!(a.compareDocumentPosition(b) & 16);
           };
     })();
     /*
      *判断一个元素是否包含另外一个元素
      */
     function contains(container,tobeContained)
     {
          return _contains(container,tobeContained);
     }
     
    function  _swap( elem, options, callback ) 
    {
        
        var old = {};

        // Remember the old values, and insert the new ones
        for ( var name in options ) {
            old[ name ] = elem.style[ name ];
            elem.style[ name ] = options[ name ];
        }

        callback.call( elem );

        // Revert the old values
        for ( name in options ) {
            elem.style[ name ] = old[ name ];
        }
    }
     
     /*
      *获得元素占据的宽度
      */
     function getWidth(elem)
     {
        var val;
        var  cssShow = { position: "absolute",   visibility: "hidden",  display: "block"  };
        if ( elem.offsetWidth !== 0 ) 
        {
            val = _getWH( elem, "width" );
        }
        else 
        {
            _swap( elem, cssShow, function() 
            {
                val = _getWH( elem, "width");
            });
        }
        return val;
     }
     
     /*
      *获得元素占据的高度
      */
     function getHeight(elem)
     {
        var val;
        var  cssShow = { position: "absolute",   visibility: "hidden",  display: "block"  };
        if ( elem.offsetWidth !== 0 ) 
        {
            val = _getWH( elem, "height" );
        }
        else 
        {
            _swap( elem, cssShow, function() 
            {
                val =_getWH( elem, "height");
            });
        }
        return val;
     }
     
     function _getWH( elem, name) 
     {
            var  cssWidth = [ "Left", "Right" ],cssHeight = [ "Top", "Bottom" ];
            var which = name === "width" ? cssWidth : cssHeight,
            val = name === "width" ? elem.offsetWidth : elem.offsetHeight;
            for(var i=0,len=which.length;i<len;i++)
            {
                    val -= parseFloat(getCss( elem, "padding" + which[i] )) || 0; //先减去paddingLeft、paddingRight或paddingTop、paddingBottom
                    val -= parseFloat(getCss( elem, "border" + which[i] + "Width" )) || 0; //再减去borderLeft、borderRight或borderTop、borderBottom  
            }
            return val;
     }
    
})(MCR)