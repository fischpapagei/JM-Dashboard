import { ArrowLeft, ChevronDown, ClipboardPen, LogOut } from "lucide-react";
import { useState } from "react";
import { useAuth } from "../context/AuthContext";
import {
  WEBERFASSUNG_CATEGORIES,
  getWeberfassungCategoryForForm,
  getWeberfassungFormLabel,
  isWeberfassungFormView,
  type WeberfassungCategoryKey,
  type WeberfassungFormKey,
  type WeberfassungView,
} from "../data/weberfassungNav";
import { getJvaById } from "../data/jvas";
import { EmptyState } from "./EmptyState";

interface WeberfassungAppProps {
  onBackToLanding: () => void;
  onLogout: () => void;
}

const DEFAULT_EXPANDED: Record<WeberfassungCategoryKey, boolean> = {
  strukturdaten: true,
  haushalt: false,
};

export function WeberfassungApp({ onBackToLanding, onLogout }: WeberfassungAppProps) {
  const { user } = useAuth();
  const [view, setView] = useState<WeberfassungView>("overview");
  const [expandedCategories, setExpandedCategories] = useState(DEFAULT_EXPANDED);

  if (!user) return null;

  const jva = user.jvaId ? getJvaById(user.jvaId) : null;
  const isJvaRole = user.role === "jva";
  const activeCategory = isWeberfassungFormView(view) ? getWeberfassungCategoryForForm(view) : null;

  let title = "Web-Erfassung";
  let subtitle =
    isJvaRole && jva
      ? `${jva.name} — Meldungen für Berichtszeiträume erfassen und übermitteln`
      : "Übersicht und Unterstützung der JVA-Meldungen";

  if (view !== "overview") {
    const category = WEBERFASSUNG_CATEGORIES.find((c) => c.key === activeCategory);
    const formLabel = getWeberfassungFormLabel(view);
    title = `Erfassung · ${formLabel}`;
    subtitle = category
      ? `${category.label} — Formular wird vorbereitet`
      : "Formular wird vorbereitet";
  }

  const selectForm = (formKey: WeberfassungFormKey) => {
    const categoryKey = getWeberfassungCategoryForForm(formKey);
    setExpandedCategories((prev) => ({ ...prev, [categoryKey]: true }));
    setView(formKey);
  };

  const subItem = (label: string, active: boolean, onClick: () => void) => (
    <button
      type="button"
      onClick={onClick}
      className={`flex w-full rounded-lg py-2 pl-11 pr-3 text-left text-sm transition-colors ${
        active ? "bg-[#2d5a8e] text-white" : "text-white/75 hover:bg-white/10 hover:text-white"
      }`}
    >
      {label}
    </button>
  );

  return (
    <div className="flex min-h-screen">
      <aside className="flex w-60 shrink-0 flex-col bg-[#1a3352] p-4 text-white">
        <div className="mb-6 px-1">
          <p className="text-xs uppercase tracking-wide text-white/60">Justiz NRW</p>
          <p className="text-sm font-semibold leading-tight">Web-Erfassung</p>
          <p className="text-sm text-white/90">Bildung & Beschäftigung</p>
        </div>

        <button
          type="button"
          onClick={onBackToLanding}
          className="mb-4 flex w-full items-center gap-2 rounded-xl px-3 py-2 text-left text-sm text-white/85 transition hover:bg-white/10"
        >
          <ArrowLeft className="h-4 w-4 shrink-0" aria-hidden />
          Zur Startseite
        </button>

        <nav className="space-y-1">
          <button
            type="button"
            onClick={() => setView("overview")}
            className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm font-medium transition-colors ${
              view === "overview" ? "bg-[#2d5a8e] text-white" : "text-white/85 hover:bg-white/10"
            }`}
          >
            <ClipboardPen className="h-5 w-5 shrink-0" aria-hidden />
            Übersicht
          </button>

          {WEBERFASSUNG_CATEGORIES.map((category) => {
            const sectionActive = view !== "overview" && activeCategory === category.key;
            const expanded = expandedCategories[category.key];

            return (
              <div key={category.key}>
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() =>
                      setExpandedCategories((prev) => ({
                        ...prev,
                        [category.key]: !prev[category.key],
                      }))
                    }
                    className={`flex min-w-0 flex-1 items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm font-medium transition-colors ${
                      sectionActive ? "bg-[#2d5a8e] text-white" : "text-white/85 hover:bg-white/10"
                    }`}
                  >
                    <span className="truncate">{category.label}</span>
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      setExpandedCategories((prev) => ({
                        ...prev,
                        [category.key]: !prev[category.key],
                      }))
                    }
                    aria-expanded={expanded}
                    aria-label={`Untermenü ${category.label}`}
                    className={`rounded-lg p-2 transition-colors ${
                      sectionActive ? "text-white hover:bg-white/10" : "text-white/75 hover:bg-white/10"
                    }`}
                  >
                    <ChevronDown
                      className={`h-4 w-4 transition-transform ${expanded ? "rotate-180" : ""}`}
                      aria-hidden
                    />
                  </button>
                </div>
                {expanded && (
                  <div className="mt-1 space-y-0.5">
                    {category.items.map((item) =>
                      subItem(item.label, view === item.key, () => selectForm(item.key)),
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </nav>

        <div className="flex-1" />
        <p className="mb-4 px-1 text-xs leading-relaxed text-white/60">
          Web-Erfassung = Eingabe.
          <br />
          Auswertung im Kennzahlensystem.
        </p>
        <div className="border-t border-white/20 pt-3">
          <p className="truncate text-xs text-white/75">{user.displayName}</p>
          <button
            type="button"
            onClick={onLogout}
            className="mt-2 flex items-center gap-1 text-xs text-white/85 hover:text-white"
          >
            <LogOut className="h-3.5 w-3.5" aria-hidden />
            Abmelden
          </button>
        </div>
      </aside>

      <main className="flex-1 overflow-auto bg-[#eef1f6]">
        <div className="mx-auto max-w-[1200px] p-6">
          <header className="mb-6">
            <h1 className="text-xl font-semibold text-[#1a3352]">{title}</h1>
            <p className="mt-1 text-sm text-slate-600">{subtitle}</p>
          </header>

          {view === "overview" && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                <article className="rounded-xl border border-slate-200/80 bg-white p-4 shadow-sm">
                  <p className="text-xs uppercase text-slate-500">Aktueller Berichtszeitraum</p>
                  <p className="mt-1 text-lg font-semibold text-[#1a3352]">2026-Q1</p>
                </article>
                <article className="rounded-xl border border-slate-200/80 bg-white p-4 shadow-sm">
                  <p className="text-xs uppercase text-slate-500">Offene Formulare</p>
                  <p className="mt-1 text-lg font-semibold text-amber-700">8 Bereiche</p>
                </article>
                <article className="rounded-xl border border-slate-200/80 bg-white p-4 shadow-sm">
                  <p className="text-xs uppercase text-slate-500">Letzte Übermittlung</p>
                  <p className="mt-1 text-lg font-semibold text-[#1a3352]">—</p>
                </article>
              </div>

              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                {WEBERFASSUNG_CATEGORIES.map((category) => (
                  <section
                    key={category.key}
                    className="rounded-xl border border-slate-200/80 bg-white p-6 shadow-sm"
                  >
                    <h2 className="text-base font-semibold text-[#1a3352]">{category.label}</h2>
                    <ul className="mt-3 space-y-2 text-left">
                      {category.items.map((item) => (
                        <li key={item.key}>
                          <button
                            type="button"
                            onClick={() => selectForm(item.key)}
                            className="block w-full text-left text-sm text-[#2d5a8e] hover:underline"
                          >
                            {item.label}
                          </button>
                        </li>
                      ))}
                    </ul>
                  </section>
                ))}
              </div>
            </div>
          )}

          {isWeberfassungFormView(view) && (
            <EmptyState
              title={`Erfassungsformular · ${getWeberfassungFormLabel(view)}`}
              description="Dieses Formular wird für die Web-Erfassung durch die JVAen vorbereitet. Die fachlichen Felder orientieren sich an den jeweiligen Meldebögen."
            />
          )}
        </div>
      </main>
    </div>
  );
}
