import{r as d}from"./react-vendor-Cohw-MQ-.js";let q={data:""},K=e=>{if(typeof window=="object"){let t=(e?e.querySelector("#_goober"):window._goober)||Object.assign(document.createElement("style"),{innerHTML:" ",id:"_goober"});return t.nonce=window.__nonce__,t.parentNode||(e||document.head).appendChild(t),t.firstChild}return e||q},Q=/(?:([\u0080-\uFFFF\w-%@]+) *:? *([^{;]+?);|([^;}{]*?) *{)|(}\s*)/g,V=/\/\*[^]*?\*\/|  +/g,_=/\n+/g,x=(e,t)=>{let a="",s="",i="";for(let o in e){let r=e[o];o[0]=="@"?o[1]=="i"?a=o+" "+r+";":s+=o[1]=="f"?x(r,o):o+"{"+x(r,o[1]=="k"?"":t)+"}":typeof r=="object"?s+=x(r,t?t.replace(/([^,])+/g,n=>o.replace(/([^,]*:\S+\([^)]*\))|([^,])+/g,l=>/&/.test(l)?l.replace(/&/g,n):n?n+" "+l:l)):o):r!=null&&(o=/^--/.test(o)?o:o.replace(/[A-Z]/g,"-$&").toLowerCase(),i+=x.p?x.p(o,r):o+":"+r+";")}return a+(t&&i?t+"{"+i+"}":i)+s},b={},L=e=>{if(typeof e=="object"){let t="";for(let a in e)t+=a+L(e[a]);return t}return e},W=(e,t,a,s,i)=>{let o=L(e),r=b[o]||(b[o]=(l=>{let u=0,p=11;for(;u<l.length;)p=101*p+l.charCodeAt(u++)>>>0;return"go"+p})(o));if(!b[r]){let l=o!==e?e:(u=>{let p,c,m=[{}];for(;p=Q.exec(u.replace(V,""));)p[4]?m.shift():p[3]?(c=p[3].replace(_," ").trim(),m.unshift(m[0][c]=m[0][c]||{})):m[0][p[1]]=p[2].replace(_," ").trim();return m[0]})(e);b[r]=x(i?{["@keyframes "+r]:l}:l,a?"":"."+r)}let n=a&&b.g?b.g:null;return a&&(b.g=b[r]),((l,u,p,c)=>{c?u.data=u.data.replace(c,l):u.data.indexOf(l)===-1&&(u.data=p?l+u.data:u.data+l)})(b[r],t,s,n),r},G=(e,t,a)=>e.reduce((s,i,o)=>{let r=t[o];if(r&&r.call){let n=r(a),l=n&&n.props&&n.props.className||/^go/.test(n)&&n;r=l?"."+l:n&&typeof n=="object"?n.props?"":x(n,""):n===!1?"":n}return s+i+(r??"")},"");function D(e){let t=this||{},a=e.call?e(t.p):e;return W(a.unshift?a.raw?G(a,[].slice.call(arguments,1),t.p):a.reduce((s,i)=>Object.assign(s,i&&i.call?i(t.p):i),{}):a,K(t.target),t.g,t.o,t.k)}let M,N,I;D.bind({g:1});let v=D.bind({k:1});function J(e,t,a,s){x.p=t,M=e,N=a,I=s}function w(e,t){let a=this||{};return function(){let s=arguments;function i(o,r){let n=Object.assign({},o),l=n.className||i.className;a.p=Object.assign({theme:N&&N()},n),a.o=/ *go\d+/.test(l),n.className=D.apply(a,s)+(l?" "+l:"");let u=e;return e[0]&&(u=n.as||e,delete n.as),I&&u[0]&&I(n),M(u,n)}return i}}var X=e=>typeof e=="function",j=(e,t)=>X(e)?e(t):e,ee=(()=>{let e=0;return()=>(++e).toString()})(),S=(()=>{let e;return()=>{if(e===void 0&&typeof window<"u"){let t=matchMedia("(prefers-reduced-motion: reduce)");e=!t||t.matches}return e}})(),te=20,P="default",H=(e,t)=>{let{toastLimit:a}=e.settings;switch(t.type){case 0:return{...e,toasts:[t.toast,...e.toasts].slice(0,a)};case 1:return{...e,toasts:e.toasts.map(r=>r.id===t.toast.id?{...r,...t.toast}:r)};case 2:let{toast:s}=t;return H(e,{type:e.toasts.find(r=>r.id===s.id)?1:0,toast:s});case 3:let{toastId:i}=t;return{...e,toasts:e.toasts.map(r=>r.id===i||i===void 0?{...r,dismissed:!0,visible:!1}:r)};case 4:return t.toastId===void 0?{...e,toasts:[]}:{...e,toasts:e.toasts.filter(r=>r.id!==t.toastId)};case 5:return{...e,pausedAt:t.time};case 6:let o=t.time-(e.pausedAt||0);return{...e,pausedAt:void 0,toasts:e.toasts.map(r=>({...r,pauseDuration:r.pauseDuration+o}))}}},C=[],R={toasts:[],pausedAt:void 0,settings:{toastLimit:te}},h={},B=(e,t=P)=>{h[t]=H(h[t]||R,e),C.forEach(([a,s])=>{a===t&&s(h[t])})},U=e=>Object.keys(h).forEach(t=>B(e,t)),ae=e=>Object.keys(h).find(t=>h[t].toasts.some(a=>a.id===e)),O=(e=P)=>t=>{B(t,e)},re={blank:4e3,error:4e3,success:2e3,loading:1/0,custom:4e3},se=(e={},t=P)=>{let[a,s]=d.useState(h[t]||R),i=d.useRef(h[t]);d.useEffect(()=>(i.current!==h[t]&&s(h[t]),C.push([t,s]),()=>{let r=C.findIndex(([n])=>n===t);r>-1&&C.splice(r,1)}),[t]);let o=a.toasts.map(r=>{var n,l,u;return{...e,...e[r.type],...r,removeDelay:r.removeDelay||((n=e[r.type])==null?void 0:n.removeDelay)||e?.removeDelay,duration:r.duration||((l=e[r.type])==null?void 0:l.duration)||e?.duration||re[r.type],style:{...e.style,...(u=e[r.type])==null?void 0:u.style,...r.style}}});return{...a,toasts:o}},ie=(e,t="blank",a)=>({createdAt:Date.now(),visible:!0,dismissed:!1,type:t,ariaProps:{role:"status","aria-live":"polite"},message:e,pauseDuration:0,...a,id:a?.id||ee()}),E=e=>(t,a)=>{let s=ie(t,e,a);return O(s.toasterId||ae(s.id))({type:2,toast:s}),s.id},f=(e,t)=>E("blank")(e,t);f.error=E("error");f.success=E("success");f.loading=E("loading");f.custom=E("custom");f.dismiss=(e,t)=>{let a={type:3,toastId:e};t?O(t)(a):U(a)};f.dismissAll=e=>f.dismiss(void 0,e);f.remove=(e,t)=>{let a={type:4,toastId:e};t?O(t)(a):U(a)};f.removeAll=e=>f.remove(void 0,e);f.promise=(e,t,a)=>{let s=f.loading(t.loading,{...a,...a?.loading});return typeof e=="function"&&(e=e()),e.then(i=>{let o=t.success?j(t.success,i):void 0;return o?f.success(o,{id:s,...a,...a?.success}):f.dismiss(s),i}).catch(i=>{let o=t.error?j(t.error,i):void 0;o?f.error(o,{id:s,...a,...a?.error}):f.dismiss(s)}),e};var oe=1e3,ne=(e,t="default")=>{let{toasts:a,pausedAt:s}=se(e,t),i=d.useRef(new Map).current,o=d.useCallback((c,m=oe)=>{if(i.has(c))return;let g=setTimeout(()=>{i.delete(c),r({type:4,toastId:c})},m);i.set(c,g)},[]);d.useEffect(()=>{if(s)return;let c=Date.now(),m=a.map(g=>{if(g.duration===1/0)return;let k=(g.duration||0)+g.pauseDuration-(c-g.createdAt);if(k<0){g.visible&&f.dismiss(g.id);return}return setTimeout(()=>f.dismiss(g.id,t),k)});return()=>{m.forEach(g=>g&&clearTimeout(g))}},[a,s,t]);let r=d.useCallback(O(t),[t]),n=d.useCallback(()=>{r({type:5,time:Date.now()})},[r]),l=d.useCallback((c,m)=>{r({type:1,toast:{id:c,height:m}})},[r]),u=d.useCallback(()=>{s&&r({type:6,time:Date.now()})},[s,r]),p=d.useCallback((c,m)=>{let{reverseOrder:g=!1,gutter:k=8,defaultPosition:T}=m||{},A=a.filter(y=>(y.position||T)===(c.position||T)&&y.height),Z=A.findIndex(y=>y.id===c.id),F=A.filter((y,z)=>z<Z&&y.visible).length;return A.filter(y=>y.visible).slice(...g?[F+1]:[0,F]).reduce((y,z)=>y+(z.height||0)+k,0)},[a]);return d.useEffect(()=>{a.forEach(c=>{if(c.dismissed)o(c.id,c.removeDelay);else{let m=i.get(c.id);m&&(clearTimeout(m),i.delete(c.id))}})},[a,o]),{toasts:a,handlers:{updateHeight:l,startPause:n,endPause:u,calculateOffset:p}}},le=v`
from {
  transform: scale(0) rotate(45deg);
	opacity: 0;
}
to {
 transform: scale(1) rotate(45deg);
  opacity: 1;
}`,de=v`
from {
  transform: scale(0);
  opacity: 0;
}
to {
  transform: scale(1);
  opacity: 1;
}`,ce=v`
from {
  transform: scale(0) rotate(90deg);
	opacity: 0;
}
to {
  transform: scale(1) rotate(90deg);
	opacity: 1;
}`,ue=w("div")`
  width: 20px;
  opacity: 0;
  height: 20px;
  border-radius: 10px;
  background: ${e=>e.primary||"#ff4b4b"};
  position: relative;
  transform: rotate(45deg);

  animation: ${le} 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275)
    forwards;
  animation-delay: 100ms;

  &:after,
  &:before {
    content: '';
    animation: ${de} 0.15s ease-out forwards;
    animation-delay: 150ms;
    position: absolute;
    border-radius: 3px;
    opacity: 0;
    background: ${e=>e.secondary||"#fff"};
    bottom: 9px;
    left: 4px;
    height: 2px;
    width: 12px;
  }

  &:before {
    animation: ${ce} 0.15s ease-out forwards;
    animation-delay: 180ms;
    transform: rotate(90deg);
  }
`,pe=v`
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
`,me=w("div")`
  width: 12px;
  height: 12px;
  box-sizing: border-box;
  border: 2px solid;
  border-radius: 100%;
  border-color: ${e=>e.secondary||"#e0e0e0"};
  border-right-color: ${e=>e.primary||"#616161"};
  animation: ${pe} 1s linear infinite;
`,fe=v`
from {
  transform: scale(0) rotate(45deg);
	opacity: 0;
}
to {
  transform: scale(1) rotate(45deg);
	opacity: 1;
}`,ge=v`
0% {
	height: 0;
	width: 0;
	opacity: 0;
}
40% {
  height: 0;
	width: 6px;
	opacity: 1;
}
100% {
  opacity: 1;
  height: 10px;
}`,ye=w("div")`
  width: 20px;
  opacity: 0;
  height: 20px;
  border-radius: 10px;
  background: ${e=>e.primary||"#61d345"};
  position: relative;
  transform: rotate(45deg);

  animation: ${fe} 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275)
    forwards;
  animation-delay: 100ms;
  &:after {
    content: '';
    box-sizing: border-box;
    animation: ${ge} 0.2s ease-out forwards;
    opacity: 0;
    animation-delay: 200ms;
    position: absolute;
    border-right: 2px solid;
    border-bottom: 2px solid;
    border-color: ${e=>e.secondary||"#fff"};
    bottom: 6px;
    left: 6px;
    height: 10px;
    width: 6px;
  }
`,he=w("div")`
  position: absolute;
`,be=w("div")`
  position: relative;
  display: flex;
  justify-content: center;
  align-items: center;
  min-width: 20px;
  min-height: 20px;
`,ve=v`
from {
  transform: scale(0.6);
  opacity: 0.4;
}
to {
  transform: scale(1);
  opacity: 1;
}`,xe=w("div")`
  position: relative;
  transform: scale(0.6);
  opacity: 0.4;
  min-width: 20px;
  animation: ${ve} 0.3s 0.12s cubic-bezier(0.175, 0.885, 0.32, 1.275)
    forwards;
`,we=({toast:e})=>{let{icon:t,type:a,iconTheme:s}=e;return t!==void 0?typeof t=="string"?d.createElement(xe,null,t):t:a==="blank"?null:d.createElement(be,null,d.createElement(me,{...s}),a!=="loading"&&d.createElement(he,null,a==="error"?d.createElement(ue,{...s}):d.createElement(ye,{...s})))},Ee=e=>`
0% {transform: translate3d(0,${e*-200}%,0) scale(.6); opacity:.5;}
100% {transform: translate3d(0,0,0) scale(1); opacity:1;}
`,ke=e=>`
0% {transform: translate3d(0,0,-1px) scale(1); opacity:1;}
100% {transform: translate3d(0,${e*-150}%,-1px) scale(.6); opacity:0;}
`,$e="0%{opacity:0;} 100%{opacity:1;}",Ce="0%{opacity:1;} 100%{opacity:0;}",je=w("div")`
  display: flex;
  align-items: center;
  background: #fff;
  color: #363636;
  line-height: 1.3;
  will-change: transform;
  box-shadow: 0 3px 10px rgba(0, 0, 0, 0.1), 0 3px 3px rgba(0, 0, 0, 0.05);
  max-width: 350px;
  pointer-events: auto;
  padding: 8px 10px;
  border-radius: 8px;
`,De=w("div")`
  display: flex;
  justify-content: center;
  margin: 4px 10px;
  color: inherit;
  flex: 1 1 auto;
  white-space: pre-line;
`,Oe=(e,t)=>{let a=e.includes("top")?1:-1,[s,i]=S()?[$e,Ce]:[Ee(a),ke(a)];return{animation:t?`${v(s)} 0.35s cubic-bezier(.21,1.02,.73,1) forwards`:`${v(i)} 0.4s forwards cubic-bezier(.06,.71,.55,1)`}},Ae=d.memo(({toast:e,position:t,style:a,children:s})=>{let i=e.height?Oe(e.position||t||"top-center",e.visible):{opacity:0},o=d.createElement(we,{toast:e}),r=d.createElement(De,{...e.ariaProps},j(e.message,e));return d.createElement(je,{className:e.className,style:{...i,...a,...e.style}},typeof s=="function"?s({icon:o,message:r}):d.createElement(d.Fragment,null,o,r))});J(d.createElement);var ze=({id:e,className:t,style:a,onHeightUpdate:s,children:i})=>{let o=d.useCallback(r=>{if(r){let n=()=>{let l=r.getBoundingClientRect().height;s(e,l)};n(),new MutationObserver(n).observe(r,{subtree:!0,childList:!0,characterData:!0})}},[e,s]);return d.createElement("div",{ref:o,className:t,style:a},i)},Ne=(e,t)=>{let a=e.includes("top"),s=a?{top:0}:{bottom:0},i=e.includes("center")?{justifyContent:"center"}:e.includes("right")?{justifyContent:"flex-end"}:{};return{left:0,right:0,display:"flex",position:"absolute",transition:S()?void 0:"all 230ms cubic-bezier(.21,1.02,.73,1)",transform:`translateY(${t*(a?1:-1)}px)`,...s,...i}},Ie=D`
  z-index: 9999;
  > * {
    pointer-events: auto;
  }
`,$=16,Te=({reverseOrder:e,position:t="top-center",toastOptions:a,gutter:s,children:i,toasterId:o,containerStyle:r,containerClassName:n})=>{let{toasts:l,handlers:u}=ne(a,o);return d.createElement("div",{"data-rht-toaster":o||"",style:{position:"fixed",zIndex:9999,top:$,left:$,right:$,bottom:$,pointerEvents:"none",...r},className:n,onMouseEnter:u.startPause,onMouseLeave:u.endPause},l.map(p=>{let c=p.position||t,m=u.calculateOffset(p,{reverseOrder:e,gutter:s,defaultPosition:t}),g=Ne(c,m);return d.createElement(ze,{id:p.id,key:p.id,onHeightUpdate:u.updateHeight,className:p.visible?Ie:"",style:g},p.type==="custom"?j(p.message,p):i?i(p):d.createElement(Ae,{toast:p,position:c}))}))},Fe=f;function Y(e){var t,a,s="";if(typeof e=="string"||typeof e=="number")s+=e;else if(typeof e=="object")if(Array.isArray(e)){var i=e.length;for(t=0;t<i;t++)e[t]&&(a=Y(e[t]))&&(s&&(s+=" "),s+=a)}else for(a in e)e[a]&&(s&&(s+=" "),s+=a);return s}function _e(){for(var e,t,a=0,s="",i=arguments.length;a<i;a++)(e=arguments[a])&&(t=Y(e))&&(s&&(s+=" "),s+=t);return s}export{Te as F,_e as c,Fe as z};
