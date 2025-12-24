import { getUserRpc } from "@/server/account/account-rpc";
import { queryOptions } from "@tanstack/react-query";

export const userQueryOptions = queryOptions({
    queryKey: ['user'],
    queryFn: async () => await getUserRpc(),
    staleTime: 1000 * 60 * 5, // Cache is "fresh" for 5 minutes
})
