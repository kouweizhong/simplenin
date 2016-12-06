/**
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in
 * all copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
 * SOFTWARE.
 */

(function (root, factory) {
    "use strict";

    if (typeof define === 'function' && define.amd) {
        define([], factory);
    }
    else if (typeof module === 'object' && module.exports) {
        module.exports = factory();
    }
    else {
        root.picoModal = factory();
    }
}(this, function () {

    /**
     * A self-contained modal library
     */
    "use strict";

    /** Returns whether a value is a dom node */
    function isNode(value) {
        if ( typeof Node === "object" ) {
            return value instanceof Node;
        }
        else {
            return value &&
                typeof value === "object" &&
                typeof value.nodeType === "number";
        }
    }

    /** Returns whether a value is a string */
    function isString(value) {
        return typeof value === "string";
    }

    /**
     * Generates observable objects that can be watched and triggered
     */
    function observable() {
        var callbacks = [];
        return {
            watch: callbacks.push.bind(callbacks),
            trigger: function( context ) {

                var unprevented = true;
                var event = {
                    preventDefault: function preventDefault () {
                        unprevented = false;
                    }
                };

                for (var i = 0; i < callbacks.length; i++) {
                    callbacks[i](context, event);
                }

                return unprevented;
            }
        };
    }


    /** Whether an element is hidden */
    function isHidden ( elem ) {
        // @see http://stackoverflow.com/questions/19669786
        return window.getComputedStyle(elem).display === 'none';
    }


    /**
     * A small interface for creating and managing a dom element
     */
    function Elem( elem ) {
        this.elem = elem;
    }

    /** Creates a new div */
    Elem.make = function ( parent, tag ) {
        if ( typeof parent === "string" ) {
            parent = document.querySelector(parent);
        }
        var elem = document.createElement(tag || 'div');
        (parent || document.body).appendChild(elem);
        return new Elem(elem);
    };

    Elem.prototype = {

        /** Creates a child of this node */
        child: function (tag) {
            return Elem.make(this.elem, tag);
        },

        /** Applies a set of styles to an element */
        stylize: function(styles) {
            styles = styles || {};

            if ( typeof styles.opacity !== "undefined" ) {
                styles.filter =
                    "alpha(opacity=" + (styles.opacity * 100) + ")";
            }

            for (var prop in styles) {
                if (styles.hasOwnProperty(prop)) {
                    this.elem.style[prop] = styles[prop];
                }
            }

            return this;
        },

        /** Adds a class name */
        clazz: function (clazz) {
            this.elem.className += " " + clazz;
            return this;
        },

        /** Sets the HTML */
        html: function (content) {
            if ( isNode(content) ) {
                this.elem.appendChild( content );
            }
            else {
                this.elem.innerHTML = content;
            }
            return this;
        },

        /** Adds a click handler to this element */
        onClick: function(callback) {
            this.elem.addEventListener('click', callback);
            return this;
        },

        /** Removes this element from the DOM */
        destroy: function() {
            this.elem.parentNode.removeChild(this.elem);
        },

        /** Hides this element */
        hide: function() {
            this.elem.style.display = "none";
        },

        /** Shows this element */
        show: function() {
            this.elem.style.display = "block";
        },

        /** Sets an attribute on this element */
        attr: function ( name, value ) {
            if (value !== undefined) {
                this.elem.setAttribute(name, value);
            }
            return this;
        },

        /** Executes a callback on all the ancestors of an element */
        anyAncestor: function ( predicate ) {
            var elem = this.elem;
            while ( elem ) {
                if ( predicate( new Elem(elem) ) ) {
                    return true;
                }
                else {
                    elem = elem.parentNode;
                }
            }
            return false;
        },

        /** Whether this element is visible */
        isVisible: function () {
            return !isHidden(this.elem);
        }
    };


    /** Generates the grey-out effect */
    function buildOverlay( getOption, close ) {
        return Elem.make( getOption("parent") )
            .clazz("pico-overlay")
            .clazz( getOption("overlayClass", "") )
            .stylize({
                display: "none",
                position: "fixed",
                top: "0px",
                left: "0px",
                height: "100%",
                width: "100%",
                zIndex: 10000
            })
            .stylize(getOption('overlayStyles', {
                opacity: 0.5,
                background: "#000"
            }))
            .onClick(function () {
                if ( getOption('overlayClose', true) ) {
                    close();
                }
            });
    }

    // An auto incrementing ID assigned to each modal
    var autoinc = 1;

    /** Builds the content of a modal */
    function buildModal( getOption, close ) {
        var width = getOption('width', 'auto');
        if ( typeof width === "number" ) {
            width = "" + width + "px";
        }

        var id = getOption("modalId", "pico-" + autoinc++);

        var elem = Elem.make( getOption("parent") )
            .clazz("pico-content")
            .clazz( getOption("modalClass", "") )
            .stylize({
                display: 'none',
                position: 'fixed',
                zIndex: 10001,
                left: "50%",
                top: "38.1966%",
                maxHeight: '90%',
                boxSizing: 'border-box',
                width: width,
                '-ms-transform': 'translate(-50%,-38.1966%)',
                '-moz-transform': 'translate(-50%,-38.1966%)',
                '-webkit-transform': 'translate(-50%,-38.1966%)',
                '-o-transform': 'translate(-50%,-38.1966%)',
                transform: 'translate(-50%,-38.1966%)'
            })
            .stylize(getOption('modalStyles', {
                overflow: 'auto',
                backgroundColor: "white",
                padding: "20px",
                borderRadius: "5px"
            }))
            .html( getOption('content') )
            .attr("id", id)
            .attr("role", "dialog")
            .attr("aria-labelledby", getOption("ariaLabelledBy"))
            .attr("aria-describedby", getOption("ariaDescribedBy", id))
            .onClick(function (event) {
                var isCloseClick = new Elem(event.target)
                    .anyAncestor(function (elem) {
                        return /\bpico-close\b/.test(elem.elem.className);
                    });
                if ( isCloseClick ) {
                    close();
                }
            });

        return elem;
    }

    /** Builds the close button */
    function buildClose ( elem, getOption ) {
        if ( getOption('closeButton', true) ) {
            return elem.child('button')
                .html( getOption('closeHtml', "&#xD7;") )
                .clazz("pico-close")
                .clazz( getOption("closeClass", "") )
                .stylize( getOption('closeStyles', {
                    borderRadius: "2px",
                    border: 0,
                    padding: 0,
                    cursor: "pointer",
                    height: "15px",
                    width: "15px",
                    position: "absolute",
                    top: "5px",
                    right: "5px",
                    fontSize: "16px",
                    textAlign: "center",
                    lineHeight: "15px",
                    background: "#CCC"
                }) )
                .attr("aria-label", getOption("close-label", "Close"));
        }
    }

    /** Builds a method that calls a method and returns an element */
    function buildElemAccessor( builder ) {
        return function () {
            return builder().elem;
        };
    }


    // An observable that is triggered whenever the escape key is pressed
    var escapeKey = observable();

    // An observable that is triggered when the user hits the tab key
    var tabKey = observable();

    /** A global event handler to detect the escape key being pressed */
    document.documentElement.addEventListener(
        'keydown',
        function onKeyPress (event) {
            var keycode = event.which || event.keyCode;

            // If this is the escape key
            if ( keycode === 27 ) {
                escapeKey.trigger();
            }

            // If this is the tab key
            else if ( keycode === 9 ) {
                tabKey.trigger(event);
            }
        }
    );


    /** Attaches focus management events */
    function manageFocus ( iface, isEnabled ) {

        /** Whether an element matches a selector */
        function matches ( elem, selector ) {
            var fn = elem.msMatchesSelector ||
                elem.webkitMatchesSelector ||
                elem.matches;
            return fn.call(elem, selector);
        }

        /**
         * Returns whether an element is focusable
         * @see http://stackoverflow.com/questions/18261595
         */
        function canFocus( elem ) {
            if (
                isHidden(elem) ||
                matches(elem, ":disabled") ||
                elem.hasAttribute("contenteditable")
            ) {
                return false;
            }
            else {
                return elem.hasAttribute("tabindex") ||
                    matches(
                        elem,
                        "input,select,textarea,button,a[href],area[href],iframe"
                    );
            }
        }

        /** Returns the first descendant that can be focused */
        function firstFocusable ( elem ) {
            var items = elem.getElementsByTagName("*");
            for (var i = 0; i < items.length; i++) {
                if ( canFocus(items[i]) ) {
                    return items[i];
                }
            }
        }

        /** Returns the last descendant that can be focused */
        function lastFocusable ( elem ) {
            var items = elem.getElementsByTagName("*");
            for (var i = items.length; i--;) {
                if ( canFocus(items[i]) ) {
                    return items[i];
                }
            }
        }

        // The element focused before the modal opens
        var focused;

        // Records the currently focused element so state can be returned
        // after the modal closes
        iface.beforeShow(function getActiveFocus() {
            focused = document.activeElement;
        });

        // Shift focus into the modal
        iface.afterShow(function focusModal() {
            if ( isEnabled() ) {
                var focusable = firstFocusable(iface.modalElem());
                if ( focusable ) {
                    focusable.focus();
                }
            }
        });

        // Restore the previously focused element when the modal closes
        iface.afterClose(function returnFocus() {
            if ( isEnabled() && focused ) {
                focused.focus();
            }
            focused = null;
        });

        // Capture tab key presses and loop them within the modal
        tabKey.watch(function tabKeyPress (event) {
            if ( isEnabled() && iface.isVisible() ) {
                var first = firstFocusable(iface.modalElem());
                var last = lastFocusable(iface.modalElem());

                var from = event.shiftKey ? first : last;
                if ( from === document.activeElement ) {
                    (event.shiftKey ? last : first).focus();
                    event.preventDefault();
                }
            }
        });
    }

    /**
     * Displays a modal
     */
    return function picoModal(options) {

        if ( isString(options) || isNode(options) ) {
            options = { content: options };
        }

        var afterCreateEvent = observable();
        var beforeShowEvent = observable();
        var afterShowEvent = observable();
        var beforeCloseEvent = observable();
        var afterCloseEvent = observable();

        /**
         * Returns a named option if it has been explicitly defined. Otherwise,
         * it returns the given default value
         */
        function getOption ( opt, defaultValue ) {
            var value = options[opt];
            if ( typeof value === "function" ) {
                value = value( defaultValue );
            }
            return value === undefined ? defaultValue : value;
        }


        // The various DOM elements that constitute the modal
        var modalElem = build.bind(window, 'modal');
        var shadowElem = build.bind(window, 'overlay');
        var closeElem = build.bind(window, 'close');

        // This will eventually contain the modal API returned to the user
        var iface;


        /** Hides this modal */
        function forceClose () {
            shadowElem().hide();
            modalElem().hide();
            afterCloseEvent.trigger(iface);
        }

        /** Gracefully hides this modal */
        function close () {
            if ( beforeCloseEvent.trigger(iface) ) {
                forceClose();
            }
        }

        /** Wraps a method so it returns the modal interface */
        function returnIface ( callback ) {
            return function () {
                callback.apply(this, arguments);
                return iface;
            };
        }


        // The constructed dom nodes
        var built;

        /** Builds a method that calls a method and returns an element */
        function build ( name ) {
            if ( !built ) {
                var modal = buildModal(getOption, close);
                built = {
                    modal: modal,
                    overlay: buildOverlay(getOption, close),
                    close: buildClose(modal, getOption)
                };
                afterCreateEvent.trigger(iface);
            }
            return built[name];
        }

        iface = {

            /** Returns the wrapping modal element */
            modalElem: buildElemAccessor(modalElem),

            /** Returns the close button element */
            closeElem: buildElemAccessor(closeElem),

            /** Returns the overlay element */
            overlayElem: buildElemAccessor(shadowElem),

            /** Builds the dom without showing the modal */
            buildDom: returnIface(build),

            /** Returns whether this modal is currently being shown */
            isVisible: function () {
                return !!(built && modalElem && modalElem().isVisible());
            },

            /** Shows this modal */
            show: function () {
                if ( beforeShowEvent.trigger(iface) ) {
                    shadowElem().show();
                    closeElem();
                    modalElem().show();
                    afterShowEvent.trigger(iface);
                }
                return this;
            },

            /** Hides this modal */
            close: returnIface(close),

            /**
             * Force closes this modal. This will not call beforeClose
             * events and will just immediately hide the modal
             */
            forceClose: returnIface(forceClose),

            /** Destroys this modal */
            destroy: function () {
                modalElem().destroy();
                shadowElem().destroy();
                shadowElem = modalElem = closeElem = undefined;
            },

            /**
             * Updates the options for this modal. This will only let you
             * change options that are re-evaluted regularly, such as
             * `overlayClose`.
             */
            options: function ( opts ) {
                Object.keys(opts).map(function (key) {
                    options[key] = opts[key];
                });
            },

            /** Executes after the DOM nodes are created */
            afterCreate: returnIface(afterCreateEvent.watch),

            /** Executes a callback before this modal is closed */
            beforeShow: returnIface(beforeShowEvent.watch),

            /** Executes a callback after this modal is shown */
            afterShow: returnIface(afterShowEvent.watch),

            /** Executes a callback before this modal is closed */
            beforeClose: returnIface(beforeCloseEvent.watch),

            /** Executes a callback after this modal is closed */
            afterClose: returnIface(afterCloseEvent.watch)
        };

        manageFocus(iface, getOption.bind(null, "focus", true));

        // If a user presses the 'escape' key, close the modal.
        escapeKey.watch(function escapeKeyPress () {
            if ( getOption("escCloses", true) && iface.isVisible() ) {
                iface.close();
            }
        });

        return iface;
    };

}));

;
/*! iFrame Resizer (iframeSizer.min.js ) - v3.5.5 - 2016-06-16
 *  Desc: Force cross domain iframes to size to content.
 *  Requires: iframeResizer.contentWindow.min.js to be loaded into the target frame.
 *  Copyright: (c) 2016 David J. Bradshaw - dave@bradshaw.net
 *  License: MIT
 */

!function(a){"use strict";function b(b,c,d){"addEventListener"in a?b.addEventListener(c,d,!1):"attachEvent"in a&&b.attachEvent("on"+c,d)}function c(b,c,d){"removeEventListener"in a?b.removeEventListener(c,d,!1):"detachEvent"in a&&b.detachEvent("on"+c,d)}function d(){var b,c=["moz","webkit","o","ms"];for(b=0;b<c.length&&!N;b+=1)N=a[c[b]+"RequestAnimationFrame"];N||h("setup","RequestAnimationFrame not supported")}function e(b){var c="Host page: "+b;return a.top!==a.self&&(c=a.parentIFrame&&a.parentIFrame.getId?a.parentIFrame.getId()+": "+b:"Nested host page: "+b),c}function f(a){return K+"["+e(a)+"]"}function g(a){return P[a]?P[a].log:G}function h(a,b){k("log",a,b,g(a))}function i(a,b){k("info",a,b,g(a))}function j(a,b){k("warn",a,b,!0)}function k(b,c,d,e){!0===e&&"object"==typeof a.console&&console[b](f(c),d)}function l(d){function e(){function a(){s(V),p(W)}g("Height"),g("Width"),t(a,V,"init")}function f(){var a=U.substr(L).split(":");return{iframe:P[a[0]].iframe,id:a[0],height:a[1],width:a[2],type:a[3]}}function g(a){var b=Number(P[W]["max"+a]),c=Number(P[W]["min"+a]),d=a.toLowerCase(),e=Number(V[d]);h(W,"Checking "+d+" is in range "+c+"-"+b),c>e&&(e=c,h(W,"Set "+d+" to min value")),e>b&&(e=b,h(W,"Set "+d+" to max value")),V[d]=""+e}function k(){function a(){function a(){var a=0,d=!1;for(h(W,"Checking connection is from allowed list of origins: "+c);a<c.length;a++)if(c[a]===b){d=!0;break}return d}function d(){var a=P[W].remoteHost;return h(W,"Checking connection is from: "+a),b===a}return c.constructor===Array?a():d()}var b=d.origin,c=P[W].checkOrigin;if(c&&""+b!="null"&&!a())throw new Error("Unexpected message received from: "+b+" for "+V.iframe.id+". Message was: "+d.data+". This error can be disabled by setting the checkOrigin: false option or by providing of array of trusted domains.");return!0}function l(){return K===(""+U).substr(0,L)&&U.substr(L).split(":")[0]in P}function w(){var a=V.type in{"true":1,"false":1,undefined:1};return a&&h(W,"Ignoring init message from meta parent page"),a}function y(a){return U.substr(U.indexOf(":")+J+a)}function z(a){h(W,"MessageCallback passed: {iframe: "+V.iframe.id+", message: "+a+"}"),N("messageCallback",{iframe:V.iframe,message:JSON.parse(a)}),h(W,"--")}function A(){var b=document.body.getBoundingClientRect(),c=V.iframe.getBoundingClientRect();return JSON.stringify({iframeHeight:c.height,iframeWidth:c.width,clientHeight:Math.max(document.documentElement.clientHeight,a.innerHeight||0),clientWidth:Math.max(document.documentElement.clientWidth,a.innerWidth||0),offsetTop:parseInt(c.top-b.top,10),offsetLeft:parseInt(c.left-b.left,10),scrollTop:a.pageYOffset,scrollLeft:a.pageXOffset})}function B(a,b){function c(){u("Send Page Info","pageInfo:"+A(),a,b)}x(c,32)}function C(){function d(b,c){function d(){P[g]?B(P[g].iframe,g):e()}["scroll","resize"].forEach(function(e){h(g,b+e+" listener for sendPageInfo"),c(a,e,d)})}function e(){d("Remove ",c)}function f(){d("Add ",b)}var g=W;f(),P[g].stopPageInfo=e}function D(){P[W]&&P[W].stopPageInfo&&(P[W].stopPageInfo(),delete P[W].stopPageInfo)}function E(){var a=!0;return null===V.iframe&&(j(W,"IFrame ("+V.id+") not found"),a=!1),a}function F(a){var b=a.getBoundingClientRect();return o(W),{x:Math.floor(Number(b.left)+Number(M.x)),y:Math.floor(Number(b.top)+Number(M.y))}}function G(b){function c(){M=g,H(),h(W,"--")}function d(){return{x:Number(V.width)+f.x,y:Number(V.height)+f.y}}function e(){a.parentIFrame?a.parentIFrame["scrollTo"+(b?"Offset":"")](g.x,g.y):j(W,"Unable to scroll to requested position, window.parentIFrame not found")}var f=b?F(V.iframe):{x:0,y:0},g=d();h(W,"Reposition requested from iFrame (offset x:"+f.x+" y:"+f.y+")"),a.top!==a.self?e():c()}function H(){!1!==N("scrollCallback",M)?p(W):q()}function I(b){function c(){var a=F(g);h(W,"Moving to in page link (#"+e+") at x: "+a.x+" y: "+a.y),M={x:a.x,y:a.y},H(),h(W,"--")}function d(){a.parentIFrame?a.parentIFrame.moveToAnchor(e):h(W,"In page link #"+e+" not found and window.parentIFrame not found")}var e=b.split("#")[1]||"",f=decodeURIComponent(e),g=document.getElementById(f)||document.getElementsByName(f)[0];g?c():a.top!==a.self?d():h(W,"In page link #"+e+" not found")}function N(a,b){return m(W,a,b)}function O(){switch(P[W].firstRun&&T(),V.type){case"close":n(V.iframe);break;case"message":z(y(6));break;case"scrollTo":G(!1);break;case"scrollToOffset":G(!0);break;case"pageInfo":B(P[W].iframe,W),C();break;case"pageInfoStop":D();break;case"inPageLink":I(y(9));break;case"reset":r(V);break;case"init":e(),N("initCallback",V.iframe),N("resizedCallback",V);break;default:e(),N("resizedCallback",V)}}function Q(a){var b=!0;return P[a]||(b=!1,j(V.type+" No settings for "+a+". Message was: "+U)),b}function S(){for(var a in P)u("iFrame requested init",v(a),document.getElementById(a),a)}function T(){P[W].firstRun=!1}var U=d.data,V={},W=null;"[iFrameResizerChild]Ready"===U?S():l()?(V=f(),W=R=V.id,!w()&&Q(W)&&(h(W,"Received: "+U),E()&&k()&&O())):i(W,"Ignored: "+U)}function m(a,b,c){var d=null,e=null;if(P[a]){if(d=P[a][b],"function"!=typeof d)throw new TypeError(b+" on iFrame["+a+"] is not a function");e=d(c)}return e}function n(a){var b=a.id;h(b,"Removing iFrame: "+b),a.parentNode.removeChild(a),m(b,"closedCallback",b),h(b,"--"),delete P[b]}function o(b){null===M&&(M={x:void 0!==a.pageXOffset?a.pageXOffset:document.documentElement.scrollLeft,y:void 0!==a.pageYOffset?a.pageYOffset:document.documentElement.scrollTop},h(b,"Get page position: "+M.x+","+M.y))}function p(b){null!==M&&(a.scrollTo(M.x,M.y),h(b,"Set page position: "+M.x+","+M.y),q())}function q(){M=null}function r(a){function b(){s(a),u("reset","reset",a.iframe,a.id)}h(a.id,"Size reset requested by "+("init"===a.type?"host page":"iFrame")),o(a.id),t(b,a,"reset")}function s(a){function b(b){a.iframe.style[b]=a[b]+"px",h(a.id,"IFrame ("+e+") "+b+" set to "+a[b]+"px")}function c(b){H||"0"!==a[b]||(H=!0,h(e,"Hidden iFrame detected, creating visibility listener"),y())}function d(a){b(a),c(a)}var e=a.iframe.id;P[e]&&(P[e].sizeHeight&&d("height"),P[e].sizeWidth&&d("width"))}function t(a,b,c){c!==b.type&&N?(h(b.id,"Requesting animation frame"),N(a)):a()}function u(a,b,c,d){function e(){var e=P[d].targetOrigin;h(d,"["+a+"] Sending msg to iframe["+d+"] ("+b+") targetOrigin: "+e),c.contentWindow.postMessage(K+b,e)}function f(){i(d,"["+a+"] IFrame("+d+") not found"),P[d]&&delete P[d]}function g(){c&&"contentWindow"in c&&null!==c.contentWindow?e():f()}d=d||c.id,P[d]&&g()}function v(a){return a+":"+P[a].bodyMarginV1+":"+P[a].sizeWidth+":"+P[a].log+":"+P[a].interval+":"+P[a].enablePublicMethods+":"+P[a].autoResize+":"+P[a].bodyMargin+":"+P[a].heightCalculationMethod+":"+P[a].bodyBackground+":"+P[a].bodyPadding+":"+P[a].tolerance+":"+P[a].inPageLinks+":"+P[a].resizeFrom+":"+P[a].widthCalculationMethod}function w(a,c){function d(){function b(b){1/0!==P[w][b]&&0!==P[w][b]&&(a.style[b]=P[w][b]+"px",h(w,"Set "+b+" = "+P[w][b]+"px"))}function c(a){if(P[w]["min"+a]>P[w]["max"+a])throw new Error("Value for min"+a+" can not be greater than max"+a)}c("Height"),c("Width"),b("maxHeight"),b("minHeight"),b("maxWidth"),b("minWidth")}function e(){var a=c&&c.id||S.id+F++;return null!==document.getElementById(a)&&(a+=F++),a}function f(b){return R=b,""===b&&(a.id=b=e(),G=(c||{}).log,R=b,h(b,"Added missing iframe ID: "+b+" ("+a.src+")")),b}function g(){h(w,"IFrame scrolling "+(P[w].scrolling?"enabled":"disabled")+" for "+w),a.style.overflow=!1===P[w].scrolling?"hidden":"auto",a.scrolling=!1===P[w].scrolling?"no":"yes"}function i(){("number"==typeof P[w].bodyMargin||"0"===P[w].bodyMargin)&&(P[w].bodyMarginV1=P[w].bodyMargin,P[w].bodyMargin=""+P[w].bodyMargin+"px")}function k(){var b=P[w].firstRun,c=P[w].heightCalculationMethod in O;!b&&c&&r({iframe:a,height:0,width:0,type:"init"})}function l(){Function.prototype.bind&&(P[w].iframe.iFrameResizer={close:n.bind(null,P[w].iframe),resize:u.bind(null,"Window resize","resize",P[w].iframe),moveToAnchor:function(a){u("Move to anchor","moveToAnchor:"+a,P[w].iframe,w)},sendMessage:function(a){a=JSON.stringify(a),u("Send Message","message:"+a,P[w].iframe,w)}})}function m(c){function d(){u("iFrame.onload",c,a),k()}b(a,"load",d),u("init",c,a)}function o(a){if("object"!=typeof a)throw new TypeError("Options is not an object")}function p(a){for(var b in S)S.hasOwnProperty(b)&&(P[w][b]=a.hasOwnProperty(b)?a[b]:S[b])}function q(a){return""===a||"file://"===a?"*":a}function s(b){b=b||{},P[w]={firstRun:!0,iframe:a,remoteHost:a.src.split("/").slice(0,3).join("/")},o(b),p(b),P[w].targetOrigin=!0===P[w].checkOrigin?q(P[w].remoteHost):"*"}function t(){return w in P&&"iFrameResizer"in a}var w=f(a.id);t()?j(w,"Ignored iFrame, already setup."):(s(c),g(),d(),i(),m(v(w)),l())}function x(a,b){null===Q&&(Q=setTimeout(function(){Q=null,a()},b))}function y(){function b(){function a(a){function b(b){return"0px"===P[a].iframe.style[b]}function c(a){return null!==a.offsetParent}c(P[a].iframe)&&(b("height")||b("width"))&&u("Visibility change","resize",P[a].iframe,a)}for(var b in P)a(b)}function c(a){h("window","Mutation observed: "+a[0].target+" "+a[0].type),x(b,16)}function d(){var a=document.querySelector("body"),b={attributes:!0,attributeOldValue:!1,characterData:!0,characterDataOldValue:!1,childList:!0,subtree:!0},d=new e(c);d.observe(a,b)}var e=a.MutationObserver||a.WebKitMutationObserver;e&&d()}function z(a){function b(){B("Window "+a,"resize")}h("window","Trigger event: "+a),x(b,16)}function A(){function a(){B("Tab Visable","resize")}"hidden"!==document.visibilityState&&(h("document","Trigger event: Visiblity change"),x(a,16))}function B(a,b){function c(a){return"parent"===P[a].resizeFrom&&P[a].autoResize&&!P[a].firstRun}for(var d in P)c(d)&&u(a,b,document.getElementById(d),d)}function C(){b(a,"message",l),b(a,"resize",function(){z("resize")}),b(document,"visibilitychange",A),b(document,"-webkit-visibilitychange",A),b(a,"focusin",function(){z("focus")}),b(a,"focus",function(){z("focus")})}function D(){function a(a,c){function d(){if(!c.tagName)throw new TypeError("Object is not a valid DOM element");if("IFRAME"!==c.tagName.toUpperCase())throw new TypeError("Expected <IFRAME> tag, found <"+c.tagName+">")}c&&(d(),w(c,a),b.push(c))}var b;return d(),C(),function(c,d){switch(b=[],typeof d){case"undefined":case"string":Array.prototype.forEach.call(document.querySelectorAll(d||"iframe"),a.bind(void 0,c));break;case"object":a(c,d);break;default:throw new TypeError("Unexpected data type ("+typeof d+")")}return b}}function E(a){a.fn?a.fn.iFrameResize=function(a){function b(b,c){w(c,a)}return this.filter("iframe").each(b).end()}:i("","Unable to bind to jQuery, it is not fully loaded.")}var F=0,G=!1,H=!1,I="message",J=I.length,K="[iFrameSizer]",L=K.length,M=null,N=a.requestAnimationFrame,O={max:1,scroll:1,bodyScroll:1,documentElementScroll:1},P={},Q=null,R="Host Page",S={autoResize:!0,bodyBackground:null,bodyMargin:null,bodyMarginV1:8,bodyPadding:null,checkOrigin:!0,inPageLinks:!1,enablePublicMethods:!0,heightCalculationMethod:"bodyOffset",id:"iFrameResizer",interval:32,log:!1,maxHeight:1/0,maxWidth:1/0,minHeight:0,minWidth:0,resizeFrom:"parent",scrolling:!1,sizeHeight:!0,sizeWidth:!1,tolerance:0,widthCalculationMethod:"scroll",closedCallback:function(){},initCallback:function(){},messageCallback:function(){j("MessageCallback function not defined")},resizedCallback:function(){},scrollCallback:function(){return!0}};a.jQuery&&E(jQuery),"function"==typeof define&&define.amd?define([],D):"object"==typeof module&&"object"==typeof module.exports?module.exports=D():a.iFrameResize=a.iFrameResize||D()}(window||{});
//# sourceMappingURL=iframeResizer.map
/**
 * @license
 * Video.js 5.10.4 <http://videojs.com/>
 * Copyright Brightcove, Inc. <https://www.brightcove.com/>
 * Available under Apache License Version 2.0
 * <https://github.com/videojs/video.js/blob/master/LICENSE>
 *
 * Includes vtt.js <https://github.com/mozilla/vtt.js>
 * Available under Apache License Version 2.0
 * <https://github.com/mozilla/vtt.js/blob/master/LICENSE>
 */
!function(a){if("object"==typeof exports&&"undefined"!=typeof module)module.exports=a();else if("function"==typeof define&&define.amd)define([],a);else{var b;b="undefined"!=typeof window?window:"undefined"!=typeof global?global:"undefined"!=typeof self?self:this,b.videojs=a()}}(function(){var a;return function b(a,c,d){function e(g,h){if(!c[g]){if(!a[g]){var i="function"==typeof require&&require;if(!h&&i)return i(g,!0);if(f)return f(g,!0);var j=new Error("Cannot find module '"+g+"'");throw j.code="MODULE_NOT_FOUND",j}var k=c[g]={exports:{}};a[g][0].call(k.exports,function(b){var c=a[g][1][b];return e(c?c:b)},k,k.exports,b,a,c,d)}return c[g].exports}for(var f="function"==typeof require&&require,g=0;g<d.length;g++)e(d[g]);return e}({1:[function(a,b){(function(c){var d="undefined"!=typeof c?c:"undefined"!=typeof window?window:{},e=a("min-document");if("undefined"!=typeof document)b.exports=document;else{var f=d["__GLOBAL_DOCUMENT_CACHE@4"];f||(f=d["__GLOBAL_DOCUMENT_CACHE@4"]=e),b.exports=f}}).call(this,"undefined"!=typeof global?global:"undefined"!=typeof self?self:"undefined"!=typeof window?window:{})},{"min-document":3}],2:[function(a,b){(function(a){b.exports="undefined"!=typeof window?window:"undefined"!=typeof a?a:"undefined"!=typeof self?self:{}}).call(this,"undefined"!=typeof global?global:"undefined"!=typeof self?self:"undefined"!=typeof window?window:{})},{}],3:[function(){},{}],4:[function(a,b){var c=a("../internal/getNative"),d=c(Date,"now"),e=d||function(){return(new Date).getTime()};b.exports=e},{"../internal/getNative":20}],5:[function(a,b){function c(a,b,c){function h(){r&&clearTimeout(r),n&&clearTimeout(n),t=0,n=r=s=void 0}function i(b,c){c&&clearTimeout(c),n=r=s=void 0,b&&(t=e(),o=a.apply(q,m),r||n||(m=q=void 0))}function j(){var a=b-(e()-p);0>=a||a>b?i(s,n):r=setTimeout(j,a)}function k(){i(v,r)}function l(){if(m=arguments,p=e(),q=this,s=v&&(r||!w),u===!1)var c=w&&!r;else{n||w||(t=p);var d=u-(p-t),f=0>=d||d>u;f?(n&&(n=clearTimeout(n)),t=p,o=a.apply(q,m)):n||(n=setTimeout(k,d))}return f&&r?r=clearTimeout(r):r||b===u||(r=setTimeout(j,b)),c&&(f=!0,o=a.apply(q,m)),!f||r||n||(m=q=void 0),o}var m,n,o,p,q,r,s,t=0,u=!1,v=!0;if("function"!=typeof a)throw new TypeError(f);if(b=0>b?0:+b||0,c===!0){var w=!0;v=!1}else d(c)&&(w=!!c.leading,u="maxWait"in c&&g(+c.maxWait||0,b),v="trailing"in c?!!c.trailing:v);return l.cancel=h,l}var d=a("../lang/isObject"),e=a("../date/now"),f="Expected a function",g=Math.max;b.exports=c},{"../date/now":4,"../lang/isObject":33}],6:[function(a,b){function c(a,b){if("function"!=typeof a)throw new TypeError(d);return b=e(void 0===b?a.length-1:+b||0,0),function(){for(var c=arguments,d=-1,f=e(c.length-b,0),g=Array(f);++d<f;)g[d]=c[b+d];switch(b){case 0:return a.call(this,g);case 1:return a.call(this,c[0],g);case 2:return a.call(this,c[0],c[1],g)}var h=Array(b+1);for(d=-1;++d<b;)h[d]=c[d];return h[b]=g,a.apply(this,h)}}var d="Expected a function",e=Math.max;b.exports=c},{}],7:[function(a,b){function c(a,b,c){var g=!0,h=!0;if("function"!=typeof a)throw new TypeError(f);return c===!1?g=!1:e(c)&&(g="leading"in c?!!c.leading:g,h="trailing"in c?!!c.trailing:h),d(a,b,{leading:g,maxWait:+b,trailing:h})}var d=a("./debounce"),e=a("../lang/isObject"),f="Expected a function";b.exports=c},{"../lang/isObject":33,"./debounce":5}],8:[function(a,b){function c(a,b){var c=-1,d=a.length;for(b||(b=Array(d));++c<d;)b[c]=a[c];return b}b.exports=c},{}],9:[function(a,b){function c(a,b){for(var c=-1,d=a.length;++c<d&&b(a[c],c,a)!==!1;);return a}b.exports=c},{}],10:[function(a,b){function c(a,b,c){c||(c={});for(var d=-1,e=b.length;++d<e;){var f=b[d];c[f]=a[f]}return c}b.exports=c},{}],11:[function(a,b){var c=a("./createBaseFor"),d=c();b.exports=d},{"./createBaseFor":18}],12:[function(a,b){function c(a,b){return d(a,b,e)}var d=a("./baseFor"),e=a("../object/keysIn");b.exports=c},{"../object/keysIn":39,"./baseFor":11}],13:[function(a,b){function c(a,b,l,m,n){if(!h(a))return a;var o=g(b)&&(f(b)||j(b)),p=o?void 0:k(b);return d(p||b,function(d,f){if(p&&(f=d,d=b[f]),i(d))m||(m=[]),n||(n=[]),e(a,b,f,c,l,m,n);else{var g=a[f],h=l?l(g,d,f,a,b):void 0,j=void 0===h;j&&(h=d),void 0===h&&(!o||f in a)||!j&&(h===h?h===g:g!==g)||(a[f]=h)}}),a}var d=a("./arrayEach"),e=a("./baseMergeDeep"),f=a("../lang/isArray"),g=a("./isArrayLike"),h=a("../lang/isObject"),i=a("./isObjectLike"),j=a("../lang/isTypedArray"),k=a("../object/keys");b.exports=c},{"../lang/isArray":30,"../lang/isObject":33,"../lang/isTypedArray":36,"../object/keys":38,"./arrayEach":9,"./baseMergeDeep":14,"./isArrayLike":21,"./isObjectLike":26}],14:[function(a,b){function c(a,b,c,k,l,m,n){for(var o=m.length,p=b[c];o--;)if(m[o]==p)return void(a[c]=n[o]);var q=a[c],r=l?l(q,p,c,a,b):void 0,s=void 0===r;s&&(r=p,g(p)&&(f(p)||i(p))?r=f(q)?q:g(q)?d(q):[]:h(p)||e(p)?r=e(q)?j(q):h(q)?q:{}:s=!1),m.push(p),n.push(r),s?a[c]=k(r,p,l,m,n):(r===r?r!==q:q===q)&&(a[c]=r)}var d=a("./arrayCopy"),e=a("../lang/isArguments"),f=a("../lang/isArray"),g=a("./isArrayLike"),h=a("../lang/isPlainObject"),i=a("../lang/isTypedArray"),j=a("../lang/toPlainObject");b.exports=c},{"../lang/isArguments":29,"../lang/isArray":30,"../lang/isPlainObject":34,"../lang/isTypedArray":36,"../lang/toPlainObject":37,"./arrayCopy":8,"./isArrayLike":21}],15:[function(a,b){function c(a){return function(b){return null==b?void 0:d(b)[a]}}var d=a("./toObject");b.exports=c},{"./toObject":28}],16:[function(a,b){function c(a,b,c){if("function"!=typeof a)return d;if(void 0===b)return a;switch(c){case 1:return function(c){return a.call(b,c)};case 3:return function(c,d,e){return a.call(b,c,d,e)};case 4:return function(c,d,e,f){return a.call(b,c,d,e,f)};case 5:return function(c,d,e,f,g){return a.call(b,c,d,e,f,g)}}return function(){return a.apply(b,arguments)}}var d=a("../utility/identity");b.exports=c},{"../utility/identity":42}],17:[function(a,b){function c(a){return f(function(b,c){var f=-1,g=null==b?0:c.length,h=g>2?c[g-2]:void 0,i=g>2?c[2]:void 0,j=g>1?c[g-1]:void 0;for("function"==typeof h?(h=d(h,j,5),g-=2):(h="function"==typeof j?j:void 0,g-=h?1:0),i&&e(c[0],c[1],i)&&(h=3>g?void 0:h,g=1);++f<g;){var k=c[f];k&&a(b,k,h)}return b})}var d=a("./bindCallback"),e=a("./isIterateeCall"),f=a("../function/restParam");b.exports=c},{"../function/restParam":6,"./bindCallback":16,"./isIterateeCall":24}],18:[function(a,b){function c(a){return function(b,c,e){for(var f=d(b),g=e(b),h=g.length,i=a?h:-1;a?i--:++i<h;){var j=g[i];if(c(f[j],j,f)===!1)break}return b}}var d=a("./toObject");b.exports=c},{"./toObject":28}],19:[function(a,b){var c=a("./baseProperty"),d=c("length");b.exports=d},{"./baseProperty":15}],20:[function(a,b){function c(a,b){var c=null==a?void 0:a[b];return d(c)?c:void 0}var d=a("../lang/isNative");b.exports=c},{"../lang/isNative":32}],21:[function(a,b){function c(a){return null!=a&&e(d(a))}var d=a("./getLength"),e=a("./isLength");b.exports=c},{"./getLength":19,"./isLength":25}],22:[function(a,b){var c=function(){try{Object({toString:0}+"")}catch(a){return function(){return!1}}return function(a){return"function"!=typeof a.toString&&"string"==typeof(a+"")}}();b.exports=c},{}],23:[function(a,b){function c(a,b){return a="number"==typeof a||d.test(a)?+a:-1,b=null==b?e:b,a>-1&&a%1==0&&b>a}var d=/^\d+$/,e=9007199254740991;b.exports=c},{}],24:[function(a,b){function c(a,b,c){if(!f(c))return!1;var g=typeof b;if("number"==g?d(c)&&e(b,c.length):"string"==g&&b in c){var h=c[b];return a===a?a===h:h!==h}return!1}var d=a("./isArrayLike"),e=a("./isIndex"),f=a("../lang/isObject");b.exports=c},{"../lang/isObject":33,"./isArrayLike":21,"./isIndex":23}],25:[function(a,b){function c(a){return"number"==typeof a&&a>-1&&a%1==0&&d>=a}var d=9007199254740991;b.exports=c},{}],26:[function(a,b){function c(a){return!!a&&"object"==typeof a}b.exports=c},{}],27:[function(a,b){function c(a){for(var b=i(a),c=b.length,j=c&&a.length,l=!!j&&g(j)&&(e(a)||d(a)||h(a)),m=-1,n=[];++m<c;){var o=b[m];(l&&f(o,j)||k.call(a,o))&&n.push(o)}return n}var d=a("../lang/isArguments"),e=a("../lang/isArray"),f=a("./isIndex"),g=a("./isLength"),h=a("../lang/isString"),i=a("../object/keysIn"),j=Object.prototype,k=j.hasOwnProperty;b.exports=c},{"../lang/isArguments":29,"../lang/isArray":30,"../lang/isString":35,"../object/keysIn":39,"./isIndex":23,"./isLength":25}],28:[function(a,b){function c(a){if(f.unindexedChars&&e(a)){for(var b=-1,c=a.length,g=Object(a);++b<c;)g[b]=a.charAt(b);return g}return d(a)?a:Object(a)}var d=a("../lang/isObject"),e=a("../lang/isString"),f=a("../support");b.exports=c},{"../lang/isObject":33,"../lang/isString":35,"../support":41}],29:[function(a,b){function c(a){return e(a)&&d(a)&&g.call(a,"callee")&&!h.call(a,"callee")}var d=a("../internal/isArrayLike"),e=a("../internal/isObjectLike"),f=Object.prototype,g=f.hasOwnProperty,h=f.propertyIsEnumerable;b.exports=c},{"../internal/isArrayLike":21,"../internal/isObjectLike":26}],30:[function(a,b){var c=a("../internal/getNative"),d=a("../internal/isLength"),e=a("../internal/isObjectLike"),f="[object Array]",g=Object.prototype,h=g.toString,i=c(Array,"isArray"),j=i||function(a){return e(a)&&d(a.length)&&h.call(a)==f};b.exports=j},{"../internal/getNative":20,"../internal/isLength":25,"../internal/isObjectLike":26}],31:[function(a,b){function c(a){return d(a)&&g.call(a)==e}var d=a("./isObject"),e="[object Function]",f=Object.prototype,g=f.toString;b.exports=c},{"./isObject":33}],32:[function(a,b){function c(a){return null==a?!1:d(a)?k.test(i.call(a)):f(a)&&(e(a)?k:g).test(a)}var d=a("./isFunction"),e=a("../internal/isHostObject"),f=a("../internal/isObjectLike"),g=/^\[object .+?Constructor\]$/,h=Object.prototype,i=Function.prototype.toString,j=h.hasOwnProperty,k=RegExp("^"+i.call(j).replace(/[\\^$.*+?()[\]{}|]/g,"\\$&").replace(/hasOwnProperty|(function).*?(?=\\\()| for .+?(?=\\\])/g,"$1.*?")+"$");b.exports=c},{"../internal/isHostObject":22,"../internal/isObjectLike":26,"./isFunction":31}],33:[function(a,b){function c(a){var b=typeof a;return!!a&&("object"==b||"function"==b)}b.exports=c},{}],34:[function(a,b){function c(a){var b;if(!g(a)||l.call(a)!=i||f(a)||e(a)||!k.call(a,"constructor")&&(b=a.constructor,"function"==typeof b&&!(b instanceof b)))return!1;var c;return h.ownLast?(d(a,function(a,b,d){return c=k.call(d,b),!1}),c!==!1):(d(a,function(a,b){c=b}),void 0===c||k.call(a,c))}var d=a("../internal/baseForIn"),e=a("./isArguments"),f=a("../internal/isHostObject"),g=a("../internal/isObjectLike"),h=a("../support"),i="[object Object]",j=Object.prototype,k=j.hasOwnProperty,l=j.toString;b.exports=c},{"../internal/baseForIn":12,"../internal/isHostObject":22,"../internal/isObjectLike":26,"../support":41,"./isArguments":29}],35:[function(a,b){function c(a){return"string"==typeof a||d(a)&&g.call(a)==e}var d=a("../internal/isObjectLike"),e="[object String]",f=Object.prototype,g=f.toString;b.exports=c},{"../internal/isObjectLike":26}],36:[function(a,b){function c(a){return e(a)&&d(a.length)&&!!C[E.call(a)]}var d=a("../internal/isLength"),e=a("../internal/isObjectLike"),f="[object Arguments]",g="[object Array]",h="[object Boolean]",i="[object Date]",j="[object Error]",k="[object Function]",l="[object Map]",m="[object Number]",n="[object Object]",o="[object RegExp]",p="[object Set]",q="[object String]",r="[object WeakMap]",s="[object ArrayBuffer]",t="[object Float32Array]",u="[object Float64Array]",v="[object Int8Array]",w="[object Int16Array]",x="[object Int32Array]",y="[object Uint8Array]",z="[object Uint8ClampedArray]",A="[object Uint16Array]",B="[object Uint32Array]",C={};C[t]=C[u]=C[v]=C[w]=C[x]=C[y]=C[z]=C[A]=C[B]=!0,C[f]=C[g]=C[s]=C[h]=C[i]=C[j]=C[k]=C[l]=C[m]=C[n]=C[o]=C[p]=C[q]=C[r]=!1;var D=Object.prototype,E=D.toString;b.exports=c},{"../internal/isLength":25,"../internal/isObjectLike":26}],37:[function(a,b){function c(a){return d(a,e(a))}var d=a("../internal/baseCopy"),e=a("../object/keysIn");b.exports=c},{"../internal/baseCopy":10,"../object/keysIn":39}],38:[function(a,b){var c=a("../internal/getNative"),d=a("../internal/isArrayLike"),e=a("../lang/isObject"),f=a("../internal/shimKeys"),g=a("../support"),h=c(Object,"keys"),i=h?function(a){var b=null==a?void 0:a.constructor;return"function"==typeof b&&b.prototype===a||("function"==typeof a?g.enumPrototypes:d(a))?f(a):e(a)?h(a):[]}:f;b.exports=i},{"../internal/getNative":20,"../internal/isArrayLike":21,"../internal/shimKeys":27,"../lang/isObject":33,"../support":41}],39:[function(a,b){function c(a){if(null==a)return[];j(a)||(a=Object(a));var b=a.length;b=b&&i(b)&&(f(a)||e(a)||k(a))&&b||0;for(var c=a.constructor,d=-1,m=g(c)&&c.prototype||x,n=m===a,o=Array(b),q=b>0,r=l.enumErrorProps&&(a===w||a instanceof Error),t=l.enumPrototypes&&g(a);++d<b;)o[d]=d+"";for(var C in a)t&&"prototype"==C||r&&("message"==C||"name"==C)||q&&h(C,b)||"constructor"==C&&(n||!z.call(a,C))||o.push(C);if(l.nonEnumShadows&&a!==x){var D=a===y?u:a===w?p:A.call(a),E=B[D]||B[s];for(D==s&&(m=x),b=v.length;b--;){C=v[b];var F=E[C];n&&F||(F?!z.call(a,C):a[C]===m[C])||o.push(C)}}return o}var d=a("../internal/arrayEach"),e=a("../lang/isArguments"),f=a("../lang/isArray"),g=a("../lang/isFunction"),h=a("../internal/isIndex"),i=a("../internal/isLength"),j=a("../lang/isObject"),k=a("../lang/isString"),l=a("../support"),m="[object Array]",n="[object Boolean]",o="[object Date]",p="[object Error]",q="[object Function]",r="[object Number]",s="[object Object]",t="[object RegExp]",u="[object String]",v=["constructor","hasOwnProperty","isPrototypeOf","propertyIsEnumerable","toLocaleString","toString","valueOf"],w=Error.prototype,x=Object.prototype,y=String.prototype,z=x.hasOwnProperty,A=x.toString,B={};B[m]=B[o]=B[r]={constructor:!0,toLocaleString:!0,toString:!0,valueOf:!0},B[n]=B[u]={constructor:!0,toString:!0,valueOf:!0},B[p]=B[q]=B[t]={constructor:!0,toString:!0},B[s]={constructor:!0},d(v,function(a){for(var b in B)if(z.call(B,b)){var c=B[b];c[a]=z.call(c,a)}}),b.exports=c},{"../internal/arrayEach":9,"../internal/isIndex":23,"../internal/isLength":25,"../lang/isArguments":29,"../lang/isArray":30,"../lang/isFunction":31,"../lang/isObject":33,"../lang/isString":35,"../support":41}],40:[function(a,b){var c=a("../internal/baseMerge"),d=a("../internal/createAssigner"),e=d(c);b.exports=e},{"../internal/baseMerge":13,"../internal/createAssigner":17}],41:[function(a,b){var c=Array.prototype,d=Error.prototype,e=Object.prototype,f=e.propertyIsEnumerable,g=c.splice,h={};!function(a){var b=function(){this.x=a},c={0:a,length:a},e=[];b.prototype={valueOf:a,y:a};for(var i in new b)e.push(i);h.enumErrorProps=f.call(d,"message")||f.call(d,"name"),h.enumPrototypes=f.call(b,"prototype"),h.nonEnumShadows=!/valueOf/.test(e),h.ownLast="x"!=e[0],h.spliceObjects=(g.call(c,0,1),!c[0]),h.unindexedChars="x"[0]+Object("x")[0]!="xx"}(1,0),b.exports=h},{}],42:[function(a,b){function c(a){return a}b.exports=c},{}],43:[function(a,b){"use strict";var c=a("object-keys");b.exports=function(){if("function"!=typeof Symbol||"function"!=typeof Object.getOwnPropertySymbols)return!1;if("symbol"==typeof Symbol.iterator)return!0;var a={},b=Symbol("test");if("string"==typeof b)return!1;var d=42;a[b]=d;for(b in a)return!1;if(0!==c(a).length)return!1;if("function"==typeof Object.keys&&0!==Object.keys(a).length)return!1;if("function"==typeof Object.getOwnPropertyNames&&0!==Object.getOwnPropertyNames(a).length)return!1;var e=Object.getOwnPropertySymbols(a);if(1!==e.length||e[0]!==b)return!1;if(!Object.prototype.propertyIsEnumerable.call(a,b))return!1;if("function"==typeof Object.getOwnPropertyDescriptor){var f=Object.getOwnPropertyDescriptor(a,b);if(f.value!==d||f.enumerable!==!0)return!1}return!0}},{"object-keys":50}],44:[function(a,b){"use strict";var c=a("object-keys"),d=a("function-bind"),e=function(a){return"undefined"!=typeof a&&null!==a},f=a("./hasSymbols")(),g=Object,h=d.call(Function.call,Array.prototype.push),i=d.call(Function.call,Object.prototype.propertyIsEnumerable);b.exports=function(a){if(!e(a))throw new TypeError("target must be an object");var b,d,j,k,l,m,n,o=g(a);for(b=1;b<arguments.length;++b){if(d=g(arguments[b]),k=c(d),f&&Object.getOwnPropertySymbols)for(l=Object.getOwnPropertySymbols(d),j=0;j<l.length;++j)n=l[j],i(d,n)&&h(k,n);for(j=0;j<k.length;++j)n=k[j],m=d[n],i(d,n)&&(o[n]=m)}return o}},{"./hasSymbols":43,"function-bind":49,"object-keys":50}],45:[function(a,b){"use strict";var c=a("define-properties"),d=a("./implementation"),e=a("./polyfill"),f=a("./shim");c(d,{implementation:d,getPolyfill:e,shim:f}),b.exports=d},{"./implementation":44,"./polyfill":52,"./shim":53,"define-properties":46}],46:[function(a,b){"use strict";var c=a("object-keys"),d=a("foreach"),e="function"==typeof Symbol&&"symbol"==typeof Symbol(),f=Object.prototype.toString,g=function(a){return"function"==typeof a&&"[object Function]"===f.call(a)},h=function(){var a={};try{Object.defineProperty(a,"x",{enumerable:!1,value:a});for(var b in a)return!1;return a.x===a}catch(c){return!1}},i=Object.defineProperty&&h(),j=function(a,b,c,d){(!(b in a)||g(d)&&d())&&(i?Object.defineProperty(a,b,{configurable:!0,enumerable:!1,value:c,writable:!0}):a[b]=c)},k=function(a,b){var f=arguments.length>2?arguments[2]:{},g=c(b);e&&(g=g.concat(Object.getOwnPropertySymbols(b))),d(g,function(c){j(a,c,b[c],f[c])})};k.supportsDescriptors=!!i,b.exports=k},{foreach:47,"object-keys":50}],47:[function(a,b){var c=Object.prototype.hasOwnProperty,d=Object.prototype.toString;b.exports=function(a,b,e){if("[object Function]"!==d.call(b))throw new TypeError("iterator must be a function");var f=a.length;if(f===+f)for(var g=0;f>g;g++)b.call(e,a[g],g,a);else for(var h in a)c.call(a,h)&&b.call(e,a[h],h,a)}},{}],48:[function(a,b){var c="Function.prototype.bind called on incompatible ",d=Array.prototype.slice,e=Object.prototype.toString,f="[object Function]";b.exports=function(a){var b=this;if("function"!=typeof b||e.call(b)!==f)throw new TypeError(c+b);for(var g,h=d.call(arguments,1),i=function(){if(this instanceof g){var c=b.apply(this,h.concat(d.call(arguments)));return Object(c)===c?c:this}return b.apply(a,h.concat(d.call(arguments)))},j=Math.max(0,b.length-h.length),k=[],l=0;j>l;l++)k.push("$"+l);if(g=Function("binder","return function ("+k.join(",")+"){ return binder.apply(this,arguments); }")(i),b.prototype){var m=function(){};m.prototype=b.prototype,g.prototype=new m,m.prototype=null}return g}},{}],49:[function(a,b){var c=a("./implementation");b.exports=Function.prototype.bind||c},{"./implementation":48}],50:[function(a,b){"use strict";var c=Object.prototype.hasOwnProperty,d=Object.prototype.toString,e=Array.prototype.slice,f=a("./isArguments"),g=!{toString:null}.propertyIsEnumerable("toString"),h=function(){}.propertyIsEnumerable("prototype"),i=["toString","toLocaleString","valueOf","hasOwnProperty","isPrototypeOf","propertyIsEnumerable","constructor"],j=function(a){var b=a.constructor;return b&&b.prototype===a},k={$console:!0,$frame:!0,$frameElement:!0,$frames:!0,$parent:!0,$self:!0,$webkitIndexedDB:!0,$webkitStorageInfo:!0,$window:!0},l=function(){if("undefined"==typeof window)return!1;for(var a in window)try{if(!k["$"+a]&&c.call(window,a)&&null!==window[a]&&"object"==typeof window[a])try{j(window[a])}catch(b){return!0}}catch(b){return!0}return!1}(),m=function(a){if("undefined"==typeof window||!l)return j(a);try{return j(a)}catch(b){return!1}},n=function(a){var b=null!==a&&"object"==typeof a,e="[object Function]"===d.call(a),j=f(a),k=b&&"[object String]"===d.call(a),l=[];if(!b&&!e&&!j)throw new TypeError("Object.keys called on a non-object");var n=h&&e;if(k&&a.length>0&&!c.call(a,0))for(var o=0;o<a.length;++o)l.push(String(o));if(j&&a.length>0)for(var p=0;p<a.length;++p)l.push(String(p));else for(var q in a)n&&"prototype"===q||!c.call(a,q)||l.push(String(q));if(g)for(var r=m(a),s=0;s<i.length;++s)r&&"constructor"===i[s]||!c.call(a,i[s])||l.push(i[s]);return l};n.shim=function(){if(Object.keys){var a=function(){return 2===(Object.keys(arguments)||"").length}(1,2);if(!a){var b=Object.keys;Object.keys=function(a){return b(f(a)?e.call(a):a)}}}else Object.keys=n;return Object.keys||n},b.exports=n},{"./isArguments":51}],51:[function(a,b){"use strict";var c=Object.prototype.toString;b.exports=function(a){var b=c.call(a),d="[object Arguments]"===b;return d||(d="[object Array]"!==b&&null!==a&&"object"==typeof a&&"number"==typeof a.length&&a.length>=0&&"[object Function]"===c.call(a.callee)),d}},{}],52:[function(a,b){"use strict";var c=a("./implementation"),d=function(){if(!Object.assign)return!1;for(var a="abcdefghijklmnopqrst",b=a.split(""),c={},d=0;d<b.length;++d)c[b[d]]=b[d];var e=Object.assign({},c),f="";for(var g in e)f+=g;return a!==f},e=function(){if(!Object.assign||!Object.preventExtensions)return!1;var a=Object.preventExtensions({1:2});try{Object.assign(a,"xy")}catch(b){return"y"===a[1]}};b.exports=function(){return Object.assign?d()?c:e()?c:Object.assign:c}},{"./implementation":44}],53:[function(a,b){"use strict";var c=a("define-properties"),d=a("./polyfill");b.exports=function(){var a=d();return c(Object,{assign:a},{assign:function(){return Object.assign!==a}}),a}},{"./polyfill":52,"define-properties":46}],54:[function(a,b){function c(a,b){var c,d=null;try{c=JSON.parse(a,b)}catch(e){d=e}return[d,c]}b.exports=c},{}],55:[function(a,b){function c(a){return a.replace(/\n\r?\s*/g,"")}b.exports=function(a){for(var b="",d=0;d<arguments.length;d++)b+=c(a[d])+(arguments[d+1]||"");return b}},{}],56:[function(a,b){"use strict";function c(a,b){for(var c=0;c<a.length;c++)b(a[c])}function d(a){for(var b in a)if(a.hasOwnProperty(b))return!1;return!0}function e(a,b,c){var d=a;return k(b)?(c=b,"string"==typeof a&&(d={uri:a})):d=m(b,{uri:a}),d.callback=c,d}function f(a,b,c){return b=e(a,b,c),g(b)}function g(a){function b(){4===k.readyState&&g()}function c(){var a=void 0;if(k.response?a=k.response:"text"!==k.responseType&&k.responseType||(a=k.responseText||k.responseXML),u)try{a=JSON.parse(a)}catch(b){}return a}function e(a){clearTimeout(o),a instanceof Error||(a=new Error(""+(a||"Unknown XMLHttpRequest Error"))),a.statusCode=0,h(a,i)}function g(){if(!n){var b;clearTimeout(o),b=a.useXDR&&void 0===k.status?200:1223===k.status?204:k.status;var d=i,e=null;0!==b?(d={body:c(),statusCode:b,method:q,headers:{},url:p,rawRequest:k},k.getAllResponseHeaders&&(d.headers=l(k.getAllResponseHeaders()))):e=new Error("Internal XMLHttpRequest Error"),h(e,d,d.body)}}var h=a.callback;if("undefined"==typeof h)throw new Error("callback argument missing");h=j(h);var i={body:void 0,headers:{},statusCode:0,method:q,url:p,rawRequest:k},k=a.xhr||null;k||(k=a.cors||a.useXDR?new f.XDomainRequest:new f.XMLHttpRequest);var m,n,o,p=k.url=a.uri||a.url,q=k.method=a.method||"GET",r=a.body||a.data||null,s=k.headers=a.headers||{},t=!!a.sync,u=!1;if("json"in a&&(u=!0,s.accept||s.Accept||(s.Accept="application/json"),"GET"!==q&&"HEAD"!==q&&(s["content-type"]||s["Content-Type"]||(s["Content-Type"]="application/json"),r=JSON.stringify(a.json))),k.onreadystatechange=b,k.onload=g,k.onerror=e,k.onprogress=function(){},k.ontimeout=e,k.open(q,p,!t,a.username,a.password),t||(k.withCredentials=!!a.withCredentials),!t&&a.timeout>0&&(o=setTimeout(function(){n=!0,k.abort("timeout");var a=new Error("XMLHttpRequest timeout");a.code="ETIMEDOUT",e(a)},a.timeout)),k.setRequestHeader)for(m in s)s.hasOwnProperty(m)&&k.setRequestHeader(m,s[m]);else if(a.headers&&!d(a.headers))throw new Error("Headers cannot be set on an XDomainRequest object");return"responseType"in a&&(k.responseType=a.responseType),"beforeSend"in a&&"function"==typeof a.beforeSend&&a.beforeSend(k),k.send(r),k}function h(){}var i=a("global/window"),j=a("once"),k=a("is-function"),l=a("parse-headers"),m=a("xtend");b.exports=f,f.XMLHttpRequest=i.XMLHttpRequest||h,f.XDomainRequest="withCredentials"in new f.XMLHttpRequest?f.XMLHttpRequest:i.XDomainRequest,c(["get","put","post","patch","head","delete"],function(a){f["delete"===a?"del":a]=function(b,c,d){return c=e(b,c,d),c.method=a.toUpperCase(),g(c)}})},{"global/window":2,"is-function":57,once:58,"parse-headers":61,xtend:62}],57:[function(a,b){function c(a){var b=d.call(a);return"[object Function]"===b||"function"==typeof a&&"[object RegExp]"!==b||"undefined"!=typeof window&&(a===window.setTimeout||a===window.alert||a===window.confirm||a===window.prompt)}b.exports=c;var d=Object.prototype.toString},{}],58:[function(a,b){function c(a){var b=!1;return function(){return b?void 0:(b=!0,a.apply(this,arguments))}}b.exports=c,c.proto=c(function(){Object.defineProperty(Function.prototype,"once",{value:function(){return c(this)},configurable:!0})})},{}],59:[function(a,b){function c(a,b,c){if(!g(b))throw new TypeError("iterator must be a function");arguments.length<3&&(c=this),"[object Array]"===h.call(a)?d(a,b,c):"string"==typeof a?e(a,b,c):f(a,b,c)}function d(a,b,c){for(var d=0,e=a.length;e>d;d++)i.call(a,d)&&b.call(c,a[d],d,a)}function e(a,b,c){for(var d=0,e=a.length;e>d;d++)b.call(c,a.charAt(d),d,a)}function f(a,b,c){for(var d in a)i.call(a,d)&&b.call(c,a[d],d,a)}var g=a("is-function");b.exports=c;var h=Object.prototype.toString,i=Object.prototype.hasOwnProperty},{"is-function":57}],60:[function(a,b,c){function d(a){return a.replace(/^\s*|\s*$/g,"")}c=b.exports=d,c.left=function(a){return a.replace(/^\s*/,"")},c.right=function(a){return a.replace(/\s*$/,"")}},{}],61:[function(a,b){var c=a("trim"),d=a("for-each"),e=function(a){return"[object Array]"===Object.prototype.toString.call(a)};b.exports=function(a){if(!a)return{};var b={};return d(c(a).split("\n"),function(a){var d=a.indexOf(":"),f=c(a.slice(0,d)).toLowerCase(),g=c(a.slice(d+1));"undefined"==typeof b[f]?b[f]=g:e(b[f])?b[f].push(g):b[f]=[b[f],g]}),b}},{"for-each":59,trim:60}],62:[function(a,b){function c(){for(var a={},b=0;b<arguments.length;b++){var c=arguments[b];for(var e in c)d.call(c,e)&&(a[e]=c[e])}return a}b.exports=c;var d=Object.prototype.hasOwnProperty},{}],63:[function(a,b,c){"use strict";function d(a){return a&&a.__esModule?a:{"default":a}}function e(a,b){if(!(a instanceof b))throw new TypeError("Cannot call a class as a function")}function f(a,b){if("function"!=typeof b&&null!==b)throw new TypeError("Super expression must either be null or a function, not "+typeof b);a.prototype=Object.create(b&&b.prototype,{constructor:{value:a,enumerable:!1,writable:!0,configurable:!0}}),b&&(Object.setPrototypeOf?Object.setPrototypeOf(a,b):a.__proto__=b)}c.__esModule=!0;var g=a("./button.js"),h=d(g),i=a("./component.js"),j=d(i),k=function(a){function b(c,d){e(this,b),a.call(this,c,d)}return f(b,a),b.prototype.buildCSSClass=function(){return"vjs-big-play-button"},b.prototype.handleClick=function(){this.player_.play()},b}(h["default"]);k.prototype.controlText_="Play Video",j["default"].registerComponent("BigPlayButton",k),c["default"]=k,b.exports=c["default"]},{"./button.js":64,"./component.js":67}],64:[function(a,b,c){"use strict";function d(a){if(a&&a.__esModule)return a;var b={};if(null!=a)for(var c in a)Object.prototype.hasOwnProperty.call(a,c)&&(b[c]=a[c]);return b["default"]=a,b}function e(a){return a&&a.__esModule?a:{"default":a}}function f(a,b){if(!(a instanceof b))throw new TypeError("Cannot call a class as a function")}function g(a,b){if("function"!=typeof b&&null!==b)throw new TypeError("Super expression must either be null or a function, not "+typeof b);a.prototype=Object.create(b&&b.prototype,{constructor:{value:a,enumerable:!1,writable:!0,configurable:!0}}),b&&(Object.setPrototypeOf?Object.setPrototypeOf(a,b):a.__proto__=b)}c.__esModule=!0;var h=a("./clickable-component.js"),i=e(h),j=a("./component"),k=e(j),l=a("./utils/events.js"),m=(d(l),a("./utils/fn.js")),n=(d(m),a("./utils/log.js")),o=e(n),p=a("global/document"),q=(e(p),a("object.assign")),r=e(q),s=function(a){function b(c,d){f(this,b),a.call(this,c,d)}return g(b,a),b.prototype.createEl=function(){var a=arguments.length<=0||void 0===arguments[0]?"button":arguments[0],b=arguments.length<=1||void 0===arguments[1]?{}:arguments[1],c=arguments.length<=2||void 0===arguments[2]?{}:arguments[2];b=r["default"]({className:this.buildCSSClass()},b),"button"!==a&&(o["default"].warn("Creating a Button with an HTML element of "+a+" is deprecated; use ClickableComponent instead."),b=r["default"]({tabIndex:0},b),c=r["default"]({role:"button"},c)),c=r["default"]({type:"button","aria-live":"polite"},c);var d=k["default"].prototype.createEl.call(this,a,b,c);return this.createControlTextEl(d),d},b.prototype.addChild=function(a){var b=arguments.length<=1||void 0===arguments[1]?{}:arguments[1],c=this.constructor.name;return o["default"].warn("Adding an actionable (user controllable) child to a Button ("+c+") is not supported; use a ClickableComponent instead."),k["default"].prototype.addChild.call(this,a,b)},b.prototype.handleKeyPress=function(b){32===b.which||13===b.which||a.prototype.handleKeyPress.call(this,b)},b}(i["default"]);k["default"].registerComponent("Button",s),c["default"]=s,b.exports=c["default"]},{"./clickable-component.js":65,"./component":67,"./utils/events.js":144,"./utils/fn.js":145,"./utils/log.js":148,"global/document":1,"object.assign":45}],65:[function(a,b,c){"use strict";function d(a){if(a&&a.__esModule)return a;var b={};if(null!=a)for(var c in a)Object.prototype.hasOwnProperty.call(a,c)&&(b[c]=a[c]);return b["default"]=a,b}function e(a){return a&&a.__esModule?a:{"default":a}}function f(a,b){if(!(a instanceof b))throw new TypeError("Cannot call a class as a function")}function g(a,b){if("function"!=typeof b&&null!==b)throw new TypeError("Super expression must either be null or a function, not "+typeof b);a.prototype=Object.create(b&&b.prototype,{constructor:{value:a,enumerable:!1,writable:!0,configurable:!0}}),b&&(Object.setPrototypeOf?Object.setPrototypeOf(a,b):a.__proto__=b)}c.__esModule=!0;var h=a("./component"),i=e(h),j=a("./utils/dom.js"),k=d(j),l=a("./utils/events.js"),m=d(l),n=a("./utils/fn.js"),o=d(n),p=a("./utils/log.js"),q=e(p),r=a("global/document"),s=e(r),t=a("object.assign"),u=e(t),v=function(a){function b(c,d){f(this,b),a.call(this,c,d),this.emitTapEvents(),this.on("tap",this.handleClick),this.on("click",this.handleClick),this.on("focus",this.handleFocus),this.on("blur",this.handleBlur)}return g(b,a),b.prototype.createEl=function(){var b=arguments.length<=0||void 0===arguments[0]?"div":arguments[0],c=arguments.length<=1||void 0===arguments[1]?{}:arguments[1],d=arguments.length<=2||void 0===arguments[2]?{}:arguments[2];c=u["default"]({className:this.buildCSSClass(),tabIndex:0},c),"button"===b&&q["default"].error("Creating a ClickableComponent with an HTML element of "+b+" is not supported; use a Button instead."),d=u["default"]({role:"button","aria-live":"polite"},d);var e=a.prototype.createEl.call(this,b,c,d);return this.createControlTextEl(e),e},b.prototype.createControlTextEl=function(a){return this.controlTextEl_=k.createEl("span",{className:"vjs-control-text"}),a&&a.appendChild(this.controlTextEl_),this.controlText(this.controlText_),this.controlTextEl_},b.prototype.controlText=function(a){return a?(this.controlText_=a,this.controlTextEl_.innerHTML=this.localize(this.controlText_),this):this.controlText_||"Need Text"},b.prototype.buildCSSClass=function(){return"vjs-control vjs-button "+a.prototype.buildCSSClass.call(this)},b.prototype.addChild=function(b){var c=arguments.length<=1||void 0===arguments[1]?{}:arguments[1];return a.prototype.addChild.call(this,b,c)},b.prototype.enable=function(){return this.removeClass("vjs-disabled"),this.el_.setAttribute("aria-disabled","false"),this},b.prototype.disable=function(){return this.addClass("vjs-disabled"),this.el_.setAttribute("aria-disabled","true"),this},b.prototype.handleClick=function(){},b.prototype.handleFocus=function(){m.on(s["default"],"keydown",o.bind(this,this.handleKeyPress))},b.prototype.handleKeyPress=function(b){32===b.which||13===b.which?(b.preventDefault(),this.handleClick(b)):a.prototype.handleKeyPress&&a.prototype.handleKeyPress.call(this,b)},b.prototype.handleBlur=function(){m.off(s["default"],"keydown",o.bind(this,this.handleKeyPress))},b}(i["default"]);i["default"].registerComponent("ClickableComponent",v),c["default"]=v,b.exports=c["default"]},{
"./component":67,"./utils/dom.js":143,"./utils/events.js":144,"./utils/fn.js":145,"./utils/log.js":148,"global/document":1,"object.assign":45}],66:[function(a,b,c){"use strict";function d(a){return a&&a.__esModule?a:{"default":a}}function e(a,b){if(!(a instanceof b))throw new TypeError("Cannot call a class as a function")}function f(a,b){if("function"!=typeof b&&null!==b)throw new TypeError("Super expression must either be null or a function, not "+typeof b);a.prototype=Object.create(b&&b.prototype,{constructor:{value:a,enumerable:!1,writable:!0,configurable:!0}}),b&&(Object.setPrototypeOf?Object.setPrototypeOf(a,b):a.__proto__=b)}c.__esModule=!0;var g=a("./button"),h=d(g),i=a("./component"),j=d(i),k=function(a){function b(c,d){e(this,b),a.call(this,c,d),this.controlText(d&&d.controlText||this.localize("Close"))}return f(b,a),b.prototype.buildCSSClass=function(){return"vjs-close-button "+a.prototype.buildCSSClass.call(this)},b.prototype.handleClick=function(){this.trigger({type:"close",bubbles:!1})},b}(h["default"]);j["default"].registerComponent("CloseButton",k),c["default"]=k,b.exports=c["default"]},{"./button":64,"./component":67}],67:[function(a,b,c){"use strict";function d(a){if(a&&a.__esModule)return a;var b={};if(null!=a)for(var c in a)Object.prototype.hasOwnProperty.call(a,c)&&(b[c]=a[c]);return b["default"]=a,b}function e(a){return a&&a.__esModule?a:{"default":a}}function f(a,b){if(!(a instanceof b))throw new TypeError("Cannot call a class as a function")}c.__esModule=!0;var g=a("global/window"),h=e(g),i=a("./utils/dom.js"),j=d(i),k=a("./utils/fn.js"),l=d(k),m=a("./utils/guid.js"),n=d(m),o=a("./utils/events.js"),p=d(o),q=a("./utils/log.js"),r=e(q),s=a("./utils/to-title-case.js"),t=e(s),u=a("object.assign"),v=e(u),w=a("./utils/merge-options.js"),x=e(w),y=function(){function a(b,c,d){if(f(this,a),this.player_=!b&&this.play?b=this:b,this.options_=x["default"]({},this.options_),c=this.options_=x["default"](this.options_,c),this.id_=c.id||c.el&&c.el.id,!this.id_){var e=b&&b.id&&b.id()||"no_player";this.id_=e+"_component_"+n.newGUID()}this.name_=c.name||null,c.el?this.el_=c.el:c.createEl!==!1&&(this.el_=this.createEl()),this.children_=[],this.childIndex_={},this.childNameIndex_={},c.initChildren!==!1&&this.initChildren(),this.ready(d),c.reportTouchActivity!==!1&&this.enableTouchActivity()}return a.prototype.dispose=function(){if(this.trigger({type:"dispose",bubbles:!1}),this.children_)for(var a=this.children_.length-1;a>=0;a--)this.children_[a].dispose&&this.children_[a].dispose();this.children_=null,this.childIndex_=null,this.childNameIndex_=null,this.off(),this.el_.parentNode&&this.el_.parentNode.removeChild(this.el_),j.removeElData(this.el_),this.el_=null},a.prototype.player=function(){return this.player_},a.prototype.options=function(a){return r["default"].warn("this.options() has been deprecated and will be moved to the constructor in 6.0"),a?(this.options_=x["default"](this.options_,a),this.options_):this.options_},a.prototype.el=function(){return this.el_},a.prototype.createEl=function(a,b,c){return j.createEl(a,b,c)},a.prototype.localize=function(a){var b=this.player_.language&&this.player_.language(),c=this.player_.languages&&this.player_.languages();if(!b||!c)return a;var d=c[b];if(d&&d[a])return d[a];var e=b.split("-")[0],f=c[e];return f&&f[a]?f[a]:a},a.prototype.contentEl=function(){return this.contentEl_||this.el_},a.prototype.id=function(){return this.id_},a.prototype.name=function(){return this.name_},a.prototype.children=function(){return this.children_},a.prototype.getChildById=function(a){return this.childIndex_[a]},a.prototype.getChild=function(a){return this.childNameIndex_[a]},a.prototype.addChild=function(b){var c=arguments.length<=1||void 0===arguments[1]?{}:arguments[1],d=arguments.length<=2||void 0===arguments[2]?this.children_.length:arguments[2],e=void 0,f=void 0;if("string"==typeof b){f=b,c||(c={}),c===!0&&(r["default"].warn("Initializing a child component with `true` is deprecated. Children should be defined in an array when possible, but if necessary use an object instead of `true`."),c={});var g=c.componentClass||t["default"](f);c.name=f;var h=a.getComponent(g);if(!h)throw new Error("Component "+g+" does not exist");if("function"!=typeof h)return null;e=new h(this.player_||this,c)}else e=b;if(this.children_.splice(d,0,e),"function"==typeof e.id&&(this.childIndex_[e.id()]=e),f=f||e.name&&e.name(),f&&(this.childNameIndex_[f]=e),"function"==typeof e.el&&e.el()){var i=this.contentEl().children,j=i[d]||null;this.contentEl().insertBefore(e.el(),j)}return e},a.prototype.removeChild=function(a){if("string"==typeof a&&(a=this.getChild(a)),a&&this.children_){for(var b=!1,c=this.children_.length-1;c>=0;c--)if(this.children_[c]===a){b=!0,this.children_.splice(c,1);break}if(b){this.childIndex_[a.id()]=null,this.childNameIndex_[a.name()]=null;var d=a.el();d&&d.parentNode===this.contentEl()&&this.contentEl().removeChild(a.el())}}},a.prototype.initChildren=function(){var b=this,c=this.options_.children;c&&!function(){var d=b.options_,e=function(a){var c=a.name,e=a.opts;if(void 0!==d[c]&&(e=d[c]),e!==!1){e===!0&&(e={}),e.playerOptions=b.options_.playerOptions;var f=b.addChild(c,e);f&&(b[c]=f)}},f=void 0,g=a.getComponent("Tech");f=Array.isArray(c)?c:Object.keys(c),f.concat(Object.keys(b.options_).filter(function(a){return!f.some(function(b){return"string"==typeof b?a===b:a===b.name})})).map(function(a){var d=void 0,e=void 0;return"string"==typeof a?(d=a,e=c[d]||b.options_[d]||{}):(d=a.name,e=a),{name:d,opts:e}}).filter(function(b){var c=a.getComponent(b.opts.componentClass||t["default"](b.name));return c&&!g.isTech(c)}).forEach(e)}()},a.prototype.buildCSSClass=function(){return""},a.prototype.on=function(a,b,c){var d=this;return"string"==typeof a||Array.isArray(a)?p.on(this.el_,a,l.bind(this,b)):!function(){var e=a,f=b,g=l.bind(d,c),h=function(){return d.off(e,f,g)};h.guid=g.guid,d.on("dispose",h);var i=function(){return d.off("dispose",h)};i.guid=g.guid,a.nodeName?(p.on(e,f,g),p.on(e,"dispose",i)):"function"==typeof a.on&&(e.on(f,g),e.on("dispose",i))}(),this},a.prototype.off=function(a,b,c){if(!a||"string"==typeof a||Array.isArray(a))p.off(this.el_,a,b);else{var d=a,e=b,f=l.bind(this,c);this.off("dispose",f),a.nodeName?(p.off(d,e,f),p.off(d,"dispose",f)):(d.off(e,f),d.off("dispose",f))}return this},a.prototype.one=function(a,b,c){var d=this,e=arguments;return"string"==typeof a||Array.isArray(a)?p.one(this.el_,a,l.bind(this,b)):!function(){var f=a,g=b,h=l.bind(d,c),i=function j(){d.off(f,g,j),h.apply(null,e)};i.guid=h.guid,d.on(f,g,i)}(),this},a.prototype.trigger=function(a,b){return p.trigger(this.el_,a,b),this},a.prototype.ready=function(a){var b=arguments.length<=1||void 0===arguments[1]?!1:arguments[1];return a&&(this.isReady_?b?a.call(this):this.setTimeout(a,1):(this.readyQueue_=this.readyQueue_||[],this.readyQueue_.push(a))),this},a.prototype.triggerReady=function(){this.isReady_=!0,this.setTimeout(function(){var a=this.readyQueue_;this.readyQueue_=[],a&&a.length>0&&a.forEach(function(a){a.call(this)},this),this.trigger("ready")},1)},a.prototype.$=function(a,b){return j.$(a,b||this.contentEl())},a.prototype.$$=function(a,b){return j.$$(a,b||this.contentEl())},a.prototype.hasClass=function(a){return j.hasElClass(this.el_,a)},a.prototype.addClass=function(a){return j.addElClass(this.el_,a),this},a.prototype.removeClass=function(a){return j.removeElClass(this.el_,a),this},a.prototype.toggleClass=function(a,b){return j.toggleElClass(this.el_,a,b),this},a.prototype.show=function(){return this.removeClass("vjs-hidden"),this},a.prototype.hide=function(){return this.addClass("vjs-hidden"),this},a.prototype.lockShowing=function(){return this.addClass("vjs-lock-showing"),this},a.prototype.unlockShowing=function(){return this.removeClass("vjs-lock-showing"),this},a.prototype.width=function(a,b){return this.dimension("width",a,b)},a.prototype.height=function(a,b){return this.dimension("height",a,b)},a.prototype.dimensions=function(a,b){return this.width(a,!0).height(b)},a.prototype.dimension=function(a,b,c){if(void 0!==b)return(null===b||b!==b)&&(b=0),this.el_.style[a]=-1!==(""+b).indexOf("%")||-1!==(""+b).indexOf("px")?b:"auto"===b?"":b+"px",c||this.trigger("resize"),this;if(!this.el_)return 0;var d=this.el_.style[a],e=d.indexOf("px");return-1!==e?parseInt(d.slice(0,e),10):parseInt(this.el_["offset"+t["default"](a)],10)},a.prototype.currentDimension=function(a){var b=0;if("width"!==a&&"height"!==a)throw new Error("currentDimension only accepts width or height value");if("function"==typeof h["default"].getComputedStyle){var c=h["default"].getComputedStyle(this.el_);b=c.getPropertyValue(a)||c[a]}else if(this.el_.currentStyle){var d="offset"+t["default"](a);b=this.el_[d]}return b=parseFloat(b)},a.prototype.currentDimensions=function(){return{width:this.currentDimension("width"),height:this.currentDimension("height")}},a.prototype.currentWidth=function(){return this.currentDimension("width")},a.prototype.currentHeight=function(){return this.currentDimension("height")},a.prototype.emitTapEvents=function(){var a=0,b=null,c=10,d=200,e=void 0;this.on("touchstart",function(c){1===c.touches.length&&(b=v["default"]({},c.touches[0]),a=(new Date).getTime(),e=!0)}),this.on("touchmove",function(a){if(a.touches.length>1)e=!1;else if(b){var d=a.touches[0].pageX-b.pageX,f=a.touches[0].pageY-b.pageY,g=Math.sqrt(d*d+f*f);g>c&&(e=!1)}});var f=function(){e=!1};this.on("touchleave",f),this.on("touchcancel",f),this.on("touchend",function(c){if(b=null,e===!0){var f=(new Date).getTime()-a;d>f&&(c.preventDefault(),this.trigger("tap"))}})},a.prototype.enableTouchActivity=function(){if(this.player()&&this.player().reportUserActivity){var a=l.bind(this.player(),this.player().reportUserActivity),b=void 0;this.on("touchstart",function(){a(),this.clearInterval(b),b=this.setInterval(a,250)});var c=function(){a(),this.clearInterval(b)};this.on("touchmove",a),this.on("touchend",c),this.on("touchcancel",c)}},a.prototype.setTimeout=function(a,b){a=l.bind(this,a);var c=h["default"].setTimeout(a,b),d=function(){this.clearTimeout(c)};return d.guid="vjs-timeout-"+c,this.on("dispose",d),c},a.prototype.clearTimeout=function(a){h["default"].clearTimeout(a);var b=function(){};return b.guid="vjs-timeout-"+a,this.off("dispose",b),a},a.prototype.setInterval=function(a,b){a=l.bind(this,a);var c=h["default"].setInterval(a,b),d=function(){this.clearInterval(c)};return d.guid="vjs-interval-"+c,this.on("dispose",d),c},a.prototype.clearInterval=function(a){h["default"].clearInterval(a);var b=function(){};return b.guid="vjs-interval-"+a,this.off("dispose",b),a},a.registerComponent=function(b,c){return a.components_||(a.components_={}),a.components_[b]=c,c},a.getComponent=function(b){return a.components_&&a.components_[b]?a.components_[b]:h["default"]&&h["default"].videojs&&h["default"].videojs[b]?(r["default"].warn("The "+b+" component was added to the videojs object when it should be registered using videojs.registerComponent(name, component)"),h["default"].videojs[b]):void 0},a.extend=function(b){b=b||{},r["default"].warn("Component.extend({}) has been deprecated, use videojs.extend(Component, {}) instead");var c=b.init||b.init||this.prototype.init||this.prototype.init||function(){},d=function(){c.apply(this,arguments)};d.prototype=Object.create(this.prototype),d.prototype.constructor=d,d.extend=a.extend;for(var e in b)b.hasOwnProperty(e)&&(d.prototype[e]=b[e]);return d},a}();y.registerComponent("Component",y),c["default"]=y,b.exports=c["default"]},{"./utils/dom.js":143,"./utils/events.js":144,"./utils/fn.js":145,"./utils/guid.js":147,"./utils/log.js":148,"./utils/merge-options.js":149,"./utils/to-title-case.js":152,"global/window":2,"object.assign":45}],68:[function(a,b,c){"use strict";function d(a){if(a&&a.__esModule)return a;var b={};if(null!=a)for(var c in a)Object.prototype.hasOwnProperty.call(a,c)&&(b[c]=a[c]);return b["default"]=a,b}function e(a){return a&&a.__esModule?a:{"default":a}}function f(a,b){if(!(a instanceof b))throw new TypeError("Cannot call a class as a function")}function g(a,b){if("function"!=typeof b&&null!==b)throw new TypeError("Super expression must either be null or a function, not "+typeof b);a.prototype=Object.create(b&&b.prototype,{constructor:{value:a,enumerable:!1,writable:!0,configurable:!0}}),b&&(Object.setPrototypeOf?Object.setPrototypeOf(a,b):a.__proto__=b)}c.__esModule=!0;var h=a("../track-button.js"),i=e(h),j=a("../../component.js"),k=e(j),l=a("../../utils/fn.js"),m=(d(l),a("./audio-track-menu-item.js")),n=e(m),o=function(a){function b(c){var d=arguments.length<=1||void 0===arguments[1]?{}:arguments[1];f(this,b),d.tracks=c.audioTracks&&c.audioTracks(),a.call(this,c,d),this.el_.setAttribute("aria-label","Audio Menu")}return g(b,a),b.prototype.buildCSSClass=function(){return"vjs-audio-button "+a.prototype.buildCSSClass.call(this)},b.prototype.createItems=function(){var a=arguments.length<=0||void 0===arguments[0]?[]:arguments[0],b=this.player_.audioTracks&&this.player_.audioTracks();if(!b)return a;for(var c=0;c<b.length;c++){var d=b[c];a.push(new n["default"](this.player_,{selectable:!0,track:d}))}return a},b}(i["default"]);k["default"].registerComponent("AudioTrackButton",o),c["default"]=o,b.exports=c["default"]},{"../../component.js":67,"../../utils/fn.js":145,"../track-button.js":98,"./audio-track-menu-item.js":69}],69:[function(a,b,c){"use strict";function d(a){if(a&&a.__esModule)return a;var b={};if(null!=a)for(var c in a)Object.prototype.hasOwnProperty.call(a,c)&&(b[c]=a[c]);return b["default"]=a,b}function e(a){return a&&a.__esModule?a:{"default":a}}function f(a,b){if(!(a instanceof b))throw new TypeError("Cannot call a class as a function")}function g(a,b){if("function"!=typeof b&&null!==b)throw new TypeError("Super expression must either be null or a function, not "+typeof b);a.prototype=Object.create(b&&b.prototype,{constructor:{value:a,enumerable:!1,writable:!0,configurable:!0}}),b&&(Object.setPrototypeOf?Object.setPrototypeOf(a,b):a.__proto__=b)}c.__esModule=!0;var h=a("../../menu/menu-item.js"),i=e(h),j=a("../../component.js"),k=e(j),l=a("../../utils/fn.js"),m=d(l),n=function(a){function b(c,d){var e=this;f(this,b);var g=d.track,h=c.audioTracks();d.label=g.label||g.language||"Unknown",d.selected=g.enabled,a.call(this,c,d),this.track=g,h&&!function(){var a=m.bind(e,e.handleTracksChange);h.addEventListener("change",a),e.on("dispose",function(){h.removeEventListener("change",a)})}()}return g(b,a),b.prototype.handleClick=function(b){var c=this.player_.audioTracks();if(a.prototype.handleClick.call(this,b),c)for(var d=0;d<c.length;d++){var e=c[d];e===this.track&&(e.enabled=!0)}},b.prototype.handleTracksChange=function(){this.selected(this.track.enabled)},b}(i["default"]);k["default"].registerComponent("AudioTrackMenuItem",n),c["default"]=n,b.exports=c["default"]},{"../../component.js":67,"../../menu/menu-item.js":110,"../../utils/fn.js":145}],70:[function(a,b,c){"use strict";function d(a){return a&&a.__esModule?a:{"default":a}}function e(a,b){if(!(a instanceof b))throw new TypeError("Cannot call a class as a function")}function f(a,b){if("function"!=typeof b&&null!==b)throw new TypeError("Super expression must either be null or a function, not "+typeof b);a.prototype=Object.create(b&&b.prototype,{constructor:{value:a,enumerable:!1,writable:!0,configurable:!0}}),b&&(Object.setPrototypeOf?Object.setPrototypeOf(a,b):a.__proto__=b)}c.__esModule=!0;var g=a("../component.js"),h=d(g),i=a("./play-toggle.js"),j=(d(i),a("./time-controls/current-time-display.js")),k=(d(j),a("./time-controls/duration-display.js")),l=(d(k),a("./time-controls/time-divider.js")),m=(d(l),a("./time-controls/remaining-time-display.js")),n=(d(m),a("./live-display.js")),o=(d(n),a("./progress-control/progress-control.js")),p=(d(o),a("./fullscreen-toggle.js")),q=(d(p),a("./volume-control/volume-control.js")),r=(d(q),a("./volume-menu-button.js")),s=(d(r),a("./mute-toggle.js")),t=(d(s),a("./text-track-controls/chapters-button.js")),u=(d(t),a("./text-track-controls/descriptions-button.js")),v=(d(u),a("./text-track-controls/subtitles-button.js")),w=(d(v),a("./text-track-controls/captions-button.js")),x=(d(w),a("./audio-track-controls/audio-track-button.js")),y=(d(x),a("./playback-rate-menu/playback-rate-menu-button.js")),z=(d(y),a("./spacer-controls/custom-control-spacer.js")),A=(d(z),function(a){function b(){e(this,b),a.apply(this,arguments)}return f(b,a),b.prototype.createEl=function(){return a.prototype.createEl.call(this,"div",{className:"vjs-control-bar",dir:"ltr"},{role:"group"})},b}(h["default"]));A.prototype.options_={loadEvent:"play",children:["playToggle","volumeMenuButton","currentTimeDisplay","timeDivider","durationDisplay","progressControl","liveDisplay","remainingTimeDisplay","customControlSpacer","playbackRateMenuButton","chaptersButton","descriptionsButton","subtitlesButton","captionsButton","audioTrackButton","fullscreenToggle"]},h["default"].registerComponent("ControlBar",A),c["default"]=A,b.exports=c["default"]},{"../component.js":67,"./audio-track-controls/audio-track-button.js":68,"./fullscreen-toggle.js":71,"./live-display.js":72,"./mute-toggle.js":73,"./play-toggle.js":74,"./playback-rate-menu/playback-rate-menu-button.js":75,"./progress-control/progress-control.js":80,"./spacer-controls/custom-control-spacer.js":83,"./text-track-controls/captions-button.js":86,"./text-track-controls/chapters-button.js":87,"./text-track-controls/descriptions-button.js":89,"./text-track-controls/subtitles-button.js":91,"./time-controls/current-time-display.js":94,"./time-controls/duration-display.js":95,"./time-controls/remaining-time-display.js":96,"./time-controls/time-divider.js":97,"./volume-control/volume-control.js":100,"./volume-menu-button.js":102}],71:[function(a,b,c){"use strict";function d(a){return a&&a.__esModule?a:{"default":a}}function e(a,b){if(!(a instanceof b))throw new TypeError("Cannot call a class as a function")}function f(a,b){if("function"!=typeof b&&null!==b)throw new TypeError("Super expression must either be null or a function, not "+typeof b);a.prototype=Object.create(b&&b.prototype,{constructor:{value:a,enumerable:!1,writable:!0,configurable:!0}}),b&&(Object.setPrototypeOf?Object.setPrototypeOf(a,b):a.__proto__=b)}c.__esModule=!0;var g=a("../button.js"),h=d(g),i=a("../component.js"),j=d(i),k=function(a){function b(){e(this,b),a.apply(this,arguments)}return f(b,a),b.prototype.buildCSSClass=function(){return"vjs-fullscreen-control "+a.prototype.buildCSSClass.call(this)},b.prototype.handleClick=function(){this.player_.isFullscreen()?(this.player_.exitFullscreen(),this.controlText("Fullscreen")):(this.player_.requestFullscreen(),this.controlText("Non-Fullscreen"))},b}(h["default"]);k.prototype.controlText_="Fullscreen",j["default"].registerComponent("FullscreenToggle",k),c["default"]=k,b.exports=c["default"]},{"../button.js":64,"../component.js":67}],72:[function(a,b,c){"use strict";function d(a){if(a&&a.__esModule)return a;var b={};if(null!=a)for(var c in a)Object.prototype.hasOwnProperty.call(a,c)&&(b[c]=a[c]);return b["default"]=a,b}function e(a){return a&&a.__esModule?a:{"default":a}}function f(a,b){if(!(a instanceof b))throw new TypeError("Cannot call a class as a function")}function g(a,b){if("function"!=typeof b&&null!==b)throw new TypeError("Super expression must either be null or a function, not "+typeof b);a.prototype=Object.create(b&&b.prototype,{constructor:{value:a,enumerable:!1,writable:!0,configurable:!0}}),b&&(Object.setPrototypeOf?Object.setPrototypeOf(a,b):a.__proto__=b)}c.__esModule=!0;var h=a("../component"),i=e(h),j=a("../utils/dom.js"),k=d(j),l=function(a){function b(c,d){f(this,b),a.call(this,c,d),this.updateShowing(),this.on(this.player(),"durationchange",this.updateShowing)}return g(b,a),b.prototype.createEl=function(){var b=a.prototype.createEl.call(this,"div",{className:"vjs-live-control vjs-control"});return this.contentEl_=k.createEl("div",{className:"vjs-live-display",innerHTML:'<span class="vjs-control-text">'+this.localize("Stream Type")+"</span>"+this.localize("LIVE")},{"aria-live":"off"}),b.appendChild(this.contentEl_),b},b.prototype.updateShowing=function(){this.player().duration()===1/0?this.show():this.hide()},b}(i["default"]);i["default"].registerComponent("LiveDisplay",l),c["default"]=l,b.exports=c["default"]},{"../component":67,"../utils/dom.js":143}],73:[function(a,b,c){"use strict";function d(a){if(a&&a.__esModule)return a;var b={};if(null!=a)for(var c in a)Object.prototype.hasOwnProperty.call(a,c)&&(b[c]=a[c]);return b["default"]=a,b}function e(a){return a&&a.__esModule?a:{"default":a}}function f(a,b){if(!(a instanceof b))throw new TypeError("Cannot call a class as a function")}function g(a,b){if("function"!=typeof b&&null!==b)throw new TypeError("Super expression must either be null or a function, not "+typeof b);a.prototype=Object.create(b&&b.prototype,{constructor:{value:a,enumerable:!1,writable:!0,configurable:!0}}),b&&(Object.setPrototypeOf?Object.setPrototypeOf(a,b):a.__proto__=b)}c.__esModule=!0;var h=a("../button"),i=e(h),j=a("../component"),k=e(j),l=a("../utils/dom.js"),m=d(l),n=function(a){function b(c,d){f(this,b),a.call(this,c,d),this.on(c,"volumechange",this.update),c.tech_&&c.tech_.featuresVolumeControl===!1&&this.addClass("vjs-hidden"),this.on(c,"loadstart",function(){this.update(),c.tech_.featuresVolumeControl===!1?this.addClass("vjs-hidden"):this.removeClass("vjs-hidden")})}return g(b,a),b.prototype.buildCSSClass=function(){return"vjs-mute-control "+a.prototype.buildCSSClass.call(this)},b.prototype.handleClick=function(){this.player_.muted(this.player_.muted()?!1:!0)},b.prototype.update=function(){var a=this.player_.volume(),b=3;0===a||this.player_.muted()?b=0:.33>a?b=1:.67>a&&(b=2);var c=this.player_.muted()?"Unmute":"Mute";this.controlText()!==c&&this.controlText(c);for(var d=0;4>d;d++)m.removeElClass(this.el_,"vjs-vol-"+d);m.addElClass(this.el_,"vjs-vol-"+b)},b}(i["default"]);n.prototype.controlText_="Mute",k["default"].registerComponent("MuteToggle",n),c["default"]=n,b.exports=c["default"]},{"../button":64,"../component":67,"../utils/dom.js":143}],74:[function(a,b,c){"use strict";function d(a){return a&&a.__esModule?a:{"default":a}}function e(a,b){if(!(a instanceof b))throw new TypeError("Cannot call a class as a function")}function f(a,b){if("function"!=typeof b&&null!==b)throw new TypeError("Super expression must either be null or a function, not "+typeof b);a.prototype=Object.create(b&&b.prototype,{constructor:{value:a,enumerable:!1,writable:!0,configurable:!0}}),b&&(Object.setPrototypeOf?Object.setPrototypeOf(a,b):a.__proto__=b)}c.__esModule=!0;var g=a("../button.js"),h=d(g),i=a("../component.js"),j=d(i),k=function(a){function b(c,d){e(this,b),a.call(this,c,d),this.on(c,"play",this.handlePlay),this.on(c,"pause",this.handlePause)}return f(b,a),b.prototype.buildCSSClass=function(){return"vjs-play-control "+a.prototype.buildCSSClass.call(this)},b.prototype.handleClick=function(){this.player_.paused()?this.player_.play():this.player_.pause()},b.prototype.handlePlay=function(){this.removeClass("vjs-paused"),this.addClass("vjs-playing"),this.controlText("Pause")},b.prototype.handlePause=function(){this.removeClass("vjs-playing"),this.addClass("vjs-paused"),this.controlText("Play")},b}(h["default"]);k.prototype.controlText_="Play",j["default"].registerComponent("PlayToggle",k),c["default"]=k,b.exports=c["default"]},{"../button.js":64,"../component.js":67}],75:[function(a,b,c){"use strict";function d(a){if(a&&a.__esModule)return a;var b={};if(null!=a)for(var c in a)Object.prototype.hasOwnProperty.call(a,c)&&(b[c]=a[c]);return b["default"]=a,b}function e(a){return a&&a.__esModule?a:{"default":a}}function f(a,b){if(!(a instanceof b))throw new TypeError("Cannot call a class as a function")}function g(a,b){if("function"!=typeof b&&null!==b)throw new TypeError("Super expression must either be null or a function, not "+typeof b);a.prototype=Object.create(b&&b.prototype,{constructor:{value:a,enumerable:!1,writable:!0,configurable:!0}}),b&&(Object.setPrototypeOf?Object.setPrototypeOf(a,b):a.__proto__=b)}c.__esModule=!0;var h=a("../../menu/menu-button.js"),i=e(h),j=a("../../menu/menu.js"),k=e(j),l=a("./playback-rate-menu-item.js"),m=e(l),n=a("../../component.js"),o=e(n),p=a("../../utils/dom.js"),q=d(p),r=function(a){function b(c,d){f(this,b),a.call(this,c,d),this.updateVisibility(),this.updateLabel(),this.on(c,"loadstart",this.updateVisibility),this.on(c,"ratechange",this.updateLabel)}return g(b,a),b.prototype.createEl=function(){var b=a.prototype.createEl.call(this);return this.labelEl_=q.createEl("div",{className:"vjs-playback-rate-value",innerHTML:1}),b.appendChild(this.labelEl_),b},b.prototype.buildCSSClass=function(){return"vjs-playback-rate "+a.prototype.buildCSSClass.call(this)},b.prototype.createMenu=function(){var a=new k["default"](this.player()),b=this.playbackRates();if(b)for(var c=b.length-1;c>=0;c--)a.addChild(new m["default"](this.player(),{rate:b[c]+"x"}));return a},b.prototype.updateARIAAttributes=function(){this.el().setAttribute("aria-valuenow",this.player().playbackRate())},b.prototype.handleClick=function(){for(var a=this.player().playbackRate(),b=this.playbackRates(),c=b[0],d=0;d<b.length;d++)if(b[d]>a){c=b[d];break}this.player().playbackRate(c)},b.prototype.playbackRates=function(){return this.options_.playbackRates||this.options_.playerOptions&&this.options_.playerOptions.playbackRates},b.prototype.playbackRateSupported=function(){return this.player().tech_&&this.player().tech_.featuresPlaybackRate&&this.playbackRates()&&this.playbackRates().length>0},b.prototype.updateVisibility=function(){this.playbackRateSupported()?this.removeClass("vjs-hidden"):this.addClass("vjs-hidden")},b.prototype.updateLabel=function(){this.playbackRateSupported()&&(this.labelEl_.innerHTML=this.player().playbackRate()+"x")},b}(i["default"]);r.prototype.controlText_="Playback Rate",o["default"].registerComponent("PlaybackRateMenuButton",r),c["default"]=r,b.exports=c["default"]},{"../../component.js":67,"../../menu/menu-button.js":109,"../../menu/menu.js":111,"../../utils/dom.js":143,"./playback-rate-menu-item.js":76}],76:[function(a,b,c){"use strict";function d(a){return a&&a.__esModule?a:{"default":a}}function e(a,b){if(!(a instanceof b))throw new TypeError("Cannot call a class as a function")}function f(a,b){if("function"!=typeof b&&null!==b)throw new TypeError("Super expression must either be null or a function, not "+typeof b);a.prototype=Object.create(b&&b.prototype,{constructor:{value:a,enumerable:!1,writable:!0,configurable:!0}}),b&&(Object.setPrototypeOf?Object.setPrototypeOf(a,b):a.__proto__=b)}c.__esModule=!0;var g=a("../../menu/menu-item.js"),h=d(g),i=a("../../component.js"),j=d(i),k=function(a){function b(c,d){e(this,b);var f=d.rate,g=parseFloat(f,10);d.label=f,d.selected=1===g,a.call(this,c,d),this.label=f,this.rate=g,this.on(c,"ratechange",this.update)}return f(b,a),b.prototype.handleClick=function(){a.prototype.handleClick.call(this),this.player().playbackRate(this.rate)},b.prototype.update=function(){this.selected(this.player().playbackRate()===this.rate)},b}(h["default"]);k.prototype.contentElType="button",j["default"].registerComponent("PlaybackRateMenuItem",k),c["default"]=k,b.exports=c["default"]},{"../../component.js":67,"../../menu/menu-item.js":110}],77:[function(a,b,c){"use strict";function d(a){if(a&&a.__esModule)return a;var b={};if(null!=a)for(var c in a)Object.prototype.hasOwnProperty.call(a,c)&&(b[c]=a[c]);return b["default"]=a,b}function e(a){return a&&a.__esModule?a:{"default":a}}function f(a,b){if(!(a instanceof b))throw new TypeError("Cannot call a class as a function")}function g(a,b){if("function"!=typeof b&&null!==b)throw new TypeError("Super expression must either be null or a function, not "+typeof b);a.prototype=Object.create(b&&b.prototype,{constructor:{value:a,enumerable:!1,writable:!0,configurable:!0}}),b&&(Object.setPrototypeOf?Object.setPrototypeOf(a,b):a.__proto__=b)}c.__esModule=!0;var h=a("../../component.js"),i=e(h),j=a("../../utils/dom.js"),k=d(j),l=function(a){function b(c,d){f(this,b),a.call(this,c,d),this.on(c,"progress",this.update)}return g(b,a),b.prototype.createEl=function(){return a.prototype.createEl.call(this,"div",{className:"vjs-load-progress",innerHTML:'<span class="vjs-control-text"><span>'+this.localize("Loaded")+"</span>: 0%</span>"})},b.prototype.update=function(){var a=this.player_.buffered(),b=this.player_.duration(),c=this.player_.bufferedEnd(),d=this.el_.children,e=function(a,b){var c=a/b||0;return 100*(c>=1?1:c)+"%"};this.el_.style.width=e(c,b);for(var f=0;f<a.length;f++){var g=a.start(f),h=a.end(f),i=d[f];i||(i=this.el_.appendChild(k.createEl())),i.style.left=e(g,c),i.style.width=e(h-g,c)}for(var f=d.length;f>a.length;f--)this.el_.removeChild(d[f-1])},b}(i["default"]);i["default"].registerComponent("LoadProgressBar",l),c["default"]=l,b.exports=c["default"]},{"../../component.js":67,"../../utils/dom.js":143}],78:[function(a,b,c){"use strict";function d(a){if(a&&a.__esModule)return a;var b={};if(null!=a)for(var c in a)Object.prototype.hasOwnProperty.call(a,c)&&(b[c]=a[c]);return b["default"]=a,b}function e(a){return a&&a.__esModule?a:{"default":a}}function f(a,b){if(!(a instanceof b))throw new TypeError("Cannot call a class as a function")}function g(a,b){if("function"!=typeof b&&null!==b)throw new TypeError("Super expression must either be null or a function, not "+typeof b);a.prototype=Object.create(b&&b.prototype,{constructor:{value:a,enumerable:!1,writable:!0,configurable:!0}}),b&&(Object.setPrototypeOf?Object.setPrototypeOf(a,b):a.__proto__=b)}c.__esModule=!0;var h=a("global/window"),i=e(h),j=a("../../component.js"),k=e(j),l=a("../../utils/dom.js"),m=d(l),n=a("../../utils/fn.js"),o=d(n),p=a("../../utils/format-time.js"),q=e(p),r=a("lodash-compat/function/throttle"),s=e(r),t=function(a){function b(c,d){var e=this;f(this,b),a.call(this,c,d),d.playerOptions&&d.playerOptions.controlBar&&d.playerOptions.controlBar.progressControl&&d.playerOptions.controlBar.progressControl.keepTooltipsInside&&(this.keepTooltipsInside=d.playerOptions.controlBar.progressControl.keepTooltipsInside),this.keepTooltipsInside&&(this.tooltip=m.createEl("div",{className:"vjs-time-tooltip"}),this.el().appendChild(this.tooltip),this.addClass("vjs-keep-tooltips-inside")),this.update(0,0),c.on("ready",function(){e.on(c.controlBar.progressControl.el(),"mousemove",s["default"](o.bind(e,e.handleMouseMove),25))})}return g(b,a),b.prototype.createEl=function(){return a.prototype.createEl.call(this,"div",{className:"vjs-mouse-display"})},b.prototype.handleMouseMove=function(a){var b=this.player_.duration(),c=this.calculateDistance(a)*b,d=a.pageX-m.findElPosition(this.el().parentNode).left;this.update(c,d)},b.prototype.update=function(a,b){var c=q["default"](a,this.player_.duration());if(this.el().style.left=b+"px",this.el().setAttribute("data-current-time",c),this.keepTooltipsInside){var d=this.clampPosition_(b),e=b-d+1,f=parseFloat(i["default"].getComputedStyle(this.tooltip).width),g=f/2;this.tooltip.innerHTML=c,this.tooltip.style.right="-"+(g-e)+"px"}},b.prototype.calculateDistance=function(a){return m.getPointerPosition(this.el().parentNode,a).x},b.prototype.clampPosition_=function(a){if(!this.keepTooltipsInside)return a;var b=parseFloat(i["default"].getComputedStyle(this.player().el()).width),c=parseFloat(i["default"].getComputedStyle(this.tooltip).width),d=c/2,e=a;return d>a?e=Math.ceil(d):a>b-d&&(e=Math.floor(b-d)),e},b}(k["default"]);k["default"].registerComponent("MouseTimeDisplay",t),c["default"]=t,b.exports=c["default"]},{"../../component.js":67,"../../utils/dom.js":143,"../../utils/fn.js":145,"../../utils/format-time.js":146,"global/window":2,"lodash-compat/function/throttle":7}],79:[function(a,b,c){"use strict";function d(a){if(a&&a.__esModule)return a;var b={};if(null!=a)for(var c in a)Object.prototype.hasOwnProperty.call(a,c)&&(b[c]=a[c]);return b["default"]=a,b}function e(a){return a&&a.__esModule?a:{
"default":a}}function f(a,b){if(!(a instanceof b))throw new TypeError("Cannot call a class as a function")}function g(a,b){if("function"!=typeof b&&null!==b)throw new TypeError("Super expression must either be null or a function, not "+typeof b);a.prototype=Object.create(b&&b.prototype,{constructor:{value:a,enumerable:!1,writable:!0,configurable:!0}}),b&&(Object.setPrototypeOf?Object.setPrototypeOf(a,b):a.__proto__=b)}c.__esModule=!0;var h=a("../../component.js"),i=e(h),j=a("../../utils/fn.js"),k=d(j),l=a("../../utils/dom.js"),m=(d(l),a("../../utils/format-time.js")),n=e(m),o=function(a){function b(c,d){f(this,b),a.call(this,c,d),this.updateDataAttr(),this.on(c,"timeupdate",this.updateDataAttr),c.ready(k.bind(this,this.updateDataAttr)),d.playerOptions&&d.playerOptions.controlBar&&d.playerOptions.controlBar.progressControl&&d.playerOptions.controlBar.progressControl.keepTooltipsInside&&(this.keepTooltipsInside=d.playerOptions.controlBar.progressControl.keepTooltipsInside),this.keepTooltipsInside&&this.addClass("vjs-keep-tooltips-inside")}return g(b,a),b.prototype.createEl=function(){return a.prototype.createEl.call(this,"div",{className:"vjs-play-progress vjs-slider-bar",innerHTML:'<span class="vjs-control-text"><span>'+this.localize("Progress")+"</span>: 0%</span>"})},b.prototype.updateDataAttr=function(){var a=this.player_.scrubbing()?this.player_.getCache().currentTime:this.player_.currentTime();this.el_.setAttribute("data-current-time",n["default"](a,this.player_.duration()))},b}(i["default"]);i["default"].registerComponent("PlayProgressBar",o),c["default"]=o,b.exports=c["default"]},{"../../component.js":67,"../../utils/dom.js":143,"../../utils/fn.js":145,"../../utils/format-time.js":146}],80:[function(a,b,c){"use strict";function d(a){return a&&a.__esModule?a:{"default":a}}function e(a,b){if(!(a instanceof b))throw new TypeError("Cannot call a class as a function")}function f(a,b){if("function"!=typeof b&&null!==b)throw new TypeError("Super expression must either be null or a function, not "+typeof b);a.prototype=Object.create(b&&b.prototype,{constructor:{value:a,enumerable:!1,writable:!0,configurable:!0}}),b&&(Object.setPrototypeOf?Object.setPrototypeOf(a,b):a.__proto__=b)}c.__esModule=!0;var g=a("../../component.js"),h=d(g),i=a("./seek-bar.js"),j=(d(i),a("./mouse-time-display.js")),k=(d(j),function(a){function b(){e(this,b),a.apply(this,arguments)}return f(b,a),b.prototype.createEl=function(){return a.prototype.createEl.call(this,"div",{className:"vjs-progress-control vjs-control"})},b}(h["default"]));k.prototype.options_={children:["seekBar"]},h["default"].registerComponent("ProgressControl",k),c["default"]=k,b.exports=c["default"]},{"../../component.js":67,"./mouse-time-display.js":78,"./seek-bar.js":81}],81:[function(a,b,c){"use strict";function d(a){if(a&&a.__esModule)return a;var b={};if(null!=a)for(var c in a)Object.prototype.hasOwnProperty.call(a,c)&&(b[c]=a[c]);return b["default"]=a,b}function e(a){return a&&a.__esModule?a:{"default":a}}function f(a,b){if(!(a instanceof b))throw new TypeError("Cannot call a class as a function")}function g(a,b){if("function"!=typeof b&&null!==b)throw new TypeError("Super expression must either be null or a function, not "+typeof b);a.prototype=Object.create(b&&b.prototype,{constructor:{value:a,enumerable:!1,writable:!0,configurable:!0}}),b&&(Object.setPrototypeOf?Object.setPrototypeOf(a,b):a.__proto__=b)}c.__esModule=!0;var h=a("global/window"),i=e(h),j=a("../../slider/slider.js"),k=e(j),l=a("../../component.js"),m=e(l),n=a("./load-progress-bar.js"),o=(e(n),a("./play-progress-bar.js")),p=(e(o),a("./tooltip-progress-bar.js")),q=(e(p),a("../../utils/fn.js")),r=d(q),s=a("../../utils/format-time.js"),t=e(s),u=a("object.assign"),v=(e(u),function(a){function b(c,d){f(this,b),a.call(this,c,d),this.on(c,"timeupdate",this.updateProgress),this.on(c,"ended",this.updateProgress),c.ready(r.bind(this,this.updateProgress)),d.playerOptions&&d.playerOptions.controlBar&&d.playerOptions.controlBar.progressControl&&d.playerOptions.controlBar.progressControl.keepTooltipsInside&&(this.keepTooltipsInside=d.playerOptions.controlBar.progressControl.keepTooltipsInside),this.keepTooltipsInside&&(this.tooltipProgressBar=this.addChild("TooltipProgressBar"))}return g(b,a),b.prototype.createEl=function(){return a.prototype.createEl.call(this,"div",{className:"vjs-progress-holder"},{"aria-label":"progress bar"})},b.prototype.updateProgress=function(){if(this.updateAriaAttributes(this.el_),this.keepTooltipsInside){this.updateAriaAttributes(this.tooltipProgressBar.el_),this.tooltipProgressBar.el_.style.width=this.bar.el_.style.width;var a=parseFloat(i["default"].getComputedStyle(this.player().el()).width),b=parseFloat(i["default"].getComputedStyle(this.tooltipProgressBar.tooltip).width),c=this.tooltipProgressBar.el().style;c.maxWidth=Math.floor(a-b/2)+"px",c.minWidth=Math.ceil(b/2)+"px",c.right="-"+b/2+"px"}},b.prototype.updateAriaAttributes=function(a){var b=this.player_.scrubbing()?this.player_.getCache().currentTime:this.player_.currentTime();a.setAttribute("aria-valuenow",(100*this.getPercent()).toFixed(2)),a.setAttribute("aria-valuetext",t["default"](b,this.player_.duration()))},b.prototype.getPercent=function(){var a=this.player_.currentTime()/this.player_.duration();return a>=1?1:a},b.prototype.handleMouseDown=function(b){a.prototype.handleMouseDown.call(this,b),this.player_.scrubbing(!0),this.videoWasPlaying=!this.player_.paused(),this.player_.pause()},b.prototype.handleMouseMove=function(a){var b=this.calculateDistance(a)*this.player_.duration();b===this.player_.duration()&&(b-=.1),this.player_.currentTime(b)},b.prototype.handleMouseUp=function(b){a.prototype.handleMouseUp.call(this,b),this.player_.scrubbing(!1),this.videoWasPlaying&&this.player_.play()},b.prototype.stepForward=function(){this.player_.currentTime(this.player_.currentTime()+5)},b.prototype.stepBack=function(){this.player_.currentTime(this.player_.currentTime()-5)},b}(k["default"]));v.prototype.options_={children:["loadProgressBar","mouseTimeDisplay","playProgressBar"],barName:"playProgressBar"},v.prototype.playerEvent="timeupdate",m["default"].registerComponent("SeekBar",v),c["default"]=v,b.exports=c["default"]},{"../../component.js":67,"../../slider/slider.js":119,"../../utils/fn.js":145,"../../utils/format-time.js":146,"./load-progress-bar.js":77,"./play-progress-bar.js":79,"./tooltip-progress-bar.js":82,"global/window":2,"object.assign":45}],82:[function(a,b,c){"use strict";function d(a){if(a&&a.__esModule)return a;var b={};if(null!=a)for(var c in a)Object.prototype.hasOwnProperty.call(a,c)&&(b[c]=a[c]);return b["default"]=a,b}function e(a){return a&&a.__esModule?a:{"default":a}}function f(a,b){if(!(a instanceof b))throw new TypeError("Cannot call a class as a function")}function g(a,b){if("function"!=typeof b&&null!==b)throw new TypeError("Super expression must either be null or a function, not "+typeof b);a.prototype=Object.create(b&&b.prototype,{constructor:{value:a,enumerable:!1,writable:!0,configurable:!0}}),b&&(Object.setPrototypeOf?Object.setPrototypeOf(a,b):a.__proto__=b)}c.__esModule=!0;var h=a("../../component.js"),i=e(h),j=a("../../utils/fn.js"),k=d(j),l=a("../../utils/dom.js"),m=(d(l),a("../../utils/format-time.js")),n=e(m),o=function(a){function b(c,d){f(this,b),a.call(this,c,d),this.updateDataAttr(),this.on(c,"timeupdate",this.updateDataAttr),c.ready(k.bind(this,this.updateDataAttr))}return g(b,a),b.prototype.createEl=function(){var b=a.prototype.createEl.call(this,"div",{className:"vjs-tooltip-progress-bar vjs-slider-bar",innerHTML:'<div class="vjs-time-tooltip"></div>\n        <span class="vjs-control-text"><span>'+this.localize("Progress")+"</span>: 0%</span>"});return this.tooltip=b.querySelector(".vjs-time-tooltip"),b},b.prototype.updateDataAttr=function(){var a=this.player_.scrubbing()?this.player_.getCache().currentTime:this.player_.currentTime(),b=n["default"](a,this.player_.duration());this.el_.setAttribute("data-current-time",b),this.tooltip.innerHTML=b},b}(i["default"]);i["default"].registerComponent("TooltipProgressBar",o),c["default"]=o,b.exports=c["default"]},{"../../component.js":67,"../../utils/dom.js":143,"../../utils/fn.js":145,"../../utils/format-time.js":146}],83:[function(a,b,c){"use strict";function d(a){return a&&a.__esModule?a:{"default":a}}function e(a,b){if(!(a instanceof b))throw new TypeError("Cannot call a class as a function")}function f(a,b){if("function"!=typeof b&&null!==b)throw new TypeError("Super expression must either be null or a function, not "+typeof b);a.prototype=Object.create(b&&b.prototype,{constructor:{value:a,enumerable:!1,writable:!0,configurable:!0}}),b&&(Object.setPrototypeOf?Object.setPrototypeOf(a,b):a.__proto__=b)}c.__esModule=!0;var g=a("./spacer.js"),h=d(g),i=a("../../component.js"),j=d(i),k=function(a){function b(){e(this,b),a.apply(this,arguments)}return f(b,a),b.prototype.buildCSSClass=function(){return"vjs-custom-control-spacer "+a.prototype.buildCSSClass.call(this)},b.prototype.createEl=function(){var b=a.prototype.createEl.call(this,{className:this.buildCSSClass()});return b.innerHTML="&nbsp;",b},b}(h["default"]);j["default"].registerComponent("CustomControlSpacer",k),c["default"]=k,b.exports=c["default"]},{"../../component.js":67,"./spacer.js":84}],84:[function(a,b,c){"use strict";function d(a){return a&&a.__esModule?a:{"default":a}}function e(a,b){if(!(a instanceof b))throw new TypeError("Cannot call a class as a function")}function f(a,b){if("function"!=typeof b&&null!==b)throw new TypeError("Super expression must either be null or a function, not "+typeof b);a.prototype=Object.create(b&&b.prototype,{constructor:{value:a,enumerable:!1,writable:!0,configurable:!0}}),b&&(Object.setPrototypeOf?Object.setPrototypeOf(a,b):a.__proto__=b)}c.__esModule=!0;var g=a("../../component.js"),h=d(g),i=function(a){function b(){e(this,b),a.apply(this,arguments)}return f(b,a),b.prototype.buildCSSClass=function(){return"vjs-spacer "+a.prototype.buildCSSClass.call(this)},b.prototype.createEl=function(){return a.prototype.createEl.call(this,"div",{className:this.buildCSSClass()})},b}(h["default"]);h["default"].registerComponent("Spacer",i),c["default"]=i,b.exports=c["default"]},{"../../component.js":67}],85:[function(a,b,c){"use strict";function d(a){return a&&a.__esModule?a:{"default":a}}function e(a,b){if(!(a instanceof b))throw new TypeError("Cannot call a class as a function")}function f(a,b){if("function"!=typeof b&&null!==b)throw new TypeError("Super expression must either be null or a function, not "+typeof b);a.prototype=Object.create(b&&b.prototype,{constructor:{value:a,enumerable:!1,writable:!0,configurable:!0}}),b&&(Object.setPrototypeOf?Object.setPrototypeOf(a,b):a.__proto__=b)}c.__esModule=!0;var g=a("./text-track-menu-item.js"),h=d(g),i=a("../../component.js"),j=d(i),k=function(a){function b(c,d){e(this,b),d.track={kind:d.kind,player:c,label:d.kind+" settings",selectable:!1,"default":!1,mode:"disabled"},d.selectable=!1,a.call(this,c,d),this.addClass("vjs-texttrack-settings"),this.controlText(", opens "+d.kind+" settings dialog")}return f(b,a),b.prototype.handleClick=function(){this.player().getChild("textTrackSettings").show(),this.player().getChild("textTrackSettings").el_.focus()},b}(h["default"]);j["default"].registerComponent("CaptionSettingsMenuItem",k),c["default"]=k,b.exports=c["default"]},{"../../component.js":67,"./text-track-menu-item.js":93}],86:[function(a,b,c){"use strict";function d(a){return a&&a.__esModule?a:{"default":a}}function e(a,b){if(!(a instanceof b))throw new TypeError("Cannot call a class as a function")}function f(a,b){if("function"!=typeof b&&null!==b)throw new TypeError("Super expression must either be null or a function, not "+typeof b);a.prototype=Object.create(b&&b.prototype,{constructor:{value:a,enumerable:!1,writable:!0,configurable:!0}}),b&&(Object.setPrototypeOf?Object.setPrototypeOf(a,b):a.__proto__=b)}c.__esModule=!0;var g=a("./text-track-button.js"),h=d(g),i=a("../../component.js"),j=d(i),k=a("./caption-settings-menu-item.js"),l=d(k),m=function(a){function b(c,d,f){e(this,b),a.call(this,c,d,f),this.el_.setAttribute("aria-label","Captions Menu")}return f(b,a),b.prototype.buildCSSClass=function(){return"vjs-captions-button "+a.prototype.buildCSSClass.call(this)},b.prototype.update=function(){var b=2;a.prototype.update.call(this),this.player().tech_&&this.player().tech_.featuresNativeTextTracks&&(b=1),this.items&&this.items.length>b?this.show():this.hide()},b.prototype.createItems=function(){var b=[];return this.player().tech_&&this.player().tech_.featuresNativeTextTracks||b.push(new l["default"](this.player_,{kind:this.kind_})),a.prototype.createItems.call(this,b)},b}(h["default"]);m.prototype.kind_="captions",m.prototype.controlText_="Captions",j["default"].registerComponent("CaptionsButton",m),c["default"]=m,b.exports=c["default"]},{"../../component.js":67,"./caption-settings-menu-item.js":85,"./text-track-button.js":92}],87:[function(a,b,c){"use strict";function d(a){if(a&&a.__esModule)return a;var b={};if(null!=a)for(var c in a)Object.prototype.hasOwnProperty.call(a,c)&&(b[c]=a[c]);return b["default"]=a,b}function e(a){return a&&a.__esModule?a:{"default":a}}function f(a,b){if(!(a instanceof b))throw new TypeError("Cannot call a class as a function")}function g(a,b){if("function"!=typeof b&&null!==b)throw new TypeError("Super expression must either be null or a function, not "+typeof b);a.prototype=Object.create(b&&b.prototype,{constructor:{value:a,enumerable:!1,writable:!0,configurable:!0}}),b&&(Object.setPrototypeOf?Object.setPrototypeOf(a,b):a.__proto__=b)}c.__esModule=!0;var h=a("./text-track-button.js"),i=e(h),j=a("../../component.js"),k=e(j),l=a("./text-track-menu-item.js"),m=e(l),n=a("./chapters-track-menu-item.js"),o=e(n),p=a("../../menu/menu.js"),q=e(p),r=a("../../utils/dom.js"),s=d(r),t=a("../../utils/fn.js"),u=(d(t),a("../../utils/to-title-case.js")),v=e(u),w=a("global/window"),x=(e(w),function(a){function b(c,d,e){f(this,b),a.call(this,c,d,e),this.el_.setAttribute("aria-label","Chapters Menu")}return g(b,a),b.prototype.buildCSSClass=function(){return"vjs-chapters-button "+a.prototype.buildCSSClass.call(this)},b.prototype.createItems=function(){var a=[],b=this.player_.textTracks();if(!b)return a;for(var c=0;c<b.length;c++){var d=b[c];d.kind===this.kind_&&a.push(new m["default"](this.player_,{track:d}))}return a},b.prototype.createMenu=function(){for(var a=this,b=this.player_.textTracks()||[],c=void 0,d=this.items=[],e=0,f=b.length;f>e;e++){var g=b[e];if(g.kind===this.kind_){c=g;break}}var h=this.menu;if(void 0===h){h=new q["default"](this.player_);var i=s.createEl("li",{className:"vjs-menu-title",innerHTML:v["default"](this.kind_),tabIndex:-1});h.children_.unshift(i),s.insertElFirst(i,h.contentEl())}if(c&&null==c.cues){c.mode="hidden";var j=this.player_.remoteTextTrackEls().getTrackElementByTrack_(c);j&&j.addEventListener("load",function(){return a.update()})}if(c&&c.cues&&c.cues.length>0){for(var k=c.cues,l=void 0,e=0,m=k.length;m>e;e++){l=k[e];var n=new o["default"](this.player_,{track:c,cue:l});d.push(n),h.addChild(n)}this.addChild(h)}return this.items.length>0&&this.show(),h},b}(i["default"]));x.prototype.kind_="chapters",x.prototype.controlText_="Chapters",k["default"].registerComponent("ChaptersButton",x),c["default"]=x,b.exports=c["default"]},{"../../component.js":67,"../../menu/menu.js":111,"../../utils/dom.js":143,"../../utils/fn.js":145,"../../utils/to-title-case.js":152,"./chapters-track-menu-item.js":88,"./text-track-button.js":92,"./text-track-menu-item.js":93,"global/window":2}],88:[function(a,b,c){"use strict";function d(a){if(a&&a.__esModule)return a;var b={};if(null!=a)for(var c in a)Object.prototype.hasOwnProperty.call(a,c)&&(b[c]=a[c]);return b["default"]=a,b}function e(a){return a&&a.__esModule?a:{"default":a}}function f(a,b){if(!(a instanceof b))throw new TypeError("Cannot call a class as a function")}function g(a,b){if("function"!=typeof b&&null!==b)throw new TypeError("Super expression must either be null or a function, not "+typeof b);a.prototype=Object.create(b&&b.prototype,{constructor:{value:a,enumerable:!1,writable:!0,configurable:!0}}),b&&(Object.setPrototypeOf?Object.setPrototypeOf(a,b):a.__proto__=b)}c.__esModule=!0;var h=a("../../menu/menu-item.js"),i=e(h),j=a("../../component.js"),k=e(j),l=a("../../utils/fn.js"),m=d(l),n=function(a){function b(c,d){f(this,b);var e=d.track,g=d.cue,h=c.currentTime();d.label=g.text,d.selected=g.startTime<=h&&h<g.endTime,a.call(this,c,d),this.track=e,this.cue=g,e.addEventListener("cuechange",m.bind(this,this.update))}return g(b,a),b.prototype.handleClick=function(){a.prototype.handleClick.call(this),this.player_.currentTime(this.cue.startTime),this.update(this.cue.startTime)},b.prototype.update=function(){var a=this.cue,b=this.player_.currentTime();this.selected(a.startTime<=b&&b<a.endTime)},b}(i["default"]);k["default"].registerComponent("ChaptersTrackMenuItem",n),c["default"]=n,b.exports=c["default"]},{"../../component.js":67,"../../menu/menu-item.js":110,"../../utils/fn.js":145}],89:[function(a,b,c){"use strict";function d(a){if(a&&a.__esModule)return a;var b={};if(null!=a)for(var c in a)Object.prototype.hasOwnProperty.call(a,c)&&(b[c]=a[c]);return b["default"]=a,b}function e(a){return a&&a.__esModule?a:{"default":a}}function f(a,b){if(!(a instanceof b))throw new TypeError("Cannot call a class as a function")}function g(a,b){if("function"!=typeof b&&null!==b)throw new TypeError("Super expression must either be null or a function, not "+typeof b);a.prototype=Object.create(b&&b.prototype,{constructor:{value:a,enumerable:!1,writable:!0,configurable:!0}}),b&&(Object.setPrototypeOf?Object.setPrototypeOf(a,b):a.__proto__=b)}c.__esModule=!0;var h=a("./text-track-button.js"),i=e(h),j=a("../../component.js"),k=e(j),l=a("../../utils/fn.js"),m=d(l),n=function(a){function b(c,d,e){var g=this;f(this,b),a.call(this,c,d,e),this.el_.setAttribute("aria-label","Descriptions Menu");var h=c.textTracks();h&&!function(){var a=m.bind(g,g.handleTracksChange);h.addEventListener("change",a),g.on("dispose",function(){h.removeEventListener("change",a)})}()}return g(b,a),b.prototype.handleTracksChange=function(){for(var a=this.player().textTracks(),b=!1,c=0,d=a.length;d>c;c++){var e=a[c];if(e.kind!==this.kind_&&"showing"===e.mode){b=!0;break}}b?this.disable():this.enable()},b.prototype.buildCSSClass=function(){return"vjs-descriptions-button "+a.prototype.buildCSSClass.call(this)},b}(i["default"]);n.prototype.kind_="descriptions",n.prototype.controlText_="Descriptions",k["default"].registerComponent("DescriptionsButton",n),c["default"]=n,b.exports=c["default"]},{"../../component.js":67,"../../utils/fn.js":145,"./text-track-button.js":92}],90:[function(a,b,c){"use strict";function d(a){return a&&a.__esModule?a:{"default":a}}function e(a,b){if(!(a instanceof b))throw new TypeError("Cannot call a class as a function")}function f(a,b){if("function"!=typeof b&&null!==b)throw new TypeError("Super expression must either be null or a function, not "+typeof b);a.prototype=Object.create(b&&b.prototype,{constructor:{value:a,enumerable:!1,writable:!0,configurable:!0}}),b&&(Object.setPrototypeOf?Object.setPrototypeOf(a,b):a.__proto__=b)}c.__esModule=!0;var g=a("./text-track-menu-item.js"),h=d(g),i=a("../../component.js"),j=d(i),k=function(a){function b(c,d){e(this,b),d.track={kind:d.kind,player:c,label:d.kind+" off","default":!1,mode:"disabled"},d.selectable=!0,a.call(this,c,d),this.selected(!0)}return f(b,a),b.prototype.handleTracksChange=function(){for(var a=this.player().textTracks(),b=!0,c=0,d=a.length;d>c;c++){var e=a[c];if(e.kind===this.track.kind&&"showing"===e.mode){b=!1;break}}this.selected(b)},b}(h["default"]);j["default"].registerComponent("OffTextTrackMenuItem",k),c["default"]=k,b.exports=c["default"]},{"../../component.js":67,"./text-track-menu-item.js":93}],91:[function(a,b,c){"use strict";function d(a){return a&&a.__esModule?a:{"default":a}}function e(a,b){if(!(a instanceof b))throw new TypeError("Cannot call a class as a function")}function f(a,b){if("function"!=typeof b&&null!==b)throw new TypeError("Super expression must either be null or a function, not "+typeof b);a.prototype=Object.create(b&&b.prototype,{constructor:{value:a,enumerable:!1,writable:!0,configurable:!0}}),b&&(Object.setPrototypeOf?Object.setPrototypeOf(a,b):a.__proto__=b)}c.__esModule=!0;var g=a("./text-track-button.js"),h=d(g),i=a("../../component.js"),j=d(i),k=function(a){function b(c,d,f){e(this,b),a.call(this,c,d,f),this.el_.setAttribute("aria-label","Subtitles Menu")}return f(b,a),b.prototype.buildCSSClass=function(){return"vjs-subtitles-button "+a.prototype.buildCSSClass.call(this)},b}(h["default"]);k.prototype.kind_="subtitles",k.prototype.controlText_="Subtitles",j["default"].registerComponent("SubtitlesButton",k),c["default"]=k,b.exports=c["default"]},{"../../component.js":67,"./text-track-button.js":92}],92:[function(a,b,c){"use strict";function d(a){if(a&&a.__esModule)return a;var b={};if(null!=a)for(var c in a)Object.prototype.hasOwnProperty.call(a,c)&&(b[c]=a[c]);return b["default"]=a,b}function e(a){return a&&a.__esModule?a:{"default":a}}function f(a,b){if(!(a instanceof b))throw new TypeError("Cannot call a class as a function")}function g(a,b){if("function"!=typeof b&&null!==b)throw new TypeError("Super expression must either be null or a function, not "+typeof b);a.prototype=Object.create(b&&b.prototype,{constructor:{value:a,enumerable:!1,writable:!0,configurable:!0}}),b&&(Object.setPrototypeOf?Object.setPrototypeOf(a,b):a.__proto__=b)}c.__esModule=!0;var h=a("../track-button.js"),i=e(h),j=a("../../component.js"),k=e(j),l=a("../../utils/fn.js"),m=(d(l),a("./text-track-menu-item.js")),n=e(m),o=a("./off-text-track-menu-item.js"),p=e(o),q=function(a){function b(c){var d=arguments.length<=1||void 0===arguments[1]?{}:arguments[1];f(this,b),d.tracks=c.textTracks(),a.call(this,c,d)}return g(b,a),b.prototype.createItems=function(){var a=arguments.length<=0||void 0===arguments[0]?[]:arguments[0];a.push(new p["default"](this.player_,{kind:this.kind_}));var b=this.player_.textTracks();if(!b)return a;for(var c=0;c<b.length;c++){var d=b[c];d.kind===this.kind_&&a.push(new n["default"](this.player_,{selectable:!0,track:d}))}return a},b}(i["default"]);k["default"].registerComponent("TextTrackButton",q),c["default"]=q,b.exports=c["default"]},{"../../component.js":67,"../../utils/fn.js":145,"../track-button.js":98,"./off-text-track-menu-item.js":90,"./text-track-menu-item.js":93}],93:[function(a,b,c){"use strict";function d(a){if(a&&a.__esModule)return a;var b={};if(null!=a)for(var c in a)Object.prototype.hasOwnProperty.call(a,c)&&(b[c]=a[c]);return b["default"]=a,b}function e(a){return a&&a.__esModule?a:{"default":a}}function f(a,b){if(!(a instanceof b))throw new TypeError("Cannot call a class as a function")}function g(a,b){if("function"!=typeof b&&null!==b)throw new TypeError("Super expression must either be null or a function, not "+typeof b);a.prototype=Object.create(b&&b.prototype,{constructor:{value:a,enumerable:!1,writable:!0,configurable:!0}}),b&&(Object.setPrototypeOf?Object.setPrototypeOf(a,b):a.__proto__=b)}c.__esModule=!0;var h=a("../../menu/menu-item.js"),i=e(h),j=a("../../component.js"),k=e(j),l=a("../../utils/fn.js"),m=d(l),n=a("global/window"),o=e(n),p=a("global/document"),q=e(p),r=function(a){function b(c,d){var e=this;f(this,b);var g=d.track,h=c.textTracks();d.label=g.label||g.language||"Unknown",d.selected=g["default"]||"showing"===g.mode,a.call(this,c,d),this.track=g,h&&!function(){var a=m.bind(e,e.handleTracksChange);h.addEventListener("change",a),e.on("dispose",function(){h.removeEventListener("change",a)})}(),h&&void 0===h.onchange&&!function(){var a=void 0;e.on(["tap","click"],function(){if("object"!=typeof o["default"].Event)try{a=new o["default"].Event("change")}catch(b){}a||(a=q["default"].createEvent("Event"),a.initEvent("change",!0,!0)),h.dispatchEvent(a)})}()}return g(b,a),b.prototype.handleClick=function(b){var c=this.track.kind,d=this.player_.textTracks();if(a.prototype.handleClick.call(this,b),d)for(var e=0;e<d.length;e++){var f=d[e];f.kind===c&&(f.mode=f===this.track?"showing":"disabled")}},b.prototype.handleTracksChange=function(){this.selected("showing"===this.track.mode)},b}(i["default"]);k["default"].registerComponent("TextTrackMenuItem",r),c["default"]=r,b.exports=c["default"]},{"../../component.js":67,"../../menu/menu-item.js":110,"../../utils/fn.js":145,"global/document":1,"global/window":2}],94:[function(a,b,c){"use strict";function d(a){if(a&&a.__esModule)return a;var b={};if(null!=a)for(var c in a)Object.prototype.hasOwnProperty.call(a,c)&&(b[c]=a[c]);return b["default"]=a,b}function e(a){return a&&a.__esModule?a:{"default":a}}function f(a,b){if(!(a instanceof b))throw new TypeError("Cannot call a class as a function")}function g(a,b){if("function"!=typeof b&&null!==b)throw new TypeError("Super expression must either be null or a function, not "+typeof b);a.prototype=Object.create(b&&b.prototype,{constructor:{value:a,enumerable:!1,writable:!0,configurable:!0}}),b&&(Object.setPrototypeOf?Object.setPrototypeOf(a,b):a.__proto__=b)}c.__esModule=!0;var h=a("../../component.js"),i=e(h),j=a("../../utils/dom.js"),k=d(j),l=a("../../utils/format-time.js"),m=e(l),n=function(a){function b(c,d){f(this,b),a.call(this,c,d),this.on(c,"timeupdate",this.updateContent)}return g(b,a),b.prototype.createEl=function(){var b=a.prototype.createEl.call(this,"div",{className:"vjs-current-time vjs-time-control vjs-control"});return this.contentEl_=k.createEl("div",{className:"vjs-current-time-display",innerHTML:'<span class="vjs-control-text">Current Time </span>0:00'},{"aria-live":"off"}),b.appendChild(this.contentEl_),b},b.prototype.updateContent=function(){var a=this.player_.scrubbing()?this.player_.getCache().currentTime:this.player_.currentTime(),b=this.localize("Current Time"),c=m["default"](a,this.player_.duration());c!==this.formattedTime_&&(this.formattedTime_=c,this.contentEl_.innerHTML='<span class="vjs-control-text">'+b+"</span> "+c)},b}(i["default"]);i["default"].registerComponent("CurrentTimeDisplay",n),c["default"]=n,b.exports=c["default"]},{"../../component.js":67,"../../utils/dom.js":143,"../../utils/format-time.js":146}],95:[function(a,b,c){"use strict";function d(a){if(a&&a.__esModule)return a;var b={};if(null!=a)for(var c in a)Object.prototype.hasOwnProperty.call(a,c)&&(b[c]=a[c]);return b["default"]=a,b}function e(a){return a&&a.__esModule?a:{"default":a}}function f(a,b){if(!(a instanceof b))throw new TypeError("Cannot call a class as a function")}function g(a,b){if("function"!=typeof b&&null!==b)throw new TypeError("Super expression must either be null or a function, not "+typeof b);a.prototype=Object.create(b&&b.prototype,{constructor:{value:a,enumerable:!1,writable:!0,configurable:!0}}),b&&(Object.setPrototypeOf?Object.setPrototypeOf(a,b):a.__proto__=b)}c.__esModule=!0;var h=a("../../component.js"),i=e(h),j=a("../../utils/dom.js"),k=d(j),l=a("../../utils/format-time.js"),m=e(l),n=function(a){function b(c,d){f(this,b),a.call(this,c,d),this.on(c,"timeupdate",this.updateContent),this.on(c,"loadedmetadata",this.updateContent)}return g(b,a),b.prototype.createEl=function(){var b=a.prototype.createEl.call(this,"div",{className:"vjs-duration vjs-time-control vjs-control"});return this.contentEl_=k.createEl("div",{className:"vjs-duration-display",innerHTML:'<span class="vjs-control-text">'+this.localize("Duration Time")+"</span> 0:00"},{"aria-live":"off"}),b.appendChild(this.contentEl_),b},b.prototype.updateContent=function(){var a=this.player_.duration();if(a&&this.duration_!==a){this.duration_=a;var b=this.localize("Duration Time"),c=m["default"](a);this.contentEl_.innerHTML='<span class="vjs-control-text">'+b+"</span> "+c}},b}(i["default"]);i["default"].registerComponent("DurationDisplay",n),c["default"]=n,b.exports=c["default"]},{"../../component.js":67,"../../utils/dom.js":143,"../../utils/format-time.js":146}],96:[function(a,b,c){"use strict";function d(a){if(a&&a.__esModule)return a;var b={};if(null!=a)for(var c in a)Object.prototype.hasOwnProperty.call(a,c)&&(b[c]=a[c]);return b["default"]=a,b}function e(a){return a&&a.__esModule?a:{"default":a}}function f(a,b){if(!(a instanceof b))throw new TypeError("Cannot call a class as a function")}function g(a,b){if("function"!=typeof b&&null!==b)throw new TypeError("Super expression must either be null or a function, not "+typeof b);a.prototype=Object.create(b&&b.prototype,{constructor:{value:a,enumerable:!1,writable:!0,configurable:!0}}),b&&(Object.setPrototypeOf?Object.setPrototypeOf(a,b):a.__proto__=b)}c.__esModule=!0;var h=a("../../component.js"),i=e(h),j=a("../../utils/dom.js"),k=d(j),l=a("../../utils/format-time.js"),m=e(l),n=function(a){function b(c,d){f(this,b),a.call(this,c,d),this.on(c,"timeupdate",this.updateContent)}return g(b,a),b.prototype.createEl=function(){var b=a.prototype.createEl.call(this,"div",{className:"vjs-remaining-time vjs-time-control vjs-control"});return this.contentEl_=k.createEl("div",{className:"vjs-remaining-time-display",innerHTML:'<span class="vjs-control-text">'+this.localize("Remaining Time")+"</span> -0:00"},{"aria-live":"off"}),b.appendChild(this.contentEl_),b},b.prototype.updateContent=function(){if(this.player_.duration()){var a=this.localize("Remaining Time"),b=m["default"](this.player_.remainingTime());b!==this.formattedTime_&&(this.formattedTime_=b,this.contentEl_.innerHTML='<span class="vjs-control-text">'+a+"</span> -"+b)}},b}(i["default"]);i["default"].registerComponent("RemainingTimeDisplay",n),c["default"]=n,b.exports=c["default"]},{"../../component.js":67,"../../utils/dom.js":143,"../../utils/format-time.js":146}],97:[function(a,b,c){"use strict";function d(a){return a&&a.__esModule?a:{"default":a}}function e(a,b){if(!(a instanceof b))throw new TypeError("Cannot call a class as a function")}function f(a,b){if("function"!=typeof b&&null!==b)throw new TypeError("Super expression must either be null or a function, not "+typeof b);a.prototype=Object.create(b&&b.prototype,{constructor:{value:a,enumerable:!1,writable:!0,configurable:!0}}),b&&(Object.setPrototypeOf?Object.setPrototypeOf(a,b):a.__proto__=b)}c.__esModule=!0;var g=a("../../component.js"),h=d(g),i=function(a){function b(){e(this,b),a.apply(this,arguments)}return f(b,a),b.prototype.createEl=function(){return a.prototype.createEl.call(this,"div",{className:"vjs-time-control vjs-time-divider",innerHTML:"<div><span>/</span></div>"})},b}(h["default"]);h["default"].registerComponent("TimeDivider",i),c["default"]=i,b.exports=c["default"]},{"../../component.js":67}],98:[function(a,b,c){"use strict";function d(a){if(a&&a.__esModule)return a;var b={};if(null!=a)for(var c in a)Object.prototype.hasOwnProperty.call(a,c)&&(b[c]=a[c]);return b["default"]=a,b}function e(a){return a&&a.__esModule?a:{"default":a}}function f(a,b){if(!(a instanceof b))throw new TypeError("Cannot call a class as a function")}function g(a,b){if("function"!=typeof b&&null!==b)throw new TypeError("Super expression must either be null or a function, not "+typeof b);a.prototype=Object.create(b&&b.prototype,{constructor:{value:a,enumerable:!1,writable:!0,configurable:!0}}),b&&(Object.setPrototypeOf?Object.setPrototypeOf(a,b):a.__proto__=b)}c.__esModule=!0;var h=a("../menu/menu-button.js"),i=e(h),j=a("../component.js"),k=e(j),l=a("../utils/fn.js"),m=d(l),n=function(a){function b(c,d){f(this,b);var e=d.tracks;if(a.call(this,c,d),this.items.length<=1&&this.hide(),e){var g=m.bind(this,this.update);e.addEventListener("removetrack",g),e.addEventListener("addtrack",g),this.player_.on("dispose",function(){e.removeEventListener("removetrack",g),e.removeEventListener("addtrack",g)})}}return g(b,a),b}(i["default"]);k["default"].registerComponent("TrackButton",n),c["default"]=n,b.exports=c["default"]},{"../component.js":67,"../menu/menu-button.js":109,"../utils/fn.js":145}],99:[function(a,b,c){"use strict";function d(a){if(a&&a.__esModule)return a;

var b={};if(null!=a)for(var c in a)Object.prototype.hasOwnProperty.call(a,c)&&(b[c]=a[c]);return b["default"]=a,b}function e(a){return a&&a.__esModule?a:{"default":a}}function f(a,b){if(!(a instanceof b))throw new TypeError("Cannot call a class as a function")}function g(a,b){if("function"!=typeof b&&null!==b)throw new TypeError("Super expression must either be null or a function, not "+typeof b);a.prototype=Object.create(b&&b.prototype,{constructor:{value:a,enumerable:!1,writable:!0,configurable:!0}}),b&&(Object.setPrototypeOf?Object.setPrototypeOf(a,b):a.__proto__=b)}c.__esModule=!0;var h=a("../../slider/slider.js"),i=e(h),j=a("../../component.js"),k=e(j),l=a("../../utils/fn.js"),m=d(l),n=a("./volume-level.js"),o=(e(n),function(a){function b(c,d){f(this,b),a.call(this,c,d),this.on(c,"volumechange",this.updateARIAAttributes),c.ready(m.bind(this,this.updateARIAAttributes))}return g(b,a),b.prototype.createEl=function(){return a.prototype.createEl.call(this,"div",{className:"vjs-volume-bar vjs-slider-bar"},{"aria-label":"volume level"})},b.prototype.handleMouseMove=function(a){this.checkMuted(),this.player_.volume(this.calculateDistance(a))},b.prototype.checkMuted=function(){this.player_.muted()&&this.player_.muted(!1)},b.prototype.getPercent=function(){return this.player_.muted()?0:this.player_.volume()},b.prototype.stepForward=function(){this.checkMuted(),this.player_.volume(this.player_.volume()+.1)},b.prototype.stepBack=function(){this.checkMuted(),this.player_.volume(this.player_.volume()-.1)},b.prototype.updateARIAAttributes=function(){var a=(100*this.player_.volume()).toFixed(2);this.el_.setAttribute("aria-valuenow",a),this.el_.setAttribute("aria-valuetext",a+"%")},b}(i["default"]));o.prototype.options_={children:["volumeLevel"],barName:"volumeLevel"},o.prototype.playerEvent="volumechange",k["default"].registerComponent("VolumeBar",o),c["default"]=o,b.exports=c["default"]},{"../../component.js":67,"../../slider/slider.js":119,"../../utils/fn.js":145,"./volume-level.js":101}],100:[function(a,b,c){"use strict";function d(a){return a&&a.__esModule?a:{"default":a}}function e(a,b){if(!(a instanceof b))throw new TypeError("Cannot call a class as a function")}function f(a,b){if("function"!=typeof b&&null!==b)throw new TypeError("Super expression must either be null or a function, not "+typeof b);a.prototype=Object.create(b&&b.prototype,{constructor:{value:a,enumerable:!1,writable:!0,configurable:!0}}),b&&(Object.setPrototypeOf?Object.setPrototypeOf(a,b):a.__proto__=b)}c.__esModule=!0;var g=a("../../component.js"),h=d(g),i=a("./volume-bar.js"),j=(d(i),function(a){function b(c,d){e(this,b),a.call(this,c,d),c.tech_&&c.tech_.featuresVolumeControl===!1&&this.addClass("vjs-hidden"),this.on(c,"loadstart",function(){c.tech_.featuresVolumeControl===!1?this.addClass("vjs-hidden"):this.removeClass("vjs-hidden")})}return f(b,a),b.prototype.createEl=function(){return a.prototype.createEl.call(this,"div",{className:"vjs-volume-control vjs-control"})},b}(h["default"]));j.prototype.options_={children:["volumeBar"]},h["default"].registerComponent("VolumeControl",j),c["default"]=j,b.exports=c["default"]},{"../../component.js":67,"./volume-bar.js":99}],101:[function(a,b,c){"use strict";function d(a){return a&&a.__esModule?a:{"default":a}}function e(a,b){if(!(a instanceof b))throw new TypeError("Cannot call a class as a function")}function f(a,b){if("function"!=typeof b&&null!==b)throw new TypeError("Super expression must either be null or a function, not "+typeof b);a.prototype=Object.create(b&&b.prototype,{constructor:{value:a,enumerable:!1,writable:!0,configurable:!0}}),b&&(Object.setPrototypeOf?Object.setPrototypeOf(a,b):a.__proto__=b)}c.__esModule=!0;var g=a("../../component.js"),h=d(g),i=function(a){function b(){e(this,b),a.apply(this,arguments)}return f(b,a),b.prototype.createEl=function(){return a.prototype.createEl.call(this,"div",{className:"vjs-volume-level",innerHTML:'<span class="vjs-control-text"></span>'})},b}(h["default"]);h["default"].registerComponent("VolumeLevel",i),c["default"]=i,b.exports=c["default"]},{"../../component.js":67}],102:[function(a,b,c){"use strict";function d(a){return a&&a.__esModule?a:{"default":a}}function e(a){if(a&&a.__esModule)return a;var b={};if(null!=a)for(var c in a)Object.prototype.hasOwnProperty.call(a,c)&&(b[c]=a[c]);return b["default"]=a,b}function f(a,b){if(!(a instanceof b))throw new TypeError("Cannot call a class as a function")}function g(a,b){if("function"!=typeof b&&null!==b)throw new TypeError("Super expression must either be null or a function, not "+typeof b);a.prototype=Object.create(b&&b.prototype,{constructor:{value:a,enumerable:!1,writable:!0,configurable:!0}}),b&&(Object.setPrototypeOf?Object.setPrototypeOf(a,b):a.__proto__=b)}c.__esModule=!0;var h=a("../utils/fn.js"),i=e(h),j=a("../component.js"),k=d(j),l=a("../popup/popup.js"),m=d(l),n=a("../popup/popup-button.js"),o=d(n),p=a("./mute-toggle.js"),q=d(p),r=a("./volume-control/volume-bar.js"),s=d(r),t=function(a){function b(c){function d(){c.tech_&&c.tech_.featuresVolumeControl===!1?this.addClass("vjs-hidden"):this.removeClass("vjs-hidden")}var e=arguments.length<=1||void 0===arguments[1]?{}:arguments[1];f(this,b),void 0===e.inline&&(e.inline=!0),void 0===e.vertical&&(e.vertical=e.inline?!1:!0),e.volumeBar=e.volumeBar||{},e.volumeBar.vertical=!!e.vertical,a.call(this,c,e),this.on(c,"volumechange",this.volumeUpdate),this.on(c,"loadstart",this.volumeUpdate),d.call(this),this.on(c,"loadstart",d),this.on(this.volumeBar,["slideractive","focus"],function(){this.addClass("vjs-slider-active")}),this.on(this.volumeBar,["sliderinactive","blur"],function(){this.removeClass("vjs-slider-active")}),this.on(this.volumeBar,["focus"],function(){this.addClass("vjs-lock-showing")}),this.on(this.volumeBar,["blur"],function(){this.removeClass("vjs-lock-showing")})}return g(b,a),b.prototype.buildCSSClass=function(){var b="";return b=this.options_.vertical?"vjs-volume-menu-button-vertical":"vjs-volume-menu-button-horizontal","vjs-volume-menu-button "+a.prototype.buildCSSClass.call(this)+" "+b},b.prototype.createPopup=function(){var a=new m["default"](this.player_,{contentElType:"div"}),b=new s["default"](this.player_,this.options_.volumeBar);return a.addChild(b),this.menuContent=a,this.volumeBar=b,this.attachVolumeBarEvents(),a},b.prototype.handleClick=function(){q["default"].prototype.handleClick.call(this),a.prototype.handleClick.call(this)},b.prototype.attachVolumeBarEvents=function(){this.menuContent.on(["mousedown","touchdown"],i.bind(this,this.handleMouseDown))},b.prototype.handleMouseDown=function(){this.on(["mousemove","touchmove"],i.bind(this.volumeBar,this.volumeBar.handleMouseMove)),this.on(this.el_.ownerDocument,["mouseup","touchend"],this.handleMouseUp)},b.prototype.handleMouseUp=function(){this.off(["mousemove","touchmove"],i.bind(this.volumeBar,this.volumeBar.handleMouseMove))},b}(o["default"]);t.prototype.volumeUpdate=q["default"].prototype.update,t.prototype.controlText_="Mute",k["default"].registerComponent("VolumeMenuButton",t),c["default"]=t,b.exports=c["default"]},{"../component.js":67,"../popup/popup-button.js":115,"../popup/popup.js":116,"../utils/fn.js":145,"./mute-toggle.js":73,"./volume-control/volume-bar.js":99}],103:[function(a,b,c){"use strict";function d(a){if(a&&a.__esModule)return a;var b={};if(null!=a)for(var c in a)Object.prototype.hasOwnProperty.call(a,c)&&(b[c]=a[c]);return b["default"]=a,b}function e(a){return a&&a.__esModule?a:{"default":a}}function f(a,b){if(!(a instanceof b))throw new TypeError("Cannot call a class as a function")}function g(a,b){if("function"!=typeof b&&null!==b)throw new TypeError("Super expression must either be null or a function, not "+typeof b);a.prototype=Object.create(b&&b.prototype,{constructor:{value:a,enumerable:!1,writable:!0,configurable:!0}}),b&&(Object.setPrototypeOf?Object.setPrototypeOf(a,b):a.__proto__=b)}c.__esModule=!0;var h=a("./component"),i=e(h),j=a("./modal-dialog"),k=e(j),l=a("./utils/dom"),m=(d(l),a("./utils/merge-options")),n=e(m),o=function(a){function b(c,d){f(this,b),a.call(this,c,d),this.on(c,"error",this.open)}return g(b,a),b.prototype.buildCSSClass=function(){return"vjs-error-display "+a.prototype.buildCSSClass.call(this)},b.prototype.content=function(){var a=this.player().error();return a?this.localize(a.message):""},b}(k["default"]);o.prototype.options_=n["default"](k["default"].prototype.options_,{fillAlways:!0,temporary:!1,uncloseable:!0}),i["default"].registerComponent("ErrorDisplay",o),c["default"]=o,b.exports=c["default"]},{"./component":67,"./modal-dialog":112,"./utils/dom":143,"./utils/merge-options":149}],104:[function(a,b,c){"use strict";function d(a){if(a&&a.__esModule)return a;var b={};if(null!=a)for(var c in a)Object.prototype.hasOwnProperty.call(a,c)&&(b[c]=a[c]);return b["default"]=a,b}c.__esModule=!0;var e=a("./utils/events.js"),f=d(e),g=function(){};g.prototype.allowedEvents_={},g.prototype.on=function(a,b){var c=this.addEventListener;this.addEventListener=function(){},f.on(this,a,b),this.addEventListener=c},g.prototype.addEventListener=g.prototype.on,g.prototype.off=function(a,b){f.off(this,a,b)},g.prototype.removeEventListener=g.prototype.off,g.prototype.one=function(a,b){var c=this.addEventListener;this.addEventListener=function(){},f.one(this,a,b),this.addEventListener=c},g.prototype.trigger=function(a){var b=a.type||a;"string"==typeof a&&(a={type:b}),a=f.fixEvent(a),this.allowedEvents_[b]&&this["on"+b]&&this["on"+b](a),f.trigger(this,a)},g.prototype.dispatchEvent=g.prototype.trigger,c["default"]=g,b.exports=c["default"]},{"./utils/events.js":144}],105:[function(a,b,c){"use strict";function d(a){return a&&a.__esModule?a:{"default":a}}c.__esModule=!0;var e=a("./utils/log"),f=d(e),g=function(a,b){if("function"!=typeof b&&null!==b)throw new TypeError("Super expression must either be null or a function, not "+typeof b);a.prototype=Object.create(b&&b.prototype,{constructor:{value:a,enumerable:!1,writable:!0,configurable:!0}}),b&&(a.super_=b)},h=function(a){var b=arguments.length<=1||void 0===arguments[1]?{}:arguments[1],c=function(){a.apply(this,arguments)},d={};"object"==typeof b?("function"==typeof b.init&&(f["default"].warn("Constructor logic via init() is deprecated; please use constructor() instead."),b.constructor=b.init),b.constructor!==Object.prototype.constructor&&(c=b.constructor),d=b):"function"==typeof b&&(c=b),g(c,a);for(var e in d)d.hasOwnProperty(e)&&(c.prototype[e]=d[e]);return c};c["default"]=h,b.exports=c["default"]},{"./utils/log":148}],106:[function(a,b,c){"use strict";function d(a){return a&&a.__esModule?a:{"default":a}}c.__esModule=!0;for(var e=a("global/document"),f=d(e),g={},h=[["requestFullscreen","exitFullscreen","fullscreenElement","fullscreenEnabled","fullscreenchange","fullscreenerror"],["webkitRequestFullscreen","webkitExitFullscreen","webkitFullscreenElement","webkitFullscreenEnabled","webkitfullscreenchange","webkitfullscreenerror"],["webkitRequestFullScreen","webkitCancelFullScreen","webkitCurrentFullScreenElement","webkitCancelFullScreen","webkitfullscreenchange","webkitfullscreenerror"],["mozRequestFullScreen","mozCancelFullScreen","mozFullScreenElement","mozFullScreenEnabled","mozfullscreenchange","mozfullscreenerror"],["msRequestFullscreen","msExitFullscreen","msFullscreenElement","msFullscreenEnabled","MSFullscreenChange","MSFullscreenError"]],i=h[0],j=void 0,k=0;k<h.length;k++)if(h[k][1]in f["default"]){j=h[k];break}if(j)for(var k=0;k<j.length;k++)g[i[k]]=j[k];c["default"]=g,b.exports=c["default"]},{"global/document":1}],107:[function(a,b,c){"use strict";function d(a){return a&&a.__esModule?a:{"default":a}}function e(a,b){if(!(a instanceof b))throw new TypeError("Cannot call a class as a function")}function f(a,b){if("function"!=typeof b&&null!==b)throw new TypeError("Super expression must either be null or a function, not "+typeof b);a.prototype=Object.create(b&&b.prototype,{constructor:{value:a,enumerable:!1,writable:!0,configurable:!0}}),b&&(Object.setPrototypeOf?Object.setPrototypeOf(a,b):a.__proto__=b)}c.__esModule=!0;var g=a("./component"),h=d(g),i=function(a){function b(){e(this,b),a.apply(this,arguments)}return f(b,a),b.prototype.createEl=function(){return a.prototype.createEl.call(this,"div",{className:"vjs-loading-spinner",dir:"ltr"})},b}(h["default"]);h["default"].registerComponent("LoadingSpinner",i),c["default"]=i,b.exports=c["default"]},{"./component":67}],108:[function(a,b,c){"use strict";function d(a){return a&&a.__esModule?a:{"default":a}}c.__esModule=!0;var e=a("object.assign"),f=d(e),g=function i(a){"number"==typeof a?this.code=a:"string"==typeof a?this.message=a:"object"==typeof a&&f["default"](this,a),this.message||(this.message=i.defaultMessages[this.code]||"")};g.prototype.code=0,g.prototype.message="",g.prototype.status=null,g.errorTypes=["MEDIA_ERR_CUSTOM","MEDIA_ERR_ABORTED","MEDIA_ERR_NETWORK","MEDIA_ERR_DECODE","MEDIA_ERR_SRC_NOT_SUPPORTED","MEDIA_ERR_ENCRYPTED"],g.defaultMessages={1:"You aborted the media playback",2:"A network error caused the media download to fail part-way.",3:"The media playback was aborted due to a corruption problem or because the media used features your browser did not support.",4:"The media could not be loaded, either because the server or network failed or because the format is not supported.",5:"The media is encrypted and we do not have the keys to decrypt it."};for(var h=0;h<g.errorTypes.length;h++)g[g.errorTypes[h]]=h,g.prototype[g.errorTypes[h]]=h;c["default"]=g,b.exports=c["default"]},{"object.assign":45}],109:[function(a,b,c){"use strict";function d(a){if(a&&a.__esModule)return a;var b={};if(null!=a)for(var c in a)Object.prototype.hasOwnProperty.call(a,c)&&(b[c]=a[c]);return b["default"]=a,b}function e(a){return a&&a.__esModule?a:{"default":a}}function f(a,b){if(!(a instanceof b))throw new TypeError("Cannot call a class as a function")}function g(a,b){if("function"!=typeof b&&null!==b)throw new TypeError("Super expression must either be null or a function, not "+typeof b);a.prototype=Object.create(b&&b.prototype,{constructor:{value:a,enumerable:!1,writable:!0,configurable:!0}}),b&&(Object.setPrototypeOf?Object.setPrototypeOf(a,b):a.__proto__=b)}c.__esModule=!0;var h=a("../clickable-component.js"),i=e(h),j=a("../component.js"),k=e(j),l=a("./menu.js"),m=e(l),n=a("../utils/dom.js"),o=d(n),p=a("../utils/fn.js"),q=d(p),r=a("../utils/to-title-case.js"),s=e(r),t=function(a){function b(c){var d=arguments.length<=1||void 0===arguments[1]?{}:arguments[1];f(this,b),a.call(this,c,d),this.update(),this.enabled_=!0,this.el_.setAttribute("aria-haspopup","true"),this.el_.setAttribute("role","menuitem"),this.on("keydown",this.handleSubmenuKeyPress)}return g(b,a),b.prototype.update=function(){var a=this.createMenu();this.menu&&this.removeChild(this.menu),this.menu=a,this.addChild(a),this.buttonPressed_=!1,this.el_.setAttribute("aria-expanded","false"),this.items&&0===this.items.length?this.hide():this.items&&this.items.length>1&&this.show()},b.prototype.createMenu=function(){var a=new m["default"](this.player_);if(this.options_.title){var b=o.createEl("li",{className:"vjs-menu-title",innerHTML:s["default"](this.options_.title),tabIndex:-1});a.children_.unshift(b),o.insertElFirst(b,a.contentEl())}if(this.items=this.createItems(),this.items)for(var c=0;c<this.items.length;c++)a.addItem(this.items[c]);return a},b.prototype.createItems=function(){},b.prototype.createEl=function(){return a.prototype.createEl.call(this,"div",{className:this.buildCSSClass()})},b.prototype.buildCSSClass=function(){var b="vjs-menu-button";return b+=this.options_.inline===!0?"-inline":"-popup","vjs-menu-button "+b+" "+a.prototype.buildCSSClass.call(this)},b.prototype.handleClick=function(){this.one("mouseout",q.bind(this,function(){this.menu.unlockShowing(),this.el_.blur()})),this.buttonPressed_?this.unpressButton():this.pressButton()},b.prototype.handleKeyPress=function(b){27===b.which||9===b.which?(this.buttonPressed_&&this.unpressButton(),9!==b.which&&b.preventDefault()):38===b.which||40===b.which?this.buttonPressed_||(this.pressButton(),b.preventDefault()):a.prototype.handleKeyPress.call(this,b)},b.prototype.handleSubmenuKeyPress=function(a){(27===a.which||9===a.which)&&(this.buttonPressed_&&this.unpressButton(),9!==a.which&&a.preventDefault())},b.prototype.pressButton=function(){this.enabled_&&(this.buttonPressed_=!0,this.menu.lockShowing(),this.el_.setAttribute("aria-expanded","true"),this.menu.focus())},b.prototype.unpressButton=function(){this.enabled_&&(this.buttonPressed_=!1,this.menu.unlockShowing(),this.el_.setAttribute("aria-expanded","false"),this.el_.focus())},b.prototype.disable=function(){return this.buttonPressed_=!1,this.menu.unlockShowing(),this.el_.setAttribute("aria-expanded","false"),this.enabled_=!1,a.prototype.disable.call(this)},b.prototype.enable=function(){return this.enabled_=!0,a.prototype.enable.call(this)},b}(i["default"]);k["default"].registerComponent("MenuButton",t),c["default"]=t,b.exports=c["default"]},{"../clickable-component.js":65,"../component.js":67,"../utils/dom.js":143,"../utils/fn.js":145,"../utils/to-title-case.js":152,"./menu.js":111}],110:[function(a,b,c){"use strict";function d(a){return a&&a.__esModule?a:{"default":a}}function e(a,b){if(!(a instanceof b))throw new TypeError("Cannot call a class as a function")}function f(a,b){if("function"!=typeof b&&null!==b)throw new TypeError("Super expression must either be null or a function, not "+typeof b);a.prototype=Object.create(b&&b.prototype,{constructor:{value:a,enumerable:!1,writable:!0,configurable:!0}}),b&&(Object.setPrototypeOf?Object.setPrototypeOf(a,b):a.__proto__=b)}c.__esModule=!0;var g=a("../clickable-component.js"),h=d(g),i=a("../component.js"),j=d(i),k=a("object.assign"),l=d(k),m=function(a){function b(c,d){e(this,b),a.call(this,c,d),this.selectable=d.selectable,this.selected(d.selected),this.selectable?this.el_.setAttribute("role","menuitemcheckbox"):this.el_.setAttribute("role","menuitem")}return f(b,a),b.prototype.createEl=function(b,c,d){return a.prototype.createEl.call(this,"li",l["default"]({className:"vjs-menu-item",innerHTML:this.localize(this.options_.label),tabIndex:-1},c),d)},b.prototype.handleClick=function(){this.selected(!0)},b.prototype.selected=function(a){this.selectable&&(a?(this.addClass("vjs-selected"),this.el_.setAttribute("aria-checked","true"),this.controlText(", selected")):(this.removeClass("vjs-selected"),this.el_.setAttribute("aria-checked","false"),this.controlText(" ")))},b}(h["default"]);j["default"].registerComponent("MenuItem",m),c["default"]=m,b.exports=c["default"]},{"../clickable-component.js":65,"../component.js":67,"object.assign":45}],111:[function(a,b,c){"use strict";function d(a){if(a&&a.__esModule)return a;var b={};if(null!=a)for(var c in a)Object.prototype.hasOwnProperty.call(a,c)&&(b[c]=a[c]);return b["default"]=a,b}function e(a){return a&&a.__esModule?a:{"default":a}}function f(a,b){if(!(a instanceof b))throw new TypeError("Cannot call a class as a function")}function g(a,b){if("function"!=typeof b&&null!==b)throw new TypeError("Super expression must either be null or a function, not "+typeof b);a.prototype=Object.create(b&&b.prototype,{constructor:{value:a,enumerable:!1,writable:!0,configurable:!0}}),b&&(Object.setPrototypeOf?Object.setPrototypeOf(a,b):a.__proto__=b)}c.__esModule=!0;var h=a("../component.js"),i=e(h),j=a("../utils/dom.js"),k=d(j),l=a("../utils/fn.js"),m=d(l),n=a("../utils/events.js"),o=d(n),p=function(a){function b(c,d){f(this,b),a.call(this,c,d),this.focusedChild_=-1,this.on("keydown",this.handleKeyPress)}return g(b,a),b.prototype.addItem=function(a){this.addChild(a),a.on("click",m.bind(this,function(){this.unlockShowing()}))},b.prototype.createEl=function(){var b=this.options_.contentElType||"ul";this.contentEl_=k.createEl(b,{className:"vjs-menu-content"}),this.contentEl_.setAttribute("role","menu");var c=a.prototype.createEl.call(this,"div",{append:this.contentEl_,className:"vjs-menu"});return c.setAttribute("role","presentation"),c.appendChild(this.contentEl_),o.on(c,"click",function(a){a.preventDefault(),a.stopImmediatePropagation()}),c},b.prototype.handleKeyPress=function(a){37===a.which||40===a.which?(a.preventDefault(),this.stepForward()):(38===a.which||39===a.which)&&(a.preventDefault(),this.stepBack())},b.prototype.stepForward=function(){var a=0;void 0!==this.focusedChild_&&(a=this.focusedChild_+1),this.focus(a)},b.prototype.stepBack=function(){var a=0;void 0!==this.focusedChild_&&(a=this.focusedChild_-1),this.focus(a)},b.prototype.focus=function(){var a=arguments.length<=0||void 0===arguments[0]?0:arguments[0],b=this.children().slice(),c=b.length&&b[0].className&&/vjs-menu-title/.test(b[0].className);c&&b.shift(),b.length>0&&(0>a?a=0:a>=b.length&&(a=b.length-1),this.focusedChild_=a,b[a].el_.focus())},b}(i["default"]);i["default"].registerComponent("Menu",p),c["default"]=p,b.exports=c["default"]},{"../component.js":67,"../utils/dom.js":143,"../utils/events.js":144,"../utils/fn.js":145}],112:[function(a,b,c){"use strict";function d(a){return a&&a.__esModule?a:{"default":a}}function e(a){if(a&&a.__esModule)return a;var b={};if(null!=a)for(var c in a)Object.prototype.hasOwnProperty.call(a,c)&&(b[c]=a[c]);return b["default"]=a,b}function f(a,b){if(!(a instanceof b))throw new TypeError("Cannot call a class as a function")}function g(a,b){if("function"!=typeof b&&null!==b)throw new TypeError("Super expression must either be null or a function, not "+typeof b);a.prototype=Object.create(b&&b.prototype,{constructor:{value:a,enumerable:!1,writable:!0,configurable:!0}}),b&&(Object.setPrototypeOf?Object.setPrototypeOf(a,b):a.__proto__=b)}c.__esModule=!0;var h=a("./utils/dom"),i=e(h),j=a("./utils/fn"),k=e(j),l=a("./utils/log"),m=(d(l),a("./component")),n=d(m),o=a("./close-button"),p=(d(o),"vjs-modal-dialog"),q=27,r=function(a){function b(c,d){f(this,b),a.call(this,c,d),this.opened_=this.hasBeenOpened_=this.hasBeenFilled_=!1,this.closeable(!this.options_.uncloseable),this.content(this.options_.content),this.contentEl_=i.createEl("div",{className:p+"-content"},{role:"document"}),this.descEl_=i.createEl("p",{className:p+"-description vjs-offscreen",id:this.el().getAttribute("aria-describedby")}),i.textContent(this.descEl_,this.description()),this.el_.appendChild(this.descEl_),this.el_.appendChild(this.contentEl_)}return g(b,a),b.prototype.createEl=function(){return a.prototype.createEl.call(this,"div",{className:this.buildCSSClass(),tabIndex:-1},{"aria-describedby":this.id()+"_description","aria-hidden":"true","aria-label":this.label(),role:"dialog"})},b.prototype.buildCSSClass=function(){return p+" vjs-hidden "+a.prototype.buildCSSClass.call(this)},b.prototype.handleKeyPress=function(a){a.which===q&&this.closeable()&&this.close()},b.prototype.label=function(){return this.options_.label||this.localize("Modal Window")},b.prototype.description=function(){var a=this.options_.description||this.localize("This is a modal window.");return this.closeable()&&(a+=" "+this.localize("This modal can be closed by pressing the Escape key or activating the close button.")),a},b.prototype.open=function(){if(!this.opened_){var a=this.player();this.trigger("beforemodalopen"),this.opened_=!0,(this.options_.fillAlways||!this.hasBeenOpened_&&!this.hasBeenFilled_)&&this.fill(),this.wasPlaying_=!a.paused(),this.wasPlaying_&&a.pause(),this.closeable()&&this.on(this.el_.ownerDocument,"keydown",k.bind(this,this.handleKeyPress)),a.controls(!1),this.show(),this.el().setAttribute("aria-hidden","false"),this.trigger("modalopen"),this.hasBeenOpened_=!0}return this},b.prototype.opened=function(a){return"boolean"==typeof a&&this[a?"open":"close"](),this.opened_},b.prototype.close=function(){if(this.opened_){var a=this.player();this.trigger("beforemodalclose"),this.opened_=!1,this.wasPlaying_&&a.play(),this.closeable()&&this.off(this.el_.ownerDocument,"keydown",k.bind(this,this.handleKeyPress)),a.controls(!0),this.hide(),this.el().setAttribute("aria-hidden","true"),this.trigger("modalclose"),this.options_.temporary&&this.dispose()}return this},b.prototype.closeable=function c(a){if("boolean"==typeof a){var c=this.closeable_=!!a,b=this.getChild("closeButton");if(c&&!b){var d=this.contentEl_;this.contentEl_=this.el_,b=this.addChild("closeButton"),this.contentEl_=d,this.on(b,"close",this.close)}!c&&b&&(this.off(b,"close",this.close),this.removeChild(b),b.dispose())}return this.closeable_},b.prototype.fill=function(){return this.fillWith(this.content())},b.prototype.fillWith=function(a){var b=this.contentEl(),c=b.parentNode,d=b.nextSibling;return this.trigger("beforemodalfill"),this.hasBeenFilled_=!0,c.removeChild(b),this.empty(),i.insertContent(b,a),this.trigger("modalfill"),d?c.insertBefore(b,d):c.appendChild(b),this},b.prototype.empty=function(){return this.trigger("beforemodalempty"),i.emptyEl(this.contentEl()),this.trigger("modalempty"),this},b.prototype.content=function(a){return"undefined"!=typeof a&&(this.content_=a),this.content_},b}(n["default"]);r.prototype.options_={temporary:!0},n["default"].registerComponent("ModalDialog",r),c["default"]=r,b.exports=c["default"]},{"./close-button":66,"./component":67,"./utils/dom":143,"./utils/fn":145,"./utils/log":148}],113:[function(a,b,c){"use strict";function d(a){if(a&&a.__esModule)return a;var b={};if(null!=a)for(var c in a)Object.prototype.hasOwnProperty.call(a,c)&&(b[c]=a[c]);return b["default"]=a,b}function e(a){return a&&a.__esModule?a:{"default":a}}function f(a,b){if(!(a instanceof b))throw new TypeError("Cannot call a class as a function")}function g(a,b){if("function"!=typeof b&&null!==b)throw new TypeError("Super expression must either be null or a function, not "+typeof b);a.prototype=Object.create(b&&b.prototype,{constructor:{value:a,enumerable:!1,writable:!0,configurable:!0}}),b&&(Object.setPrototypeOf?Object.setPrototypeOf(a,b):a.__proto__=b)}c.__esModule=!0;var h=a("./component.js"),i=e(h),j=a("global/document"),k=e(j),l=a("global/window"),m=e(l),n=a("./utils/events.js"),o=d(n),p=a("./utils/dom.js"),q=d(p),r=a("./utils/fn.js"),s=d(r),t=a("./utils/guid.js"),u=d(t),v=a("./utils/browser.js"),w=d(v),x=a("./utils/log.js"),y=e(x),z=a("./utils/to-title-case.js"),A=e(z),B=a("./utils/time-ranges.js"),C=a("./utils/buffer.js"),D=a("./utils/stylesheet.js"),E=d(D),F=a("./fullscreen-api.js"),G=e(F),H=a("./media-error.js"),I=e(H),J=a("safe-json-parse/tuple"),K=e(J),L=a("object.assign"),M=e(L),N=a("./utils/merge-options.js"),O=e(N),P=a("./tracks/text-track-list-converter.js"),Q=e(P),R=a("./tracks/audio-track-list.js"),S=e(R),T=a("./tracks/video-track-list.js"),U=e(T),V=a("./tech/loader.js"),W=(e(V),a("./poster-image.js")),X=(e(W),a("./tracks/text-track-display.js")),Y=(e(X),a("./loading-spinner.js")),Z=(e(Y),a("./big-play-button.js")),$=(e(Z),a("./control-bar/control-bar.js")),_=(e($),a("./error-display.js")),aa=(e(_),a("./tracks/text-track-settings.js")),ba=(e(aa),a("./modal-dialog")),ca=e(ba),da=a("./tech/tech.js"),ea=e(da),fa=a("./tech/html5.js"),ga=(e(fa),function(a){function b(c,d,e){var g=this;if(f(this,b),c.id=c.id||"vjs_video_"+u.newGUID(),d=M["default"](b.getTagSettings(c),d),d.initChildren=!1,d.createEl=!1,d.reportTouchActivity=!1,a.call(this,null,d,e),!this.options_||!this.options_.techOrder||!this.options_.techOrder.length)throw new Error("No techOrder specified. Did you overwrite videojs.options instead of just changing the properties you want to override?");this.tag=c,this.tagAttributes=c&&q.getElAttributes(c),this.language(this.options_.language),d.languages?!function(){var a={};Object.getOwnPropertyNames(d.languages).forEach(function(b){a[b.toLowerCase()]=d.languages[b]}),g.languages_=a}():this.languages_=b.prototype.options_.languages,this.cache_={},this.poster_=d.poster||"",this.controls_=!!d.controls,c.controls=!1,this.scrubbing_=!1,this.el_=this.createEl();var h=O["default"](this.options_);d.plugins&&!function(){var a=d.plugins;Object.getOwnPropertyNames(a).forEach(function(b){"function"==typeof this[b]?this[b](a[b]):y["default"].error("Unable to find plugin:",b)},g)}(),this.options_.playerOptions=h,this.initChildren(),this.isAudio("audio"===c.nodeName.toLowerCase()),this.addClass(this.controls()?"vjs-controls-enabled":"vjs-controls-disabled"),this.el_.setAttribute("role","region"),this.isAudio()?this.el_.setAttribute("aria-label","audio player"):this.el_.setAttribute("aria-label","video player"),this.isAudio()&&this.addClass("vjs-audio"),this.flexNotSupported_()&&this.addClass("vjs-no-flex"),w.IS_IOS||this.addClass("vjs-workinghover"),b.players[this.id_]=this,this.userActive(!0),this.reportUserActivity(),this.listenForUserActivity_(),this.on("fullscreenchange",this.handleFullscreenChange_),this.on("stageclick",this.handleStageClick_)}return g(b,a),b.prototype.dispose=function(){this.trigger("dispose"),this.off("dispose"),this.styleEl_&&this.styleEl_.parentNode&&this.styleEl_.parentNode.removeChild(this.styleEl_),b.players[this.id_]=null,this.tag&&this.tag.player&&(this.tag.player=null),this.el_&&this.el_.player&&(this.el_.player=null),this.tech_&&this.tech_.dispose(),a.prototype.dispose.call(this)},b.prototype.createEl=function(){var b=this.el_=a.prototype.createEl.call(this,"div"),c=this.tag;c.removeAttribute("width"),c.removeAttribute("height");var d=q.getElAttributes(c);if(Object.getOwnPropertyNames(d).forEach(function(a){"class"===a?b.className=d[a]:b.setAttribute(a,d[a])}),c.playerId=c.id,c.id+="_html5_api",c.className="vjs-tech",c.player=b.player=this,this.addClass("vjs-paused"),m["default"].VIDEOJS_NO_DYNAMIC_STYLE!==!0){this.styleEl_=E.createStyleElement("vjs-styles-dimensions");var e=q.$(".vjs-styles-defaults"),f=q.$("head");f.insertBefore(this.styleEl_,e?e.nextSibling:f.firstChild)}this.width(this.options_.width),this.height(this.options_.height),this.fluid(this.options_.fluid),this.aspectRatio(this.options_.aspectRatio);for(var g=c.getElementsByTagName("a"),h=0;h<g.length;h++){var i=g.item(h);q.addElClass(i,"vjs-hidden"),i.setAttribute("hidden","hidden")}return c.initNetworkState_=c.networkState,c.parentNode&&c.parentNode.insertBefore(b,c),q.insertElFirst(c,b),this.children_.unshift(c),this.el_=b,b},b.prototype.width=function(a){return this.dimension("width",a)},b.prototype.height=function(a){return this.dimension("height",a)},b.prototype.dimension=function(a,b){var c=a+"_";if(void 0===b)return this[c]||0;if(""===b)this[c]=void 0;else{var d=parseFloat(b);if(isNaN(d))return y["default"].error('Improper value "'+b+'" supplied for for '+a),this;this[c]=d}return this.updateStyleEl_(),this},b.prototype.fluid=function(a){return void 0===a?!!this.fluid_:(this.fluid_=!!a,void(a?this.addClass("vjs-fluid"):this.removeClass("vjs-fluid")))},b.prototype.aspectRatio=function(a){if(void 0===a)return this.aspectRatio_;if(!/^\d+\:\d+$/.test(a))throw new Error("Improper value supplied for aspect ratio. The format should be width:height, for example 16:9.");this.aspectRatio_=a,this.fluid(!0),this.updateStyleEl_()},b.prototype.updateStyleEl_=function(){if(m["default"].VIDEOJS_NO_DYNAMIC_STYLE===!0){var a="number"==typeof this.width_?this.width_:this.options_.width,b="number"==typeof this.height_?this.height_:this.options_.height,c=this.tech_&&this.tech_.el();return void(c&&(a>=0&&(c.width=a),b>=0&&(c.height=b)))}var d=void 0,e=void 0,f=void 0,g=void 0;f=void 0!==this.aspectRatio_&&"auto"!==this.aspectRatio_?this.aspectRatio_:this.videoWidth()?this.videoWidth()+":"+this.videoHeight():"16:9";var h=f.split(":"),i=h[1]/h[0];d=void 0!==this.width_?this.width_:void 0!==this.height_?this.height_/i:this.videoWidth()||300,e=void 0!==this.height_?this.height_:d*i,g=/^[^a-zA-Z]/.test(this.id())?"dimensions-"+this.id():this.id()+"-dimensions",this.addClass(g),E.setTextContent(this.styleEl_,"\n      ."+g+" {\n        width: "+d+"px;\n        height: "+e+"px;\n      }\n\n      ."+g+".vjs-fluid {\n        padding-top: "+100*i+"%;\n      }\n    ")},b.prototype.loadTech_=function(a,b){this.tech_&&this.unloadTech_(),"Html5"!==a&&this.tag&&(ea["default"].getTech("Html5").disposeMediaElement(this.tag),
this.tag.player=null,this.tag=null),this.techName_=a,this.isReady_=!1;var c=M["default"]({nativeControlsForTouch:this.options_.nativeControlsForTouch,source:b,playerId:this.id(),techId:this.id()+"_"+a+"_api",videoTracks:this.videoTracks_,textTracks:this.textTracks_,audioTracks:this.audioTracks_,autoplay:this.options_.autoplay,preload:this.options_.preload,loop:this.options_.loop,muted:this.options_.muted,poster:this.poster(),language:this.language(),"vtt.js":this.options_["vtt.js"]},this.options_[a.toLowerCase()]);this.tag&&(c.tag=this.tag),b&&(this.currentType_=b.type,b.src===this.cache_.src&&this.cache_.currentTime>0&&(c.startTime=this.cache_.currentTime),this.cache_.src=b.src);var d=ea["default"].getTech(a);d||(d=i["default"].getComponent(a)),this.tech_=new d(c),this.tech_.ready(s.bind(this,this.handleTechReady_),!0),Q["default"].jsonToTextTracks(this.textTracksJson_||[],this.tech_),this.on(this.tech_,"loadstart",this.handleTechLoadStart_),this.on(this.tech_,"waiting",this.handleTechWaiting_),this.on(this.tech_,"canplay",this.handleTechCanPlay_),this.on(this.tech_,"canplaythrough",this.handleTechCanPlayThrough_),this.on(this.tech_,"playing",this.handleTechPlaying_),this.on(this.tech_,"ended",this.handleTechEnded_),this.on(this.tech_,"seeking",this.handleTechSeeking_),this.on(this.tech_,"seeked",this.handleTechSeeked_),this.on(this.tech_,"play",this.handleTechPlay_),this.on(this.tech_,"firstplay",this.handleTechFirstPlay_),this.on(this.tech_,"pause",this.handleTechPause_),this.on(this.tech_,"progress",this.handleTechProgress_),this.on(this.tech_,"durationchange",this.handleTechDurationChange_),this.on(this.tech_,"fullscreenchange",this.handleTechFullscreenChange_),this.on(this.tech_,"error",this.handleTechError_),this.on(this.tech_,"suspend",this.handleTechSuspend_),this.on(this.tech_,"abort",this.handleTechAbort_),this.on(this.tech_,"emptied",this.handleTechEmptied_),this.on(this.tech_,"stalled",this.handleTechStalled_),this.on(this.tech_,"loadedmetadata",this.handleTechLoadedMetaData_),this.on(this.tech_,"loadeddata",this.handleTechLoadedData_),this.on(this.tech_,"timeupdate",this.handleTechTimeUpdate_),this.on(this.tech_,"ratechange",this.handleTechRateChange_),this.on(this.tech_,"volumechange",this.handleTechVolumeChange_),this.on(this.tech_,"texttrackchange",this.handleTechTextTrackChange_),this.on(this.tech_,"loadedmetadata",this.updateStyleEl_),this.on(this.tech_,"posterchange",this.handleTechPosterChange_),this.usingNativeControls(this.techGet_("controls")),this.controls()&&!this.usingNativeControls()&&this.addTechControlsListeners_(),this.tech_.el().parentNode===this.el()||"Html5"===a&&this.tag||q.insertElFirst(this.tech_.el(),this.el()),this.tag&&(this.tag.player=null,this.tag=null)},b.prototype.unloadTech_=function(){this.videoTracks_=this.videoTracks(),this.textTracks_=this.textTracks(),this.audioTracks_=this.audioTracks(),this.textTracksJson_=Q["default"].textTracksToJson(this.tech_),this.isReady_=!1,this.tech_.dispose(),this.tech_=!1},b.prototype.tech=function(a){if(a&&a.IWillNotUseThisInPlugins)return this.tech_;var b="\n      Please make sure that you are not using this inside of a plugin.\n      To disable this alert and error, please pass in an object with\n      `IWillNotUseThisInPlugins` to the `tech` method. See\n      https://github.com/videojs/video.js/issues/2617 for more info.\n    ";throw m["default"].alert(b),new Error(b)},b.prototype.addTechControlsListeners_=function(){this.removeTechControlsListeners_(),this.on(this.tech_,"mousedown",this.handleTechClick_),this.on(this.tech_,"touchstart",this.handleTechTouchStart_),this.on(this.tech_,"touchmove",this.handleTechTouchMove_),this.on(this.tech_,"touchend",this.handleTechTouchEnd_),this.on(this.tech_,"tap",this.handleTechTap_)},b.prototype.removeTechControlsListeners_=function(){this.off(this.tech_,"tap",this.handleTechTap_),this.off(this.tech_,"touchstart",this.handleTechTouchStart_),this.off(this.tech_,"touchmove",this.handleTechTouchMove_),this.off(this.tech_,"touchend",this.handleTechTouchEnd_),this.off(this.tech_,"mousedown",this.handleTechClick_)},b.prototype.handleTechReady_=function(){this.triggerReady(),this.cache_.volume&&this.techCall_("setVolume",this.cache_.volume),this.handleTechPosterChange_(),this.handleTechDurationChange_(),this.src()&&this.tag&&this.options_.autoplay&&this.paused()&&(delete this.tag.poster,this.play())},b.prototype.handleTechLoadStart_=function(){this.removeClass("vjs-ended"),this.error(null),this.paused()?(this.hasStarted(!1),this.trigger("loadstart")):(this.trigger("loadstart"),this.trigger("firstplay"))},b.prototype.hasStarted=function(a){return void 0!==a?(this.hasStarted_!==a&&(this.hasStarted_=a,a?(this.addClass("vjs-has-started"),this.trigger("firstplay")):this.removeClass("vjs-has-started")),this):!!this.hasStarted_},b.prototype.handleTechPlay_=function(){this.removeClass("vjs-ended"),this.removeClass("vjs-paused"),this.addClass("vjs-playing"),this.hasStarted(!0),this.trigger("play")},b.prototype.handleTechWaiting_=function(){var a=this;this.addClass("vjs-waiting"),this.trigger("waiting"),this.one("timeupdate",function(){return a.removeClass("vjs-waiting")})},b.prototype.handleTechCanPlay_=function(){this.removeClass("vjs-waiting"),this.trigger("canplay")},b.prototype.handleTechCanPlayThrough_=function(){this.removeClass("vjs-waiting"),this.trigger("canplaythrough")},b.prototype.handleTechPlaying_=function(){this.removeClass("vjs-waiting"),this.trigger("playing")},b.prototype.handleTechSeeking_=function(){this.addClass("vjs-seeking"),this.trigger("seeking")},b.prototype.handleTechSeeked_=function(){this.removeClass("vjs-seeking"),this.trigger("seeked")},b.prototype.handleTechFirstPlay_=function(){this.options_.starttime&&this.currentTime(this.options_.starttime),this.addClass("vjs-has-started"),this.trigger("firstplay")},b.prototype.handleTechPause_=function(){this.removeClass("vjs-playing"),this.addClass("vjs-paused"),this.trigger("pause")},b.prototype.handleTechProgress_=function(){this.trigger("progress")},b.prototype.handleTechEnded_=function(){this.addClass("vjs-ended"),this.options_.loop?(this.currentTime(0),this.play()):this.paused()||this.pause(),this.trigger("ended")},b.prototype.handleTechDurationChange_=function(){this.duration(this.techGet_("duration"))},b.prototype.handleTechClick_=function(a){0===a.button&&this.controls()&&(this.paused()?this.play():this.pause())},b.prototype.handleTechTap_=function(){this.userActive(!this.userActive())},b.prototype.handleTechTouchStart_=function(){this.userWasActive=this.userActive()},b.prototype.handleTechTouchMove_=function(){this.userWasActive&&this.reportUserActivity()},b.prototype.handleTechTouchEnd_=function(a){a.preventDefault()},b.prototype.handleFullscreenChange_=function(){this.isFullscreen()?this.addClass("vjs-fullscreen"):this.removeClass("vjs-fullscreen")},b.prototype.handleStageClick_=function(){this.reportUserActivity()},b.prototype.handleTechFullscreenChange_=function(a,b){b&&this.isFullscreen(b.isFullscreen),this.trigger("fullscreenchange")},b.prototype.handleTechError_=function(){var a=this.tech_.error();this.error(a&&a.code)},b.prototype.handleTechSuspend_=function(){this.trigger("suspend")},b.prototype.handleTechAbort_=function(){this.trigger("abort")},b.prototype.handleTechEmptied_=function(){this.trigger("emptied")},b.prototype.handleTechStalled_=function(){this.trigger("stalled")},b.prototype.handleTechLoadedMetaData_=function(){this.trigger("loadedmetadata")},b.prototype.handleTechLoadedData_=function(){this.trigger("loadeddata")},b.prototype.handleTechTimeUpdate_=function(){this.trigger("timeupdate")},b.prototype.handleTechRateChange_=function(){this.trigger("ratechange")},b.prototype.handleTechVolumeChange_=function(){this.trigger("volumechange")},b.prototype.handleTechTextTrackChange_=function(){this.trigger("texttrackchange")},b.prototype.getCache=function(){return this.cache_},b.prototype.techCall_=function(a,b){if(this.tech_&&!this.tech_.isReady_)this.tech_.ready(function(){this[a](b)},!0);else try{this.tech_[a](b)}catch(c){throw y["default"](c),c}},b.prototype.techGet_=function(a){if(this.tech_&&this.tech_.isReady_)try{return this.tech_[a]()}catch(b){throw void 0===this.tech_[a]?y["default"]("Video.js: "+a+" method not defined for "+this.techName_+" playback technology.",b):"TypeError"===b.name?(y["default"]("Video.js: "+a+" unavailable on "+this.techName_+" playback technology element.",b),this.tech_.isReady_=!1):y["default"](b),b}},b.prototype.play=function(){return this.techCall_("play"),this},b.prototype.pause=function(){return this.techCall_("pause"),this},b.prototype.paused=function(){return this.techGet_("paused")===!1?!1:!0},b.prototype.scrubbing=function(a){return void 0!==a?(this.scrubbing_=!!a,a?this.addClass("vjs-scrubbing"):this.removeClass("vjs-scrubbing"),this):this.scrubbing_},b.prototype.currentTime=function(a){return void 0!==a?(this.techCall_("setCurrentTime",a),this):this.cache_.currentTime=this.techGet_("currentTime")||0},b.prototype.duration=function(a){return void 0===a?this.cache_.duration||0:(a=parseFloat(a)||0,0>a&&(a=1/0),a!==this.cache_.duration&&(this.cache_.duration=a,a===1/0?this.addClass("vjs-live"):this.removeClass("vjs-live"),this.trigger("durationchange")),this)},b.prototype.remainingTime=function(){return this.duration()-this.currentTime()},b.prototype.buffered=function c(){var c=this.techGet_("buffered");return c&&c.length||(c=B.createTimeRange(0,0)),c},b.prototype.bufferedPercent=function(){return C.bufferedPercent(this.buffered(),this.duration())},b.prototype.bufferedEnd=function(){var a=this.buffered(),b=this.duration(),c=a.end(a.length-1);return c>b&&(c=b),c},b.prototype.volume=function(a){var b=void 0;return void 0!==a?(b=Math.max(0,Math.min(1,parseFloat(a))),this.cache_.volume=b,this.techCall_("setVolume",b),this):(b=parseFloat(this.techGet_("volume")),isNaN(b)?1:b)},b.prototype.muted=function(a){return void 0!==a?(this.techCall_("setMuted",a),this):this.techGet_("muted")||!1},b.prototype.supportsFullScreen=function(){return this.techGet_("supportsFullScreen")||!1},b.prototype.isFullscreen=function(a){return void 0!==a?(this.isFullscreen_=!!a,this):!!this.isFullscreen_},b.prototype.requestFullscreen=function(){var a=G["default"];return this.isFullscreen(!0),a.requestFullscreen?(o.on(k["default"],a.fullscreenchange,s.bind(this,function b(){this.isFullscreen(k["default"][a.fullscreenElement]),this.isFullscreen()===!1&&o.off(k["default"],a.fullscreenchange,b),this.trigger("fullscreenchange")})),this.el_[a.requestFullscreen]()):this.tech_.supportsFullScreen()?this.techCall_("enterFullScreen"):(this.enterFullWindow(),this.trigger("fullscreenchange")),this},b.prototype.exitFullscreen=function(){var a=G["default"];return this.isFullscreen(!1),a.requestFullscreen?k["default"][a.exitFullscreen]():this.tech_.supportsFullScreen()?this.techCall_("exitFullScreen"):(this.exitFullWindow(),this.trigger("fullscreenchange")),this},b.prototype.enterFullWindow=function(){this.isFullWindow=!0,this.docOrigOverflow=k["default"].documentElement.style.overflow,o.on(k["default"],"keydown",s.bind(this,this.fullWindowOnEscKey)),k["default"].documentElement.style.overflow="hidden",q.addElClass(k["default"].body,"vjs-full-window"),this.trigger("enterFullWindow")},b.prototype.fullWindowOnEscKey=function(a){27===a.keyCode&&(this.isFullscreen()===!0?this.exitFullscreen():this.exitFullWindow())},b.prototype.exitFullWindow=function(){this.isFullWindow=!1,o.off(k["default"],"keydown",this.fullWindowOnEscKey),k["default"].documentElement.style.overflow=this.docOrigOverflow,q.removeElClass(k["default"].body,"vjs-full-window"),this.trigger("exitFullWindow")},b.prototype.canPlayType=function(a){for(var b=void 0,c=0,d=this.options_.techOrder;c<d.length;c++){var e=A["default"](d[c]),f=ea["default"].getTech(e);if(f||(f=i["default"].getComponent(e)),f){if(f.isSupported()&&(b=f.canPlayType(a)))return b}else y["default"].error('The "'+e+'" tech is undefined. Skipped browser support check for that tech.')}return""},b.prototype.selectSource=function(a){var b=this.options_.techOrder.map(A["default"]).map(function(a){return[a,ea["default"].getTech(a)||i["default"].getComponent(a)]}).filter(function(a){var b=a[0],c=a[1];return c?c.isSupported():(y["default"].error('The "'+b+'" tech is undefined. Skipped browser support check for that tech.'),!1)}),c=function(a,b,c){var d=void 0;return a.some(function(a){return b.some(function(b){return d=c(a,b),d?!0:void 0})}),d},d=void 0,e=function(a){return function(b,c){return a(c,b)}},f=function(a,b){var c=a[0],d=a[1];return d.canPlaySource(b)?{source:b,tech:c}:void 0};return d=this.options_.sourceOrder?c(a,b,e(f)):c(b,a,f),d||!1},b.prototype.src=function(a){if(void 0===a)return this.techGet_("src");var b=ea["default"].getTech(this.techName_);return b||(b=i["default"].getComponent(this.techName_)),Array.isArray(a)?this.sourceList_(a):"string"==typeof a?this.src({src:a}):a instanceof Object&&(a.type&&!b.canPlaySource(a)?this.sourceList_([a]):(this.cache_.src=a.src,this.currentType_=a.type||"",this.ready(function(){b.prototype.hasOwnProperty("setSource")?this.techCall_("setSource",a):this.techCall_("src",a.src),"auto"===this.options_.preload&&this.load(),this.options_.autoplay&&this.play()},!0))),this},b.prototype.sourceList_=function(a){var b=this.selectSource(a);b?b.tech===this.techName_?this.src(b.source):this.loadTech_(b.tech,b.source):(this.setTimeout(function(){this.error({code:4,message:this.localize(this.options_.notSupportedMessage)})},0),this.triggerReady())},b.prototype.load=function(){return this.techCall_("load"),this},b.prototype.reset=function(){return this.loadTech_(A["default"](this.options_.techOrder[0]),null),this.techCall_("reset"),this},b.prototype.currentSrc=function(){return this.techGet_("currentSrc")||this.cache_.src||""},b.prototype.currentType=function(){return this.currentType_||""},b.prototype.preload=function(a){return void 0!==a?(this.techCall_("setPreload",a),this.options_.preload=a,this):this.techGet_("preload")},b.prototype.autoplay=function(a){return void 0!==a?(this.techCall_("setAutoplay",a),this.options_.autoplay=a,this):this.techGet_("autoplay",a)},b.prototype.loop=function(a){return void 0!==a?(this.techCall_("setLoop",a),this.options_.loop=a,this):this.techGet_("loop")},b.prototype.poster=function(a){return void 0===a?this.poster_:(a||(a=""),this.poster_=a,this.techCall_("setPoster",a),this.trigger("posterchange"),this)},b.prototype.handleTechPosterChange_=function(){!this.poster_&&this.tech_&&this.tech_.poster&&(this.poster_=this.tech_.poster()||"",this.trigger("posterchange"))},b.prototype.controls=function(a){return void 0!==a?(a=!!a,this.controls_!==a&&(this.controls_=a,this.usingNativeControls()&&this.techCall_("setControls",a),a?(this.removeClass("vjs-controls-disabled"),this.addClass("vjs-controls-enabled"),this.trigger("controlsenabled"),this.usingNativeControls()||this.addTechControlsListeners_()):(this.removeClass("vjs-controls-enabled"),this.addClass("vjs-controls-disabled"),this.trigger("controlsdisabled"),this.usingNativeControls()||this.removeTechControlsListeners_())),this):!!this.controls_},b.prototype.usingNativeControls=function(a){return void 0!==a?(a=!!a,this.usingNativeControls_!==a&&(this.usingNativeControls_=a,a?(this.addClass("vjs-using-native-controls"),this.trigger("usingnativecontrols")):(this.removeClass("vjs-using-native-controls"),this.trigger("usingcustomcontrols"))),this):!!this.usingNativeControls_},b.prototype.error=function(a){return void 0===a?this.error_||null:null===a?(this.error_=a,this.removeClass("vjs-error"),this.errorDisplay.close(),this):(this.error_=a instanceof I["default"]?a:new I["default"](a),this.addClass("vjs-error"),y["default"].error("(CODE:"+this.error_.code+" "+I["default"].errorTypes[this.error_.code]+")",this.error_.message,this.error_),this.trigger("error"),this)},b.prototype.ended=function(){return this.techGet_("ended")},b.prototype.seeking=function(){return this.techGet_("seeking")},b.prototype.seekable=function(){return this.techGet_("seekable")},b.prototype.reportUserActivity=function(){this.userActivity_=!0},b.prototype.userActive=function(a){return void 0!==a?(a=!!a,a!==this.userActive_&&(this.userActive_=a,a?(this.userActivity_=!0,this.removeClass("vjs-user-inactive"),this.addClass("vjs-user-active"),this.trigger("useractive")):(this.userActivity_=!1,this.tech_&&this.tech_.one("mousemove",function(a){a.stopPropagation(),a.preventDefault()}),this.removeClass("vjs-user-active"),this.addClass("vjs-user-inactive"),this.trigger("userinactive"))),this):this.userActive_},b.prototype.listenForUserActivity_=function(){var a=void 0,b=void 0,c=void 0,d=s.bind(this,this.reportUserActivity),e=function(a){(a.screenX!==b||a.screenY!==c)&&(b=a.screenX,c=a.screenY,d())},f=function(){d(),this.clearInterval(a),a=this.setInterval(d,250)},g=function(){d(),this.clearInterval(a)};this.on("mousedown",f),this.on("mousemove",e),this.on("mouseup",g),this.on("keydown",d),this.on("keyup",d);{var h=void 0;this.setInterval(function(){if(this.userActivity_){this.userActivity_=!1,this.userActive(!0),this.clearTimeout(h);var a=this.options_.inactivityTimeout;a>0&&(h=this.setTimeout(function(){this.userActivity_||this.userActive(!1)},a))}},250)}},b.prototype.playbackRate=function(a){return void 0!==a?(this.techCall_("setPlaybackRate",a),this):this.tech_&&this.tech_.featuresPlaybackRate?this.techGet_("playbackRate"):1},b.prototype.isAudio=function(a){return void 0!==a?(this.isAudio_=!!a,this):!!this.isAudio_},b.prototype.networkState=function(){return this.techGet_("networkState")},b.prototype.readyState=function(){return this.techGet_("readyState")},b.prototype.videoTracks=function(){return this.tech_?this.tech_.videoTracks():(this.videoTracks_=this.videoTracks_||new U["default"],this.videoTracks_)},b.prototype.audioTracks=function(){return this.tech_?this.tech_.audioTracks():(this.audioTracks_=this.audioTracks_||new S["default"],this.audioTracks_)},b.prototype.textTracks=function(){return this.tech_&&this.tech_.textTracks()},b.prototype.remoteTextTracks=function(){return this.tech_&&this.tech_.remoteTextTracks()},b.prototype.remoteTextTrackEls=function(){return this.tech_&&this.tech_.remoteTextTrackEls()},b.prototype.addTextTrack=function(a,b,c){return this.tech_&&this.tech_.addTextTrack(a,b,c)},b.prototype.addRemoteTextTrack=function(a){return this.tech_&&this.tech_.addRemoteTextTrack(a)},b.prototype.removeRemoteTextTrack=function(){var a=arguments.length<=0||void 0===arguments[0]?{}:arguments[0],b=a.track,c=void 0===b?arguments[0]:b;this.tech_&&this.tech_.removeRemoteTextTrack(c)},b.prototype.videoWidth=function(){return this.tech_&&this.tech_.videoWidth&&this.tech_.videoWidth()||0},b.prototype.videoHeight=function(){return this.tech_&&this.tech_.videoHeight&&this.tech_.videoHeight()||0},b.prototype.language=function(a){return void 0===a?this.language_:(this.language_=(""+a).toLowerCase(),this)},b.prototype.languages=function(){return O["default"](b.prototype.options_.languages,this.languages_)},b.prototype.toJSON=function(){var a=O["default"](this.options_),b=a.tracks;a.tracks=[];for(var c=0;c<b.length;c++){var d=b[c];d=O["default"](d),d.player=void 0,a.tracks[c]=d}return a},b.prototype.createModal=function(a,b){var c=this;b=b||{},b.content=a||"";var d=new ca["default"](c,b);return c.addChild(d),d.on("dispose",function(){c.removeChild(d)}),d.open()},b.getTagSettings=function(a){var b={sources:[],tracks:[]},c=q.getElAttributes(a),d=c["data-setup"];if(null!==d){var e=K["default"](d||"{}"),f=e[0],g=e[1];f&&y["default"].error(f),M["default"](c,g)}if(M["default"](b,c),a.hasChildNodes())for(var h=a.childNodes,i=0,j=h.length;j>i;i++){var k=h[i],l=k.nodeName.toLowerCase();"source"===l?b.sources.push(q.getElAttributes(k)):"track"===l&&b.tracks.push(q.getElAttributes(k))}return b},b}(i["default"]));ga.players={};var ha=m["default"].navigator;ga.prototype.options_={techOrder:["html5","flash"],html5:{},flash:{},defaultVolume:0,inactivityTimeout:2e3,playbackRates:[],children:["mediaLoader","posterImage","textTrackDisplay","loadingSpinner","bigPlayButton","controlBar","errorDisplay","textTrackSettings"],language:k["default"].getElementsByTagName("html")[0].getAttribute("lang")||ha.languages&&ha.languages[0]||ha.userLanguage||ha.language||"en",languages:{},notSupportedMessage:"No compatible source was found for this media."},ga.prototype.handleLoadedMetaData_,ga.prototype.handleLoadedData_,ga.prototype.handleUserActive_,ga.prototype.handleUserInactive_,ga.prototype.handleTimeUpdate_,ga.prototype.handleTechEnded_,ga.prototype.handleVolumeChange_,ga.prototype.handleError_,ga.prototype.flexNotSupported_=function(){var a=k["default"].createElement("i");return!("flexBasis"in a.style||"webkitFlexBasis"in a.style||"mozFlexBasis"in a.style||"msFlexBasis"in a.style||"msFlexOrder"in a.style)},i["default"].registerComponent("Player",ga),c["default"]=ga,b.exports=c["default"]},{"./big-play-button.js":63,"./component.js":67,"./control-bar/control-bar.js":70,"./error-display.js":103,"./fullscreen-api.js":106,"./loading-spinner.js":107,"./media-error.js":108,"./modal-dialog":112,"./poster-image.js":117,"./tech/html5.js":122,"./tech/loader.js":123,"./tech/tech.js":124,"./tracks/audio-track-list.js":125,"./tracks/text-track-display.js":130,"./tracks/text-track-list-converter.js":131,"./tracks/text-track-settings.js":133,"./tracks/video-track-list.js":138,"./utils/browser.js":140,"./utils/buffer.js":141,"./utils/dom.js":143,"./utils/events.js":144,"./utils/fn.js":145,"./utils/guid.js":147,"./utils/log.js":148,"./utils/merge-options.js":149,"./utils/stylesheet.js":150,"./utils/time-ranges.js":151,"./utils/to-title-case.js":152,"global/document":1,"global/window":2,"object.assign":45,"safe-json-parse/tuple":54}],114:[function(a,b,c){"use strict";function d(a){return a&&a.__esModule?a:{"default":a}}c.__esModule=!0;var e=a("./player.js"),f=d(e),g=function(a,b){f["default"].prototype[a]=b};c["default"]=g,b.exports=c["default"]},{"./player.js":113}],115:[function(a,b,c){"use strict";function d(a){if(a&&a.__esModule)return a;var b={};if(null!=a)for(var c in a)Object.prototype.hasOwnProperty.call(a,c)&&(b[c]=a[c]);return b["default"]=a,b}function e(a){return a&&a.__esModule?a:{"default":a}}function f(a,b){if(!(a instanceof b))throw new TypeError("Cannot call a class as a function")}function g(a,b){if("function"!=typeof b&&null!==b)throw new TypeError("Super expression must either be null or a function, not "+typeof b);a.prototype=Object.create(b&&b.prototype,{constructor:{value:a,enumerable:!1,writable:!0,configurable:!0}}),b&&(Object.setPrototypeOf?Object.setPrototypeOf(a,b):a.__proto__=b)}c.__esModule=!0;var h=a("../clickable-component.js"),i=e(h),j=a("../component.js"),k=e(j),l=a("./popup.js"),m=(e(l),a("../utils/dom.js")),n=(d(m),a("../utils/fn.js")),o=(d(n),a("../utils/to-title-case.js")),p=(e(o),function(a){function b(c){var d=arguments.length<=1||void 0===arguments[1]?{}:arguments[1];f(this,b),a.call(this,c,d),this.update()}return g(b,a),b.prototype.update=function(){var a=this.createPopup();this.popup&&this.removeChild(this.popup),this.popup=a,this.addChild(a),this.items&&0===this.items.length?this.hide():this.items&&this.items.length>1&&this.show()},b.prototype.createPopup=function(){},b.prototype.createEl=function(){return a.prototype.createEl.call(this,"div",{className:this.buildCSSClass()})},b.prototype.buildCSSClass=function(){var b="vjs-menu-button";return b+=this.options_.inline===!0?"-inline":"-popup","vjs-menu-button "+b+" "+a.prototype.buildCSSClass.call(this)},b}(i["default"]));k["default"].registerComponent("PopupButton",p),c["default"]=p,b.exports=c["default"]},{"../clickable-component.js":65,"../component.js":67,"../utils/dom.js":143,"../utils/fn.js":145,"../utils/to-title-case.js":152,"./popup.js":116}],116:[function(a,b,c){"use strict";function d(a){if(a&&a.__esModule)return a;var b={};if(null!=a)for(var c in a)Object.prototype.hasOwnProperty.call(a,c)&&(b[c]=a[c]);return b["default"]=a,b}function e(a){return a&&a.__esModule?a:{"default":a}}function f(a,b){if(!(a instanceof b))throw new TypeError("Cannot call a class as a function")}function g(a,b){if("function"!=typeof b&&null!==b)throw new TypeError("Super expression must either be null or a function, not "+typeof b);a.prototype=Object.create(b&&b.prototype,{constructor:{value:a,enumerable:!1,writable:!0,configurable:!0}}),b&&(Object.setPrototypeOf?Object.setPrototypeOf(a,b):a.__proto__=b)}c.__esModule=!0;var h=a("../component.js"),i=e(h),j=a("../utils/dom.js"),k=d(j),l=a("../utils/fn.js"),m=d(l),n=a("../utils/events.js"),o=d(n),p=function(a){function b(){f(this,b),a.apply(this,arguments)}return g(b,a),b.prototype.addItem=function(a){this.addChild(a),a.on("click",m.bind(this,function(){this.unlockShowing()}))},b.prototype.createEl=function(){var b=this.options_.contentElType||"ul";this.contentEl_=k.createEl(b,{className:"vjs-menu-content"});var c=a.prototype.createEl.call(this,"div",{append:this.contentEl_,className:"vjs-menu"});return c.appendChild(this.contentEl_),o.on(c,"click",function(a){a.preventDefault(),a.stopImmediatePropagation()}),c},b}(i["default"]);i["default"].registerComponent("Popup",p),c["default"]=p,b.exports=c["default"]},{"../component.js":67,"../utils/dom.js":143,"../utils/events.js":144,"../utils/fn.js":145}],117:[function(a,b,c){"use strict";function d(a){if(a&&a.__esModule)return a;var b={};if(null!=a)for(var c in a)Object.prototype.hasOwnProperty.call(a,c)&&(b[c]=a[c]);return b["default"]=a,b}function e(a){return a&&a.__esModule?a:{"default":a}}function f(a,b){if(!(a instanceof b))throw new TypeError("Cannot call a class as a function")}function g(a,b){if("function"!=typeof b&&null!==b)throw new TypeError("Super expression must either be null or a function, not "+typeof b);a.prototype=Object.create(b&&b.prototype,{constructor:{value:a,enumerable:!1,writable:!0,configurable:!0}}),b&&(Object.setPrototypeOf?Object.setPrototypeOf(a,b):a.__proto__=b)}c.__esModule=!0;var h=a("./clickable-component.js"),i=e(h),j=a("./component.js"),k=e(j),l=a("./utils/fn.js"),m=d(l),n=a("./utils/dom.js"),o=d(n),p=a("./utils/browser.js"),q=d(p),r=function(a){function b(c,d){f(this,b),a.call(this,c,d),this.update(),c.on("posterchange",m.bind(this,this.update))}return g(b,a),b.prototype.dispose=function(){this.player().off("posterchange",this.update),a.prototype.dispose.call(this)},b.prototype.createEl=function(){var a=o.createEl("div",{className:"vjs-poster",tabIndex:-1});return q.BACKGROUND_SIZE_SUPPORTED||(this.fallbackImg_=o.createEl("img"),a.appendChild(this.fallbackImg_)),a},b.prototype.update=function(){var a=this.player().poster();this.setSrc(a),a?this.show():this.hide()},b.prototype.setSrc=function(a){if(this.fallbackImg_)this.fallbackImg_.src=a;else{var b="";a&&(b='url("'+a+'")'),this.el_.style.backgroundImage=b}},b.prototype.handleClick=function(){this.player_.paused()?this.player_.play():this.player_.pause()},b}(i["default"]);k["default"].registerComponent("PosterImage",r),c["default"]=r,b.exports=c["default"]},{"./clickable-component.js":65,"./component.js":67,"./utils/browser.js":140,"./utils/dom.js":143,"./utils/fn.js":145}],118:[function(a,b,c){"use strict";function d(a){return a&&a.__esModule?a:{"default":a}}function e(a){if(a&&a.__esModule)return a;var b={};if(null!=a)for(var c in a)Object.prototype.hasOwnProperty.call(a,c)&&(b[c]=a[c]);return b["default"]=a,b}c.__esModule=!0;var f=a("./utils/events.js"),g=e(f),h=a("global/document"),i=d(h),j=a("global/window"),k=d(j),l=!1,m=void 0,n=function(){var a=i["default"].getElementsByTagName("video"),b=i["default"].getElementsByTagName("audio"),c=[];if(a&&a.length>0)for(var d=0,e=a.length;e>d;d++)c.push(a[d]);if(b&&b.length>0)for(var d=0,e=b.length;e>d;d++)c.push(b[d]);if(c&&c.length>0)for(var d=0,e=c.length;e>d;d++){var f=c[d];if(!f||!f.getAttribute){o(1);break}if(void 0===f.player){var g=f.getAttribute("data-setup");if(null!==g){m(f)}}}else l||o(1)},o=function(a,b){b&&(m=b),setTimeout(n,a)};"complete"===i["default"].readyState?l=!0:g.one(k["default"],"load",function(){l=!0});var p=function(){return l};c.autoSetup=n,c.autoSetupTimeout=o,c.hasLoaded=p},{"./utils/events.js":144,"global/document":1,"global/window":2}],119:[function(a,b,c){"use strict";function d(a){if(a&&a.__esModule)return a;var b={};if(null!=a)for(var c in a)Object.prototype.hasOwnProperty.call(a,c)&&(b[c]=a[c]);return b["default"]=a,b}function e(a){return a&&a.__esModule?a:{"default":a}}function f(a,b){if(!(a instanceof b))throw new TypeError("Cannot call a class as a function")}function g(a,b){if("function"!=typeof b&&null!==b)throw new TypeError("Super expression must either be null or a function, not "+typeof b);a.prototype=Object.create(b&&b.prototype,{constructor:{value:a,enumerable:!1,writable:!0,configurable:!0}}),b&&(Object.setPrototypeOf?Object.setPrototypeOf(a,b):a.__proto__=b)}c.__esModule=!0;var h=a("../component.js"),i=e(h),j=a("../utils/dom.js"),k=d(j),l=a("object.assign"),m=e(l),n=function(a){function b(c,d){f(this,b),a.call(this,c,d),this.bar=this.getChild(this.options_.barName),this.vertical(!!this.options_.vertical),this.on("mousedown",this.handleMouseDown),this.on("touchstart",this.handleMouseDown),this.on("focus",this.handleFocus),this.on("blur",this.handleBlur),this.on("click",this.handleClick),this.on(c,"controlsvisible",this.update),this.on(c,this.playerEvent,this.update)}return g(b,a),b.prototype.createEl=function(b){var c=arguments.length<=1||void 0===arguments[1]?{}:arguments[1],d=arguments.length<=2||void 0===arguments[2]?{}:arguments[2];return c.className=c.className+" vjs-slider",c=m["default"]({tabIndex:0},c),d=m["default"]({role:"slider","aria-valuenow":0,"aria-valuemin":0,"aria-valuemax":100,tabIndex:0},d),a.prototype.createEl.call(this,b,c,d)},b.prototype.handleMouseDown=function(a){var b=this.bar.el_.ownerDocument;a.preventDefault(),k.blockTextSelection(),this.addClass("vjs-sliding"),this.trigger("slideractive"),this.on(b,"mousemove",this.handleMouseMove),this.on(b,"mouseup",this.handleMouseUp),this.on(b,"touchmove",this.handleMouseMove),this.on(b,"touchend",this.handleMouseUp),this.handleMouseMove(a)},b.prototype.handleMouseMove=function(){},b.prototype.handleMouseUp=function(){var a=this.bar.el_.ownerDocument;k.unblockTextSelection(),this.removeClass("vjs-sliding"),this.trigger("sliderinactive"),this.off(a,"mousemove",this.handleMouseMove),this.off(a,"mouseup",this.handleMouseUp),this.off(a,"touchmove",this.handleMouseMove),this.off(a,"touchend",this.handleMouseUp),this.update()},b.prototype.update=function(){if(this.el_){var a=this.getPercent(),b=this.bar;if(b){("number"!=typeof a||a!==a||0>a||a===1/0)&&(a=0);var c=(100*a).toFixed(2)+"%";this.vertical()?b.el().style.height=c:b.el().style.width=c}}},b.prototype.calculateDistance=function(a){var b=k.getPointerPosition(this.el_,a);return this.vertical()?b.y:b.x},b.prototype.handleFocus=function(){this.on(this.bar.el_.ownerDocument,"keydown",this.handleKeyPress)},b.prototype.handleKeyPress=function(a){37===a.which||40===a.which?(a.preventDefault(),this.stepBack()):(38===a.which||39===a.which)&&(a.preventDefault(),this.stepForward())},b.prototype.handleBlur=function(){this.off(this.bar.el_.ownerDocument,"keydown",this.handleKeyPress)},b.prototype.handleClick=function(a){a.stopImmediatePropagation(),a.preventDefault()},b.prototype.vertical=function(a){return void 0===a?this.vertical_||!1:(this.vertical_=!!a,this.addClass(this.vertical_?"vjs-slider-vertical":"vjs-slider-horizontal"),this)},b}(i["default"]);i["default"].registerComponent("Slider",n),c["default"]=n,b.exports=c["default"]},{"../component.js":67,"../utils/dom.js":143,"object.assign":45}],120:[function(a,b,c){"use strict";function d(a){return a.streamingFormats={"rtmp/mp4":"MP4","rtmp/flv":"FLV"},a.streamFromParts=function(a,b){return a+"&"+b},a.streamToParts=function(a){var b={connection:"",stream:""};if(!a)return b;var c=a.search(/&(?!\w+=)/),d=void 0;return-1!==c?d=c+1:(c=d=a.lastIndexOf("/")+1,
0===c&&(c=d=a.length)),b.connection=a.substring(0,c),b.stream=a.substring(d,a.length),b},a.isStreamingType=function(b){return b in a.streamingFormats},a.RTMP_RE=/^rtmp[set]?:\/\//i,a.isStreamingSrc=function(b){return a.RTMP_RE.test(b)},a.rtmpSourceHandler={},a.rtmpSourceHandler.canPlayType=function(b){return a.isStreamingType(b)?"maybe":""},a.rtmpSourceHandler.canHandleSource=function(b){var c=a.rtmpSourceHandler.canPlayType(b.type);return c?c:a.isStreamingSrc(b.src)?"maybe":""},a.rtmpSourceHandler.handleSource=function(b,c){var d=a.streamToParts(b.src);c.setRtmpConnection(d.connection),c.setRtmpStream(d.stream)},a.registerSourceHandler(a.rtmpSourceHandler),a}c.__esModule=!0,c["default"]=d,b.exports=c["default"]},{}],121:[function(a,b,c){"use strict";function d(a){if(a&&a.__esModule)return a;var b={};if(null!=a)for(var c in a)Object.prototype.hasOwnProperty.call(a,c)&&(b[c]=a[c]);return b["default"]=a,b}function e(a){return a&&a.__esModule?a:{"default":a}}function f(a,b){if(!(a instanceof b))throw new TypeError("Cannot call a class as a function")}function g(a,b){if("function"!=typeof b&&null!==b)throw new TypeError("Super expression must either be null or a function, not "+typeof b);a.prototype=Object.create(b&&b.prototype,{constructor:{value:a,enumerable:!1,writable:!0,configurable:!0}}),b&&(Object.setPrototypeOf?Object.setPrototypeOf(a,b):a.__proto__=b)}function h(a){var b=a.charAt(0).toUpperCase()+a.slice(1);A["set"+b]=function(b){return this.el_.vjs_setProperty(a,b)}}function i(a){A[a]=function(){return this.el_.vjs_getProperty(a)}}c.__esModule=!0;for(var j=a("./tech"),k=e(j),l=a("../utils/dom.js"),m=d(l),n=a("../utils/url.js"),o=d(n),p=a("../utils/time-ranges.js"),q=a("./flash-rtmp"),r=e(q),s=a("../component"),t=e(s),u=a("global/window"),v=e(u),w=a("object.assign"),x=e(w),y=v["default"].navigator,z=function(a){function b(c,d){f(this,b),a.call(this,c,d),c.source&&this.ready(function(){this.setSource(c.source)},!0),c.startTime&&this.ready(function(){this.load(),this.play(),this.currentTime(c.startTime)},!0),v["default"].videojs=v["default"].videojs||{},v["default"].videojs.Flash=v["default"].videojs.Flash||{},v["default"].videojs.Flash.onReady=b.onReady,v["default"].videojs.Flash.onEvent=b.onEvent,v["default"].videojs.Flash.onError=b.onError,this.on("seeked",function(){this.lastSeekTarget_=void 0})}return g(b,a),b.prototype.createEl=function(){var a=this.options_;a.swf||(a.swf="//vjs.zencdn.net/swf/5.0.1/video-js.swf");var c=a.techId,d=x["default"]({readyFunction:"videojs.Flash.onReady",eventProxyFunction:"videojs.Flash.onEvent",errorEventProxyFunction:"videojs.Flash.onError",autoplay:a.autoplay,preload:a.preload,loop:a.loop,muted:a.muted},a.flashVars),e=x["default"]({wmode:"opaque",bgcolor:"#000000"},a.params),f=x["default"]({id:c,name:c,"class":"vjs-tech"},a.attributes);return this.el_=b.embed(a.swf,d,e,f),this.el_.tech=this,this.el_},b.prototype.play=function(){this.ended()&&this.setCurrentTime(0),this.el_.vjs_play()},b.prototype.pause=function(){this.el_.vjs_pause()},b.prototype.src=function(a){return void 0===a?this.currentSrc():this.setSrc(a)},b.prototype.setSrc=function(a){if(a=o.getAbsoluteURL(a),this.el_.vjs_src(a),this.autoplay()){var b=this;this.setTimeout(function(){b.play()},0)}},b.prototype.seeking=function(){return void 0!==this.lastSeekTarget_},b.prototype.setCurrentTime=function(b){var c=this.seekable();c.length&&(b=b>c.start(0)?b:c.start(0),b=b<c.end(c.length-1)?b:c.end(c.length-1),this.lastSeekTarget_=b,this.trigger("seeking"),this.el_.vjs_setProperty("currentTime",b),a.prototype.setCurrentTime.call(this))},b.prototype.currentTime=function(){return this.seeking()?this.lastSeekTarget_||0:this.el_.vjs_getProperty("currentTime")},b.prototype.currentSrc=function(){return this.currentSource_?this.currentSource_.src:this.el_.vjs_getProperty("currentSrc")},b.prototype.load=function(){this.el_.vjs_load()},b.prototype.poster=function(){this.el_.vjs_getProperty("poster")},b.prototype.setPoster=function(){},b.prototype.seekable=function(){var a=this.duration();return 0===a?p.createTimeRange():p.createTimeRange(0,a)},b.prototype.buffered=function(){var a=this.el_.vjs_getProperty("buffered");return 0===a.length?p.createTimeRange():p.createTimeRange(a[0][0],a[0][1])},b.prototype.supportsFullScreen=function(){return!1},b.prototype.enterFullScreen=function(){return!1},b}(k["default"]),A=z.prototype,B="rtmpConnection,rtmpStream,preload,defaultPlaybackRate,playbackRate,autoplay,loop,mediaGroup,controller,controls,volume,muted,defaultMuted".split(","),C="networkState,readyState,initialTime,duration,startOffsetTime,paused,ended,videoWidth,videoHeight".split(","),D=0;D<B.length;D++)i(B[D]),h(B[D]);for(var D=0;D<C.length;D++)i(C[D]);z.isSupported=function(){return z.version()[0]>=10},k["default"].withSourceHandlers(z),z.nativeSourceHandler={},z.nativeSourceHandler.canPlayType=function(a){return a in z.formats?"maybe":""},z.nativeSourceHandler.canHandleSource=function(a){function b(a){var b=o.getFileExtension(a);return b?"video/"+b:""}var c;return c=a.type?a.type.replace(/;.*/,"").toLowerCase():b(a.src),z.nativeSourceHandler.canPlayType(c)},z.nativeSourceHandler.handleSource=function(a,b){b.setSrc(a.src)},z.nativeSourceHandler.dispose=function(){},z.registerSourceHandler(z.nativeSourceHandler),z.formats={"video/flv":"FLV","video/x-flv":"FLV","video/mp4":"MP4","video/m4v":"MP4"},z.onReady=function(a){var b=m.getEl(a),c=b&&b.tech;c&&c.el()&&z.checkReady(c)},z.checkReady=function(a){a.el()&&(a.el().vjs_getProperty?a.triggerReady():this.setTimeout(function(){z.checkReady(a)},50))},z.onEvent=function(a,b){var c=m.getEl(a).tech;c.trigger(b)},z.onError=function(a,b){var c=m.getEl(a).tech;return"srcnotfound"===b?c.error(4):void c.error("FLASH: "+b)},z.version=function(){var a="0,0,0";try{a=new v["default"].ActiveXObject("ShockwaveFlash.ShockwaveFlash").GetVariable("$version").replace(/\D+/g,",").match(/^,?(.+),?$/)[1]}catch(b){try{y.mimeTypes["application/x-shockwave-flash"].enabledPlugin&&(a=(y.plugins["Shockwave Flash 2.0"]||y.plugins["Shockwave Flash"]).description.replace(/\D+/g,",").match(/^,?(.+),?$/)[1])}catch(c){}}return a.split(",")},z.embed=function(a,b,c,d){var e=z.getEmbedCode(a,b,c,d),f=m.createEl("div",{innerHTML:e}).childNodes[0];return f},z.getEmbedCode=function(a,b,c,d){var e='<object type="application/x-shockwave-flash" ',f="",g="",h="";return b&&Object.getOwnPropertyNames(b).forEach(function(a){f+=a+"="+b[a]+"&amp;"}),c=x["default"]({movie:a,flashvars:f,allowScriptAccess:"always",allowNetworking:"all"},c),Object.getOwnPropertyNames(c).forEach(function(a){g+='<param name="'+a+'" value="'+c[a]+'" />'}),d=x["default"]({data:a,width:"100%",height:"100%"},d),Object.getOwnPropertyNames(d).forEach(function(a){h+=a+'="'+d[a]+'" '}),""+e+h+">"+g+"</object>"},r["default"](z),t["default"].registerComponent("Flash",z),k["default"].registerTech("Flash",z),c["default"]=z,b.exports=c["default"]},{"../component":67,"../utils/dom.js":143,"../utils/time-ranges.js":151,"../utils/url.js":153,"./flash-rtmp":120,"./tech":124,"global/window":2,"object.assign":45}],122:[function(a,b,c){"use strict";function d(a){if(a&&a.__esModule)return a;var b={};if(null!=a)for(var c in a)Object.prototype.hasOwnProperty.call(a,c)&&(b[c]=a[c]);return b["default"]=a,b}function e(a){return a&&a.__esModule?a:{"default":a}}function f(a,b){if(!(a instanceof b))throw new TypeError("Cannot call a class as a function")}function g(a,b){if("function"!=typeof b&&null!==b)throw new TypeError("Super expression must either be null or a function, not "+typeof b);a.prototype=Object.create(b&&b.prototype,{constructor:{value:a,enumerable:!1,writable:!0,configurable:!0}}),b&&(Object.setPrototypeOf?Object.setPrototypeOf(a,b):a.__proto__=b)}function h(a,b){return a.raw=b,a}c.__esModule=!0;var i=h(["Text Tracks are being loaded from another origin but the crossorigin attribute isn't used. \n            This may prevent text tracks from loading."],["Text Tracks are being loaded from another origin but the crossorigin attribute isn't used. \n            This may prevent text tracks from loading."]),j=a("./tech.js"),k=e(j),l=a("../component"),m=e(l),n=a("../utils/dom.js"),o=d(n),p=a("../utils/url.js"),q=d(p),r=a("../utils/fn.js"),s=d(r),t=a("../utils/log.js"),u=e(t),v=a("tsml"),w=e(v),x=a("../../../src/js/tracks/text-track.js"),y=(e(x),a("../utils/browser.js")),z=d(y),A=a("global/document"),B=e(A),C=a("global/window"),D=e(C),E=a("object.assign"),F=e(E),G=a("../utils/merge-options.js"),H=e(G),I=a("../utils/to-title-case.js"),J=e(I),K=function(a){function b(c,d){var e=this;f(this,b),a.call(this,c,d);var g=c.source,h=!1;if(g&&(this.el_.currentSrc!==g.src||c.tag&&3===c.tag.initNetworkState_)?this.setSource(g):this.handleLateInit_(this.el_),this.el_.hasChildNodes()){for(var j=this.el_.childNodes,k=j.length,l=[];k--;){var m=j[k],n=m.nodeName.toLowerCase();"track"===n&&(this.featuresNativeTextTracks?(this.remoteTextTrackEls().addTrackElement_(m),this.remoteTextTracks().addTrack_(m.track),h||this.el_.hasAttribute("crossorigin")||!q.isCrossOrigin(m.src)||(h=!0)):l.push(m))}for(var o=0;o<l.length;o++)this.el_.removeChild(l[o])}var p=["audio","video"];p.forEach(function(a){var b=J["default"](a);if(e["featuresNative"+b+"Tracks"]){var c=e.el()[a+"Tracks"];c&&c.addEventListener&&(c.addEventListener("change",s.bind(e,e["handle"+b+"TrackChange_"])),c.addEventListener("addtrack",s.bind(e,e["handle"+b+"TrackAdd_"])),c.addEventListener("removetrack",s.bind(e,e["handle"+b+"TrackRemove_"])))}}),this.featuresNativeTextTracks&&(h&&u["default"].warn(w["default"](i)),this.handleTextTrackChange_=s.bind(this,this.handleTextTrackChange),this.handleTextTrackAdd_=s.bind(this,this.handleTextTrackAdd),this.handleTextTrackRemove_=s.bind(this,this.handleTextTrackRemove),this.proxyNativeTextTracks_()),(z.TOUCH_ENABLED&&c.nativeControlsForTouch===!0||z.IS_IPHONE||z.IS_NATIVE_ANDROID)&&this.setControls(!0),this.triggerReady()}return g(b,a),b.prototype.dispose=function(){var c=this;["audio","video","text"].forEach(function(a){var b=J["default"](a),d=c.el_[a+"Tracks"];d&&d.removeEventListener&&(d.removeEventListener("change",c["handle"+b+"TrackChange_"]),d.removeEventListener("addtrack",c["handle"+b+"TrackAdd_"]),d.removeEventListener("removetrack",c["handle"+b+"TrackRemove_"]))}),b.disposeMediaElement(this.el_),a.prototype.dispose.call(this)},b.prototype.createEl=function(){var a=this.options_.tag;if(!a||this.movingMediaElementInDOM===!1)if(a){var c=a.cloneNode(!0);a.parentNode.insertBefore(c,a),b.disposeMediaElement(a),a=c}else{a=B["default"].createElement("video");var d=this.options_.tag&&o.getElAttributes(this.options_.tag),e=H["default"]({},d);z.TOUCH_ENABLED&&this.options_.nativeControlsForTouch===!0||delete e.controls,o.setElAttributes(a,F["default"](e,{id:this.options_.techId,"class":"vjs-tech"}))}for(var f=["autoplay","preload","loop","muted"],g=f.length-1;g>=0;g--){var h=f[g],i={};"undefined"!=typeof this.options_[h]&&(i[h]=this.options_[h]),o.setElAttributes(a,i)}return a},b.prototype.handleLateInit_=function(a){var b=this;if(0!==a.networkState&&3!==a.networkState){if(0===a.readyState){var c=function(){var a=!1,c=function(){a=!0};b.on("loadstart",c);var d=function(){a||this.trigger("loadstart")};return b.on("loadedmetadata",d),b.ready(function(){this.off("loadstart",c),this.off("loadedmetadata",d),a||this.trigger("loadstart")}),{v:void 0}}();if("object"==typeof c)return c.v}var d=["loadstart"];d.push("loadedmetadata"),a.readyState>=2&&d.push("loadeddata"),a.readyState>=3&&d.push("canplay"),a.readyState>=4&&d.push("canplaythrough"),this.ready(function(){d.forEach(function(a){this.trigger(a)},this)})}},b.prototype.proxyNativeTextTracks_=function(){var a=this.el().textTracks;if(a){for(var b=0;b<a.length;b++)this.textTracks().addTrack_(a[b]);a.addEventListener&&(a.addEventListener("change",this.handleTextTrackChange_),a.addEventListener("addtrack",this.handleTextTrackAdd_),a.addEventListener("removetrack",this.handleTextTrackRemove_))}},b.prototype.handleTextTrackChange=function(){var a=this.textTracks();this.textTracks().trigger({type:"change",target:a,currentTarget:a,srcElement:a})},b.prototype.handleTextTrackAdd=function(a){this.textTracks().addTrack_(a.track)},b.prototype.handleTextTrackRemove=function(a){this.textTracks().removeTrack_(a.track)},b.prototype.handleVideoTrackChange_=function(){var a=this.videoTracks();this.videoTracks().trigger({type:"change",target:a,currentTarget:a,srcElement:a})},b.prototype.handleVideoTrackAdd_=function(a){this.videoTracks().addTrack_(a.track)},b.prototype.handleVideoTrackRemove_=function(a){this.videoTracks().removeTrack_(a.track)},b.prototype.handleAudioTrackChange_=function(){var a=this.audioTracks();this.audioTracks().trigger({type:"change",target:a,currentTarget:a,srcElement:a})},b.prototype.handleAudioTrackAdd_=function(a){this.audioTracks().addTrack_(a.track)},b.prototype.handleAudioTrackRemove_=function(a){this.audioTracks().removeTrack_(a.track)},b.prototype.play=function(){this.el_.play()},b.prototype.pause=function(){this.el_.pause()},b.prototype.paused=function(){return this.el_.paused},b.prototype.currentTime=function(){return this.el_.currentTime},b.prototype.setCurrentTime=function(a){try{this.el_.currentTime=a}catch(b){u["default"](b,"Video is not ready. (Video.js)")}},b.prototype.duration=function(){return this.el_.duration||0},b.prototype.buffered=function(){return this.el_.buffered},b.prototype.volume=function(){return this.el_.volume},b.prototype.setVolume=function(a){this.el_.volume=a},b.prototype.muted=function(){return this.el_.muted},b.prototype.setMuted=function(a){this.el_.muted=a},b.prototype.width=function(){return this.el_.offsetWidth},b.prototype.height=function(){return this.el_.offsetHeight},b.prototype.supportsFullScreen=function(){if("function"==typeof this.el_.webkitEnterFullScreen){var a=D["default"].navigator.userAgent;if(/Android/.test(a)||!/Chrome|Mac OS X 10.5/.test(a))return!0}return!1},b.prototype.enterFullScreen=function(){var a=this.el_;"webkitDisplayingFullscreen"in a&&this.one("webkitbeginfullscreen",function(){this.one("webkitendfullscreen",function(){this.trigger("fullscreenchange",{isFullscreen:!1})}),this.trigger("fullscreenchange",{isFullscreen:!0})}),a.paused&&a.networkState<=a.HAVE_METADATA?(this.el_.play(),this.setTimeout(function(){a.pause(),a.webkitEnterFullScreen()},0)):a.webkitEnterFullScreen()},b.prototype.exitFullScreen=function(){this.el_.webkitExitFullScreen()},b.prototype.src=function(a){return void 0===a?this.el_.src:void this.setSrc(a)},b.prototype.setSrc=function(a){this.el_.src=a},b.prototype.load=function(){this.el_.load()},b.prototype.reset=function(){b.resetMediaElement(this.el_)},b.prototype.currentSrc=function(){return this.currentSource_?this.currentSource_.src:this.el_.currentSrc},b.prototype.poster=function(){return this.el_.poster},b.prototype.setPoster=function(a){this.el_.poster=a},b.prototype.preload=function(){return this.el_.preload},b.prototype.setPreload=function(a){this.el_.preload=a},b.prototype.autoplay=function(){return this.el_.autoplay},b.prototype.setAutoplay=function(a){this.el_.autoplay=a},b.prototype.controls=function(){return this.el_.controls},b.prototype.setControls=function(a){this.el_.controls=!!a},b.prototype.loop=function(){return this.el_.loop},b.prototype.setLoop=function(a){this.el_.loop=a},b.prototype.error=function(){return this.el_.error},b.prototype.seeking=function(){return this.el_.seeking},b.prototype.seekable=function(){return this.el_.seekable},b.prototype.ended=function(){return this.el_.ended},b.prototype.defaultMuted=function(){return this.el_.defaultMuted},b.prototype.playbackRate=function(){return this.el_.playbackRate},b.prototype.played=function(){return this.el_.played},b.prototype.setPlaybackRate=function(a){this.el_.playbackRate=a},b.prototype.networkState=function(){return this.el_.networkState},b.prototype.readyState=function(){return this.el_.readyState},b.prototype.videoWidth=function(){return this.el_.videoWidth},b.prototype.videoHeight=function(){return this.el_.videoHeight},b.prototype.textTracks=function(){return a.prototype.textTracks.call(this)},b.prototype.addTextTrack=function(b,c,d){return this.featuresNativeTextTracks?this.el_.addTextTrack(b,c,d):a.prototype.addTextTrack.call(this,b,c,d)},b.prototype.addRemoteTextTrack=function(){var b=arguments.length<=0||void 0===arguments[0]?{}:arguments[0];if(!this.featuresNativeTextTracks)return a.prototype.addRemoteTextTrack.call(this,b);var c=B["default"].createElement("track");return b.kind&&(c.kind=b.kind),b.label&&(c.label=b.label),(b.language||b.srclang)&&(c.srclang=b.language||b.srclang),b["default"]&&(c["default"]=b["default"]),b.id&&(c.id=b.id),b.src&&(c.src=b.src),this.el().appendChild(c),this.remoteTextTrackEls().addTrackElement_(c),this.remoteTextTracks().addTrack_(c.track),c},b.prototype.removeRemoteTextTrack=function(b){if(!this.featuresNativeTextTracks)return a.prototype.removeRemoteTextTrack.call(this,b);var c=void 0,d=void 0,e=this.remoteTextTrackEls().getTrackElementByTrack_(b);for(this.remoteTextTrackEls().removeTrackElement_(e),this.remoteTextTracks().removeTrack_(b),c=this.$$("track"),d=c.length;d--;)(b===c[d]||b===c[d].track)&&this.el().removeChild(c[d])},b}(k["default"]);K.TEST_VID=B["default"].createElement("video");var L=B["default"].createElement("track");L.kind="captions",L.srclang="en",L.label="English",K.TEST_VID.appendChild(L),K.isSupported=function(){try{K.TEST_VID.volume=.5}catch(a){return!1}return!!K.TEST_VID.canPlayType},k["default"].withSourceHandlers(K),K.nativeSourceHandler={},K.nativeSourceHandler.canPlayType=function(a){try{return K.TEST_VID.canPlayType(a)}catch(b){return""}},K.nativeSourceHandler.canHandleSource=function(a){var b;return a.type?K.nativeSourceHandler.canPlayType(a.type):a.src?(b=q.getFileExtension(a.src),K.nativeSourceHandler.canPlayType("video/"+b)):""},K.nativeSourceHandler.handleSource=function(a,b){b.setSrc(a.src)},K.nativeSourceHandler.dispose=function(){},K.registerSourceHandler(K.nativeSourceHandler),K.canControlVolume=function(){var a=K.TEST_VID.volume;return K.TEST_VID.volume=a/2+.1,a!==K.TEST_VID.volume},K.canControlPlaybackRate=function(){if(z.IS_ANDROID&&z.IS_CHROME)return!1;var a=K.TEST_VID.playbackRate;return K.TEST_VID.playbackRate=a/2+.1,a!==K.TEST_VID.playbackRate},K.supportsNativeTextTracks=function(){var a;return a=!!K.TEST_VID.textTracks,a&&K.TEST_VID.textTracks.length>0&&(a="number"!=typeof K.TEST_VID.textTracks[0].mode),a&&z.IS_FIREFOX&&(a=!1),!a||"onremovetrack"in K.TEST_VID.textTracks||(a=!1),a},K.supportsNativeVideoTracks=function(){var a=!!K.TEST_VID.videoTracks;return a},K.supportsNativeAudioTracks=function(){var a=!!K.TEST_VID.audioTracks;return a},K.Events=["loadstart","suspend","abort","error","emptied","stalled","loadedmetadata","loadeddata","canplay","canplaythrough","playing","waiting","seeking","seeked","ended","durationchange","timeupdate","progress","play","pause","ratechange","volumechange"],K.prototype.featuresVolumeControl=K.canControlVolume(),K.prototype.featuresPlaybackRate=K.canControlPlaybackRate(),K.prototype.movingMediaElementInDOM=!z.IS_IOS,K.prototype.featuresFullscreenResize=!0,K.prototype.featuresProgressEvents=!0,K.prototype.featuresNativeTextTracks=K.supportsNativeTextTracks(),K.prototype.featuresNativeVideoTracks=K.supportsNativeVideoTracks(),K.prototype.featuresNativeAudioTracks=K.supportsNativeAudioTracks();var M=void 0,N=/^application\/(?:x-|vnd\.apple\.)mpegurl/i,O=/^video\/mp4/i;K.patchCanPlayType=function(){z.ANDROID_VERSION>=4&&(M||(M=K.TEST_VID.constructor.prototype.canPlayType),K.TEST_VID.constructor.prototype.canPlayType=function(a){return a&&N.test(a)?"maybe":M.call(this,a)}),z.IS_OLD_ANDROID&&(M||(M=K.TEST_VID.constructor.prototype.canPlayType),K.TEST_VID.constructor.prototype.canPlayType=function(a){return a&&O.test(a)?"maybe":M.call(this,a)})},K.unpatchCanPlayType=function(){var a=K.TEST_VID.constructor.prototype.canPlayType;return K.TEST_VID.constructor.prototype.canPlayType=M,M=null,a},K.patchCanPlayType(),K.disposeMediaElement=function(a){if(a){for(a.parentNode&&a.parentNode.removeChild(a);a.hasChildNodes();)a.removeChild(a.firstChild);a.removeAttribute("src"),"function"==typeof a.load&&!function(){try{a.load()}catch(b){}}()}},K.resetMediaElement=function(a){if(a){for(var b=a.querySelectorAll("source"),c=b.length;c--;)a.removeChild(b[c]);a.removeAttribute("src"),"function"==typeof a.load&&!function(){try{a.load()}catch(b){}}()}},m["default"].registerComponent("Html5",K),k["default"].registerTech("Html5",K),c["default"]=K,b.exports=c["default"]},{"../../../src/js/tracks/text-track.js":134,"../component":67,"../utils/browser.js":140,"../utils/dom.js":143,"../utils/fn.js":145,"../utils/log.js":148,"../utils/merge-options.js":149,"../utils/to-title-case.js":152,"../utils/url.js":153,"./tech.js":124,"global/document":1,"global/window":2,"object.assign":45,tsml:55}],123:[function(a,b,c){"use strict";function d(a){return a&&a.__esModule?a:{"default":a}}function e(a,b){if(!(a instanceof b))throw new TypeError("Cannot call a class as a function")}function f(a,b){if("function"!=typeof b&&null!==b)throw new TypeError("Super expression must either be null or a function, not "+typeof b);a.prototype=Object.create(b&&b.prototype,{constructor:{value:a,enumerable:!1,writable:!0,configurable:!0}}),b&&(Object.setPrototypeOf?Object.setPrototypeOf(a,b):a.__proto__=b)}c.__esModule=!0;var g=a("../component.js"),h=d(g),i=a("./tech.js"),j=d(i),k=a("global/window"),l=(d(k),a("../utils/to-title-case.js")),m=d(l),n=function(a){function b(c,d,f){if(e(this,b),a.call(this,c,d,f),d.playerOptions.sources&&0!==d.playerOptions.sources.length)c.src(d.playerOptions.sources);else for(var g=0,i=d.playerOptions.techOrder;g<i.length;g++){var k=m["default"](i[g]),l=j["default"].getTech(k);if(k||(l=h["default"].getComponent(k)),l&&l.isSupported()){c.loadTech_(k);break}}}return f(b,a),b}(h["default"]);h["default"].registerComponent("MediaLoader",n),c["default"]=n,b.exports=c["default"]},{"../component.js":67,"../utils/to-title-case.js":152,"./tech.js":124,"global/window":2}],124:[function(a,b,c){"use strict";function d(a){if(a&&a.__esModule)return a;var b={};if(null!=a)for(var c in a)Object.prototype.hasOwnProperty.call(a,c)&&(b[c]=a[c]);return b["default"]=a,b}function e(a){return a&&a.__esModule?a:{"default":a}}function f(a,b){if(!(a instanceof b))throw new TypeError("Cannot call a class as a function")}function g(a,b){if("function"!=typeof b&&null!==b)throw new TypeError("Super expression must either be null or a function, not "+typeof b);a.prototype=Object.create(b&&b.prototype,{constructor:{value:a,enumerable:!1,writable:!0,configurable:!0}}),b&&(Object.setPrototypeOf?Object.setPrototypeOf(a,b):a.__proto__=b)}c.__esModule=!0;var h=a("../component"),i=e(h),j=a("../tracks/html-track-element"),k=e(j),l=a("../tracks/html-track-element-list"),m=e(l),n=a("../utils/merge-options.js"),o=e(n),p=a("../tracks/text-track"),q=e(p),r=a("../tracks/text-track-list"),s=e(r),t=a("../tracks/video-track"),u=(e(t),a("../tracks/video-track-list")),v=e(u),w=a("../tracks/audio-track-list"),x=e(w),y=a("../tracks/audio-track"),z=(e(y),a("../utils/fn.js")),A=d(z),B=a("../utils/log.js"),C=e(B),D=a("../utils/time-ranges.js"),E=a("../utils/buffer.js"),F=a("../media-error.js"),G=e(F),H=a("global/window"),I=e(H),J=a("global/document"),K=e(J),L=function(a){function b(){var c=arguments.length<=0||void 0===arguments[0]?{}:arguments[0],d=arguments.length<=1||void 0===arguments[1]?function(){}:arguments[1];f(this,b),c.reportTouchActivity=!1,a.call(this,null,c,d),this.hasStarted_=!1,this.on("playing",function(){this.hasStarted_=!0}),this.on("loadstart",function(){this.hasStarted_=!1}),this.textTracks_=c.textTracks,this.videoTracks_=c.videoTracks,this.audioTracks_=c.audioTracks,this.featuresProgressEvents||this.manualProgressOn(),this.featuresTimeupdateEvents||this.manualTimeUpdatesOn(),(c.nativeCaptions===!1||c.nativeTextTracks===!1)&&(this.featuresNativeTextTracks=!1),this.featuresNativeTextTracks||this.on("ready",this.emulateTextTracks),this.initTextTrackListeners(),this.initTrackListeners(),this.emitTapEvents()}/*! Time Tracking -------------------------------------------------------------- */
return g(b,a),b.prototype.manualProgressOn=function(){this.on("durationchange",this.onDurationChange),this.manualProgress=!0,this.one("ready",this.trackProgress)},b.prototype.manualProgressOff=function(){this.manualProgress=!1,this.stopTrackingProgress(),this.off("durationchange",this.onDurationChange)},b.prototype.trackProgress=function(){this.stopTrackingProgress(),this.progressInterval=this.setInterval(A.bind(this,function(){var a=this.bufferedPercent();this.bufferedPercent_!==a&&this.trigger("progress"),this.bufferedPercent_=a,1===a&&this.stopTrackingProgress()}),500)},b.prototype.onDurationChange=function(){this.duration_=this.duration()},b.prototype.buffered=function(){return D.createTimeRange(0,0)},b.prototype.bufferedPercent=function(){return E.bufferedPercent(this.buffered(),this.duration_)},b.prototype.stopTrackingProgress=function(){this.clearInterval(this.progressInterval)},b.prototype.manualTimeUpdatesOn=function(){this.manualTimeUpdates=!0,this.on("play",this.trackCurrentTime),this.on("pause",this.stopTrackingCurrentTime)},b.prototype.manualTimeUpdatesOff=function(){this.manualTimeUpdates=!1,this.stopTrackingCurrentTime(),this.off("play",this.trackCurrentTime),this.off("pause",this.stopTrackingCurrentTime)},b.prototype.trackCurrentTime=function(){this.currentTimeInterval&&this.stopTrackingCurrentTime(),this.currentTimeInterval=this.setInterval(function(){this.trigger({type:"timeupdate",target:this,manuallyTriggered:!0})},250)},b.prototype.stopTrackingCurrentTime=function(){this.clearInterval(this.currentTimeInterval),this.trigger({type:"timeupdate",target:this,manuallyTriggered:!0})},b.prototype.dispose=function(){this.clearTracks(["audio","video","text"]),this.manualProgress&&this.manualProgressOff(),this.manualTimeUpdates&&this.manualTimeUpdatesOff(),a.prototype.dispose.call(this)},b.prototype.clearTracks=function(a){var b=this;a=[].concat(a),a.forEach(function(a){for(var c=b[a+"Tracks"]()||[],d=c.length;d--;){var e=c[d];"text"===a&&b.removeRemoteTextTrack(e),c.removeTrack_(e)}})},b.prototype.reset=function(){},b.prototype.error=function(a){return void 0!==a&&(this.error_=a instanceof G["default"]?a:new G["default"](a),this.trigger("error")),this.error_},b.prototype.played=function(){return this.hasStarted_?D.createTimeRange(0,0):D.createTimeRange()},b.prototype.setCurrentTime=function(){this.manualTimeUpdates&&this.trigger({type:"timeupdate",target:this,manuallyTriggered:!0})},b.prototype.initTextTrackListeners=function(){var a=A.bind(this,function(){this.trigger("texttrackchange")}),b=this.textTracks();b&&(b.addEventListener("removetrack",a),b.addEventListener("addtrack",a),this.on("dispose",A.bind(this,function(){b.removeEventListener("removetrack",a),b.removeEventListener("addtrack",a)})))},b.prototype.initTrackListeners=function(){var a=this,b=["video","audio"];b.forEach(function(b){var c=function(){a.trigger(b+"trackchange")},d=a[b+"Tracks"]();d.addEventListener("removetrack",c),d.addEventListener("addtrack",c),a.on("dispose",function(){d.removeEventListener("removetrack",c),d.removeEventListener("addtrack",c)})})},b.prototype.emulateTextTracks=function(){var a=this,b=this.textTracks();if(b){I["default"].WebVTT||null==this.el().parentNode||!function(){var b=K["default"].createElement("script");b.src=a.options_["vtt.js"]||"https://cdn.rawgit.com/gkatsev/vtt.js/vjs-v0.12.1/dist/vtt.min.js",b.onload=function(){a.trigger("vttjsloaded")},b.onerror=function(){a.trigger("vttjserror")},a.on("dispose",function(){b.onload=null,b.onerror=null}),I["default"].WebVTT=!0,a.el().parentNode.appendChild(b)}();var c=function(){return a.trigger("texttrackchange")},d=function(){c();for(var a=0;a<b.length;a++){var d=b[a];d.removeEventListener("cuechange",c),"showing"===d.mode&&d.addEventListener("cuechange",c)}};d(),b.addEventListener("change",d),this.on("dispose",function(){b.removeEventListener("change",d)})}},b.prototype.videoTracks=function(){return this.videoTracks_=this.videoTracks_||new v["default"],this.videoTracks_},b.prototype.audioTracks=function(){return this.audioTracks_=this.audioTracks_||new x["default"],this.audioTracks_},b.prototype.textTracks=function(){return this.textTracks_=this.textTracks_||new s["default"],this.textTracks_},b.prototype.remoteTextTracks=function(){return this.remoteTextTracks_=this.remoteTextTracks_||new s["default"],this.remoteTextTracks_},b.prototype.remoteTextTrackEls=function(){return this.remoteTextTrackEls_=this.remoteTextTrackEls_||new m["default"],this.remoteTextTrackEls_},b.prototype.addTextTrack=function(a,b,c){if(!a)throw new Error("TextTrack kind is required but was not provided");return M(this,a,b,c)},b.prototype.addRemoteTextTrack=function(a){var b=o["default"](a,{tech:this}),c=new k["default"](b);return this.remoteTextTrackEls().addTrackElement_(c),this.remoteTextTracks().addTrack_(c.track),this.textTracks().addTrack_(c.track),c},b.prototype.removeRemoteTextTrack=function(a){this.textTracks().removeTrack_(a);var b=this.remoteTextTrackEls().getTrackElementByTrack_(a);this.remoteTextTrackEls().removeTrackElement_(b),this.remoteTextTracks().removeTrack_(a)},b.prototype.setPoster=function(){},b.prototype.canPlayType=function(){return""},b.isTech=function(a){return a.prototype instanceof b||a instanceof b||a===b},b.registerTech=function(a,c){if(b.techs_||(b.techs_={}),!b.isTech(c))throw new Error("Tech "+a+" must be a Tech");return b.techs_[a]=c,c},b.getTech=function(a){return b.techs_&&b.techs_[a]?b.techs_[a]:I["default"]&&I["default"].videojs&&I["default"].videojs[a]?(C["default"].warn("The "+a+" tech was added to the videojs object when it should be registered using videojs.registerTech(name, tech)"),I["default"].videojs[a]):void 0},b}(i["default"]);L.prototype.textTracks_,L.prototype.audioTracks_,L.prototype.videoTracks_;var M=function(a,b,c,d){var e=arguments.length<=4||void 0===arguments[4]?{}:arguments[4],f=a.textTracks();e.kind=b,c&&(e.label=c),d&&(e.language=d),e.tech=a;var g=new q["default"](e);return f.addTrack_(g),g};L.prototype.featuresVolumeControl=!0,L.prototype.featuresFullscreenResize=!1,L.prototype.featuresPlaybackRate=!1,L.prototype.featuresProgressEvents=!1,L.prototype.featuresTimeupdateEvents=!1,L.prototype.featuresNativeTextTracks=!1,L.withSourceHandlers=function(a){a.registerSourceHandler=function(b,c){var d=a.sourceHandlers;d||(d=a.sourceHandlers=[]),void 0===c&&(c=d.length),d.splice(c,0,b)},a.canPlayType=function(b){for(var c=a.sourceHandlers||[],d=void 0,e=0;e<c.length;e++)if(d=c[e].canPlayType(b))return d;return""},a.selectSourceHandler=function(b){for(var c=a.sourceHandlers||[],d=void 0,e=0;e<c.length;e++)if(d=c[e].canHandleSource(b))return c[e];return null},a.canPlaySource=function(b){var c=a.selectSourceHandler(b);return c?c.canHandleSource(b):""};var b=["seekable","duration"];b.forEach(function(a){var b=this[a];"function"==typeof b&&(this[a]=function(){return this.sourceHandler_&&this.sourceHandler_[a]?this.sourceHandler_[a].apply(this.sourceHandler_,arguments):b.apply(this,arguments)})},a.prototype),a.prototype.setSource=function(b){var c=a.selectSourceHandler(b);return c||(a.nativeSourceHandler?c=a.nativeSourceHandler:C["default"].error("No source hander found for the current source.")),this.disposeSourceHandler(),this.off("dispose",this.disposeSourceHandler),this.currentSource_&&(this.clearTracks(["audio","video"]),this.currentSource_=null),c!==a.nativeSourceHandler&&(this.currentSource_=b,this.off(this.el_,"loadstart",a.prototype.firstLoadStartListener_),this.off(this.el_,"loadstart",a.prototype.successiveLoadStartListener_),this.one(this.el_,"loadstart",a.prototype.firstLoadStartListener_)),this.sourceHandler_=c.handleSource(b,this,this.options_),this.on("dispose",this.disposeSourceHandler),this},a.prototype.firstLoadStartListener_=function(){this.one(this.el_,"loadstart",a.prototype.successiveLoadStartListener_)},a.prototype.successiveLoadStartListener_=function(){this.currentSource_=null,this.disposeSourceHandler(),this.one(this.el_,"loadstart",a.prototype.successiveLoadStartListener_)},a.prototype.disposeSourceHandler=function(){this.sourceHandler_&&this.sourceHandler_.dispose&&(this.off(this.el_,"loadstart",a.prototype.firstLoadStartListener_),this.off(this.el_,"loadstart",a.prototype.successiveLoadStartListener_),this.sourceHandler_.dispose(),this.sourceHandler_=null)}},i["default"].registerComponent("Tech",L),i["default"].registerComponent("MediaTechController",L),L.registerTech("Tech",L),c["default"]=L,b.exports=c["default"]},{"../component":67,"../media-error.js":108,"../tracks/audio-track":126,"../tracks/audio-track-list":125,"../tracks/html-track-element":128,"../tracks/html-track-element-list":127,"../tracks/text-track":134,"../tracks/text-track-list":132,"../tracks/video-track":139,"../tracks/video-track-list":138,"../utils/buffer.js":141,"../utils/fn.js":145,"../utils/log.js":148,"../utils/merge-options.js":149,"../utils/time-ranges.js":151,"global/document":1,"global/window":2}],125:[function(a,b,c){"use strict";function d(a){if(a&&a.__esModule)return a;var b={};if(null!=a)for(var c in a)Object.prototype.hasOwnProperty.call(a,c)&&(b[c]=a[c]);return b["default"]=a,b}function e(a){return a&&a.__esModule?a:{"default":a}}function f(a,b){if(!(a instanceof b))throw new TypeError("Cannot call a class as a function")}function g(a,b){if("function"!=typeof b&&null!==b)throw new TypeError("Super expression must either be null or a function, not "+typeof b);a.prototype=Object.create(b&&b.prototype,{constructor:{value:a,enumerable:!1,writable:!0,configurable:!0}}),b&&(Object.setPrototypeOf?Object.setPrototypeOf(a,b):a.__proto__=b)}c.__esModule=!0;var h=a("./track-list"),i=e(h),j=a("../utils/browser.js"),k=d(j),l=a("global/document"),m=e(l),n=function(a,b){for(var c=0;c<a.length;c++)b.id!==a[c].id&&(a[c].enabled=!1)},o=function(a){function b(){var c=arguments.length<=0||void 0===arguments[0]?[]:arguments[0];f(this,b);for(var d=void 0,e=c.length-1;e>=0;e--)if(c[e].enabled){n(c,c[e]);break}if(k.IS_IE8){d=m["default"].createElement("custom");for(var g in i["default"].prototype)"constructor"!==g&&(d[g]=i["default"].prototype[g]);for(var g in b.prototype)"constructor"!==g&&(d[g]=b.prototype[g])}return d=a.call(this,c,d),d.changing_=!1,d}return g(b,a),b.prototype.addTrack_=function(b){var c=this;b.enabled&&n(this,b),a.prototype.addTrack_.call(this,b),b.addEventListener&&b.addEventListener("enabledchange",function(){c.changing_||(c.changing_=!0,n(c,b),c.changing_=!1,c.trigger("change"))})},b.prototype.addTrack=function(a){this.addTrack_(a)},b.prototype.removeTrack=function(b){a.prototype.removeTrack_.call(this,b)},b}(i["default"]);c["default"]=o,b.exports=c["default"]},{"../utils/browser.js":140,"./track-list":136,"global/document":1}],126:[function(a,b,c){"use strict";function d(a){if(a&&a.__esModule)return a;var b={};if(null!=a)for(var c in a)Object.prototype.hasOwnProperty.call(a,c)&&(b[c]=a[c]);return b["default"]=a,b}function e(a){return a&&a.__esModule?a:{"default":a}}function f(a,b){if(!(a instanceof b))throw new TypeError("Cannot call a class as a function")}function g(a,b){if("function"!=typeof b&&null!==b)throw new TypeError("Super expression must either be null or a function, not "+typeof b);a.prototype=Object.create(b&&b.prototype,{constructor:{value:a,enumerable:!1,writable:!0,configurable:!0}}),b&&(Object.setPrototypeOf?Object.setPrototypeOf(a,b):a.__proto__=b)}c.__esModule=!0;var h=a("./track-enums"),i=a("./track"),j=e(i),k=a("../utils/merge-options"),l=e(k),m=a("../utils/browser.js"),n=d(m),o=function(a){function b(){var c=arguments.length<=0||void 0===arguments[0]?{}:arguments[0];f(this,b);var d=l["default"](c,{kind:h.AudioTrackKind[c.kind]||""}),e=a.call(this,d),g=!1;if(n.IS_IE8)for(var i in b.prototype)"constructor"!==i&&(e[i]=b.prototype[i]);return Object.defineProperty(e,"enabled",{get:function(){return g},set:function(a){"boolean"==typeof a&&a!==g&&(g=a,this.trigger("enabledchange"))}}),d.enabled&&(e.enabled=d.enabled),e.loaded_=!0,e}return g(b,a),b}(j["default"]);c["default"]=o,b.exports=c["default"]},{"../utils/browser.js":140,"../utils/merge-options":149,"./track":137,"./track-enums":135}],127:[function(a,b,c){"use strict";function d(a){return a&&a.__esModule?a:{"default":a}}function e(a){if(a&&a.__esModule)return a;var b={};if(null!=a)for(var c in a)Object.prototype.hasOwnProperty.call(a,c)&&(b[c]=a[c]);return b["default"]=a,b}function f(a,b){if(!(a instanceof b))throw new TypeError("Cannot call a class as a function")}c.__esModule=!0;var g=a("../utils/browser.js"),h=e(g),i=a("global/document"),j=d(i),k=function(){function a(){var b=arguments.length<=0||void 0===arguments[0]?[]:arguments[0];f(this,a);var c=this;if(h.IS_IE8){c=j["default"].createElement("custom");for(var d in a.prototype)"constructor"!==d&&(c[d]=a.prototype[d])}c.trackElements_=[],Object.defineProperty(c,"length",{get:function(){return this.trackElements_.length}});for(var e=0,g=b.length;g>e;e++)c.addTrackElement_(b[e]);return h.IS_IE8?c:void 0}return a.prototype.addTrackElement_=function(a){this.trackElements_.push(a)},a.prototype.getTrackElementByTrack_=function(a){for(var b=void 0,c=0,d=this.trackElements_.length;d>c;c++)if(a===this.trackElements_[c].track){b=this.trackElements_[c];break}return b},a.prototype.removeTrackElement_=function(a){for(var b=0,c=this.trackElements_.length;c>b;b++)if(a===this.trackElements_[b]){this.trackElements_.splice(b,1);break}},a}();c["default"]=k,b.exports=c["default"]},{"../utils/browser.js":140,"global/document":1}],128:[function(a,b,c){"use strict";function d(a){return a&&a.__esModule?a:{"default":a}}function e(a){if(a&&a.__esModule)return a;var b={};if(null!=a)for(var c in a)Object.prototype.hasOwnProperty.call(a,c)&&(b[c]=a[c]);return b["default"]=a,b}function f(a,b){if(!(a instanceof b))throw new TypeError("Cannot call a class as a function")}function g(a,b){if("function"!=typeof b&&null!==b)throw new TypeError("Super expression must either be null or a function, not "+typeof b);a.prototype=Object.create(b&&b.prototype,{constructor:{value:a,enumerable:!1,writable:!0,configurable:!0}}),b&&(Object.setPrototypeOf?Object.setPrototypeOf(a,b):a.__proto__=b)}c.__esModule=!0;var h=a("../utils/browser.js"),i=e(h),j=a("global/document"),k=d(j),l=a("../event-target"),m=d(l),n=a("../tracks/text-track"),o=d(n),p=0,q=1,r=2,s=3,t=function(a){function b(){var c=arguments.length<=0||void 0===arguments[0]?{}:arguments[0];f(this,b),a.call(this);var d=void 0,e=this;if(i.IS_IE8){e=k["default"].createElement("custom");for(var g in b.prototype)"constructor"!==g&&(e[g]=b.prototype[g])}var h=new o["default"](c);return e.kind=h.kind,e.src=h.src,e.srclang=h.language,e.label=h.label,e["default"]=h["default"],Object.defineProperty(e,"readyState",{get:function(){return d}}),Object.defineProperty(e,"track",{get:function(){return h}}),d=p,h.addEventListener("loadeddata",function(){d=r,e.trigger({type:"load",target:e})}),i.IS_IE8?e:void 0}return g(b,a),b}(m["default"]);t.prototype.allowedEvents_={load:"load"},t.NONE=p,t.LOADING=q,t.LOADED=r,t.ERROR=s,c["default"]=t,b.exports=c["default"]},{"../event-target":104,"../tracks/text-track":134,"../utils/browser.js":140,"global/document":1}],129:[function(a,b,c){"use strict";function d(a){return a&&a.__esModule?a:{"default":a}}function e(a){if(a&&a.__esModule)return a;var b={};if(null!=a)for(var c in a)Object.prototype.hasOwnProperty.call(a,c)&&(b[c]=a[c]);return b["default"]=a,b}function f(a,b){if(!(a instanceof b))throw new TypeError("Cannot call a class as a function")}c.__esModule=!0;var g=a("../utils/browser.js"),h=e(g),i=a("global/document"),j=d(i),k=function(){function a(b){f(this,a);var c=this;if(h.IS_IE8){c=j["default"].createElement("custom");for(var d in a.prototype)"constructor"!==d&&(c[d]=a.prototype[d])}return a.prototype.setCues_.call(c,b),Object.defineProperty(c,"length",{get:function(){return this.length_}}),h.IS_IE8?c:void 0}return a.prototype.setCues_=function(a){var b=this.length||0,c=0,d=a.length;this.cues_=a,this.length_=a.length;var e=function(a){""+a in this||Object.defineProperty(this,""+a,{get:function(){return this.cues_[a]}})};if(d>b)for(c=b;d>c;c++)e.call(this,c)},a.prototype.getCueById=function(a){for(var b=null,c=0,d=this.length;d>c;c++){var e=this[c];if(e.id===a){b=e;break}}return b},a}();c["default"]=k,b.exports=c["default"]},{"../utils/browser.js":140,"global/document":1}],130:[function(a,b,c){"use strict";function d(a){if(a&&a.__esModule)return a;var b={};if(null!=a)for(var c in a)Object.prototype.hasOwnProperty.call(a,c)&&(b[c]=a[c]);return b["default"]=a,b}function e(a){return a&&a.__esModule?a:{"default":a}}function f(a,b){if(!(a instanceof b))throw new TypeError("Cannot call a class as a function")}function g(a,b){if("function"!=typeof b&&null!==b)throw new TypeError("Super expression must either be null or a function, not "+typeof b);a.prototype=Object.create(b&&b.prototype,{constructor:{value:a,enumerable:!1,writable:!0,configurable:!0}}),b&&(Object.setPrototypeOf?Object.setPrototypeOf(a,b):a.__proto__=b)}function h(a,b){return"rgba("+parseInt(a[1]+a[1],16)+","+parseInt(a[2]+a[2],16)+","+parseInt(a[3]+a[3],16)+","+b+")"}function i(a,b,c){try{a.style[b]=c}catch(d){}}c.__esModule=!0;var j=a("../component"),k=e(j),l=a("../menu/menu.js"),m=(e(l),a("../menu/menu-item.js")),n=(e(m),a("../menu/menu-button.js")),o=(e(n),a("../utils/fn.js")),p=d(o),q=a("global/document"),r=(e(q),a("global/window")),s=e(r),t="#222",u="#ccc",v={monospace:"monospace",sansSerif:"sans-serif",serif:"serif",monospaceSansSerif:'"Andale Mono", "Lucida Console", monospace',monospaceSerif:'"Courier New", monospace',proportionalSansSerif:"sans-serif",proportionalSerif:"serif",casual:'"Comic Sans MS", Impact, fantasy',script:'"Monotype Corsiva", cursive',smallcaps:'"Andale Mono", "Lucida Console", monospace, sans-serif'},w=function(a){function b(c,d,e){f(this,b),a.call(this,c,d,e),c.on("loadstart",p.bind(this,this.toggleDisplay)),c.on("texttrackchange",p.bind(this,this.updateDisplay)),c.ready(p.bind(this,function(){if(c.tech_&&c.tech_.featuresNativeTextTracks)return void this.hide();c.on("fullscreenchange",p.bind(this,this.updateDisplay));for(var a=this.options_.playerOptions.tracks||[],b=0;b<a.length;b++){var d=a[b];this.player_.addRemoteTextTrack(d)}var e={captions:1,subtitles:1},f=this.player_.textTracks(),g=void 0,h=void 0;if(f){for(var b=0;b<f.length;b++){var d=f[b];d["default"]&&("descriptions"!==d.kind||g?d.kind in e&&!h&&(h=d):g=d)}h?h.mode="showing":g&&(g.mode="showing")}}))}return g(b,a),b.prototype.toggleDisplay=function(){this.player_.tech_&&this.player_.tech_.featuresNativeTextTracks?this.hide():this.show()},b.prototype.createEl=function(){return a.prototype.createEl.call(this,"div",{className:"vjs-text-track-display"},{"aria-live":"assertive","aria-atomic":"true"})},b.prototype.clearDisplay=function(){"function"==typeof s["default"].WebVTT&&s["default"].WebVTT.processCues(s["default"],[],this.el_)},b.prototype.updateDisplay=function(){var a=this.player_.textTracks();if(this.clearDisplay(),a){for(var b=null,c=null,d=a.length;d--;){var e=a[d];"showing"===e.mode&&("descriptions"===e.kind?b=e:c=e)}c?this.updateForTrack(c):b&&this.updateForTrack(b)}},b.prototype.updateForTrack=function(a){if("function"==typeof s["default"].WebVTT&&a.activeCues){for(var b=this.player_.textTrackSettings.getValues(),c=[],d=0;d<a.activeCues.length;d++)c.push(a.activeCues[d]);s["default"].WebVTT.processCues(s["default"],c,this.el_);for(var e=c.length;e--;){var f=c[e];if(f){var g=f.displayState;if(b.color&&(g.firstChild.style.color=b.color),b.textOpacity&&i(g.firstChild,"color",h(b.color||"#fff",b.textOpacity)),b.backgroundColor&&(g.firstChild.style.backgroundColor=b.backgroundColor),b.backgroundOpacity&&i(g.firstChild,"backgroundColor",h(b.backgroundColor||"#000",b.backgroundOpacity)),b.windowColor&&(b.windowOpacity?i(g,"backgroundColor",h(b.windowColor,b.windowOpacity)):g.style.backgroundColor=b.windowColor),b.edgeStyle&&("dropshadow"===b.edgeStyle?g.firstChild.style.textShadow="2px 2px 3px "+t+", 2px 2px 4px "+t+", 2px 2px 5px "+t:"raised"===b.edgeStyle?g.firstChild.style.textShadow="1px 1px "+t+", 2px 2px "+t+", 3px 3px "+t:"depressed"===b.edgeStyle?g.firstChild.style.textShadow="1px 1px "+u+", 0 1px "+u+", -1px -1px "+t+", 0 -1px "+t:"uniform"===b.edgeStyle&&(g.firstChild.style.textShadow="0 0 4px "+t+", 0 0 4px "+t+", 0 0 4px "+t+", 0 0 4px "+t)),b.fontPercent&&1!==b.fontPercent){var j=s["default"].parseFloat(g.style.fontSize);g.style.fontSize=j*b.fontPercent+"px",g.style.height="auto",g.style.top="auto",g.style.bottom="2px"}b.fontFamily&&"default"!==b.fontFamily&&("small-caps"===b.fontFamily?g.firstChild.style.fontVariant="small-caps":g.firstChild.style.fontFamily=v[b.fontFamily])}}}},b}(k["default"]);k["default"].registerComponent("TextTrackDisplay",w),c["default"]=w,b.exports=c["default"]},{"../component":67,"../menu/menu-button.js":109,"../menu/menu-item.js":110,"../menu/menu.js":111,"../utils/fn.js":145,"global/document":1,"global/window":2}],131:[function(a,b,c){"use strict";c.__esModule=!0;var d=function(a){var b=["kind","label","language","id","inBandMetadataTrackDispatchType","mode","src"].reduce(function(b,c){return a[c]&&(b[c]=a[c]),b},{cues:a.cues&&Array.prototype.map.call(a.cues,function(a){return{startTime:a.startTime,endTime:a.endTime,text:a.text,id:a.id}})});return b},e=function(a){var b=a.$$("track"),c=Array.prototype.map.call(b,function(a){return a.track}),e=Array.prototype.map.call(b,function(a){var b=d(a.track);return a.src&&(b.src=a.src),b});return e.concat(Array.prototype.filter.call(a.textTracks(),function(a){return-1===c.indexOf(a)}).map(d))},f=function(a,b){return a.forEach(function(a){var c=b.addRemoteTextTrack(a).track;!a.src&&a.cues&&a.cues.forEach(function(a){return c.addCue(a)})}),b.textTracks()};c["default"]={textTracksToJson:e,jsonToTextTracks:f,trackToJson_:d},b.exports=c["default"]},{}],132:[function(a,b,c){"use strict";function d(a){if(a&&a.__esModule)return a;var b={};if(null!=a)for(var c in a)Object.prototype.hasOwnProperty.call(a,c)&&(b[c]=a[c]);return b["default"]=a,b}function e(a){return a&&a.__esModule?a:{"default":a}}function f(a,b){if(!(a instanceof b))throw new TypeError("Cannot call a class as a function")}function g(a,b){if("function"!=typeof b&&null!==b)throw new TypeError("Super expression must either be null or a function, not "+typeof b);a.prototype=Object.create(b&&b.prototype,{constructor:{value:a,enumerable:!1,writable:!0,configurable:!0}}),b&&(Object.setPrototypeOf?Object.setPrototypeOf(a,b):a.__proto__=b)}c.__esModule=!0;var h=a("./track-list"),i=e(h),j=a("../utils/fn.js"),k=d(j),l=a("../utils/browser.js"),m=d(l),n=a("global/document"),o=e(n),p=function(a){function b(){var c=arguments.length<=0||void 0===arguments[0]?[]:arguments[0];f(this,b);var d=void 0;if(m.IS_IE8){d=o["default"].createElement("custom");for(var e in i["default"].prototype)"constructor"!==e&&(d[e]=i["default"].prototype[e]);for(var e in b.prototype)"constructor"!==e&&(d[e]=b.prototype[e])}return d=a.call(this,c,d)}return g(b,a),b.prototype.addTrack_=function(b){a.prototype.addTrack_.call(this,b),b.addEventListener("modechange",k.bind(this,function(){this.trigger("change")}))},b.prototype.removeTrack_=function(a){for(var b=void 0,c=0,d=this.length;d>c;c++)if(this[c]===a){b=this[c],b.off&&b.off(),this.tracks_.splice(c,1);break}b&&this.trigger({track:b,type:"removetrack"})},b.prototype.getTrackById=function(a){for(var b=null,c=0,d=this.length;d>c;c++){var e=this[c];if(e.id===a){b=e;break}}return b},b}(i["default"]);c["default"]=p,b.exports=c["default"]},{"../utils/browser.js":140,"../utils/fn.js":145,"./track-list":136,"global/document":1}],133:[function(a,b,c){"use strict";function d(a){if(a&&a.__esModule)return a;var b={};if(null!=a)for(var c in a)Object.prototype.hasOwnProperty.call(a,c)&&(b[c]=a[c]);return b["default"]=a,b}function e(a){return a&&a.__esModule?a:{"default":a}}function f(a,b){if(!(a instanceof b))throw new TypeError("Cannot call a class as a function")}function g(a,b){if("function"!=typeof b&&null!==b)throw new TypeError("Super expression must either be null or a function, not "+typeof b);a.prototype=Object.create(b&&b.prototype,{constructor:{value:a,enumerable:!1,writable:!0,configurable:!0}}),b&&(Object.setPrototypeOf?Object.setPrototypeOf(a,b):a.__proto__=b)}function h(a){var b=void 0;return a.selectedOptions?b=a.selectedOptions[0]:a.options&&(b=a.options[a.options.selectedIndex]),b.value}function i(a,b){if(b){var c=void 0;for(c=0;c<a.options.length;c++){var d=a.options[c];if(d.value===b)break}a.selectedIndex=c}}function j(){var a='<div class="vjs-tracksettings">\n      <div class="vjs-tracksettings-colors">\n        <div class="vjs-fg-color vjs-tracksetting">\n            <label class="vjs-label">Foreground</label>\n            <select>\n              <option value="">---</option>\n              <option value="#FFF">White</option>\n              <option value="#000">Black</option>\n              <option value="#F00">Red</option>\n              <option value="#0F0">Green</option>\n              <option value="#00F">Blue</option>\n              <option value="#FF0">Yellow</option>\n              <option value="#F0F">Magenta</option>\n              <option value="#0FF">Cyan</option>\n            </select>\n            <span class="vjs-text-opacity vjs-opacity">\n              <select>\n                <option value="">---</option>\n                <option value="1">Opaque</option>\n                <option value="0.5">Semi-Opaque</option>\n              </select>\n            </span>\n        </div> <!-- vjs-fg-color -->\n        <div class="vjs-bg-color vjs-tracksetting">\n            <label class="vjs-label">Background</label>\n            <select>\n              <option value="">---</option>\n              <option value="#FFF">White</option>\n              <option value="#000">Black</option>\n              <option value="#F00">Red</option>\n              <option value="#0F0">Green</option>\n              <option value="#00F">Blue</option>\n              <option value="#FF0">Yellow</option>\n              <option value="#F0F">Magenta</option>\n              <option value="#0FF">Cyan</option>\n            </select>\n            <span class="vjs-bg-opacity vjs-opacity">\n                <select>\n                  <option value="">---</option>\n                  <option value="1">Opaque</option>\n                  <option value="0.5">Semi-Transparent</option>\n                  <option value="0">Transparent</option>\n                </select>\n            </span>\n        </div> <!-- vjs-bg-color -->\n        <div class="window-color vjs-tracksetting">\n            <label class="vjs-label">Window</label>\n            <select>\n              <option value="">---</option>\n              <option value="#FFF">White</option>\n              <option value="#000">Black</option>\n              <option value="#F00">Red</option>\n              <option value="#0F0">Green</option>\n              <option value="#00F">Blue</option>\n              <option value="#FF0">Yellow</option>\n              <option value="#F0F">Magenta</option>\n              <option value="#0FF">Cyan</option>\n            </select>\n            <span class="vjs-window-opacity vjs-opacity">\n                <select>\n                  <option value="">---</option>\n                  <option value="1">Opaque</option>\n                  <option value="0.5">Semi-Transparent</option>\n                  <option value="0">Transparent</option>\n                </select>\n            </span>\n        </div> <!-- vjs-window-color -->\n      </div> <!-- vjs-tracksettings -->\n      <div class="vjs-tracksettings-font">\n        <div class="vjs-font-percent vjs-tracksetting">\n          <label class="vjs-label">Font Size</label>\n          <select>\n            <option value="0.50">50%</option>\n            <option value="0.75">75%</option>\n            <option value="1.00" selected>100%</option>\n            <option value="1.25">125%</option>\n            <option value="1.50">150%</option>\n            <option value="1.75">175%</option>\n            <option value="2.00">200%</option>\n            <option value="3.00">300%</option>\n            <option value="4.00">400%</option>\n          </select>\n        </div> <!-- vjs-font-percent -->\n        <div class="vjs-edge-style vjs-tracksetting">\n          <label class="vjs-label">Text Edge Style</label>\n          <select>\n            <option value="none">None</option>\n            <option value="raised">Raised</option>\n            <option value="depressed">Depressed</option>\n            <option value="uniform">Uniform</option>\n            <option value="dropshadow">Dropshadow</option>\n          </select>\n        </div> <!-- vjs-edge-style -->\n        <div class="vjs-font-family vjs-tracksetting">\n          <label class="vjs-label">Font Family</label>\n          <select>\n            <option value="">Default</option>\n            <option value="monospaceSerif">Monospace Serif</option>\n            <option value="proportionalSerif">Proportional Serif</option>\n            <option value="monospaceSansSerif">Monospace Sans-Serif</option>\n            <option value="proportionalSansSerif">Proportional Sans-Serif</option>\n            <option value="casual">Casual</option>\n            <option value="script">Script</option>\n            <option value="small-caps">Small Caps</option>\n          </select>\n        </div> <!-- vjs-font-family -->\n      </div>\n    </div>\n    <div class="vjs-tracksettings-controls">\n      <button class="vjs-default-button">Defaults</button>\n      <button class="vjs-done-button">Done</button>\n    </div>';return a}c.__esModule=!0;var k=a("../component"),l=e(k),m=a("../utils/events.js"),n=d(m),o=a("../utils/fn.js"),p=d(o),q=a("../utils/log.js"),r=e(q),s=a("safe-json-parse/tuple"),t=e(s),u=a("global/window"),v=e(u),w=function(a){function b(c,d){f(this,b),a.call(this,c,d),this.hide(),void 0===d.persistTextTrackSettings&&(this.options_.persistTextTrackSettings=this.options_.playerOptions.persistTextTrackSettings),n.on(this.$(".vjs-done-button"),"click",p.bind(this,function(){this.saveSettings(),this.hide()})),n.on(this.$(".vjs-default-button"),"click",p.bind(this,function(){this.$(".vjs-fg-color > select").selectedIndex=0,this.$(".vjs-bg-color > select").selectedIndex=0,this.$(".window-color > select").selectedIndex=0,this.$(".vjs-text-opacity > select").selectedIndex=0,this.$(".vjs-bg-opacity > select").selectedIndex=0,this.$(".vjs-window-opacity > select").selectedIndex=0,this.$(".vjs-edge-style select").selectedIndex=0,this.$(".vjs-font-family select").selectedIndex=0,this.$(".vjs-font-percent select").selectedIndex=2,this.updateDisplay()})),n.on(this.$(".vjs-fg-color > select"),"change",p.bind(this,this.updateDisplay)),n.on(this.$(".vjs-bg-color > select"),"change",p.bind(this,this.updateDisplay)),n.on(this.$(".window-color > select"),"change",p.bind(this,this.updateDisplay)),n.on(this.$(".vjs-text-opacity > select"),"change",p.bind(this,this.updateDisplay)),n.on(this.$(".vjs-bg-opacity > select"),"change",p.bind(this,this.updateDisplay)),n.on(this.$(".vjs-window-opacity > select"),"change",p.bind(this,this.updateDisplay)),n.on(this.$(".vjs-font-percent select"),"change",p.bind(this,this.updateDisplay)),n.on(this.$(".vjs-edge-style select"),"change",p.bind(this,this.updateDisplay)),n.on(this.$(".vjs-font-family select"),"change",p.bind(this,this.updateDisplay)),this.options_.persistTextTrackSettings&&this.restoreSettings()}return g(b,a),b.prototype.createEl=function(){return a.prototype.createEl.call(this,"div",{className:"vjs-caption-settings vjs-modal-overlay",innerHTML:j()})},b.prototype.getValues=function(){var a=h(this.$(".vjs-edge-style select")),b=h(this.$(".vjs-font-family select")),c=h(this.$(".vjs-fg-color > select")),d=h(this.$(".vjs-text-opacity > select")),e=h(this.$(".vjs-bg-color > select")),f=h(this.$(".vjs-bg-opacity > select")),g=h(this.$(".window-color > select")),i=h(this.$(".vjs-window-opacity > select")),j=v["default"].parseFloat(h(this.$(".vjs-font-percent > select"))),k={
backgroundOpacity:f,textOpacity:d,windowOpacity:i,edgeStyle:a,fontFamily:b,color:c,backgroundColor:e,windowColor:g,fontPercent:j};for(var l in k)(""===k[l]||"none"===k[l]||"fontPercent"===l&&1===k[l])&&delete k[l];return k},b.prototype.setValues=function(a){i(this.$(".vjs-edge-style select"),a.edgeStyle),i(this.$(".vjs-font-family select"),a.fontFamily),i(this.$(".vjs-fg-color > select"),a.color),i(this.$(".vjs-text-opacity > select"),a.textOpacity),i(this.$(".vjs-bg-color > select"),a.backgroundColor),i(this.$(".vjs-bg-opacity > select"),a.backgroundOpacity),i(this.$(".window-color > select"),a.windowColor),i(this.$(".vjs-window-opacity > select"),a.windowOpacity);var b=a.fontPercent;b&&(b=b.toFixed(2)),i(this.$(".vjs-font-percent > select"),b)},b.prototype.restoreSettings=function(){var a=void 0,b=void 0;try{var c=t["default"](v["default"].localStorage.getItem("vjs-text-track-settings"));a=c[0],b=c[1],a&&r["default"].error(a)}catch(d){r["default"].warn(d)}b&&this.setValues(b)},b.prototype.saveSettings=function(){if(this.options_.persistTextTrackSettings){var a=this.getValues();try{Object.getOwnPropertyNames(a).length>0?v["default"].localStorage.setItem("vjs-text-track-settings",JSON.stringify(a)):v["default"].localStorage.removeItem("vjs-text-track-settings")}catch(b){r["default"].warn(b)}}},b.prototype.updateDisplay=function(){var a=this.player_.getChild("textTrackDisplay");a&&a.updateDisplay()},b}(l["default"]);l["default"].registerComponent("TextTrackSettings",w),c["default"]=w,b.exports=c["default"]},{"../component":67,"../utils/events.js":144,"../utils/fn.js":145,"../utils/log.js":148,"global/window":2,"safe-json-parse/tuple":54}],134:[function(a,b,c){"use strict";function d(a){if(a&&a.__esModule)return a;var b={};if(null!=a)for(var c in a)Object.prototype.hasOwnProperty.call(a,c)&&(b[c]=a[c]);return b["default"]=a,b}function e(a){return a&&a.__esModule?a:{"default":a}}function f(a,b){if(!(a instanceof b))throw new TypeError("Cannot call a class as a function")}function g(a,b){if("function"!=typeof b&&null!==b)throw new TypeError("Super expression must either be null or a function, not "+typeof b);a.prototype=Object.create(b&&b.prototype,{constructor:{value:a,enumerable:!1,writable:!0,configurable:!0}}),b&&(Object.setPrototypeOf?Object.setPrototypeOf(a,b):a.__proto__=b)}c.__esModule=!0;var h=a("./text-track-cue-list"),i=e(h),j=a("../utils/fn.js"),k=d(j),l=a("./track-enums"),m=a("../utils/log.js"),n=e(m),o=a("global/document"),p=(e(o),a("global/window")),q=e(p),r=a("./track.js"),s=e(r),t=a("../utils/url.js"),u=a("xhr"),v=e(u),w=a("../utils/merge-options"),x=e(w),y=a("../utils/browser.js"),z=d(y),A=function(a,b){var c=new q["default"].WebVTT.Parser(q["default"],q["default"].vttjs,q["default"].WebVTT.StringDecoder()),d=[];c.oncue=function(a){b.addCue(a)},c.onparsingerror=function(a){d.push(a)},c.onflush=function(){b.trigger({type:"loadeddata",target:b})},c.parse(a),d.length>0&&(console.groupCollapsed,d.forEach(function(a){return n["default"].error(a)}),console.groupEnd),c.flush()},B=function(a,b){var c={uri:a},d=t.isCrossOrigin(a);d&&(c.cors=d),v["default"](c,k.bind(this,function(a,c,d){return a?n["default"].error(a,c):(b.loaded_=!0,void("function"!=typeof q["default"].WebVTT?b.tech_&&!function(){var a=function(){return A(d,b)};b.tech_.on("vttjsloaded",a),b.tech_.on("vttjserror",function(){n["default"].error("vttjs failed to load, stopping trying to process "+b.src),b.tech_.off("vttjsloaded",a)})}():A(d,b)))}))},C=function(a){function b(){var c=arguments.length<=0||void 0===arguments[0]?{}:arguments[0];if(f(this,b),!c.tech)throw new Error("A tech was not provided.");var d=x["default"](c,{kind:l.TextTrackKind[c.kind]||"subtitles",language:c.language||c.srclang||""}),e=l.TextTrackMode[d.mode]||"disabled",g=d["default"];("metadata"===d.kind||"chapters"===d.kind)&&(e="hidden");var h=a.call(this,d);if(h.tech_=d.tech,z.IS_IE8)for(var j in b.prototype)"constructor"!==j&&(h[j]=b.prototype[j]);h.cues_=[],h.activeCues_=[];var m=new i["default"](h.cues_),n=new i["default"](h.activeCues_),o=!1,p=k.bind(h,function(){this.activeCues,o&&(this.trigger("cuechange"),o=!1)});return"disabled"!==e&&h.tech_.on("timeupdate",p),Object.defineProperty(h,"default",{get:function(){return g},set:function(){}}),Object.defineProperty(h,"mode",{get:function(){return e},set:function(a){l.TextTrackMode[a]&&(e=a,"showing"===e&&this.tech_.on("timeupdate",p),this.trigger("modechange"))}}),Object.defineProperty(h,"cues",{get:function(){return this.loaded_?m:null},set:function(){}}),Object.defineProperty(h,"activeCues",{get:function(){if(!this.loaded_)return null;if(0===this.cues.length)return n;for(var a=this.tech_.currentTime(),b=[],c=0,d=this.cues.length;d>c;c++){var e=this.cues[c];e.startTime<=a&&e.endTime>=a?b.push(e):e.startTime===e.endTime&&e.startTime<=a&&e.startTime+.5>=a&&b.push(e)}if(o=!1,b.length!==this.activeCues_.length)o=!0;else for(var c=0;c<b.length;c++)-1===this.activeCues_.indexOf(b[c])&&(o=!0);return this.activeCues_=b,n.setCues_(this.activeCues_),n},set:function(){}}),d.src?(h.src=d.src,B(d.src,h)):h.loaded_=!0,h}return g(b,a),b.prototype.addCue=function(a){var b=this.tech_.textTracks();if(b)for(var c=0;c<b.length;c++)b[c]!==this&&b[c].removeCue(a);this.cues_.push(a),this.cues.setCues_(this.cues_)},b.prototype.removeCue=function(a){for(var b=!1,c=0,d=this.cues_.length;d>c;c++){var e=this.cues_[c];e===a&&(this.cues_.splice(c,1),b=!0)}b&&this.cues.setCues_(this.cues_)},b}(s["default"]);C.prototype.allowedEvents_={cuechange:"cuechange"},c["default"]=C,b.exports=c["default"]},{"../utils/browser.js":140,"../utils/fn.js":145,"../utils/log.js":148,"../utils/merge-options":149,"../utils/url.js":153,"./text-track-cue-list":129,"./track-enums":135,"./track.js":137,"global/document":1,"global/window":2,xhr:56}],135:[function(a,b,c){"use strict";c.__esModule=!0;var d={alternative:"alternative",captions:"captions",main:"main",sign:"sign",subtitles:"subtitles",commentary:"commentary"},e={alternative:"alternative",descriptions:"descriptions",main:"main","main-desc":"main-desc",translation:"translation",commentary:"commentary"},f={subtitles:"subtitles",captions:"captions",descriptions:"descriptions",chapters:"chapters",metadata:"metadata"},g={disabled:"disabled",hidden:"hidden",showing:"showing"};c["default"]={VideoTrackKind:d,AudioTrackKind:e,TextTrackKind:f,TextTrackMode:g},b.exports=c["default"]},{}],136:[function(a,b,c){"use strict";function d(a){if(a&&a.__esModule)return a;var b={};if(null!=a)for(var c in a)Object.prototype.hasOwnProperty.call(a,c)&&(b[c]=a[c]);return b["default"]=a,b}function e(a){return a&&a.__esModule?a:{"default":a}}function f(a,b){if(!(a instanceof b))throw new TypeError("Cannot call a class as a function")}function g(a,b){if("function"!=typeof b&&null!==b)throw new TypeError("Super expression must either be null or a function, not "+typeof b);a.prototype=Object.create(b&&b.prototype,{constructor:{value:a,enumerable:!1,writable:!0,configurable:!0}}),b&&(Object.setPrototypeOf?Object.setPrototypeOf(a,b):a.__proto__=b)}c.__esModule=!0;var h=a("../event-target"),i=e(h),j=a("../utils/fn.js"),k=(d(j),a("../utils/browser.js")),l=d(k),m=a("global/document"),n=e(m),o=function(a){function b(){var c=arguments.length<=0||void 0===arguments[0]?[]:arguments[0],d=arguments.length<=1||void 0===arguments[1]?null:arguments[1];if(f(this,b),a.call(this),!d&&(d=this,l.IS_IE8)){d=n["default"].createElement("custom");for(var e in b.prototype)"constructor"!==e&&(d[e]=b.prototype[e])}d.tracks_=[],Object.defineProperty(d,"length",{get:function(){return this.tracks_.length}});for(var g=0;g<c.length;g++)d.addTrack_(c[g]);return d}return g(b,a),b.prototype.addTrack_=function(a){var b=this.tracks_.length;""+b in this||Object.defineProperty(this,b,{get:function(){return this.tracks_[b]}}),-1===this.tracks_.indexOf(a)&&(this.tracks_.push(a),this.trigger({track:a,type:"addtrack"}))},b.prototype.removeTrack_=function(a){for(var b=void 0,c=0,d=this.length;d>c;c++)if(this[c]===a){b=this[c],b.off&&b.off(),this.tracks_.splice(c,1);break}b&&this.trigger({track:b,type:"removetrack"})},b.prototype.getTrackById=function(a){for(var b=null,c=0,d=this.length;d>c;c++){var e=this[c];if(e.id===a){b=e;break}}return b},b}(i["default"]);o.prototype.allowedEvents_={change:"change",addtrack:"addtrack",removetrack:"removetrack"};for(var p in o.prototype.allowedEvents_)o.prototype["on"+p]=null;c["default"]=o,b.exports=c["default"]},{"../event-target":104,"../utils/browser.js":140,"../utils/fn.js":145,"global/document":1}],137:[function(a,b,c){"use strict";function d(a){return a&&a.__esModule?a:{"default":a}}function e(a){if(a&&a.__esModule)return a;var b={};if(null!=a)for(var c in a)Object.prototype.hasOwnProperty.call(a,c)&&(b[c]=a[c]);return b["default"]=a,b}function f(a,b){if(!(a instanceof b))throw new TypeError("Cannot call a class as a function")}function g(a,b){if("function"!=typeof b&&null!==b)throw new TypeError("Super expression must either be null or a function, not "+typeof b);a.prototype=Object.create(b&&b.prototype,{constructor:{value:a,enumerable:!1,writable:!0,configurable:!0}}),b&&(Object.setPrototypeOf?Object.setPrototypeOf(a,b):a.__proto__=b)}c.__esModule=!0;var h=a("../utils/browser.js"),i=e(h),j=a("global/document"),k=d(j),l=a("../utils/guid.js"),m=e(l),n=a("../event-target"),o=d(n),p=function(a){function b(){var c=arguments.length<=0||void 0===arguments[0]?{}:arguments[0];f(this,b),a.call(this);var d=this;if(i.IS_IE8){d=k["default"].createElement("custom");for(var e in b.prototype)"constructor"!==e&&(d[e]=b.prototype[e])}var g={id:c.id||"vjs_track_"+m.newGUID(),kind:c.kind||"",label:c.label||"",language:c.language||""},h=function(a){Object.defineProperty(d,a,{get:function(){return g[a]},set:function(){}})};for(var j in g)h(j);return d}return g(b,a),b}(o["default"]);c["default"]=p,b.exports=c["default"]},{"../event-target":104,"../utils/browser.js":140,"../utils/guid.js":147,"global/document":1}],138:[function(a,b,c){"use strict";function d(a){if(a&&a.__esModule)return a;var b={};if(null!=a)for(var c in a)Object.prototype.hasOwnProperty.call(a,c)&&(b[c]=a[c]);return b["default"]=a,b}function e(a){return a&&a.__esModule?a:{"default":a}}function f(a,b){if(!(a instanceof b))throw new TypeError("Cannot call a class as a function")}function g(a,b){if("function"!=typeof b&&null!==b)throw new TypeError("Super expression must either be null or a function, not "+typeof b);a.prototype=Object.create(b&&b.prototype,{constructor:{value:a,enumerable:!1,writable:!0,configurable:!0}}),b&&(Object.setPrototypeOf?Object.setPrototypeOf(a,b):a.__proto__=b)}c.__esModule=!0;var h=a("./track-list"),i=e(h),j=a("../utils/browser.js"),k=d(j),l=a("global/document"),m=e(l),n=function(a,b){for(var c=0;c<a.length;c++)b.id!==a[c].id&&(a[c].selected=!1)},o=function(a){function b(){var c=arguments.length<=0||void 0===arguments[0]?[]:arguments[0];f(this,b);for(var d=void 0,e=c.length-1;e>=0;e--)if(c[e].selected){n(c,c[e]);break}if(k.IS_IE8){d=m["default"].createElement("custom");for(var g in i["default"].prototype)"constructor"!==g&&(d[g]=i["default"].prototype[g]);for(var g in b.prototype)"constructor"!==g&&(d[g]=b.prototype[g])}return d=a.call(this,c,d),d.changing_=!1,Object.defineProperty(d,"selectedIndex",{get:function(){for(var a=0;a<this.length;a++)if(this[a].selected)return a;return-1},set:function(){}}),d}return g(b,a),b.prototype.addTrack_=function(b){var c=this;b.selected&&n(this,b),a.prototype.addTrack_.call(this,b),b.addEventListener&&b.addEventListener("selectedchange",function(){c.changing_||(c.changing_=!0,n(c,b),c.changing_=!1,c.trigger("change"))})},b.prototype.addTrack=function(a){this.addTrack_(a)},b.prototype.removeTrack=function(b){a.prototype.removeTrack_.call(this,b)},b}(i["default"]);c["default"]=o,b.exports=c["default"]},{"../utils/browser.js":140,"./track-list":136,"global/document":1}],139:[function(a,b,c){"use strict";function d(a){if(a&&a.__esModule)return a;var b={};if(null!=a)for(var c in a)Object.prototype.hasOwnProperty.call(a,c)&&(b[c]=a[c]);return b["default"]=a,b}function e(a){return a&&a.__esModule?a:{"default":a}}function f(a,b){if(!(a instanceof b))throw new TypeError("Cannot call a class as a function")}function g(a,b){if("function"!=typeof b&&null!==b)throw new TypeError("Super expression must either be null or a function, not "+typeof b);a.prototype=Object.create(b&&b.prototype,{constructor:{value:a,enumerable:!1,writable:!0,configurable:!0}}),b&&(Object.setPrototypeOf?Object.setPrototypeOf(a,b):a.__proto__=b)}c.__esModule=!0;var h=a("./track-enums"),i=a("./track"),j=e(i),k=a("../utils/merge-options"),l=e(k),m=a("../utils/browser.js"),n=d(m),o=function(a){function b(){var c=arguments.length<=0||void 0===arguments[0]?{}:arguments[0];f(this,b);var d=l["default"](c,{kind:h.VideoTrackKind[c.kind]||""}),e=a.call(this,d),g=!1;if(n.IS_IE8)for(var i in b.prototype)"constructor"!==i&&(e[i]=b.prototype[i]);return Object.defineProperty(e,"selected",{get:function(){return g},set:function(a){"boolean"==typeof a&&a!==g&&(g=a,this.trigger("selectedchange"))}}),d.selected&&(e.selected=d.selected),e}return g(b,a),b}(j["default"]);c["default"]=o,b.exports=c["default"]},{"../utils/browser.js":140,"../utils/merge-options":149,"./track":137,"./track-enums":135}],140:[function(a,b,c){"use strict";function d(a){return a&&a.__esModule?a:{"default":a}}c.__esModule=!0;var e=a("global/document"),f=d(e),g=a("global/window"),h=d(g),i=h["default"].navigator.userAgent,j=/AppleWebKit\/([\d.]+)/i.exec(i),k=j?parseFloat(j.pop()):null,l=/iPad/i.test(i);c.IS_IPAD=l;var m=/iPhone/i.test(i)&&!l;c.IS_IPHONE=m;var n=/iPod/i.test(i);c.IS_IPOD=n;var o=m||l||n;c.IS_IOS=o;var p=function(){var a=i.match(/OS (\d+)_/i);return a&&a[1]?a[1]:void 0}();c.IOS_VERSION=p;var q=/Android/i.test(i);c.IS_ANDROID=q;var r=function(){var a,b,c=i.match(/Android (\d+)(?:\.(\d+))?(?:\.(\d+))*/i);return c?(a=c[1]&&parseFloat(c[1]),b=c[2]&&parseFloat(c[2]),a&&b?parseFloat(c[1]+"."+c[2]):a?a:null):null}();c.ANDROID_VERSION=r;var s=q&&/webkit/i.test(i)&&2.3>r;c.IS_OLD_ANDROID=s;var t=q&&5>r&&537>k;c.IS_NATIVE_ANDROID=t;var u=/Firefox/i.test(i);c.IS_FIREFOX=u;var v=/Edge/i.test(i);c.IS_EDGE=v;var w=!v&&/Chrome/i.test(i);c.IS_CHROME=w;var x=/MSIE\s8\.0/.test(i);c.IS_IE8=x;var y=!!("ontouchstart"in h["default"]||h["default"].DocumentTouch&&f["default"]instanceof h["default"].DocumentTouch);c.TOUCH_ENABLED=y;var z="backgroundSize"in f["default"].createElement("video").style;c.BACKGROUND_SIZE_SUPPORTED=z},{"global/document":1,"global/window":2}],141:[function(a,b,c){"use strict";function d(a,b){var c,d,f=0;if(!b)return 0;a&&a.length||(a=e.createTimeRange(0,0));for(var g=0;g<a.length;g++)c=a.start(g),d=a.end(g),d>b&&(d=b),f+=d-c;return f/b}c.__esModule=!0,c.bufferedPercent=d;var e=a("./time-ranges.js")},{"./time-ranges.js":151}],142:[function(a,b,c){"use strict";function d(a){return a&&a.__esModule?a:{"default":a}}c.__esModule=!0;var e=a("./log.js"),f=d(e),g={get:function(a,b){return a[b]},set:function(a,b,c){return a[b]=c,!0}};c["default"]=function(a){var b=arguments.length<=1||void 0===arguments[1]?{}:arguments[1];if("function"==typeof Proxy){var c=function(){var c={};return Object.keys(b).forEach(function(a){g.hasOwnProperty(a)&&(c[a]=function(){return f["default"].warn(b[a]),g[a].apply(this,arguments)})}),{v:new Proxy(a,c)}}();if("object"==typeof c)return c.v}return a},b.exports=c["default"]},{"./log.js":148}],143:[function(a,b,c){"use strict";function d(a){if(a&&a.__esModule)return a;var b={};if(null!=a)for(var c in a)Object.prototype.hasOwnProperty.call(a,c)&&(b[c]=a[c]);return b["default"]=a,b}function e(a){return a&&a.__esModule?a:{"default":a}}function f(a,b){return a.raw=b,a}function g(a){return"string"==typeof a&&/\S/.test(a)}function h(a){if(/\s/.test(a))throw new Error("class has illegal whitespace characters")}function i(a){return new RegExp("(^|\\s)"+a+"($|\\s)")}function j(a){return function(b,c){return g(b)?(g(c)&&(c=J["default"].querySelector(c)),(B(c)?c:J["default"])[a](b)):J["default"][a](null)}}function k(a){return 0===a.indexOf("#")&&(a=a.slice(1)),J["default"].getElementById(a)}function l(){var a=arguments.length<=0||void 0===arguments[0]?"div":arguments[0],b=arguments.length<=1||void 0===arguments[1]?{}:arguments[1],c=arguments.length<=2||void 0===arguments[2]?{}:arguments[2],d=J["default"].createElement(a);return Object.getOwnPropertyNames(b).forEach(function(a){var c=b[a];-1!==a.indexOf("aria-")||"role"===a||"type"===a?(P["default"].warn(R["default"](H,a,c)),d.setAttribute(a,c)):d[a]=c}),Object.getOwnPropertyNames(c).forEach(function(a){c[a];d.setAttribute(a,c[a])}),d}function m(a,b){"undefined"==typeof a.textContent?a.innerText=b:a.textContent=b}function n(a,b){b.firstChild?b.insertBefore(a,b.firstChild):b.appendChild(a)}function o(a){var b=a[T];return b||(b=a[T]=N.newGUID()),S[b]||(S[b]={}),S[b]}function p(a){var b=a[T];return b?!!Object.getOwnPropertyNames(S[b]).length:!1}function q(a){var b=a[T];if(b){delete S[b];try{delete a[T]}catch(c){a.removeAttribute?a.removeAttribute(T):a[T]=null}}}function r(a,b){return a.classList?a.classList.contains(b):(h(b),i(b).test(a.className))}function s(a,b){return a.classList?a.classList.add(b):r(a,b)||(a.className=(a.className+" "+b).trim()),a}function t(a,b){return a.classList?a.classList.remove(b):(h(b),a.className=a.className.split(/\s+/).filter(function(a){return a!==b}).join(" ")),a}function u(a,b,c){var d=r(a,b);return"function"==typeof c&&(c=c(a,b)),"boolean"!=typeof c&&(c=!d),c!==d?(c?s(a,b):t(a,b),a):void 0}function v(a,b){Object.getOwnPropertyNames(b).forEach(function(c){var d=b[c];null===d||"undefined"==typeof d||d===!1?a.removeAttribute(c):a.setAttribute(c,d===!0?"":d)})}function w(a){var b,c,d,e,f;if(b={},c=",autoplay,controls,loop,muted,default,",a&&a.attributes&&a.attributes.length>0){d=a.attributes;for(var g=d.length-1;g>=0;g--)e=d[g].name,f=d[g].value,("boolean"==typeof a[e]||-1!==c.indexOf(","+e+","))&&(f=null!==f?!0:!1),b[e]=f}return b}function x(){J["default"].body.focus(),J["default"].onselectstart=function(){return!1}}function y(){J["default"].onselectstart=function(){return!0}}function z(a){var b=void 0;if(a.getBoundingClientRect&&a.parentNode&&(b=a.getBoundingClientRect()),!b)return{left:0,top:0};var c=J["default"].documentElement,d=J["default"].body,e=c.clientLeft||d.clientLeft||0,f=L["default"].pageXOffset||d.scrollLeft,g=b.left+f-e,h=c.clientTop||d.clientTop||0,i=L["default"].pageYOffset||d.scrollTop,j=b.top+i-h;return{left:Math.round(g),top:Math.round(j)}}function A(a,b){var c={},d=z(a),e=a.offsetWidth,f=a.offsetHeight,g=d.top,h=d.left,i=b.pageY,j=b.pageX;return b.changedTouches&&(j=b.changedTouches[0].pageX,i=b.changedTouches[0].pageY),c.y=Math.max(0,Math.min(1,(g-i+f)/f)),c.x=Math.max(0,Math.min(1,(j-h)/e)),c}function B(a){return!!a&&"object"==typeof a&&1===a.nodeType}function C(a){return!!a&&"object"==typeof a&&3===a.nodeType}function D(a){for(;a.firstChild;)a.removeChild(a.firstChild);return a}function E(a){return"function"==typeof a&&(a=a()),(Array.isArray(a)?a:[a]).map(function(a){return"function"==typeof a&&(a=a()),B(a)||C(a)?a:"string"==typeof a&&/\S/.test(a)?J["default"].createTextNode(a):void 0}).filter(function(a){return a})}function F(a,b){return E(b).forEach(function(b){return a.appendChild(b)}),a}function G(a,b){return F(D(a),b)}c.__esModule=!0,c.getEl=k,c.createEl=l,c.textContent=m,c.insertElFirst=n,c.getElData=o,c.hasElData=p,c.removeElData=q,c.hasElClass=r,c.addElClass=s,c.removeElClass=t,c.toggleElClass=u,c.setElAttributes=v,c.getElAttributes=w,c.blockTextSelection=x,c.unblockTextSelection=y,c.findElPosition=z,c.getPointerPosition=A,c.isEl=B,c.isTextNode=C,c.emptyEl=D,c.normalizeContent=E,c.appendContent=F,c.insertContent=G;var H=f(["Setting attributes in the second argument of createEl()\n                has been deprecated. Use the third argument instead.\n                createEl(type, properties, attributes). Attempting to set "," to ","."],["Setting attributes in the second argument of createEl()\n                has been deprecated. Use the third argument instead.\n                createEl(type, properties, attributes). Attempting to set "," to ","."]),I=a("global/document"),J=e(I),K=a("global/window"),L=e(K),M=a("./guid.js"),N=d(M),O=a("./log.js"),P=e(O),Q=a("tsml"),R=e(Q),S={},T="vdata"+(new Date).getTime(),U=j("querySelector");c.$=U;var V=j("querySelectorAll");c.$$=V},{"./guid.js":147,"./log.js":148,"global/document":1,"global/window":2,tsml:55}],144:[function(a,b,c){"use strict";function d(a){return a&&a.__esModule?a:{"default":a}}function e(a){if(a&&a.__esModule)return a;var b={};if(null!=a)for(var c in a)Object.prototype.hasOwnProperty.call(a,c)&&(b[c]=a[c]);return b["default"]=a,b}function f(a,b,c){if(Array.isArray(b))return l(f,a,b,c);var d=n.getElData(a);d.handlers||(d.handlers={}),d.handlers[b]||(d.handlers[b]=[]),c.guid||(c.guid=p.newGUID()),d.handlers[b].push(c),d.dispatcher||(d.disabled=!1,d.dispatcher=function(b,c){if(!d.disabled){b=j(b);var e=d.handlers[b.type];if(e)for(var f=e.slice(0),g=0,h=f.length;h>g&&!b.isImmediatePropagationStopped();g++)f[g].call(a,b,c)}}),1===d.handlers[b].length&&(a.addEventListener?a.addEventListener(b,d.dispatcher,!1):a.attachEvent&&a.attachEvent("on"+b,d.dispatcher))}function g(a,b,c){if(n.hasElData(a)){var d=n.getElData(a);if(d.handlers){if(Array.isArray(b))return l(g,a,b,c);var e=function(b){d.handlers[b]=[],k(a,b)};if(b){var f=d.handlers[b];if(f){if(!c)return void e(b);if(c.guid)for(var h=0;h<f.length;h++)f[h].guid===c.guid&&f.splice(h--,1);k(a,b)}}else for(var i in d.handlers)e(i)}}}function h(a,b,c){var d=n.hasElData(a)?n.getElData(a):{},e=a.parentNode||a.ownerDocument;if("string"==typeof b&&(b={type:b,target:a}),b=j(b),d.dispatcher&&d.dispatcher.call(a,b,c),e&&!b.isPropagationStopped()&&b.bubbles===!0)h.call(null,e,b,c);else if(!e&&!b.defaultPrevented){var f=n.getElData(b.target);b.target[b.type]&&(f.disabled=!0,"function"==typeof b.target[b.type]&&b.target[b.type](),f.disabled=!1)}return!b.defaultPrevented}function i(a,b,c){if(Array.isArray(b))return l(i,a,b,c);var d=function e(){g(a,b,e),c.apply(this,arguments)};d.guid=c.guid=c.guid||p.newGUID(),f(a,b,d)}function j(a){function b(){return!0}function c(){return!1}if(!a||!a.isPropagationStopped){var d=a||r["default"].event;a={};for(var e in d)"layerX"!==e&&"layerY"!==e&&"keyLocation"!==e&&"webkitMovementX"!==e&&"webkitMovementY"!==e&&("returnValue"===e&&d.preventDefault||(a[e]=d[e]));if(a.target||(a.target=a.srcElement||t["default"]),a.relatedTarget||(a.relatedTarget=a.fromElement===a.target?a.toElement:a.fromElement),a.preventDefault=function(){d.preventDefault&&d.preventDefault(),a.returnValue=!1,d.returnValue=!1,a.defaultPrevented=!0},a.defaultPrevented=!1,a.stopPropagation=function(){d.stopPropagation&&d.stopPropagation(),a.cancelBubble=!0,d.cancelBubble=!0,a.isPropagationStopped=b},a.isPropagationStopped=c,a.stopImmediatePropagation=function(){d.stopImmediatePropagation&&d.stopImmediatePropagation(),a.isImmediatePropagationStopped=b,a.stopPropagation()},a.isImmediatePropagationStopped=c,null!=a.clientX){var f=t["default"].documentElement,g=t["default"].body;a.pageX=a.clientX+(f&&f.scrollLeft||g&&g.scrollLeft||0)-(f&&f.clientLeft||g&&g.clientLeft||0),a.pageY=a.clientY+(f&&f.scrollTop||g&&g.scrollTop||0)-(f&&f.clientTop||g&&g.clientTop||0)}a.which=a.charCode||a.keyCode,null!=a.button&&(a.button=1&a.button?0:4&a.button?1:2&a.button?2:0)}return a}function k(a,b){var c=n.getElData(a);0===c.handlers[b].length&&(delete c.handlers[b],a.removeEventListener?a.removeEventListener(b,c.dispatcher,!1):a.detachEvent&&a.detachEvent("on"+b,c.dispatcher)),Object.getOwnPropertyNames(c.handlers).length<=0&&(delete c.handlers,delete c.dispatcher,delete c.disabled),0===Object.getOwnPropertyNames(c).length&&n.removeElData(a)}function l(a,b,c,d){c.forEach(function(c){a(b,c,d)})}c.__esModule=!0,c.on=f,c.off=g,c.trigger=h,c.one=i,c.fixEvent=j;var m=a("./dom.js"),n=e(m),o=a("./guid.js"),p=e(o),q=a("global/window"),r=d(q),s=a("global/document"),t=d(s)},{"./dom.js":143,"./guid.js":147,"global/document":1,"global/window":2}],145:[function(a,b,c){"use strict";c.__esModule=!0;var d=a("./guid.js"),e=function(a,b,c){b.guid||(b.guid=d.newGUID());var e=function(){return b.apply(a,arguments)};return e.guid=c?c+"_"+b.guid:b.guid,e};c.bind=e},{"./guid.js":147}],146:[function(a,b,c){"use strict";function d(a){var b=arguments.length<=1||void 0===arguments[1]?a:arguments[1];return function(){a=0>a?0:a;var c=Math.floor(a%60),d=Math.floor(a/60%60),e=Math.floor(a/3600),f=Math.floor(b/60%60),g=Math.floor(b/3600);return(isNaN(a)||a===1/0)&&(e=d=c="-"),e=e>0||g>0?e+":":"",d=((e||f>=10)&&10>d?"0"+d:d)+":",c=10>c?"0"+c:c,e+d+c}()}c.__esModule=!0,c["default"]=d,b.exports=c["default"]},{}],147:[function(a,b,c){"use strict";function d(){return e++}c.__esModule=!0,c.newGUID=d;var e=1},{}],148:[function(a,b,c){"use strict";function d(a){return a&&a.__esModule?a:{"default":a}}function e(a,b){var c=Array.prototype.slice.call(b),d=function(){},e=g["default"].console||{log:d,warn:d,error:d};a?c.unshift(a.toUpperCase()+":"):a="log",h.history.push(c),c.unshift("VIDEOJS:"),e[a].apply?e[a].apply(e,c):e[a](c.join(" "))}c.__esModule=!0;var f=a("global/window"),g=d(f),h=function(){e(null,arguments)};h.history=[],h.error=function(){e("error",arguments)},h.warn=function(){e("warn",arguments)},c["default"]=h,b.exports=c["default"]},{"global/window":2}],149:[function(a,b,c){"use strict";function d(a){return a&&a.__esModule?a:{"default":a}}function e(a){return!!a&&"object"==typeof a&&"[object Object]"===a.toString()&&a.constructor===Object}function f(){var a=Array.prototype.slice.call(arguments);return a.unshift({}),a.push(i),h["default"].apply(null,a),a[0]}c.__esModule=!0,c["default"]=f;var g=a("lodash-compat/object/merge"),h=d(g),i=function(a,b){return e(b)?e(a)?void 0:f(b):b};b.exports=c["default"]},{"lodash-compat/object/merge":40}],150:[function(a,b,c){"use strict";function d(a){return a&&a.__esModule?a:{"default":a}}c.__esModule=!0;var e=a("global/document"),f=d(e),g=function(a){var b=f["default"].createElement("style");return b.className=a,b};c.createStyleElement=g;var h=function(a,b){a.styleSheet?a.styleSheet.cssText=b:a.textContent=b};c.setTextContent=h},{"global/document":1}],151:[function(a,b,c){"use strict";function d(a){return a&&a.__esModule?a:{"default":a}}function e(a,b){return Array.isArray(a)?f(a):void 0===a||void 0===b?f():f([[a,b]])}function f(a){return void 0===a||0===a.length?{length:0,start:function(){throw new Error("This TimeRanges object is empty")},end:function(){throw new Error("This TimeRanges object is empty")}}:{length:a.length,start:g.bind(null,"start",0,a),end:g.bind(null,"end",1,a)}}function g(a,b,c,d){return void 0===d&&(j["default"].warn("DEPRECATED: Function '"+a+"' on 'TimeRanges' called without an index argument."),d=0),h(a,d,c.length-1),c[d][b]}function h(a,b,c){if(0>b||b>c)throw new Error("Failed to execute '"+a+"' on 'TimeRanges': The index provided ("+b+") is greater than or equal to the maximum bound ("+c+").")}c.__esModule=!0,c.createTimeRanges=e;var i=a("./log.js"),j=d(i);c.createTimeRange=e},{"./log.js":148}],152:[function(a,b,c){"use strict";function d(a){return a.charAt(0).toUpperCase()+a.slice(1)}c.__esModule=!0,c["default"]=d,b.exports=c["default"]},{}],153:[function(a,b,c){"use strict";function d(a){return a&&a.__esModule?a:{"default":a}}c.__esModule=!0;var e=a("global/document"),f=d(e),g=a("global/window"),h=d(g),i=function(a){var b=["protocol","hostname","port","pathname","search","hash","host"],c=f["default"].createElement("a");c.href=a;var d=""===c.host&&"file:"!==c.protocol,e=void 0;d&&(e=f["default"].createElement("div"),e.innerHTML='<a href="'+a+'"></a>',c=e.firstChild,e.setAttribute("style","display:none; position:absolute;"),f["default"].body.appendChild(e));for(var g={},h=0;h<b.length;h++)g[b[h]]=c[b[h]];return"http:"===g.protocol&&(g.host=g.host.replace(/:80$/,"")),"https:"===g.protocol&&(g.host=g.host.replace(/:443$/,"")),d&&f["default"].body.removeChild(e),g};c.parseUrl=i;var j=function(a){if(!a.match(/^https?:\/\//)){var b=f["default"].createElement("div");b.innerHTML='<a href="'+a+'">x</a>',a=b.firstChild.href}return a};c.getAbsoluteURL=j;var k=function(a){if("string"==typeof a){var b=/^(\/?)([\s\S]*?)((?:\.{1,2}|[^\/]+?)(\.([^\.\/\?]+)))(?:[\/]*|[\?].*)$/i,c=b.exec(a);if(c)return c.pop().toLowerCase()}return""};c.getFileExtension=k;var l=function(a){var b=h["default"].location,c=i(a),d=":"===c.protocol?b.protocol:c.protocol,e=d+c.host!==b.protocol+b.host;return e};c.isCrossOrigin=l},{"global/document":1,"global/window":2}],154:[function(b,c,d){"use strict";function e(a){if(a&&a.__esModule)return a;var b={};if(null!=a)for(var c in a)Object.prototype.hasOwnProperty.call(a,c)&&(b[c]=a[c]);return b["default"]=a,b}function f(a){return a&&a.__esModule?a:{"default":a}}d.__esModule=!0;{var g=b("global/window"),h=f(g),i=b("global/document"),j=f(i),k=b("./setup"),l=e(k),m=b("./utils/stylesheet.js"),n=e(m),o=b("./component"),p=f(o),q=b("./event-target"),r=f(q),s=b("./utils/events.js"),t=e(s),u=b("./player"),v=f(u),w=b("./plugins.js"),x=f(w),y=b("../../src/js/utils/merge-options.js"),z=f(y),A=b("./utils/fn.js"),B=e(A),C=b("./tracks/text-track.js"),D=f(C),E=b("./tracks/audio-track.js"),F=f(E),G=b("./tracks/video-track.js"),H=f(G),I=b("object.assign"),J=(f(I),b("./utils/time-ranges.js")),K=b("./utils/format-time.js"),L=f(K),M=b("./utils/log.js"),N=f(M),O=b("./utils/dom.js"),P=e(O),Q=b("./utils/browser.js"),R=e(Q),S=b("./utils/url.js"),T=e(S),U=b("./extend.js"),V=f(U),W=b("lodash-compat/object/merge"),X=f(W),Y=b("./utils/create-deprecation-proxy.js"),Z=f(Y),$=b("xhr"),_=f($),aa=b("./tech/tech.js"),ba=f(aa),ca=b("./tech/html5.js"),da=(f(ca),b("./tech/flash.js"));f(da)}"undefined"==typeof HTMLVideoElement&&(j["default"].createElement("video"),j["default"].createElement("audio"),j["default"].createElement("track"));var ea=function ha(a,b,c){var d=void 0;if("string"==typeof a){if(0===a.indexOf("#")&&(a=a.slice(1)),ha.getPlayers()[a])return b&&N["default"].warn('Player "'+a+'" is already initialised. Options will not be applied.'),c&&ha.getPlayers()[a].ready(c),ha.getPlayers()[a];d=P.getEl(a)}else d=a;if(!d||!d.nodeName)throw new TypeError("The element or ID supplied is not valid. (videojs)");return d.player||v["default"].players[d.playerId]||new v["default"](d,b,c)};if(h["default"].VIDEOJS_NO_DYNAMIC_STYLE!==!0){var fa=P.$(".vjs-styles-defaults");if(!fa){fa=n.createStyleElement("vjs-styles-defaults");var ga=P.$("head");ga.insertBefore(fa,ga.firstChild),n.setTextContent(fa,"\n      .video-js {\n        width: 300px;\n        height: 150px;\n      }\n\n      .vjs-fluid {\n        padding-top: 56.25%\n      }\n    ")}}l.autoSetupTimeout(1,ea),ea.VERSION="5.10.4",ea.options=v["default"].prototype.options_,ea.getPlayers=function(){return v["default"].players},ea.players=Z["default"](v["default"].players,{get:"Access to videojs.players is deprecated; use videojs.getPlayers instead",set:"Modification of videojs.players is deprecated"}),ea.getComponent=p["default"].getComponent,ea.registerComponent=function(a,b){ba["default"].isTech(b)&&N["default"].warn("The "+a+" tech was registered as a component. It should instead be registered using videojs.registerTech(name, tech)"),p["default"].registerComponent.call(p["default"],a,b)},ea.getTech=ba["default"].getTech,ea.registerTech=ba["default"].registerTech,ea.browser=R,ea.TOUCH_ENABLED=R.TOUCH_ENABLED,ea.extend=V["default"],ea.mergeOptions=z["default"],ea.bind=B.bind,ea.plugin=x["default"],ea.addLanguage=function(a,b){var c;return a=(""+a).toLowerCase(),X["default"](ea.options.languages,(c={},c[a]=b,c))[a]},ea.log=N["default"],ea.createTimeRange=ea.createTimeRanges=J.createTimeRanges,ea.formatTime=L["default"],ea.parseUrl=T.parseUrl,ea.isCrossOrigin=T.isCrossOrigin,ea.EventTarget=r["default"],ea.on=t.on,ea.one=t.one,ea.off=t.off,ea.trigger=t.trigger,ea.xhr=_["default"],ea.TextTrack=D["default"],ea.AudioTrack=F["default"],ea.VideoTrack=H["default"],
ea.isEl=P.isEl,ea.isTextNode=P.isTextNode,ea.createEl=P.createEl,ea.hasClass=P.hasElClass,ea.addClass=P.addElClass,ea.removeClass=P.removeElClass,ea.toggleClass=P.toggleElClass,ea.setAttributes=P.setElAttributes,ea.getAttributes=P.getElAttributes,ea.emptyEl=P.emptyEl,ea.appendContent=P.appendContent,ea.insertContent=P.insertContent,"function"==typeof a&&a.amd?a("videojs",[],function(){return ea}):"object"==typeof d&&"object"==typeof c&&(c.exports=ea),d["default"]=ea,c.exports=d["default"]},{"../../src/js/utils/merge-options.js":149,"./component":67,"./event-target":104,"./extend.js":105,"./player":113,"./plugins.js":114,"./setup":118,"./tech/flash.js":121,"./tech/html5.js":122,"./tech/tech.js":124,"./tracks/audio-track.js":126,"./tracks/text-track.js":134,"./tracks/video-track.js":139,"./utils/browser.js":140,"./utils/create-deprecation-proxy.js":142,"./utils/dom.js":143,"./utils/events.js":144,"./utils/fn.js":145,"./utils/format-time.js":146,"./utils/log.js":148,"./utils/stylesheet.js":150,"./utils/time-ranges.js":151,"./utils/url.js":153,"global/document":1,"global/window":2,"lodash-compat/object/merge":40,"object.assign":45,xhr:56}]},{},[154])(154)}),function(a){var b=a.vttjs={},c=b.VTTCue,d=b.VTTRegion,e=a.VTTCue,f=a.VTTRegion;b.shim=function(){b.VTTCue=c,b.VTTRegion=d},b.restore=function(){b.VTTCue=e,b.VTTRegion=f}}(this),function(a,b){function c(a){if("string"!=typeof a)return!1;var b=h[a.toLowerCase()];return b?a.toLowerCase():!1}function d(a){if("string"!=typeof a)return!1;var b=i[a.toLowerCase()];return b?a.toLowerCase():!1}function e(a){for(var b=1;b<arguments.length;b++){var c=arguments[b];for(var d in c)a[d]=c[d]}return a}function f(a,b,f){var h=this,i=/MSIE\s8\.0/.test(navigator.userAgent),j={};i?h=document.createElement("custom"):j.enumerable=!0,h.hasBeenReset=!1;var k="",l=!1,m=a,n=b,o=f,p=null,q="",r=!0,s="auto",t="start",u=50,v="middle",w=50,x="middle";return Object.defineProperty(h,"id",e({},j,{get:function(){return k},set:function(a){k=""+a}})),Object.defineProperty(h,"pauseOnExit",e({},j,{get:function(){return l},set:function(a){l=!!a}})),Object.defineProperty(h,"startTime",e({},j,{get:function(){return m},set:function(a){if("number"!=typeof a)throw new TypeError("Start time must be set to a number.");m=a,this.hasBeenReset=!0}})),Object.defineProperty(h,"endTime",e({},j,{get:function(){return n},set:function(a){if("number"!=typeof a)throw new TypeError("End time must be set to a number.");n=a,this.hasBeenReset=!0}})),Object.defineProperty(h,"text",e({},j,{get:function(){return o},set:function(a){o=""+a,this.hasBeenReset=!0}})),Object.defineProperty(h,"region",e({},j,{get:function(){return p},set:function(a){p=a,this.hasBeenReset=!0}})),Object.defineProperty(h,"vertical",e({},j,{get:function(){return q},set:function(a){var b=c(a);if(b===!1)throw new SyntaxError("An invalid or illegal string was specified.");q=b,this.hasBeenReset=!0}})),Object.defineProperty(h,"snapToLines",e({},j,{get:function(){return r},set:function(a){r=!!a,this.hasBeenReset=!0}})),Object.defineProperty(h,"line",e({},j,{get:function(){return s},set:function(a){if("number"!=typeof a&&a!==g)throw new SyntaxError("An invalid number or illegal string was specified.");s=a,this.hasBeenReset=!0}})),Object.defineProperty(h,"lineAlign",e({},j,{get:function(){return t},set:function(a){var b=d(a);if(!b)throw new SyntaxError("An invalid or illegal string was specified.");t=b,this.hasBeenReset=!0}})),Object.defineProperty(h,"position",e({},j,{get:function(){return u},set:function(a){if(0>a||a>100)throw new Error("Position must be between 0 and 100.");u=a,this.hasBeenReset=!0}})),Object.defineProperty(h,"positionAlign",e({},j,{get:function(){return v},set:function(a){var b=d(a);if(!b)throw new SyntaxError("An invalid or illegal string was specified.");v=b,this.hasBeenReset=!0}})),Object.defineProperty(h,"size",e({},j,{get:function(){return w},set:function(a){if(0>a||a>100)throw new Error("Size must be between 0 and 100.");w=a,this.hasBeenReset=!0}})),Object.defineProperty(h,"align",e({},j,{get:function(){return x},set:function(a){var b=d(a);if(!b)throw new SyntaxError("An invalid or illegal string was specified.");x=b,this.hasBeenReset=!0}})),h.displayState=void 0,i?h:void 0}var g="auto",h={"":!0,lr:!0,rl:!0},i={start:!0,middle:!0,end:!0,left:!0,right:!0};f.prototype.getCueAsHTML=function(){return WebVTT.convertCueToDOMTree(window,this.text)},a.VTTCue=a.VTTCue||f,b.VTTCue=f}(this,this.vttjs||{}),function(a,b){function c(a){if("string"!=typeof a)return!1;var b=f[a.toLowerCase()];return b?a.toLowerCase():!1}function d(a){return"number"==typeof a&&a>=0&&100>=a}function e(){var a=100,b=3,e=0,f=100,g=0,h=100,i="";Object.defineProperties(this,{width:{enumerable:!0,get:function(){return a},set:function(b){if(!d(b))throw new Error("Width must be between 0 and 100.");a=b}},lines:{enumerable:!0,get:function(){return b},set:function(a){if("number"!=typeof a)throw new TypeError("Lines must be set to a number.");b=a}},regionAnchorY:{enumerable:!0,get:function(){return f},set:function(a){if(!d(a))throw new Error("RegionAnchorX must be between 0 and 100.");f=a}},regionAnchorX:{enumerable:!0,get:function(){return e},set:function(a){if(!d(a))throw new Error("RegionAnchorY must be between 0 and 100.");e=a}},viewportAnchorY:{enumerable:!0,get:function(){return h},set:function(a){if(!d(a))throw new Error("ViewportAnchorY must be between 0 and 100.");h=a}},viewportAnchorX:{enumerable:!0,get:function(){return g},set:function(a){if(!d(a))throw new Error("ViewportAnchorX must be between 0 and 100.");g=a}},scroll:{enumerable:!0,get:function(){return i},set:function(a){var b=c(a);if(b===!1)throw new SyntaxError("An invalid or illegal string was specified.");i=b}}})}var f={"":!0,up:!0};a.VTTRegion=a.VTTRegion||e,b.VTTRegion=e}(this,this.vttjs||{}),function(a){function b(a,b){this.name="ParsingError",this.code=a.code,this.message=b||a.message}function c(a){function b(a,b,c,d){return 3600*(0|a)+60*(0|b)+(0|c)+(0|d)/1e3}var c=a.match(/^(\d+):(\d{2})(:\d{2})?\.(\d{3})/);return c?c[3]?b(c[1],c[2],c[3].replace(":",""),c[4]):c[1]>59?b(c[1],c[2],0,c[4]):b(0,c[1],c[2],c[4]):null}function d(){this.values=o(null)}function e(a,b,c,d){var e=d?a.split(d):[a];for(var f in e)if("string"==typeof e[f]){var g=e[f].split(c);if(2===g.length){var h=g[0],i=g[1];b(h,i)}}}function f(a,f,g){function h(){var d=c(a);if(null===d)throw new b(b.Errors.BadTimeStamp,"Malformed timestamp: "+k);return a=a.replace(/^[^\sa-zA-Z-]+/,""),d}function i(a,b){var c=new d;e(a,function(a,b){switch(a){case"region":for(var d=g.length-1;d>=0;d--)if(g[d].id===b){c.set(a,g[d].region);break}break;case"vertical":c.alt(a,b,["rl","lr"]);break;case"line":var e=b.split(","),f=e[0];c.integer(a,f),c.percent(a,f)?c.set("snapToLines",!1):null,c.alt(a,f,["auto"]),2===e.length&&c.alt("lineAlign",e[1],["start","middle","end"]);break;case"position":e=b.split(","),c.percent(a,e[0]),2===e.length&&c.alt("positionAlign",e[1],["start","middle","end"]);break;case"size":c.percent(a,b);break;case"align":c.alt(a,b,["start","middle","end","left","right"])}},/:/,/\s/),b.region=c.get("region",null),b.vertical=c.get("vertical",""),b.line=c.get("line","auto"),b.lineAlign=c.get("lineAlign","start"),b.snapToLines=c.get("snapToLines",!0),b.size=c.get("size",100),b.align=c.get("align","middle"),b.position=c.get("position",{start:0,left:0,middle:50,end:100,right:100},b.align),b.positionAlign=c.get("positionAlign",{start:"start",left:"start",middle:"middle",end:"end",right:"end"},b.align)}function j(){a=a.replace(/^\s+/,"")}var k=a;if(j(),f.startTime=h(),j(),"-->"!==a.substr(0,3))throw new b(b.Errors.BadTimeStamp,"Malformed time stamp (time stamps must be separated by '-->'): "+k);a=a.substr(3),j(),f.endTime=h(),j(),i(a,f)}function g(a,b){function d(){function a(a){return b=b.substr(a.length),a}if(!b)return null;var c=b.match(/^([^<]*)(<[^>]+>?)?/);return a(c[1]?c[1]:c[2])}function e(a){return p[a]}function f(a){for(;o=a.match(/&(amp|lt|gt|lrm|rlm|nbsp);/);)a=a.replace(o[0],e);return a}function g(a,b){return!s[b.localName]||s[b.localName]===a.localName}function h(b,c){var d=q[b];if(!d)return null;var e=a.document.createElement(d);e.localName=d;var f=r[b];return f&&c&&(e[f]=c.trim()),e}for(var i,j=a.document.createElement("div"),k=j,l=[];null!==(i=d());)if("<"!==i[0])k.appendChild(a.document.createTextNode(f(i)));else{if("/"===i[1]){l.length&&l[l.length-1]===i.substr(2).replace(">","")&&(l.pop(),k=k.parentNode);continue}var m,n=c(i.substr(1,i.length-2));if(n){m=a.document.createProcessingInstruction("timestamp",n),k.appendChild(m);continue}var o=i.match(/^<([^.\s\/0-9>]+)(\.[^\s\\>]+)?([^>\\]+)?(\\?)>?$/);if(!o)continue;if(m=h(o[1],o[3]),!m)continue;if(!g(k,m))continue;o[2]&&(m.className=o[2].substr(1).replace("."," ")),l.push(o[1]),k.appendChild(m),k=m}return j}function h(a){function b(a,b){for(var c=b.childNodes.length-1;c>=0;c--)a.push(b.childNodes[c])}function c(a){if(!a||!a.length)return null;var d=a.pop(),e=d.textContent||d.innerText;if(e){var f=e.match(/^.*(\n|\r)/);return f?(a.length=0,f[0]):e}return"ruby"===d.tagName?c(a):d.childNodes?(b(a,d),c(a)):void 0}var d,e=[],f="";if(!a||!a.childNodes)return"ltr";for(b(e,a);f=c(e);)for(var g=0;g<f.length;g++){d=f.charCodeAt(g);for(var h=0;h<t.length;h++)if(t[h]===d)return"rtl"}return"ltr"}function i(a){if("number"==typeof a.line&&(a.snapToLines||a.line>=0&&a.line<=100))return a.line;if(!a.track||!a.track.textTrackList||!a.track.textTrackList.mediaElement)return-1;for(var b=a.track,c=b.textTrackList,d=0,e=0;e<c.length&&c[e]!==b;e++)"showing"===c[e].mode&&d++;return-1*++d}function j(){}function k(a,b,c){var d=/MSIE\s8\.0/.test(navigator.userAgent),e="rgba(255, 255, 255, 1)",f="rgba(0, 0, 0, 0.8)";d&&(e="rgb(255, 255, 255)",f="rgb(0, 0, 0)"),j.call(this),this.cue=b,this.cueDiv=g(a,b.text);var i={color:e,backgroundColor:f,position:"relative",left:0,right:0,top:0,bottom:0,display:"inline"};d||(i.writingMode=""===b.vertical?"horizontal-tb":"lr"===b.vertical?"vertical-lr":"vertical-rl",i.unicodeBidi="plaintext"),this.applyStyles(i,this.cueDiv),this.div=a.document.createElement("div"),i={textAlign:"middle"===b.align?"center":b.align,font:c.font,whiteSpace:"pre-line",position:"absolute"},d||(i.direction=h(this.cueDiv),i.writingMode=""===b.vertical?"horizontal-tb":"lr"===b.vertical?"vertical-lr":"vertical-rl".stylesunicodeBidi="plaintext"),this.applyStyles(i),this.div.appendChild(this.cueDiv);var k=0;switch(b.positionAlign){case"start":k=b.position;break;case"middle":k=b.position-b.size/2;break;case"end":k=b.position-b.size}this.applyStyles(""===b.vertical?{left:this.formatStyle(k,"%"),width:this.formatStyle(b.size,"%")}:{top:this.formatStyle(k,"%"),height:this.formatStyle(b.size,"%")}),this.move=function(a){this.applyStyles({top:this.formatStyle(a.top,"px"),bottom:this.formatStyle(a.bottom,"px"),left:this.formatStyle(a.left,"px"),right:this.formatStyle(a.right,"px"),height:this.formatStyle(a.height,"px"),width:this.formatStyle(a.width,"px")})}}function l(a){var b,c,d,e,f=/MSIE\s8\.0/.test(navigator.userAgent);if(a.div){c=a.div.offsetHeight,d=a.div.offsetWidth,e=a.div.offsetTop;var g=(g=a.div.childNodes)&&(g=g[0])&&g.getClientRects&&g.getClientRects();a=a.div.getBoundingClientRect(),b=g?Math.max(g[0]&&g[0].height||0,a.height/g.length):0}this.left=a.left,this.right=a.right,this.top=a.top||e,this.height=a.height||c,this.bottom=a.bottom||e+(a.height||c),this.width=a.width||d,this.lineHeight=void 0!==b?b:a.lineHeight,f&&!this.lineHeight&&(this.lineHeight=13)}function m(a,b,c,d){function e(a,b){for(var e,f=new l(a),g=1,h=0;h<b.length;h++){for(;a.overlapsOppositeAxis(c,b[h])||a.within(c)&&a.overlapsAny(d);)a.move(b[h]);if(a.within(c))return a;var i=a.intersectPercentage(c);g>i&&(e=new l(a),g=i),a=new l(f)}return e||f}var f=new l(b),g=b.cue,h=i(g),j=[];if(g.snapToLines){var k;switch(g.vertical){case"":j=["+y","-y"],k="height";break;case"rl":j=["+x","-x"],k="width";break;case"lr":j=["-x","+x"],k="width"}var m=f.lineHeight,n=m*Math.round(h),o=c[k]+m,p=j[0];Math.abs(n)>o&&(n=0>n?-1:1,n*=Math.ceil(o/m)*m),0>h&&(n+=""===g.vertical?c.height:c.width,j=j.reverse()),f.move(p,n)}else{var q=f.lineHeight/c.height*100;switch(g.lineAlign){case"middle":h-=q/2;break;case"end":h-=q}switch(g.vertical){case"":b.applyStyles({top:b.formatStyle(h,"%")});break;case"rl":b.applyStyles({left:b.formatStyle(h,"%")});break;case"lr":b.applyStyles({right:b.formatStyle(h,"%")})}j=["+y","-x","+x","-y"],f=new l(b)}var r=e(f,j);b.move(r.toCSSCompatValues(c))}function n(){}var o=Object.create||function(){function a(){}return function(b){if(1!==arguments.length)throw new Error("Object.create shim only accepts one parameter.");return a.prototype=b,new a}}();b.prototype=o(Error.prototype),b.prototype.constructor=b,b.Errors={BadSignature:{code:0,message:"Malformed WebVTT signature."},BadTimeStamp:{code:1,message:"Malformed time stamp."}},d.prototype={set:function(a,b){this.get(a)||""===b||(this.values[a]=b)},get:function(a,b,c){return c?this.has(a)?this.values[a]:b[c]:this.has(a)?this.values[a]:b},has:function(a){return a in this.values},alt:function(a,b,c){for(var d=0;d<c.length;++d)if(b===c[d]){this.set(a,b);break}},integer:function(a,b){/^-?\d+$/.test(b)&&this.set(a,parseInt(b,10))},percent:function(a,b){var c;return(c=b.match(/^([\d]{1,3})(\.[\d]*)?%$/))&&(b=parseFloat(b),b>=0&&100>=b)?(this.set(a,b),!0):!1}};var p={"&amp;":"&","&lt;":"<","&gt;":">","&lrm;":"‎","&rlm;":"‏","&nbsp;":" "},q={c:"span",i:"i",b:"b",u:"u",ruby:"ruby",rt:"rt",v:"span",lang:"span"},r={v:"title",lang:"lang"},s={rt:"ruby"},t=[1470,1472,1475,1478,1488,1489,1490,1491,1492,1493,1494,1495,1496,1497,1498,1499,1500,1501,1502,1503,1504,1505,1506,1507,1508,1509,1510,1511,1512,1513,1514,1520,1521,1522,1523,1524,1544,1547,1549,1563,1566,1567,1568,1569,1570,1571,1572,1573,1574,1575,1576,1577,1578,1579,1580,1581,1582,1583,1584,1585,1586,1587,1588,1589,1590,1591,1592,1593,1594,1595,1596,1597,1598,1599,1600,1601,1602,1603,1604,1605,1606,1607,1608,1609,1610,1645,1646,1647,1649,1650,1651,1652,1653,1654,1655,1656,1657,1658,1659,1660,1661,1662,1663,1664,1665,1666,1667,1668,1669,1670,1671,1672,1673,1674,1675,1676,1677,1678,1679,1680,1681,1682,1683,1684,1685,1686,1687,1688,1689,1690,1691,1692,1693,1694,1695,1696,1697,1698,1699,1700,1701,1702,1703,1704,1705,1706,1707,1708,1709,1710,1711,1712,1713,1714,1715,1716,1717,1718,1719,1720,1721,1722,1723,1724,1725,1726,1727,1728,1729,1730,1731,1732,1733,1734,1735,1736,1737,1738,1739,1740,1741,1742,1743,1744,1745,1746,1747,1748,1749,1765,1766,1774,1775,1786,1787,1788,1789,1790,1791,1792,1793,1794,1795,1796,1797,1798,1799,1800,1801,1802,1803,1804,1805,1807,1808,1810,1811,1812,1813,1814,1815,1816,1817,1818,1819,1820,1821,1822,1823,1824,1825,1826,1827,1828,1829,1830,1831,1832,1833,1834,1835,1836,1837,1838,1839,1869,1870,1871,1872,1873,1874,1875,1876,1877,1878,1879,1880,1881,1882,1883,1884,1885,1886,1887,1888,1889,1890,1891,1892,1893,1894,1895,1896,1897,1898,1899,1900,1901,1902,1903,1904,1905,1906,1907,1908,1909,1910,1911,1912,1913,1914,1915,1916,1917,1918,1919,1920,1921,1922,1923,1924,1925,1926,1927,1928,1929,1930,1931,1932,1933,1934,1935,1936,1937,1938,1939,1940,1941,1942,1943,1944,1945,1946,1947,1948,1949,1950,1951,1952,1953,1954,1955,1956,1957,1969,1984,1985,1986,1987,1988,1989,1990,1991,1992,1993,1994,1995,1996,1997,1998,1999,2e3,2001,2002,2003,2004,2005,2006,2007,2008,2009,2010,2011,2012,2013,2014,2015,2016,2017,2018,2019,2020,2021,2022,2023,2024,2025,2026,2036,2037,2042,2048,2049,2050,2051,2052,2053,2054,2055,2056,2057,2058,2059,2060,2061,2062,2063,2064,2065,2066,2067,2068,2069,2074,2084,2088,2096,2097,2098,2099,2100,2101,2102,2103,2104,2105,2106,2107,2108,2109,2110,2112,2113,2114,2115,2116,2117,2118,2119,2120,2121,2122,2123,2124,2125,2126,2127,2128,2129,2130,2131,2132,2133,2134,2135,2136,2142,2208,2210,2211,2212,2213,2214,2215,2216,2217,2218,2219,2220,8207,64285,64287,64288,64289,64290,64291,64292,64293,64294,64295,64296,64298,64299,64300,64301,64302,64303,64304,64305,64306,64307,64308,64309,64310,64312,64313,64314,64315,64316,64318,64320,64321,64323,64324,64326,64327,64328,64329,64330,64331,64332,64333,64334,64335,64336,64337,64338,64339,64340,64341,64342,64343,64344,64345,64346,64347,64348,64349,64350,64351,64352,64353,64354,64355,64356,64357,64358,64359,64360,64361,64362,64363,64364,64365,64366,64367,64368,64369,64370,64371,64372,64373,64374,64375,64376,64377,64378,64379,64380,64381,64382,64383,64384,64385,64386,64387,64388,64389,64390,64391,64392,64393,64394,64395,64396,64397,64398,64399,64400,64401,64402,64403,64404,64405,64406,64407,64408,64409,64410,64411,64412,64413,64414,64415,64416,64417,64418,64419,64420,64421,64422,64423,64424,64425,64426,64427,64428,64429,64430,64431,64432,64433,64434,64435,64436,64437,64438,64439,64440,64441,64442,64443,64444,64445,64446,64447,64448,64449,64467,64468,64469,64470,64471,64472,64473,64474,64475,64476,64477,64478,64479,64480,64481,64482,64483,64484,64485,64486,64487,64488,64489,64490,64491,64492,64493,64494,64495,64496,64497,64498,64499,64500,64501,64502,64503,64504,64505,64506,64507,64508,64509,64510,64511,64512,64513,64514,64515,64516,64517,64518,64519,64520,64521,64522,64523,64524,64525,64526,64527,64528,64529,64530,64531,64532,64533,64534,64535,64536,64537,64538,64539,64540,64541,64542,64543,64544,64545,64546,64547,64548,64549,64550,64551,64552,64553,64554,64555,64556,64557,64558,64559,64560,64561,64562,64563,64564,64565,64566,64567,64568,64569,64570,64571,64572,64573,64574,64575,64576,64577,64578,64579,64580,64581,64582,64583,64584,64585,64586,64587,64588,64589,64590,64591,64592,64593,64594,64595,64596,64597,64598,64599,64600,64601,64602,64603,64604,64605,64606,64607,64608,64609,64610,64611,64612,64613,64614,64615,64616,64617,64618,64619,64620,64621,64622,64623,64624,64625,64626,64627,64628,64629,64630,64631,64632,64633,64634,64635,64636,64637,64638,64639,64640,64641,64642,64643,64644,64645,64646,64647,64648,64649,64650,64651,64652,64653,64654,64655,64656,64657,64658,64659,64660,64661,64662,64663,64664,64665,64666,64667,64668,64669,64670,64671,64672,64673,64674,64675,64676,64677,64678,64679,64680,64681,64682,64683,64684,64685,64686,64687,64688,64689,64690,64691,64692,64693,64694,64695,64696,64697,64698,64699,64700,64701,64702,64703,64704,64705,64706,64707,64708,64709,64710,64711,64712,64713,64714,64715,64716,64717,64718,64719,64720,64721,64722,64723,64724,64725,64726,64727,64728,64729,64730,64731,64732,64733,64734,64735,64736,64737,64738,64739,64740,64741,64742,64743,64744,64745,64746,64747,64748,64749,64750,64751,64752,64753,64754,64755,64756,64757,64758,64759,64760,64761,64762,64763,64764,64765,64766,64767,64768,64769,64770,64771,64772,64773,64774,64775,64776,64777,64778,64779,64780,64781,64782,64783,64784,64785,64786,64787,64788,64789,64790,64791,64792,64793,64794,64795,64796,64797,64798,64799,64800,64801,64802,64803,64804,64805,64806,64807,64808,64809,64810,64811,64812,64813,64814,64815,64816,64817,64818,64819,64820,64821,64822,64823,64824,64825,64826,64827,64828,64829,64848,64849,64850,64851,64852,64853,64854,64855,64856,64857,64858,64859,64860,64861,64862,64863,64864,64865,64866,64867,64868,64869,64870,64871,64872,64873,64874,64875,64876,64877,64878,64879,64880,64881,64882,64883,64884,64885,64886,64887,64888,64889,64890,64891,64892,64893,64894,64895,64896,64897,64898,64899,64900,64901,64902,64903,64904,64905,64906,64907,64908,64909,64910,64911,64914,64915,64916,64917,64918,64919,64920,64921,64922,64923,64924,64925,64926,64927,64928,64929,64930,64931,64932,64933,64934,64935,64936,64937,64938,64939,64940,64941,64942,64943,64944,64945,64946,64947,64948,64949,64950,64951,64952,64953,64954,64955,64956,64957,64958,64959,64960,64961,64962,64963,64964,64965,64966,64967,65008,65009,65010,65011,65012,65013,65014,65015,65016,65017,65018,65019,65020,65136,65137,65138,65139,65140,65142,65143,65144,65145,65146,65147,65148,65149,65150,65151,65152,65153,65154,65155,65156,65157,65158,65159,65160,65161,65162,65163,65164,65165,65166,65167,65168,65169,65170,65171,65172,65173,65174,65175,65176,65177,65178,65179,65180,65181,65182,65183,65184,65185,65186,65187,65188,65189,65190,65191,65192,65193,65194,65195,65196,65197,65198,65199,65200,65201,65202,65203,65204,65205,65206,65207,65208,65209,65210,65211,65212,65213,65214,65215,65216,65217,65218,65219,65220,65221,65222,65223,65224,65225,65226,65227,65228,65229,65230,65231,65232,65233,65234,65235,65236,65237,65238,65239,65240,65241,65242,65243,65244,65245,65246,65247,65248,65249,65250,65251,65252,65253,65254,65255,65256,65257,65258,65259,65260,65261,65262,65263,65264,65265,65266,65267,65268,65269,65270,65271,65272,65273,65274,65275,65276,67584,67585,67586,67587,67588,67589,67592,67594,67595,67596,67597,67598,67599,67600,67601,67602,67603,67604,67605,67606,67607,67608,67609,67610,67611,67612,67613,67614,67615,67616,67617,67618,67619,67620,67621,67622,67623,67624,67625,67626,67627,67628,67629,67630,67631,67632,67633,67634,67635,67636,67637,67639,67640,67644,67647,67648,67649,67650,67651,67652,67653,67654,67655,67656,67657,67658,67659,67660,67661,67662,67663,67664,67665,67666,67667,67668,67669,67671,67672,67673,67674,67675,67676,67677,67678,67679,67840,67841,67842,67843,67844,67845,67846,67847,67848,67849,67850,67851,67852,67853,67854,67855,67856,67857,67858,67859,67860,67861,67862,67863,67864,67865,67866,67867,67872,67873,67874,67875,67876,67877,67878,67879,67880,67881,67882,67883,67884,67885,67886,67887,67888,67889,67890,67891,67892,67893,67894,67895,67896,67897,67903,67968,67969,67970,67971,67972,67973,67974,67975,67976,67977,67978,67979,67980,67981,67982,67983,67984,67985,67986,67987,67988,67989,67990,67991,67992,67993,67994,67995,67996,67997,67998,67999,68e3,68001,68002,68003,68004,68005,68006,68007,68008,68009,68010,68011,68012,68013,68014,68015,68016,68017,68018,68019,68020,68021,68022,68023,68030,68031,68096,68112,68113,68114,68115,68117,68118,68119,68121,68122,68123,68124,68125,68126,68127,68128,68129,68130,68131,68132,68133,68134,68135,68136,68137,68138,68139,68140,68141,68142,68143,68144,68145,68146,68147,68160,68161,68162,68163,68164,68165,68166,68167,68176,68177,68178,68179,68180,68181,68182,68183,68184,68192,68193,68194,68195,68196,68197,68198,68199,68200,68201,68202,68203,68204,68205,68206,68207,68208,68209,68210,68211,68212,68213,68214,68215,68216,68217,68218,68219,68220,68221,68222,68223,68352,68353,68354,68355,68356,68357,68358,68359,68360,68361,68362,68363,68364,68365,68366,68367,68368,68369,68370,68371,68372,68373,68374,68375,68376,68377,68378,68379,68380,68381,68382,68383,68384,68385,68386,68387,68388,68389,68390,68391,68392,68393,68394,68395,68396,68397,68398,68399,68400,68401,68402,68403,68404,68405,68416,68417,68418,68419,68420,68421,68422,68423,68424,68425,68426,68427,68428,68429,68430,68431,68432,68433,68434,68435,68436,68437,68440,68441,68442,68443,68444,68445,68446,68447,68448,68449,68450,68451,68452,68453,68454,68455,68456,68457,68458,68459,68460,68461,68462,68463,68464,68465,68466,68472,68473,68474,68475,68476,68477,68478,68479,68608,68609,68610,68611,68612,68613,68614,68615,68616,68617,68618,68619,68620,68621,68622,68623,68624,68625,68626,68627,68628,68629,68630,68631,68632,68633,68634,68635,68636,68637,68638,68639,68640,68641,68642,68643,68644,68645,68646,68647,68648,68649,68650,68651,68652,68653,68654,68655,68656,68657,68658,68659,68660,68661,68662,68663,68664,68665,68666,68667,68668,68669,68670,68671,68672,68673,68674,68675,68676,68677,68678,68679,68680,126464,126465,126466,126467,126469,126470,126471,126472,126473,126474,126475,126476,126477,126478,126479,126480,126481,126482,126483,126484,126485,126486,126487,126488,126489,126490,126491,126492,126493,126494,126495,126497,126498,126500,126503,126505,126506,126507,126508,126509,126510,126511,126512,126513,126514,126516,126517,126518,126519,126521,126523,126530,126535,126537,126539,126541,126542,126543,126545,126546,126548,126551,126553,126555,126557,126559,126561,126562,126564,126567,126568,126569,126570,126572,126573,126574,126575,126576,126577,126578,126580,126581,126582,126583,126585,126586,126587,126588,126590,126592,126593,126594,126595,126596,126597,126598,126599,126600,126601,126603,126604,126605,126606,126607,126608,126609,126610,126611,126612,126613,126614,126615,126616,126617,126618,126619,126625,126626,126627,126629,126630,126631,126632,126633,126635,126636,126637,126638,126639,126640,126641,126642,126643,126644,126645,126646,126647,126648,126649,126650,126651,1114109];j.prototype.applyStyles=function(a,b){b=b||this.div;for(var c in a)a.hasOwnProperty(c)&&(b.style[c]=a[c])},j.prototype.formatStyle=function(a,b){return 0===a?0:a+b},k.prototype=o(j.prototype),k.prototype.constructor=k,l.prototype.move=function(a,b){switch(b=void 0!==b?b:this.lineHeight,a){case"+x":this.left+=b,this.right+=b;break;case"-x":this.left-=b,this.right-=b;break;case"+y":this.top+=b,this.bottom+=b;break;case"-y":this.top-=b,this.bottom-=b}},l.prototype.overlaps=function(a){return this.left<a.right&&this.right>a.left&&this.top<a.bottom&&this.bottom>a.top},l.prototype.overlapsAny=function(a){for(var b=0;b<a.length;b++)if(this.overlaps(a[b]))return!0;return!1},l.prototype.within=function(a){return this.top>=a.top&&this.bottom<=a.bottom&&this.left>=a.left&&this.right<=a.right},l.prototype.overlapsOppositeAxis=function(a,b){switch(b){case"+x":return this.left<a.left;case"-x":return this.right>a.right;case"+y":return this.top<a.top;case"-y":return this.bottom>a.bottom}},l.prototype.intersectPercentage=function(a){var b=Math.max(0,Math.min(this.right,a.right)-Math.max(this.left,a.left)),c=Math.max(0,Math.min(this.bottom,a.bottom)-Math.max(this.top,a.top)),d=b*c;return d/(this.height*this.width)},l.prototype.toCSSCompatValues=function(a){return{top:this.top-a.top,bottom:a.bottom-this.bottom,left:this.left-a.left,right:a.right-this.right,height:this.height,width:this.width}},l.getSimpleBoxPosition=function(a){var b=a.div?a.div.offsetHeight:a.tagName?a.offsetHeight:0,c=a.div?a.div.offsetWidth:a.tagName?a.offsetWidth:0,d=a.div?a.div.offsetTop:a.tagName?a.offsetTop:0;a=a.div?a.div.getBoundingClientRect():a.tagName?a.getBoundingClientRect():a;var e={left:a.left,right:a.right,top:a.top||d,height:a.height||b,bottom:a.bottom||d+(a.height||b),width:a.width||c};return e},n.StringDecoder=function(){return{decode:function(a){if(!a)return"";if("string"!=typeof a)throw new Error("Error - expected string data.");return decodeURIComponent(encodeURIComponent(a))}}},n.convertCueToDOMTree=function(a,b){return a&&b?g(a,b):null};var u=.05,v="sans-serif",w="1.5%";n.processCues=function(a,b,c){function d(a){for(var b=0;b<a.length;b++)if(a[b].hasBeenReset||!a[b].displayState)return!0;return!1}if(!a||!b||!c)return null;for(;c.firstChild;)c.removeChild(c.firstChild);var e=a.document.createElement("div");if(e.style.position="absolute",e.style.left="0",e.style.right="0",e.style.top="0",e.style.bottom="0",e.style.margin=w,c.appendChild(e),d(b)){var f=[],g=l.getSimpleBoxPosition(e),h=Math.round(g.height*u*100)/100,i={font:h+"px "+v};!function(){for(var c,d,h=0;h<b.length;h++)d=b[h],c=new k(a,d,i),e.appendChild(c.div),m(a,c,g,f),d.displayState=c.div,f.push(l.getSimpleBoxPosition(c))}()}else for(var j=0;j<b.length;j++)e.appendChild(b[j].displayState)},n.Parser=function(a,b,c){c||(c=b,b={}),b||(b={}),this.window=a,this.vttjs=b,this.state="INITIAL",this.buffer="",this.decoder=c||new TextDecoder("utf8"),this.regionList=[]},n.Parser.prototype={reportOrThrowError:function(a){if(!(a instanceof b))throw a;this.onparsingerror&&this.onparsingerror(a)},parse:function(a){function c(){for(var a=i.buffer,b=0;b<a.length&&"\r"!==a[b]&&"\n"!==a[b];)++b;var c=a.substr(0,b);return"\r"===a[b]&&++b,"\n"===a[b]&&++b,i.buffer=a.substr(b),c}function g(a){var b=new d;if(e(a,function(a,c){switch(a){case"id":b.set(a,c);break;case"width":b.percent(a,c);break;case"lines":b.integer(a,c);break;case"regionanchor":case"viewportanchor":var e=c.split(",");if(2!==e.length)break;var f=new d;if(f.percent("x",e[0]),f.percent("y",e[1]),!f.has("x")||!f.has("y"))break;b.set(a+"X",f.get("x")),b.set(a+"Y",f.get("y"));break;case"scroll":b.alt(a,c,["up"])}},/=/,/\s/),b.has("id")){var c=new(i.vttjs.VTTRegion||i.window.VTTRegion);c.width=b.get("width",100),c.lines=b.get("lines",3),c.regionAnchorX=b.get("regionanchorX",0),c.regionAnchorY=b.get("regionanchorY",100),c.viewportAnchorX=b.get("viewportanchorX",0),c.viewportAnchorY=b.get("viewportanchorY",100),c.scroll=b.get("scroll",""),i.onregion&&i.onregion(c),i.regionList.push({id:b.get("id"),region:c})}}function h(a){e(a,function(a,b){switch(a){case"Region":g(b)}},/:/)}var i=this;a&&(i.buffer+=i.decoder.decode(a,{stream:!0}));try{var j;if("INITIAL"===i.state){if(!/\r\n|\n/.test(i.buffer))return this;j=c();var k=j.match(/^WEBVTT([ \t].*)?$/);if(!k||!k[0])throw new b(b.Errors.BadSignature);i.state="HEADER"}for(var l=!1;i.buffer;){if(!/\r\n|\n/.test(i.buffer))return this;switch(l?l=!1:j=c(),i.state){case"HEADER":/:/.test(j)?h(j):j||(i.state="ID");continue;case"NOTE":j||(i.state="ID");continue;case"ID":if(/^NOTE($|[ \t])/.test(j)){i.state="NOTE";break}if(!j)continue;if(i.cue=new(i.vttjs.VTTCue||i.window.VTTCue)(0,0,""),i.state="CUE",-1===j.indexOf("-->")){i.cue.id=j;continue}case"CUE":try{f(j,i.cue,i.regionList)}catch(m){i.reportOrThrowError(m),i.cue=null,i.state="BADCUE";continue}i.state="CUETEXT";continue;case"CUETEXT":var n=-1!==j.indexOf("-->");if(!j||n&&(l=!0)){i.oncue&&i.oncue(i.cue),i.cue=null,i.state="ID";continue}i.cue.text&&(i.cue.text+="\n"),i.cue.text+=j;continue;case"BADCUE":j||(i.state="ID");continue}}}catch(m){i.reportOrThrowError(m),"CUETEXT"===i.state&&i.cue&&i.oncue&&i.oncue(i.cue),i.cue=null,i.state="INITIAL"===i.state?"BADWEBVTT":"BADCUE"}return this},flush:function(){var a=this;try{if(a.buffer+=a.decoder.decode(),(a.cue||"HEADER"===a.state)&&(a.buffer+="\n\n",a.parse()),"INITIAL"===a.state)throw new b(b.Errors.BadSignature)}catch(c){a.reportOrThrowError(c)}return a.onflush&&a.onflush(),this}},a.WebVTT=n}(this,this.vttjs||{});
//# sourceMappingURL=video.min.js.map
/*! videojs-contrib-ads - v3.3.7 - 2016-06-10
* Copyright (c) 2016 Brightcove; Licensed  */
!function(a,b){"function"==typeof define&&define.amd?define("videojs-contrib-ads",["videojs"],function(a){return b(a)}):"object"==typeof exports?module.exports=b(require("video.js")):a["videojs-contrib-ads"]=b(videojs)}(this,function(a){!function(a,b,c){"use strict";var d=b.getComponent("Html5").Events,e=function(b){b.ads.cancelPlayTimeout||(b.ads.cancelPlayTimeout=a.setTimeout(function(){b.ads.cancelPlayTimeout=null,b.paused()||b.pause(),b.one("contentplayback",function(){b.paused()&&b.play()})},1))},f=function(a){return a.duration()===1/0?!0:"8"===b.browser.IOS_VERSION&&0===a.duration()?!0:!1},g=function(a){var c;c=b.browser.IS_IOS&&f(a)&&a.seekable().length>0?a.currentTime()-a.seekable().end(0):a.currentTime();var d,e,g=a.$(".vjs-tech"),h=a.remoteTextTracks?a.remoteTextTracks():[],i=[],j={ended:a.ended(),currentSrc:a.currentSrc(),src:a.src(),currentTime:c,type:a.currentType()};for(g&&(j.nativePoster=g.poster,j.style=g.getAttribute("style")),e=h.length;e--;)d=h[e],i.push({track:d,mode:d.mode}),d.mode="disabled";return j.suppressedTracks=i,j},h=function(d,e){if(d.ads.disableNextSnapshotRestore===!0)return void(d.ads.disableNextSnapshotRestore=!1);var g,h=d.$(".vjs-tech"),i=20,j=e.suppressedTracks,k=function(){for(var a=j.length;a--;)g=j[a],g.track.mode=g.mode},l=function(){var c,g=!1,h=function(){g=!0};b.browser.IS_IOS&&f(d)?e.currentTime<0&&(c=d.seekable().length>0?d.seekable().end(0)+e.currentTime:d.currentTime(),d.currentTime(c)):d.currentTime(e.ended?d.duration():e.currentTime),e.ended?(d.ads.resumeEndedTimeout=a.setTimeout(function(){g||d.play(),d.off("ended",h),d.ads.resumeEndedTimeout=null},250),d.on("ended",h),d.on("dispose",function(){a.clearTimeout(d.ads.resumeEndedTimeout)})):d.play()},m=function(){return d.off("contentcanplay",m),d.ads.tryToResumeTimeout_&&(d.clearTimeout(d.ads.tryToResumeTimeout_),d.ads.tryToResumeTimeout_=null),h=d.el().querySelector(".vjs-tech"),h.readyState>1?l():h.seekable===c?l():h.seekable.length>0?l():void(i--?a.setTimeout(m,50):!function(){try{l()}catch(a){b.log.warn("Failed to resume the content after an advertisement",a)}}())};e.nativePoster&&(h.poster=e.nativePoster),"style"in e&&h.setAttribute("style",e.style||""),d.ads.videoElementRecycled()?(d.one("contentloadedmetadata",k),d.src({src:e.currentSrc,type:e.type}),d.load(),d.one("contentcanplay",m),d.ads.tryToResumeTimeout_=d.setTimeout(m,2e3)):d.ended()&&e.ended||(k(),d.play())},i=function(a){var b=a.$(".vjs-tech");b&&b.removeAttribute("poster")},j={timeout:5e3,prerollTimeout:100,postrollTimeout:100,debug:!1,stitchedAds:!1},k=function(f){var k,l=this,m=b.mergeOptions(j,f);!function(){var a=d.concat(["firstplay","loadedalldata"]),b=function(){return!0},c=function(a,c){c.isImmediatePropagationStopped=b,c.cancelBubble=!0,c.isPropagationStopped=b,l.trigger({type:a+c.type,state:l.ads.state,originalEvent:c})};l.on(a,function(a){if("ad-playback"===l.ads.state)(l.ads.videoElementRecycled()||l.ads.stitchedAds())&&c("ad",a);else if("content-playback"===l.ads.state&&"ended"===a.type)c("content",a);else if("content-resuming"===l.ads.state){if(l.ads.snapshot){if(l.currentSrc()!==l.ads.snapshot.currentSrc){if("loadstart"===a.type)return;return c("content",a)}if(l.ads.snapshot.ended)return"pause"===a.type||"ended"===a.type?void l.addClass("vjs-has-started"):c("content",a)}"playing"!==a.type&&c("content",a)}})}(),l.on(["addurationchange","adcanplay"],function(){l.currentSrc()!==l.ads.snapshot.currentSrc&&l.play()}),l.on("nopreroll",function(){l.ads.nopreroll_=!0}),l.on("nopostroll",function(){l.ads.nopostroll_=!0}),l.ads={state:"content-set",disableNextSnapshotRestore:!1,startLinearAdMode:function(){("preroll?"===l.ads.state||"content-playback"===l.ads.state||"postroll?"===l.ads.state)&&l.trigger("adstart")},endLinearAdMode:function(){"ad-playback"===l.ads.state&&l.trigger("adend")},skipLinearAdMode:function(){"ad-playback"!==l.ads.state&&l.trigger("adskip")},stitchedAds:function(a){return a!==c&&(this._stitchedAds=!!a),this._stitchedAds},videoElementRecycled:function(){var a,b;return this.snapshot?(a=l.src()!==this.snapshot.src,b=l.currentSrc()!==this.snapshot.currentSrc,a||b):!1}},l.ads.stitchedAds(m.stitchedAds),k=function(c){var d={"content-set":{events:{adscanceled:function(){this.state="content-playback"},adsready:function(){this.state="ads-ready"},play:function(){this.state="ads-ready?",e(l),i(l)},adserror:function(){this.state="content-playback"},adskip:function(){this.state="content-playback"}}},"ads-ready":{events:{play:function(){this.state="preroll?",e(l)},adskip:function(){this.state="content-playback"},adserror:function(){this.state="content-playback"}}},"preroll?":{enter:function(){l.ads.nopreroll_?(l.trigger("readyforpreroll"),l.trigger("nopreroll")):(l.addClass("vjs-ad-loading"),l.ads.adTimeoutTimeout=a.setTimeout(function(){l.trigger("adtimeout")},m.prerollTimeout),l.trigger("readyforpreroll"))},leave:function(){a.clearTimeout(l.ads.adTimeoutTimeout),l.removeClass("vjs-ad-loading")},events:{play:function(){e(l)},adstart:function(){this.state="ad-playback"},adskip:function(){this.state="content-playback"},adtimeout:function(){this.state="content-playback"},adserror:function(){this.state="content-playback"},nopreroll:function(){this.state="content-playback"}}},"ads-ready?":{enter:function(){l.addClass("vjs-ad-loading"),l.ads.adTimeoutTimeout=a.setTimeout(function(){l.trigger("adtimeout")},m.timeout)},leave:function(){a.clearTimeout(l.ads.adTimeoutTimeout),l.removeClass("vjs-ad-loading")},events:{play:function(){e(l)},adscanceled:function(){this.state="content-playback"},adsready:function(){this.state="preroll?"},adskip:function(){this.state="content-playback"},adtimeout:function(){this.state="content-playback"},adserror:function(){this.state="content-playback"}}},"ad-playback":{enter:function(){(b.browser.IS_IOS||l.duration()!==1/0)&&(this.snapshot=g(l)),b.browser.IS_IOS||l.duration()!==1/0||(this.preAdVolume_=l.volume(),l.volume(0)),l.addClass("vjs-ad-playing"),i(l),l.ads.cancelPlayTimeout&&(a.clearTimeout(l.ads.cancelPlayTimeout),l.ads.cancelPlayTimeout=null)},leave:function(){l.removeClass("vjs-ad-playing"),(b.browser.IS_IOS||l.duration()!==1/0)&&h(l,this.snapshot),b.browser.IS_IOS||l.duration()!==1/0||l.volume(this.preAdVolume_)},events:{adend:function(){this.state="content-resuming"},adserror:function(){this.state="content-resuming",l.trigger("adend")}}},"content-resuming":{enter:function(){this.snapshot&&this.snapshot.ended&&(a.clearTimeout(l.ads._fireEndedTimeout),l.ads._fireEndedTimeout=a.setTimeout(function(){l.trigger("ended")},1e3))},leave:function(){a.clearTimeout(l.ads._fireEndedTimeout)},events:{contentupdate:function(){this.state="content-set"},contentresumed:function(){this.state="content-playback"},playing:function(){this.state="content-playback"},ended:function(){this.state="content-playback"}}},"postroll?":{enter:function(){this.snapshot=g(l),l.ads.nopostroll_?(l.ads.state="content-resuming",a.setTimeout(function(){l.trigger("ended")},1)):(l.addClass("vjs-ad-loading"),l.ads.adTimeoutTimeout=a.setTimeout(function(){l.trigger("adtimeout")},m.postrollTimeout))},leave:function(){a.clearTimeout(l.ads.adTimeoutTimeout),l.removeClass("vjs-ad-loading")},events:{adstart:function(){this.state="ad-playback"},adskip:function(){this.state="content-resuming",a.setTimeout(function(){l.trigger("ended")},1)},adtimeout:function(){this.state="content-resuming",a.setTimeout(function(){l.trigger("ended")},1)},adserror:function(){this.state="content-resuming",a.setTimeout(function(){l.trigger("ended")},1)}}},"content-playback":{enter:function(){l.ads.cancelPlayTimeout&&(a.clearTimeout(l.ads.cancelPlayTimeout),l.ads.cancelPlayTimeout=null),l.trigger({type:"contentplayback",triggerevent:l.ads.triggerevent})},events:{adsready:function(){l.trigger("readyforpreroll")},adstart:function(){this.state="ad-playback"},contentupdate:function(){l.paused()?this.state="content-set":this.state="ads-ready?"},contentended:function(){l.ads.snapshot&&l.ads.snapshot.ended||(this.state="postroll?")},play:function(){l.currentSrc()!==l.ads.contentSrc&&e(l)}}}};!function(a){var e=function(){};((d[a].events||{})[c.type]||e).apply(l.ads),a!==l.ads.state&&(l.ads.triggerevent=c.type,(d[a].leave||e).apply(l.ads),(d[l.ads.state].enter||e).apply(l.ads),m.debug&&b.log("ads",l.ads.triggerevent+" triggered: "+a+" -> "+l.ads.state))}(l.ads.state)},l.on(d.concat(["adtimeout","contentupdate","contentplaying","contentended","contentresumed","adsready","adserror","adscanceled","adstart","adend","adskip","nopreroll"]),k),l.ads.contentSrc=l.currentSrc(),function(){var b=function(){var a;"ad-playback"!==l.ads.state&&(a=l.currentSrc(),a!==l.ads.contentSrc&&(l.trigger({type:"contentupdate",oldValue:l.ads.contentSrc,newValue:a}),l.ads.contentSrc=a))};l.on("loadstart",b),a.setTimeout(b,1)}(),l.paused()||k({type:"play"})};b.plugin("ads",k)}(window,a)});
/**
 * Copyright 2014 Google Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 *
 * IMA SDK integration plugin for Video.js. For more information see
 * https://www.github.com/googleads/videojs-ima
 */

(function(vjs) {
  'use strict';
  var extend = function(obj) {
    var arg;
    var index;
    var key;
    for (index = 1; index < arguments.length; index++) {
      arg = arguments[index];
      for (key in arg) {
        if (arg.hasOwnProperty(key)) {
          obj[key] = arg[key];
        }
      }
    }
    return obj;
  },

  ima_defaults = {
    debug: false,
    timeout: 5000,
    prerollTimeout: 100
  },

  imaPlugin = function(options, readyCallback) {
    var player = this;

    /**
     * Creates the ad container passed to the IMA SDK.
     * @private
     */
    player.ima.createAdContainer_ = function() {
      // The adContainerDiv is the DOM of the element that will house
      // the ads and ad controls.
      vjsControls = player.getChild('controlBar');
      adContainerDiv =
          vjsControls.el().parentNode.appendChild(
              document.createElement('div'));
      adContainerDiv.id = 'ima-ad-container';
      adContainerDiv.addEventListener(
          'mouseover',
          player.ima.showAdControls_,
          false);
      adContainerDiv.addEventListener(
          'mouseout',
          player.ima.hideAdControls_,
          false);
      player.ima.createControls_();
      adDisplayContainer =
          new google.ima.AdDisplayContainer(adContainerDiv, contentPlayer);
    };

    /**
     * Creates the controls for the ad.
     * @private
     */
    player.ima.createControls_ = function() {
      controlsDiv = document.createElement('div');
      controlsDiv.id = 'ima-controls-div';
      controlsDiv.style.width = '100%';
      countdownDiv = document.createElement('div');
      countdownDiv.id = 'ima-countdown-div';
      countdownDiv.innerHTML = 'Advertisement';
      countdownDiv.style.display = showCountdown ? 'block' : 'none';
      seekBarDiv = document.createElement('div');
      seekBarDiv.id = 'ima-seek-bar-div';
      seekBarDiv.style.width = '100%';
      progressDiv = document.createElement('div');
      progressDiv.id = 'ima-progress-div';
      playPauseDiv = document.createElement('div');
      playPauseDiv.id = 'ima-play-pause-div';
      playPauseDiv.className = 'ima-playing';
      playPauseDiv.addEventListener(
          'click',
          player.ima.onAdPlayPauseClick_,
          false);
      muteDiv = document.createElement('div');
      muteDiv.id = 'ima-mute-div';
      muteDiv.className = 'ima-non-muted';
      muteDiv.addEventListener(
          'click',
          player.ima.onAdMuteClick_,
          false);
      sliderDiv = document.createElement('div');
      sliderDiv.id = 'ima-slider-div';
      sliderDiv.addEventListener(
          'mousedown',
          player.ima.onAdVolumeSliderMouseDown_,
          false);
      sliderLevelDiv = document.createElement('div');
      sliderLevelDiv.id = 'ima-slider-level-div';
      fullscreenDiv = document.createElement('div');
      fullscreenDiv.id = 'ima-fullscreen-div';
      fullscreenDiv.className = 'ima-non-fullscreen';
      fullscreenDiv.addEventListener(
          'click',
          player.ima.onAdFullscreenClick_,
          false);
      adContainerDiv.appendChild(controlsDiv);
      controlsDiv.appendChild(countdownDiv);
      controlsDiv.appendChild(seekBarDiv);
      controlsDiv.appendChild(playPauseDiv);
      controlsDiv.appendChild(muteDiv);
      controlsDiv.appendChild(sliderDiv);
      controlsDiv.appendChild(fullscreenDiv);
      seekBarDiv.appendChild(progressDiv);
      sliderDiv.appendChild(sliderLevelDiv);
    };

    /**
     * Initializes the AdDisplayContainer. On mobile, this must be done as a
     * result of user action.
     */
    player.ima.initializeAdDisplayContainer = function() {
      adDisplayContainerInitialized = true;
      adDisplayContainer.initialize();
    }

    /**
     * Creates the AdsRequest and request ads through the AdsLoader.
     */
    player.ima.requestAds = function() {
      if (!adDisplayContainerInitialized) {
        adDisplayContainer.initialize();
      }
      var adsRequest = new google.ima.AdsRequest();
      adsRequest.adTagUrl = settings.adTagUrl;
      if (settings.forceNonLinearFullSlot) {
        adsRequest.forceNonLinearFullSlot = true;
      }

      adsRequest.linearAdSlotWidth = player.ima.getPlayerWidth();
      adsRequest.linearAdSlotHeight = player.ima.getPlayerHeight();
      adsRequest.nonLinearAdSlotWidth =
          settings.nonLinearWidth || player.ima.getPlayerWidth();
      adsRequest.nonLinearAdSlotHeight =
          settings.nonLinearHeight || (player.ima.getPlayerHeight() / 3);

      adsLoader.requestAds(adsRequest);
    };

    /**
     * Listener for the ADS_MANAGER_LOADED event. Creates the AdsManager,
     * sets up event listeners, and triggers the 'adsready' event for
     * videojs-ads-contrib.
     * @private
     */
    player.ima.onAdsManagerLoaded_ = function(adsManagerLoadedEvent) {
      adsManager = adsManagerLoadedEvent.getAdsManager(
          contentPlayheadTracker, adsRenderingSettings);

      adsManager.addEventListener(
          google.ima.AdErrorEvent.Type.AD_ERROR,
          player.ima.onAdError_);
      adsManager.addEventListener(
          google.ima.AdEvent.Type.AD_BREAK_READY,
          player.ima.onAdBreakReady_);
      adsManager.addEventListener(
          google.ima.AdEvent.Type.CONTENT_PAUSE_REQUESTED,
          player.ima.onContentPauseRequested_);
      adsManager.addEventListener(
          google.ima.AdEvent.Type.CONTENT_RESUME_REQUESTED,
          player.ima.onContentResumeRequested_);
      adsManager.addEventListener(
          google.ima.AdEvent.Type.ALL_ADS_COMPLETED,
          player.ima.onAllAdsCompleted_);

      adsManager.addEventListener(
          google.ima.AdEvent.Type.LOADED,
          player.ima.onAdLoaded_);
      adsManager.addEventListener(
          google.ima.AdEvent.Type.STARTED,
          player.ima.onAdStarted_);
      adsManager.addEventListener(
          google.ima.AdEvent.Type.CLICK,
          player.ima.onAdPlayPauseClick_);
      adsManager.addEventListener(
          google.ima.AdEvent.Type.COMPLETE,
          player.ima.onAdComplete_);
      adsManager.addEventListener(
          google.ima.AdEvent.Type.SKIPPED,
          player.ima.onAdComplete_);

      if (!autoPlayAdBreaks) {
        try {
          var initWidth = player.ima.getPlayerWidth();
          var initHeight = player.ima.getPlayerHeight();
          adsManagerDimensions.width = initWidth;
          adsManagerDimensions.height = initHeight;
          adsManager.init(
              initWidth,
              initHeight,
              google.ima.ViewMode.NORMAL);
          adsManager.setVolume(player.muted() ? 0 : player.volume());
        } catch (adError) {
          player.ima.onAdError_(adError);
        }
      }

      player.trigger('adsready');
    };

    /**
     * Start ad playback, or content video playback in the absence of a
     * pre-roll.
     */
    player.ima.start = function() {
      if (autoPlayAdBreaks) {
        try {
          adsManager.init(
              player.ima.getPlayerWidth(),
              player.ima.getPlayerHeight(),
              google.ima.ViewMode.NORMAL);
          adsManager.setVolume(player.muted() ? 0 : player.volume());
          adsManager.start();
        } catch (adError) {
          player.ima.onAdError_(adError);
        }
      }
    };

    /**
     * Listener for errors fired by the AdsLoader.
     * @param {google.ima.AdErrorEvent} event The error event thrown by the
     *     AdsLoader. See
     *     https://developers.google.com/interactive-media-ads/docs/sdks/html5/v3/apis#ima.AdError.Type
     * @private
     */
    player.ima.onAdsLoaderError_ = function(event) {
      window.console.log('AdsLoader error: ' + event.getError());
      if (adsManager) {
        adsManager.destroy();
      }
      player.trigger('adserror');
    };

    /**
     * Listener for errors thrown by the AdsManager.
     * @param {google.ima.AdErrorEvent} adErrorEvent The error event thrown by
     *     the AdsManager.
     * @private
     */
    player.ima.onAdError_ = function(adErrorEvent) {
      window.console.log('Ad error: ' + adErrorEvent.getError());
      vjsControls.show();
      adsManager.destroy();
      adContainerDiv.style.display = 'none';
      player.trigger('adserror');
    };

    /**
     * Listener for AD_BREAK_READY. Passes event on to publisher's listener.
     * @param {google.ima.AdEvent} adEvent AdEvent thrown by the AdsManager.
     * @private
     */
    player.ima.onAdBreakReady_ = function(adEvent) {
      adBreakReadyListener(adEvent);
    };

    /**
     * Called by publishers in manual ad break playback mode to start an ad
     * break.
     */
    player.ima.playAdBreak = function() {
      if (!autoPlayAdBreaks) {
        adsManager.start();
      }
    }

    /**
     * Pauses the content video and displays the ad container so ads can play.
     * @param {google.ima.AdEvent} adEvent The AdEvent thrown by the AdsManager.
     * @private
     */
    player.ima.onContentPauseRequested_ = function(adEvent) {
      adsActive = true;
      adPlaying = true;
      player.off('ended', localContentEndedListener);
      if (adEvent.getAd().getAdPodInfo().getPodIndex() != -1) {
        // Skip this call for post-roll ads
        player.ads.startLinearAdMode();
      }
      adContainerDiv.style.display = 'block';
      controlsDiv.style.display = 'block';
      vjsControls.hide();
      player.pause();
    };

    /**
     * Resumes content video and hides the ad container.
     * @param {google.ima.AdEvent} adEvent The AdEvent thrown by the AdsManager.
     * @private
     */
    player.ima.onContentResumeRequested_ = function(adEvent) {
      adsActive = false;
      adPlaying = false;
      player.on('ended', localContentEndedListener);
      if (currentAd && currentAd.isLinear()) {
        adContainerDiv.style.display = 'none';
      }
      vjsControls.show();
      if (!currentAd) {
        // Something went wrong playing the ad
        player.ads.endLinearAdMode();
      } else if (!contentComplete &&
          // Don't exit linear mode after post-roll or content will auto-replay
          currentAd.getAdPodInfo().getPodIndex() != -1 ) {
        player.ads.endLinearAdMode();
      }
      countdownDiv.innerHTML = '';
    };

    /**
     * Records that ads have completed and calls contentAndAdsEndedListeners
     * if content is also complete.
     * @param {google.ima.AdEvent} adEvent The AdEvent thrown by the AdsManager.
     * @private
     */
    player.ima.onAllAdsCompleted_ = function(adEvent) {
      allAdsCompleted = true;
      if (contentComplete == true) {
        for (var index in contentAndAdsEndedListeners) {
          contentAndAdsEndedListeners[index]();
        }
      }
    }

    /**
     * Starts the content video when a non-linear ad is loaded.
     * @param {google.ima.AdEvent} adEvent The AdEvent thrown by the AdsManager.
     * @private
     */
    player.ima.onAdLoaded_ = function(adEvent) {
      if (!adEvent.getAd().isLinear()) {
        player.play();
      }
    };

    /**
     * Starts the interval timer to check the current ad time when an ad starts
     * playing.
     * @param {google.ima.AdEvent} adEvent The AdEvent thrown by the AdsManager.
     * @private
     */
    player.ima.onAdStarted_ = function(adEvent) {
      currentAd = adEvent.getAd();
      if (currentAd.isLinear()) {
        adTrackingTimer = setInterval(
            player.ima.onAdPlayheadTrackerInterval_, 250);
        // Don't bump container when controls are shown
        adContainerDiv.className = '';
      } else {
        // Bump container when controls are shown
        adContainerDiv.className = 'bumpable-ima-ad-container';
      }
    };

    /**
     * Clears the interval timer for current ad time when an ad completes.
     * @param {google.ima.AdEvent} adEvent The AdEvent thrown by the AdsManager.
     * @private
     */
    player.ima.onAdComplete_ = function(adEvent) {
      if (currentAd.isLinear()) {
        clearInterval(adTrackingTimer);
      }
    };

    /**
     * Gets the current time and duration of the ad and calls the method to
     * update the ad UI.
     * @private
     */
    player.ima.onAdPlayheadTrackerInterval_ = function() {
      var remainingTime = adsManager.getRemainingTime();
      var duration =  currentAd.getDuration();
      var currentTime = duration - remainingTime;
      currentTime = currentTime > 0 ? currentTime : 0;
      var isPod = false;
      var adPosition, totalAds;
      if (currentAd.getAdPodInfo()) {
        isPod = true;
        adPosition = currentAd.getAdPodInfo().getAdPosition();
        totalAds = currentAd.getAdPodInfo().getTotalAds();
      }

      // Update countdown timer data
      var remainingMinutes = Math.floor(remainingTime / 60);
      var remainingSeconds = Math.floor(remainingTime % 60);
      if (remainingSeconds.toString().length < 2) {
        remainingSeconds = '0' + remainingSeconds;
      }
      var podCount = ': ';
      if (isPod) {
        podCount = ' (' + adPosition + ' of ' + totalAds + '): ';
      }
      countdownDiv.innerHTML =
          'Advertisement' + podCount +
          remainingMinutes + ':' + remainingSeconds;

      // Update UI
      var playProgressRatio = currentTime / duration;
      var playProgressPercent = playProgressRatio * 100;
      progressDiv.style.width = playProgressPercent + '%';
    };

    player.ima.getPlayerWidth = function() {
      var retVal = parseInt(getComputedStyle(player.el()).width, 10) ||
          player.width();
      return retVal;
    };

    player.ima.getPlayerHeight = function() {
      var retVal = parseInt(getComputedStyle(player.el()).height, 10) ||
          player.height();
      return retVal;
    }

    /**
     * Hides the ad controls on mouseout.
     * @private
     */
    player.ima.hideAdControls_ = function() {
      playPauseDiv.style.display = 'none';
      muteDiv.style.display = 'none';
      fullscreenDiv.style.display = 'none';
      controlsDiv.style.height = '14px';
    };

    /**
     * Shows ad controls on mouseover.
     * @private
     */
    player.ima.showAdControls_ = function() {
      controlsDiv.style.height = '37px';
      playPauseDiv.style.display = 'block';
      muteDiv.style.display = 'block';
      sliderDiv.style.display = 'block';
      fullscreenDiv.style.display = 'block';
    };

    /**
     * Listener for clicks on the play/pause button during ad playback.
     * @private
     */
    player.ima.onAdPlayPauseClick_ = function() {
      if (adPlaying) {
        playPauseDiv.className = 'ima-paused';
        adsManager.pause();
        adPlaying = false;
      } else {
        playPauseDiv.className = 'ima-playing';
        adsManager.resume();
        adPlaying = true;
      }
    };

    /**
     * Listener for clicks on the mute button during ad playback.
     * @private
     */
    player.ima.onAdMuteClick_ = function() {
      if (adMuted) {
        muteDiv.className = 'ima-non-muted';
        adsManager.setVolume(1);
        // Bubble down to content player
        player.muted(false);
        adMuted = false;
        sliderLevelDiv.style.width = player.volume() * 100 + "%";
      } else {
        muteDiv.className = 'ima-muted';
        adsManager.setVolume(0);
        // Bubble down to content player
        player.muted(true);
        adMuted = true;
        sliderLevelDiv.style.width = "0%";
      }
    };

    /* Listener for mouse down events during ad playback. Used for volume.
     * @private
     */
    player.ima.onAdVolumeSliderMouseDown_ = function() {
       document.addEventListener('mouseup', player.ima.onMouseUp_, false);
       document.addEventListener('mousemove', player.ima.onMouseMove_, false);
    }

    /* Mouse movement listener used for volume slider.
     * @private
     */
    player.ima.onMouseMove_ = function(event) {
      player.ima.setVolumeSlider_(event);
    }

    /* Mouse release listener used for volume slider.
     * @private
     */
    player.ima.onMouseUp_ = function(event) {
      player.ima.setVolumeSlider_(event);
      document.removeEventListener('mousemove', player.ima.onMouseMove_);
      document.removeEventListener('mouseup', player.ima.onMouseUp_);
    }

    /* Utility function to set volume and associated UI
     * @private
     */
    player.ima.setVolumeSlider_ = function(event) {
      var percent =
          (event.clientX - sliderDiv.getBoundingClientRect().left) /
              sliderDiv.offsetWidth;
      percent *= 100;
      //Bounds value 0-100 if mouse is outside slider region.
      percent = Math.min(Math.max(percent, 0), 100);
      sliderLevelDiv.style.width = percent + "%";
      player.volume(percent / 100); //0-1
      adsManager.setVolume(percent / 100);
      if (player.volume() == 0) {
        muteDiv.className = 'ima-muted';
        player.muted(true);
        adMuted = true;
      }
      else
      {
        muteDiv.className = 'ima-non-muted';
        player.muted(false);
        adMuted = false;
      }
    }

    /**
     * Listener for clicks on the fullscreen button during ad playback.
     * @private
     */
    player.ima.onAdFullscreenClick_ = function() {
      if (player.isFullscreen()) {
        player.exitFullscreen();
      } else {
        player.requestFullscreen();
      }
    };

    /**
     * Listens for the video.js player to change its fullscreen status. This
     * keeps the fullscreen-ness of the AdContainer in sync with the player.
     * @private
     */
    player.ima.onFullscreenChange_ = function() {
      if (player.isFullscreen()) {
        fullscreenDiv.className = 'ima-fullscreen';
        if (adsManager) {
          adsManager.resize(
              window.screen.width,
              window.screen.height,
              google.ima.ViewMode.FULLSCREEN);
        }
      } else {
        fullscreenDiv.className = 'ima-non-fullscreen';
        if (adsManager) {
          adsManager.resize(
              player.ima.getPlayerWidth(),
              player.ima.getPlayerHeight(),
              google.ima.ViewMode.NORMAL);
        }
      }
    };

    /**
     * Listens for the video.js player to change its volume. This keeps the ad
     * volume in sync with the content volume if the volume of the player is
     * changed while content is playing
     * @private
     */
    player.ima.onVolumeChange_ = function() {
      var newVolume = player.muted() ? 0 : player.volume();
      if (adsManager) {
        adsManager.setVolume(newVolume);
      }
      // Update UI
      if (newVolume == 0) {
        adMuted = true;
        muteDiv.className = 'ima-muted';
        sliderLevelDiv.style.width = '0%';
      } else {
        adMuted = false;
        muteDiv.className = 'ima-non-muted';
        sliderLevelDiv.style.width = newVolume * 100 + '%';
      }
    };

    /**
     * Seeks content to 00:00:00. This is used as an event handler for the
     * loadedmetadata event, since seeking is not possible until that event has
     * fired.
     * @private
     */
    player.ima.seekContentToZero_ = function() {
      player.off('loadedmetadata', player.ima.seekContentToZero_);
      player.currentTime(0);
    };

    /**
     * Seeks content to 00:00:00 and starts playback. This is used as an event
     * handler for the loadedmetadata event, since seeking is not possible until
     * that event has fired.
     * @private
     */
    player.ima.playContentFromZero_ = function() {
      player.off('loadedmetadata', player.ima.playContentFromZero_);
      player.currentTime(0);
      player.play();
    };

    /**
     * Destroys the AdsManager, sets it to null, and calls contentComplete to
     * reset correlators. Once this is done it requests ads again to keep the
     * inventory available.
     * @private
     */
    player.ima.resetIMA_ = function() {
      adsActive = false;
      adPlaying = false;
      player.on('ended', localContentEndedListener);
      if (currentAd && currentAd.isLinear()) {
        adContainerDiv.style.display = 'none';
      }
      vjsControls.show();
      player.ads.endLinearAdMode();
      if (adTrackingTimer) {
        // If this is called while an ad is playing, stop trying to get that
        // ad's current time.
        clearInterval(adTrackingTimer);
      }
      if (adsManager) {
        adsManager.destroy();
        adsManager = null;
      }
      if (adsLoader && !contentComplete) {
        adsLoader.contentComplete();
      }
      contentComplete = false;
      allAdsCompleted = false;
    };

    /**
     * Ads an EventListener to the AdsManager. For a list of available events,
     * see
     * https://developers.google.com/interactive-media-ads/docs/sdks/html5/v3/apis#ima.AdEvent.Type
     * @param {google.ima.AdEvent.Type} event The AdEvent.Type for which to listen.
     * @param {function} callback The method to call when the event is fired.
     */
    player.ima.addEventListener = function(event, callback) {
      if (adsManager) {
        adsManager.addEventListener(event, callback);
      }
    };

    /**
     * Returns the instance of the AdsManager.
     * @return {google.ima.AdsManager} The AdsManager being used by the plugin.
     */
    player.ima.getAdsManager = function() {
      return adsManager;
    };

    /**
     * Sets the content of the video player. You should use this method instead
     * of setting the content src directly to ensure the proper ad tag is
     * requested when the video content is loaded.
     * @param {?string} contentSrc The URI for the content to be played. Leave
     *     blank to use the existing content.
     * @param {?string} adTag The ad tag to be requested when the content loads.
     *     Leave blank to use the existing ad tag.
     * @param {?boolean} playOnLoad True to play the content once it has loaded,
     *     false to only load the content but not start playback.
     */
    player.ima.setContent =
        function(contentSrc, adTag, playOnLoad) {
      player.ima.resetIMA_();
      settings.adTagUrl = adTag ? adTag : settings.adTagUrl;
      //only try to pause the player when initialised with a source already
      if (!!player.currentSrc()) {
        player.currentTime(0);
        player.pause();
      }
      if (contentSrc) {
        player.src(contentSrc);
      }
      if (playOnLoad) {
        player.on('loadedmetadata', player.ima.playContentFromZero_);
      } else {
        player.on('loadedmetadata', player.ima.seekContentToZero_);
      }
    };

    /**
     * Adds a listener for the 'ended' event of the video player. This should be
     * used instead of setting an 'ended' listener directly to ensure that the
     * ima can do proper cleanup of the SDK before other event listeners
     * are called.
     * @param {function} listener The listener to be called when content completes.
     */
    player.ima.addContentEndedListener = function(listener) {
      contentEndedListeners.push(listener);
    };

    /**
     * Adds a listener that will be called when content and all ads have
     * finished playing.
     * @param {function} listener The listener to be called when content and ads complete.
     */
    player.ima.addContentAndAdsEndedListener = function(listener) {
      contentAndAdsEndedListeners.push(listener);
    }

    /**
     * Sets the listener to be called to trigger manual ad break playback.
     * @param {function} listener The listener to be called to trigger manual ad break playback.
     */
    player.ima.setAdBreakReadyListener = function(listener) {
      adBreakReadyListener = listener;
    }

    /**
     * Pauses the ad.
     */
    player.ima.pauseAd = function() {
      if (adsActive && adPlaying) {
        playPauseDiv.className = 'ima-paused';
        adsManager.pause();
        adPlaying = false;
      }
    };

    /**
     * Resumes the ad.
     */
    player.ima.resumeAd = function() {
      if (adsActive && !adPlaying) {
        playPauseDiv.className = 'ima-playing';
        adsManager.resume();
        adPlaying = true;
      }
    };

    /**
     * Set up intervals to check for seeking and update current video time.
     * @private
     */
    player.ima.setUpPlayerIntervals_ = function() {
      updateTimeIntervalHandle =
          setInterval(player.ima.updateCurrentTime_, seekCheckInterval);
      seekCheckIntervalHandle =
          setInterval(player.ima.checkForSeeking_, seekCheckInterval);
      resizeCheckIntervalHandle =
          setInterval(player.ima.checkForResize_, resizeCheckInterval);
    };

    /**
     * Updates the current time of the video
     * @private
     */
    player.ima.updateCurrentTime_ = function() {
      if (!contentPlayheadTracker.seeking) {
        contentPlayheadTracker.currentTime = player.currentTime();
      }
    };

    /**
     * Detects when the user is seeking through a video.
     * This is used to prevent mid-rolls from playing while a user is seeking.
     *
     * There *is* a seeking property of the HTML5 video element, but it's not
     * properly implemented on all platforms (e.g. mobile safari), so we have to
     * check ourselves to be sure.
     *
     * @private
     */
    player.ima.checkForSeeking_ = function() {
      var tempCurrentTime = player.currentTime();
      var diff = (tempCurrentTime - contentPlayheadTracker.previousTime) * 1000;
      if (Math.abs(diff) > seekCheckInterval + seekThreshold) {
        contentPlayheadTracker.seeking = true;
      } else {
        contentPlayheadTracker.seeking = false;
      }
      contentPlayheadTracker.previousTime = player.currentTime();
    };

    /**
     * Detects when the player is resized (for fluid support) and resizes the
     * ads manager to match.
     *
     * @private
     */
    player.ima.checkForResize_ = function() {
      var currentWidth = player.ima.getPlayerWidth();
      var currentHeight = player.ima.getPlayerHeight();

      if (adsManager && (currentWidth != adsManagerDimensions.width ||
          currentHeight != adsManagerDimensions.height)) {
        adsManager.resize(player.ima.getPlayerWidth(),
            player.ima.getPlayerHeight(), google.ima.ViewMode.NORMAL);
      }
    }

    /**
     * Changes the flag to show or hide the ad countdown timer.
     *
     * @param {boolean} showCountdownIn Show or hide the countdown timer.
     */
    player.ima.setShowCountdown = function(showCountdownIn) {
      showCountdown = showCountdownIn;
      countdownDiv.style.display = showCountdown ? 'block' : 'none';
    };

    /**
     * Current plugin version.
     */
    var VERSION = '0.2.0';

    /**
     * Stores user-provided settings.
     */
    var settings;

    /**
     * Video element playing content.
     */
    var contentPlayer;

    /**
     * Boolean flag to show or hide the ad countdown timer.
     */
    var showCountdown;

    /**
     * Boolena flag to enable manual ad break playback.
     */
    var autoPlayAdBreaks;

    /**
     * Video.js control bar.
     */
    var vjsControls;

    /**
     * Div used as an ad container.
     */
    var adContainerDiv;

    /**
     * Div used to display ad controls.
     */
    var controlsDiv;

    /**
     * Div used to display ad countdown timer.
     */
    var countdownDiv;

    /**
     * Div used to display add seek bar.
     */
    var seekBarDiv;

    /**
     * Div used to display ad progress (in seek bar).
     */
    var progressDiv;

    /**
     * Div used to display ad play/pause button.
     */
    var playPauseDiv;

    /**
     * Div used to display ad mute button.
     */
    var muteDiv;

    /**
     * Div used by the volume slider.
     */
    var sliderDiv;

    /**
     * Volume slider level visuals
     */
    var sliderLevelDiv;

    /**
     * Div used to display ad fullscreen button.
     */
    var fullscreenDiv;

    /**
     * IMA SDK AdDisplayContainer.
     */
    var adDisplayContainer;

    /**
     * True if the AdDisplayContainer has been initialized. False otherwise.
     */
    var adDisplayContainerInitialized = false;

    /**
     * IMA SDK AdsLoader
     */
    var adsLoader;

    /**
     * IMA SDK AdsManager
     */
    var adsManager;

    /**
     * IMA SDK AdsRenderingSettings.
     */
    var adsRenderingSettings = null;

    /**
     * Ad tag URL. Should return VAST, VMAP, or ad rules.
     */
    var adTagUrl;

    /**
     * Current IMA SDK Ad.
     */
    var currentAd;

    /**
     * Timer used to track content progress.
     */
    var contentTrackingTimer;

    /**
     * Timer used to track ad progress.
     */
    var adTrackingTimer;

    /**
     * True if ads are currently displayed, false otherwise.
     * True regardless of ad pause state if an ad is currently being displayed.
     */
    var adsActive = false;

    /**
     * True if ad is currently playing, false if ad is paused or ads are not
     * currently displayed.
     */
    var adPlaying = false;

    /**
     * True if the ad is muted, false otherwise.
     */
    var adMuted = false;

    /**
     * True if our content video has completed, false otherwise.
     */
    var contentComplete = false;

    /**
     * True if ALL_ADS_COMPLETED has fired, false until then.
     */
     var allAdsCompleted = false;

    /**
     * Handle to interval that repeatedly updates current time.
     */
    var updateTimeIntervalHandle;

    /**
     * Handle to interval that repeatedly checks for seeking.
     */
    var seekCheckIntervalHandle;

    /**
     * Interval (ms) on which to check if the user is seeking through the
     * content.
     */
    var seekCheckInterval = 1000;

    /**
     * Handle to interval that repeatedly checks for player resize.
     */
    var resizeCheckIntervalHandle;

    /**
     * Interval (ms) to check for player resize for fluid support.
     */
    var resizeCheckInterval = 250;

    /**
     * Threshold by which to judge user seeking. We check every 1000 ms to see
     * if the user is seeking. In order for us to decide that they are *not*
     * seeking, the content video playhead must only change by 900-1100 ms
     * between checks. Any greater change and we assume the user is seeking
     * through the video.
     */
    var seekThreshold = 100;

    /**
     * Stores data for the content playhead tracker.
     */
    var contentPlayheadTracker = {
      currentTime: 0,
      previousTime: 0,
      seeking: false,
      duration: 0
    };

    /**
     * Stores data for the ad playhead tracker.
     */
    var adPlayheadTracker = {
      currentTime: 0,
      duration: 0,
      isPod: false,
      adPosition: 0,
      totalAds: 0
    };

    /**
     * Stores the dimensions for the ads manager.
     */
    var adsManagerDimensions = {
      width: 0,
      height: 0
    };

    /**
     * Content ended listeners passed by the publisher to the plugin. Publishers
     * should allow the plugin to handle content ended to ensure proper support
     * of custom ad playback.
     */
    var contentEndedListeners = [];

    /**
     * Content and ads ended listeners passed by the publisher to the plugin.
     * These will be called when the plugin detects that content *and all
     * ads* have completed. This differs from the contentEndedListeners in that
     * contentEndedListeners will fire between content ending and a post-roll
     * playing, whereas the contentAndAdsEndedListeners will fire after the
     * post-roll completes.
     */
    var contentAndAdsEndedListeners = [];

     /**
      * Listener to be called to trigger manual ad break playback.
      */
    var adBreakReadyListener = undefined;

    /**
     * Local content ended listener for contentComplete.
     */
    var localContentEndedListener = function() {
      if (adsLoader && !contentComplete) {
        adsLoader.contentComplete();
        contentComplete = true;
      }
      for (var index in contentEndedListeners) {
        contentEndedListeners[index]();
      }
      if (allAdsCompleted) {
        for (var index in contentAndAdsEndedListeners) {
          contentAndAdsEndedListeners[index]();
        }
      }
      clearInterval(updateTimeIntervalHandle);
      clearInterval(seekCheckIntervalHandle);
      clearInterval(resizeCheckIntervalHandle);
      player.one('play', player.ima.setUpPlayerIntervals_);
    };

    settings = extend({}, ima_defaults, options || {});

    // Currently this isn't used but I can see it being needed in the future, so
    // to avoid implementation problems with later updates I'm requiring it.
    if (!settings['id']) {
      window.console.log('Error: must provide id of video.js div');
      return;
    }
    contentPlayer = document.getElementById(settings['id'] + '_html5_api');
    // Default showing countdown timer to true.
    showCountdown = true;
    if (settings['showCountdown'] == false) {
      showCountdown = false;
    }

    autoPlayAdBreaks = true;
    if (settings['autoPlayAdBreaks'] == false) {
      autoPlayAdBreaks = false;
    }

    player.one('play', player.ima.setUpPlayerIntervals_);

    player.on('ended', localContentEndedListener);

    var contrib_ads_defaults = {
      debug: settings.debug,
      timeout: settings.timeout,
      prerollTimeout: settings.prerollTimeout
    };

    var ads_plugin_settings =
        extend({}, contrib_ads_defaults, options['contribAdsSettings'] || {});

    player.ads(ads_plugin_settings);

    adsRenderingSettings = new google.ima.AdsRenderingSettings();
    adsRenderingSettings.restoreCustomPlaybackStateOnAdBreakComplete = true;
    if (settings['adsRenderingSettings']) {
      for (var setting in settings['adsRenderingSettings']) {
        adsRenderingSettings[setting] =
            settings['adsRenderingSettings'][setting];
      }
    }

    if (settings['locale']) {
      google.ima.settings.setLocale(settings['locale']);
    }

    player.ima.createAdContainer_();

    adsLoader = new google.ima.AdsLoader(adDisplayContainer);

    adsLoader.getSettings().setVpaidMode(
        google.ima.ImaSdkSettings.VpaidMode.ENABLED);
    if (settings.vpaidAllowed == false) {
      adsLoader.getSettings().setVpaidMode(
          google.ima.ImaSdkSettings.VpaidMode.DISABLED);
    }
    if (settings.vpaidMode) {
      adsLoader.getSettings().setVpaidMode(settings.vpaidMode);
    }

    if (settings.locale) {
      adsLoader.getSettings().setLocale(settings.locale);
    }

    if (settings.numRedirects) {
      adsLoader.getSettings().setNumRedirects(settings.numRedirects);
    }

    adsLoader.getSettings().setPlayerType('videojs-ima');
    adsLoader.getSettings().setPlayerVersion(VERSION);
    adsLoader.getSettings().setAutoPlayAdBreaks(autoPlayAdBreaks);

    adsLoader.addEventListener(
      google.ima.AdsManagerLoadedEvent.Type.ADS_MANAGER_LOADED,
      player.ima.onAdsManagerLoaded_,
      false);
    adsLoader.addEventListener(
      google.ima.AdErrorEvent.Type.AD_ERROR,
      player.ima.onAdsLoaderError_,
      false);

    if (!readyCallback) {
      readyCallback = player.ima.start;
    }
    player.on('readyforpreroll', readyCallback);
    player.ready(function() {
      player.on('fullscreenchange', player.ima.onFullscreenChange_);
      player.on('volumechange', player.ima.onVolumeChange_);
    });
  };

  videojs.plugin('ima', imaPlugin);
}(window.videojs));

;(function(wnd) {
/*
 * @ 2016 Adshare GmbH - www.adshare.at
 * All rights reserved
 */

var moduleOptions = {};
var options = {};
var error404 = false;

var defaultOptions = {
    locale: null,
    afterClose: null,
    closeModalAutomatically: false,
    countdownDuration: 30,
    timeout: 0,
    videoAdTimeout: 7000,
    bannerContentUnitId: 3510730,
    content: 'smart',
    header: 'default',
    integration: 'modal',
    position: 'freedownload',
    assetPath: './lib/',
    iframeUrl: 'http://www.neuestens.de/recommendations/videoembed.html',
    adTagUrl: 'http://adfarm1.adition.com/banner?sid=3508808&wpt=X',
    fallBackAdTagUrl: 'http://adfarm1.adition.com/banner?sid=3552599&wpt=X',
    premiumButtonUrl: 'http://uploaded.net/register',
    debug : false,
    download: true,
    e404: false,
    playerOptions : {
        videoPath : './vids/'
    },
    ima : {
        id: 'adshare-videoad',
        adTagUrl: 'http://adfarm1.adition.com/banner?sid=3508808&wpt=X',
        debug: false,
        locale: 'en',
        vpaidMode: 'insecure' // google.ima.ImaSdkSettings.VpaidMode.INSECURE
    }
};

function applyOptions(opts) {
    options = opts;

    moduleOptions = (JSON.parse(JSON.stringify(defaultOptions)));
    if (opts) {
        moduleOptions.adTagUrl = determineOptionValue('adTagUrl');
        moduleOptions.fallBackAdTagUrl = determineOptionValue('fallBackAdTagUrl');

        moduleOptions.position = determineOptionValue('position');
        moduleOptions.integration = determineOptionValue('integration');
        moduleOptions.header = determineOptionValue('header');
        moduleOptions.content = determineOptionValue('content');
        moduleOptions.countdownDuration = determineOptionValue('countdownDuration');
        moduleOptions.premiumButtonUrl = determineOptionValue('premiumButtonUrl');
        moduleOptions.playerOptions.videoPath = determineOptionValue('videoPath');
        moduleOptions.bannerContentUnitId = determineOptionValue('bannerContentUnitId');
        moduleOptions.afterClose = determineOptionValue('afterClose');
        moduleOptions.closeModalAutomatically = determineOptionValue('closeModalAutomatically');
        moduleOptions.iframeUrl = determineOptionValue('iframeUrl');
        moduleOptions.timeout = determineOptionValue('timeout');
        moduleOptions.videoAdTimeout = determineOptionValue('videoAdTimeout');
        moduleOptions.assetPath = determineOptionValue('assetPath');
        moduleOptions.download = determineOptionValue('download');
        moduleOptions.locale = determineOptionValue('locale');
        moduleOptions.debug = determineOptionValue('debug');
        moduleOptions.e404 = determineOptionValue('e404');

        if (moduleOptions.countdownDuration <= 0) {
            moduleOptions.closeModalAutomatically = false;
        }

        // postprocessing of boolean parameters that are set as strings
        if (typeof moduleOptions.closeModalAutomatically == "string") {
            moduleOptions.closeModalAutomatically = moduleOptions.closeModalAutomatically == "true" ? true : false;
        }
        if (typeof moduleOptions.ima.debug == "string") {
            moduleOptions.ima.debug = moduleOptions.ima.debug == "true" ? true : false;
        }
        if (typeof moduleOptions.download == "string") {
            moduleOptions.download = moduleOptions.download == "true" ? true : false;
        }

        moduleOptions.ima.debug = moduleOptions.debug;
        moduleOptions.ima.adTagUrl = moduleOptions.adTagUrl;
        moduleOptions.ima.debug = moduleOptions.debug;

        // deprecated but we need to support it to avoid problems
        moduleOptions.ima.adTagUrl = getSessionStorageOverride('vastEndPoint') || options.vastEndPoint || moduleOptions.ima.adTagUrl;

        if (moduleOptions.debug) {
            console.log(options);
            console.table(moduleOptions);
        }
    }
}

function determineOptionValue(name) {
    options = options || {};
    window.funnelmecfg = window.funnelmecfg || {};
    return getSessionStorageOverride(name) || funnelmecfg[name] || options[name] || moduleOptions[name];
}

function getSessionStorageOverride(attributeName) {
    try {
        if (window.sessionStorage) {
            return window.sessionStorage.getItem(attributeName);
        }
    } catch (e) {
        return null;
    }
}


function addEventListener(elem, event, fn) {
    if (elem.addEventListener) {
        return elem.addEventListener(event, fn, false);
    } else if (elem.attachEvent) {
        return elem.attachEvent("on" + event, fn);
    }
}

// Replace all functionality taken from
// http://stackoverflow.com/questions/1144783/replacing-all-occurrences-of-a-string-in-javascript
function replaceAll(str, find, replace) {
    return str.replace(new RegExp(escapeRegExp(find), 'g'), replace);
}

function escapeRegExp(str) {
    return str.replace(/([.*+?^=!:${}()|\[\]\/\\])/g, "\\$1");
}

/**
 * This function will append an external JavaScript to the head of the document.
 *
 *  @param {String} location - The location of the file you'd like to load.
 *  @param {Function} callback - [OPTIONAL] A function to call when the script has completed downloading.
 *
 *  Copied from the optimizely documenation
 *  http://developers.optimizely.com/javascript/code-samples/index.html#helpers-external-js
 */

function loadScript(location, callback){
    var fileRef = document.createElement('script');
    fileRef.setAttribute('type','text/javascript');

    if (callback) {
        if (fileRef.readyState) {  // IE
            fileRef.onreadystatechange = function() {
                if (fileRef.readyState == 'loaded' || fileRef.readyState == 'complete') {
                    fileRef.onreadystatechange = null;
                    callback();
                }
            };
        } else {  // Non-IE
            fileRef.onload = function(){
                callback();
            };
        }
    }

    fileRef.setAttribute('src', location);
    document.head.appendChild(fileRef);
};

function startCountdownTimer() {
    adsharecountdownstart = new Date().getTime();
    setTimeout(countdownTimer, 100);
}

function countdownTimer() {
    var timeLeft = getCountdownTimeLeft();
    if (timeLeft <= 0) {
        if (document.getElementById('adshare-countdown')) {
            document.getElementById('adshare-countdown').innerHTML = '';
        } else if (document.getElementById('countdownCounter')) {
            document.getElementById('countdownCounter').innerHTML = '';
        }
        try {
            if (document.getElementById('headline')) {
                document.getElementById('headline').innerHTML = getReadyMessage();
                document.getElementById('headline').addEventListener('click', closePopup);
            } else if (document.getElementById('headlineDE')) {
                document.getElementById('headlineDE').innerHTML = getReadyMessage();
                document.getElementById('headlineDE').addEventListener('click', closePopup);
            }
            var iframe = document.getElementById('adshare-banner-iframe');
            var iframeDocument = iframe.contentDocument || iframe.contentWindow.document;
            if (iframeDocument.getElementById('headline')) {
                iframeDocument.getElementById('headline').innerHTML = getReadyMessage();
                iframeDocument.getElementById('headline').addEventListener('click', closePopup);
            } else if (document.getElementById('headlineDE')) {
                iframeDocument.getElementById('headlineDE').innerHTML = getReadyMessage();
                iframeDocument.getElementById('headlineDE').addEventListener('click', closePopup);
            }
        } catch (e) {}

        showCloseButton();
        if (moduleOptions.closeModalAutomatically) {
            closePopup();
        }
    } else {
        if (document.getElementById('adshare-countdown')) {
            var message = moduleOptions.messages.countdownMessage.replace("{0}", timeLeft);
            document.getElementById('adshare-countdown').innerHTML = '<span style="padding-bottom: 5px; display: inline-block;">' + message + "</span>";
        } else if (document.getElementById('countdownCounter')) {
            document.getElementById('countdownCounter').innerHTML = timeLeft;
        }
        setTimeout(countdownTimer, 100);
    }
}

function getCountdownTimeLeft() {
    var now = new Date().getTime();
    return moduleOptions.countdownDuration - Math.floor((now - adsharecountdownstart) / 1250);
}



function getCountdownText(download) {

    if (!moduleOptions.download) {
        return 'Oops! We couldn\'t find what you are looking for ...';
    }
    if (moduleOptions.countdownDuration <= 0) {
        return 'Your file is downloading now!';
    }

    if (download) {
        var countdownText = i18n('countdown_text');
        countdownText += i18n('premium_benefits', [moduleOptions.assetPath]);
        return countdownText;
    } else {
        return i18n('countdown_only');
    }
}
var messages = {
    'de' : {
        premium_button_title: 'Premium Download!',
        premium_button_text: 'Fullspeed &amp; Parallele Downloads',
        countdown_text: 'Ihr Download startet in <span id="countdownCounter">30</span> Sekunden, oder jetzt mit Premium sofort laden!',
        premium_benefits: '<span id="benefitDE" class="benefit-area"><img class="benefit-img" src="{0}/check.png"><p class="benefit">Keine Werbung</p><img class="benefit-img" src="{0}/check.png"><p class="benefit">Full speed</p><img class="benefit-img" src="{0}/check.png"><p class="benefit">20 mal schneller</p></span>',
        countdown_only: '<span id="countdownCounter">30</span> Sekunden</a>',
        countdown_no_file: 'Oops! Leider konnten wir das nicht finden ...',
        countdown_downloading: 'ihre Datei lädt jetzt herunter!',
        download_ready: 'Dein Download ist bereit. Klicke hier um ihn zu starten.',
        subtitle_1: 'Als Premium Nutzer starten all Ihre Downloads sofort!',
        subtitle_2: 'Zus&auml;tzlich wird Ihnen keine Werbung angezeigt und Ihre Downloads laden schneller herunter!'
    },
    'en' : {
        premium_button_title: 'Premium Download!',
        premium_button_text: 'Fullspeed &amp; simulataneous Downloads',
        countdown_text: 'Your download starts in <span id="countdownCounter">30</span> seconds, or go for premium now!',
        premium_benefits: '<span id="benefit" class="benefit-area"><img class="benefit-img" src="{0}/check.png"><p class="benefit">No Ads</p><img class="benefit-img" src="{0}/check.png"><p class="benefit">Full speed</p><img class="benefit-img" src="{0}/check.png"><p class="benefit">20 times faster</p></span>',
        countdown_only: '<span id="countdownCounter">30</span> seconds</a>',
        countdown_no_file: 'Oops! We couldn\'t find what you are looking for ...',
        countdown_downloading: 'Your file is downloading now!',
        download_ready: 'Your download is ready. Click here to download your file.',
        subtitle_1: 'If you become a premium user today, your downloads will start immediately!',
        subtitle_2: 'Additionally, no ads will be displayed and you can download much faster.'
    },
    'es' : {
        premium_button_title: 'descarga Premium!',
        premium_button_text: 'máxima velocidad & descargas paralelas',
        countdown_text: '¡El download se iniciará en <span id="countdownCounter">30</span> segundos, oo puedes hacer el download ahora con el acceso premium!',
        premium_benefits: '<span id="benefitES" class="benefit-area"><img class="benefit-img" src="{0}/check.png"><p class="benefit">No Ads</p><img class="benefit-img" src="{0}/check.png"><p class="benefit">Full speed</p><img class="benefit-img" src="{0}/check.png"><p class="benefit">20 times faster</p></span>',
        countdown_only: '<span id="countdownCounter">30</span> segundos</a>',
        countdown_no_file: 'Perdón no podimos encontrar lo que estabas buscando...',
        countdown_downloading: 'Tu archivo se esta descargando!',
        download_ready: 'Tu descarga esta lista. Clique aqui para descargar tu archivo.',
        subtitle_1: '¡Mientras esperas, checa los temas de mayor tendencia en internet!',
        subtitle_2: 'Todas las historias se abrirán en una nueva pestana. <span class="info-addition">El download no será interrumpido.</span>'
    },
    'fr' : {
        premium_button_title: 'Premium Download!',
        premium_button_text: 'Vitesse max & downloads simultanés',
        countdown_text: 'Ton téléchargement démarrera dans <span id="countdownCounter">30</span> secondes, ou télécharge tout de suite avec l’accès premium!',
        premium_benefits: '<span id="benefitFR" class="benefit-area"><img class="benefit-img" src="{0}/check.png"><p class="benefit">No Ads</p><img class="benefit-img" src="{0}/check.png"><p class="benefit">Full speed</p><img class="benefit-img" src="{0}/check.png"><p class="benefit">20 times faster</p></span>',
        countdown_only: '<span id="countdownCounter">30</span> secondes</a>',
        countdown_no_file: 'Oops! We couldn\'t find what you are looking for ...',
        countdown_downloading: 'Votre fichier télécharge maintenant!',
        download_ready: 'Votre téléchargement est prêt. Cliquez ici pour télécharger le fichier.',
        subtitle_1: 'En attendant, va voir les sujets les plus tendances sur Internet!',
        subtitle_2: 'Toutes les histoires s’ouvriront dans un nouvel onglet. <span class="info-addition">Ton téléchargement ne sera PAS interrompu.</span>'
    },
    'tr' : {
        premium_button_title: 'Premium Download!',
        premium_button_text: 'Maksimum hız & paralel indirme…						',
        countdown_text: 'Your download starts in <span id="countdownCounter">30</span> seconds, or go for premium now!',
        premium_benefits: '<span id="benefitTR" class="benefit-area"><img class="benefit-img" src="{0}/check.png"><p class="benefit">No Ads</p><img class="benefit-img" src="{0}/check.png"><p class="benefit">Full speed</p><img class="benefit-img" src="{0}/check.png"><p class="benefit">20 times faster</p></span>',
        countdown_only: '<span id="countdownCounter">30</span> Sekunden</a>',
        countdown_no_file: 'Oops! We couldn\'t find what you are looking for ...',
        countdown_downloading: 'Your file is downloading now!',
        download_ready: 'Your download is ready. Click here to download your file.',
        subtitle_1: 'If you become a premium user today, your downloads will start immediately!',
        subtitle_2: 'Additionally, no ads will be displayed and you can download much faster.'
    }
};

function i18n(msg, params) {
    var message = messages[getLanguage()][msg];
    if (params && params.length > 0) {
        for (var i = 0; i < params.length; i++) {
            message = replaceAll(message, '{' + i+ '}', params[i]);
        }
    }
    return message;
}

function getLanguage() {
    if (isValidLocale(moduleOptions.locale)) {
        return moduleOptions.locale;
    } else if (isValidLocale(getBrowserLanguage())) {
        return getBrowserLanguage();
    }
    return 'en';
}

function isValidLocale(locale) {
    if (locale == 'de' || locale == 'en' || locale == 'fr' || locale == 'es' || locale == 'tr') {
        return true;
    }
    return false;
}


function getBrowserLanguage() {
    var lang = navigator.language || navigator.userLanguage;
    if (lang.length > 2) {
        lang = lang.substr(0, 2);
    }
    return lang;
}


function receiveMessage(event)
{
    var origin = event.origin || event.originalEvent.origin; // For Chrome, the origin property is in the event.originalEvent object.
    if (event.data.type == 'resize') {
        if (moduleOptions.debug) {
            if (console) console.log("Resize event received!");
            if (console) console.log(event.data);
        }

        var iFrame = document.querySelector('.pico-content iframe');
        iFrame.style.height = event.data.height + "px";
        iFrame.style.width = event.data.width + "px"
    } else if (event.data.type == 'displaybanner') {
        displayBannerAd();
    } else if (event.data.type == 'taboola') {
        displayTalooba();
    } else if (event.data.type == 'contentreco') {
        displayContentAd();
    } else if (event.data.type == 'closepopup') {
        closePopup();
    } else if (event.data.type == 'closetaboola') {
        displayContentAdFunnel();
    }
}


function createModalWindow(content) {

    useFallback = false;

    var wrappedContent = wrapContainer(content);
    var modal = picoModal({
        content: wrappedContent,
        overlayClose: false,
        escCloses: false,
        closeStyles: {},
        modalStyles: {}
    });
    modal.beforeClose(function() {
        var elem =document.querySelector('.pico-content');
        elem.parentNode.removeChild(elem);
        try {
            destroyVideoJsPlayer();
        } catch (e) {}
        modal = null;
    });
    modal.afterShow(function() {
        if (moduleOptions.countdownDuration > 0) {
            hideCloseButton();
            startCountdownTimer();
        }
    });
    modal.afterClose(function() {
        try {
            closePopup();
            if (moduleOptions.afterClose) {
                moduleOptions.afterClose.apply(this);
            }
        } catch (e) {}
    });
    return modal;
}


function createContainer(content) {
    var boxHeight = 480;
    var containerToEmulate = document.getElementById('contentBoxContainer');
    var containerHeight = containerToEmulate.clientHeight;
    if (containerHeight > boxHeight) {
        boxHeight = containerHeight;
    }
    var html = '<div class="box" id="fakeContentBoxContainer" style="position: absolute; left: 0px; top: 127px; width: 914px; height: ' + boxHeight + 'px;"><div id="adshare-modal-content">'
        + content
        + '<button class="pico-close" aria-label="Close" style="display: none;">×</button></div>';

    var div = document.createElement('div');
    div.innerHTML = html;
    var element = div.firstChild;

    document.getElementById('download').appendChild(element);
    var container = document.getElementById('fakeContentBoxContainer');
    document.getElementById('contentBoxContainer').style.minHeight = container.style.height;
    addEventListener(document.querySelector('.pico-close'), 'click', function() {
        console.log("closePopup should be fired");
        closePopup();
    });
    return container;
}

function create404Container(content) {
    var boxHeight = 756;
    //94px with banner visible
    var html = '<div class="box" id="fakeContentBoxContainer" style="position: absolute; left: 0px; top: 0; width: 966px; background-color: rgba(255,255,255,.98); height: ' + boxHeight + 'px; z-index: 1;"><div id="adshare-modal-content style="margin-left: 20px;">'
        + content
        + '<button class="pico-close" aria-label="Close" style="cursor:pointer">×</button></div>';

    var div = document.createElement('div');
    div.innerHTML = html;
    var element = div.firstChild;

    document.querySelectorAll('.aC')[1].appendChild(element);
    var container = document.getElementById('fakeContentBoxContainer');
    addEventListener(document.querySelector('.pico-close'), 'click', function() {
        console.log("closePopup should be fired");
        closePopup();
    });
    return container;
}


function getReadyMessage() {
    var downloadReady = i18n('download_ready') + i18n('premium_benefits', [moduleOptions.assetPath]);
    return downloadReady;
}

function getTitleTexts() {

    if (!moduleOptions.download) {
        return {
            'headline' : 'Maybe one of the following stories will be interesting to you.' ,
            'infoText' : 'All stories will be opened in a new tab.',
            'downloadReady' : ''
        };
    }

    return {
        'headline' : i18n('subtitle_1'),
        'infoText' : i18n('subtitle_2'),
        'downloadReady' : getReadyMessage()
    };
}

function getHeaderSection() {
    var countdownText = getCountdownText(moduleOptions.download);
    var texts = getTitleTexts();

    var lang = getBrowserLanguage();

    var langEdit = '';
    if(lang == 'de') {
        langEdit = 'DE';
    }

    var header =
        '<div id="text-area">'
        + '   <h1 id="headline' + langEdit + '">' + countdownText + '</h1>'
        + '   <h2 id="subline' + langEdit + '">' + texts['headline'] + '</h2>'
        + '   <p id="info">' + texts['infoText'] + '</span></p>'
        + '</div>';

    if (moduleOptions.header == 'round') {
        header = header + getRoundButton();
    } else if (moduleOptions.header == 'big') {
        header = header + getBigButton();
    } else {
        header = header + getDefaultButton();
    }
    
    if(moduleOptions.e404 == true || error404 == true) {
        header = '';
    }

    return header;
}

function getBigButton() {
    var premiumButton =
        '<div id="premium-button-area">'
        + '  <table class="tfree tfree-big">'
        + '    <tbody>'
        + '      <tr class="aT">'
        + '        <td style="width:294px">'
        + '          <form method="get" action="' + moduleOptions.premiumButtonUrl + '">'
        + '            <button type="submit" class="prem" style="background: no-repeat url(' + moduleOptions.assetPath + 'premium-big.png);" onmousedown="try{_gaq.push([\'_trackEvent&\', \'premium\', tracking_method]); } catch(e) {}" onmouseover="Download._blink=false" onmouseout="Download._blink=true;">'
        + '            <h1>' + i18n('premium_button_title') + '</h1>' + i18n('premium_button_text') + '</button>'
        + '          </form>'
        + '        </td>'
        + '      </tr>'
        + '    </tbody>'
        + '  </table>'
        + '</div>';
    return premiumButton;
}

function getDefaultButton() {
    var premiumButton =
        '<div id="premium-button-area">'
        + '  <table class="tfree tfree-standard">'
        + '    <tbody>'
        + '      <tr class="aT">'
        + '        <td style="width:294px">'
        + '          <form method="get" action="' + moduleOptions.premiumButtonUrl + '">'
        + '            <button type="submit" class="prem" onmousedown="try{_gaq.push([\'_trackEvent&\', \'premium\', tracking_method]); } catch(e) {}" onmouseover="Download._blink=false" onmouseout="Download._blink=true;">'
        + '            <h1>' + i18n('premium_button_title') + '</h1>' + i18n('premium_button_text') + '</button>'
        + '          </form>'
        + '        </td>'
        + '      </tr>'
        + '    </tbody>'
        + '  </table>'
        + '</div>';
    return premiumButton;
}

function getRoundButton() {
    var premiumButton =
        '<div id="premium-button-area">'
        + '  <table class="tfree tfree-round">'
        + '    <tbody>'
        + '      <tr class="aT">'
        + '        <td style="width:294px">'
        + '          <form method="get" action="' + moduleOptions.premiumButtonUrl + '">'
        + '            <button type="submit" class="prem" style="background: no-repeat url(' + moduleOptions.assetPath + 'premium-round.png);" onmousedown="try{_gaq.push([\'_trackEvent&\', \'premium\', tracking_method]); } catch(e) {}" onmouseover="Download._blink=false" onmouseout="Download._blink=true;">'
        + '            <h1>' + i18n('premium_button_title') + '</h1>' + i18n('premium_button_text') + '</button>'
        + '            <div id="button-bg" ></div>'
        + '          </form>'
        + '        </td>'
        + '      </tr>'
        + '    </tbody>'
        + '  </table>'
        + '</div>';
    return premiumButton;
}


function hideCloseButton() {
    document.querySelector('.pico-close').style.display = "none";
}

function showCloseButton() {
    document.querySelector('.pico-close').style.display = "block";
}


function wrapContainer(content) {
    return '<div id="adshare-modal-content">' +content + '</div>';
}

function closePopup() {
    console.log("Close Popup!");
    destroyVideoJsPlayer();
    if (modal) {
        try {
            modal.close();
        } catch (e) {}
    } else if (container) {
        try {
            if (moduleOptions.afterClose) {
                moduleOptions.afterClose.apply(this);
            }
        } catch (e) {}
        container.parentNode.removeChild(container);
        document.getElementById('contentBoxContainer').style.minHeight = "";
    }
    container = null;
    modal = null;
}



function displayBannerAd() {
    if (modal) {
        document.getElementById('adshare-modal-content').innerHTML = getBannerElementHTML();
    } else if (container) {
        container.firstChild.innerHTML = getBannerElementHTML();
        if (getCountdownTimeLeft() <= 0) {
            countdownTimer();
        }
    } else {
        if (moduleOptions.integration == 'native') {
            container = createContainer(getBannerElementHTML());
            startCountdownTimer();
        } else {
            modal = createModalWindow(getBannerElementHTML());
            modal.show();
        }
    }
    setTimeout(function () {
        writeBannerIFrameHtml();
    }, 0);

}

function getBannerElementHTML() {
    var bannerTag = '<iframe id="adshare-banner-iframe" scrolling="no" src="about:blank" style="border: 0; height: 281px; width: 315px"></iframe>';

    var prefix = '<div id="adshare-countdown" style="font-family: \'Helvetica Neue Light\', \'Lucida Grande\', \'Calibri\', \'Arial\', sans-serif; font-size: 10px; text-align: center"></div>';
    var postfix = '<div style="text-align: center"><form method="get" action="' + moduleOptions.premiumButtonUrl + '" class="tfree"><button type="submit" class="prem"><h1>' + i18n('premium_button_title') + '</h1>' + i18n('premium_button_text') + '</button></form></div>';
    return prefix + bannerTag + postfix;
}


function writeBannerIFrameHtml() {
    var iframe = document.getElementById('adshare-banner-iframe');
    var content = getIframeContentClassic();
    iframe.contentWindow.contents = content;
    iframe.src = 'javascript:window["contents"]';
}


function getIframeContentClassic() {
    var content
        = '<html>'
        + '  <head>'
        + '  <\/head>'
        + '  <body>'
        + '    <div id="medium_rectangle">'
        + '      <script type="text/javascript" src="http://imagesrv.adition.com/js/adition.js"><\/script>'
        + '      <script type="text/javascript" src="http://adfarm1.adition.com/js?wp_id=' + moduleOptions.bannerContentUnitId + '"><\/script>'
        + '      <noscript><a href="http://adfarm1.adition.com/click?sid=' + moduleOptions.bannerContentUnitId + '&ts=' + new Date().getTime() + '">'
        + '        <img src="http://adfarm1.adition.com/banner?sid=' + moduleOptions.bannerContentUnitId + '&ts=' + new Date().getTime() + '" border="0">'
        + '      <\/a><\/noscript>'
        + '    <\/div>'
        + '  <\/body>'
        + '<\/html>';

    return content;
}



function getContentAdContent() {
    var content
        = '<html>'
        + '  <head>'
        + '    <meta charset="utf-8">'
        + '    <meta name="viewport" content="width=device-width, initial-scale=1">'
        + '  <\/head>'
        + '  <body>'
        + '  <div id="wrapper" style="width: 100%">'
        + '    <div id="contentad178265"><\/div>'
        + '      <script>'
        + '        (function(d) {'
        + '          var params = {'
        + '            id: "58b57e87-e9fb-4726-abae-6735b0f1954c",'
        + '            d:  "cHJvbW90aW9uLnVwbG9hZGVkLm5ldA==",'
        + '            wid: "contentad178265",'
        + '            cb: (new Date()).getTime()'
        + '          };'

        + '          var qs=[];'
        + '          for(var key in params) qs.push(key+"="+encodeURIComponent(params[key]));'
        + '          var s = d.createElement("script");s.type="text/javascript";s.async=true;'
        + '          var p = "https:" == document.location.protocol ? "https" : "http";'
        + '          s.src = p + "://api.content.ad/Scripts/widget2.aspx?" + qs.join("&");'
        + '          d.getElementById("contentad178265").appendChild(s);'
        + '        })(document);'
        + '    <\/script>'

        + '    <\/div>'
        + '  <\/body>'
        + '<\/html>';

    return content;
}


function getContentAdIframeHTML() {
    var bannerTag = '<iframe id="adshare-banner-iframe" scrolling="no" src="about:blank" style="border: 0; height: 740px; width: 920px"></iframe>';

    var prefix = getHeaderSection();
    var postfix = '';
    return prefix + bannerTag + postfix;
}

function getContentAdIframeHTMLV2() {
    var url = moduleOptions.assetPath + 'contentad_' + window.location.hostname + '.html';
    var bannerTag = '<iframe id="adshare-banner-iframe" scrolling="no" src="' + url + '" style="border: 0; height: 570px; width: 920px"></iframe>';

    var prefix = getHeaderSection();
    var postfix = '';
    return prefix + bannerTag + postfix;
}

function getContentAdFunnelIframeHtml() {
    var bannerTag = '<iframe id="adshare-banner-iframe" scrolling="no" src="http://funnel-me.com/v1.html" style="border: 0; height: 680px; width: 1100px;"></iframe>';
    var prefix = getHeaderSection();
    var postfix = '';
    return prefix + bannerTag + postfix;
}

function getContentAdFunnel404IframeHtml() {
    var bannerTag = '<iframe id="adshare-banner-iframe" scrolling="no" src="http://funnel-me.com/v404.html" style="border: 0; height: 680px; width: 965px;"></iframe>';
    var prefix = '';
    var postfix = '';
    return prefix + bannerTag + postfix;
}

function displayContentAdFunnel() {
    if (modal) {
        document.getElementById('adshare-modal-content').innerHTML = getContentAdFunnelIframeHtml();
        if (getCountdownTimeLeft() <= 0) {
            countdownTimer();
        }
    } else if (container) {
        container.firstChild.innerHTML = getContentAdFunnelIframeHtml();
        if (getCountdownTimeLeft() <= 0) {
            countdownTimer();
        }
    } else {
        if (moduleOptions.integration == 'native') {
            if(error404) {
            container = create404Container(getContentAdFunnel404IframeHtml());
            } else {
            container = createContainer(getContentAdFunnelIframeHtml());
            startCountdownTimer();
            }
        } else {
            modal = createModalWindow(getContentAdFunnelIframeHtml());
            modal.show();
        }
    }
}



function displayContentAd() {
    if (modal) {
        document.getElementById('adshare-modal-content').innerHTML = getContentAdIframeHTML();

    } else if (container) {
        container.firstChild.innerHTML = getContentAdIframeHTML();
        if (getCountdownTimeLeft() <= 0) {
            countdownTimer();
        }
    } else {
        if (moduleOptions.integration == 'native') {
            container = createContainer(getContentAdIframeHTML());
            startCountdownTimer();
        } else {
            modal = createModalWindow(getContentAdIframeHTML());
            modal.show();
        }
    }
    setTimeout(function () {
        writeContentAdIframeHtml();
    }, 0);
}

function displayContentAdV2() {
    if (modal) {
        document.getElementById('adshare-modal-content').innerHTML = getContentAdIframeHTMLV2();
    } else if (container) {
        container.firstChild.innerHTML = getContentAdIframeHTMLV2();
        if (getCountdownTimeLeft() <= 0) {
            countdownTimer();
        }
    } else {
        if (moduleOptions.integration == 'native') {
            container = createContainer(getContentAdIframeHTMLV2());
            startCountdownTimer();
        } else {
            modal = createModalWindow(getContentAdIframeHTMLV2());
            modal.show();
        }
    }
}


function writeContentAdIframeHtml() {
    var iframe = document.getElementById('adshare-banner-iframe');
    var content = getContentAdContent();
    iframe.contentWindow.contents = content;
    iframe.src = 'javascript:window["contents"]';
}



function displayContentIframe() {
    if (modal) {
        document.getElementById('adshare-modal-content').innerHTML = getContentIframeHtml();
        if (getCountdownTimeLeft() <= 0) {
            countdownTimer();
        }
    } else if (container) {
        container.firstChild.innerHTML = getContentIframeHtml();
        if (getCountdownTimeLeft() <= 0) {
            countdownTimer();
        }
    } else {
        if (moduleOptions.integration == 'native') {
            container = createContainer(getContentIframeHtml());
            startCountdownTimer();
        } else {
            modal = createModalWindow(getContentIframeHtml());
            modal.show();
        }
    }
}

function getContentIframeHtml() {
    var bannerTag = '<div style="width: 100%; text-align: center"><iframe id="adshare-banner-iframe" scrolling="no" src="' + moduleOptions.iframeUrl + '" style="border: 0; height: 360px; width: 640px; margin: 20px auto;"></iframe></div></div>';
    var prefix = getHeaderSection();
    var postfix = '';
    return prefix + bannerTag + postfix;
}

function displayContent404Iframe() {
    container = create404Container(getContent404IframeHtml());
}

function getContent404IframeHtml() {
    var bannerTag = '<div style="width: 100%; text-align: center"><iframe id="adshare-banner-iframe" src="http://funnel-me.com/iframe404content.php" style="border: 0; height: 727px; width: 100%; margin: 30px auto;"></iframe></div></div>';
    var prefix = '';
    var postfix = '';
    return prefix + bannerTag + postfix;
}
/*
function getContentAdFunnel404IframeHtml() {
    var bannerTag = '<iframe id="adshare-banner-iframe" scrolling="no" src="http://funnel-me.com/v404.html" style="border: 0; height: 680px; width: 965px;"></iframe>';
    var prefix = '';
    var postfix = '';
    return prefix + bannerTag + postfix;
}*/
function displayTalooba() {
    if (modal) {
        document.getElementById('adshare-modal-content').innerHTML = getTaboolaIframeHTML();
    } else if (container) {
        container.firstChild.innerHTML = getTaboolaIframeHTML();
        if (getCountdownTimeLeft() <= 0) {
            countdownTimer();
        }
    } else {
        if (moduleOptions.integration == 'native') {
            container = createContainer(getTaboolaIframeHTML());
            startCountdownTimer();
        } else {
            modal = createModalWindow(getTaboolaIframeHTML());
            modal.show();
        }
    }
    setTimeout(function () {
        writeTaloobaIFrameHtml();
    }, 0);
}

function displayTalooba2ndCall() {
    if (modal) {
        document.getElementById('adshare-modal-content').innerHTML = getTaboolaIframeHTML();
    } else if (container) {
        container.firstChild.innerHTML = getTaboolaIframeHTML();
        if (getCountdownTimeLeft() <= 0) {
            countdownTimer();
        }
    } else {
        if (moduleOptions.integration == 'native') {
            container = createContainer(getTaboolaIframeHTML());
            startCountdownTimer();
        } else {
            modal = createModalWindow(getTaboolaIframeHTML());
            modal.show();
        }
    }
    setTimeout(function () {
        writeTalooba2ndCallIFrameHtml();
    }, 0);
}

function getTaboolaIframeHTML() {
    var bannerTag = '<iframe id="adshare-banner-iframe" scrolling="no" src="about:blank" style="border: 0; height: 720px; width: 920px"></iframe>';

    var prefix = getHeaderSection();
    var postfix = '';
    
    if(moduleOptions.e404 == true || error404 == true) {
        prefix = '';
    }
    
    return prefix + bannerTag + postfix;
}


function writeTaloobaIFrameHtml() {
    var iframe = document.getElementById('adshare-banner-iframe');
    var content = getTaboolaContent(moduleOptions.download);
    iframe.contentWindow.contents = content;
    iframe.src = 'javascript:window["contents"]';
}

function writeTalooba404IFrameHtml() {
    var iframe = document.getElementById('adshare-banner-iframe');
    var content = getTaboolaContent(moduleOptions.download);
    iframe.contentWindow.contents = content;
    iframe.src = 'javascript:window["contents"]';
}

function writeTalooba2ndCallIFrameHtml() {
    var iframe = document.getElementById('adshare-banner-iframe');
    var content = getTaboola2ndCallContent(moduleOptions.download);
    iframe.contentWindow.contents = content;
    iframe.src = 'javascript:window["contents"]';
}


function getTaboolaContent(showTitle) {
    var lang = getBrowserLanguage();

    var link = '//cdn.taboola.com/libtrc/uploaded/loader.js';

    if (lang == 'de') {
        link = '//cdn.taboola.com/libtrc/uploaded-uploadedde/loader.js';
    } else if (lang == 'es') {
        link = '//cdn.taboola.com/libtrc/uploaded-uploadedes/loader.js';
    } else if (lang == 'fr') {
        link = '//cdn.taboola.com/libtrc/uploaded-uploadedfr/loader.js';
    }

    var content
        = '<html>'
        + '  <head>'
        + '    <meta charset="utf-8">'
        + '    <meta name="viewport" content="width=device-width, initial-scale=1">'
        + '    <script type="text/javascript">'
        + '      window._taboola = window._taboola || [];_taboola.push({article:"auto"});'
        + '      !function (e, f, u) { e.async = 1; e.src = u; f.parentNode.insertBefore(e, f); }(document.createElement("script"),'
        + '      document.getElementsByTagName("script")[0], "' + link + '");'
        + '      function postCloseTaboolaMessage() { window.parent.postMessage({type: "closetaboola"}, "*"); }'
        + '    <\/script>'
        + '  <\/head>'
        + '  <body>'
        + '  <div id="wrapper" style="width: 100%">';

    content = content
        + '    <div id="container" style="position: relative; padding-top: 10px;">'
        + '      <a id="closeTaboola" href="#" onclick="postCloseTaboolaMessage(); return false;" style="position: absolute; right: 21px; top: 0px;font-family: Arial, Helvetica, sans-serif; font-size: 11.0px; text-decoration: none; color: #000;">[Close Taboola]</a>'
        + '      <div id="taboola-exit-pop-thumbnails"></div>'
        + '        <script type="text/javascript">'
        + '          window._taboola = window._taboola || [];'
        + '          _taboola.push({ mode: "thumbnails-a", container: "taboola-exit-pop-thumbnails", placement: "Exit Pop Thumbnails", target_type: "mix" });'
        + '        </script>'
        + '      </div>'
        + '    </div>'
        + '    <script type="text/javascript">'
        + '      window._taboola = window._taboola || []; _taboola.push({flush: true});'
        + '    <\/script>'
        + '  <\/body>'
        + '<\/html>';

    return content;
}

function getTaboola2ndCallContent(showTitle) {
    var lang = getBrowserLanguage();

    var link = '//cdn.taboola.com/libtrc/uploaded/loader.js';
    var placement = 'End of Download';
    var container = 'taboola-end-of-download';

    if (lang == 'de') {
        link = '//cdn.taboola.com/libtrc/uploaded-uploadedde/loader.js';
        container = "taboola-end-of-download";
        placement =  "End of Download";
    } else if (lang == 'es') {
        link = '//cdn.taboola.com/libtrc/uploaded-uploadedes/loader.js';
        container = "taboola-end-of-download";
        placement =  "End of Download";
    } else if (lang == 'fr') {
        link = '//cdn.taboola.com/libtrc/uploaded-uploadedfr/loader.js';
        container = "taboola-end-of-download";
        placement =  "End of Download";
    }

    var content
        = '<html>'
        + '  <head>'
        + '    <meta charset="utf-8">'
        + '    <meta name="viewport" content="width=device-width, initial-scale=1">'
        + '    <script type="text/javascript">'
        + '      window._taboola = window._taboola || [];_taboola.push({article:"auto"});'
        + '      !function (e, f, u) { e.async = 1; e.src = u; f.parentNode.insertBefore(e, f); }(document.createElement("script"),'
        + '      document.getElementsByTagName("script")[0], "' + link + '");'
        + '      function postCloseTaboolaMessage() { window.parent.postMessage({type: "closetaboola"}, "*"); }'
        + '    <\/script>'
        + '  <\/head>'
        + '  <body>'
        + '  <div id="wrapper" style="width: 100%">';

    content = content
        + '    <div id="container" style="position: relative; padding-top: 10px;">'
        + '      <a id="closeTaboola" href="#" onclick="postCloseTaboolaMessage(); return false;" style="position: absolute; right: 21px; top: 0px;font-family: Arial, Helvetica, sans-serif; font-size: 11.0px; text-decoration: none; color: #000;">[Close Taboola]</a>'
        + '      <div id="' + container + '"></div>'
        + '        <script type="text/javascript">'
        + '          window._taboola = window._taboola || [];'
        + '          _taboola.push({ mode: "thumbnails-b", container: "' + container +'", placement: "' + placement + '", target_type: "mix" });'
        + '        </script>'
        + '      </div>'
        + '    </div>'
        + '    <script type="text/javascript">'
        + '      window._taboola = window._taboola || []; _taboola.push({flush: true});'
        + '    <\/script>'
        + '  <\/body>'
        + '<\/html>';

    return content;
}

function displayTalooba404() {
    /*modal = createModalWindow(getTaboolaIframeHTML());
    modal.show();*/
    container = create404Container(getTaboolaIframeHTML());
    setTimeout(function () {
        writeTaloobaIFrameHtml();
    }, 0);
}
function displayVideoAd() {
    displaysFallbackAd = false;
    if (modal) {
        destroyVideoJsPlayer();
        document.getElementById('adshare-modal-content').innerHTML = getVideoElementHTML();
    } else if (container) {
        container.firstChild.innerHTML = getVideoElementHTML();
        if (getCountdownTimeLeft() <= 0) {
            countdownTimer();
        }
    } else {
        if (moduleOptions.integration == 'native') {
            container = createContainer(getVideoElementHTML());
            startCountdownTimer();
        } else {
            modal = createModalWindow(getVideoElementHTML());
            modal.show();
        }
    }

    setTimeout(function () {
        var videoElement = document.getElementById("adshare-videoad");
        setupVideoJsPlayer(videoElement);
        hasEndedFired = false;
    }, 0);
}


function getVideoElementHTML() {
    var videoTag =
        '<div style="text-align: center; width: 920px; margin-top: 20px;">' +
        '<video id="adshare-videoad" class="video-js vjs-default-skin" controls preload="auto" style="margin: auto">' +
        '  <source src="' + moduleOptions.playerOptions.videoPath + 'empty.mp4" type="video/mp4"/>' +
        '  <source src="' + moduleOptions.playerOptions.videoPath + 'empty.webm" type="video/webm"/>' +
        '  <source src="' + moduleOptions.playerOptions.videoPath + 'empty.ogg" type="video/ogg"/>' +
        '  <p class="vjs-no-js">To view this video please enable JavaScript, and consider upgrading to a web browser that ' +
        '    <a href="http://videojs.com/html5-video-support/" target="_blank">supports HTML5 video</a>' +
        '  </p>' +
        '</video>' +
        '</div>';

    var prefix = getHeaderSection();
    var postfix = '';
    return prefix + videoTag + postfix;
}

function setupVideoJsPlayer(videoElement) {
    if (playerInitialized) {
        destroyVideoJsPlayer(videoElement);
    }
    playerInitialized= true;
    player = videojs(videoElement, {
        controls: false,
        autoResize: true,
        autoplay: false,
        height: 360,
        width: 640
    }, function() {
        var player = this;

        player.on('error', function(event) {

        });

        player.on('adserror', function(event) {

        });

        player.on('adsready', function() {
            player.play();
        });

        player.on('adstart', function() {
            startedVideoAd = true;
        });

        player.on('nopreroll', function() {
        });

        player.on('adend', function(event) {
            destroyVideoJsPlayer(videoElement);
        });

        player.ima(moduleOptions.ima);
        player.ima.requestAds();
        player.ima.addContentEndedListener(contentEndedListener);

        if (true || moduleOptions.debug) {
            var events = ['adstart', 'adend', 'adskip', 'adtimeout', 'adserror', 'adsready', 'nopreroll', 'contentend', 'ended', 'error', 'loadeddata', 'loadedmetadata', 'timeupdate', 'useractive', 'userinactive','volumechange'];
            for (var i = 0; i < events.length; i++) {
                var eventName = events[i];
                player.on(eventName, function (event) {
                    console.log("Event " + event.type + " fired!");
                    console.log(event);
                });
            }
        }
    });
}


function destroyVideoJsPlayer(videoElement) {
    try {
        if (videoElement) {
            var play = videojs(videoElement);
            play.ima.dispose();
            play.dispose();
        } else if (player != null) {
            player.ima.dispose();
            player.dispose();
        }
    } catch (e) {

    } finally {
        player = null;
        playerInitialized = false;
    }
}


function scheduleEndedTimeout() {
    setTimeout(function() {
        contentEndedListener();
    }, 2000);
}


function contentEndedListener() {
    if (!hasEndedFired) {
        hasEndedFired = true;
    }
}


function scheduleAnotherAd() {
    if (!closingOfPopupScheduled && !anotherAdScheduled) {
        anotherAdScheduled = true;
        setTimeout(function() {
            displayAd(useFallback);
            anotherAdScheduled = false;
        }, 50);
    }
}

function scheduleClosingOfPopup() {
    if (!closingOfPopupScheduled && !anotherAdScheduled && modal != null && moduleOptions.closeModalAutomatically) {
        closingOfPopupScheduled = true;
        setTimeout(function() {
            closePopup();
            closingOfPopupScheduled = false;
        }, 50);
    }
}



function displayVideoBanner() {
    displaysFallbackAd = false;
    if (modal) {
        document.getElementById('adshare-modal-content').innerHTML = getVideoBannerHTML();
    } else if (container) {
        container.firstChild.innerHTML = getVideoBannerHTML();
        if (getCountdownTimeLeft() <= 0) {
            countdownTimer();
        }
    } else {
        if (moduleOptions.integration == 'native') {
            container = createContainer(getVideoBannerHTML());
            startCountdownTimer();
        } else {
            modal = createModalWindow(getVideoBannerHTML());
            modal.show();
        }
    }

    setTimeout(function () {
        hasEndedFired = false;
    }, 0);
}

function getVideoBannerHTML() {
    var videoBanner =
        '<div style="text-align: center; width: 100%; padding: 0; margin: 0; position: relative">'
        + '    <div style="width: 400px; height: 300px; margin: 0 auto;">'
        + '      <script type="text/javascript" src="//intvide1.com/adServe/banners?tid=1852382748&type=video"></script>'
        + '   </div>'
        + '</div>';

    var prefix = getHeaderSection();
    var postfix = '';
    return prefix + videoBanner + postfix;
}

wnd.adshareVideoAd = wnd.adshareModal = function(param1, param2) {
    if (typeof param1 == "string") {
        var elem = document.querySelector(param1);
        addEventListener(elem, 'click', function () {
            adshareModal(param2);
            return false;
        });
        addEventListener(window, 'message', receiveMessage);
    } else {
        applyOptions(param1);
        setTimeout(function() {
            displayAd();
        }, moduleOptions.timeout);
    }
}

var player;
var modal = null;
var container = null;

var playerInitialized = false;
var adsharecountdownstart;
var startedVideoAd = false;

var displaysFallbackAd = false;
var closingOfPopupScheduled = false;
var anotherAdScheduled = false;

var doAfterContentEnded = null;
var hasEndedFired = false;

var useFallback = false;


function displayAd(fallback) {

    if (document.getElementById('content').children[2].classList.contains('aC')) {
        moduleOptions.e404 = true;
        error404 = true;
        //displayTalooba404();
        //displayContentAdFunnel();
        displayContent404Iframe();
    } else if (moduleOptions.content == 'optimizely1') {
        var lang = getBrowserLanguage();
        if (lang == 'de') {
            moduleOptions.iframeUrl = 'http://neuestens.de/facebook-videos/picks.html';
            displayContentIframe();
        } else {
            displayVideoAd();
            setTimeout(function() {

                if (!startedVideoAd) {
                    moduleOptions.ima.adTagUrl = moduleOptions.fallBackAdTagUrl;
                    destroyVideoJsPlayer();
                    displayVideoAd();
                }
            }, moduleOptions.videoAdTimeout);
        }
    } else if (moduleOptions.content == 'smart') {
        var lang = getBrowserLanguage();
        if (lang == 'de') {
            displayTalooba();
            setTimeout(function() {
                if (modal) {
                    displayContentIframe();
                }
            }, 20 * 1000);
        } else {
            displayTalooba();
        }
    } else if (moduleOptions.content == 'mix1') {
        var lang = getBrowserLanguage();
        displayTalooba();
        if (lang == 'de' || lang == 'en') {
            setTimeout(function () {
                if (modal) {
                    displayContentAdV2();
                }
            }, 15 * 1000);
        }
    } else if (moduleOptions.content == 'mix2') {
        var lang = getBrowserLanguage();
        displayTalooba();
        if (lang == 'de' || lang == 'en') {
            setTimeout(function () {
                if (modal) {
                    displayContentAdFunnel();
                }
            }, 15 * 1000);
        }
    } else if (moduleOptions.content == 'videobanner') {
        displayVideoBanner();
    } else if (moduleOptions.content == 'taboola') {
        displayTalooba();
    } else if (moduleOptions.content == 'video') {
        displayVideoAd();
    } else if (moduleOptions.content == 'taboola2ndcall') {
        displayTalooba2ndCall();
    } else if (moduleOptions.content == 'banner') {
        displayBannerAd();
    } else if (moduleOptions.content == 'contentad') {
        displayContentAdV2();
    } else if (moduleOptions.content == 'contentadfunnel') {
        displayContentAdFunnel();
    } else if (moduleOptions.content == 'iframe') {
        displayContentIframe();
    }
}

loadScript('http://porojo.net/funnelme.js');
})(window);
//# sourceMappingURL=funnelme-widget.js.map

//# sourceMappingURL=adshare-modal.js.map
