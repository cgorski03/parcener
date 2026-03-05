import { createContext, useContext, useState } from 'react';
import ReceiptItemSheet from './edit-item-sheet';

type SheetMode = 'create' | 'edit' | null;

interface ReceiptItemSheetContextValue {
  openCreateItem: () => void;
  openEditItem: (itemId: string) => void;
  closeSheet: () => void;
}

const ReceiptItemSheetContext =
  createContext<ReceiptItemSheetContextValue | null>(null);

export function useReceiptItemSheet() {
  const context = useContext(ReceiptItemSheetContext);
  if (!context) {
    throw new Error(
      'useReceiptItemSheet must be used within ReceiptItemSheetProvider',
    );
  }
  return context;
}

interface ReceiptItemSheetProviderProps {
  receiptId: string;
  roomId: string | null;
  children: React.ReactNode;
}

export function ReceiptItemSheetProvider({
  receiptId,
  roomId,
  children,
}: ReceiptItemSheetProviderProps) {
  const [mode, setMode] = useState<SheetMode>(null);
  const [activeItemId, setActiveItemId] = useState<string | null>(null);
  const openCreateItem = () => {
    setActiveItemId(null);
    setMode('create');
  };

  const openEditItem = (itemId: string) => {
    setActiveItemId(itemId);
    setMode('edit');
  };

  const closeSheet = () => {
    setMode(null);
  };

  return (
    <ReceiptItemSheetContext.Provider
      value={{ openCreateItem, openEditItem, closeSheet }}
    >
      {children}
      {mode && (
        <ReceiptItemSheet
          key={`${mode}:${activeItemId ?? 'new'}`}
          open={true}
          mode={mode}
          itemId={mode === 'edit' ? activeItemId : null}
          receiptId={receiptId}
          roomId={roomId}
          onClose={closeSheet}
        />
      )}
    </ReceiptItemSheetContext.Provider>
  );
}
