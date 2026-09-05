const accents = {
  blue: {
    icon: "text-[#154B90]",
    iconBg: "bg-[#154B90]/10",
    border: "border-[#154B90]/20",
  },

  green: {
    icon: "text-[#2E9D3F]",
    iconBg: "bg-[#2E9D3F]/10",
    border: "border-[#2E9D3F]/20",
  },

  red: {
    icon: "text-red-600",
    iconBg: "bg-red-50",
    border: "border-red-100",
  },

  amber: {
    icon: "text-amber-600",
    iconBg: "bg-amber-50",
    border: "border-amber-100",
  },
};

export default function StatCard({
  title,
  label,
  value,
  subtitle,
  description,
  icon: Icon,
  accent = "blue",
}) {
  const theme = accents[accent] ?? accents.blue;
  const cardTitle = title ?? label;
  const cardSubtitle = subtitle ?? description;

  return (
    <div
      className={[
        "rounded-xl border bg-white p-4 shadow-sm transition",
        "hover:-translate-y-[1px] hover:shadow-md",
        theme.border,
      ].join(" ")}
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-medium text-slate-500">{cardTitle}</p>

          <p className="mt-1 text-2xl font-bold tracking-tight text-[#17324D]">
            {value}
          </p>

          {cardSubtitle && (
            <p className="mt-1 text-xs text-slate-400">{cardSubtitle}</p>
          )}
        </div>

        {Icon && (
          <div
            className={[
              "flex h-10 w-10 shrink-0 items-center justify-center rounded-lg",
              theme.iconBg,
            ].join(" ")}
          >
            <Icon className={`h-5 w-5 ${theme.icon}`} />
          </div>
        )}
      </div>
    </div>
  );
}
