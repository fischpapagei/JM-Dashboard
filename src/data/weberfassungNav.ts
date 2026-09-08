export type WeberfassungCategoryKey = "strukturdaten" | "haushalt";

export type WeberfassungFormKey =
  | "strukturdaten-schulische-bildung"
  | "strukturdaten-berufliche-bildung"
  | "strukturdaten-betriebe"
  | "strukturdaten-elis"
  | "haushalt-anmeldungen-arbeit-berufliche-bildung"
  | "haushalt-anmeldungen-schulische-bildung"
  | "haushalt-pruefung-fb-paedagogik"
  | "haushalt-pruefung-zbi";

export type WeberfassungView = "overview" | WeberfassungFormKey;

export interface WeberfassungFormItem {
  key: WeberfassungFormKey;
  label: string;
}

export interface WeberfassungCategory {
  key: WeberfassungCategoryKey;
  label: string;
  items: WeberfassungFormItem[];
}

export const WEBERFASSUNG_CATEGORIES: WeberfassungCategory[] = [
  {
    key: "strukturdaten",
    label: "Strukturdaten",
    items: [
      { key: "strukturdaten-schulische-bildung", label: "Schulische Bildung" },
      { key: "strukturdaten-berufliche-bildung", label: "Berufliche Bildung" },
      { key: "strukturdaten-betriebe", label: "Betriebe" },
      { key: "strukturdaten-elis", label: "eLis" },
    ],
  },
  {
    key: "haushalt",
    label: "Haushalt",
    items: [
      {
        key: "haushalt-anmeldungen-arbeit-berufliche-bildung",
        label: "Anmeldungen Arbeit und berufliche Bildung",
      },
      { key: "haushalt-anmeldungen-schulische-bildung", label: "Anmeldungen schulische Bildung" },
      { key: "haushalt-pruefung-fb-paedagogik", label: "Prüfung FB Pädagogik" },
      { key: "haushalt-pruefung-zbi", label: "Prüfung ZBI" },
    ],
  },
];

const FORM_LABELS = Object.fromEntries(
  WEBERFASSUNG_CATEGORIES.flatMap((category) => category.items.map((item) => [item.key, item.label])),
) as Record<WeberfassungFormKey, string>;

export function getWeberfassungFormLabel(key: WeberfassungFormKey): string {
  return FORM_LABELS[key];
}

export function getWeberfassungCategoryForForm(key: WeberfassungFormKey): WeberfassungCategoryKey {
  return key.startsWith("strukturdaten-") ? "strukturdaten" : "haushalt";
}

export function isWeberfassungFormView(view: WeberfassungView): view is WeberfassungFormKey {
  return view !== "overview";
}
