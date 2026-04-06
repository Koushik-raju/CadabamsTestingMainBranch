import 'dotenv/config';
import { CadabamsCRM } from '@cadabams/crm-sdk';
const sdk = new CadabamsCRM();
async function main() {
  const start = new Date().toISOString().split('T')[0];
  const end = new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
  const res = await sdk.doctors.listWithSlots({ speciality_id: 1, start_datetime: start, stop_datetime: end });
  const first = res.doctors[0] as unknown as Record<string, unknown>;
  console.log('ALL KEYS:', Object.keys(first));
  console.log('FULL DOC:', JSON.stringify(first, null, 2));
}
main().catch(console.error);
