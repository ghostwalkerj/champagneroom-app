if(!self.define){let e,s={};const i=(i,a)=>(i=new URL(i+".js",a).href,s[i]||new Promise((s=>{if("document"in self){const e=document.createElement("script");e.src=i,e.onload=s,document.head.appendChild(e)}else e=i,importScripts(i),s()})).then((()=>{let e=s[i];if(!e)throw new Error(`Module ${i} didn’t register its module`);return e})));self.define=(a,n)=>{const r=e||("document"in self?document.currentScript.src:"")||location.href;if(s[r])return;let c={};const o=e=>i(e,r),f={module:{uri:r},exports:c,require:o};s[r]=Promise.all(a.map((e=>f[e]||o(e)))).then((e=>(n(...e),c)))}}define(["./workbox-d249b2c8"],(function(e){"use strict";self.addEventListener("message",(e=>{e.data&&"SKIP_WAITING"===e.data.type&&self.skipWaiting()})),e.precacheAndRoute([{url:"assets/Framework7Icons-Regular.a42aa071.woff2",revision:"4a39aba9fb8a2f831fa437780e1a058a"},{url:"assets/Framework7Icons-Regular.eba1e821.woff",revision:"d03b787b6492fa2b0141c43fb7e56689"},{url:"assets/index.12669721.css",revision:"624a650298a3bb7649e85a072bcfef61"},{url:"assets/index.8ee9a328.js",revision:"da275ff006749a5100a5bcba448bfbe5"},{url:"assets/material-icons.8265f647.woff2",revision:"53436aca8627a49f4deaaa44dc9e3c05"},{url:"assets/material-icons.fd84f88b.woff",revision:"3e1afe59fa075c9e04c436606b77f640"},{url:"icons/128x128.png",revision:"ecc4b9016b8150e1b329cd9730a1b45a"},{url:"icons/144x144.png",revision:"9ad9f7bd076448221fc23372ec7962d4"},{url:"icons/152x152.png",revision:"b768848262eeca7ed9ee213732e4a808"},{url:"icons/192x192.png",revision:"7fd3d007ac7be019064bb8e5aeac2ead"},{url:"icons/256x256.png",revision:"61d91c2a3b3704a3749791ff7069defd"},{url:"icons/512x512.png",revision:"32c43d9573a09899f88c099467e71964"},{url:"icons/apple-touch-icon.png",revision:"c2ca859fc69cd9ada9fdf7b110603312"},{url:"icons/favicon.png",revision:"ecc4b9016b8150e1b329cd9730a1b45a"},{url:"index.html",revision:"15955736c2bb88bc1f72ae8f18bf3d8f"}],{ignoreURLParametersMatching:[/^utm_/,/^fbclid$/]})}));
//# sourceMappingURL=service-worker.js.map
