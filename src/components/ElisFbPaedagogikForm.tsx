import { useMemo, useState } from 'react';
import { JVAS } from '../data/jvas';
import {
  ELIS_SICHERHEITSPARTNER_COLUMNS,
  ELIS_SICHERHEITSRAHMEN_COLUMNS,
  type ElisSicherheitsrahmenKey,
  type ElisSicherheitspartnerKey,
} from '../utils/elisAnsprechpersonen';
import {
  buildElisJvaFormRows,
  normalizeElisJvaRow,
  saveSubmittedElisJvaRows,
  validateElisJvaForm,
  type ElisJvaFormRow,
} from '../utils/elisJvaForm';
import {
  elisLastChangeLabel,
  getElisLastChange,
  getElisLastChangeForJva,
} from '../utils/elisLastChange';
import {
  buildMandantenFormRows,
  createEmptyMandantRow,
  mandantenStandLabel,
  normalizeMandantRow,
  saveSubmittedMandanten,
  validateMandantenForm,
  type ElisMandantFormRow,
} from '../utils/elisMandantenForm';
import { elisFormJvaLabel } from '../utils/elisSchulraeumeForm';
import {
  KernAlert,
  KernBadge,
  KernButton,
  KernCard,
  KernHeading,
  KernSelect,
  KernSpace,
  KernText,
} from '../ui/kern';

interface ElisFbPaedagogikFormProps {
  onBack: () => void;
}

const INPUT_CLASS =
  'w-full min-w-[5.5rem] rounded border border-slate-300 bg-white px-2 py-1.5 text-sm text-(--color-ink) disabled:bg-slate-100 disabled:text-slate-600';
const CELL = 'border border-nachtblau-30 px-2 py-2 align-top';
const HEADER =
  'border border-nachtblau-50 bg-nachtblau px-2 py-2 text-left text-[11px] font-semibold uppercase tracking-wide text-white';

export function ElisFbPaedagogikForm({ onBack }: ElisFbPaedagogikFormProps) {
  const jvaOptions = useMemo(
    () => [...JVAS].sort((a, b) => a.name.localeCompare(b.name, 'de')),
    [],
  );
  const [jvaId, setJvaId] = useState(jvaOptions[0]?.id ?? '');
  const [step, setStep] = useState<'erfassung' | 'bestaetigung' | 'abgeschlossen'>('erfassung');
  const [contactRows, setContactRows] = useState<ElisJvaFormRow[]>(() =>
    jvaId ? buildElisJvaFormRows('folgepruefung', jvaId) : [],
  );
  const [mandantRows, setMandantRows] = useState<ElisMandantFormRow[]>(() =>
    jvaId ? buildMandantenFormRows(jvaId) : [],
  );
  const [error, setError] = useState<string | null>(null);

  const jvaName = elisFormJvaLabel(jvaId);
  const changeLabel = elisLastChangeLabel(getElisLastChangeForJva(jvaId) ?? getElisLastChange());

  const selectJva = (nextId: string) => {
    setJvaId(nextId);
    setContactRows(buildElisJvaFormRows('folgepruefung', nextId));
    setMandantRows(buildMandantenFormRows(nextId));
    setStep('erfassung');
    setError(null);
  };

  const handleWeiter = () => {
    const contacts = validateElisJvaForm('erstfassung', contactRows);
    const mandanten = validateMandantenForm(mandantRows);
    const messages = [...contacts.messages, ...mandanten.messages];
    if (messages.length > 0) {
      setError(messages.join(' '));
      return;
    }
    setError(null);
    setContactRows(contactRows.map(normalizeElisJvaRow));
    setMandantRows(mandantRows.map(normalizeMandantRow));
    setStep('bestaetigung');
  };

  const handleConfirmYes = () => {
    const contacts = contactRows.map(normalizeElisJvaRow);
    const mandanten = mandantRows.map(normalizeMandantRow);
    saveSubmittedElisJvaRows(jvaId, contacts, 'fb-paed');
    saveSubmittedMandanten(jvaId, mandanten);
    setContactRows(contacts);
    setMandantRows(mandanten);
    setStep('abgeschlossen');
  };

  if (step === 'abgeschlossen') {
    return (
      <>
        <KernHeading level={1}>Formular eLis – Ebene Fachbereich Pädagogik</KernHeading>
        <KernText muted>{jvaName}</KernText>
        <KernSpace size="default" />
        <KernAlert title="Angaben gespeichert" variant="success">
          Die Änderungen für {jvaName} sind gespeichert. Sie sind im Anstaltsformular für das
          kommende Jahr und in den Berichten 9, 11 und 12 mit dem Datum der letzten Änderung
          sichtbar.
        </KernAlert>
        <KernSpace size="large" />
        <div className="flex flex-wrap gap-3">
          <KernButton type="button" variant="secondary" label="Zurück zur Übersicht" onClick={onBack} />
          <KernButton
            type="button"
            variant="primary"
            label="Weitere Anstalt bearbeiten"
            onClick={() => setStep('erfassung')}
          />
        </div>
      </>
    );
  }

  if (step === 'bestaetigung') {
    return (
      <>
        <KernHeading level={1}>Prüfung der Angaben</KernHeading>
        <KernText>
          Bitte prüfen Sie alle geänderten und ergänzten Daten. Stimmen die Angaben nicht, kehren
          Sie zur Bearbeitung zurück.
        </KernText>
        <KernSpace size="small" />
        <KernBadge label={jvaName} variant="info" />
        <KernSpace size="default" />
        <KernCard title="eLis-Ansprechpersonen" subline={jvaName}>
          <FbContactReviewTable rows={contactRows} />
        </KernCard>
        <KernSpace size="default" />
        <KernCard title={`Elis Räume und Mandantschaften (Stand ${mandantenStandLabel()})`}>
          <FbMandantReviewTable rows={mandantRows} />
        </KernCard>
        <KernSpace size="large" />
        <KernCard title="Sind die Daten so korrekt?" subline="Bestätigung">
          <div className="flex flex-wrap gap-3">
            <KernButton
              type="button"
              variant="secondary"
              label="Nein, Angaben korrigieren"
              onClick={() => setStep('erfassung')}
            />
            <KernButton type="button" variant="primary" label="Ja, Angaben speichern" onClick={handleConfirmYes} />
          </div>
        </KernCard>
      </>
    );
  }

  return (
    <>
      <KernHeading level={1}>Formular eLis – Ebene Fachbereich Pädagogik</KernHeading>
      <KernText muted>Strukturdaten · eLis · Ministeriumsebene</KernText>
      <KernSpace size="default" />
      <KernText>
        Der Fachbereich Pädagogik kann die eLis-Daten der Anstalten jederzeit ändern. Änderungen
        gelten im Formular der Anstalt für das kommende Jahr und sind in den Berichten 9, 11 und 12
        mit dem Datum der letzten Änderung sichtbar.
      </KernText>
      {changeLabel ? (
        <>
          <KernSpace size="small" />
          <KernText muted>{changeLabel}</KernText>
        </>
      ) : null}
      <KernSpace size="default" />
      <KernSelect
        id="elis-fb-jva"
        label="Anstalt"
        value={jvaId}
        onChange={(event) => selectJva(event.target.value)}
      >
        {jvaOptions.map((jva) => (
          <option key={jva.id} value={jva.id}>
            {jva.name}
          </option>
        ))}
      </KernSelect>
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
        title="eLis-Ansprechpersonen"
        subline="Anstaltsname vorausgefüllt und nicht änderbar. Alle übrigen Felder sind jederzeit bearbeitbar."
      >
        <FbContactTable
          rows={contactRows}
          onChange={(id, updater) =>
            setContactRows((current) => current.map((row) => (row.id === id ? updater(row) : row)))
          }
        />
      </KernCard>
      <KernSpace size="large" />
      <KernCard
        title={`Elis Räume und Mandantschaften (Stand ${mandantenStandLabel()})`}
        subline="Zeilen können ergänzt und jederzeit geändert werden."
      >
        <FbMandantTable
          rows={mandantRows}
          onChange={(id, updater) =>
            setMandantRows((current) => current.map((row) => (row.id === id ? updater(row) : row)))
          }
          onRemove={(id) =>
            setMandantRows((current) => {
              const next = current.filter((row) => row.id !== id);
              return next.length === 0
                ? [createEmptyMandantRow(jvaId, contactRows[0]?.jvaLabel ?? jvaName)]
                : next;
            })
          }
        />
        <KernSpace size="default" />
        <KernButton
          type="button"
          variant="secondary"
          label="Neue Zeile einfügen"
          onClick={() =>
            setMandantRows((current) => [
              ...current,
              createEmptyMandantRow(jvaId, current[0]?.jvaLabel ?? contactRows[0]?.jvaLabel ?? jvaName),
            ])
          }
        />
      </KernCard>
      <KernSpace size="large" />
      <div className="flex flex-wrap gap-3">
        <KernButton type="button" variant="tertiary" label="Zurück zur Übersicht" onClick={onBack} />
        <KernButton type="button" variant="primary" label="Weiter" onClick={handleWeiter} />
      </div>
    </>
  );
}

function FbContactTable({
  rows,
  onChange,
}: {
  rows: ElisJvaFormRow[];
  onChange: (id: string, updater: (row: ElisJvaFormRow) => ElisJvaFormRow) => void;
}) {
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
          {rows.map((row, index) => (
            <tr key={row.id} className="bg-white">
              <td className={`${CELL} whitespace-nowrap text-sm font-medium`}>{row.jvaLabel}</td>
              <td className={CELL}>
                <input
                  className={INPUT_CLASS}
                  aria-label={`Rektorin oder Rektor Zeile ${index + 1}`}
                  value={row.rektor}
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
                    onChange={(event) =>
                      onChange(row.id, (current) => ({
                        ...current,
                        sicherheitsrahmen: {
                          ...current.sicherheitsrahmen,
                          [column.key]: event.target.value,
                        } as Record<ElisSicherheitsrahmenKey, string>,
                      }))
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
                    onChange={(event) =>
                      onChange(row.id, (current) => ({
                        ...current,
                        ansprechpartner: {
                          ...current.ansprechpartner,
                          [column.key]: event.target.value,
                        } as Record<ElisSicherheitspartnerKey, string>,
                      }))
                    }
                  />
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function FbMandantTable({
  rows,
  onChange,
  onRemove,
}: {
  rows: ElisMandantFormRow[];
  onChange: (id: string, updater: (row: ElisMandantFormRow) => ElisMandantFormRow) => void;
  onRemove: (id: string) => void;
}) {
  const totals = rows.reduce(
    (sum, row) => ({
      gemeldet: sum.gemeldet + (Number(row.gemeldeteAnzahl) || 0),
      rabatt: sum.rabatt + (Number(row.rabattierteZaehlung) || 0),
    }),
    { gemeldet: 0, rabatt: 0 },
  );

  return (
    <div className="w-full overflow-x-auto">
      <table className="w-max min-w-full border-collapse text-left">
        <thead>
          <tr>
            <th className={HEADER} rowSpan={2}>
              Name der JVA (elis Verbünde)
            </th>
            <th className={`${HEADER} text-center`} colSpan={4}>
              Mandantschaft
            </th>
            <th className={HEADER} rowSpan={2}>
              Name der Rektorin/des Rektors
            </th>
            <th className={HEADER} rowSpan={2}>
              Anmerkungen
            </th>
            <th className={HEADER} rowSpan={2}>
              Zeile
            </th>
          </tr>
          <tr>
            <th className={HEADER}>Name</th>
            <th className={HEADER}>Kürzel</th>
            <th className={HEADER}>Gemeldete Anzahl</th>
            <th className={HEADER}>Rabattierte Zählung</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row, index) => (
            <tr key={row.id} className="bg-white">
              <td className={`${CELL} whitespace-nowrap text-sm font-medium`}>
                {index === 0 ? row.jvaLabel : ''}
              </td>
              <td className={CELL}>
                <input
                  className={INPUT_CLASS}
                  aria-label={`Mandantschaft Name Zeile ${index + 1}`}
                  value={row.mandantName}
                  onChange={(event) =>
                    onChange(row.id, (current) => ({ ...current, mandantName: event.target.value }))
                  }
                />
              </td>
              <td className={CELL}>
                <input
                  className={INPUT_CLASS}
                  aria-label={`Kürzel Zeile ${index + 1}`}
                  value={row.kuerzel}
                  onChange={(event) =>
                    onChange(row.id, (current) => ({ ...current, kuerzel: event.target.value }))
                  }
                />
              </td>
              <td className={CELL}>
                <input
                  className={`${INPUT_CLASS} text-right`}
                  inputMode="numeric"
                  aria-label={`Gemeldete Anzahl Zeile ${index + 1}`}
                  value={row.gemeldeteAnzahl}
                  onChange={(event) =>
                    onChange(row.id, (current) => ({ ...current, gemeldeteAnzahl: event.target.value }))
                  }
                />
              </td>
              <td className={CELL}>
                <input
                  className={`${INPUT_CLASS} text-right`}
                  inputMode="numeric"
                  aria-label={`Rabattierte Zählung Zeile ${index + 1}`}
                  value={row.rabattierteZaehlung}
                  onChange={(event) =>
                    onChange(row.id, (current) => ({
                      ...current,
                      rabattierteZaehlung: event.target.value,
                    }))
                  }
                />
              </td>
              <td className={CELL}>
                <input
                  className={INPUT_CLASS}
                  aria-label={`Rektorin oder Rektor Mandantschaft Zeile ${index + 1}`}
                  value={row.rektor}
                  onChange={(event) =>
                    onChange(row.id, (current) => ({ ...current, rektor: event.target.value }))
                  }
                />
              </td>
              <td className={CELL}>
                <input
                  className={`${INPUT_CLASS} min-w-[9rem]`}
                  aria-label={`Anmerkungen Mandantschaft Zeile ${index + 1}`}
                  value={row.anmerkung}
                  onChange={(event) =>
                    onChange(row.id, (current) => ({ ...current, anmerkung: event.target.value }))
                  }
                />
              </td>
              <td className={CELL}>
                <KernButton
                  type="button"
                  variant="tertiary"
                  label="Entfernen"
                  onClick={() => onRemove(row.id)}
                />
              </td>
            </tr>
          ))}
          <tr className="bg-nachtblau-15 font-semibold">
            <td className={CELL} colSpan={3}>
              Summe {elisFormJvaLabel(rows[0]?.jvaId ?? '')}
            </td>
            <td className={`${CELL} text-right tabular-nums`}>{totals.gemeldet}</td>
            <td className={`${CELL} text-right tabular-nums`}>{totals.rabatt}</td>
            <td className={CELL} colSpan={3} />
          </tr>
        </tbody>
      </table>
    </div>
  );
}

function FbContactReviewTable({ rows }: { rows: ElisJvaFormRow[] }) {
  return (
    <div className="w-full overflow-x-auto">
      <table className="w-max min-w-full border-collapse text-left text-sm">
        <thead>
          <tr>
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
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.id} className="bg-white">
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
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function FbMandantReviewTable({ rows }: { rows: ElisMandantFormRow[] }) {
  return (
    <div className="w-full overflow-x-auto">
      <table className="w-max min-w-full border-collapse text-left text-sm">
        <thead>
          <tr>
            <th className={HEADER}>JVA</th>
            <th className={HEADER}>Mandantschaft</th>
            <th className={HEADER}>Kürzel</th>
            <th className={HEADER}>Gemeldet</th>
            <th className={HEADER}>Rabattiert</th>
            <th className={HEADER}>Rektorin/Rektor</th>
            <th className={HEADER}>Anmerkungen</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.id} className="bg-white">
              <td className={`${CELL} whitespace-nowrap`}>{row.jvaLabel}</td>
              <td className={CELL}>{row.mandantName}</td>
              <td className={CELL}>{row.kuerzel || '—'}</td>
              <td className={`${CELL} text-right tabular-nums`}>{row.gemeldeteAnzahl}</td>
              <td className={`${CELL} text-right tabular-nums`}>{row.rabattierteZaehlung}</td>
              <td className={CELL}>{row.rektor || '—'}</td>
              <td className={CELL}>{row.anmerkung || '—'}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
