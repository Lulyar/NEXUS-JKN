export default function Header() {
  return (
    <header className="border-b border-slate-800 bg-slate-950">
      <div className="mx-auto flex min-h-[72px] max-w-[1600px] items-center justify-between gap-4 px-4 py-3 sm:px-6 lg:px-8">
        {/* Brand */}
        <div className="flex min-w-0 items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center">
            <img src="/logo.png" alt="NEXUS-JKN Logo" className="h-full w-full object-contain" />
          </div>

          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h1 className="truncate text-base font-bold tracking-wide text-white sm:text-lg">
                NEXUS-JKN
              </h1>
            </div>

            <p className="hidden text-xs font-medium text-slate-500 sm:block">
              Network Explorer & Unusual Syndicate Detector
            </p>
          </div>
        </div>
      </div>
    </header>
  );
}
