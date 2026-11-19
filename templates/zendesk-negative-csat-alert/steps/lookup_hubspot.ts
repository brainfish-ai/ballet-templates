const { requester_email } = input_data as { requester_email?: string };

let contact_id: string | null = null;
let owner_email: string | null = null;
let notes = '';

if (requester_email && requester_email !== 'unknown') {
  // Search for contact by email
  const searchResult = await metaphor.integration('hubspot', 'contacts.search', {
    filterGroups: [{
      filters: [{ propertyName: 'email', operator: 'EQ', value: requester_email }]
    }],
    properties: ['firstname', 'lastname', 'email', 'hubspot_owner_id', 'notes_last_updated'],
    limit: 1,
  });

  if (searchResult.ok && searchResult.data?.results?.length > 0) {
    const contact = searchResult.data.results[0];
    contact_id = contact.id;
    notes = contact.properties?.notes_last_updated || '';

    // Get owner email if available
    if (contact.properties?.hubspot_owner_id) {
      const ownerResult = await metaphor.integration('hubspot', 'api.get', {
        path: `/crm/v3/owners/${contact.properties.hubspot_owner_id}`,
      });
      if (ownerResult.ok) {
        owner_email = ownerResult.data?.data?.email || null;
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
