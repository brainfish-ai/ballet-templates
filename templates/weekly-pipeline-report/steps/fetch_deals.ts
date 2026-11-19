const { report_date } = input_data as { report_date?: string };

// Search for all open deals in HubSpot
const dealResult = metaphor.integration('hubspot', 'deals.search', {
  filterGroups: [{
    filters: [
      { propertyName: 'hs_is_closed', operator: 'EQ', value: 'false' },
    ],
  }],
  properties: ['dealname', 'amount', 'dealstage', 'closedate', 'pipeline', 'hubspot_owner_id'],
  limit: 100,
});

if (!dealResult.ok) {
  throw new Error(`Failed to fetch deals: ${dealResult.error}`);
}

const dealData = dealResult.data?.results || [];

const deals = dealData.map((d: any) => ({
  id: d.id,
  name: d.properties.dealname,
  amount: parseFloat(d.properties.amount || '0'),
  stage: d.properties.dealstage,
  close_date: d.properties.closedate,
  pipeline: d.properties.pipeline,
  owner_id: d.properties.hubspot_owner_id,
}));

const report_date_value = report_date || new Date().toISOString().split('T')[0];

const result = {
  deals,
  report_date: report_date_value,
  count: deals.length,
};
