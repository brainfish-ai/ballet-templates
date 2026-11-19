const { report_date } = input_data as { report_date?: string };

const hubspotToken = metaphor.secret('HUBSPOT_ACCESS_TOKEN');

const dealRes = await fetch(`https://api.hubapi.com/crm/v3/objects/deals/search`, {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${hubspotToken}`,
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    filterGroups: [{
      filters: [
        { propertyName: 'hs_is_closed', operator: 'EQ', value: 'false' },
      ],
    }],
    properties: ['dealname', 'amount', 'dealstage', 'closedate', 'pipeline', 'hubspot_owner_id'],
    limit: 100,
  }),
});

if (!dealRes.ok) {
  throw new Error(`HubSpot API error: ${dealRes.status} ${dealRes.statusText}`);
}

const dealData = await dealRes.json() as {
  results: Array<{
    id: string;
    properties: {
      dealname: string;
      amount?: string;
      dealstage: string;
      closedate?: string;
      pipeline?: string;
      hubspot_owner_id?: string;
    };
  }>;
};

const deals = dealData.results.map(d => ({
  id: d.id,
  name: d.properties.dealname,
  amount: parseFloat(d.properties.amount ?? '0'),
  stage: d.properties.dealstage,
  close_date: d.properties.closedate,
  pipeline: d.properties.pipeline,
  owner_id: d.properties.hubspot_owner_id,
}));

const report_date_value = report_date ?? new Date().toISOString().split('T')[0];

const result = {
  deals,
  report_date: report_date_value,
  count: deals.length,
};
