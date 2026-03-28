export function formatMoney(n: number, currency = "USD") {
  try {
    const formatted = new Intl.NumberFormat(undefined, { style: "currency", currency }).format(n);
    // Replace USD "$" output with "Rs" as requested.
    return formatted.replace(/US\$/g, "Rs ").replace(/\$/g, "Rs ");
  } catch {
    return `${currency} ${n.toFixed(2)}`;
  }
}

export function formatDate(iso: string) {
  try {
    return new Date(iso).toLocaleDateString();
  } catch {
    return iso;
  }
}

export function suggestCategory(type: "income" | "expense", notes: string): string {
  const t = notes.toLowerCase();
  if (type === "income") {
    if (/salary|payroll|wage/.test(t)) return "Salary";
    if (/sale|invoice|client/.test(t)) return "Sales";
    return "Other income";
  }
  if (/rent|lease/.test(t)) return "Rent";
  if (/food|grocery|restaurant/.test(t)) return "Food";
  if (/fuel|gas|uber|taxi/.test(t)) return "Transport";
  if (/util|electric|water/.test(t)) return "Utilities";
  return "General";
}
