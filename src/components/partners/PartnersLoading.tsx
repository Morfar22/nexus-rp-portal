export function PartnersLoading() {
  return (
    <div className="flex items-center justify-center h-96">
      <div className="text-center">
        <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-6" />
        <p className="text-lg text-muted-foreground">Loading elite partners...</p>
      </div>
    </div>
  );
}