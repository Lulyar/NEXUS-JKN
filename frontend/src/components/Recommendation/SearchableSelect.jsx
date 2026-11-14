import { useState, useEffect, useMemo, useRef, useCallback } from "react";
import { createPortal } from "react-dom";
import { Search, ChevronDown, Check, X } from "lucide-react";

export default function SearchableSelect({
  options = [],
  value = "",
  onChange,
  placeholder = "Pilih data",
  searchPlaceholder = "Cari...",
  disabled = false,
}) {
  const triggerRef = useRef(null);
  const dropdownRef = useRef(null);
  const searchInputRef = useRef(null);

  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [dropdownStyle, setDropdownStyle] = useState({});

  // Debounce pencarian 300ms
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search.trim().toLowerCase());
    }, 300);

    return () => clearTimeout(timer);
  }, [search]);

  // Filter seluruh pilihan
  const filteredOptions = useMemo(() => {
    if (!debouncedSearch) return options;

    return options.filter((option) => {
      const label = String(option.label ?? option.value ?? "").toLowerCase();

      const optionValue = String(option.value ?? "").toLowerCase();

      return (
        label.includes(debouncedSearch) || optionValue.includes(debouncedSearch)
      );
    });
  }, [options, debouncedSearch]);

  // Data terpilih
  const selectedOption = options.find((option) => option.value === value);

  // Menghitung posisi dropdown
  const updateDropdownPosition = useCallback(() => {
    if (!triggerRef.current) return;

    const rect = triggerRef.current.getBoundingClientRect();

    const viewportHeight = window.innerHeight;
    const viewportWidth = window.innerWidth;

    const spacing = 8;
    const preferredHeight = 320;

    const spaceBelow = viewportHeight - rect.bottom - spacing;
    const spaceAbove = rect.top - spacing;

    const showAbove = spaceBelow < 180 && spaceAbove > spaceBelow;

    const availableHeight = showAbove ? spaceAbove : spaceBelow;

    const maxHeight = Math.max(120, Math.min(preferredHeight, availableHeight));

    const width = Math.min(rect.width, viewportWidth - 24);

    const left = Math.max(12, Math.min(rect.left, viewportWidth - width - 12));

    setDropdownStyle({
      position: "fixed",
      left,
      width,
      zIndex: 9999,
      ...(showAbove
        ? {
            bottom: viewportHeight - rect.top + spacing,
            top: "auto",
          }
        : {
            top: rect.bottom + spacing,
            bottom: "auto",
          }),
      maxHeight,
    });
  }, []);

  // Update posisi saat dropdown dibuka
  useEffect(() => {
    if (!open) return;

    updateDropdownPosition();

    const handlePositionUpdate = () => {
      updateDropdownPosition();
    };

    window.addEventListener("resize", handlePositionUpdate);
    window.addEventListener("scroll", handlePositionUpdate, true);

    return () => {
      window.removeEventListener("resize", handlePositionUpdate);
      window.removeEventListener("scroll", handlePositionUpdate, true);
    };
  }, [open, updateDropdownPosition]);

  // Fokus otomatis ke pencarian
  useEffect(() => {
    if (!open) return;

    const timer = setTimeout(() => {
      searchInputRef.current?.focus();
    }, 50);

    return () => clearTimeout(timer);
  }, [open]);

  // Menutup dropdown jika klik di luar
  useEffect(() => {
    if (!open) return;

    const handleOutsideClick = (event) => {
      const clickedTrigger = triggerRef.current?.contains(event.target);

      const clickedDropdown = dropdownRef.current?.contains(event.target);

      if (!clickedTrigger && !clickedDropdown) {
        handleClose();
      }
    };

    document.addEventListener("mousedown", handleOutsideClick);

    return () => {
      document.removeEventListener("mousedown", handleOutsideClick);
    };
  }, [open]);

  // Tutup jika disabled
  useEffect(() => {
    if (disabled) {
      setOpen(false);
      setSearch("");
      setDebouncedSearch("");
    }
  }, [disabled]);

  // Tutup dropdown
  const handleClose = () => {
    setOpen(false);
    setSearch("");
    setDebouncedSearch("");
  };

  // Toggle dropdown
  const handleToggle = () => {
    if (disabled) return;

    if (open) {
      handleClose();
    } else {
      setOpen(true);
    }
  };

  // Pilih data
  const handleSelect = (option) => {
    onChange?.(option.value);
    handleClose();
  };

  // Keyboard
  const handleKeyDown = (event) => {
    if (event.key === "Escape") {
      event.stopPropagation();
      handleClose();
    }
  };

  return (
    <div className="relative w-full">
      {/* SELECT TRIGGER */}
      <button
        ref={triggerRef}
        type="button"
        disabled={disabled}
        aria-haspopup="listbox"
        aria-expanded={open}
        onClick={handleToggle}
        className={`
          flex h-11 w-full items-center justify-between gap-3
          rounded-lg border bg-white px-3.5
          text-left text-sm outline-none
          transition-all duration-200
          ${
            open
              ? "border-blue-500 ring-2 ring-blue-500/10"
              : "border-slate-200 hover:border-slate-300"
          }
          disabled:cursor-not-allowed
          disabled:bg-slate-50
          disabled:text-slate-400
        `}
      >
        <span
          className={`min-w-0 truncate ${
            selectedOption ? "text-slate-800" : "text-slate-400"
          }`}
        >
          {selectedOption?.label || placeholder}
        </span>

        <ChevronDown
          size={16}
          className={`
            shrink-0 text-slate-400
            transition-transform duration-200
            ${open ? "rotate-180" : ""}
          `}
        />
      </button>

      {/* DROPDOWN MENGGUNAKAN PORTAL */}
      {open &&
        createPortal(
          <div
            ref={dropdownRef}
            style={dropdownStyle}
            className="
              overflow-hidden
              rounded-lg border border-slate-200
              bg-white shadow-xl shadow-slate-900/15
            "
          >
            {/* SEARCH INPUT */}
            <div className="border-b border-slate-100 bg-white p-2.5">
              <div
                className="
                  flex h-10 items-center gap-2
                  rounded-md border border-slate-200
                  bg-white px-3
                  transition-all
                  focus-within:border-blue-500
                  focus-within:ring-2
                  focus-within:ring-blue-500/10
                "
              >
                <Search size={16} className="shrink-0 text-slate-400" />

                <input
                  ref={searchInputRef}
                  type="text"
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder={searchPlaceholder}
                  autoComplete="off"
                  className="
                    w-full min-w-0 bg-transparent
                    text-sm text-slate-800
                    outline-none
                    placeholder:text-slate-400
                  "
                />

                {search && (
                  <button
                    type="button"
                    aria-label="Hapus pencarian"
                    onClick={() => {
                      setSearch("");
                      setDebouncedSearch("");
                      searchInputRef.current?.focus();
                    }}
                    className="shrink-0 text-slate-400 hover:text-slate-700"
                  >
                    <X size={15} />
                  </button>
                )}
              </div>
            </div>

            {/* RESULT COUNT */}
            <div className="flex items-center justify-between px-3.5 py-2">
              <span className="text-[11px] font-medium text-slate-400">
                {debouncedSearch ? "Hasil pencarian" : "Semua pilihan"}
              </span>

              <span className="text-[11px] text-slate-400">
                {filteredOptions.length} data
              </span>
            </div>

            {/* OPTIONS LIST */}
            <div
              role="listbox"
              className="overflow-y-auto overscroll-contain p-1.5"
              style={{
                maxHeight: Math.max(
                  80,
                  dropdownStyle.maxHeight ? dropdownStyle.maxHeight - 105 : 215,
                ),
              }}
            >
              {filteredOptions.length > 0 ? (
                filteredOptions.map((option) => {
                  const isSelected = option.value === value;

                  return (
                    <button
                      key={option.value}
                      type="button"
                      role="option"
                      aria-selected={isSelected}
                      onClick={() => handleSelect(option)}
                      className={`
                        flex w-full items-center
                        justify-between gap-3
                        rounded-md px-3 py-2.5
                        text-left text-sm
                        transition-colors duration-150
                        ${
                          isSelected
                            ? "bg-blue-50 font-medium text-blue-700"
                            : "text-slate-700 hover:bg-slate-50"
                        }
                      `}
                    >
                      <span className="min-w-0 break-words">
                        {option.label ?? option.value}
                      </span>

                      {isSelected && (
                        <Check size={16} className="shrink-0 text-blue-600" />
                      )}
                    </button>
                  );
                })
              ) : (
                <div className="px-4 py-8 text-center">
                  <Search size={22} className="mx-auto text-slate-300" />

                  <p className="mt-2 text-sm font-medium text-slate-700">
                    Data tidak ditemukan
                  </p>

                  <p className="mt-1 text-xs text-slate-400">
                    Coba gunakan kata kunci lain.
                  </p>
                </div>
              )}
            </div>
          </div>,
          document.body,
        )}
    </div>
  );
}
