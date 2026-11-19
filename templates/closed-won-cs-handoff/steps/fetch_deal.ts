const { deal_id } = input_data as { deal_id: string };

const hubspotToken = metaphor.secret('HUBSPOT_ACCESS_TOKEN');

const dealRes = await fetch(`https://api.hubapi.com/crm/v3/objects/deals/${deal_id}?properties=dealname,amount,closedate,hubspot_owner_id,hs_priority,notes_last_updated`, {
  headers: {
    'Authorization': `Bearer ${hubspotToken}`,
  },
});

if (!dealRes.ok) {
  throw new Error(`HubSpot API error: ${dealRes.status} ${dealRes.statusText}`);
}

const dealData = await dealRes.json() as { properties: Record<string, string> };
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
