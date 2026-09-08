import { ChevronDown } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import type { JvaSchoolRoomSummary, SchoolRoom } from "../types/domain";
import { EmptyState } from "./EmptyState";
import { formatNumber } from "../utils/format";

interface SchoolRoomsDetailModalProps {
  open: boolean;
  title: string;
  summaries: JvaSchoolRoomSummary[];
  totalSchulraeume?: number | null;
  totalElisSchulraeume?: number | null;
  onClose: () => void;
}

interface JvaRoomTotals {
  roomCount: number;
  squareMeters: number;
  elisRoomCount: number;
  schoolSeats: number;
}

function jvaKey(jvaId: string) {
  return `jva:${jvaId}`;
}

function computeRoomTotals(rooms: SchoolRoom[]): JvaRoomTotals {
  return rooms.reduce(
    (totals, room) => ({
      roomCount: totals.roomCount + room.roomCount,
      squareMeters: totals.squareMeters + room.squareMeters * room.roomCount,
      elisRoomCount: totals.elisRoomCount + (room.isElis ? room.roomCount : 0),
      schoolSeats: totals.schoolSeats + room.schoolSeats,
    }),
    { roomCount: 0, squareMeters: 0, elisRoomCount: 0, schoolSeats: 0 },
  );
}

export function SchoolRoomsDetailModal({
  open,
  title,
  summaries,
  totalSchulraeume,
  totalElisSchulraeume,
  onClose,
}: SchoolRoomsDetailModalProps) {
  const [expanded, setExpanded] = useState<Set<string>>(new Set());

  const totals = useMemo(() => {
    const schulraeume = totalSchulraeume ?? summaries.reduce((sum, item) => sum + item.schulraeume, 0);
    const elisSchulraeume =
      totalElisSchulraeume ?? summaries.reduce((sum, item) => sum + item.elisSchulraeume, 0);
    return { schulraeume, elisSchulraeume };
  }, [summaries, totalSchulraeume, totalElisSchulraeume]);

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open, onClose]);

  useEffect(() => {
    if (!open) setExpanded(new Set());
  }, [open]);

  const toggle = (key: string) => {
    setExpanded((current) => {
      const next = new Set(current);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50">
      <div className="absolute inset-0 bg-slate-900/40" onClick={onClose} aria-hidden />

      <div className="relative mx-auto mt-16 w-full max-w-5xl rounded-xl border border-slate-200/80 bg-white shadow-xl">
        <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
          <div>
            <h3 className="text-base font-semibold text-[#1a3352]">{title}</h3>
            <p className="mt-1 text-xs text-slate-500">
              {formatNumber(totals.schulraeume)} Schulräume gesamt · davon {formatNumber(totals.elisSchulraeume)} eLis
              Schulräume — JVA aufklappen für Raumliste
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm text-slate-700 hover:bg-slate-50"
          >
            Schließen
          </button>
        </div>

        <div className="max-h-[70vh] overflow-auto px-5 py-4">
          {summaries.length === 0 ? (
            <EmptyState description="Noch keine Schulraumdaten geladen — Daten aus BASIS-Web" />
          ) : (
            <div className="space-y-2">
              {summaries.map((summary) => {
                const isOpen = expanded.has(jvaKey(summary.jvaId));
                const jvaTotals = computeRoomTotals(summary.rooms);

                return (
                  <section
                    key={summary.jvaId}
                    className="overflow-hidden rounded-lg border border-slate-200/80 bg-white shadow-sm"
                  >
                    <button
                      type="button"
                      onClick={() => toggle(jvaKey(summary.jvaId))}
                      aria-expanded={isOpen}
                      className="flex w-full items-center justify-between gap-3 py-3 pl-4 pr-4 text-left hover:bg-slate-50/80"
                    >
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-semibold text-slate-800">{summary.jvaName}</p>
                        <p className="mt-0.5 text-xs text-slate-500">
                          {formatNumber(summary.schulraeume)} Schulräume · davon{" "}
                          {formatNumber(summary.elisSchulraeume)} eLis
                        </p>
                      </div>
                      <div className="flex shrink-0 items-center gap-2">
                        <span className="text-sm font-semibold text-[#1a3352]">
                          {formatNumber(summary.schulraeume)} Räume
                        </span>
                        <ChevronDown
                          className={`h-4 w-4 text-slate-500 transition-transform ${isOpen ? "rotate-180" : ""}`}
                          aria-hidden
                        />
                      </div>
                    </button>

                    {isOpen && (
                      <div className="overflow-x-auto border-t border-slate-100 bg-slate-50/50 px-4 py-3">
                        <table className="min-w-full text-sm">
                          <thead>
                            <tr className="border-b border-slate-200 text-left text-xs text-slate-500">
                              <th className="py-2 pr-3 font-medium">JVA</th>
                              <th className="py-2 pr-3 font-medium">Raumbezeichnung</th>
                              <th className="py-2 pr-3 text-right font-medium">Anzahl Räume</th>
                              <th className="py-2 pr-3 text-right font-medium">Größe in qm</th>
                              <th className="py-2 pr-3 text-center font-medium">eLis?</th>
                              <th className="py-2 text-right font-medium">Anzahl Schulplätze für Gefangene</th>
                            </tr>
                          </thead>
                          <tbody>
                            {summary.rooms.map((room) => (
                              <tr key={room.id} className="border-b border-slate-100">
                                <td className="py-2 pr-3 text-slate-700">{summary.jvaName}</td>
                                <td className="py-2 pr-3 font-medium text-slate-800">{room.designation}</td>
                                <td className="py-2 pr-3 text-right text-slate-700">{formatNumber(room.roomCount)}</td>
                                <td className="py-2 pr-3 text-right text-slate-700">
                                  {formatNumber(room.squareMeters)}
                                </td>
                                <td className="py-2 pr-3 text-center text-slate-700">
                                  {room.isElis ? "Ja" : "Nein"}
                                </td>
                                <td className="py-2 text-right text-slate-700">{formatNumber(room.schoolSeats)}</td>
                              </tr>
                            ))}
                            <tr className="border-t-2 border-slate-300 bg-slate-100/80 font-semibold text-[#1a3352]">
                              <td className="py-2.5 pr-3" colSpan={2}>
                                Summe {summary.jvaName}
                              </td>
                              <td className="py-2.5 pr-3 text-right">{formatNumber(jvaTotals.roomCount)}</td>
                              <td className="py-2.5 pr-3 text-right">{formatNumber(jvaTotals.squareMeters)}</td>
                              <td className="py-2.5 pr-3 text-center">{formatNumber(jvaTotals.elisRoomCount)}</td>
                              <td className="py-2.5 text-right">{formatNumber(jvaTotals.schoolSeats)}</td>
                            </tr>
                          </tbody>
                        </table>
                      </div>
                    )}
                  </section>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
