const { customer_email, payment_status, failure_summary } = input_data as {
  customer_email: string;
  payment_status: string;
  failure_summary: string;
};

const hubspotToken = metaphor.secret('HUBSPOT_ACCESS_TOKEN');

let contact_id: string | null = null;
let company_id: string | null = null;

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
      properties: ['email', 'hubspot_owner_id'],
      limit: 1,
    }),
  });

  if (contactRes.ok) {
    const contactData = await contactRes.json() as { results: Array<{ id: string; properties: Record<string, string> }> };
    if (contactData.results.length > 0) {
      contact_id = contactData.results[0].id;

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

if (contact_id) {
  const updateRes = await fetch(`https://api.hubapi.com/crm/v3/objects/contacts/${contact_id}`, {
    method: 'PATCH',
    headers: {
      'Authorization': `Bearer ${hubspotToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      properties: {
        payment_status,
      },
    }),
  });

  if (!updateRes.ok) {
    const errorText = await updateRes.text();
    throw new Error(`HubSpot contact update failed: ${updateRes.status} ${errorText}`);
  }

  const noteRes = await fetch(`https://api.hubapi.com/crm/v3/objects/notes`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${hubspotToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      properties: {
        hs_note_body: `Stripe Payment Failure\n\n${failure_summary}\n\nLogged automatically by Ballet.`,
        hs_timestamp: new Date().toISOString(),
      },
      associations: [{
        to: { id: contact_id },
        types: [{ associationCategory: 'HUBSPOT_DEFINED', associationTypeId: 202 }],
      }],
    }),
  });

  if (!noteRes.ok) {
    const errorText = await noteRes.text();
    throw new Error(`HubSpot note creation failed: ${noteRes.status} ${errorText}`);
  }
}

const result = {
  contact_id,
  company_id,
  updated: !!contact_id,
};
