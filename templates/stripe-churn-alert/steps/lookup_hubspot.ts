const { customer_email, customer_name } = input_data as { customer_email: string; customer_name: string };

const hubspotToken = metaphor.secret('HUBSPOT_ACCESS_TOKEN');

let contact_id: string | null = null;
let company_id: string | null = null;
let owner_email: string | null = null;
let notes = '';

if (customer_email && customer_email !== 'unknown') {
  const contactRes = await fetch(`https://api.hubapi.com/crm/v3/objects/contacts/search`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${hubspotToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      filterGroups: [{
        filters: [{ propertyName: 'email', operator: 'EQ', value: customer_email }]
      }],
      properties: ['firstname', 'lastname', 'email', 'hubspot_owner_id', 'notes_last_updated', 'hs_latest_source'],
      limit: 1,
    }),
  });

  if (contactRes.ok) {
    const contactData = await contactRes.json() as { results: Array<{ id: string; properties: Record<string, string>; associations?: { companies?: { results: Array<{ id: string }> } } }> };
    if (contactData.results.length > 0) {
      const contact = contactData.results[0];
      contact_id = contact.id;
      notes = contact.properties?.hs_latest_source ?? '';

      if (contact.properties?.hubspot_owner_id) {
        const ownerRes = await fetch(`https://api.hubapi.com/crm/v3/owners/${contact.properties.hubspot_owner_id}`, {
          headers: { 'Authorization': `Bearer ${hubspotToken}` },
        });
        if (ownerRes.ok) {
          const ownerData = await ownerRes.json() as { email?: string };
          owner_email = ownerData.email ?? null;
        }
      }

      const assocRes = await fetch(`https://api.hubapi.com/crm/v4/objects/contacts/${contact_id}/associations/companies`, {
        headers: { 'Authorization': `Bearer ${hubspotToken}` },
      });

      if (assocRes.ok) {
        const assocData = await assocRes.json() as { results: Array<{ toObjectId: string }> };
        if (assocData.results.length > 0) {
          company_id = assocData.results[0].toObjectId;
        }
      }
    }
  }
}

const result = {
  contact_id,
  company_id,
  owner_email,
  notes,
  found: !!contact_id,
};
