import crypto from 'crypto';

export function makeEventId(source: string, id: string): string {
  return crypto.createHash('sha256').update(`${source}_${id}`).digest('hex');
}
