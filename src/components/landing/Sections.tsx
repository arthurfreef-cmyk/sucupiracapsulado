import { useState, useRef, useEffect, ReactNode } from "react";
import { Link } from "@tanstack/react-router";

// Helper components and types
export function Header() {
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

export function Pains() {
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

export function Benefits() {
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

export function BeforeAfter() {
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

export function Carousel({ children }: { children: ReactNode }) {
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

export function Guarantee() {
  return (
    <section className="py-16 bg-white">
      <div className="container mx-auto px-4 max-w-4xl bg-gradient-to-br from-[var(--gold)]/30 to-[var(--gold)]/10 border border-[var(--gold)] rounded-3xl p-8 md:p-12 text-center">
        <div className="w-20 h-20 rounded-full bg-[var(--gold)] text-[var(--brand)] mx-auto flex items-center justify-center font-extrabold text-2xl mb-4 shadow-lg border-4 border-white">30</div>
        <h3 className="text-2xl md:text-3xl font-bold mb-3">RISCO ZERO: Ou você ama os resultados ou devolvemos cada centavo</h3>
        <p className="text-muted-foreground max-w-2xl mx-auto mb-4">
          Teste o Sucupira Composta por 60 dias. Se não sentir resultado, basta entrar em contato pelo nosso <strong>WhatsApp</strong> que devolvemos <strong>100% do seu dinheiro</strong> — sem perguntas, sem burocracia.
        </p>
        <p className="text-xl font-bold text-[var(--brand)] mb-6">Garantia blindada de 60 dias</p>
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

export function FAQ() {
  const items: { q: string; a: string }[] = [
    { q: "Quais são as formas de pagamento?", a: "Para garantir a melhor agilidade no envio e os menores preços, aceitamos pagamentos via PIX. A aprovação é instantânea e o envio ocorre em até 24h." },
    { q: "Como devo tomar?", a: "Tome 1 cápsula por dia, preferencialmente antes de dormir, com um copo de água." },
    { q: "O frete é grátis?", a: "Sim! Todos os kits têm FRETE GRÁTIS para todo o Brasil." },
    { q: "Como funciona a garantia?", a: "Você tem 60 dias para testar. Se não gostar, devolvemos 100% do seu dinheiro, sem burocracia." },
  ];
  return (
    <section id="faq" className="py-12 md:py-20 bg-white">
      <div className="container mx-auto px-4 max-w-3xl">
        <h2 className="text-3xl md:text-4xl font-bold text-center mb-10">Perguntas Frequentes</h2>
        <div className="space-y-3">
          {items.map((i) => <FAQItem key={i.q} q={i.q} a={i.a} />)}
        </div>
      </div>
    </section>
  );
}

export function FinalCTA() {
  return (
    <section className="py-20 bg-gradient-to-br from-[var(--brand-dark)] via-[var(--brand)] to-[var(--brand-dark)] text-white text-center">
      <h2 className="text-3xl md:text-5xl font-bold mb-4">Não deixe a dor roubar mais dias da sua vida!</h2>
      <a href="#precos" className="inline-flex bg-[var(--gold)] text-[var(--brand)] font-bold px-10 py-5 rounded-full shadow-2xl hover:scale-[1.02] transition text-lg">
        Quero Minha Sucupira Composta →
      </a>
    </section>
  );
}

export function ScarcityStrip() {
  return (
    <section className="bg-[var(--brand-dark)] text-white py-4 border-y border-[var(--gold)]/30 text-center text-sm font-semibold">
      🚚 Envio em até 24h • 🛡️ Garantia incondicional de 60 dias
    </section>
  );
}

export function Footer() {
  return (
    <footer className="bg-[var(--brand-dark)] text-white/80 py-12 text-sm text-center">
      <p className="font-extrabold text-white text-lg">Sucupira Composta</p>
      <p>©️ 2026 – Todos os direitos reservados.</p>
    </footer>
  );
}

export function MobileStickyCTA() {
  return (
    <div className="md:hidden fixed bottom-0 inset-x-0 z-40 bg-white/95 backdrop-blur border-t border-[var(--border)] px-3 py-2.5">
      <a href="#precos" className="flex items-center justify-center w-full bg-[var(--brand)] text-white font-bold py-3 rounded-full text-sm">
        APROVEITAR DESCONTO NO CHECKOUT →
      </a>
    </div>
  );
}
