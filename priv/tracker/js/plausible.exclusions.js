!function(i,o){"use strict";var e,s=i.location,l=i.document,t=l.querySelector('[src*="'+o+'"]'),p=t&&t.getAttribute("data-domain"),c=t&&t.getAttribute("data-exclude").split(","),u=i.localStorage.plausible_ignore;function n(e,t){if(/^localhost$|^127(?:\.[0-9]+){0,2}\.[0-9]+$|^(?:0*\:)*?:?0*1$/.test(s.hostname)||"file:"===s.protocol)return console.warn("Ignoring event on localhost");if(!(i.phantom||i._phantom||i.__nightmare||i.navigator.webdriver)){if(u&&JSON.parse(u))return console.warn("Ignoring event due to localStorage flag");if(c)for(var n=0;n<c.length;n++)if("pageview"==e&&s.pathname.match(new RegExp("^"+c[n].trim().replace(/\*/g,"[^\\s/]*")+"/?$")))return console.warn("Ignoring event in exclusion");var a={};a.n=e,a.u=s.href,a.d=p,a.r=l.referrer||null,a.w=i.innerWidth,t&&t.meta&&(a.m=JSON.stringify(t.meta)),t&&t.props&&(a.p=JSON.stringify(t.props));var r=new XMLHttpRequest;r.open("POST",o+"/api/event",!0),r.setRequestHeader("Content-Type","text/plain"),r.send(JSON.stringify(a)),r.onreadystatechange=function(){4==r.readyState&&t&&t.callback&&t.callback()}}}function a(){e!==s.pathname&&(e=s.pathname,n("pageview"))}try{var r,g=i.history;g.pushState&&(r=g.pushState,g.pushState=function(){r.apply(this,arguments),a()},i.addEventListener("popstate",a));var h=i.plausible&&i.plausible.q||[];i.plausible=n;for(var v=0;v<h.length;v++)n.apply(this,h[v]);"prerender"===l.visibilityState?l.addEventListener("visibilitychange",function(){e||"visible"!==l.visibilityState||a()}):a()}catch(e){console.error(e),(new Image).src=o+"/api/error?message="+encodeURIComponent(e.message)}}(window,"<%= base_url %>");