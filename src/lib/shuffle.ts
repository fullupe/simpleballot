// Fisher-Yates shuffle algorithm for fair randomization
export function shuffleArray<T>(array: T[]): T[] {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

// Generate a shuffle map: slot position (1-6) -> month position (1-6)
export function generateShuffleMap(): Record<string, number> {
  const positions = [1, 2, 3, 4, 5, 6];
  const shuffled = shuffleArray(positions);
  
  const map: Record<string, number> = {};
  shuffled.forEach((monthPosition, index) => {
    map[`slot_${index + 1}`] = monthPosition;
  });
  
  return map;
}

// Get position label (1st, 2nd, 3rd, etc.)
export function getPositionLabel(position: number): string {
  const labels: Record<number, string> = {
    1: '1st',
    2: '2nd', 
    3: '3rd',
    4: '4th',
    5: '5th',
    6: '6th',
  };
  return labels[position] || `${position}th`;
}

// Generate a unique session ID for participants
export function generateSessionId(): string {
  return `${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;
}