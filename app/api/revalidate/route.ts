import { NextRequest, NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';

export async function POST(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const secret = searchParams.get('secret');

  if (secret !== process.env.REVALIDATION_SECRET) {
    return new NextResponse('Unauthorized', { status: 401 });
  }

  try {
    revalidatePath('/');
    revalidatePath('/api/events');
    return NextResponse.json({ revalidated: true, now: Date.now() });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Revalidation failed';
    return NextResponse.json({ message }, { status: 500 });
  }
}
