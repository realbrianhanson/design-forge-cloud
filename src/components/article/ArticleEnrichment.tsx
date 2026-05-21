import { CheckCircle2, MapPin } from 'lucide-react';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';

export interface FaqItem {
  question: string;
  answer: string;
}

export const TldrBullets = ({ bullets }: { bullets: string[] }) => {
  if (!Array.isArray(bullets) || bullets.length === 0) return null;
  return (
    <div className="mt-8 rounded-xl border border-border bg-card p-5">
      <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
        TL;DR
      </h2>
      <ul className="mt-3 space-y-2">
        {bullets.map((b, i) => (
          <li key={i} className="flex gap-2 text-foreground">
            <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-accent" />
            <span className="leading-relaxed">{b}</span>
          </li>
        ))}
      </ul>
    </div>
  );
};

export const LocalImpact = ({ bullets }: { bullets: string[] }) => {
  if (!Array.isArray(bullets) || bullets.length === 0) return null;
  return (
    <div className="mt-6 rounded-xl border-l-4 border-primary bg-primary/5 p-5">
      <div className="flex items-center gap-2">
        <MapPin className="h-4 w-4 text-primary" />
        <h2 className="text-sm font-semibold uppercase tracking-wide text-primary">
          Why it matters for Jacksonville
        </h2>
      </div>
      <ul className="mt-3 space-y-2">
        {bullets.map((b, i) => (
          <li key={i} className="flex gap-2 text-foreground">
            <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
            <span className="leading-relaxed">{b}</span>
          </li>
        ))}
      </ul>
    </div>
  );
};

export const ArticleFaq = ({ items }: { items: FaqItem[] }) => {
  if (!Array.isArray(items) || items.length === 0) return null;
  return (
    <section className="mt-12 pt-8 border-t border-border">
      <h2 className="text-xl font-semibold text-primary mb-4">
        Frequently asked questions
      </h2>
      <Accordion type="single" collapsible className="w-full">
        {items.map((q, i) => (
          <AccordionItem key={i} value={`faq-${i}`}>
            <AccordionTrigger className="text-left text-base font-medium">
              {q.question}
            </AccordionTrigger>
            <AccordionContent className="text-foreground leading-relaxed">
              {q.answer}
            </AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
    </section>
  );
};

export const buildFaqJsonLd = (items: FaqItem[]) => ({
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  mainEntity: items.map((q) => ({
    '@type': 'Question',
    name: q.question,
    acceptedAnswer: {
      '@type': 'Answer',
      text: q.answer,
    },
  })),
});
