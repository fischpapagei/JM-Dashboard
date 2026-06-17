import { Building2, Map } from "lucide-react";
import type { DashboardAreaKey } from "../types/domain";
import { getDashboardArea } from "../data/dashboardAreas";

interface DashboardAreaHubProps {
  areaKey: DashboardAreaKey;
  onSelectNrw: () => void;
  onSelectJva: () => void;
}

export function DashboardAreaHub({ areaKey, onSelectNrw, onSelectJva }: DashboardAreaHubProps) {
  const area = getDashboardArea(areaKey);

  return (
    <section className="rounded-xl border border-slate-200/80 bg-white p-6 shadow-sm">
      <h2 className="text-lg font-semibold text-[#1a3352]">{area.sidebarLabel}</h2>
      <p className="mt-1 text-sm text-slate-600">
        Wählen Sie die gewünschte Auswertungsebene für {area.sidebarLabel.toLowerCase()}.
      </p>

      <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-2">
        <button
          type="button"
          onClick={onSelectNrw}
          className="group rounded-xl border border-slate-200/80 bg-slate-50/50 p-5 text-left shadow-sm transition hover:border-[#2d5a8e]/40 hover:bg-white hover:shadow-md focus:outline-none focus:ring-2 focus:ring-[#2d5a8e]/30"
        >
          <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-lg bg-[#2d5a8e]/10 text-[#2d5a8e]">
            <Map className="h-5 w-5" aria-hidden />
          </div>
          <h3 className="text-base font-semibold text-[#1a3352]">NRW gesamt</h3>
          <p className="mt-1 text-sm text-slate-600">
            Landesweites Dashboard mit Kennzahlen, Verläufen und Übersichten für alle JVAen.
          </p>
        </button>

        <button
          type="button"
          onClick={onSelectJva}
          className="group rounded-xl border border-slate-200/80 bg-slate-50/50 p-5 text-left shadow-sm transition hover:border-[#2d5a8e]/40 hover:bg-white hover:shadow-md focus:outline-none focus:ring-2 focus:ring-[#2d5a8e]/30"
        >
          <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-lg bg-[#2d5a8e]/10 text-[#2d5a8e]">
            <Building2 className="h-5 w-5" aria-hidden />
          </div>
          <h3 className="text-base font-semibold text-[#1a3352]">JVA-Stammdatenblatt</h3>
          <p className="mt-1 text-sm text-slate-600">
            Anstaltsbezogene Kennzahlen und Detailauswertungen je JVA mit NRW-Vergleich.
          </p>
        </button>
      </div>
    </section>
  );
}
