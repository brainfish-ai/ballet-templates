const { deal_id } = input_data as { deal_id: string };

// Get full deal details from HubSpot with associations
const dealResult = metaphor.integration('hubspot', 'deals.get', {
  dealId: deal_id,
  properties: ['dealname', 'amount', 'closedate', 'hubspot_owner_id', 'hs_priority', 'notes_last_updated'],
  associations: ['contacts', 'companies'],
});

if (!dealResult.ok) {
  throw new Error(`Failed to fetch deal: ${dealResult.error}`);
}

const dealData = dealResult.data;
const deal = dealData.properties;

// Check required handoff fields
const requiredFields = ['dealname', 'amount', 'closedate'];
const missingFields = requiredFields.filter(f => !deal[f]);

if (missingFields.length > 0) {
  throw new Error(`Missing required handoff fields: ${missingFields.join(', ')}`);
}

// In a real implementation, fetch CS team emails from HubSpot or a config
const cs_team_emails = ['cs-team@example.com'];

const result = {
  deal: {
    id: deal_id,
    name: deal.dealname,
    amount: deal.amount,
    close_date: deal.closedate,
    owner_id: deal.hubspot_owner_id,
    priority: deal.hs_priority,
  },
  cs_team_emails,
};
