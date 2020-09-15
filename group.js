// Groups tickets by key eg. epic / developer and sorts by status (default)

const groupByKey = (tickets, groupKey, sortKey = 'status', nullValue = 'unassigned') => {
  return tickets
    .slice()
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
