import { getPositionLabel } from '@/lib/shuffle';
import { Trophy, Award, Medal } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Selection {
  selected_slot: number;
  participant_name: string;
}

interface ResultsDisplayProps {
  selections: Selection[];
  shuffleMap: Record<string, number>;
}

export function ResultsDisplay({ selections, shuffleMap }: ResultsDisplayProps) {
  // Sort by month position (1st to 6th)
  const sortedResults = selections
    .map(selection => ({
      ...selection,
      monthPosition: shuffleMap[`slot_${selection.selected_slot}`]
    }))
    .sort((a, b) => a.monthPosition - b.monthPosition);

  const getIcon = (position: number) => {
    switch (position) {
      case 1:
        return <Trophy className="h-6 w-6 text-accent" />;
      case 2:
        return <Award className="h-5 w-5 text-muted-foreground" />;
      case 3:
        return <Medal className="h-5 w-5 text-amber-600" />;
      default:
        return null;
    }
  };

  const getRowStyle = (position: number) => {
    if (position === 1) {
      return 'bg-accent/10 border-accent/30';
    }
    return 'bg-card border-border';
  };

  return (
    <div className="space-y-3 animate-fade-in">
      <h3 className="text-xl font-semibold text-center mb-6">Final Results</h3>
      <div className="space-y-2">
        {sortedResults.map((result, index) => (
          <div
            key={result.selected_slot}
            className={cn(
              'flex items-center justify-between p-4 rounded-lg border-2 transition-all',
              getRowStyle(result.monthPosition),
              'animate-slide-up'
            )}
            style={{ animationDelay: `${index * 100}ms` }}
          >
            <div className="flex items-center gap-3">
              <span className="text-2xl font-bold text-primary w-10">
                {getPositionLabel(result.monthPosition)}
              </span>
              {getIcon(result.monthPosition)}
            </div>
            <div className="text-right">
              <p className="font-semibold text-foreground">{result.participant_name}</p>
              <p className="text-sm text-muted-foreground">Selected Slot {result.selected_slot}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}