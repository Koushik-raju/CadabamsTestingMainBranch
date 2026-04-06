import 'dotenv/config';
import { CadabamsCRM } from '@cadabams/crm-sdk';
const sdk = new CadabamsCRM();
async function main() {
  // Get all doctors first
  const res = await sdk.doctors.listWithSlots({ speciality_id: 1 });
  const ids = res.doctors.slice(0, 5).map(d => d.id);
  console.log('Testing doctor IDs:', ids);
  
  const start = new Date().toISOString().split('T')[0];
  const end = new Date(Date.now() + 90*24*60*60*1000).toISOString().split('T')[0];
  
  for (const id of ids) {
    const r = await sdk.doctors.listWithSlots({ doctor_id: id, start_datetime: start, stop_datetime: end, book_appointments: true }) as unknown as Record<string, unknown>;
    const avail = r.availability as Record<string, {available: boolean; slots?: unknown[]}>;
    const availDates = Object.entries(avail).filter(([, v]) => v.available);
    console.log(`Doctor ${id}: ${availDates.length} available dates`);
    if (availDates.length > 0) {
      console.log('Sample:', JSON.stringify(availDates[0]));
    }
  }
}
main().catch(console.error);
