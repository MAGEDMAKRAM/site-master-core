// *** CONFIG: CSV files auto-loaded from same folder as index.html ***
const AUTO_CSV_FILES = [
  "CAIRO-GIZA.csv",
  "Giza-Alex-Classification-2024.csv",
  "SITE-MANAGEMENT.csv",
  "All-Nigh.csv",
  "sites_master_flat.csv",
  "GRD.csv",
  "SOC.csv",
  "sites_master_consolidated.csv"
];

// *** CSV PARSER (simple) ***
function parseCSV(text) {
  const lines = text.split(/\r?\n/).filter(l => l.trim().length > 0);
  if (!lines.length) return { headers: [], rows: [] };
  const headers = lines[0].split(",").map(h => h.trim());
  const pickCols = pickImportantColumns(headers);
  const rows = [];
  for (let i = 1; i < lines.length; i++) {
    const cols = lines[i].split(",");
    if (cols.length === 1 && cols[0].trim() === "") continue;
    const row = {};
    pickCols.forEach(idx => {
      const h = headers[idx];
      row[h] = (cols[idx] || "").trim();
    });
    rows.push(row);
  }
  return { headers: pickCols.map(i => headers[i]), rows };
}

function pickImportantColumns(headers) {
  const importantNames = [
    "SiteID","SiteId","SITEID","Site","SiteName","Site Name",
    "Region","Subarea","MajorArea","MinorArea","City",
    "Address","Latitude","Longitude","Status","Priority",
    "Vendor","Technology","TeamOwner","Team Owner","IsHub"
  ];
  const picked = [];
  headers.forEach((h, idx) => {
    if (importantNames.some(k => h.toLowerCase().includes(k.toLowerCase()))) {
      picked.push(idx);
    }
  });
  if (!picked.length) {
    const n = Math.min(25, headers.length);
    for (let i = 0; i < n; i++) picked.push(i);
  }
  return picked;
}
