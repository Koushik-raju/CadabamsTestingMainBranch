import 'dotenv/config';
import { CadabamsCRM } from '@cadabams/crm-sdk';
const sdk = new CadabamsCRM();
async function main() {
  // Doctor 23040 has 78 available dates
  try {
    const slots = await sdk.slots.getOpenSlots(23040);
    console.log('slots count:', slots.length);
    if (slots[0]) console.log('first slot:', JSON.stringify(slots[0]));
  } catch(e: unknown) {
    const err = e as { statusCode?: number; message?: string };
    console.error('ERROR statusCode:', err.statusCode, 'message:', err.message);
  }
}
main().catch(console.error);
