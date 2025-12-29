import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import { useToast } from '@/hooks/use-toast';
import { ArrowLeft, Send, Trash2, MessageSquare } from 'lucide-react';
import { format } from 'date-fns';

interface Comment {
  id: string;
  user_id: string;
  content: string;
  created_at: string;

    profiles?: {
    email: string | null;
  };
}

interface Profile {
  id: string;
  email: string | null;
}

export default function Comments() {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [comments, setComments] = useState<Comment[]>([]);
    const [profiles, setProfiles] = useState<Map<string, string>>(new Map());
  const [newComment, setNewComment] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/auth');
    }
  }, [user, authLoading, navigate]);

  useEffect(() => {
    if (user) {
      fetchComments();
    }
  }, [user]);

  // const fetchComments = async () => {
  //   try {
  //     const { data, error } = await supabase
  //       .from('comments')
  //       .select('id, user_id, content, created_at')
  //       .order('created_at', { ascending: false });

  //     if (error) throw error;
  //     setComments((data || []) as Comment[]);
  //   } catch (error: any) {
  //     toast({
  //       title: 'Error',
  //       description: 'Failed to load comments',
  //       variant: 'destructive',
  //     });
  //   } finally {
  //     setLoading(false);
  //   }
  // };

   const fetchComments = async () => {
    try {
      const { data: commentsData, error: commentsError } = await supabase
        .from('comments')
        .select('id, user_id, content, created_at')
        .order('created_at', { ascending: false });

      if (commentsError) throw commentsError;

      const userIds = [...new Set((commentsData || []).map(c => c.user_id))];
      
      if (userIds.length > 0) {
        const { data: profilesData } = await supabase
          .from('profiles')
          .select('id, email')
          .in('id', userIds);
        
        const profileMap = new Map<string, string>();
        (profilesData || []).forEach((p: Profile) => {
          if (p.email) {
            profileMap.set(p.id, p.email.substring(0, 2).toUpperCase());
          }
        });
        setProfiles(profileMap);
      }

      setComments((commentsData || []) as Comment[]);
    } catch (error: any) {
      toast({
        title: 'Error',
        description: 'Failed to load comments',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };






  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim() || !user) return;

    setSubmitting(true);
    try {
      const { error } = await supabase.from('comments').insert({
        user_id: user.id,
        content: newComment.trim(),
      });

      if (error) throw error;

      setNewComment('');
      toast({
        title: 'Success',
        description: 'Comment added successfully',
      });
      fetchComments();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: 'Failed to add comment',
        variant: 'destructive',
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (commentId: string) => {
    try {
      const { error } = await supabase
        .from('comments')
        .delete()
        .eq('id', commentId);

      if (error) throw error;

      toast({
        title: 'Deleted',
        description: 'Comment removed',
      });
      fetchComments();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: 'Failed to delete comment',
        variant: 'destructive',
      });
    }
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container max-w-2xl mx-auto py-8 px-4">
        <Button
          variant="ghost"
          onClick={() => navigate('/dashboard')}
          className="mb-6"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Dashboard
        </Button>

        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MessageSquare className="h-5 w-5" />
              Comments
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <Textarea
                placeholder="Write a comment..."
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                className="min-h-[100px]"
              />
              <Button type="submit" disabled={submitting || !newComment.trim()}>
                {submitting ? (
                  <LoadingSpinner size="sm" className="mr-2" />
                ) : (
                  <Send className="mr-2 h-4 w-4" />
                )}
                Post Comment
              </Button>
            </form>
          </CardContent>
        </Card>

        <div className="space-y-4">
          {comments.length === 0 ? (
            <Card>
              <CardContent className="py-8 text-center text-muted-foreground">
                No comments yet. Be the first to comment!
              </CardContent>
            </Card>
          ) : (
            comments.map((comment) => (
              <Card key={comment.id}>
                <CardContent className="pt-4">
                  <div className="flex justify-between items-start gap-4">
                    <div className="flex-1">
                      {/* <p className="text-sm text-muted-foreground mb-2">
                        {format(new Date(comment.created_at), 'MMM d, yyyy h:mm a')}
                      </p> */}

                       <div className="flex items-center gap-2 mb-2">
                        <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-primary text-primary-foreground text-xs font-medium">
                          {profiles.get(comment.user_id) || '??'}
                        </span>
                        <p className="text-sm text-muted-foreground">
                          {format(new Date(comment.created_at), 'MMM d, yyyy h:mm a')}
                        </p>
                      </div>


                      <p className="text-foreground whitespace-pre-wrap">
                        {comment.content}
                      </p>
                    </div>
                    {comment.user_id === user?.id && (
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDelete(comment.id)}
                        className="text-destructive hover:text-destructive"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
