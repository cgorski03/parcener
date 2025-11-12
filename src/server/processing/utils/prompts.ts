export const RECEIPT_PARSE_PROMPT = `Parse this receipt image and extract all line items, prices, and totals.

Return ONLY valid JSON in this exact format (no markdown, no explanation):
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

Rules:
- Include ALL line items, even if abbreviated
- interpreted should expand abbreviations (e.g., "CHZ BRG" → "Cheeseburger")
- If quantity appears on receipt, extract it; otherwise default to 1
- Prices must be numbers, not strings
- If tax/tip aren't visible, use 0
- If items are discounted ONLY include the price that was actually charged towards the total - provided price should NEVER be negative
- Only include metadata fields if clearly visible on receipt`;
