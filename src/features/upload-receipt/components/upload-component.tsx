import { useState, useRef } from 'react';
import { Button } from '@/shared/components/ui/button';
import { Input } from '@/shared/components/ui/input';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/shared/components/ui/card';
import { Alert, AlertDescription } from '@/shared/components/ui/alert';
import { BrandedPageShell } from '@/shared/components/layout/branded-page-shell';
import { Upload, Trash2, AlertCircle, FileText } from 'lucide-react';
import { cn } from '@/shared/lib/utils';
import { useRouter } from '@tanstack/react-router';
import { useUploadReceipt } from '../hooks/use-upload-receipt';
import { logger } from '@/shared/observability/logger';
import { useObjectURL } from '../hooks/use-object-url';
import { SENTRY_EVENTS } from '@/shared/observability/sentry-events';
const MAX_FILE_SIZE = 5 * 1024 * 1024;
const ACCEPTED_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/heic'];

const formatFileSize = (bytes: number) => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
};

export function UploadComponent() {
  const [file, setFile] = useState<File | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();
  const {
    mutateAsync: uploadReceipt,
    error: uploadError,
    isPending,
  } = useUploadReceipt();
  const previewUrl = useObjectURL(file);

  const validateFile = (selectedFile: File): string | null => {
    if (!ACCEPTED_TYPES.includes(selectedFile.type)) {
      return `Invalid file type. Please use JPG, PNG, or HEIC.`;
    }
    if (selectedFile.size > MAX_FILE_SIZE) {
      return `File too large (${formatFileSize(selectedFile.size)}). Max ${formatFileSize(MAX_FILE_SIZE)}.`;
    }
    return null;
  };

  const processFile = (selectedFile: File) => {
    const error = validateFile(selectedFile);
    if (error) {
      setValidationError(error);
      setFile(null);
      if (fileInputRef.current) fileInputRef.current.value = '';
    } else {
      setValidationError(null);
      setFile(selectedFile);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) processFile(selectedFile);
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    const droppedFile = e.dataTransfer.files?.[0];
    if (droppedFile) processFile(droppedFile);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) return;
    const formData = new FormData();
    formData.append('file', file);
    try {
      const result = await uploadReceipt(formData);
      if (result?.receiptId) {
        router.navigate({ to: `/receipt/review/${result.receiptId}` });
      }
    } catch (err) {
      logger.error(err, SENTRY_EVENTS.RECEIPT.UPLOAD);
    }
  };

  const removeFile = () => {
    setFile(null);
    setValidationError(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

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
            {/* Main Interaction Area - Fixed Height */}
            <div
              className={cn(
                'relative w-full h-80 rounded-xl border-2 overflow-hidden transition-all',
                // Colors based on state
                dragActive
                  ? 'border-primary bg-primary/5'
                  : 'border-dashed border-muted-foreground/25',
                file ? 'border-solid border-border' : 'hover:bg-muted/50',
                validationError && 'border-destructive/50 bg-destructive/5',
              )}
              onDragEnter={handleDrag}
              onDragOver={handleDrag}
              onDragLeave={handleDrag}
              onDrop={handleDrop}
            >
              <Input
                ref={fileInputRef}
                id="receipt"
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                disabled={isPending}
                className="hidden"
              />

              {/* State 1: Empty (Upload Prompt) */}
              {!file && (
                <div
                  className="h-full flex flex-col items-center justify-center text-center cursor-pointer p-6"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <div
                    className={cn(
                      'w-16 h-16 rounded-full flex items-center justify-center mb-4 transition-colors',
                      dragActive
                        ? 'bg-primary/10 text-primary'
                        : 'bg-muted text-muted-foreground',
                    )}
                  >
                    <Upload className="h-8 w-8" />
                  </div>
                  <p className="text-sm font-medium">
                    {dragActive
                      ? 'Drop to upload'
                      : 'Click to upload or drag & drop'}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    JPG, PNG, HEIC (Max 5MB)
                  </p>
                </div>
              )}

              {/* State 2: File Selected (Split View) */}
              {file && previewUrl && (
                <div className="h-full flex flex-col">
                  <div className="flex-1 relative w-full min-h-0">
                    {file.type === 'image/heic' ||
                    file.type === 'image/heif' ? (
                      // For HEIC, just show file info centered
                      <div className="h-full flex flex-col items-center justify-center p-6 text-center">
                        <div className="bg-primary/10 p-6 rounded-full mb-4">
                          <FileText className="h-12 w-12 text-primary" />
                        </div>
                        <p className="text-sm font-medium text-muted-foreground">
                          {file.name}
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                          {formatFileSize(file.size)}
                        </p>
                        <p className="text-xs text-muted-foreground mt-2">
                          Preview not supported in this browser
                        </p>
                      </div>
                    ) : (
                      // For supported formats, show the image
                      <img
                        src={previewUrl}
                        alt="Receipt preview"
                        className="w-full h-full object-contain p-4"
                      />
                    )}
                  </div>

                  {/* Bottom: File Info Bar */}
                  <div className="h-16 flex-none bg-background border-t px-4 flex items-center gap-3">
                    <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center flex-none text-primary">
                      <FileText className="h-5 w-5" />
                    </div>

                    <div className="flex-1 min-w-0">
                      <p
                        className="text-sm font-medium truncate"
                        title={file.name}
                      >
                        {file.name}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {formatFileSize(file.size)}
                      </p>
                    </div>

                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                      onClick={removeFile}
                    >
                      <Trash2 className="h-5 w-5" />
                    </Button>
                  </div>
                </div>
              )}
            </div>

            {/* Errors */}
            {(validationError || uploadError) && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  {validationError ||
                    (uploadError instanceof Error
                      ? uploadError.message
                      : 'Upload failed')}
                </AlertDescription>
              </Alert>
            )}

            <Button
              type="submit"
              disabled={isPending || !file}
              className="w-full"
            >
              {isPending ? 'Uploading...' : 'Process Receipt'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </BrandedPageShell>
  );
}
