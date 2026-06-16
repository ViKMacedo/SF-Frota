export const TRACKING_STATUS = {
  STOPPED: "Parado",
  EN_ROUTE: "Em rota",
  FINISHING: "Finalizando",
} as const;

export type TrackingStatus =
  (typeof TRACKING_STATUS)[keyof typeof TRACKING_STATUS];
