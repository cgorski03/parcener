import { createGoogleGenerativeAI } from "@ai-sdk/google";

export const google = () => {
    const apiKey = process.env.GOOGLE_API_KEY;
    if (!apiKey) {
        throw new Error('GOOGLE_API_KEY is required');
    }
    return createGoogleGenerativeAI({
        apiKey
    })
}
