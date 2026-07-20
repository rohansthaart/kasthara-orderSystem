export type LabelSettings = {
  widthMm: number;
  heightMm: number;
  marginMm: number;
  fontSize: number;
  dpi: number;
  showAddress: boolean;
  showNotes: boolean;
  showBalance: boolean;
  showRequiredAt: boolean;
};

export const DEFAULT_LABEL_SETTINGS: LabelSettings = {
  widthMm: 48,
  heightMm: 30,
  marginMm: 2,
  fontSize: 8,
  dpi: 203,
  showAddress: true,
  showNotes: true,
  showBalance: true,
  showRequiredAt: true,
};

export function normaliseLabelSettings(setting?: Partial<LabelSettings> | null): LabelSettings {
  const widthMm = clamp(setting?.widthMm ?? DEFAULT_LABEL_SETTINGS.widthMm, 20, 150);
  const heightMm = clamp(setting?.heightMm ?? DEFAULT_LABEL_SETTINGS.heightMm, 15, 150);
  return {
    widthMm,
    heightMm,
    marginMm: clamp(setting?.marginMm ?? DEFAULT_LABEL_SETTINGS.marginMm, 0, Math.min(10, Math.floor(Math.min(widthMm, heightMm) / 4))),
    fontSize: clamp(setting?.fontSize ?? DEFAULT_LABEL_SETTINGS.fontSize, 6, 18),
    dpi: clamp(setting?.dpi ?? DEFAULT_LABEL_SETTINGS.dpi, 150, 600),
    showAddress: setting?.showAddress ?? DEFAULT_LABEL_SETTINGS.showAddress,
    showNotes: setting?.showNotes ?? DEFAULT_LABEL_SETTINGS.showNotes,
    showBalance: setting?.showBalance ?? DEFAULT_LABEL_SETTINGS.showBalance,
    showRequiredAt: setting?.showRequiredAt ?? DEFAULT_LABEL_SETTINGS.showRequiredAt,
  };
}

export function mmToDots(mm: number, dpi: number) {
  return Math.max(1, Math.round((mm / 25.4) * dpi));
}

export function qrSizeMm(settings: LabelSettings) {
  const availableWidth = settings.widthMm - settings.marginMm * 2;
  const availableHeight = settings.heightMm - settings.marginMm * 2;
  return round(Math.max(6, Math.min(36, availableWidth * 0.34, availableHeight * 0.55)));
}

export function responsiveLabelFontSize(settings: LabelSettings) {
  const sizeScale = Math.min(settings.widthMm / 48, settings.heightMm / 30);
  return round(settings.fontSize * Math.min(2.5, Math.max(0.75, sizeScale)));
}

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, Math.round(Number(value))));
}

function round(value: number) {
  return Math.round(value * 10) / 10;
}
