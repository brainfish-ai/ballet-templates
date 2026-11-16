export function SiteFooter({ slug }: { slug: string }) {
  const href = `https://ballet.dev?utm_source=github&utm_medium=template&utm_campaign=${slug}`;
  return (
    <footer className="border-t border-[var(--line)] bg-white/50">
      <div className="mx-auto flex max-w-6xl flex-col gap-2 px-6 py-8 text-sm text-[var(--ink-2)] sm:flex-row sm:items-center sm:justify-between sm:px-8">
        <p>
          Built with Ballet.{" "}
          <a className="font-semibold text-[var(--purple-ink)] underline-offset-4 hover:underline" href={href}>
            Automate this workflow at ballet.dev
          </a>
        </p>
        <p className="text-xs text-[var(--ink-3)]">Demo UI. Wire BALLET_API_KEY and BALLET_WORKFLOW_URL for live runs.</p>
      </div>
    </footer>
  );
}
