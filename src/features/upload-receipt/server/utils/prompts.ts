export const RECEIPT_PARSE_PROMPT = `EXTRACT EXACTLY AS PRINTED. DO NOT CALCULATE. DO NOT OUTPUT NEGATIVE PRICES.

Return ONLY valid JSON (no markdown code blocks, no explanation):
{
  "items": [
    {
      "rawText": "exactly what appears on receipt",
      "interpreted": "clear human-readable name",
      "price": 12.99,
      "quantity": 1
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

4. **NO MARKDOWN**: Return raw JSON only. Never wrap in \`\`\`json blocks.

5. **RAW TEXT**: Include the complete, unmodified line string.

6. **VALIDATION CHECK**: After extraction, verify all item prices are ≥ 0. If any negative prices exist, you have extracted discount lines incorrectly. Fix it.

EXAMPLE - DISCOUNT HANDLING:
Receipt lines:
"4 Lagunitas IPA $31.80"
"Happy Hour (50.00%) -$15.92"

CORRECT OUTPUT:
{"rawText": "4 Lagunitas IPA $31.80", "interpreted": "Lagunitas IPA", "price": 15.88, "quantity": 4}

WRONG OUTPUT:
{"rawText": "Happy Hour (50.00%) -$15.92", "interpreted": "Happy Hour Discount", "price": -15.92, "quantity": 1}

Metadata: Only include clearly visible fields.`
