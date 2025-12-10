import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import { generateShuffleMap } from '@/lib/shuffle';
import { Vote, Plus, Copy, ExternalLink, LogOut, Users } from 'lucide-react';
import { Json } from '@/integrations/supabase/types';

interface Draw {
  id: string;
  title: string | null;
  status: string;
  created_at: string;
  participants_count: number;
  selections_count?: number;
}

export default function Dashboard() {
  const { user, loading, signOut } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [draws, setDraws] = useState<Draw[]>([]);
  const [isCreating, setIsCreating] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [loadingDraws, setLoadingDraws] = useState(true);

  useEffect(() => {
    if (!loading && !user) {
      navigate('/auth');
    }
  }, [user, loading, navigate]);

  useEffect(() => {
    if (user) {
      fetchDraws();
    }
  }, [user]);

  const fetchDraws = async () => {
    if (!user) return;
    
    const { data, error } = await supabase
      .from('draws')
      .select('*')
      .eq('created_by', user.id)
      .order('created_at', { ascending: false });
    
    if (error) {
      toast({ title: 'Error', description: 'Failed to load draws', variant: 'destructive' });
      return;
    }

    // Fetch selection counts
    const drawsWithCounts = await Promise.all(
      (data || []).map(async (draw) => {
        const { count } = await supabase
          .from('selections')
          .select('*', { count: 'exact', head: true })
          .eq('draw_id', draw.id);
        return { ...draw, selections_count: count || 0 };
      })
    );

    setDraws(drawsWithCounts);
    setLoadingDraws(false);
  };

  const createDraw = async () => {
    if (!user) return;
    
    setIsCreating(true);
    const shuffleMap = generateShuffleMap();
    
    const { data, error } = await supabase
      .from('draws')
      .insert({
        created_by: user.id,
        title: newTitle || 'Untitled Ballot',
        shuffle_map: shuffleMap as unknown as Json,
        participants_count: 6,
        status: 'open',
      })
      .select()
      .single();
    
    setIsCreating(false);
    
    if (error) {
      toast({ title: 'Error', description: 'Failed to create ballot', variant: 'destructive' });
      return;
    }

    setNewTitle('');
    toast({ title: 'Success', description: 'Ballot created! Share the link with participants.' });
    fetchDraws();
  };

  const copyLink = (drawId: string) => {
    const link = `${window.location.origin}/draw/${drawId}`;
    navigator.clipboard.writeText(link);
    toast({ title: 'Copied!', description: 'Link copied to clipboard' });
  };

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  if (loading || loadingDraws) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg gradient-hero">
              <Vote className="h-5 w-5 text-primary-foreground" />
            </div>
            <h1 className="text-xl font-bold text-foreground">FairDraw</h1>
          </div>
          <Button variant="ghost" onClick={handleSignOut}>
            <LogOut className="h-4 w-4 mr-2" />
            Sign Out
          </Button>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-foreground mb-2">Your Ballots</h2>
          <p className="text-muted-foreground">Create and manage transparent group ballots</p>
        </div>

        {/* Create New Ballot */}
        <Card className="mb-8 border-2 border-dashed border-primary/30 bg-primary/5">
          <CardContent className="pt-6">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1">
                <Label htmlFor="title" className="sr-only">Ballot Title</Label>
                <Input
                  id="title"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="Enter ballot title (e.g., Q1 Rotation)"
                  className="text-lg"
                />
              </div>
              <Button onClick={createDraw} disabled={isCreating} size="lg">
                {isCreating ? (
                  <LoadingSpinner size="sm" />
                ) : (
                  <>
                    <Plus className="h-5 w-5 mr-2" />
                    Create Ballot
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Existing Ballots */}
        {draws.length === 0 ? (
          <Card className="text-center py-12">
            <CardContent>
              <Vote className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <h3 className="text-lg font-semibold text-foreground mb-2">No ballots yet</h3>
              <p className="text-muted-foreground">Create your first ballot to get started</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {draws.map((draw) => (
              <Card key={draw.id} className="transition-all hover:shadow-md">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="text-xl">{draw.title || 'Untitled Ballot'}</CardTitle>
                      <CardDescription>
                        Created {new Date(draw.created_at).toLocaleDateString()}
                      </CardDescription>
                    </div>
                    <div className={`px-3 py-1 rounded-full text-sm font-medium ${
                      draw.status === 'open' 
                        ? 'bg-success/10 text-success' 
                        : 'bg-muted text-muted-foreground'
                    }`}>
                      {draw.status === 'open' ? 'Open' : 'Closed'}
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Users className="h-4 w-4" />
                      <span>{draw.selections_count || 0} / {draw.participants_count} selections</span>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => copyLink(draw.id)}
                      >
                        <Copy className="h-4 w-4 mr-2" />
                        Copy Link
                      </Button>
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => navigate(`/draw/${draw.id}`)}
                      >
                        <ExternalLink className="h-4 w-4 mr-2" />
                        View
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
