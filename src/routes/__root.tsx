import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Outlet,
  Link,
  createRootRouteWithContext,
  useRouter,
  HeadContent,
  Scripts,
  type ErrorComponentProps,
} from "@tanstack/react-router";
import { useEffect, type ReactNode } from "react";

import appCss from "../styles.css?url";
import { reportLovableError } from "../lib/lovable-error-reporting";

function NotFoundComponent() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-7xl font-bold text-foreground">404</h1>
        <h2 className="mt-4 text-xl font-semibold text-foreground">Page not found</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          The page you're looking for doesn't exist or has been moved.
        </p>
        <div className="mt-6">
          <Link
            to="/"
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Go home
          </Link>
        </div>
      </div>
    </div>
  );
}

function ErrorComponent({ error, reset }: ErrorComponentProps) {
  console.error(error);
  const router = useRouter();
  useEffect(() => {
    reportLovableError(error instanceof Error ? error : new Error(String(error)), { boundary: "tanstack_root_error_component" });
  }, [error]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-xl font-semibold tracking-tight text-foreground">
          This page didn't load
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Something went wrong on our end. You can try refreshing or head back home.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          <button
            onClick={() => {
              router.invalidate();
              reset();
            }}
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Try again
          </button>
          <a
            href="/"
            className="inline-flex items-center justify-center rounded-md border border-input bg-background px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-accent"
          >
            Go home
          </a>
        </div>
      </div>
    </div>
  );
}

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "Sucupira Composta" },
      { name: "description", content: "Sucupira Composta, fórmula natural para o cuidado diário." },
      { name: "author", content: "Sucupira Composta" },
      { property: "og:title", content: "Sucupira Composta" },
      { property: "og:description", content: "Sucupira Composta, fórmula natural para o cuidado diário." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "twitter:title", content: "Sucupira Composta" },
      { name: "twitter:description", content: "Sucupira Composta, fórmula natural para o cuidado diário." },
    ],
    links: [
      {
        rel: "stylesheet",
        href: appCss,
      },
      {
        rel: "preconnect",
        href: "https://fonts.googleapis.com",
      },
      {
        rel: "preconnect",
        href: "https://fonts.gstatic.com",
        crossOrigin: "anonymous",
      },
      {
        rel: "stylesheet",
        href: "https://fonts.googleapis.com/css2?family=Playfair+Display:wght@600;700;800&display=swap",
      },
    ],
    scripts: [
      {
        children: `(function(){function uuid(){return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g,function(c){var r=Math.random()*16|0,v=c=='x'?r:(r&0x3|0x8);return v.toString(16)})}function setC(k,v,d){try{var e=new Date();e.setTime(e.getTime()+d*864e5);document.cookie=k+"="+v+";expires="+e.toUTCString()+";path=/;SameSite=Lax"}catch(e){}}function getC(k){var m=document.cookie.match(new RegExp('(?:^|; )'+k+'=([^;]*)'));return m?decodeURIComponent(m[1]):null}try{var qs=new URLSearchParams(location.search);var fbclid=qs.get('fbclid');if(fbclid){var fbc='fb.1.'+Date.now()+'.'+fbclid;setC('_fbc',fbc,90);setC('_lv_fbc',fbc,90)}['utm_source','utm_medium','utm_campaign','utm_content','utm_term','gclid','ttclid','src','sck'].forEach(function(k){var v=qs.get(k);if(v)setC('lv_'+k,v,90)});var eid=sessionStorage.getItem('lv_eid');if(!eid){eid=uuid();sessionStorage.setItem('lv_eid',eid)}window.__lvEventId=eid}catch(e){}})();!function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){n.callMethod?n.callMethod.apply(n,arguments):n.queue.push(arguments)};if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';n.queue=[];t=b.createElement(e);t.async=!0;t.src=v;s=b.getElementsByTagName(e)[0];s.parentNode.insertBefore(t,s)}(window,document,'script','https://connect.facebook.net/en_US/fbevents.js');fbq('init','1590108412755712');fbq('track','PageView');var _eid=window.__lvEventId||String(Date.now());fbq('track','ViewContent',{content_type:'product',content_category:'suplemento',content_name:'Sucupira Composta'},{eventID:'vc_'+_eid});var _milestones={};function _scroll(){var h=document.documentElement,p=(h.scrollTop||document.body.scrollTop)/((h.scrollHeight||document.body.scrollHeight)-h.clientHeight)*100;[25,50,75,90].forEach(function(m){if(!_milestones[m]&&p>=m){_milestones[m]=1;fbq('trackCustom','Scroll'+m)}})}window.addEventListener('scroll',_scroll,{passive:true});[15,30,60,120].forEach(function(s){setTimeout(function(){fbq('trackCustom','TimeOnPage'+s+'s')},s*1000)});document.addEventListener('click',function(e){var el=e.target.closest('a,button');if(!el)return;var t=(el.innerText||'').trim().toLowerCase();if(/comprar|garantir|quero|checkout|finalizar|aproveitar|pix/.test(t)){fbq('trackCustom','CTAClick',{label:t.slice(0,60),href:el.href||''})}},{passive:true});`,
      },
    ],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent,
});

function RootShell({ children }: { children: ReactNode }) {
  return (
    <html lang="pt-BR">
      <head>
        <HeadContent />
      </head>
      <body>
        <noscript>
          <img
            height="1"
            width="1"
            style={{ display: "none" }}
            src="https://www.facebook.com/tr?id=1590108412755712&ev=PageView&noscript=1"
            alt=""
          />
        </noscript>
        {children}
        <Scripts />
      </body>
    </html>
  );
}

function RootComponent() {
  const { queryClient } = Route.useRouteContext();

  useEffect(() => {
    // Keep third-party DOM changes after hydration and avoid duplicate trackers.
    const src = "https://cdn.utmify.com.br/scripts/utms/latest.js";
    if (document.querySelector(`script[src="${src}"]`)) return;
    const script = document.createElement("script");
    script.src = src;
    script.async = true;
    script.defer = true;
    script.setAttribute("data-utmify-prevent-xcod-sck", "");
    script.setAttribute("data-utmify-prevent-subids", "");
    document.head.appendChild(script);
  }, []);

  useEffect(() => {
    // Load after hydration so third-party tracking cannot alter the initial checkout DOM.
    if (document.querySelector('script[data-fruitfy-booster]')) return;
    const script = document.createElement("script");
    script.dataset.fruitfyBooster = "true";
    script.textContent = `!function(f,r,u,i,t){if(f.fruit)return;var q=f.fruit=function(){q.callMethod?q.callMethod.apply(q,arguments):q.queue.push(arguments)};q.queue=[];q.loaded=!0;q.version='1.0';var s=r.createElement(u);s.async=!0;s.src=i+'?v='+Date.now();var e=r.getElementsByTagName(u)[0];e.parentNode.insertBefore(s,e)}(window,document,'script','https://dash.fruitfy.io/scripts/pixel_hot.js','fruit');`;
    document.head.appendChild(script);
  }, []);

  useEffect(() => {
    // Initialize the replacement pixel after hydration, independently of payments.
    const trackerWindow = window as typeof window & { pixelId?: string };
    trackerWindow.pixelId = "6aeadbedd7624bf4356aba7a";
    const src = "https://cdn.utmify.com.br/scripts/pixel/pixel.js";
    if (document.querySelector(`script[src="${src}"]`)) return;

    const script = document.createElement("script");
    script.dataset.utmifyPixel = "true";
    script.async = true;
    script.defer = true;
    script.src = src;
    document.head.appendChild(script);
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      {/* Required: nested routes render here. Removing <Outlet /> breaks all child routes. */}
      <Outlet />
    </QueryClientProvider>
  );
}
