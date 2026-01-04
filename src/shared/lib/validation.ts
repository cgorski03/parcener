export type InviteSearch = {
    token: string
}

const UUID_V4_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export const validateInviteSearch = (search: Record<string, unknown>): InviteSearch => {
    const token = typeof search.token === 'string' ? search.token.toLowerCase() : '';

    if (!UUID_V4_REGEX.test(token)) {
        throw new Error('Invalid Invite Token');
    }

    return {
        token,
    };
};
