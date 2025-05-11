// Organization info
console.log('\nORGANIZATION INFO:');
if (deal.org_id) {
  console.log(`Type: ${typeof deal.org_id}`);
  console.log(`Full value: ${JSON.stringify(deal.org_id)}`);
  console.log(`Direct access to value property: ${deal.org_id.value}`);
  console.log(`Type of value property: ${typeof deal.org_id.value}`);
  console.log('\nOrganization object properties:');
  
  if (typeof deal.org_id === 'object') {
    Object.keys(deal.org_id).forEach(key => {
      console.log(`  ${key}: ${JSON.stringify(deal.org_id[key])} (${typeof deal.org_id[key]})`);
    });
  }
} else {
  console.log('No organization associated with this deal');
} 