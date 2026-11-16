import Image from "next/image";

export function SiteHeader({
  title,
  subtitle,
}: {
  title: string;
  subtitle: string;
}) {
  return (
    <header className="relative overflow-hidden border-b border-[var(--line)]">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(138,91,209,0.18),transparent_42%),radial-gradient(circle_at_80%_0%,rgba(42,31,94,0.12),transparent_35%),var(--dots)]" />
      <div className="relative mx-auto flex max-w-6xl flex-col gap-6 px-6 py-10 sm:px-8">
        <a
          href="https://ballet.dev?utm_source=github&utm_medium=template&utm_campaign=starter-header"
          className="inline-flex w-fit items-center gap-3"
        >
          <Image
            src="/ballet-mark-v2.svg"
            alt="Ballet"
            width={40}
            height={40}
            priority
            className="animate-[float_4s_ease-in-out_infinite]"
          />
          <span className="text-sm font-semibold tracking-[0.18em] text-[var(--ink-2)]">
            BALLET
          </span>
        </a>
        <div className="max-w-2xl animate-[rise_0.7s_ease-out]">
          <h1 className="text-3xl font-semibold tracking-tight text-[var(--ink)] sm:text-4xl">
            {title}
          </h1>
          <p className="mt-3 text-base text-[var(--ink-2)] sm:text-lg">{subtitle}</p>
        </div>
      </div>
    </header>
  );
}
