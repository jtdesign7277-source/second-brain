export default function EmailBar() {
  return (
    <div className="rounded-xl border border-zinc-800 bg-zinc-900/40 px-4 py-3 text-sm text-zinc-300">
      Stratify Email:{" "}
      <a
        className="font-medium text-emerald-400 hover:text-emerald-300"
        href="mailto:jeff@stratify-associates.com"
      >
        jeff@stratify-associates.com
      </a>
    </div>
  );
}
