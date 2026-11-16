import Image from "next/image";

export function PoweredByBallet({ className = "" }: { className?: string }) {
  return (
    <a
      href="https://ballet.dev?utm_source=github&utm_medium=template&utm_campaign=powered-by"
      target="_blank"
      rel="noopener noreferrer"
      className={`inline-flex items-center gap-1.5 rounded-full border border-[var(--line)] bg-[var(--lilac)]/70 px-2.5 py-1 text-[11px] font-medium text-[var(--deep)] transition hover:bg-[var(--lilac)] ${className}`}
    >
      <Image src="/ballet-mark-v2.svg" alt="" width={14} height={14} />
      Powered by Ballet workflow
    </a>
  );
}
