import { getRateLimitRpc } from "@/server/account/account-rpc"
import { useQuery } from "@tanstack/react-query"

export const useRateLimit = () =>
    useQuery({
        queryKey: ['rateLimit'],
        queryFn: async () => {
            return await getRateLimitRpc();
        },
    })
