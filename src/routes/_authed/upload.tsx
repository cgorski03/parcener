import { RestrictedUploadView } from '@/components/upload/restricted-upload-view';
import { UploadComponent } from '@/components/upload/upload-component';
import { useUploadRateLimit } from '@/hooks/use-account';
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

    console.log(uploadData);
    if (!user.canUpload || !uploadData?.canUpload) {
        return <RestrictedUploadView hasNoAccess={!user.canUpload} />
    }
    return <UploadComponent />
}

