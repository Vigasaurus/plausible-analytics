!function(){"use strict";var e,t,i,r=window.location,o=window.document,a=window.localStorage,l=o.getElementById("plausible"),s=l.getAttribute("data-api")||(e=l.src.split("/"),t=e[0],i=e[2],t+"//"+i+"/api/event"),c=a&&a.plausible_ignore,p=l&&l.getAttribute("data-exclude").split(",");function d(e){console.warn("Ignoring Event: "+e)}function n(e,t){if(/^localhost$|^127(\.[0-9]+){0,2}\.[0-9]+$|^\[::1?\]$/.test(r.hostname)||"file:"===r.protocol)return d("localhost");if(!(window.phantom||window._phantom||window.__nightmare||window.navigator.webdriver||window.Cypress)){if("true"==c)return d("localStorage flag");if(p)for(var i=0;i<p.length;i++)if("pageview"==e&&r.pathname.match(new RegExp("^"+p[i].trim().replace(/\*\*/g,".*").replace(/([^\.])\*/g,"$1[^\\s/]*")+"/?$")))return d("exclusion rule");var a={};a.n=e,a.u=r.href,a.d=l.getAttribute("data-domain"),a.r=o.referrer||null,a.w=window.innerWidth,t&&t.meta&&(a.m=JSON.stringify(t.meta)),t&&t.props&&(a.p=JSON.stringify(t.props)),a.h=1;var n=new XMLHttpRequest;n.open("POST",s,!0),n.setRequestHeader("Content-Type","text/plain"),n.send(JSON.stringify(a)),n.onreadystatechange=function(){4==n.readyState&&t&&t.callback&&t.callback()}}}function u(e){for(var t=e.target,i="auxclick"==e.type&&2==e.which,a="click"==e.type;t&&(void 0===t.tagName||"a"!=t.tagName.toLowerCase()||!t.href);)t=t.parentNode;t&&t.href&&t.host&&t.host!==r.host&&((i||a)&&plausible("Outbound Link: Click",{props:{url:t.href}}),t.target&&!t.target.match(/^_(self|parent|top)$/i)||e.ctrlKey||e.metaKey||e.shiftKey||!a||(setTimeout(function(){r.href=t.href},150),e.preventDefault()))}o.addEventListener("click",u),o.addEventListener("auxclick",u);var w=window.plausible&&window.plausible.q||[];window.plausible=n;for(var h,f=0;f<w.length;f++)n.apply(this,w[f]);function g(){h=r.pathname,n("pageview")}window.addEventListener("hashchange",g),"prerender"===o.visibilityState?o.addEventListener("visibilitychange",function(){h||"visible"!==o.visibilityState||g()}):g()}();