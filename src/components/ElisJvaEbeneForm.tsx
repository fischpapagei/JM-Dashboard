import { useState } from 'react';
import {
  ELIS_SICHERHEITSPARTNER_COLUMNS,
  ELIS_SICHERHEITSRAHMEN_COLUMNS,
  type ElisSicherheitsrahmenKey,
  type ElisSicherheitspartnerKey,
} from '../utils/elisAnsprechpersonen';
import {
  applyElisJvaDatenKorrekt,
  buildElisJvaFormRows,
  canEditElisJvaRow,
  elisJvaRowStatus,
  elisJvaRowStatusLabel,
  normalizeElisJvaRow,
  saveSubmittedElisJvaRows,
  validateElisJvaForm,
  type ElisJvaFormRow,
} from '../utils/elisJvaForm';
import {
  ELIS_FORM_ERFASSUNGSJAHR,
  ELIS_FORM_VORJAHR,
  type ElisFormMode,
  type JaNein,
  type JaNeinValue,
} from '../utils/elisSchulraeumeForm';
import { elisLastChangeLabel, getElisLastChangeForJva } from '../utils/elisLastChange';
import {
  KernAlert,
  KernBadge,
  KernButton,
  KernCard,
  KernHeading,
  KernSpace,
  KernText,
} from '../ui/kern';

interface ElisJvaEbeneFormProps {
  jvaId: string;
  jvaName: string;
  mode: ElisFormMode;
  onBackToRooms: () => void;
  onFinished: () => void;
}

const INPUT_CLASS =
  'w-full min-w-[5.5rem] rounded border border-slate-300 bg-white px-2 py-1.5 text-sm text-(--color-ink) disabled:bg-slate-100 disabled:text-slate-600';
const CELL = 'border border-nachtblau-30 px-2 py-2 align-top';
const HEADER =
  'border border-nachtblau-50 bg-nachtblau px-2 py-2 text-left text-[11px] font-semibold uppercase tracking-wide text-white';

export function ElisJvaEbeneForm({
  jvaId,
  jvaName,
  mode,
  onBackToRooms,
  onFinished,
}: ElisJvaEbeneFormProps) {
  const [step, setStep] = useState<'erfassung' | 'bestaetigung'>('erfassung');
  const [rows, setRows] = useState<ElisJvaFormRow[]>(() => buildElisJvaFormRows(mode, jvaId));
  const [error, setError] = useState<string | null>(null);
  const isFolge = mode === 'folgepruefung';
  const lastChange = elisLastChangeLabel(getElisLastChangeForJva(jvaId));

  const updateRow = (id: string, updater: (row: ElisJvaFormRow) => ElisJvaFormRow) => {
    setRows((current) => current.map((row) => (row.id === id ? updater(row) : row)));
  };

  const handleWeiter = () => {
    const result = validateElisJvaForm(mode, rows);
    if (!result.ok) {
      setError(result.messages.join(' '));
      return;
    }
    setError(null);
    setRows(rows.map(normalizeElisJvaRow));
    setStep('bestaetigung');
  };

  const handleConfirmYes = () => {
    const normalized = rows.map(normalizeElisJvaRow);
    saveSubmittedElisJvaRows(jvaId, normalized);
    onFinished();
  };

  if (step === 'bestaetigung') {
    return (
      <>
        <KernHeading level={1}>Prüfung der Angaben</KernHeading>
        <KernText>
          Bitte prüfen Sie alle Daten einschließlich geänderter Angaben. Stimmen die Daten, geht es
          weiter zur nächsten Seite. Andernfalls kehren Sie zur Bearbeitung zurück.
        </KernText>
        <KernSpace size="small" />
        <KernBadge label={jvaName} variant="info" />
        <KernSpace size="default" />
        <ElisJvaReviewTable rows={rows} />
        <KernSpace size="large" />
        <KernCard title="Sind die Daten so korrekt?" subline="Nächster Schritt">
          <div className="flex flex-wrap gap-3">
            <KernButton
              type="button"
              variant="secondary"
              label="Nein, Angaben korrigieren"
              onClick={() => setStep('erfassung')}
            />
            <KernButton
              type="button"
              variant="primary"
              label="Ja, weiter"
              onClick={handleConfirmYes}
            />
          </div>
        </KernCard>
      </>
    );
  }

  return (
    <>
      <KernHeading level={1}>Formular eLis – Ebene JVAen</KernHeading>
      <KernText muted>Strukturdaten · eLis · {jvaName}</KernText>
      <KernSpace size="default" />
      <KernBadge label={jvaName} variant="info" />
      <KernSpace size="small" />
      {lastChange ? (
        <>
          <KernText muted>{lastChange}</KernText>
          <KernSpace size="small" />
        </>
      ) : null}
      {isFolge ? (
        <KernText>
          Jährlich prüfen die Anstalten, ob die hinterlegten weiteren Daten zu eLis noch stimmen.
          Angezeigt werden die Vorjahresdaten {ELIS_FORM_VORJAHR}. Der Anstaltsname ist vorausgefüllt
          und nicht änderbar. Bitte bestätigen Sie je Zeile, ob die Angaben noch korrekt sind. Die
          Aufgabe liegt häufig bei den Rektorinnen und Rektoren des pädagogischen Dienstes, kann
          aber auch von anderen Stellen wahrgenommen werden.
        </KernText>
      ) : (
        <KernText>
          Erfassen Sie die eLis-Ansprechpersonen der Anstalt. Der Anstaltsname (elis-Verbund) ist
          vorausgefüllt und nicht änderbar.
        </KernText>
      )}
      <KernSpace size="large" />
      {error ? (
        <>
          <KernAlert title="Angaben unvollständig" variant="danger">
            {error}
          </KernAlert>
          <KernSpace size="default" />
        </>
      ) : null}
      <KernCard
        title={isFolge ? `Vorjahresdaten ${ELIS_FORM_VORJAHR}` : `Erfassung ${ELIS_FORM_ERFASSUNGSJAHR}`}
        subline={
          isFolge
            ? 'Bei „Nein“ können die Werte korrigiert werden. Bei „Ja“ bleiben sie gesperrt.'
            : 'Der Anstaltsname bleibt gesperrt. Alle übrigen Felder sind frei bearbeitbar.'
        }
      >
        <ElisJvaCaptureTable mode={mode} rows={rows} onChange={updateRow} />
      </KernCard>
      <KernSpace size="large" />
      <div className="flex flex-wrap gap-3">
        <KernButton
          type="button"
          variant="tertiary"
          label="Zurück zu den Schulräumen"
          onClick={onBackToRooms}
        />
        <KernButton type="button" variant="primary" label="Weiter" onClick={handleWeiter} />
      </div>
    </>
  );
}

function ElisJvaCaptureTable({
  mode,
  rows,
  onChange,
}: {
  mode: ElisFormMode;
  rows: ElisJvaFormRow[];
  onChange: (id: string, updater: (row: ElisJvaFormRow) => ElisJvaFormRow) => void;
}) {
  const showKorrekt = mode === 'folgepruefung';

  return (
    <div className="w-full overflow-x-auto">
      <table className="w-max min-w-full border-collapse text-left">
        <thead>
          <tr>
            <th className={HEADER} rowSpan={2}>
              Name der JVA (elis Verbünde)
            </th>
            <th className={HEADER} rowSpan={2}>
              Name der Rektorin/des Rektors
            </th>
            <th className={`${HEADER} text-center`} colSpan={ELIS_SICHERHEITSRAHMEN_COLUMNS.length}>
              Elis Sicherheitsrahmen
            </th>
            <th className={`${HEADER} text-center`} colSpan={ELIS_SICHERHEITSPARTNER_COLUMNS.length}>
              Elis Ansprechpartner
            </th>
            <th className={HEADER} rowSpan={2}>
              Anmerkungen
            </th>
            {showKorrekt ? (
              <th className={HEADER} rowSpan={2}>
                Sind die Daten noch korrekt?
              </th>
            ) : null}
          </tr>
          <tr>
            {ELIS_SICHERHEITSRAHMEN_COLUMNS.map((column) => (
              <th key={`rahmen-${column.key}`} className={HEADER}>
                {column.label}
              </th>
            ))}
            {ELIS_SICHERHEITSPARTNER_COLUMNS.map((column) => (
              <th key={`partner-${column.key}`} className={HEADER}>
                {column.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, index) => {
            const editable = canEditElisJvaRow(mode, row);
            return (
              <tr key={row.id} className={editable ? 'bg-white' : 'bg-slate-50'}>
                <td className={`${CELL} whitespace-nowrap text-sm font-medium`}>{row.jvaLabel}</td>
                <td className={CELL}>
                  <input
                    className={INPUT_CLASS}
                    aria-label={`Rektorin oder Rektor Zeile ${index + 1}`}
                    value={row.rektor}
                    disabled={!editable}
                    onChange={(event) =>
                      onChange(row.id, (current) => ({ ...current, rektor: event.target.value }))
                    }
                  />
                </td>
                {ELIS_SICHERHEITSRAHMEN_COLUMNS.map((column) => (
                  <td key={`${row.id}-rahmen-${column.key}`} className={CELL}>
                    <input
                      className={INPUT_CLASS}
                      aria-label={`Sicherheitsrahmen ${column.label} Zeile ${index + 1}`}
                      value={row.sicherheitsrahmen[column.key]}
                      disabled={!editable}
                      onChange={(event) =>
                        onChange(row.id, (current) =>
                          updateRahmen(current, column.key, event.target.value),
                        )
                      }
                    />
                  </td>
                ))}
                {ELIS_SICHERHEITSPARTNER_COLUMNS.map((column) => (
                  <td key={`${row.id}-partner-${column.key}`} className={CELL}>
                    <input
                      className={INPUT_CLASS}
                      aria-label={`Ansprechpartner ${column.label} Zeile ${index + 1}`}
                      value={row.ansprechpartner[column.key]}
                      disabled={!editable}
                      onChange={(event) =>
                        onChange(row.id, (current) =>
                          updatePartner(current, column.key, event.target.value),
                        )
                      }
                    />
                  </td>
                ))}
                <td className={CELL}>
                  <input
                    className={`${INPUT_CLASS} min-w-[9rem]`}
                    aria-label={`Anmerkungen Zeile ${index + 1}`}
                    value={row.anmerkung}
                    disabled={!editable}
                    onChange={(event) =>
                      onChange(row.id, (current) => ({ ...current, anmerkung: event.target.value }))
                    }
                  />
                </td>
                {showKorrekt ? (
                  <td className={CELL}>
                    <JaNeinRadios
                      name={`jva-korrekt-${row.id}`}
                      value={row.datenKorrekt}
                      ariaLabel={`Daten noch korrekt Zeile ${index + 1}`}
                      onChange={(value) =>
                        onChange(row.id, (current) => applyElisJvaDatenKorrekt(current, value))
                      }
                    />
                  </td>
                ) : null}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

function ElisJvaReviewTable({ rows }: { rows: ElisJvaFormRow[] }) {
  return (
    <div className="w-full overflow-x-auto rounded-xl border border-slate-200 bg-white">
      <table className="w-max min-w-full border-collapse text-left text-sm">
        <thead>
          <tr>
            <th className={HEADER}>Status</th>
            <th className={HEADER}>Name der JVA (elis Verbünde)</th>
            <th className={HEADER}>Rektorin/Rektor</th>
            {ELIS_SICHERHEITSRAHMEN_COLUMNS.map((column) => (
              <th key={`rev-rahmen-${column.key}`} className={HEADER}>
                Rahmen {column.label}
              </th>
            ))}
            {ELIS_SICHERHEITSPARTNER_COLUMNS.map((column) => (
              <th key={`rev-partner-${column.key}`} className={HEADER}>
                Partner {column.label}
              </th>
            ))}
            <th className={HEADER}>Anmerkungen</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.id} className="bg-white">
              <td className={CELL}>{elisJvaRowStatusLabel(elisJvaRowStatus(row))}</td>
              <td className={`${CELL} whitespace-nowrap font-medium`}>{row.jvaLabel}</td>
              <td className={CELL}>{row.rektor || '—'}</td>
              {ELIS_SICHERHEITSRAHMEN_COLUMNS.map((column) => (
                <td key={`${row.id}-rev-rahmen-${column.key}`} className={CELL}>
                  {row.sicherheitsrahmen[column.key] || '—'}
                </td>
              ))}
              {ELIS_SICHERHEITSPARTNER_COLUMNS.map((column) => (
                <td key={`${row.id}-rev-partner-${column.key}`} className={CELL}>
                  {row.ansprechpartner[column.key] || '—'}
                </td>
              ))}
              <td className={CELL}>{row.anmerkung || '—'}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function updateRahmen(
  row: ElisJvaFormRow,
  key: ElisSicherheitsrahmenKey,
  value: string,
): ElisJvaFormRow {
  return { ...row, sicherheitsrahmen: { ...row.sicherheitsrahmen, [key]: value } };
}

function updatePartner(
  row: ElisJvaFormRow,
  key: ElisSicherheitspartnerKey,
  value: string,
): ElisJvaFormRow {
  return { ...row, ansprechpartner: { ...row.ansprechpartner, [key]: value } };
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
