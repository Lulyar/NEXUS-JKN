export default function PageContainer({ children }) {
  return (
    <main className="mx-auto flex min-h-0 w-full max-w-[1600px] flex-1 flex-col overflow-y-auto px-4 py-4 sm:px-6 lg:px-8 lg:py-6">
      {children}
    </main>
  );
}
