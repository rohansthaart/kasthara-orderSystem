import { describe, expect, it } from "vitest";
import { parseCustomerDetails } from "./customer-parser";

describe("parseCustomerDetails", () => {
  it("extracts labelled values from a typical social order message", () => {
    expect(parseCustomerDetails(`Name: Sita Gurung\nPhone: +977 980-123-4567\nProduct: Photo Frame\nDelivery Address: Boudha, Kathmandu\nTotal: Rs. 1,500\nAdvance paid: NPR 500\nDelivery: Pathao, call before arrival`)).toEqual({
      customerName: "Sita Gurung",
      phone: "9801234567",
      productType: "Photo Frame",
      address: "Boudha, Kathmandu",
      price: 1500,
      advanceAmount: 500,
      deliveryInstructions: "Pathao, call before arrival",
      deliveryMethod: "COURIER",
    });
  });

  it("handles inline contact details, Nepali labels, and Devanagari digits", () => {
    expect(parseCustomerDetails(`नाम: रिया श्रेष्ठ\nसम्पर्क नम्बर: ९८०१२३४५६७\nठेगाना: पोखरा, लेकसाइड\nजम्मा: रु २,४५०\nअग्रिम: ५००\nकुरियर: Pathao`)).toEqual({
      customerName: "रिया श्रेष्ठ",
      phone: "9801234567",
      address: "पोखरा, लेकसाइड",
      price: 2450,
      advanceAmount: 500,
      deliveryInstructions: "Pathao",
      deliveryMethod: "COURIER",
    });
  });

  it("uses sensible fallbacks without mistaking a phone number for a price", () => {
    expect(parseCustomerDetails(`Ramesh Thapa\n9801234567\nNeed an engraved keyring\nBaneshwor, Kathmandu\nRs 850\nCourier through inDrive`)).toEqual({
      customerName: "Ramesh Thapa",
      phone: "9801234567",
      productType: "Need an engraved keyring",
      address: "Baneshwor, Kathmandu",
      price: 850,
      deliveryInstructions: "Courier through inDrive",
      deliveryMethod: "COURIER",
    });
  });

  it("separates fields pasted on one line and detects a second phone", () => {
    expect(parseCustomerDetails("Customer Name: Asha Rai | Phone No: 981-234-5678 | Alt Phone: 980 111 2233 | Product: Double-side QR keychain | Delivery Address: Imadol, Lalitpur | Total Amount: Rs 1,200 | Advance Amount: 300 | Delivery Method: Pathao")).toEqual({
      customerName: "Asha Rai",
      phone: "9812345678",
      alternativePhone: "9801112233",
      productType: "Double-side QR keychain",
      address: "Imadol, Lalitpur",
      price: 1200,
      advanceAmount: 300,
      deliveryInstructions: "Pathao",
      deliveryMethod: "COURIER",
    });
  });

  it("does not confuse an advance, delivery charge, or product sentence for another field", () => {
    expect(parseCustomerDetails("Need an engraved keyring\nBaneshwor, Kathmandu\nContact - 9801234567\nAdvance - Rs. 500\nDelivery charge - Rs. 150")).toEqual({
      phone: "9801234567",
      productType: "Need an engraved keyring",
      address: "Baneshwor, Kathmandu",
      advanceAmount: 500,
    });
  });

  it("returns no guesses for unrelated text", () => {
    expect(parseCustomerDetails("Hi, is this still available?\nPlease reply when you can.")).toEqual({});
  });
});
