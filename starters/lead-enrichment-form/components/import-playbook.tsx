import Image from "next/image";
import { importPlaybookUrl, IMPORT_TEMPLATE_ID } from "@/lib/ballet-links";

export function ImportPlaybookButton({
  templateId = IMPORT_TEMPLATE_ID,
  className = "",
}: {
  templateId?: string;
  className?: string;
}) {
  const href = importPlaybookUrl(templateId);
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className={`inline-flex shrink-0 transition hover:opacity-90 ${className}`}
      aria-label="Import this playbook to Ballet"
    >
      <Image
        src="/import-to-ballet.svg"
        alt="Import to Ballet"
        width={172}
        height={36}
        unoptimized
        priority={false}
      />
    </a>
  );
}
