import { useState } from "react";

export default function useDateFilter({ onApply, onReset } = {}) {
  /* =========================================================
     STATE
     ========================================================= */

  const [startDate, setStartDate] = useState("");

  const [endDate, setEndDate] = useState("");

  const [isFiltered, setIsFiltered] = useState(false);

  /* =========================================================
     APPLY FILTER
     ========================================================= */

  const applyFilter = () => {
    /*
     * Jika tanggal belum lengkap,
     * jangan aktifkan filter.
     */

    if (!startDate || !endDate) {
      setIsFiltered(false);

      return;
    }

    setIsFiltered(true);

    /*
     * Kirim tanggal ke parent jika callback tersedia.
     */

    if (typeof onApply === "function") {
      onApply({
        startDate,
        endDate,
      });
    }
  };

  /* =========================================================
     RESET FILTER
     ========================================================= */

  const resetFilter = () => {
    setStartDate("");
    setEndDate("");

    setIsFiltered(false);

    if (typeof onReset === "function") {
      onReset();
    }
  };

  /* =========================================================
     RETURN
     ========================================================= */

  return {
    startDate,
    endDate,

    setStartDate,
    setEndDate,

    applyFilter,
    resetFilter,

    isFiltered,
  };
}
