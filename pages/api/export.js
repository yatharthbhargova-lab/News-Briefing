export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).end();
  const { type, data, title } = req.body;

  if (type === "csv") {
    // Generate CSV for Excel
    const rows = data || [];
    if (!rows.length) return res.status(400).json({ error: "No data" });
    const headers = Object.keys(rows[0]);
    const csv = [
      headers.join(","),
      ...rows.map(row =>
        headers.map(h => {
          const val = String(row[h] || "").replace(/"/g, '""');
          return val.includes(",") ? `"${val}"` : val;
        }).join(",")
      ),
    ].join("\n");

    res.setHeader("Content-Type", "text/csv");
    res.setHeader("Content-Disposition", `attachment; filename="${title || "export"}.csv"`);
    return res.send(csv);
  }

  if (type === "html-pdf") {
    // Generate HTML for PDF printing
    const html = `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<title>${title || "TATA 1MG Intelligence Report"}</title>
<style>
  body { font-family: Georgia, serif; color: #1a1510; background: #fff; margin: 32px; font-size: 12px; }
  h1 { font-size: 22px; font-weight: normal; margin-bottom: 4px; color: #1a1510; }
  h2 { font-size: 14px; font-weight: bold; margin: 20px 0 8px; color: #c47000; text-transform: uppercase; letter-spacing: 0.1em; }
  .meta { color: #888; font-size: 11px; margin-bottom: 20px; }
  table { border-collapse: collapse; width: 100%; margin-bottom: 20px; }
  th { font-size: 9px; text-transform: uppercase; letter-spacing: 0.08em; color: #888; padding: 8px 10px; border-bottom: 2px solid #e0dbd0; text-align: left; }
  td { padding: 8px 10px; border-bottom: 1px solid #e0dbd0; font-size: 11px; }
  tr:nth-child(even) td { background: #faf8f3; }
  .benchmark { background: #fff8ec; }
  .benchmark td { color: #c47000; font-weight: bold; }
  .footer { margin-top: 30px; font-size: 10px; color: #bbb; text-align: center; }
  @media print { body { margin: 16px; } }
</style>
</head>
<body>
  <h1>${title || "Competitive Financial Intelligence"}</h1>
  <div class="meta">TATA 1MG · Generated ${new Date().toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}</div>
  ${generateHTMLContent(data)}
  <div class="footer">Confidential — TATA 1MG Internal Use Only</div>
</body>
</html>`;

    res.setHeader("Content-Type", "text/html");
    res.setHeader("Content-Disposition", `attachment; filename="${title || "report"}.html"`);
    return res.send(html);
  }

  res.status(400).json({ error: "Invalid export type" });
}

function generateHTMLContent(data) {
  if (!data) return "<p>No data available.</p>";

  let html = "";

  if (data.summary) html += `<h2>Summary</h2><p>${data.summary}</p>`;

  if (Array.isArray(data.companies || data.rows)) {
    const rows = data.companies || data.rows;
    if (rows.length > 0) {
      const headers = Object.keys(rows[0]);
      html += `<h2>Competitor Data</h2>
<table>
  <thead><tr>${headers.map(h => `<th>${h.replace(/_/g, " ")}</th>`).join("")}</tr></thead>
  <tbody>`;
      if (data.benchmark) {
        html += `<tr class="benchmark">${headers.map(h => `<td>${data.benchmark[h] || "—"}</td>`).join("")}</tr>`;
      }
      rows.forEach(row => {
        html += `<tr>${headers.map(h => `<td>${row[h] || "—"}</td>`).join("")}</tr>`;
      });
      html += "</tbody></table>";
    }
  }

  if (data.insights && Array.isArray(data.insights)) {
    html += `<h2>Key Insights</h2><ul>${data.insights.map(i => `<li>${i}</li>`).join("")}</ul>`;
  }

  return html || "<p>Report data included.</p>";
}
