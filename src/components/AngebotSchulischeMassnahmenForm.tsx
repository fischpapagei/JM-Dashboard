import { useMemo, useState } from 'react';
import { COURSE_CATEGORIES } from '../data/catalog';
import { demoRecords } from '../data/demoData';
import { getJvaById, JVAS } from '../data/jvas';
import {
  AB_ABSCHLUSS_OPTIONS,
  ANGEBOT_BASIS_DEADLINE_LABEL,
  ANGEBOT_BROCHURE_PERIOD_LABEL,
  ANGEBOT_BROCHURE_YEAR,
  ANGEBOT_FORM_YEAR,
  ANGEBOT_HINWEISE,
  ANGEBOT_VORJAHR,
  BEGINN_ART_OPTIONS,
  DURCHFUEHRUNG_OPTIONS,
  SF_VM_ABSCHLUSS_OPTIONS,
  abschlussGruppe,
  applyCourseType,
  applyDatenKorrekt,
  applyExterneSchule,
  buildAngebotFormRows,
  canEditGreen,
  courseTypesForCategory,
  createEmptyAngebotRow,
  formatBeginn,
  formatDurchfuehrung,
  formatJaNein,
  formatZielgruppe,
  getBildungsbroschuereRelease,
  isAngebotDeadlinePassed,
  isStudium,
  listSubmittedAngebotJvaIds,
  normalizeAngebotRow,
  overlayStoredKursangebote,
  releaseBildungsbroschuere,
  saveSubmittedAngebot,
  showsGreenQuestions,
  showsMehrjaehrigeVerteilung,
  validateAngebotForm,
  type AngebotFormRow,
  type BeginnArt,
  type Durchfuehrungskraft,
  type JaNein,
  type JaNeinValue,
} from '../utils/angebotSchulischeMassnahmenForm';
import { buildKursangeboteSections } from '../utils/kursangebote';
import { formatDate } from '../utils/format';
import { KursangeboteOfferTable } from './KursangeboteTables';
import {
  KernAlert,
  KernBadge,
  KernButton,
  KernCard,
  KernHeading,
  KernList,
  KernSelect,
  KernSpace,
  KernText,
} from '../ui/kern';

interface AngebotSchulischeMassnahmenFormProps {
  userJvaId: string | null;
  isJvaRole: boolean;
  onBack: () => void;
}

const INPUT_CLASS =
  'w-full min-w-[6rem] rounded border border-slate-300 bg-white px-2 py-1.5 text-sm text-(--color-ink) disabled:bg-slate-100 disabled:text-slate-600';
const CELL = 'border border-nachtblau-30 px-2 py-2 align-top';
const HEADER =
  'border border-nachtblau-50 bg-nachtblau px-2 py-2 text-left text-[11px] font-semibold uppercase tracking-wide text-white';
const HEADER_GREEN =
  'border border-landesgruen bg-landesgruen px-2 py-2 text-left text-[11px] font-semibold uppercase tracking-wide text-white';
const HEADER_RED =
  'border border-landesrot bg-landesrot px-2 py-2 text-left text-[11px] font-semibold uppercase tracking-wide text-white';
const GREEN_CELL = `${CELL} bg-[#e8f6ec]`;
const RED_CELL = `${CELL} bg-[#fde8ea]`;

type FormStep = 'erfassung' | 'bestaetigung' | 'abgeschlossen';

export function AngebotSchulischeMassnahmenForm({
  userJvaId,
  isJvaRole,
  onBack,
}: AngebotSchulischeMassnahmenFormProps) {
  if (!isJvaRole) {
    return <BildungsbroschuerePruefung onBack={onBack} />;
  }
  return <AngebotJvaForm userJvaId={userJvaId} onBack={onBack} />;
}

function AngebotJvaForm({ userJvaId, onBack }: { userJvaId: string | null; onBack: () => void }) {
  const jvaOptions = useMemo(
    () => [...JVAS].sort((a, b) => a.name.localeCompare(b.name, 'de')),
    [],
  );
  const [jvaId, setJvaId] = useState(userJvaId ?? jvaOptions[0]?.id ?? '');
  const [step, setStep] = useState<FormStep>('erfassung');
  const [rows, setRows] = useState<AngebotFormRow[]>(() =>
    jvaId ? buildAngebotFormRows(jvaId) : [createEmptyAngebotRow('')],
  );
  const [error, setError] = useState<string | null>(null);
  const deadlinePassed = isAngebotDeadlinePassed();
  const jvaName = getJvaById(jvaId)?.name ?? jvaId;

  const selectJva = (nextId: string) => {
    setJvaId(nextId);
    setRows(nextId ? buildAngebotFormRows(nextId) : [createEmptyAngebotRow('')]);
    setStep('erfassung');
    setError(null);
  };

  const handleWeiter = () => {
    const normalized = rows.map(normalizeAngebotRow);
    const result = validateAngebotForm(normalized);
    if (!result.ok) {
      setError(result.messages.join(' '));
      return;
    }
    setError(null);
    setRows(normalized);
    setStep('bestaetigung');
  };

  const handleConfirmYes = () => {
    const normalized = rows.map(normalizeAngebotRow);
    saveSubmittedAngebot(jvaId, normalized);
    setRows(normalized);
    setStep('abgeschlossen');
  };

  if (step === 'abgeschlossen') {
    return (
      <>
        <KernHeading level={1}>Formular Angebot schulische Maßnahmen</KernHeading>
        <KernText muted>{jvaName}</KernText>
        <KernSpace size="default" />
        <KernAlert title="Angaben gespeichert" variant="success">
          Die Prüfung der schulischen Angebote für {jvaName} ist gespeichert. ZBI und Fachbereich
          Pädagogik können die kommende Bildungsbroschüre {ANGEBOT_BROCHURE_YEAR} als Vorschau
          einsehen, bevor sie als jährlicher Bericht erscheint.
        </KernAlert>
        <KernSpace size="large" />
        <KernButton type="button" variant="secondary" label="Zurück zur Übersicht" onClick={onBack} />
      </>
    );
  }

  if (step === 'bestaetigung') {
    return (
      <>
        <KernHeading level={1}>Prüfung der Angaben</KernHeading>
        <KernText>
          Bitte prüfen Sie alle Daten einschließlich geänderter und neuer Angebote. Stimmen die
          Angaben, geht es weiter. Andernfalls kehren Sie zur Bearbeitung zurück.
        </KernText>
        <KernSpace size="small" />
        <KernBadge label={jvaName} variant="info" />
        <KernSpace size="default" />
        <AngebotReviewTable rows={rows} />
        <KernSpace size="large" />
        <KernCard title="Sind die Daten so korrekt?" subline="Nächster Schritt">
          <div className="flex flex-wrap gap-3">
            <KernButton
              type="button"
              variant="secondary"
              label="Nein, Angaben korrigieren"
              onClick={() => setStep('erfassung')}
            />
            <KernButton type="button" variant="primary" label="Ja, weiter" onClick={handleConfirmYes} />
          </div>
        </KernCard>
      </>
    );
  }

  return (
    <>
      <KernHeading level={1}>Formular Angebot schulische Maßnahmen</KernHeading>
      <KernText muted>
        Strukturdaten · Schulische Bildung · Vorjahresdaten {ANGEBOT_VORJAHR} · Erfassung {ANGEBOT_FORM_YEAR}
      </KernText>
      <KernSpace size="default" />
      <KernText>
        Einmal im Jahr prüfen die Anstalten die Daten des schulischen Angebots. Die Prüfung ist
        Grundlage der Bildungsbroschüre und später der EVALiS-Strukturdaten. Solange keine
        automatische Weitergabe an SoPart möglich ist, werden die grünen Felder hier erfasst. Die
        roten Felder kommen automatisch aus BASIS.
      </KernText>
      <KernSpace size="default" />
      {deadlinePassed ? (
        <KernAlert title="Erfassungsfrist abgelaufen" variant="warning">
          Ab dem {ANGEBOT_BASIS_DEADLINE_LABEL} können die Angaben hier nicht mehr für die kommende
          Bildungsbroschüre geändert werden. Änderungen in BASIS (z. B. Soll-Plätze) fließen weiter
          in den jährlichen Bericht und EVALiS ein.
        </KernAlert>
      ) : (
        <KernAlert title="Frist der Bildungsbroschüre" variant="info">
          Änderungen für die Broschüre {ANGEBOT_BROCHURE_YEAR} ({ANGEBOT_BROCHURE_PERIOD_LABEL}) sind
          bis zum {ANGEBOT_BASIS_DEADLINE_LABEL} möglich.
        </KernAlert>
      )}
      <KernSpace size="default" />
      <KernCard title="Hinweise zur ersten Abfrage" subline="Sind die Daten noch korrekt?">
        <KernList
          items={ANGEBOT_HINWEISE.map((content, index) => ({
            content: `${index + 1}. ${content}`,
          }))}
        />
      </KernCard>
      <KernSpace size="default" />
      {!userJvaId ? (
        <>
          <KernSelect id="angebot-jva" label="Anstalt" value={jvaId} onChange={(event) => selectJva(event.target.value)}>
            {jvaOptions.map((jva) => (
              <option key={jva.id} value={jva.id}>
                {jva.name}
              </option>
            ))}
          </KernSelect>
          <KernSpace size="default" />
        </>
      ) : (
        <KernBadge label={jvaName} variant="info" />
      )}
      <KernSpace size="default" />
      {error ? (
        <>
          <KernAlert title="Angaben unvollständig" variant="danger">
            {error}
          </KernAlert>
          <KernSpace size="default" />
        </>
      ) : null}
      <KernCard
        title="Schulische Angebote"
        subline="Rot = BASIS (nicht hier änderbar). Grün = Web-Erfassung, vorausgefüllt aus dem Vorjahr."
      >
        <p className="mb-3 text-sm text-slate-600">
          Bei „Nein“ bei der Korrektur werden die grünen Felder bearbeitbar. Bei „Ja“ bleiben sie
          gesperrt. Für die Hauptkategorie Studium und bei Maßnahmen an einer externen Schule
          entfallen die weiteren grünen Fragen.
        </p>
        <AngebotCaptureTable
          rows={rows}
          disabled={deadlinePassed}
          onChange={(id, updater) =>
            setRows((current) => current.map((row) => (row.id === id ? updater(row) : row)))
          }
          onRemove={(id) =>
            setRows((current) => {
              const next = current.filter((row) => row.id !== id);
              return next.length === 0 ? [createEmptyAngebotRow(jvaId)] : next;
            })
          }
        />
        <KernSpace size="default" />
        <KernButton
          type="button"
          variant="secondary"
          label="Neues Angebot einfügen"
          disabled={deadlinePassed}
          onClick={() => setRows((current) => [...current, createEmptyAngebotRow(jvaId)])}
        />
      </KernCard>
      <KernSpace size="large" />
      <div className="flex flex-wrap gap-3">
        <KernButton type="button" variant="tertiary" label="Zurück zur Übersicht" onClick={onBack} />
        <KernButton type="button" variant="primary" label="Weiter" onClick={handleWeiter} disabled={deadlinePassed} />
      </div>
    </>
  );
}

function BildungsbroschuerePruefung({ onBack }: { onBack: () => void }) {
  const [jvaId, setJvaId] = useState('alle');
  const [released, setReleased] = useState(getBildungsbroschuereRelease);
  const submitted = listSubmittedAngebotJvaIds();
  const sections = useMemo(() => {
    const base = buildKursangeboteSections(demoRecords, String(ANGEBOT_FORM_YEAR));
    const overlay = overlayStoredKursangebote(base, {
      jvaId: jvaId === 'alle' ? undefined : jvaId,
    });
    return overlay;
  }, [jvaId, released, submitted.length]);

  return (
    <>
      <KernHeading level={1}>Vorschau Bildungsbroschüre</KernHeading>
      <KernText muted>Strukturdaten · Schulische Bildung · ZBI / Fachbereich Pädagogik</KernText>
      <KernSpace size="default" />
      <KernAlert title="Prüfung vor dem jährlichen Bericht" variant="info">
        ZBI und Fachbereich Pädagogik können die Bildungsbroschüre {ANGEBOT_BROCHURE_YEAR} hier
        prüfen, bevor sie als Bericht 7 im Berichtswesen erscheint. Grundlage sind die aktuellen
        BASIS-Daten und die von den Anstalten gespeicherten Web-Erfassungen.
      </KernAlert>
      <KernSpace size="default" />
      {released ? (
        <KernAlert title="Freigegeben" variant="success">
          Die Bildungsbroschüre {released.year} wurde am {formatDate(released.at.slice(0, 10))} als
          jährlicher Bericht freigegeben.
        </KernAlert>
      ) : (
        <KernAlert title="Noch nicht veröffentlicht" variant="warning">
          Diese Ansicht ist eine Vorschau. Bericht 7 zeigt die neue Broschüre erst nach der
          Freigabe.
        </KernAlert>
      )}
      <KernSpace size="default" />
      <KernText>
        Gespeicherte Anstaltsformulare: {submitted.length} von {JVAS.length}.
      </KernText>
      <KernSpace size="default" />
      <KernSelect id="broschuere-jva" label="Anstalt in der Vorschau" value={jvaId} onChange={(event) => setJvaId(event.target.value)}>
        <option value="alle">Alle Anstalten</option>
        {JVAS.slice()
          .sort((a, b) => a.name.localeCompare(b.name, 'de'))
          .map((jva) => (
            <option key={jva.id} value={jva.id}>
              {jva.name}
              {submitted.includes(jva.id) ? ' (erfasst)' : ''}
            </option>
          ))}
      </KernSelect>
      <KernSpace size="large" />
      {sections.length === 0 ? (
        <KernAlert title="Keine Angebote" variant="info">
          Für die Auswahl liegen keine schulischen Angebote vor.
        </KernAlert>
      ) : (
        <div className="space-y-6">
          {sections.map((section) => (
            <div key={section.jvaId} className="space-y-4">
              <h2 className="text-lg font-semibold text-(--color-ink)">{section.jvaName}</h2>
              {section.tables.map((table) => (
                <KursangeboteOfferTable key={table.key} table={table} showExternalColumn />
              ))}
            </div>
          ))}
        </div>
      )}
      <KernSpace size="large" />
      <div className="flex flex-wrap gap-3">
        <KernButton type="button" variant="tertiary" label="Zurück zur Übersicht" onClick={onBack} />
        <KernButton
          type="button"
          variant="primary"
          label="Als jährlichen Bericht freigeben"
          disabled={Boolean(released)}
          onClick={() => setReleased(releaseBildungsbroschuere())}
        />
      </div>
    </>
  );
}

function AngebotCaptureTable({
  rows,
  disabled,
  onChange,
  onRemove,
}: {
  rows: AngebotFormRow[];
  disabled: boolean;
  onChange: (id: string, updater: (row: AngebotFormRow) => AngebotFormRow) => void;
  onRemove: (id: string) => void;
}) {
  return (
    <div className="w-full overflow-x-auto">
      <table className="w-max min-w-full border-collapse text-left">
        <thead>
          <tr>
            <th className={HEADER_RED}>Schulkurs Name</th>
            <th className={HEADER_RED}>Hauptkategorie</th>
            <th className={HEADER_RED}>Maßnahmenkategorie</th>
            <th className={HEADER_RED}>Soll-Plätze</th>
            <th className={HEADER_RED}>Gab es Teilnehmende im Vorjahr?</th>
            <th className={HEADER_GREEN}>Externe Schule?</th>
            <th className={HEADER_GREEN}>An wen richtet sich die Maßnahme?</th>
            <th className={HEADER_GREEN}>Dauer (Monate)</th>
            <th className={HEADER_GREEN}>Soll-Plätze 1./2./3. Jahr</th>
            <th className={HEADER_GREEN}>Durchführungskraft</th>
            <th className={HEADER_GREEN}>In nächster Bildungsbroschüre?</th>
            <th className={HEADER_GREEN}>Einstieg fortlaufend?</th>
            <th className={HEADER_GREEN}>Geplanter Abschluss</th>
            <th className={HEADER}>Anmerkungen</th>
            <th className={HEADER}>Sind die Daten noch korrekt?</th>
            <th className={HEADER}>Zeile</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row, index) => (
            <AngebotCaptureRow
              key={row.id}
              row={row}
              index={index}
              disabled={disabled}
              onChange={onChange}
              onRemove={onRemove}
            />
          ))}
        </tbody>
      </table>
    </div>
  );
}

function AngebotCaptureRow({
  row,
  index,
  disabled,
  onChange,
  onRemove,
}: {
  row: AngebotFormRow;
  index: number;
  disabled: boolean;
  onChange: (id: string, updater: (row: AngebotFormRow) => AngebotFormRow) => void;
  onRemove: (id: string) => void;
}) {
  const green = canEditGreen(row) && !disabled;
  const showGreen = showsGreenQuestions(row);
  const extraGreen = green && showGreen;
  const gruppe = abschlussGruppe(row.categoryKey, row.typeKey);
  const types = courseTypesForCategory(row.categoryKey);

  return (
    <tr className="bg-white">
      <td className={RED_CELL}>
        {row.isNew ? (
          <input
            className={INPUT_CLASS}
            aria-label={`Schulkurs Name Zeile ${index + 1}`}
            value={row.courseName}
            disabled={!green}
            onChange={(event) => onChange(row.id, (current) => ({ ...current, courseName: event.target.value }))}
          />
        ) : (
          <span className="text-sm font-medium text-landesrot">{row.courseName}</span>
        )}
      </td>
      <td className={RED_CELL}>
        {row.isNew ? (
          <select
            className={INPUT_CLASS}
            aria-label={`Hauptkategorie Zeile ${index + 1}`}
            value={row.categoryKey}
            disabled={!green}
            onChange={(event) => {
              const category = COURSE_CATEGORIES.find((item) => item.key === event.target.value);
              const firstType = courseTypesForCategory(event.target.value)[0];
              onChange(row.id, (current) =>
                applyCourseType(
                  {
                    ...current,
                    categoryKey: event.target.value,
                    categoryLabel: category?.label ?? '',
                  },
                  firstType?.key ?? '',
                ),
              );
            }}
          >
            <option value="">Bitte wählen</option>
            {COURSE_CATEGORIES.map((category) => (
              <option key={category.key} value={category.key}>
                {category.label}
              </option>
            ))}
          </select>
        ) : (
          <span className="text-sm text-landesrot">{row.categoryLabel}</span>
        )}
      </td>
      <td className={RED_CELL}>
        {row.isNew ? (
          <select
            className={INPUT_CLASS}
            aria-label={`Maßnahmenkategorie Zeile ${index + 1}`}
            value={row.typeKey}
            disabled={!green || !row.categoryKey}
            onChange={(event) => onChange(row.id, (current) => applyCourseType(current, event.target.value))}
          >
            <option value="">Bitte wählen</option>
            {types.map((item) => (
              <option key={item.key} value={item.key}>
                {item.label}
              </option>
            ))}
          </select>
        ) : (
          <span className="text-sm text-landesrot">{row.typeLabel}</span>
        )}
      </td>
      <td className={`${RED_CELL} text-right tabular-nums text-landesrot`}>{row.targetPlaces || '—'}</td>
      <td className={`${RED_CELL} text-landesrot`}>{formatJaNein(row.teilnehmendeVorjahr)}</td>
      <td className={GREEN_CELL}>
        {isStudium(row.categoryKey) ? (
          <span className="text-sm text-slate-500">entfällt (Studium)</span>
        ) : (
          <JaNeinRadios
            name={`${row.id}-extern`}
            value={row.externeSchule}
            disabled={!green}
            ariaLabel={`Externe Schule Zeile ${index + 1}`}
            onChange={(value) => onChange(row.id, (current) => applyExterneSchule(current, value))}
          />
        )}
      </td>
      <td className={GREEN_CELL}>
        {showGreen ? (
          <div className="flex min-w-[11rem] flex-col gap-1 text-sm">
            <label className="inline-flex items-center gap-1.5">
              <input
                type="checkbox"
                checked={row.zielgruppe.jugendvollzug}
                disabled={!extraGreen || row.zielgruppeAgeLocked}
                onChange={(event) =>
                  onChange(row.id, (current) => ({
                    ...current,
                    zielgruppe: { ...current.zielgruppe, jugendvollzug: event.target.checked },
                  }))
                }
              />
              Jugendvollzug
            </label>
            <label className="inline-flex items-center gap-1.5">
              <input
                type="checkbox"
                checked={row.zielgruppe.erwachsenenvollzug}
                disabled={!extraGreen || row.zielgruppeAgeLocked}
                onChange={(event) =>
                  onChange(row.id, (current) => ({
                    ...current,
                    zielgruppe: { ...current.zielgruppe, erwachsenenvollzug: event.target.checked },
                  }))
                }
              />
              Erwachsenenvollzug
            </label>
            <label className="inline-flex items-center gap-1.5">
              <input
                type="checkbox"
                checked={row.zielgruppe.frauen}
                disabled={!extraGreen || row.zielgruppeGenderLocked}
                onChange={(event) =>
                  onChange(row.id, (current) => ({
                    ...current,
                    zielgruppe: { ...current.zielgruppe, frauen: event.target.checked },
                  }))
                }
              />
              Frauen
            </label>
            <label className="inline-flex items-center gap-1.5">
              <input
                type="checkbox"
                checked={row.zielgruppe.maenner}
                disabled={!extraGreen || row.zielgruppeGenderLocked}
                onChange={(event) =>
                  onChange(row.id, (current) => ({
                    ...current,
                    zielgruppe: { ...current.zielgruppe, maenner: event.target.checked },
                  }))
                }
              />
              Männer
            </label>
          </div>
        ) : (
          <span className="text-sm text-slate-500">—</span>
        )}
      </td>
      <td className={GREEN_CELL}>
        {showGreen ? (
          <input
            className={`${INPUT_CLASS} w-20 text-right`}
            inputMode="numeric"
            aria-label={`Dauer Monate Zeile ${index + 1}`}
            value={row.durationMonths}
            disabled={!extraGreen || row.durationLocked}
            onChange={(event) =>
              onChange(row.id, (current) => ({ ...current, durationMonths: event.target.value }))
            }
          />
        ) : (
          <span className="text-sm text-slate-500">—</span>
        )}
      </td>
      <td className={GREEN_CELL}>
        {showGreen && showsMehrjaehrigeVerteilung(row.durationMonths) ? (
          <div className="flex min-w-[9rem] flex-col gap-1">
            {(['sollJahr1', 'sollJahr2', 'sollJahr3'] as const).map((field, yearIndex) => (
              <input
                key={field}
                className={`${INPUT_CLASS} text-right`}
                inputMode="numeric"
                aria-label={`Soll-Plätze ${yearIndex + 1}. Jahr Zeile ${index + 1}`}
                placeholder={`${yearIndex + 1}. Jahr`}
                value={row[field]}
                disabled={!extraGreen}
                onChange={(event) => onChange(row.id, (current) => ({ ...current, [field]: event.target.value }))}
              />
            ))}
          </div>
        ) : (
          <span className="text-sm text-slate-500">—</span>
        )}
      </td>
      <td className={GREEN_CELL}>
        {showGreen ? (
          <select
            className={INPUT_CLASS}
            aria-label={`Durchführungskraft Zeile ${index + 1}`}
            value={row.durchfuehrung}
            disabled={!extraGreen}
            onChange={(event) =>
              onChange(row.id, (current) => ({
                ...current,
                durchfuehrung: event.target.value as Durchfuehrungskraft,
              }))
            }
          >
            <option value="">Bitte wählen</option>
            {DURCHFUEHRUNG_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        ) : (
          <span className="text-sm text-slate-500">—</span>
        )}
      </td>
      <td className={GREEN_CELL}>
        {showGreen ? (
          <JaNeinRadios
            name={`${row.id}-broschuere`}
            value={row.inNaechsterBroschuere}
            disabled={!extraGreen}
            ariaLabel={`Nächste Bildungsbroschüre Zeile ${index + 1}`}
            onChange={(value) => onChange(row.id, (current) => ({ ...current, inNaechsterBroschuere: value }))}
          />
        ) : (
          <span className="text-sm text-slate-500">—</span>
        )}
      </td>
      <td className={GREEN_CELL}>
        {showGreen ? (
          <div className="min-w-[14rem] space-y-2">
            <JaNeinRadios
              name={`${row.id}-fortlaufend`}
              value={row.einstiegFortlaufend}
              disabled={!extraGreen}
              ariaLabel={`Fortlaufender Einstieg Zeile ${index + 1}`}
              onChange={(value) =>
                onChange(row.id, (current) => ({
                  ...current,
                  einstiegFortlaufend: value,
                  beginnArt: value === 'ja' ? '' : current.beginnArt,
                }))
              }
            />
            {row.einstiegFortlaufend === 'nein' ? (
              <>
                <select
                  className={INPUT_CLASS}
                  aria-label={`Beginn möglich Zeile ${index + 1}`}
                  value={row.beginnArt}
                  disabled={!extraGreen}
                  onChange={(event) =>
                    onChange(row.id, (current) => ({
                      ...current,
                      beginnArt: event.target.value as BeginnArt,
                    }))
                  }
                >
                  <option value="">Beginn möglich?</option>
                  {BEGINN_ART_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
                {row.beginnArt === 'alle-n-monate' ? (
                  <input
                    className={INPUT_CLASS}
                    inputMode="numeric"
                    aria-label={`Alle wie viele Monate Zeile ${index + 1}`}
                    placeholder="Monate"
                    value={row.beginnAlleMonate}
                    disabled={!extraGreen}
                    onChange={(event) =>
                      onChange(row.id, (current) => ({ ...current, beginnAlleMonate: event.target.value }))
                    }
                  />
                ) : null}
                {row.beginnArt === 'festes-datum' ? (
                  <div className="space-y-1">
                    {row.beginnDaten.map((date, dateIndex) => (
                      <input
                        key={`${row.id}-date-${dateIndex}`}
                        className={INPUT_CLASS}
                        type="date"
                        aria-label={`Beginndatum ${dateIndex + 1} Zeile ${index + 1}`}
                        value={date}
                        disabled={!extraGreen}
                        onChange={(event) =>
                          onChange(row.id, (current) => ({
                            ...current,
                            beginnDaten: current.beginnDaten.map((item, itemIndex) =>
                              itemIndex === dateIndex ? event.target.value : item,
                            ),
                          }))
                        }
                      />
                    ))}
                    <KernButton
                      type="button"
                      variant="tertiary"
                      label="Weiteres Datum"
                      disabled={!extraGreen}
                      onClick={() =>
                        onChange(row.id, (current) => ({
                          ...current,
                          beginnDaten: [...current.beginnDaten, ''],
                        }))
                      }
                    />
                  </div>
                ) : null}
              </>
            ) : null}
          </div>
        ) : (
          <span className="text-sm text-slate-500">—</span>
        )}
      </td>
      <td className={GREEN_CELL}>
        {showGreen && gruppe === 'sa' ? (
          <span className="text-sm font-medium text-landesrot">{row.geplanterAbschluss}</span>
        ) : showGreen && gruppe === 'sf-vm' ? (
          <select
            className={INPUT_CLASS}
            aria-label={`Geplanter Abschluss Zeile ${index + 1}`}
            value={row.geplanterAbschluss}
            disabled={!extraGreen}
            onChange={(event) =>
              onChange(row.id, (current) => ({ ...current, geplanterAbschluss: event.target.value }))
            }
          >
            {SF_VM_ABSCHLUSS_OPTIONS.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        ) : showGreen && gruppe === 'ab' ? (
          <div className="min-w-[12rem] space-y-1">
            <select
              className={INPUT_CLASS}
              aria-label={`Geplanter Abschluss Zeile ${index + 1}`}
              value={row.geplanterAbschluss}
              disabled={!extraGreen}
              onChange={(event) =>
                onChange(row.id, (current) => ({ ...current, geplanterAbschluss: event.target.value }))
              }
            >
              <option value="">Bitte wählen</option>
              {AB_ABSCHLUSS_OPTIONS.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
            {row.geplanterAbschluss === 'Sonstiges' ? (
              <input
                className={INPUT_CLASS}
                aria-label={`Sonstiger Abschluss Zeile ${index + 1}`}
                value={row.abschlussFreitext}
                disabled={!extraGreen}
                onChange={(event) =>
                  onChange(row.id, (current) => ({ ...current, abschlussFreitext: event.target.value }))
                }
              />
            ) : null}
          </div>
        ) : showGreen && gruppe === 'so' ? (
          <input
            className={INPUT_CLASS}
            aria-label={`Geplanter Abschluss Freitext Zeile ${index + 1}`}
            value={row.abschlussFreitext}
            disabled={!extraGreen}
            onChange={(event) =>
              onChange(row.id, (current) => ({ ...current, abschlussFreitext: event.target.value }))
            }
          />
        ) : (
          <span className="text-sm text-slate-500">—</span>
        )}
      </td>
      <td className={CELL}>
        <input
          className={`${INPUT_CLASS} min-w-[8rem]`}
          aria-label={`Anmerkungen Zeile ${index + 1}`}
          value={row.anmerkung}
          disabled={!green}
          onChange={(event) => onChange(row.id, (current) => ({ ...current, anmerkung: event.target.value }))}
        />
      </td>
      <td className={CELL}>
        {row.isNew ? (
          <span className="text-sm text-slate-500">Neu</span>
        ) : (
          <JaNeinRadios
            name={`${row.id}-korrekt`}
            value={row.datenKorrekt}
            disabled={disabled}
            ariaLabel={`Daten noch korrekt Zeile ${index + 1}`}
            onChange={(value) => onChange(row.id, (current) => applyDatenKorrekt(current, value))}
          />
        )}
      </td>
      <td className={CELL}>
        {row.isNew ? (
          <KernButton type="button" variant="tertiary" label="Entfernen" onClick={() => onRemove(row.id)} />
        ) : null}
      </td>
    </tr>
  );
}

function AngebotReviewTable({ rows }: { rows: AngebotFormRow[] }) {
  return (
    <div className="w-full overflow-x-auto">
      <table className="w-max min-w-full border-collapse text-left text-sm">
        <thead>
          <tr>
            <th className={HEADER}>Kurs</th>
            <th className={HEADER}>Kategorie</th>
            <th className={HEADER}>Soll</th>
            <th className={HEADER}>Zielgruppe</th>
            <th className={HEADER}>Dauer</th>
            <th className={HEADER}>Durchführung</th>
            <th className={HEADER}>Broschüre</th>
            <th className={HEADER}>Beginn</th>
            <th className={HEADER}>Abschluss</th>
            <th className={HEADER}>Korrekt</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.id} className="bg-white">
              <td className={CELL}>{row.courseName}</td>
              <td className={CELL}>
                {row.categoryLabel}
                <br />
                <span className="text-slate-500">{row.typeLabel}</span>
              </td>
              <td className={`${CELL} text-right tabular-nums`}>{row.targetPlaces || '—'}</td>
              <td className={CELL}>{isStudium(row.categoryKey) ? 'Studium' : formatZielgruppe(row.zielgruppe)}</td>
              <td className={CELL}>{row.durationMonths ? `${row.durationMonths} Monate` : '—'}</td>
              <td className={CELL}>{formatDurchfuehrung(row.durchfuehrung)}</td>
              <td className={CELL}>{formatJaNein(row.inNaechsterBroschuere)}</td>
              <td className={CELL}>{formatBeginn(row)}</td>
              <td className={CELL}>
                {row.geplanterAbschluss === 'Sonstiges' || abschlussGruppe(row.categoryKey, row.typeKey) === 'so'
                  ? row.abschlussFreitext || row.geplanterAbschluss || '—'
                  : row.geplanterAbschluss || '—'}
              </td>
              <td className={CELL}>{row.isNew ? 'Neu' : formatJaNein(row.datenKorrekt)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function JaNeinRadios({
  name,
  value,
  onChange,
  disabled,
  ariaLabel,
}: {
  name: string;
  value: JaNeinValue;
  onChange: (value: JaNein) => void;
  disabled?: boolean;
  ariaLabel: string;
}) {
  return (
    <fieldset className="m-0 flex flex-wrap gap-3 border-0 p-0" disabled={disabled}>
      <legend className="sr-only">{ariaLabel}</legend>
      <label className="inline-flex items-center gap-1.5 text-sm">
        <input type="radio" name={name} checked={value === 'ja'} onChange={() => onChange('ja')} />
        Ja
      </label>
      <label className="inline-flex items-center gap-1.5 text-sm">
        <input type="radio" name={name} checked={value === 'nein'} onChange={() => onChange('nein')} />
        Nein
      </label>
    </fieldset>
  );
}
