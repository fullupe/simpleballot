import { cn } from '@/lib/utils';
import { Check, User } from 'lucide-react';

interface SlotButtonProps {
  slot: number;
  isSelected: boolean;
  isTaken: boolean;
  takenBy?: string;
  disabled: boolean;
  onClick: () => void;
}

export function SlotButton({ slot, isSelected, isTaken, takenBy, disabled, onClick }: SlotButtonProps) {
  const getStateClasses = () => {
    if (isSelected) {
      return 'bg-slot-selected text-primary-foreground border-slot-selected shadow-glow animate-celebrate';
    }
    if (isTaken) {
      return 'bg-slot-taken border-slot-taken text-muted-foreground cursor-not-allowed';
    }
    return 'bg-slot-available border-slot-available-border hover:bg-slot-hover hover:border-primary/40 hover:shadow-md cursor-pointer';
  };

  return (
    <button
      onClick={onClick}
      disabled={disabled || isTaken || isSelected}
      className={cn(
        'relative aspect-square w-full rounded-xl border-2 transition-all duration-300',
        'flex flex-col items-center justify-center gap-2',
        'text-lg font-semibold',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
        getStateClasses(),
        disabled && !isSelected && !isTaken && 'opacity-50 cursor-not-allowed'
      )}
    >
      {isSelected ? (
        <>
          <Check className="h-8 w-8" />
          <span className="text-sm">Your Pick</span>
        </>
      ) : isTaken ? (
        <>
          <User className="h-6 w-6" />
          <span className="text-xs">{takenBy}</span>
        </>
      ) : (
        <>
          <span className="text-2xl font-bold">{slot}</span>
          <span className="text-xs text-muted-foreground">Available</span>
        </>
      )}
    </button>
  );
}