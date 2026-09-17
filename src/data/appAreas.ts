export type MainAppArea = 'kennzahlen' | 'berichte' | 'weberfassung' | 'beschaeftigungsportal';

export const MAIN_APP_AREAS: { id: MainAppArea; label: string }[] = [
  { id: 'kennzahlen', label: 'Kennzahlensystem' },
  { id: 'berichte', label: 'Berichte' },
  { id: 'weberfassung', label: 'Web-Erfassung' },
  { id: 'beschaeftigungsportal', label: 'Beschäftigungsportal' },
];

export function isMainAppArea(value: string): value is MainAppArea {
  return MAIN_APP_AREAS.some((area) => area.id === value);
}
