import { createFileRoute, useRouter } from '@tanstack/react-router'
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { useUploadReceipt } from '@/hooks/use-upload-receipt'
import { BrandedPageShell } from '@/components/layout/branded-page-shell'

export const Route = createFileRoute('/_authed/upload')({
    component: UploadComponent,
})

function UploadComponent() {
    const [file, setFile] = useState<File | null>(null)
    const router = useRouter()
    const { mutateAsync: uploadReceipt, error, isPending } = useUploadReceipt()

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const selectedFile = e.target.files?.[0]
        if (selectedFile) {
            setFile(selectedFile)
        }
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!file) {
            return
        }

        const formData = new FormData()
        formData.append('file', file)

        const result = await uploadReceipt(formData)

        if (result?.receiptId) {
            router.navigate({ to: `/receipt/review/${result.receiptId}` })
        }
    }

    return (
        <BrandedPageShell>
            <Card className="w-full max-w-md">
                <CardHeader>
                    <CardTitle>Split a Receipt</CardTitle>
                    <CardDescription>
                        Upload a receipt photo to split expenses with friends
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="space-y-2">
                            <label htmlFor="receipt" className="text-sm font-medium">
                                Receipt Image
                            </label>
                            <Input
                                id="receipt"
                                type="file"
                                accept="image/*"
                                onChange={handleFileChange}
                                disabled={isPending}
                            />
                            {file && <p className="text-sm text-gray-600">✓ {file.name}</p>}
                        </div>

                        {error && (
                            <Alert variant="destructive">
                                <AlertDescription>
                                    {error instanceof Error ? error.message : 'Upload failed'}
                                </AlertDescription>
                            </Alert>
                        )}

                        <Button
                            type="submit"
                            disabled={isPending || !file}
                            className="w-full bg-primary"
                        >
                            {isPending ? 'Uploading...' : 'Split Receipt'}
                        </Button>
                    </form>
                </CardContent>
            </Card>
        </BrandedPageShell >
    )
}
