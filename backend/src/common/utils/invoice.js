function getInvoiceCounterId(storeId, date = new Date()) {
  const yyyymm = `${date.getUTCFullYear()}${String(date.getUTCMonth() + 1).padStart(2, "0")}`;
  return `invoice:${storeId}:${yyyymm}`;
}

function formatInvoiceNumber(seq, date = new Date()) {
  const yyyymm = `${date.getUTCFullYear()}${String(date.getUTCMonth() + 1).padStart(2, "0")}`;
  return `INV-${yyyymm}-${String(seq).padStart(5, "0")}`;
}

module.exports = { getInvoiceCounterId, formatInvoiceNumber };
