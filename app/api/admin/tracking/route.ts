import { NextRequest, NextResponse } from 'next/server';
import { readCollection, writeCollection } from '@/lib/cms-store';
import { isTrackingNumber, normalizeTrackingNumber, type TrackingShipment, type ShipmentMilestone } from '@/lib/shipment-tracking';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

function authorized(request: NextRequest) {
  return Boolean(process.env.ADMIN_PASSWORD) && request.headers.get('x-admin-password') === process.env.ADMIN_PASSWORD;
}
function denied() { return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 }); }
function clean(value: unknown, limit = 160) { return String(value ?? '').trim().slice(0, limit); }
function normalize(body: Record<string, unknown>, publishedBefore?: TrackingShipment): TrackingShipment {
  const blNumber = normalizeTrackingNumber(clean(body.blNumber));
  if (!isTrackingNumber(blNumber)) throw new Error('A valid master B/L number is required.');
  const containers = Array.isArray(body.containerNumbers) ? body.containerNumbers : [];
  const containerNumbers = Array.from(new Set(containers.map(v => normalizeTrackingNumber(clean(v))).filter(isTrackingNumber))).slice(0, 30);
  const origin = clean(body.origin);
  const destination = clean(body.destination);
  const carrier = clean(body.carrier, 80);
  if (!origin || !destination || !carrier) throw new Error('Carrier, origin, and destination are required.');
  const possible = Array.isArray(body.milestones) ? body.milestones : [];
  const milestones: ShipmentMilestone[] = possible.slice(0, 30).map(item => {
    const raw = (item && typeof item === 'object') ? item as Record<string, unknown> : {};
    const port = clean(raw.port);
    const date = clean(raw.date, 40);
    const note = clean(raw.note, 200);
    const status = raw.status === 'completed' || raw.status === 'current' || raw.status === 'planned' ? raw.status : 'planned';
    return { port, date, note, status };
  }).filter(item => item.port);
  const eta = clean(body.eta, 40);
  return {
    blNumber, containerNumbers, origin, destination, carrier,
    currentVessel: clean(body.currentVessel),
    nextVessel: clean(body.nextVessel),
    eta,
    etaType: body.etaType === 'confirmed' || body.etaType === 'estimated' ? body.etaType : 'unknown',
    source: 'manual',
    published: typeof body.published === 'boolean' ? body.published : (publishedBefore?.published ?? false),
    updatedAt: new Date().toISOString(),
    milestones
  };
}
async function all() { return readCollection<TrackingShipment[]>('shipments', []); }

export async function GET(request: NextRequest) {
  if (!authorized(request)) return denied();
  return NextResponse.json({ shipments: await all() }, { headers: { 'Cache-Control': 'no-store' } });
}

export async function POST(request: NextRequest) {
  if (!authorized(request)) return denied();
  try {
    const body = await request.json() as Record<string, unknown>;
    const item = normalize(body);
    const shipments = await all();
    if (shipments.some(s => normalizeTrackingNumber(s.blNumber) === item.blNumber)) {
      return NextResponse.json({ error: 'This B/L already exists. Edit it instead.' }, { status: 409 });
    }
    shipments.push(item);
    await writeCollection('shipments', shipments);
    return NextResponse.json({ shipment: item }, { status: 201 });
  } catch(error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Unable to save shipment.' }, { status: 400 });
  }
}

export async function PUT(request: NextRequest) {
  if (!authorized(request)) return denied();
  try {
    const body = await request.json() as Record<string, unknown>;
    const key = normalizeTrackingNumber(clean(body.originalBlNumber || body.blNumber));
    const shipments = await all();
    const index = shipments.findIndex(s => normalizeTrackingNumber(s.blNumber) === key);
    if (index < 0) return NextResponse.json({ error: 'Shipment not found.' }, { status: 404 });
    const item = normalize(body, shipments[index]);
    if (shipments.some((s, i) => i !== index && normalizeTrackingNumber(s.blNumber) === item.blNumber)) {
      return NextResponse.json({ error: 'Another shipment has this B/L.' }, { status: 409 });
    }
    shipments[index] = item;
    await writeCollection('shipments', shipments);
    return NextResponse.json({ shipment: item });
  } catch(error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Unable to update shipment.' }, { status: 400 });
  }
}

export async function DELETE(request: NextRequest) {
  if (!authorized(request)) return denied();
  const number = normalizeTrackingNumber(request.nextUrl.searchParams.get('number') || '');
  if (!isTrackingNumber(number)) return NextResponse.json({ error: 'Invalid B/L.' }, { status: 400 });
  const shipments = await all();
  const remaining = shipments.filter(s => normalizeTrackingNumber(s.blNumber) !== number);
  if (remaining.length === shipments.length) return NextResponse.json({ error: 'Shipment not found.' }, { status: 404 });
  await writeCollection('shipments', remaining);
  return NextResponse.json({ success: true });
}
