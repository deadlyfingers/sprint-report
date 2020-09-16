// Groups tickets by key eg. epic / developer
// sort by status (default)
// filter by status CLOSED (default)
// if developer is null use 'unassigned' (default)

const groupByKey = (tickets, groupKey, sortKey = 'status', filterStatus = 'CLOSED', nullValue = 'unassigned') => {
  return tickets
    .slice()
    .filter(t => filterStatus ? t.status === filterStatus : true )
    .sort((a,b) => (a[sortKey] || nullValue).localeCompare((b[sortKey] || nullValue)))
    .reduce((a,c) => {
    const key = c[groupKey] || nullValue;
    const data = Object.assign({issue: `${c.key} ${c.summary}`}, c);
    if (a[key]) {
      a[key].push(data);
    } else {
      a[key] = [data];
    }
    return a;
  }, {});
}

exports.groupByKey = groupByKey;
