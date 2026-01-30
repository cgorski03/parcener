import { useState } from 'react';
import { useRenameRoom } from '../hooks/use-room';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/shared/components/ui/dialog';
import { Button } from '@/shared/components/ui/button';
import { Input } from '@/shared/components/ui/input';
import { Label } from '@/shared/components/ui/label';

interface RenameRoomDialogProps {
  roomId: string;
  currentTitle: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function RenameRoomDialog({
  roomId,
  currentTitle,
  open,
  onOpenChange,
}: RenameRoomDialogProps) {
  const [title, setTitle] = useState(currentTitle);
  const { mutate: rename, isPending } = useRenameRoom(roomId);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = title.trim();
    if (!trimmed || trimmed === currentTitle) {
      onOpenChange(false);
      return;
    }

    rename(trimmed, {
      onSuccess: () => onOpenChange(false),
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Rename Room</DialogTitle>
            <DialogDescription>
              Give this room a name to help everyone identify it.
            </DialogDescription>
          </DialogHeader>

          <div className="py-4">
            <Label htmlFor="room-title" className="sr-only">
              Room title
            </Label>
            <Input
              id="room-title"
              className="py-5"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Sunday Brunch"
              maxLength={255}
              autoFocus
            />
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isPending}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isPending || !title.trim()}>
              {isPending ? 'Saving...' : 'Save'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
