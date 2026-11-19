const { requester_email } = input_data as { requester_email?: string };

const hubspotToken = metaphor.secret('HUBSPOT_ACCESS_TOKEN');

let contact_id: string | null = null;
let owner_email: string | null = null;
let owner_slack_id: string | null = null;
let notes = '';

if (requester_email && requester_email !== 'unknown') {
  const contactRes = await fetch(`https://api.hubapi.com/crm/v3/objects/contacts/search`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${hubspotToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      filterGroups: [{
        filters: [{ propertyName: 'email', operator: 'EQ', value: requester_email }]
      }],
      properties: ['firstname', 'lastname', 'email', 'hubspot_owner_id', 'notes_last_updated'],
      limit: 1,
    }),
  });

  if (contactRes.ok) {
    const contactData = await contactRes.json() as { results: Array<{ id: string; properties: Record<string, string> }> };
    if (contactData.results.length > 0) {
      const contact = contactData.results[0];
      contact_id = contact.id;
      notes = contact.properties?.notes_last_updated ?? '';

      if (contact.properties?.hubspot_owner_id) {
        const ownerRes = await fetch(`https://api.hubapi.com/crm/v3/owners/${contact.properties.hubspot_owner_id}`, {
          headers: { 'Authorization': `Bearer ${hubspotToken}` },
        });
        if (ownerRes.ok) {
          const ownerData = await ownerRes.json() as { email?: string };
          owner_email = ownerData.email ?? null;
        }
      }
    }
  }
}

const result = {
  contact_id,
  owner_email,
  notes,
  found: !!contact_id,
};
