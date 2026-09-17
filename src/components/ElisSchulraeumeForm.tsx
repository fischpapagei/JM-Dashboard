import { useMemo, useState } from 'react';
import { ElisJvaEbeneForm } from './ElisJvaEbeneForm';
import { elisLastChangeLabel, getElisLastChangeForJva } from '../utils/elisLastChange';
import { JVAS } from '../data/jvas';
import {
  applyDatenKorrekt,
  applyElisVorhanden,
  buildElisFormRows,
  canEditElisRow,
  createEmptyElisRow,
  ELIS_FORM_ERFASSUNGSJAHR,
  ELIS_FORM_VORJAHR,
  elisFormJvaLabel,
  elisRowStatus,
  elisRowStatusLabel,
  formatDecimal2,
  formatJaNein,
  isNewElisRow,
  normalizeElisRowForSubmit,
  parseDecimal2,
  saveSubmittedElisRooms,
  validateElisForm,
  type ElisFormMode,
  type ElisSchulraumFormRow,
  type JaNein,
  type JaNeinValue,
} from '../utils/elisSchulraeumeForm';
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

interface ElisSchulraeumeFormProps {
  userJvaId: string | null;
  isJvaRole: boolean;
  onBack: () => void;
}

type FormStep = 'erfassung' | 'bestaetigung' | 'jva' | 'abgeschlossen';

const INPUT_CLASS =
  'w-full min-w-[6.5rem] rounded border border-slate-300 bg-white px-2 py-1.5 text-sm text-(--color-ink) disabled:bg-slate-100 disabled:text-slate-600';
const CELL = 'border border-nachtblau-30 px-2 py-2 align-top';
const HEADER =
  'border border-nachtblau-50 bg-nachtblau px-2 py-2 text-left text-[11px] font-semibold uppercase tracking-wide text-white';

export function ElisSchulraeumeForm({ userJvaId, isJvaRole, onBack }: ElisSchulraeumeFormProps) {
  const jvaOptions = useMemo(
    () => [...JVAS].sort((a, b) => a.name.localeCompare(b.name, 'de')),
    [],
  );
  const [jvaId, setJvaId] = useState(userJvaId ?? jvaOptions[0]?.id ?? '');
  const [mode, setMode] = useState<ElisFormMode>('folgepruefung');
  const [step, setStep] = useState<FormStep>('erfassung');
  const [rows, setRows] = useState<ElisSchulraumFormRow[]>(() =>
    jvaId ? buildElisFormRows('folgepruefung', jvaId) : [createEmptyElisRow()],
  );
  const [error, setError] = useState<string | null>(null);

  const applyContext = (nextMode: ElisFormMode, nextJvaId: string) => {
    setMode(nextMode);
    setJvaId(nextJvaId);
    setRows(nextJvaId ? buildElisFormRows(nextMode, nextJvaId) : [createEmptyElisRow()]);
    setStep('erfassung');
    setError(null);
  };

  const jvaName = elisFormJvaLabel(jvaId);
  const isFolge = mode === 'folgepruefung';
  const lastChange = elisLastChangeLabel(getElisLastChangeForJva(jvaId));

  const updateRow = (id: string, updater: (row: ElisSchulraumFormRow) => ElisSchulraumFormRow) => {
    setRows((current) => current.map((row) => (row.id === id ? updater(row) : row)));
  };

  const handleWeiter = () => {
    const result = validateElisForm(mode, rows);
    if (!result.ok) {
      setError(result.messages.join(' '));
      return;
    }
    setError(null);
    setRows(rows.map(normalizeElisRowForSubmit));
    setStep('bestaetigung');
  };

  const handleConfirmYes = () => {
    const normalized = rows.map(normalizeElisRowForSubmit);
    saveSubmittedElisRooms(jvaId, normalized);
    setRows(normalized);
    setStep('jva');
  };

  if (step === 'abgeschlossen') {
    return (
      <>
        <KernHeading level={1}>Formular Schulräume und eLis</KernHeading>
        <KernText muted>{jvaName} · Erfassungsjahr {ELIS_FORM_ERFASSUNGSJAHR}</KernText>
        <KernSpace size="default" />
        <KernAlert title="Vorgang abgeschlossen" variant="success">
          Die Angaben zu den Schulräumen und zu eLis auf Ebene der JVA wurden bestätigt und für{' '}
          {jvaName} gespeichert. Bei der nächsten jährlichen Prüfung werden diese Daten als
          Vorjahresstand angeboten.
        </KernAlert>
        <KernSpace size="large" />
        <KernButton type="button" variant="secondary" label="Zurück zur Übersicht" onClick={onBack} />
      </>
    );
  }

  if (step === 'jva') {
    return (
      <ElisJvaEbeneForm
        key={`${jvaId}-${mode}`}
        jvaId={jvaId}
        jvaName={jvaName}
        mode={mode}
        onBackToRooms={() => setStep('bestaetigung')}
        onFinished={() => setStep('abgeschlossen')}
      />
    );
  }

  if (step === 'bestaetigung') {
    return (
      <>
        <KernHeading level={1}>Prüfung der Angaben</KernHeading>
        <KernText>
          Bitte prüfen Sie alle Daten einschließlich geänderter und neu erfasster Zeilen. Stimmen die
          Angaben, geht es weiter zum Formular eLis auf Ebene der JVA. Andernfalls kehren Sie zur
          Bearbeitung zurück.
        </KernText>
        <KernSpace size="small" />
        <KernBadge label={jvaName} variant="info" />
        <KernSpace size="default" />
        <ElisReviewTable rows={rows} showStatus />
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
      <KernHeading level={1}>Formular Schulräume und eLis</KernHeading>
      <KernText muted>Strukturdaten · eLis</KernText>
      <KernSpace size="default" />
      {isJvaRole ? <KernBadge label={jvaName} variant="info" /> : null}
      <KernSpace size="small" />
      {lastChange ? (
        <>
          <KernText muted>{lastChange}</KernText>
          <KernSpace size="small" />
        </>
      ) : null}
      {isFolge ? (
        <KernText>
          Jährlich prüfen die Anstalten, ob die hinterlegten Daten zu den Schulräumen noch stimmen.
          Angezeigt werden die Daten des Vorjahres {ELIS_FORM_VORJAHR}. Bitte bestätigen Sie je Zeile,
          ob die Angaben noch korrekt sind. Die Aufgabe liegt häufig bei der Bauverwaltung, kann aber
          auch von anderen Stellen wahrgenommen werden.
        </KernText>
      ) : (
        <KernText>
          Die Schulräume müssen einmal vollständig neu erfasst werden. Legen Sie je Raum eine Zeile
          an und tragen Sie Bezeichnung, Fläche, eLis-Ausstattung, Schulplätze und gegebenenfalls
          PC-Plätze ein.
        </KernText>
      )}
      <KernSpace size="default" />
      {!isJvaRole ? (
        <>
          <KernSelect
            id="elis-form-jva"
            label="Anstalt"
            value={jvaId}
            onChange={(event) => applyContext(mode, event.target.value)}
          >
            {jvaOptions.map((jva) => (
              <option key={jva.id} value={jva.id}>
                {jva.name}
              </option>
            ))}
          </KernSelect>
          <KernSpace size="default" />
        </>
      ) : null}
      <KernSelect
        id="elis-form-mode"
        label="Erfassungsart"
        value={mode}
        onChange={(event) => {
          const next = event.target.value === 'erstfassung' ? 'erstfassung' : 'folgepruefung';
          applyContext(next, jvaId);
        }}
      >
        <option value="erstfassung">Erstmalige Erfassung</option>
        <option value="folgepruefung">Jährliche Prüfung der Vorjahresdaten</option>
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
        title={isFolge ? `Vorjahresdaten ${ELIS_FORM_VORJAHR}` : `Erfassung ${ELIS_FORM_ERFASSUNGSJAHR}`}
        subline={
          isFolge
            ? 'Bei „Nein“ können die Werte korrigiert werden. Bei „Ja“ bleiben sie gesperrt.'
            : 'Alle Felder sind frei bearbeitbar. Neue Zeilen können ergänzt werden.'
        }
      >
        <ElisCaptureTable
          mode={mode}
          rows={rows}
          onChange={updateRow}
          onRemove={(id) =>
            setRows((current) => {
              const next = current.filter((row) => row.id !== id);
              return next.length === 0 ? [createEmptyElisRow()] : next;
            })
          }
        />
        <KernSpace size="default" />
        <KernButton
          type="button"
          variant="secondary"
          label="Neue Zeile einfügen"
          onClick={() => setRows((current) => [...current, createEmptyElisRow()])}
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

function ElisCaptureTable({
  mode,
  rows,
  onChange,
  onRemove,
}: {
  mode: ElisFormMode;
  rows: ElisSchulraumFormRow[];
  onChange: (id: string, updater: (row: ElisSchulraumFormRow) => ElisSchulraumFormRow) => void;
  onRemove: (id: string) => void;
}) {
  const showKorrekt = mode === 'folgepruefung';

  return (
    <div className="w-full overflow-x-auto">
      <table className="w-max min-w-full border-collapse text-left">
        <thead>
          <tr>
            <th className={HEADER}>Raumbezeichnung</th>
            <th className={HEADER}>Größe in qm</th>
            <th className={HEADER}>eLis vorhanden?</th>
            <th className={HEADER}>Anzahl Schulplätze für Gefangene</th>
            <th className={HEADER}>Anzahl PC-Plätze eLis (inkl. Lehrkraft)</th>
            <th className={HEADER}>Anmerkungen</th>
            {showKorrekt ? <th className={HEADER}>Sind die Daten noch korrekt?</th> : null}
            <th className={HEADER}>Zeile</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row, index) => {
            const editable = canEditElisRow(mode, row);
            const isNew = isNewElisRow(row);
            const pcDisabled = !editable || row.elisVorhanden !== 'ja';

            return (
              <tr key={row.id} className={editable ? 'bg-white' : 'bg-slate-50'}>
                <td className={CELL}>
                  <input
                    className={INPUT_CLASS}
                    aria-label={`Raumbezeichnung Zeile ${index + 1}`}
                    value={row.designation}
                    disabled={!editable}
                    onChange={(event) =>
                      onChange(row.id, (current) => ({ ...current, designation: event.target.value }))
                    }
                  />
                </td>
                <td className={CELL}>
                  <input
                    className={`${INPUT_CLASS} min-w-[5.5rem] text-right`}
                    inputMode="decimal"
                    aria-label={`Größe in qm Zeile ${index + 1}`}
                    value={row.squareMeters}
                    disabled={!editable}
                    onChange={(event) =>
                      onChange(row.id, (current) => ({ ...current, squareMeters: event.target.value }))
                    }
                    onBlur={() => {
                      const parsed = parseDecimal2(row.squareMeters);
                      if (parsed != null) {
                        onChange(row.id, (current) => ({
                          ...current,
                          squareMeters: formatDecimal2(parsed),
                        }));
                      }
                    }}
                  />
                </td>
                <td className={CELL}>
                  <JaNeinRadios
                    name={`elis-${row.id}`}
                    value={row.elisVorhanden}
                    disabled={!editable}
                    ariaLabel={`eLis vorhanden Zeile ${index + 1}`}
                    onChange={(value) => onChange(row.id, (current) => applyElisVorhanden(current, value))}
                  />
                </td>
                <td className={CELL}>
                  <input
                    className={`${INPUT_CLASS} min-w-[5rem] text-right`}
                    inputMode="numeric"
                    aria-label={`Schulplätze Zeile ${index + 1}`}
                    value={row.schulplaetze}
                    disabled={!editable}
                    onChange={(event) =>
                      onChange(row.id, (current) => ({ ...current, schulplaetze: event.target.value }))
                    }
                  />
                </td>
                <td className={CELL}>
                  <input
                    className={`${INPUT_CLASS} min-w-[5rem] text-right`}
                    inputMode="numeric"
                    aria-label={`PC-Plätze eLis Zeile ${index + 1}`}
                    value={row.pcPlaetzeElis}
                    disabled={pcDisabled}
                    onChange={(event) =>
                      onChange(row.id, (current) => ({ ...current, pcPlaetzeElis: event.target.value }))
                    }
                  />
                </td>
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
                    {isNew ? (
                      <span className="text-sm text-slate-600">Neue Zeile</span>
                    ) : (
                      <JaNeinRadios
                        name={`korrekt-${row.id}`}
                        value={row.datenKorrekt}
                        ariaLabel={`Daten noch korrekt Zeile ${index + 1}`}
                        onChange={(value) => onChange(row.id, (current) => applyDatenKorrekt(current, value))}
                      />
                    )}
                  </td>
                ) : null}
                <td className={CELL}>
                  {isNew ? (
                    <KernButton
                      type="button"
                      variant="tertiary"
                      label="Entfernen"
                      onClick={() => onRemove(row.id)}
                    />
                  ) : (
                    <span className="text-sm text-slate-500">Vorjahr</span>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

function ElisReviewTable({
  rows,
  showStatus,
}: {
  rows: ElisSchulraumFormRow[];
  showStatus?: boolean;
}) {
  return (
    <div className="w-full overflow-x-auto rounded-xl border border-slate-200 bg-white">
      <table className="w-max min-w-full border-collapse text-left text-sm">
        <thead>
          <tr>
            {showStatus ? <th className={HEADER}>Status</th> : null}
            <th className={HEADER}>Raumbezeichnung</th>
            <th className={HEADER}>Größe in qm</th>
            <th className={HEADER}>eLis vorhanden?</th>
            <th className={HEADER}>Schulplätze</th>
            <th className={HEADER}>PC-Plätze eLis</th>
            <th className={HEADER}>Anmerkungen</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.id} className="bg-white">
              {showStatus ? (
                <td className={CELL}>{elisRowStatusLabel(elisRowStatus(row))}</td>
              ) : null}
              <td className={CELL}>{row.designation}</td>
              <td className={`${CELL} text-right tabular-nums`}>{row.squareMeters}</td>
              <td className={CELL}>{formatJaNein(row.elisVorhanden)}</td>
              <td className={`${CELL} text-right tabular-nums`}>{row.schulplaetze}</td>
              <td className={`${CELL} text-right tabular-nums`}>{row.pcPlaetzeElis}</td>
              <td className={CELL}>{row.anmerkung || '—'}</td>
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
        <input
          type="radio"
          name={name}
          checked={value === 'ja'}
          onChange={() => onChange('ja')}
        />
        Ja
      </label>
      <label className="inline-flex items-center gap-1.5 text-sm">
        <input
          type="radio"
          name={name}
          checked={value === 'nein'}
          onChange={() => onChange('nein')}
        />
        Nein
      </label>
    </fieldset>
  );
}
