import { NextRequest, NextResponse } from 'next/server';
import { readCollection } from '@/lib/cms-store';
import { isTrackingNumber, normalizeTrackingNumber, type TrackingShipment } from '@/lib/shipment-tracking';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const number = normalizeTrackingNumber(request.nextUrl.searchParams.get('number') || '');
  const headers = { 'Cache-Control': 'private, no-store, max-age=0' };
  if (!isTrackingNumber(number)) {
    return NextResponse.json({ error: 'Enter a valid B/L or container number.' }, { status: 400, headers });
  }
  try {
    const shipments = await readCollection<TrackingShipment[]>('shipments', []);
    const shipment = shipments.find(item =>
      item.published &&
      (normalizeTrackingNumber(item.blNumber) === number ||
       item.containerNumbers.some(container => normalizeTrackingNumber(container) === number))
    );
    if (!shipment) return NextResponse.json({
      error: 'No registered shipment was found for that number. Please contact AOLAN Machinery for assistance.'
    }, { status: 404, headers });
    return NextResponse.json({ shipment }, { headers });
  } catch {
    return NextResponse.json({ error: 'Tracking information is temporarily unavailable.' }, { status: 503, headers });
  }
}
