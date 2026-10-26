export default function StoreLoading() {
  return (
    <main
      aria-busy="true"
      aria-live="polite"
      style={{ minHeight: '50vh', display: 'grid', placeItems: 'center', padding: 32 }}
    >
      <p role="status" style={{ color: 'var(--ink-soft)', fontSize: 15 }}>
        Loading the shop…
      </p>
    </main>
  );
}
