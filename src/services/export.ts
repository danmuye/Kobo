import type { Transaction } from "@/types";

export type ExportFormat = "csv" | "excel" | "pdf";

interface ExportMeta {
  title: string;
  dateRange: string;
  filters: string[];
}

function buildRows(transactions: Transaction[], meta: ExportMeta): string[][] {
  const header = ["Date", "Description", "Category", "Account", "Type", "Amount"];
  const metaRows: string[][] = [
    [`Report: ${meta.title}`],
    [`Date Range: ${meta.dateRange}`],
  ];
  if (meta.filters.length > 0) {
    metaRows.push([`Filters: ${meta.filters.join(", ")}`]);
  }
  metaRows.push([]);
  return [
    ...metaRows,
    header,
    ...transactions.map((t) => [
      t.date,
      t.description,
      t.category,
      t.account,
      t.type,
      String(t.amount),
    ]),
  ];
}

function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export function exportToCsv(transactions: Transaction[], meta: ExportMeta) {
  const rows = buildRows(transactions, meta);
  const csv = rows
    .map((r) => r.map((c) => `"${c.replace(/"/g, '""')}"`).join(","))
    .join("\n");
  const bom = "\uFEFF";
  const blob = new Blob([bom + csv], { type: "text/csv;charset=utf-8;" });
  downloadBlob(blob, `${meta.title.replace(/\s+/g, "-").toLowerCase()}.csv`);
}

export function exportToExcel(transactions: Transaction[], meta: ExportMeta) {
  const rows = buildRows(transactions, meta);

  let table = `<table>`;
  for (const row of rows) {
    table += "<tr>";
    for (const cell of row) {
      const tag = row === rows[0] || row === rows[4] || row.length === 1 ? "th" : "td";
      table += `<${tag}>${cell}</${tag}>`;
    }
    table += "</tr>";
  }
  table += "</table>";

  const html = `
    <html xmlns:o="urn:schemas-microsoft-com:office:office"
          xmlns:x="urn:schemas-microsoft-com:office:excel"
          xmlns="http://www.w3.org/TR/REC-html40">
      <head><meta charset="UTF-8"><!--[if gte mso 9]><xml><x:ExcelWorkbook><x:ExcelWorksheets><x:ExcelWorksheet><x:Name>Report</x:Name></x:ExcelWorksheet></x:ExcelWorksheets></x:ExcelWorkbook></xml><![endif]--></head>
      <body>${table}</body>
    </html>`;

  const blob = new Blob([html], { type: "application/vnd.ms-excel;charset=utf-8" });
  downloadBlob(blob, `${meta.title.replace(/\s+/g, "-").toLowerCase()}.xls`);
}

export function exportToPdf(transactions: Transaction[], meta: ExportMeta) {
  const printWindow = window.open("", "_blank");
  if (!printWindow) {
    // Fallback: use a same-page print
    window.print();
    return;
  }

  const rows = buildRows(transactions, meta);
  let tableRows = "";
  for (let i = 0; i < rows.length; i++) {
    const isHeader = i === 4 || rows[i].length === 1;
    const tag = isHeader ? "th" : "td";
    tableRows += "<tr>";
    for (const cell of rows[i]) {
      tableRows += `<${tag}>${cell}</${tag}>`;
    }
    tableRows += "</tr>";
  }

  printWindow.document.write(`
    <!DOCTYPE html>
    <html>
      <head>
        <title>${meta.title}</title>
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; padding: 40px; color: #1a1a2e; }
          h1 { font-size: 24px; margin-bottom: 4px; }
          .meta { color: #666; font-size: 13px; margin-bottom: 20px; }
          table { width: 100%; border-collapse: collapse; font-size: 12px; }
          th, td { padding: 8px 12px; text-align: left; border-bottom: 1px solid #e2e8f0; }
          th { background: #f8fafc; font-weight: 600; }
          tr:first-child th { font-size: 14px; background: transparent; }
          .filters { font-size: 12px; color: #666; margin-bottom: 16px; }
          @media print { body { padding: 20px; } }
        </style>
      </head>
      <body>
        <h1>${meta.title}</h1>
        <p class="meta">${meta.dateRange}${meta.filters.length ? " &mdash; " + meta.filters.join(", ") : ""}</p>
        <table>${tableRows}</table>
        <script>window.onload = function() { window.print(); window.close(); };<${"script"}>
      </body>
    </html>
  `);
  printWindow.document.close();
}
