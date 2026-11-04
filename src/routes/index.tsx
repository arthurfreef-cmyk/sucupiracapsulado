import { createFileRoute, Link, useRouter } from "@tanstack/react-router";
/**
 * <!-- Meta Pixel Code -->
 *
 * <script>
 *
 * !function(f,b,e,v,n,t,s)
 *
 * {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
 *
 * n.callMethod.apply(n,arguments):n.queue.push(arguments)};
 *
 * if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
 *
 * n.queue=[];t=b.createElement(e);t.async=!0;
 *
 * t.src=v;s=b.getElementsByTagName(e)[0];
 *
 * s.parentNode.insertBefore(t,s)}(window, document,'script',
 *
 * 'https://connect.facebook.net/en_US/fbevents.js');
 *
 * fbq('init', '1590108412755712');
 *
 * fbq('track', 'PageView');
 *
 * </script>
 *
 * <noscript><img height="1" width="1" style="display:none"
 *
 * src="https://www.facebook.com/tr?id=1590108412755712&ev=PageView&noscript=1"
 *
 * /></noscript>
 *
 * <!-- End Meta Pixel Code --> adione esse pixel do meta no site e remova qualquer outro, ou veja se esse pixel ja esta integrado
 * 'veja se esse pixel esta marcando todos os eventos desejados e aprimore ele totalmente, n mexa em nenhum texto no codigo que nao seja relacionado ao pixel, veja se o pagamento em cartao esta ativo pela mangofy e presente no checkout como metodo de pagamento' (on element 'body' at '/src/routes/index.tsx:1')
 * 'eu desejo ativar cartao de credito via mangofy, pode habilitar no checkout tambem' (on element 'body' at '/src/routes/index.tsx:1')
 * 'melhore o carregamento de imagens e tudo do site' (on element 'body' at '/src/routes/index.tsx:1')
 * 'melhore o modal após geramento do pix para maior confiança e credibilidade adicione o qr code tambem e faça uma pagina de obrigado' (on element 'body' at '/src/routes/index.tsx:1')
 * 'veja se o pagamento no cartão esta funcionando, veja se a pessoa boatr as infomaçoes do cartao o pagamento vai ser processado' (on element 'body' at '/src/routes/index.tsx:1')
 * 'veja se os pagamentos no metodo de cartao a mangofy esta autorizando e hablitada' (on element 'body' at '/src/routes/index.tsx:1')
 * 'tem como testar uma transaçao de teste com cartao?' (on element 'body' at '/src/routes/index.tsx:1')
 * 'tire a opçao de pagamento cartao de credito e deixe somete pix disponivel' (on element 'body' at '/src/routes/index.tsx:1')
 */
import { useEffect, useRef, useState } from "react";
import { BadgeCheck, LockKeyhole, ShieldCheck, Truck } from "lucide-react";
import { siteImages, heroSrcSet, heroSizes, testimonialVideos } from "@/lib/site-media";
import { LazyVideo } from "@/components/landing/LazyVideo";
import { KIT_PRICING, formatKitPrice } from "@/lib/kit-pricing";


export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Black Friday Sucupira Composta — Kits a partir de R$ 12,90" },
      {
        name: "description",
        content:
          "Black Friday Sucupira Composta: 1 frasco por R$ 12,90, 3 por R$ 47,90 e 5 por R$ 97,00. Frete grátis e pagamento por PIX.",
      },
      { property: "og:title", content: "Black Friday — Sucupira Composta" },
      {
        property: "og:description",
        content:
          "Kits Black Friday: 1 frasco por R$ 12,90, 3 por R$ 47,90 e 5 por R$ 97,00. Frete grátis e garantia de 60 dias.",
      },
      { property: "og:type", content: "website" },
      { property: "og:image", content: siteImages.hero },
      { name: "twitter:image", content: siteImages.hero },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [
      { rel: "preload", as: "image", href: siteImages.hero, imageSrcSet: heroSrcSet, imageSizes: heroSizes, fetchPriority: "high" },
      { rel: "preconnect", href: "https://customer-assets.emergentagent.com", crossOrigin: "anonymous" },
      { rel: "dns-prefetch", href: "https://customer-assets.emergentagent.com" },
    ],
  }),
  component: Index,
});

// ============ ASSETS (otimizados localmente em WebP) ============
const imgHero = siteImages.hero;
const imgMulher = siteImages.mulher;
const imgSucupira = siteImages.sucupira;
const imgCanela = siteImages.canela;
const imgCalcio = siteImages.calcio;
const imgAnvisa = siteImages.anvisa;
const imgKit1 = siteImages.kit1;
const imgKit3 = siteImages.kit3;
const imgKit5 = siteImages.kit5;
const imgDep1 = siteImages.dep1;
const imgDep2 = siteImages.dep2;
const imgDep3 = siteImages.dep3;
const imgDep4 = siteImages.dep4;
const imgDep5 = siteImages.dep5;
const imgDep6 = siteImages.dep6;
const imgDep7 = siteImages.dep7;

const IMG = {
  hero: imgHero,
  mulher: imgMulher,
  sucupira: imgSucupira,
  canela: imgCanela,
  calcio: imgCalcio,
  anvisa: imgAnvisa,
  kit1: imgKit1,
  kit3: imgKit3,
  kit5: imgKit5,
};

const VIDEOS = testimonialVideos;

const CHECKOUT = {
  k1: "k1" as const,
  k3: "k3" as const,
  k5: "k5" as const,
};


// ============ Page ============
function Index() {
  const router = useRouter();
  useEffect(() => {
    const idle = (cb: () => void) =>
      (window as any).requestIdleCallback ? (window as any).requestIdleCallback(cb) : setTimeout(cb, 1500);
    idle(() => {
      router.preloadRoute({ to: "/checkout/$kit", params: { kit: "k3" } }).catch(() => {});
    });

  }, [router]);
  return (
    <div className="min-h-screen bg-[var(--cream)] text-foreground">
      <Header />
      <main className="pb-20 md:pb-0">
        <Hero />
        <Pains />
        <Product />
        <Formula />
        <Benefits />
        <BeforeAfter />
        <Anvisa />
        <Testimonials />
        <VideoTestimonials />
        <Guarantee />
        <Pricing />
        <ScarcityStrip />
        <FAQ />
        <FinalCTA />
      </main>

      <Footer />
      
      
    </div>
  );
}

// ============ Sections ============
function Header() {
  return (
    <header className="fixed top-0 inset-x-0 z-50 bg-[var(--brand-dark)]/95 backdrop-blur border-b border-white/10">
      <div className="container mx-auto px-4 max-w-7xl flex items-center justify-between h-14 sm:h-16">
        <a href="#" className="flex items-center gap-2 text-white font-bold min-w-0">
          <span className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-[var(--gold)] flex items-center justify-center text-[var(--brand)] shrink-0">
            ✦
          </span>
          <span className="text-sm sm:text-base truncate">Sucupira Composta</span>
        </a>
        <nav className="hidden md:flex items-center gap-6 text-white/90 text-sm font-medium">
          <a href="#beneficios" className="hover:text-[var(--gold)]">Benefícios</a>
          <a href="#formula" className="hover:text-[var(--gold)]">Fórmula</a>
          <a href="#depoimentos" className="hover:text-[var(--gold)]">Depoimentos</a>
          <a href="#precos" className="hover:text-[var(--gold)]">Comprar</a>
          <a href="#faq" className="hover:text-[var(--gold)]">Dúvidas</a>
        </nav>
        <a
          href="#precos"
          className="inline-flex items-center gap-1 bg-gradient-to-r from-[var(--gold)] via-[var(--gold-light)] to-[var(--gold)] text-[var(--brand)] font-bold text-[11px] sm:text-sm px-3 sm:px-4 py-1.5 sm:py-2 rounded-full shadow-lg hover:scale-[1.03] active:scale-[0.98] transition shrink-0"
        >
          <span className="hidden sm:inline">QUERO LIVRE DE DORES</span>
          <span className="sm:hidden">COMPRAR</span> →
        </a>
      </div>


    </header>


  );
}

function Hero() {
  const conditions = [
    "Artrite e Artrose",
    "Fibromialgia",
    "Dores na Coluna",
    "Nervo Ciático",
    "Bursite e Tendinite",
    "Dores Musculares",
    "Hérnia de Disco",
    "Gota e Ácido Úrico",
    "Reumatismo",
  ];
  return (
    <section className="relative overflow-hidden bg-gradient-to-br from-[#5a0000] via-[#8B0000] to-[#5a0000] pt-32 pb-12 md:pt-36 md:pb-24">
      <div className="absolute inset-0 opacity-[0.04]" style={{ backgroundImage: "radial-gradient(circle at 2px 2px, white 1px, transparent 0px)", backgroundSize: "40px 40px" }} />
      <div className="hidden md:block absolute top-20 right-10 w-[500px] h-[500px] bg-yellow-400/10 rounded-full blur-[150px]" />
      <div className="hidden md:block absolute bottom-20 left-10 w-[400px] h-[400px] bg-white/5 rounded-full blur-[100px]" />

      <div className="container mx-auto px-4 max-w-7xl relative z-10">
        <div className="grid lg:grid-cols-2 gap-8 lg:gap-16 items-center">
          <div className="order-2 lg:order-1 text-center lg:text-left">
            <span className="inline-flex items-center gap-2 bg-[var(--gold)] text-[var(--brand)] px-4 py-1.5 rounded-full text-xs sm:text-sm font-bold uppercase tracking-wider shadow-lg mb-4">
              ✦ Black Friday Sucupira
            </span>
            <h1 className="text-[28px] sm:text-4xl md:text-5xl font-bold text-white leading-[1.15] mb-4">
              O composto 100% natural que cura as <span className="text-[var(--gold)]">dores crônicas</span> e trata as <span className="text-[var(--gold)]">dificuldades</span> do dia a dia já nas <span className="text-[var(--gold)]">primeiras 24h!</span>
            </h1>
            <p className="text-white/90 text-base md:text-lg mb-5 max-w-xl mx-auto lg:mx-0">
              Fórmula exclusiva com <strong>Sucupira + Canela de Velho + Cálcio</strong> para alívio natural das dores nas articulações, coluna e músculos. Pagamento rápido via <strong>PIX</strong>.
            </p>

            <div className="flex items-center gap-3 justify-center lg:justify-start mb-6">
              <div className="flex -space-x-2" aria-hidden="true">
                {[imgDep1, imgDep2, imgDep3].map((src) => (
                  <img key={src} src={src} alt="" width={32} height={32} loading="lazy" decoding="async" className="w-8 h-8 rounded-full object-cover border-2 border-white shadow-sm" />
                ))}
              </div>
              <div className="text-white text-xs sm:text-sm">
                <div className="font-bold">+2.847 pessoas satisfeitas</div>
                <div className="text-[var(--gold)]">★★★★★ 4.9/5</div>
              </div>
            </div>

            <div className="bg-white/10 border border-white/15 rounded-2xl p-4 mb-6 backdrop-blur">
              <p className="text-white/80 text-xs font-semibold uppercase tracking-wider mb-2">Eficaz contra:</p>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5 text-white text-xs sm:text-sm">
                {conditions.map((c) => (
                  <div key={c} className="flex items-center gap-1.5">
                    <span className="text-[var(--gold)]">✓</span> {c}
                  </div>
                ))}
              </div>
            </div>

            <div className="flex flex-col items-center lg:items-start gap-3">
              <a
                href="#precos"
                className="inline-flex items-center gap-2 bg-gradient-to-r from-[var(--gold)] via-[var(--gold-light)] to-[var(--gold)] text-[var(--brand)] font-bold text-base md:text-lg px-7 md:px-8 py-4 rounded-full shadow-[0_8px_24px_rgba(140,0,0,0.3)] hover:scale-[1.03] active:scale-[0.98] transition"
              >
                QUERO LIVRE DAS DORES →
              </a>
              <a
                href="#depoimentos"
                className="inline-flex items-center gap-2 text-white/90 hover:text-[var(--gold)] font-semibold text-sm md:text-base underline underline-offset-4 transition"
              >
                ★ Ver depoimentos de quem já usou
              </a>
            </div>

          </div>

          <div className="order-1 lg:order-2 relative">
            <img
              src={IMG.hero}
              srcSet={heroSrcSet}
              sizes={heroSizes}
              alt="Sucupira Composta"
              width={520}
              height={520}
              fetchPriority="high"
              decoding="async"
              className="w-full max-w-[280px] sm:max-w-md mx-auto drop-shadow-2xl"
            />
            <div className="absolute -top-2 -left-2 md:-top-4 md:-left-4 bg-white rounded-xl md:rounded-2xl px-3 py-2 md:px-4 md:py-3 shadow-xl text-center">
              <div className="text-[var(--brand)] font-bold text-xs md:text-sm">1 cápsula por dia</div>
              <div className="text-[10px] md:text-xs text-muted-foreground">e você se renova!</div>
            </div>
            <div className="absolute -bottom-2 -right-2 md:-bottom-4 md:-right-4 bg-[var(--gold)] rounded-xl md:rounded-2xl px-3 py-2 md:px-4 md:py-3 shadow-xl text-center">
              <ShieldCheck size={16} className="mx-auto mb-0.5 text-[var(--brand)]" aria-hidden="true" />
              <div className="text-[var(--brand)] font-bold text-[10px] md:text-xs">Garantia</div>
              <div className="text-[var(--brand)] font-extrabold text-sm md:text-base">60 dias</div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function Pains() {
  const items = [
    { t: "Dores ao levantar", d: "Aquele primeiro movimento do dia que parece uma batalha" },
    { t: "Articulações doloridas", d: "Joelhos, quadril, coluna... dor em todo lugar" },
    { t: "Corpo travado", d: "Rigidez que não passa e limita seus movimentos" },
    { t: "Limitações diárias", d: "Deixar de fazer o que ama por causa da dor" },
  ];
  return (
    <section className="py-12 md:py-20 bg-white">
      <div className="container mx-auto px-4 max-w-6xl">
        <div className="text-center mb-12">
          <p className="text-[var(--brand)] font-bold uppercase text-sm tracking-wider">Você se identifica?</p>
          <h2 className="text-3xl md:text-4xl font-bold mt-2">Cansado de viver assim?</h2>
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {items.map((i) => (
            <div key={i.t} className="bg-[var(--cream)] border border-[var(--border)] rounded-2xl p-6 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition">
              <div className="w-12 h-12 rounded-full bg-[var(--brand)]/10 text-[var(--brand)] flex items-center justify-center font-bold mb-4 border border-[var(--brand)]/20">!</div>
              <h3 className="font-bold text-lg mb-2">{i.t}</h3>
              <p className="text-muted-foreground text-sm">{i.d}</p>
            </div>
          ))}
        </div>
        <div className="text-center mt-12 max-w-2xl mx-auto">
          <p className="italic text-xl text-[var(--brand)] font-semibold">
            “E se você pudesse acordar sem dor e voltar a viver plenamente?”
          </p>
          <a href="#depoimentos" className="inline-block mt-6 text-[var(--brand)] font-bold underline">
            Veja os Depoimentos de Quem Usa →
          </a>
        </div>
      </div>
    </section>
  );
}

function Formula() {
  const items = [
    { img: IMG.sucupira, tag: "Anti-inflamatório", t: "Sucupira", d: "A semente de sucupira é tradicionalmente conhecida por suas propriedades que auxiliam no alívio de dores e inflamações articulares." },
    { img: IMG.canela, tag: "Mobilidade", t: "Canela de Velho", d: "Planta medicinal brasileira amplamente reconhecida por auxiliar na flexibilidade e mobilidade das articulações." },
    { img: IMG.calcio, tag: "Fortalecimento", t: "Cálcio", d: "Mineral essencial para a manutenção da estrutura óssea, contribuindo para ossos mais fortes e resistentes." },
  ];
  return (
    <section id="formula" className="py-12 md:py-20 bg-[var(--cream)]">
      <div className="container mx-auto px-4 max-w-6xl">
        <div className="text-center mb-12">
          <p className="text-[var(--brand)] font-bold uppercase text-sm tracking-wider">A Solução Natural</p>
          <h2 className="text-3xl md:text-4xl font-bold mt-2">Conheça a Sucupira Composta</h2>
        </div>
        <div className="grid md:grid-cols-3 gap-6">
          {items.map((i) => (
            <div key={i.t} className="bg-white rounded-2xl p-6 shadow-sm hover:shadow-md hover:border-[var(--gold)] transition border border-[var(--border)] group">
              <img 
                src={i.img} 
                alt={i.t} 
                loading="lazy" 
                decoding="async" 
                width={128} 
                height={128} 
                className="w-32 h-32 object-contain mx-auto mb-4 transition-transform group-hover:scale-105" 
              />

              <span className="inline-block bg-[var(--brand)]/10 text-[var(--brand)] text-xs font-bold px-3 py-1 rounded-full mb-3">{i.tag}</span>
              <h3 className="text-xl font-bold mb-2">{i.t}</h3>
              <p className="text-muted-foreground text-sm">{i.d}</p>
            </div>
          ))}
        </div>

        <div className="mt-12 bg-gradient-to-br from-[var(--brand)] to-[var(--brand-dark)] rounded-3xl p-8 md:p-12 text-white text-center">
          <h3 className="text-2xl md:text-3xl font-bold mb-3">Fórmula 3 em 1 completa</h3>
          <p className="text-white/90 max-w-2xl mx-auto mb-6">
            A combinação perfeita desses 3 ingredientes naturais potencializa os resultados e oferece alívio mais rápido e duradouro.
          </p>
          <p className="text-[var(--gold)] font-bold mb-6">1 cápsula por dia, antes de dormir</p>
          <a href="#precos" className="inline-flex bg-[var(--gold)] text-[var(--brand)] font-bold px-8 py-4 rounded-full hover:scale-[1.02] transition">
            Quero Experimentar Agora →
          </a>
        </div>
      </div>
    </section>
  );
}

function Product() {
  return (
    <section className="py-12 md:py-20 bg-white">
      <div className="container mx-auto px-4 max-w-6xl grid lg:grid-cols-2 gap-10 items-center">
        <div className="relative aspect-square max-w-md mx-auto w-full">
          <img 
            src={IMG.hero} 
            alt="Sucupira Composta" 
            loading="lazy" 
            decoding="async" 
            width={448}
            height={448}
            className="w-full h-full object-contain" 
          />
        </div>

        <div>
          <h2 className="text-3xl md:text-4xl font-bold mb-4">O Sucupira Composta tem a fórmula certa</h2>
          <p className="text-lg text-muted-foreground mb-6">
            Com concentração testada e ativos que realmente funcionam, <strong>quem usa sente o resultado já no primeiro dia!</strong>
          </p>
          <p className="text-sm font-semibold text-[var(--brand)] mb-6">
            Este NÃO é o mesmo encontrado em farmácias comuns
          </p>
          <div className="grid grid-cols-3 gap-4">
            {[
              { n: "500mg", l: "Concentração ideal por cápsula" },
              { n: "3 em 1", l: "Ativos naturais combinados" },
              { n: "24h", l: "Resultado no primeiro dia" },
            ].map((s) => (
              <div key={s.n} className="bg-[var(--cream)] rounded-2xl p-4 text-center border border-[var(--border)]">
                <div className="text-2xl font-extrabold text-[var(--brand)]">{s.n}</div>
                <div className="text-xs text-muted-foreground mt-1">{s.l}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

function Benefits() {
  const items = [
    { t: "Ação anti-inflamatória e analgésica", d: "Alívio rápido e eficaz das dores nas articulações" },
    { t: "Redução do ácido úrico", d: "Auxilia no controle e diminuição do ácido úrico no organismo" },
    { t: "Elimina dores causadas pela fibromialgia, artrite e artrose", d: "Fórmula especialmente desenvolvida para combater essas condições" },
    { t: "Acordar Melhor", d: "Menos rigidez ao levantar" },
    { t: "100% Natural", d: "Sem químicos ou efeitos colaterais" },
    { t: "Praticidade", d: "Apenas 1 cápsula por dia" },
    { t: "Seguro", d: "Fórmula testada e aprovada" },
    { t: "Mais Mobilidade", d: "Recupere a liberdade de movimento" },
    { t: "Resultado Rápido", d: "Sinta a diferença em poucos dias" },
  ];
  return (
    <section id="beneficios" className="py-12 md:py-20 bg-[var(--cream)]">
      <div className="container mx-auto px-4 max-w-6xl">
        <h2 className="text-3xl md:text-4xl font-bold text-center mb-12">Benefícios que você vai sentir</h2>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {items.map((i) => (
            <div key={i.t} className="bg-white rounded-2xl p-6 border border-[var(--border)] shadow-sm hover:shadow-md hover:-translate-y-0.5 transition">
              <div className="w-10 h-10 rounded-full bg-[var(--brand)] text-white flex items-center justify-center mb-3 font-bold shadow-sm">✓</div>
              <h3 className="font-bold mb-1">{i.t}</h3>
              <p className="text-sm text-muted-foreground">{i.d}</p>
            </div>
          ))}
        </div>
        <div className="text-center mt-10">
          <a href="#precos" className="inline-flex bg-[var(--brand)] text-white font-bold px-8 py-4 rounded-full hover:bg-[var(--brand-dark)] transition">
            Quero Esses Benefícios →
          </a>
        </div>
      </div>
    </section>
  );
}

function BeforeAfter() {
  return (
    <section className="py-12 md:py-20 bg-white">
      <div className="container mx-auto px-4 max-w-5xl">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold">Imagine sua vida transformada</h2>
          <p className="text-muted-foreground mt-2">Veja a diferença que a Sucupira Composta pode fazer no seu dia a dia</p>
        </div>
        <div className="grid md:grid-cols-2 gap-6">
          <div className="bg-red-50 border border-red-200 rounded-2xl p-8">
            <h3 className="text-2xl font-bold text-red-700 mb-4">ANTES</h3>
            <ul className="space-y-3 text-foreground">
              <li>✗ Acordar com dores e rigidez no corpo</li>
              <li>✗ Evitar atividades que você ama</li>
              <li>✗ Noites mal dormidas pela dor</li>
              <li>✗ Depender de remédios fortes</li>
            </ul>
          </div>
          <div className="bg-green-50 border border-green-200 rounded-2xl p-8">
            <h3 className="text-2xl font-bold text-green-700 mb-4">DEPOIS</h3>
            <ul className="space-y-3 text-foreground">
              <li>✓ Despertar renovado e sem dores</li>
              <li>✓ Voltar a fazer o que você gosta</li>
              <li>✓ Dormir profundamente e acordar bem</li>
              <li>✓ Usar apenas ingredientes naturais</li>
            </ul>
          </div>
        </div>
        <div className="text-center mt-10">
          <a href="#precos" className="inline-flex bg-[var(--gold)] text-[var(--brand)] font-bold px-8 py-4 rounded-full hover:scale-[1.02] transition">
            Quero Essa Transformação →
          </a>
        </div>
      </div>
    </section>
  );
}

function Anvisa() {
  return (
    <section className="py-16 bg-[var(--cream)]">
      <div className="container mx-auto px-4 max-w-4xl bg-white rounded-3xl p-8 md:p-12 border border-[var(--border)] grid md:grid-cols-[auto_1fr] gap-8 items-center">
        <img src={IMG.anvisa} alt="ANVISA" loading="lazy" decoding="async" className="w-32 mx-auto" />
        <div>
          <h3 className="text-2xl font-bold mb-2">Produto Isento de Registro ANVISA</h3>
          <p className="text-muted-foreground mb-4">
            Este produto é 100% natural e <strong>isento de registro</strong> de acordo com a Resolução RDC nº 240/2018 da Agência Nacional de Vigilância Sanitária (ANVISA).
          </p>
          <div className="flex flex-wrap gap-3 text-sm">
            <span className="bg-green-100 text-green-700 px-3 py-1 rounded-full font-semibold">100% Natural</span>
            <span className="bg-green-100 text-green-700 px-3 py-1 rounded-full font-semibold">Seguro para consumo</span>
            <span className="bg-green-100 text-green-700 px-3 py-1 rounded-full font-semibold">Sem contraindicações</span>
          </div>
        </div>
      </div>
    </section>
  );
}

function Carousel({ children }: { children: React.ReactNode }) {
  const ref = useRef<HTMLDivElement | null>(null);
  const scrollBy = (dir: 1 | -1) => {
    const el = ref.current;
    if (!el) return;
    el.scrollBy({ left: dir * el.clientWidth * 0.8, behavior: "smooth" });
  };
  return (
    <div className="relative">
      <div
        ref={ref}
        className="flex gap-4 md:gap-5 overflow-x-auto snap-x snap-mandatory pb-4 -mx-4 px-4 scroll-smooth [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        {children}
      </div>
      <button
        type="button"
        aria-label="Anterior"
        onClick={() => scrollBy(-1)}
        className="hidden sm:flex absolute left-2 top-1/2 -translate-y-1/2 w-11 h-11 rounded-full bg-[var(--brand)] text-white items-center justify-center shadow-lg hover:bg-[var(--brand-dark)] transition z-10"
      >
        ‹
      </button>
      <button
        type="button"
        aria-label="Próximo"
        onClick={() => scrollBy(1)}
        className="hidden sm:flex absolute right-2 top-1/2 -translate-y-1/2 w-11 h-11 rounded-full bg-[var(--brand)] text-white items-center justify-center shadow-lg hover:bg-[var(--brand-dark)] transition z-10"
      >
        ›
      </button>
    </div>
  );
}

function Testimonials() {
  const items = [
    { n: "Carlos Roberto", a: "62 anos • São Paulo, SP", q: "Já na primeira semana senti diferença. Consigo caminhar de manhã sem dor!", i: "C", p: imgDep1 },
    { n: "Ana Paula", a: "55 anos • Rio de Janeiro, RJ", q: "Voltei a brincar com meus netos no chão. Chorei de felicidade!", i: "A", p: imgDep2 },
    { n: "José Antônio", a: "67 anos • Belo Horizonte, MG", q: "Uma cápsula antes de dormir e acordo muito melhor. Já estou no terceiro frasco.", i: "J", p: imgDep3 },
    { n: "Maria das Graças", a: "59 anos • Curitiba, PR", q: "Depois de anos sofrendo com dores no joelho, finalmente encontrei algo que funciona!", i: "M", p: imgDep4 },
    { n: "Francisco Silva", a: "64 anos • Salvador, BA", q: "Minha esposa que indicou e hoje nós dois usamos. Voltamos a dançar forró!", i: "F", p: imgDep5 },
    { n: "Tereza Santos", a: "71 anos • Fortaleza, CE", q: "Achei que nunca mais ia conseguir subir escada. Agora subo sem dor nenhuma!", i: "T", p: imgDep6 },
  ];
  return (
    <section className="py-12 md:py-20 bg-white">
      <div className="container mx-auto px-4 max-w-6xl">
        <div className="grid lg:grid-cols-[1fr_2fr] gap-10 items-center mb-12">
          <img 
            src={IMG.mulher} 
            alt="Cliente satisfeita" 
            loading="lazy" 
            decoding="async" 
            width={400}
            height={500}
            className="rounded-3xl shadow-xl w-full object-cover" 
          />

          <div>
            <span className="bg-[var(--gold)] text-[var(--brand)] text-xs font-bold px-3 py-1 rounded-full">Compra verificada</span>
            <h2 className="text-3xl md:text-4xl font-bold mt-3 mb-4">
              “Depois que comecei a usar o Sucupira Composta, minha vida voltou ao normal!”
            </h2>
            <p className="text-muted-foreground mb-4">
              Eu sofria com dores nas articulações há anos. Acordava travada, não conseguia brincar com meus netos. Depois de 1 semana usando Sucupira Composta, voltei a fazer tudo que eu amava!
            </p>
            <div className="flex items-center gap-3">
              <img 
                src={imgDep7} 
                alt="Maria Helena" 
                loading="lazy" 
                width={48}
                height={48}
                className="w-12 h-12 rounded-full object-cover border-2 border-[var(--brand)]" 
              />

              <div>
                <div className="font-bold">Maria Helena</div>
                <div className="text-sm text-muted-foreground">58 anos • São Paulo, SP</div>
              </div>
            </div>
          </div>
        </div>

        <h3 className="text-2xl md:text-3xl font-bold text-center mb-8">+2.000 pessoas recomendam</h3>
        <Carousel>
          {items.map((t) => (
            <div key={t.n} className="bg-[var(--cream)] rounded-2xl p-6 border border-[var(--border)] shadow-sm snap-center shrink-0 w-[85%] sm:w-[46%] lg:w-[32%]">
              <div className="text-[var(--gold)] mb-2">★★★★★</div>
              <p className="italic mb-4">“{t.q}”</p>
              <div className="flex items-center gap-3">
                <img 
                  src={t.p} 
                  alt={t.n} 
                  loading="lazy" 
                  width={40}
                  height={40}
                  className="w-10 h-10 rounded-full object-cover border-2 border-[var(--brand)]" 
                />

                <div>
                  <div className="font-bold text-sm">{t.n}</div>
                  <div className="text-xs text-muted-foreground">{t.a}</div>
                </div>
              </div>
            </div>
          ))}
        </Carousel>
      </div>
    </section>
  );
}

function VideoTestimonials() {
  return (
    <section id="depoimentos" className="py-12 md:py-20 bg-[var(--cream)]">
      <div className="container mx-auto px-4 max-w-6xl">
        <div className="text-center mb-10">
          <h2 className="text-3xl md:text-4xl font-bold">Veja os depoimentos de quem usa nosso Sucupira Composta</h2>
          <p className="text-muted-foreground mt-2">Pessoas reais que transformaram suas vidas</p>
        </div>
        <Carousel>
          {VIDEOS.map(({ src, poster }, idx) => (
            <div key={src} className="snap-center shrink-0 w-[45%] sm:w-[32%] lg:w-[23%]">
              <LazyVideo src={src} poster={poster} idx={idx} />
            </div>
          ))}
        </Carousel>
        <div className="text-center mt-10">
          <a href="#precos" className="inline-flex bg-[var(--brand)] text-white font-bold px-8 py-4 rounded-full hover:bg-[var(--brand-dark)] transition">
            Quero Experimentar Também →
          </a>
        </div>
      </div>
    </section>
  );
}

function Guarantee() {
  return (
    <section className="py-16 bg-white">
      <div className="container mx-auto px-4 max-w-4xl bg-gradient-to-br from-[var(--gold)]/30 to-[var(--gold)]/10 border border-[var(--gold)] rounded-3xl p-8 md:p-12 text-center">
        <div className="w-20 h-20 rounded-full bg-[var(--gold)] text-[var(--brand)] mx-auto flex items-center justify-center font-extrabold text-2xl mb-4 shadow-lg border-4 border-white">30</div>
        <h3 className="text-2xl md:text-3xl font-bold mb-3">RISCO ZERO: Ou você ama os resultados ou devolvemos cada centavo</h3>
        <p className="text-muted-foreground max-w-2xl mx-auto mb-4">
          Teste o Sucupira Composta por 60 dias. Se não sentir resultado, basta entrar em contato pelo nosso <strong>e-mail</strong> que devolvemos <strong>100% do seu dinheiro</strong> — sem perguntas, sem burocracia.
        </p>
        <p className="text-xl font-bold text-[var(--brand)] mb-6">Garantia blindada de 60 dias</p>

        <div className="flex flex-wrap justify-center gap-3 text-sm">
          <span className="bg-white px-4 py-2 rounded-full border border-[var(--border)] font-semibold">60 dias para testar</span>
          <span className="bg-white px-4 py-2 rounded-full border border-[var(--border)] font-semibold">Reembolso total</span>
          <span className="bg-white px-4 py-2 rounded-full border border-[var(--border)] font-semibold">Sem burocracia</span>
        </div>
      </div>
    </section>
  );
}

function Countdown() {
  const [t, setT] = useState({ h: 6, m: 30, s: 47 });
  useEffect(() => {
    const id = setInterval(() => {
      setT((p) => {
        let { h, m, s } = p;
        s--;
        if (s < 0) { s = 59; m--; }
        if (m < 0) { m = 59; h--; }
        if (h < 0) { h = 0; m = 0; s = 0; }
        return { h, m, s };
      });
    }, 1000);
    return () => clearInterval(id);
  }, []);
  const Box = ({ n, l }: { n: number; l: string }) => (
    <div className="bg-[var(--brand)] text-white rounded-xl px-5 py-3 min-w-[80px]">
      <div className="text-3xl font-extrabold">{String(n).padStart(2, "0")}</div>
      <div className="text-xs uppercase">{l}</div>
    </div>
  );
  return (
    <div className="flex items-center justify-center gap-3">
      <Box n={t.h} l="Horas" />
      <Box n={t.m} l="Min" />
      <Box n={t.s} l="Seg" />
    </div>
  );
}

function Pricing() {
  const kits = [
    {
      title: "1 Frasco",
      sub: "30 dias de tratamento",
      img: IMG.kit1,
      from: formatKitPrice(KIT_PRICING.k1.fromCents),
      price: formatKitPrice(KIT_PRICING.k1.priceCents),
      href: CHECKOUT.k1,
      highlight: false,
    },
    {
      title: "3 Frascos",
      sub: "90 dias de tratamento",
      tag: "Mais Vendido",
      meta: "Escolha de 73% dos clientes",
      img: IMG.kit3,
      from: formatKitPrice(KIT_PRICING.k3.fromCents),
      price: formatKitPrice(KIT_PRICING.k3.priceCents),
      href: CHECKOUT.k3,
      highlight: true,
      badge: "MELHOR CUSTO-BENEFÍCIO",
    },
    {
      title: "5 Frascos",
      sub: "150 dias de tratamento",
      img: IMG.kit5,
      from: formatKitPrice(KIT_PRICING.k5.fromCents),
      price: formatKitPrice(KIT_PRICING.k5.priceCents),
      href: CHECKOUT.k5,
      highlight: false,
    },
  ];

  return (
    <section id="precos" className="py-12 md:py-20 bg-[var(--cream)]">
      <div className="container mx-auto px-4 max-w-6xl">
        <div className="text-center mb-8">
          <p className="text-primary font-bold uppercase text-sm">Black Friday Sucupira Composta</p>
          <p className="text-muted-foreground mt-1 mb-5">Kits com preços especiais e FRETE GRÁTIS</p>
        </div>

        <h2 className="text-3xl md:text-4xl font-bold text-center mt-12 mb-2">Escolha seu Kit</h2>
        <p className="text-center text-sm text-red-600 mb-10">⚠️ Estoque limitado — Últimas unidades do lote promocional</p>

        <div className="grid md:grid-cols-3 gap-6 items-stretch">
          {kits.map((k) => (
            <div
              key={k.title}
              className={`relative bg-white rounded-3xl p-6 border-2 flex flex-col ${
                k.highlight ? "border-[var(--brand)] shadow-2xl md:-translate-y-4" : "border-[var(--border)] shadow-sm hover:shadow-md transition"
              }`}
            >
              {k.tag && (
                <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-[var(--brand)] text-white text-xs font-bold px-4 py-1 rounded-full">
                  {k.tag}
                </span>
              )}
              <h3 className="text-2xl font-bold text-center">{k.title}</h3>
              <p className="text-center text-muted-foreground text-sm">{k.sub}</p>
              {k.meta && <p className="text-center text-xs text-[var(--brand)] font-semibold mt-1">{k.meta}</p>}
              <img 
                src={k.img} 
                alt={k.title} 
                loading="lazy" 
                decoding="async" 
                width={200} 
                height={200} 
                className="w-full h-48 object-contain my-5" 
              />

              <div className="text-center mb-2">
                <div className="text-sm text-muted-foreground">
                  De <span className="line-through">{k.from}</span> por apenas
                </div>
                <div className="text-4xl font-extrabold text-[var(--brand)]">{k.price}</div>
                <div className="text-[11px] font-bold text-emerald-700 uppercase tracking-wide mt-1">
                  BLACK FRIDAY COM FRETE GRÁTIS
                </div>

              </div>
              <div className="flex flex-wrap justify-center gap-2 my-4 text-xs">
                <span className="inline-flex items-center gap-1.5 bg-green-100 text-green-700 px-3 py-1 rounded-full font-semibold"><Truck size={13} aria-hidden="true" /> Entrega Garantida com Código de Rastreio</span>
                {k.badge && (
                  <span className="bg-[var(--gold)] text-[var(--brand)] px-3 py-1 rounded-full font-bold">{k.badge}</span>
                )}
                <span className="inline-flex items-center gap-1.5 bg-blue-100 text-blue-700 px-3 py-1 rounded-full font-semibold"><BadgeCheck size={13} aria-hidden="true" /> Garantia 60 dias</span>
              </div>

              <Link
                to="/checkout/$kit"
                params={{ kit: k.href }}
                search={true}
                reloadDocument
                onClick={() => {
                  const w = window as any;
                  const value = KIT_PRICING[k.href].priceCents / 100;
                  const num = k.href === "k5" ? 5 : k.href === "k3" ? 3 : 1;
                  if (typeof w.fbq === "function") {
                    w.fbq("track", "AddToCart", {
                      content_ids: [k.href],
                      content_name: k.title,
                      content_type: "product",
                      value,
                      currency: "BRL",
                      num_items: num,
                    });
                  }
                }}
                className={`mt-auto block text-center font-bold py-4 rounded-full transition ${
                  k.highlight
                    ? "bg-[var(--brand)] text-white hover:bg-[var(--brand-dark)]"
                    : "bg-[var(--gold)] text-[var(--brand)] hover:scale-[1.02]"
                }`}
              >
                Escolher Esse Kit →
              </Link>
              <p className="flex items-center justify-center gap-1.5 text-center text-[11px] text-muted-foreground mt-2 leading-snug">
                <LockKeyhole size={12} aria-hidden="true" /> <span><strong>Pagamento via PIX</strong> com Aprovação Instantânea</span>
              </p>
            </div>
          ))}

        </div>

        <div className="flex flex-wrap justify-center gap-3 sm:gap-6 text-sm text-muted-foreground mt-10" aria-label="Benefícios da compra">
          <span className="inline-flex items-center gap-1.5"><LockKeyhole size={15} className="text-[var(--brand)]" aria-hidden="true" /> Compra Segura</span>
          <span className="inline-flex items-center gap-1.5"><BadgeCheck size={15} className="text-[var(--brand)]" aria-hidden="true" /> Pagamento via PIX</span>
          <span className="inline-flex items-center gap-1.5"><Truck size={15} className="text-[var(--brand)]" aria-hidden="true" /> Frete Grátis</span>
          <span className="inline-flex items-center gap-1.5"><ShieldCheck size={15} className="text-[var(--brand)]" aria-hidden="true" /> Garantia 60 Dias</span>
        </div>
      </div>
    </section>
  );
}

function FAQItem({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="bg-white border border-[var(--border)] rounded-2xl shadow-sm hover:border-[var(--brand)]/30 transition-colors">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between text-left p-5 font-semibold"
      >
        <span>{q}</span>
        <span className="text-[var(--brand)] text-xl">{open ? "−" : "+"}</span>
      </button>
      {open && <div className="px-5 pb-5 text-muted-foreground text-sm">{a}</div>}
    </div>
  );
}

function FAQ() {
  const items: { q: string; a: string }[] = [
    { q: "Quais são as formas de pagamento?", a: "Para garantir a melhor agilidade no envio e os menores preços, aceitamos pagamentos via PIX. A aprovação é instantânea e o envio ocorre em até 24h." },
    { q: "Como faço para comprar?", a: "É só escolher seu kit na seção de preços e clicar em \"Escolher Esse Kit\". Você será direcionado ao checkout seguro para finalizar o pedido via PIX." },


    { q: "Em quanto tempo faz efeito?", a: "A maioria dos usuários relata alívio das dores já nas primeiras 24h. Para resultados completos, recomendamos uso contínuo por pelo menos 30 dias." },
    { q: "Como devo tomar?", a: "Tome 1 cápsula por dia, preferencialmente antes de dormir, com um copo de água." },
    { q: "Quanto tempo dura 1 frasco?", a: "Cada frasco contém 30 cápsulas, o suficiente para 30 dias de tratamento." },
    { q: "Posso tomar se tenho diabetes?", a: "O Sucupira Composta é 100% natural. Em casos de condições específicas, recomendamos consultar seu médico antes do uso." },
    { q: "Tem interação com outros remédios?", a: "Por ser natural, geralmente não há interações. Em caso de uso de medicamentos contínuos, consulte seu médico." },
    { q: "Tem contraindicação?", a: "Contraindicado para gestantes, lactantes e menores de 18 anos." },
    { q: "O frete é grátis?", a: "Sim! Todos os kits têm FRETE GRÁTIS para todo o Brasil." },
    { q: "Como funciona a garantia?", a: "Você tem 60 dias para testar. Se não gostar, devolvemos 100% do seu dinheiro, sem burocracia." },
    { q: "Quanto tempo para chegar?", a: "O prazo médio de entrega é de 3 a 5 dias úteis, dependendo da sua região." },
    { q: "É aprovado pela ANVISA?", a: "Produto isento de registro segundo a RDC nº 240/2018 da ANVISA. 100% natural e seguro." },
    { q: "Posso tomar junto com outros suplementos?", a: "Sim, geralmente não há problema. Em caso de dúvida, consulte seu profissional de saúde." },
  ];
  return (
    <section id="faq" className="py-12 md:py-20 bg-white">
      <div className="container mx-auto px-4 max-w-3xl">
        <h2 className="text-3xl md:text-4xl font-bold text-center mb-10">Perguntas Frequentes</h2>
        <div className="space-y-3">
          {items.map((i) => <FAQItem key={i.q} q={i.q} a={i.a} />)}
        </div>
        <div className="text-center mt-10">
          <p className="font-semibold mb-3">Ainda tem dúvidas?</p>
          <div className="flex flex-wrap justify-center gap-3">
            <a href="mailto:contato@sucupiracomposta.com.br" className="bg-[var(--cream)] border border-[var(--border)] px-5 py-3 rounded-full text-sm font-semibold">
              ✉️ contato@sucupiracomposta.com.br
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}

function FinalCTA() {
  return (
    <section className="py-20 bg-gradient-to-br from-[var(--brand-dark)] via-[var(--brand)] to-[var(--brand-dark)] text-white">
      <div className="container mx-auto px-4 max-w-4xl text-center">
        <h2 className="text-3xl md:text-5xl font-bold mb-4">Não deixe a dor roubar mais dias da sua vida!</h2>
        <p className="text-white/90 text-lg mb-8">Milhares já transformaram sua qualidade de vida. Agora é a sua vez!</p>
        <a href="#precos" className="inline-flex bg-[var(--gold)] text-[var(--brand)] font-bold px-10 py-5 rounded-full shadow-2xl hover:scale-[1.02] transition text-lg">
          Quero Minha Sucupira Composta →
        </a>
        <div className="flex flex-wrap justify-center gap-6 mt-8 text-sm text-white/80">
          <span>✓ Garantia 60 dias</span>
          <span>✓ Frete Grátis</span>
          <span>✓ +2.000 clientes</span>
        </div>
      </div>
    </section>
  );
}


function CTABridge({
  eyebrow, title, cta, tone = "cream", microcopy,
}: { eyebrow: string; title: string; cta: string; tone?: "cream" | "brand"; microcopy?: string }) {
  const isBrand = tone === "brand";
  return (
    <section className={isBrand ? "bg-[var(--brand)] py-10 md:py-14" : "bg-[var(--cream)] py-10 md:py-14"}>
      <div className="container mx-auto px-4 max-w-4xl text-center">
        <p className={`text-xs md:text-sm font-bold uppercase tracking-wider mb-2 ${isBrand ? "text-[var(--gold)]" : "text-[var(--brand)]"}`}>
          {eyebrow}
        </p>
        <h3 className={`text-2xl md:text-3xl font-bold mb-5 ${isBrand ? "text-white" : "text-foreground"}`}>
          {title}
        </h3>
        <a
          href="#precos"
          className="inline-flex items-center gap-2 bg-[var(--gold)] text-[var(--brand)] font-bold text-base md:text-lg px-7 md:px-8 py-4 rounded-full shadow-xl hover:scale-[1.02] transition"
        >
          {cta}
        </a>
        {microcopy && (
          <p className={`mt-3 text-xs md:text-sm ${isBrand ? "text-white/80" : "text-muted-foreground"}`}>
            {microcopy}
          </p>
        )}
      </div>
    </section>
  );
}

function ScarcityStrip() {
  return (
    <section className="bg-[var(--brand-dark)] text-white py-4 border-y border-[var(--gold)]/30">
      <div className="container mx-auto px-4 max-w-5xl flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-xs md:text-sm font-semibold">
        <span className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-[var(--gold)] animate-pulse" />
          Últimas unidades do lote em estoque
        </span>
        <span className="hidden md:inline opacity-50">•</span>
        <span>🚚 Envio em até 24h</span>
        <span className="hidden md:inline opacity-50">•</span>
        <span>🛡️ Garantia incondicional de 60 dias</span>
      </div>
    </section>
  );
}

function Footer() {

  return (
    <footer className="bg-[var(--brand-dark)] text-white/80 py-12 text-sm">
      <div className="container mx-auto px-4 max-w-6xl space-y-8">
        {/* Trust badges */}
        <div className="text-center border-b border-white/15 pb-6">
          <p className="font-bold text-white text-base tracking-wide">
            🔒 COMPRA SEGURA &nbsp;|&nbsp; 🛡️ AMBIENTE PROTEGIDO &nbsp;|&nbsp; 🚚 FRETE GRÁTIS
          </p>
          <p className="mt-3 max-w-3xl mx-auto text-white/75">
            Seus dados financeiros estão totalmente seguros. O processamento do pagamento é
            criptografado e certificado pelos maiores padrões de segurança online.
          </p>
        </div>

        {/* Company info */}
        <div className="text-center space-y-1 border-b border-white/15 pb-6">
          <p className="font-extrabold text-white text-lg">Sucupira Composta</p>
          <p>©️ 2026 – Todos os direitos reservados.</p>
          <p>MJA – CNPJ: 17.797.109/0001-02</p>
          <p>Rua Cinco, N 112, Jardim Lucinda, Itaquaquecetuba - SP, 08593-289</p>
        </div>

        {/* Useful links + customer service */}
        <div className="grid md:grid-cols-2 gap-6 border-b border-white/15 pb-6">
          <div className="text-center md:text-left">
            <p className="font-bold text-white mb-2">LINKS ÚTEIS:</p>
            <p className="space-x-2">
              <a href="#" className="hover:text-[var(--gold)]">Políticas de Privacidade</a>
              <span>|</span>
              <a href="#" className="hover:text-[var(--gold)]">Termos de Uso</a>
              <span>|</span>
              <a href="#" className="hover:text-[var(--gold)]">Políticas de Reembolso</a>
            </p>
          </div>
          <div className="text-center md:text-right">
            <p className="font-bold text-white mb-2">ATENDIMENTO AO CLIENTE:</p>
            <p>E-mail: contato@sucupiracompostaspt.com.br</p>
            <p>Horário: Segunda a Sexta, das 08h às 18h</p>
          </div>
        </div>

        {/* Legal disclaimers */}
        <div className="space-y-3 text-xs text-white/60 max-w-4xl mx-auto leading-relaxed">
          <p className="font-bold text-white/80 text-center">
            AVISOS LEGAIS E ISENÇÃO DE RESPONSABILIDADE:
          </p>
          <p>
            Este produto é 100% natural e isento de registro de acordo com a Resolução RDC nº
            240/2018 da Agência Nacional de Vigilância Sanitária (ANVISA).
          </p>
          <p>
            As informações e sugestões contidas neste site têm caráter meramente informativo e
            não substituem o aconselhamento, diagnóstico ou tratamento de profissionais de
            saúde. Os resultados podem variar de acordo com o organismo de cada pessoa.
          </p>
          <p>
            Este site não faz parte do site do Facebook ou da Meta Platforms, Inc. Além disso,
            este site NÃO é endossado pelo Facebook de forma alguma. FACEBOOK é uma marca
            comercial da META PLATFORMS, Inc.
          </p>
        </div>
      </div>
    </footer>
  );
}

function MobileStickyCTA() {
  return (
    <div className="md:hidden fixed bottom-0 inset-x-0 z-40 bg-white/95 backdrop-blur border-t border-[var(--border)] px-3 py-2.5 shadow-[0_-4px_20px_rgba(0,0,0,0.08)]">
      <a
        href="#precos"
        className="flex items-center justify-center gap-2 w-full bg-[var(--brand)] text-white font-bold py-3 rounded-full text-sm"
      >
        APROVEITAR DESCONTO NO CHECKOUT →
      </a>
    </div>
  );
}
