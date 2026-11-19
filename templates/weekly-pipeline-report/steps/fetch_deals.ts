const { report_date } = input_data as { report_date?: string };

// Only fetch open deals
const dealResult = await metaphor.integration('hubspot', 'deals.search', {
  filterGroups: [{
    filters: [
      { propertyName: 'hs_is_closed', operator: 'EQ', value: 'false' },
    ],
  }],
  properties: ['dealname', 'amount', 'dealstage', 'closedate', 'pipeline', 'hubspot_owner_id'],
  limit: 100,
  after: 0,
});

if (!dealResult.ok) {
  throw new Error(`Failed to fetch deals: ${dealResult.error?.message ?? JSON.stringify(dealResult.error)}`);
}

// Paginate if needed
let allDeals = dealResult.data?.results || [];
let after = dealResult.data?.paging?.next?.after;

while (after) {
  const nextResult = await metaphor.integration('hubspot', 'deals.search', {
    filterGroups: [{
      filters: [
        { propertyName: 'hs_is_closed', operator: 'EQ', value: 'false' },
      ],
    }],
    properties: ['dealname', 'amount', 'dealstage', 'closedate', 'pipeline', 'hubspot_owner_id'],
    limit: 100,
    after,
  });
  
  if (nextResult.ok && nextResult.data?.results) {
    allDeals = allDeals.concat(nextResult.data.results);
    after = nextResult.data?.paging?.next?.after;
  } else {
    break;
  }
}

const result = {
  deals: allDeals.map((d: any) => ({
    id: d.id,
    name: d.properties.dealname,
    amount: parseFloat(d.properties.amount || '0'),
    stage: d.properties.dealstage,
    close_date: d.properties.closedate,
    pipeline: d.properties.pipeline,
    owner_id: d.properties.hubspot_owner_id,
  })),
  report_date: report_date || new Date().toISOString().split('T')[0],
  count: allDeals.length,
};
