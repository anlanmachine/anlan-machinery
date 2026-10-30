export type ShipmentMilestone = {
  port: string;
  date: string;
  status: 'completed'|'current'|'planned';
  note?: string;
};
export type TrackingShipment = {
  blNumber: string;
  containerNumbers: string[];
  carrier: string;
  origin: string;
  destination: string;
  currentVessel?: string;
  nextVessel?: string;
  eta?: string;
  etaType: 'estimated'|'confirmed'|'unknown';
  source: 'manual';
  updatedAt: string;
  milestones: ShipmentMilestone[];
};
export const normalizeTrackingNumber = (value:string) => value.toUpperCase().replace(/[\s-]/g,'').trim();
export const isTrackingNumber = (value:string) => /^[A-Z0-9]{7,22}$/.test(value);
