interface FaqItem {
  q: string;
  a: string;
}

interface FaqAccordionProps {
  items: FaqItem[];
}

export function FaqAccordion({ items }: FaqAccordionProps) {
  return (
    <div className="space-y-2">
      {items.map((item) => (
        <details key={item.q} className="rounded-lg border bg-muted/20 p-3">
          <summary className="cursor-pointer text-sm font-semibold">{item.q}</summary>
          <p className="mt-2 text-sm text-muted-foreground">{item.a}</p>
        </details>
      ))}
    </div>
  );
}
