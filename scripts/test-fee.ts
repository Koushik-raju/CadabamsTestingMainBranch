import 'dotenv/config';
import { CadabamsCRM } from '@cadabams/crm-sdk';
const sdk = new CadabamsCRM();
async function main() {
  try {
    const slots = await sdk.slots.getOpenSlots(86368);
    console.log('slots count:', slots.length);
    console.log('first 2:', JSON.stringify(slots.slice(0,2), null, 2));
  } catch(e) {
    console.error('getOpenSlots error:', e);
  }
  try {
    const products = await sdk.packages.getProducts();
    console.log('products count:', (products as unknown[]).length);
    console.log('first 3:', JSON.stringify((products as unknown[]).slice(0,3), null, 2));
  } catch(e) {
    console.error('getProducts error:', e);
  }
}
main();
