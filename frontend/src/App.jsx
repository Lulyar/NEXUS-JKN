import { useState } from "react";

import Header from "./components/layout/Header";
import Navbar from "./components/layout/Navbar";
import PageContainer from "./components/layout/PageContainer";

import MonitoringPage from "./pages/MonitoringPage";
import PriorityPage from "./pages/PriorityPage";
import FacilitiesPage from "./pages/FacilitiesPage";
import AnalyticsPage from "./pages/AnalyticsPage";

export default function App() {
  const [activeView, setActiveView] = useState("monitoring");

  /*
   * Faskes yang diklik dari map.
   *
   * Data ini disimpan di App supaya bisa
   * berpindah dari Monitoring → Faskes.
   */
  const [facilityFromMap, setFacilityFromMap] = useState(null);

  /*
   * Fungsi ketika marker faskes pada map diklik.
   */
  const handleFacilityFromMap = (facility) => {
    if (!facility) {
      return;
    }

    setFacilityFromMap(facility);

    /*
     * Pindah ke halaman Faskes.
     */
    setActiveView("facilities");
  };

  /*
   * Ketika user membuka menu Faskes secara manual,
   * jangan otomatis memilih faskes lama.
   */
  const handleNavigation = (view) => {
    setActiveView(view);

    if (view !== "facilities") {
      setFacilityFromMap(null);
    }
  };

  return (
    <div className="flex h-screen min-h-0 flex-col overflow-hidden bg-slate-950 text-slate-100">
      <Header />

      <Navbar activeView={activeView} onChange={handleNavigation} />

      <PageContainer>
        {activeView === "monitoring" && (
          <MonitoringPage onFacilityFromMap={handleFacilityFromMap} />
        )}

        {activeView === "priority" && <PriorityPage />}

        {activeView === "facilities" && (
          <FacilitiesPage
            facilityFromMap={facilityFromMap}
            onClearFacilityFromMap={() => setFacilityFromMap(null)}
          />
        )}

        {activeView === "analytics" && <AnalyticsPage />}
      </PageContainer>
    </div>
  );
}
