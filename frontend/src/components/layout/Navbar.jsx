import { useState } from "react";

import {
  Activity,
  BarChart3,
  Building2,
  ClipboardCheck,
  Menu,
  X,
} from "lucide-react";

const menus = [
  {
    id: "monitoring",
    label: "Monitoring",
    icon: Activity,
  },
  {
    id: "priority",
    label: "Prioritas Audit",
    icon: ClipboardCheck,
  },
  {
    id: "facilities",
    label: "Faskes",
    icon: Building2,
  },
  {
    id: "analytics",
    label: "Analitik",
    icon: BarChart3,
  },
];

export default function Navbar({ activeView, onChange }) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <nav className="relative border-b border-slate-800 bg-slate-950">
      <div className="mx-auto flex max-w-[1600px] items-center justify-between px-4 md:block md:px-6 lg:px-8">
        <button
          type="button"
          aria-expanded={isOpen}
          aria-controls="main-navigation"
          aria-label={isOpen ? "Tutup menu navigasi" : "Buka menu navigasi"}
          onClick={() => setIsOpen((open) => !open)}
          className="flex items-center gap-2 py-3 text-sm font-medium text-slate-300 transition hover:text-blue-400 md:hidden"
        >
          {isOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          <span>Menu</span>
        </button>

        <div
          id="main-navigation"
          className={`${isOpen ? "flex" : "hidden"} absolute left-0 right-0 top-full z-20 flex-col gap-1 border-b border-slate-800 bg-slate-950 px-4 pb-3 shadow-xl md:static md:flex md:flex-row md:gap-1 md:border-0 md:px-0 md:pb-0 md:shadow-none`}
        >
          {menus.map((menu) => {
            const Icon = menu.icon;
            const active = activeView === menu.id;

            return (
              <button
                key={menu.id}
                type="button"
                onClick={() => {
                  onChange(menu.id);
                  setIsOpen(false);
                }}
                className={[
                  "flex shrink-0 items-center gap-2 border-b-2 px-4 py-3 text-left text-sm font-medium transition md:text-center",
                  active
                    ? "border-blue-400 text-blue-400"
                    : "border-transparent text-slate-500 hover:text-slate-200",
                ].join(" ")}
              >
                <Icon className="h-4 w-4" />

                {menu.label}
              </button>
            );
          })}
        </div>
      </div>
    </nav>
  );
}
