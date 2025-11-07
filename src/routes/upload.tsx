import { createFileRoute, useRouter } from '@tanstack/react-router'
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { uploadReceipt } from '@/server/analyze-receipts/receipts-rpc';

export const Route = createFileRoute('/upload')({
    component: UploadComponent,
})

function UploadComponent() {
    const [file, setFile] = useState<File | null>(null);
    const [name, setName] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const router = useRouter();

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const selectedFile = e.target.files?.[0];
        if (selectedFile) {
            if (selectedFile.size > 10 * 1024 * 1024) {
                setError('File too large (max 10MB)');
                return;
            }
            setFile(selectedFile);
            setError('');
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!file || !name) {
            setError('Please fill in all fields');
            return;
        }

        setLoading(true);
        setError('');

        try {
            const formData = new FormData();
            formData.append('file', file);
            formData.append('createdBy', name);

            const { receiptId } = await uploadReceipt({ data: formData });
            router.navigate({ to: `/receipt/${receiptId}` });
        } catch (err) {
            const message = err instanceof Error ? err.message : 'Upload failed';
            setError(message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex items-center justify-center min-h-screen bg-primary-foreground p-4">
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
                            <label htmlFor="name" className="text-sm font-medium">
                                Your Name
                            </label>
                            <Input
                                id="name"
                                type="text"
                                placeholder="Enter your name"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                disabled={loading}
                            />
                        </div>

                        <div className="space-y-2">
                            <label htmlFor="receipt" className="text-sm font-medium"> Receipt Image
                            </label>
                            <Input
                                id="receipt"
                                type="file"
                                accept="image/*"
                                onChange={handleFileChange}
                                disabled={loading}
                            />
                            {file && (
                                <p className="text-sm text-gray-600">
                                    ✓ {file.name}
                                </p>
                            )}
                        </div>

                        {error && (
                            <Alert variant="destructive">
                                <AlertDescription>{error}</AlertDescription>
                            </Alert>
                        )}

                        <Button
                            type="submit"
                            disabled={loading || !file || !name}
                            className="w-full bg-primary"
                        >
                            {loading ? 'Uploading...' : 'Split Receipt'}
                        </Button>
                    </form>
                </CardContent>
            </Card>
        </div>
    );
}
