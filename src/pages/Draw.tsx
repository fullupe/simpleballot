import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { BallotGrid } from '@/components/BallotGrid';
import { NameEntryDialog } from '@/components/NameEntryDialog';
import { ResultsDisplay } from '@/components/ResultsDisplay';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { generateSessionId } from '@/lib/shuffle';
import { Vote, Users, CheckCircle2, Clock, ArrowLeft } from 'lucide-react';
import { Json } from '@/integrations/supabase/types';

interface Draw {
  id: string;
  title: string | null;
  status: string;
  shuffle_map: Json;
  participants_count: number;
}

interface Selection {
  id: string;
  draw_id: string;
  selected_slot: number;
  participant_name: string;
  participant_session_id: string;
}

const STORAGE_KEY_PREFIX = 'fairdraw_session_';

export default function DrawPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [draw, setDraw] = useState<Draw | null>(null);
  const [selections, setSelections] = useState<Selection[]>([]);
  const [loading, setLoading] = useState(true);
  const [sessionId, setSessionId] = useState<string>('');
  const [participantName, setParticipantName] = useState<string>('');
  const [showNameDialog, setShowNameDialog] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Initialize session from storage or generate new
  useEffect(() => {
    if (!id) return;
    
    const storageKey = `${STORAGE_KEY_PREFIX}${id}`;
    const stored = localStorage.getItem(storageKey);
    
    if (stored) {
      const { sessionId: storedId, name } = JSON.parse(stored);
      setSessionId(storedId);
      setParticipantName(name);
    } else {
      const newSessionId = generateSessionId();
      setSessionId(newSessionId);
      setShowNameDialog(true);
    }
  }, [id]);

  // Fetch draw data
  useEffect(() => {
    if (!id) return;
    
    const fetchDraw = async () => {
      const { data, error } = await supabase
        .from('draws')
        .select('*')
        .eq('id', id)
        .maybeSingle();
      
      if (error || !data) {
        toast({ title: 'Error', description: 'Ballot not found', variant: 'destructive' });
        navigate('/');
        return;
      }
      
      setDraw(data);
      setLoading(false);
    };

    fetchDraw();
  }, [id, navigate, toast]);

  // Fetch selections and set up realtime subscription
  useEffect(() => {
    if (!id) return;

    const fetchSelections = async () => {
      const { data } = await supabase
        .from('selections')
        .select('*')
        .eq('draw_id', id);
      
      setSelections(data || []);
    };

    fetchSelections();

    // Realtime subscription
    const channel = supabase
      .channel(`selections-${id}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'selections',
          filter: `draw_id=eq.${id}`,
        },
        () => {
          fetchSelections();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [id]);

  const handleNameSubmit = useCallback((name: string) => {
    if (!id) return;
    
    setParticipantName(name);
    setShowNameDialog(false);
    
    // Store in localStorage
    const storageKey = `${STORAGE_KEY_PREFIX}${id}`;
    localStorage.setItem(storageKey, JSON.stringify({ sessionId, name }));
    
    toast({ title: 'Welcome!', description: `You're now participating as ${name}` });
  }, [id, sessionId, toast]);

  const handleSlotSelect = async (slot: number) => {
    if (!id || !participantName || !sessionId || isSubmitting) return;
    
    setIsSubmitting(true);
    
    const { error } = await supabase
      .from('selections')
      .insert({
        draw_id: id,
        selected_slot: slot,
        participant_name: participantName,
        participant_session_id: sessionId,
      });
    
    setIsSubmitting(false);
    
    if (error) {
      if (error.code === '23505') {
        toast({ 
          title: 'Slot taken', 
          description: 'This slot was just selected by another participant', 
          variant: 'destructive' 
        });
      } else {
        toast({ 
          title: 'Error', 
          description: 'Failed to make selection. Please try again.', 
          variant: 'destructive' 
        });
      }
      return;
    }
    
    toast({ title: 'Success!', description: 'Your selection has been recorded' });
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (!draw) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Card className="max-w-md">
          <CardContent className="pt-6 text-center">
            <p className="text-muted-foreground">Ballot not found</p>
            <Button variant="link" onClick={() => navigate('/')}>
              Go back home
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const userSelection = selections.find(s => s.participant_session_id === sessionId);
  const isComplete = selections.length >= draw.participants_count;
  const shuffleMap = draw.shuffle_map as Record<string, number>;

  return (
    <div className="min-h-screen bg-background">
      <NameEntryDialog open={showNameDialog} onSubmit={handleNameSubmit} />
      
      <header className="border-b border-border bg-card">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={() => navigate('/')}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div className="p-2 rounded-lg gradient-hero">
              <Vote className="h-5 w-5 text-primary-foreground" />
            </div>
            <h1 className="text-xl font-bold text-foreground">FairDraw</h1>
          </div>
          {participantName && (
            <span className="text-sm text-muted-foreground">
              Joined as <strong className="text-foreground">{participantName}</strong>
            </span>
          )}
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-2xl">
        <div className="text-center mb-8 animate-fade-in">
          <h2 className="text-3xl font-bold text-foreground mb-2">{draw.title || 'Group Ballot'}</h2>
          <p className="text-muted-foreground">Select a slot to reveal your position</p>
        </div>

        {/* Status Card */}
        <Card className="mb-8 border-2">
          <CardContent className="pt-6">
            <div className="flex items-center justify-center gap-6 text-center">
              <div className="flex items-center gap-2">
                <Users className="h-5 w-5 text-primary" />
                <span className="text-lg font-semibold">
                  {selections.length} / {draw.participants_count}
                </span>
                <span className="text-muted-foreground">selections</span>
              </div>
              <div className="h-8 w-px bg-border" />
              <div className="flex items-center gap-2">
                {isComplete ? (
                  <>
                    <CheckCircle2 className="h-5 w-5 text-success" />
                    <span className="text-success font-medium">Complete</span>
                  </>
                ) : (
                  <>
                    <Clock className="h-5 w-5 text-accent" />
                    <span className="text-accent font-medium">In Progress</span>
                  </>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Main Content */}
        {isComplete ? (
          <Card className="border-2 border-success/30 bg-success/5">
            <CardHeader className="text-center">
              <CardTitle className="text-2xl flex items-center justify-center gap-2">
                <CheckCircle2 className="h-6 w-6 text-success" />
                All Selections Complete
              </CardTitle>
              <CardDescription>
                Here's the final reveal showing everyone's position
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ResultsDisplay selections={selections} shuffleMap={shuffleMap} />
            </CardContent>
          </Card>
        ) : (
          <Card className="border-2">
            <CardHeader className="text-center">
              <CardTitle className="text-xl">
                {userSelection ? 'Waiting for Others' : 'Pick Your Slot'}
              </CardTitle>
              <CardDescription>
                {userSelection 
                  ? 'Your selection is locked. Results will appear when everyone has picked.'
                  : 'Each slot maps to a hidden position (1st-6th). Choose wisely!'}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <BallotGrid
                selections={selections}
                currentSessionId={sessionId}
                disabled={!participantName || isSubmitting}
                onSelect={handleSlotSelect}
              />
              {isSubmitting && (
                <div className="flex justify-center mt-4">
                  <LoadingSpinner size="sm" />
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  );
}