import { RestrictedUploadView } from '@/features/upload-receipt/components/restricted-upload-view';
import { UploadComponent } from '@/features/upload-receipt/components/upload-component';
import { useUploadRateLimit } from '@/features/upload-receipt/hooks/use-upload-rate-limit';
import { createFileRoute } from '@tanstack/react-router'


export const Route = createFileRoute('/_authed/upload')({
    head: () => ({
        meta: [
            { title: 'Review Receipt | Parcener' },
            { property: 'og:title', content: `Review Receipt | Parcener` },
        ],
    }),
    component: UploadPageComponent,
})

function UploadPageComponent() {
    const { user } = Route.useRouteContext();
    const { data: uploadData } = useUploadRateLimit();

    if (!user.canUpload || !uploadData?.canUpload) {
        return <RestrictedUploadView hasNoAccess={!user.canUpload} />
    }
    return <UploadComponent />
}

