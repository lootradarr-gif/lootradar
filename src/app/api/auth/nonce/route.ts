import { NextResponse } from 'next/server';
import { makeNonce } from '@/lib/user-auth';

// İstemci imzalamadan önce buradan taze bir nonce alır.
export async function GET() {
  return NextResponse.json({ nonce: makeNonce() });
}
