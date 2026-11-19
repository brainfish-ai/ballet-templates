const { lead_id, brief, rating } = input_data as {
  lead_id: string;
  brief: string;
  rating: string;
};

// Update Lead record in Salesforce
const updateResult = await metaphor.integration('salesforce', 'records.update', {
  sobject: 'Lead',
  id: lead_id,
  fields: {
    Description: brief,
    Rating: rating,
  },
});

if (!updateResult.ok) {
  throw new Error(`Failed to update Lead: ${updateResult.error?.message ?? JSON.stringify(updateResult.error)}`);
}

const result = {
  updated: true,
  lead_id,
  rating,
};
