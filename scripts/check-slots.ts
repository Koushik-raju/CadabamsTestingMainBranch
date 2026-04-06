import 'dotenv/config';
import { CadabamsCRM } from '@cadabams/crm-sdk';
const sdk = new CadabamsCRM();
async function main() {
  const slots = await sdk.slots.getOpenSlots(86368);
  console.log('total slots:', slots.length);
  if (slots[0]) console.log('first slot:', JSON.stringify(slots[0], null, 2));
  else console.log('no slots for this doctor');
  // try getSlotPrice if slot exists
  if (slots[0]) {
    const p = await sdk.slots.getSlotPrice(slots[0].id);
    console.log('slot price:', JSON.stringify(p));
  }
}
main().catch(console.error);
