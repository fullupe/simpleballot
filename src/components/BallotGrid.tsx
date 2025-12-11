import { SlotButton } from './SlotButton';

interface Selection {
  selected_slot: number;
  participant_name: string;
  participant_session_id: string;
}

interface BallotGridProps {
  selections: Selection[];
  currentSessionId: string;
  disabled: boolean;
  onSelect: (slot: number) => void;
  participant_count:number;
}

export function BallotGrid({ selections, currentSessionId, disabled, onSelect,participant_count }: BallotGridProps) {

  const slots = Array.from({length:participant_count},(_,i)=>i+1)

  //const slots = [1, 2, 3,4,5,6];
  
  const getSelectionForSlot = (slot: number) => {
    return selections.find(s => s.selected_slot === slot);
  };

  const userHasSelected = selections.some(s => s.participant_session_id === currentSessionId);

  return (
    <div className="grid grid-cols-3 gap-4 max-w-md mx-auto">
      {slots.map((slot) => {
        const selection = getSelectionForSlot(slot);
        const isSelected = selection?.participant_session_id === currentSessionId;
        const isTaken = !!selection && !isSelected;

        return (
          <SlotButton
            key={slot}
            slot={slot}
            isSelected={isSelected}
            isTaken={isTaken}
            takenBy={selection?.participant_name}
            disabled={disabled || userHasSelected}
            onClick={() => onSelect(slot)}
          />
        );
      })}
    </div>
  );
}