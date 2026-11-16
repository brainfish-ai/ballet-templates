import Image from "next/image";
import { Card } from "@/components/ui/card";
import type { EnrichDataParts } from "@/lib/types";

export function PromoCards({
  promos,
}: {
  promos: Array<EnrichDataParts["promo"]>;
}) {
  if (!promos.length) return null;
  return (
    <div className="grid gap-3 sm:grid-cols-2">
      {promos.map((promo) => (
        <Card key={promo.kind} className="bg-[var(--lilac)]/40 animate-[rise_0.5s_ease-out]">
          <h3 className="text-base font-semibold text-[var(--ink)]">{promo.title}</h3>
          <p className="mt-1 text-sm text-[var(--ink-2)]">{promo.body}</p>
          <a
            href={promo.href}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-4 inline-flex"
          >
            {promo.kind === "import" ? (
              <Image
                src="/import-to-ballet.svg"
                alt="Import to Ballet"
                width={172}
                height={36}
                unoptimized
              />
            ) : (
              <span className="inline-flex h-9 items-center rounded-xl bg-[var(--ink)] px-4 text-sm font-semibold text-white hover:bg-[var(--deep)]">
                {promo.cta}
              </span>
            )}
          </a>
        </Card>
      ))}
    </div>
  );
}
