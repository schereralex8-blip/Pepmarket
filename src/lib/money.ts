const formatter = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
});

/** Cents in, "$59.00" out. Prices are stored as integers everywhere. */
export function money(cents: number): string {
  return formatter.format(cents / 100);
}
