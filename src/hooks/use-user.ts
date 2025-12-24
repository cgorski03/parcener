import { getUserRpc } from "@/server/account/account-rpc";
import { queryOptions } from "@tanstack/react-query";

export const userQueryOptions = queryOptions({
    queryKey: ['user'],
    queryFn: async () => {
        const user = await getUserRpc();
        return user ?? null;
    },
})
