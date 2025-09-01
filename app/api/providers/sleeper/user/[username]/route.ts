import { NextResponse } from 'next/server';
import { getUserIdByUsername } from '../../../../../../lib/providers/sleeper';

export async function GET(_req: Request, { params }: { params: { username: string } }) {
  const userId = await getUserIdByUsername(params.username);
  return NextResponse.json({ userId });
}
