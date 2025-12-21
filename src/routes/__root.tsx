import { HeadContent, Scripts, createRootRoute } from '@tanstack/react-router'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { GeneralNotFound } from '@/components/layout/not-found'
import appCss from '../styles.css?url'

export const Route = createRootRoute({
    head: () => ({
        meta: [
            {
                charSet: 'utf-8',
            },
            {
                name: 'viewport',
                content: 'width=device-width, initial-scale=1',
            },
            { title: 'Parcener' },
            { property: 'og:site_name', content: 'Parcener' },
            { property: 'og:title', content: 'Parcener - Split Bills, Not Friends' },
            { property: 'og:description', content: 'The open source, collaborative, receipt splitting tool' },
        ],
        links: [
            {
                rel: 'stylesheet',
                href: appCss,
            },
        ],
    }),
    shellComponent: RootDocument,
    notFoundComponent: GeneralNotFound,
})

function RootDocument({ children }: { children: React.ReactNode }) {
    return (
        <html lang="en">
            <head>
                <HeadContent />
            </head>
            <body>
                <QueryClientProvider client={queryClient}>
                    {children}
                </QueryClientProvider>
                <Scripts />
            </body>
        </html>
    )
}
export const NotFoundComponent = GeneralNotFound
