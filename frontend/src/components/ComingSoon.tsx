import Link from "next/link";
import type { LucideIcon } from "lucide-react";

export default function ComingSoon({
  title,
  intro,
  items,
  Icon,
}: {
  title: string;
  intro: string;
  items: string[];
  Icon: LucideIcon;
}) {
  return (
    <div>
      <h1 className="text-3xl font-semibold">{title}</h1>
      <p className="mt-1 text-muted">{intro}</p>

      <section className="mt-8 max-w-2xl rounded-2xl border border-dashed border-line bg-film p-8">
        <Icon size={28} className="text-cortex" aria-hidden />
        <h2 className="mt-3 font-display text-lg font-semibold">Coming in a later step</h2>
        <ul className="mt-3 list-disc space-y-1.5 pl-5 text-sm text-muted">
          {items.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
        <Link href="/dashboard" className="mt-6 inline-block text-sm font-medium text-cortex hover:underline">
          Back to the dashboard
        </Link>
      </section>
    </div>
  );
}