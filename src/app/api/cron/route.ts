import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'https://asaliswad-backend.onrender.com';
    
    // Call backend order auto-completion API
    await fetch(`${backendUrl}/api/v1/cron/customer/auto-complete-orders`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      cache: 'no-store'
    }).catch(() => null);

    return NextResponse.json({
      success: true,
      domain: 'asaliswad.com',
      service: 'Customer Storefront Cron',
      timestamp: new Date().toISOString()
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST() {
  return GET();
}
