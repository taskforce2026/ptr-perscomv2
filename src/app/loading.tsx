export default function Loading() {
  return (
    <div className="flex items-center justify-center py-32 text-gold-400">
      <div className="h-8 w-8 animate-spin rounded-full border-2 border-gold-500/30 border-t-gold-400" />
      <span className="ml-3 text-sm uppercase tracking-widest">A carregar…</span>
    </div>
  );
}
