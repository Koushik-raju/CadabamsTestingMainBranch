import 'dotenv/config';
import { CadabamsCRM } from '@cadabams/crm-sdk';
const sdk = new CadabamsCRM();
async function main() {
  const start = new Date().toISOString().split('T')[0];
  const end = new Date(Date.now() + 90*24*60*60*1000).toISOString().split('T')[0];
  const res = await sdk.doctors.listWithSlots({ doctor_id: 86368, start_datetime: start, stop_datetime: end, book_appointments: true });
  console.log('KEYS:', Object.keys(res));
  const doc = res.doctors[0] as unknown as Record<string, unknown>;
  if (doc) console.log('DOC KEYS:', Object.keys(doc));
  console.log('RAW RES:', JSON.stringify(res, null, 2));
}
main().catch(console.error);
