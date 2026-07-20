import { isValidNepalPhone, normalizeNepalPhone } from "./phone";

export type ParsedCustomerDetails = {
  customerName?: string;
  phone?: string;
  alternativePhone?: string;
  address?: string;
  productType?: string;
  price?: number;
  advanceAmount?: number;
  deliveryInstructions?: string;
  deliveryMethod?: "DELIVERY" | "PICKUP" | "COURIER";
};

type LabeledValue = { value: string; index: number };

const nameLabel = /^(?:name|customer(?:\s+name)?|full\s+name|receiver(?:\s+name)?|नाम(?:\s+थर)?|ग्राहक(?:को\s+नाम)?)\s*[:=\-–—]\s*/i;
const phoneLabel = /^(?:phone|phone\s*(?:no\.?|number)|mobile|mobile\s*(?:no\.?|number)|contact|contact\s*(?:no\.?|number)|whatsapp|फोन|मोबाइल|सम्पर्क)\s*(?:no\.?|number|नम्बर)?\s*[:=\-–—]\s*/i;
const alternativePhoneLabel = /^(?:alternative|alternate|secondary|other|alt\.?)\s*(?:phone|mobile|contact)(?:\s*(?:no\.?|number))?\s*[:=\-–—]\s*/i;
const addressLabel = /^(?:address|delivery\s+address|shipping\s+address|location|receiver\s+address|ठेगाना|डेलिभरी\s*ठेगाना)\s*[:=\-–—]\s*/i;
const productLabel = /^(?:product(?:\s+type|\s+name)?|item|order|design|gift|सामान|प्रोडक्ट)\s*[:=\-–—]\s*/i;
const priceLabel = /^(?:grand\s*total|order\s*total|total(?:\s+amount)?|price|unit\s*price|amount|cost|rate|जम्मा|कुल)\s*[:=\-–—]\s*/i;
const advanceLabel = /^(?:advance(?:\s+amount|\s+paid)?|deposit|paid(?:\s+amount)?|payment\s*(?:made|received)|बैनाः?|अग्रिम|तिरेको)\s*[:=\-–—]\s*/i;
const deliveryChargeLabel = /^(?:delivery|shipping|courier)\s*(?:charge|fee)\s*[:=\-–—]\s*/i;
const deliveryLabel = /^(?:delivery\s*(?:note|instruction|instructions|method)?|courier|shipping|pickup|dispatch|special\s+note|remarks?|डेलिभरी|कुरियर|पिकअप)\s*[:=\-–—]\s*/i;

// Longest labels come first so "Delivery Address" is treated as one field.
const anyLabelPattern = /(?:alternative\s*(?:phone|mobile|contact)(?:\s*(?:no\.?|number))?|alternate\s*(?:phone|mobile|contact)(?:\s*(?:no\.?|number))?|secondary\s*(?:phone|mobile|contact)(?:\s*(?:no\.?|number))?|delivery\s+(?:address|instructions?|charge|method|note)|shipping\s+(?:address|charge|fee)|customer\s+name|receiver\s+(?:name|address)|contact\s*(?:no\.?|number)|mobile\s*(?:no\.?|number)|phone\s*(?:no\.?|number)|product\s+(?:type|name)|grand\s+total|order\s+total|total\s+amount|advance\s+(?:amount|paid)|paid\s+amount|payment\s+(?:made|received)|special\s+note|full\s+name|unit\s+price|name|phone|mobile|contact|whatsapp|address|location|product|item|order|design|gift|price|total|amount|cost|rate|advance|deposit|paid|delivery|courier|shipping|pickup|dispatch|remarks?|नाम(?:\s+थर)?|ग्राहक(?:को\s+नाम)?|सम्पर्क(?:\s+नम्बर)?|फोन|मोबाइल|डेलिभरी\s*ठेगाना|ठेगाना|सामान|प्रोडक्ट|जम्मा|कुल|बैनाः?|अग्रिम|तिरेको|डेलिभरी|कुरियर|पिकअप)\s*[:=\-–—]/gi;

const moneyPattern = /(?:npr|rs\.?|रु\.?|रुपैयाँ)?\s*([0-9]{1,3}(?:,[0-9]{3})+(?:\.[0-9]{1,2})?|[0-9]{1,7}(?:\.[0-9]{1,2})?)(?:\s*(?:npr|rs\.?|रु\.?|रुपैयाँ|\/-))?/i;
const phonePattern = /(?:\+?977[\s().-]*)?(?:97|98)(?:[\s().-]*\d){8}/;
const phonePatternGlobal = /(?:\+?977[\s().-]*)?(?:97|98)(?:[\s().-]*\d){8}/g;
const productHint = /\b(?:key\s*(?:ring|chain)|keyring|keychain|frame|wallet|bottle|lamp|engrav(?:e|ed|ing)|photo|gift|mug|t[\s-]?shirt|shirt|hoodie|pillow|calendar|qr\s*code)\b/i;
const addressHint = /\b(?:tole|road|marg|chowk|ward|nagar|municipality|metro|district|city|kathmandu|lalitpur|bhaktapur|pokhara|baneshwor|boudha|koteshwor|kalanki|balaju|chabahil|patan|satdobato|imadol|budhanilkantha|nepal)\b|टोल|मार्ग|चोक|वडा|नगर|काठमाडौं|ललितपुर|भक्तपुर|पोखरा/i;
const deliveryHint = /\b(?:pick\s*up|pickup|courier|cod|pathao|in\s*drive|indrive|delivery|shipping|urgent|call\s+before|ring\s+the\s+bell|fragile)\b|डेलिभरी|कुरियर|पिकअप/i;

export function parseCustomerDetails(text: string): ParsedCustomerDetails {
  const lines = toLogicalLines(text);
  const joined = lines.join(" ");
  const detectedPhones = findPhones(joined);

  const name = findLabeledValue(lines, nameLabel) ?? findLikelyName(lines);
  const labeledPhone = extractPhone(findLabeledValue(lines, phoneLabel)?.value);
  const labeledAlternativePhone = extractPhone(findLabeledValue(lines, alternativePhoneLabel)?.value);
  const phone = labeledPhone ?? detectedPhones[0];
  const alternativePhone = labeledAlternativePhone ?? detectedPhones.find((value) => value !== phone);
  const address = findLabeledValue(lines, addressLabel)?.value ?? findLikelyAddress(lines);
  const product = findLabeledValue(lines, productLabel)?.value ?? lines.find((line) => !looksLabeled(line) && productHint.test(line));
  const advanceValue = findLabeledValue(lines, advanceLabel)?.value;
  const priceValue = findLabeledValue(lines, priceLabel)?.value;
  const currencyPriceLine = lines.find((line) => hasCurrency(line) && !advanceLabel.test(line) && !deliveryChargeLabel.test(line));
  const delivery = findLabeledValue(lines, deliveryLabel)?.value
    ?? lines.find((line) => !addressLabel.test(line) && !productLabel.test(line) && !deliveryChargeLabel.test(line) && deliveryHint.test(line));
  const deliveryContext = cleanValue(delivery) ?? "";

  return compact({
    customerName: cleanValue(name?.value),
    phone,
    alternativePhone: alternativePhone === phone ? undefined : alternativePhone,
    address: cleanValue(address),
    productType: cleanValue(product),
    price: extractMoney(priceValue ?? currencyPriceLine),
    advanceAmount: extractMoney(advanceValue),
    deliveryInstructions: cleanValue(delivery),
    deliveryMethod: detectDeliveryMethod(deliveryContext),
  });
}

function toLogicalLines(text: string) {
  return normaliseText(text)
    .split(/\r?\n/)
    .flatMap(splitInlineLabels)
    .map((line) => line.trim().replace(/^[•*▪◦●☑✅📌👤📞☎🏠📍💰💵📦🚚📝|;\-]+\s*/u, ""))
    .filter(Boolean);
}

function splitInlineLabels(line: string) {
  const matches = Array.from(line.matchAll(anyLabelPattern));
  if (matches.length <= 1) return [line];

  const parts: string[] = [];
  const firstIndex = matches[0]?.index ?? 0;
  const prefix = line.slice(0, firstIndex).trim();
  if (prefix) parts.push(prefix);

  for (let index = 0; index < matches.length; index += 1) {
    const start = matches[index]?.index ?? 0;
    const end = matches[index + 1]?.index ?? line.length;
    parts.push(line.slice(start, end));
  }
  return parts;
}

function normaliseText(text: string) {
  const devanagariDigits = "०१२३४५६७८९";
  return text
    .normalize("NFKC")
    .replace(/[०-९]/g, (digit) => String(devanagariDigits.indexOf(digit)))
    .replace(/[：]/g, ":")
    .replace(/\u00a0/g, " ");
}

function findLabeledValue(lines: string[], label: RegExp): LabeledValue | undefined {
  const index = lines.findIndex((line) => label.test(line));
  if (index < 0) return undefined;
  const line = lines[index];
  if (!line) return undefined;
  const value = line.replace(label, "").trim();
  if (value) return { value, index };
  const nextLine = lines[index + 1];
  return nextLine && !looksLabeled(nextLine) ? { value: nextLine, index } : undefined;
}

function findLikelyName(lines: string[]): LabeledValue | undefined {
  const index = lines.findIndex((line) => {
    const value = cleanValue(line);
    if (!value) return false;
    const words = value.split(/\s+/);
    return !looksLabeled(line)
      && !phonePattern.test(value)
      && !moneyPattern.test(value)
      && !addressHint.test(value)
      && !productHint.test(value)
      && !deliveryHint.test(value)
      && /^[A-Za-z. '\-\u0900-\u097F]+$/.test(value)
      && !/[.!?]$/.test(value)
      && words.length >= 2
      && words.length <= 4
      && value.length >= 3
      && value.length <= 60;
  });
  const value = index >= 0 ? lines[index] : undefined;
  return value ? { value, index } : undefined;
}

function findLikelyAddress(lines: string[]) {
  return lines.find((line) => !looksLabeled(line) && addressHint.test(line) && !deliveryHint.test(line));
}

function looksLabeled(value: string) {
  return /^(?:[A-Za-z\u0900-\u097F][A-Za-z\u0900-\u097F .]{1,35})\s*[:=\-–—]/.test(value.trim());
}

function findPhones(value: string) {
  const matches = value.match(phonePatternGlobal) ?? [];
  return Array.from(new Set(matches.map(normalizeNepalPhone).filter(isValidNepalPhone)));
}

function extractPhone(value: string | undefined) {
  if (!value) return undefined;
  const match = value.match(phonePattern)?.[0];
  if (!match) return undefined;
  const phone = normalizeNepalPhone(match);
  return isValidNepalPhone(phone) ? phone : undefined;
}

function hasCurrency(value: string) {
  return /(?:npr|rs\.?|रु\.?|रुपैयाँ)/i.test(value);
}

function extractMoney(value: string | undefined) {
  if (!value) return undefined;
  const match = value.match(moneyPattern);
  return match ? Number(match[1].replaceAll(",", "")) : undefined;
}

function detectDeliveryMethod(value: string): ParsedCustomerDetails["deliveryMethod"] {
  if (/\b(?:pick\s*up|pickup|self\s*collect)\b|पिकअप/i.test(value)) return "PICKUP";
  if (/\b(?:courier|pathao|in\s*drive|indrive)\b|कुरियर/i.test(value)) return "COURIER";
  if (/\b(?:delivery|shipping|cod)\b|डेलिभरी/i.test(value)) return "DELIVERY";
  return undefined;
}

function cleanValue(value: string | undefined) {
  if (!value) return undefined;
  const cleaned = value.replace(/\s+/g, " ").replace(/^[\s:|;,–—-]+|[\s|,;]+$/g, "").trim();
  return cleaned || undefined;
}

function compact<T extends Record<string, string | number | undefined>>(values: T): T {
  return Object.fromEntries(Object.entries(values).filter(([, value]) => value !== undefined && value !== "")) as T;
}
