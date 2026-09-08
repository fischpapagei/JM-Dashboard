import { BarChart3, ClipboardPen, FileText, LogOut } from "lucide-react";
import type { AuthUser } from "../types/auth";
import type { AppModule } from "../types/app";

interface LandingPageProps {
  user: AuthUser;
  onSelectModule: (module: Exclude<AppModule, "landing">) => void;
  onLogout: () => void;
}

export function LandingPage({ user, onSelectModule, onLogout }: LandingPageProps) {
  const isJvaRole = user.role === "jva";

  return (
    <div className="min-h-screen bg-[#eef1f6]">
      <header className="border-b border-slate-200/80 bg-white">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-4">
          <div>
            <p className="text-xs uppercase tracking-wide text-slate-500">Justiz NRW</p>
            <h1 className="text-lg font-semibold text-[#1a3352]">Bildung & Beschäftigung</h1>
          </div>
          <div className="flex items-center gap-4">
            <p className="hidden text-sm text-slate-600 sm:block">{user.displayName}</p>
            <button
              type="button"
              onClick={onLogout}
              className="flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-1.5 text-sm text-slate-600 hover:bg-slate-50"
            >
              <LogOut className="h-4 w-4" aria-hidden />
              Abmelden
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-6 py-12">
        <div className="mb-10 text-center">
          <h2 className="text-2xl font-semibold text-[#1a3352]">Willkommen</h2>
          <p className="mt-2 text-slate-600">
            Wählen Sie Kennzahlen, Berichte oder die Web-Erfassung für Ihre JVA.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
          <button
            type="button"
            onClick={() => onSelectModule("kennzahlen")}
            className="group rounded-2xl border border-slate-200/80 bg-white p-8 text-left shadow-sm transition hover:border-[#2d5a8e]/40 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-[#2d5a8e]/30"
          >
            <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-xl bg-[#2d5a8e]/10 text-[#2d5a8e] transition group-hover:bg-[#2d5a8e]/15">
              <BarChart3 className="h-6 w-6" aria-hidden />
            </div>
            <h3 className="text-xl font-semibold text-[#1a3352]">Kennzahlensystem</h3>
            <p className="mt-2 text-sm leading-relaxed text-slate-600">
              Landes- und anstaltsbezogene Auswertungen, Dashboards und Vergleiche — Daten aus BASIS-Web.
            </p>
            <p className="mt-4 text-sm font-medium text-[#2d5a8e]">Zum Dashboard →</p>
          </button>

          <button
            type="button"
            onClick={() => onSelectModule("berichte")}
            className="group rounded-2xl border border-slate-200/80 bg-white p-8 text-left shadow-sm transition hover:border-[#2d5a8e]/40 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-[#2d5a8e]/30"
          >
            <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-xl bg-[#2d5a8e]/10 text-[#2d5a8e] transition group-hover:bg-[#2d5a8e]/15">
              <FileText className="h-6 w-6" aria-hidden />
            </div>
            <h3 className="text-xl font-semibold text-[#1a3352]">Berichte</h3>
            <p className="mt-2 text-sm leading-relaxed text-slate-600">
              Berichte konfigurieren und als PDF erzeugen — Kurzberichte und weitere Auswertungen
              nach Zeitraum und Anstalt.
            </p>
            <p className="mt-4 text-sm font-medium text-[#2d5a8e]">Zu den Berichten →</p>
          </button>

          <button
            type="button"
            onClick={() => onSelectModule("weberfassung")}
            className="group relative rounded-2xl border border-slate-200/80 bg-white p-8 text-left shadow-sm transition hover:border-[#2d5a8e]/40 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-[#2d5a8e]/30"
          >
            {isJvaRole && (
              <span className="absolute right-4 top-4 rounded-full bg-[#2d5a8e]/10 px-2.5 py-0.5 text-xs font-medium text-[#2d5a8e]">
                Ihre Anstalt
              </span>
            )}
            <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-xl bg-[#2d5a8e]/10 text-[#2d5a8e] transition group-hover:bg-[#2d5a8e]/15">
              <ClipboardPen className="h-6 w-6" aria-hidden />
            </div>
            <h3 className="text-xl font-semibold text-[#1a3352]">Web-Erfassung</h3>
            <p className="mt-2 text-sm leading-relaxed text-slate-600">
              Erfassung und Pflege von Kennzahlen durch die JVAen — Meldungen für Berichtszeiträume vorbereiten
              und übermitteln.
            </p>
            <p className="mt-4 text-sm font-medium text-[#2d5a8e]">Zur Erfassung →</p>
          </button>
        </div>

        <p className="mt-10 text-center text-xs text-slate-400">
          Mock-up v2 · Kennzahlensystem = Auswertung · Berichte = PDF-Konfiguration · Web-Erfassung = Dateneingabe
        </p>
      </main>
    </div>
  );
}
