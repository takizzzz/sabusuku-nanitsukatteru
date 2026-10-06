export function Prose({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <article className="mx-auto max-w-2xl px-4 py-10">
      <h1 className="text-2xl font-extrabold">{title}</h1>
      <div className="mt-6 space-y-4 text-sm leading-7 text-muted [&_h2]:mt-8 [&_h2]:text-base [&_h2]:font-bold [&_h2]:text-fg">
        {children}
      </div>
    </article>
  );
}
