/**
 * Export data as CSV file and trigger download.
 *
 * @param {Object[]} data - Array of objects to export
 * @param {Object[]} columns - Array of { key, label } defining columns
 * @param {string} filename - Name of the downloaded file (without extension)
 */
export function exportToCsv(data, columns, filename = 'export') {
  if (!data?.length) return;

  const separator = ';';
  const header = columns.map((col) => `"${col.label}"`).join(separator);

  const rows = data.map((row) =>
    columns
      .map((col) => {
        const value = typeof col.key === 'function' ? col.key(row) : row[col.key];
        const str = value != null ? String(value) : '';
        return `"${str.replace(/"/g, '""')}"`;
      })
      .join(separator)
  );

  const bom = '\uFEFF';
  const csvContent = bom + [header, ...rows].join('\n');

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);

  const link = document.createElement('a');
  link.href = url;
  link.download = `${filename}.csv`;
  link.click();

  URL.revokeObjectURL(url);
}
