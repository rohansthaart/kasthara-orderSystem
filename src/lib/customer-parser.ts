import { normalizeNepalPhone } from "./phone";

export type ParsedCustomerDetails = {
  customerName?: string;
  phone?: string;
  address?: string;
  productType?: string;
  price?: number;
  advanceAmount?: number;
  deliveryInstructions?: string;
};

const moneyPattern = /(?:rs\.?|npr)?\s*([0-9]{2,7})(?:\s*(?:rs|npr))?/i;

export function parseCustomerDetails(text: string): ParsedCustomerDetails {
  const lines = text
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);
  const joined = lines.join(" ");
  const phoneMatch = joined.match(/(?:\+?977[-\s]?)?(?:97|98)[-\s]?\d{2}[-\s]?\d{3}[-\s]?\d{3}/);
  const priceLine = lines.find((line) => /(total|price|amount|rs|npr)/i.test(line));
  const advanceLine = lines.find((line) => /(advance|paid|payment)/i.test(line));
  const addressLine = lines.find((line) => /(address|location|deliver|ship|tole|road|marg)/i.test(line));
  const productLine = lines.find((line) => /(keyring|frame|wallet|bottle|lamp|engrave|photo|gift|product)/i.test(line));
  const nameLine =
    lines.find((line) => /^(name|customer)[:\-]/i.test(line)) ??
    lines.find((line) => /^[A-Za-z\s.]{3,40}$/.test(line));

  return {
    customerName: nameLine?.replace(/^(name|customer)[:\-]\s*/i, ""),
    phone: phoneMatch ? normalizeNepalPhone(phoneMatch[0]) : undefined,
    address: addressLine?.replace(/^(address|location|delivery address)[:\-]\s*/i, ""),
    productType: productLine?.replace(/^(product|product type)[:\-]\s*/i, ""),
    price: extractMoney(priceLine),
    advanceAmount: extractMoney(advanceLine),
    deliveryInstructions: lines.find((line) => /(pickup|courier|cod|pathao|indrive)/i.test(line)),
  };
}

function extractMoney(line?: string) {
  if (!line) return undefined;
  const match = line.match(moneyPattern);
  return match ? Number(match[1]) : undefined;
}
