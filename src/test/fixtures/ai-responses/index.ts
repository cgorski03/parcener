import simpleReceipt from './simple-receipt.json'
import complexReceipt from './complex-receipt.json'
import malformedReceipt from './malformed-receipt.json'

export const aiResponses = {
    simple: simpleReceipt,
    complex: complexReceipt,
    malformed: malformedReceipt,
}

export function aiResponseAsText(response: object): string {
    return JSON.stringify(response)
}
