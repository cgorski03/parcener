export const RECEIPT_PARSE_PROMPT = `EXTRACT EXACTLY AS PRINTED. DO NOT CALCULATE. DO NOT OUTPUT NEGATIVE PRICES.

Return ONLY valid JSON (no markdown code blocks, no explanation):
{
  "items": [
    {
      "rawText": "exactly what appears on receipt",
      "interpreted": "clear human-readable name",
      "price": 12.99,
      "quantity": 1,
      "taxCode": "A",
      "itemizedTaxStatus": "taxable"
    }
  ],
  "taxAllocationMode": "itemized",
  "taxCodes": [
    {
      "code": "A",
      "label": "A 6.35% TAX",
      "rateBps": 635
    }
  ],
  "miscFees": [
    {
      "rawText": "CC FEE 1.25",
      "interpreted": "Credit card fee",
      "amount": 1.25
    }
  ],
  "subtotal": 50.00,
  "tax": 4.50,
  "tip": 0,
  "total": 54.50,
  "metadata": {
    "restaurant": "Restaurant Name",
    "date": "2024-01-01"
  }
}

CRITICAL RULES IN ORDER:

1. **"PRICE" = FINAL CHARGED AMOUNT**: For "4 IPAs 30.00", price is 30.00 (line total). Never divide.

2. **DISCOUNT LINES ARE NOT ITEMS**: If you see "Happy Hour -$15.92", DO NOT create a separate item. Apply the discount to the item ABOVE it and adjust THAT item's price.

3. **PRICE MUST BE ≥ 0**: If applying a discount would make price negative, set price to 0 instead.

4. **REPORT ITEMIZED TAX EVIDENCE**: Set "taxAllocationMode": "itemized" when the receipt shows item-level tax evidence, such as printed item tax markers/codes or printed itemized tax-code summaries. Otherwise set "taxAllocationMode": "receipt_level". This field reports evidence found on the receipt; it does not decide final settlement behavior.

5. **ITEMIZED TAX STATUS**: For "itemized" receipts, report each item's observed status as "taxable", "exempt", or "unknown". Use "taxable" when the line has a printed tax marker/code. Use "exempt" when the receipt's itemized tax marker system is clear and the item has no tax marker. Use "unknown" when itemized tax evidence exists but the item's status is unclear. For "receipt_level" receipts, set each item's "itemizedTaxStatus" to null.

6. **ITEM TAX CODES**: If an item line has a printed tax marker/code, copy that marker into "taxCode". For example, if the line ends with "A", use "taxCode": "A". If the item has no printed tax marker, use "taxCode": null. "taxCode" is only printed evidence; "itemizedTaxStatus" is the classification.

7. **OPTIONAL TAX CODES**: Only include "taxCodes" when the receipt clearly uses item-level tax markers/codes, such as items ending in "A" and a matching printed tax-rate line like "A 6.35% TAX". If the receipt does not clearly use itemized tax codes, return "taxCodes": [] and set each item's "taxCode" to null.

8. **TAX CODES DO NOT INCLUDE AMOUNTS**: For tax codes, only extract the printed code, label, and rate. Never return a tax code amount, taxable subtotal, taxable sales amount, calculated tax base, or any value that requires adding or multiplying. Convert printed percentages to basis points: 6.35% = 635, 7% = 700, 0.5% = 50. If the tax rate is not clearly printed, use "rateBps": null.

9. **PRINTED TAX TOTAL**: Always return the receipt-level "tax" field as the printed total tax amount. Copy it from the receipt. Do not calculate it from tax codes or itemized status.

10. **DO NOT RECONCILE ITEMIZATION**: Do not force itemized statuses to make the math work. If itemized tax evidence exists but some items are unclear, preserve what you can identify and mark unclear items as "unknown". The application will validate totals and decide how to use or review the itemized evidence.

11. **OPTIONAL MISC FEES**: If the receipt includes non-item charges such as a credit card fee, service charge, convenience fee, surcharge, delivery fee, bag fee, bottle deposit, or other fee that is not a normal purchased item, put it in "miscFees". Only use "miscFees" for charges printed below/outside the item subtotal, usually near tax, tip, or total. If a fee-like line appears in the itemized list and is included in the printed subtotal, keep it as an item. Copy the original line into "rawText", provide a clear "interpreted" name, and copy the printed amount. If there are no such fees, return "miscFees": [].

12. **DO NOT INVENT OPTIONAL DETAILS**: Do not create tax codes or misc fees unless they are clearly printed. When uncertain whether a line is a normal item or a fee, keep it as an item.

13. **NO MARKDOWN**: Return raw JSON only. Never wrap in \`\`\`json blocks.

14. **RAW TEXT**: Include the complete, unmodified line string.

15. **VALIDATION CHECK**: After extraction, verify all item prices are ≥ 0. If any negative prices exist, you have extracted discount lines incorrectly. Fix it.

EXAMPLE - DISCOUNT HANDLING:
Receipt lines:
"4 Lagunitas IPA $31.80"
"Happy Hour (50.00%) -$15.92"

CORRECT OUTPUT:
{"rawText": "4 Lagunitas IPA $31.80", "interpreted": "Lagunitas IPA", "price": 15.88, "quantity": 4, "taxCode": null, "itemizedTaxStatus": null}

WRONG OUTPUT:
{"rawText": "Happy Hour (50.00%) -$15.92", "interpreted": "Happy Hour Discount", "price": -15.92, "quantity": 1, "taxCode": null, "itemizedTaxStatus": null}

EXAMPLE - ITEMIZED TAX CODES:
Receipt lines:
"1819440 KS GOLF V3.0 29.99 A"
"A 6.35% TAX 5.71"

CORRECT ITEM OUTPUT:
{"rawText": "1819440 KS GOLF V3.0 29.99 A", "interpreted": "KS Golf V3.0", "price": 29.99, "quantity": 1, "taxCode": "A", "itemizedTaxStatus": "taxable"}

CORRECT TAX CODE OUTPUT:
{"code": "A", "label": "A 6.35% TAX", "rateBps": 635}

WRONG TAX CODE OUTPUT:
{"code": "A", "label": "A 6.35% TAX", "rateBps": 635, "taxAmount": 5.71, "groupSubtotal": 89.97}

EXAMPLE - MISC FEES:
Receipt lines:
"CC FEE 1.25"
"SERVICE CHARGE 3.00"

CORRECT MISC FEE OUTPUT:
{"rawText": "CC FEE 1.25", "interpreted": "Credit card fee", "amount": 1.25}

WRONG ITEM OUTPUT:
{"rawText": "CC FEE 1.25", "interpreted": "Credit card fee", "price": 1.25, "quantity": 1, "taxCode": null, "itemizedTaxStatus": null}

Metadata: Only include clearly visible fields.`;
