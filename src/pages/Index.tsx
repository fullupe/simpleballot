import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Vote, Shield, Users, Eye, ArrowRight } from 'lucide-react';

export default function Index() {
  const navigate = useNavigate();

  const currentYear = new Date().getFullYear();

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <header className="relative overflow-hidden">
        <div className="absolute inset-0 gradient-hero opacity-10" />
        <div className="container mx-auto px-4 py-8">
          <nav className="flex items-center justify-between mb-16">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg gradient-hero">
                <Vote className="h-6 w-6 text-primary-foreground" />
              </div>
              <span className="text-xl font-bold text-foreground">FairDraw</span>
            </div>
            <Button variant="outline" onClick={() => navigate('/auth')}>
              Admin Login
            </Button>
          </nav>

          <div className="max-w-3xl mx-auto text-center py-16 animate-fade-in">
            <h1 className="text-5xl md:text-6xl font-bold text-foreground mb-6 leading-tight">
              Transparent Group Ballots,
              <span className="text-primary"> Made Simple</span>
            </h1>
            <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
              Create fair, real-time selection systems for rotating schedules, 
              team assignments, or any group decision that needs transparency.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button variant="hero" size="xl" onClick={() => navigate('/auth')}>
                Create a Ballot
                <ArrowRight className="h-5 w-5 ml-2" />
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* How it Works */}
      <section className="py-20 bg-secondary/30">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center text-foreground mb-12">
            How It Works
          </h2>
          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {[
              {
                step: '1',
                title: 'Admin Creates',
                description: 'Sign in and create a ballot. A shuffled mapping is generated instantly.',
                icon: Shield,
              },
              {
                step: '2',
                title: 'Members Pick',
                description: 'Share the link. Members enter their name and select an available slot.',
                icon: Users,
              },
              {
                step: '3',
                title: 'Results Reveal',
                description: 'Once everyone picks, the hidden positions are revealed to all.',
                icon: Eye,
              },
            ].map((item, index) => (
              <Card 
                key={item.step} 
                className="relative border-2 hover:border-primary/30 transition-all hover:shadow-lg animate-slide-up"
                style={{ animationDelay: `${index * 100}ms` }}
              >
                <CardContent className="pt-8 pb-6 text-center">
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2 w-8 h-8 rounded-full gradient-hero flex items-center justify-center text-primary-foreground font-bold">
                    {item.step}
                  </div>
                  <item.icon className="h-10 w-10 mx-auto mb-4 text-primary" />
                  <h3 className="text-xl font-semibold text-foreground mb-2">{item.title}</h3>
                  <p className="text-muted-foreground">{item.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-20">
        <div className="container mx-auto px-4 max-w-4xl">
          <h2 className="text-3xl font-bold text-center text-foreground mb-12">
            Built for Fairness
          </h2>
          <div className="grid sm:grid-cols-2 gap-6">
            {[
              {
                title: 'Real-time Updates',
                description: 'See selections appear instantly across all devices',
              },
              {
                title: 'One Pick Per Person',
                description: 'Session tracking ensures no duplicate selections',
              },
              {
                title: 'Hidden Until Complete',
                description: 'Position mappings revealed only when everyone picks',
              },
              {
                title: 'No Account Needed',
                description: 'Members join with just their name—no sign-up required',
              },
            ].map((feature) => (
              <div 
                key={feature.title}
                className="flex gap-4 p-4 rounded-lg hover:bg-secondary/50 transition-colors"
              >
                <div className="h-10 w-10 rounded-lg gradient-hero flex items-center justify-center flex-shrink-0">
                  <Vote className="h-5 w-5 text-primary-foreground" />
                </div>
                <div>
                  <h3 className="font-semibold text-foreground">{feature.title}</h3>
                  <p className="text-sm text-muted-foreground">{feature.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 gradient-hero">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold text-primary-foreground mb-4">
            Ready to create a fair ballot?
          </h2>
          <p className="text-primary-foreground/80 mb-8">
            Set up your first group ballot in under a minute
          </p>
          <Button 
            variant="secondary" 
            size="xl" 
            onClick={() => navigate('/auth')}
            className="bg-background text-foreground hover:bg-background/90"
          >
            Get Started Free
            <ArrowRight className="h-5 w-5 ml-2" />
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 border-t border-border">
        {/* <div className="container mx-auto px-4 text-center text-muted-foreground">
          <p>© 2024 FairDraw. Built for transparent group decisions.</p>
        </div> */}
        <div className="container mx-auto px-4 text-center text-muted-foreground">
        <p>
          &copy; {currentYear} FairDraw. Built for transparent group decisions.
        </p>
        <p className="mt-1 text-sm">
          A project by{' '}
          <a
            href="https://williamg.vercel.app"
            target="_blank"
            rel="noopener noreferrer"
            className="text-primary hover:underline transition-colors"
          >
            William G.
          </a>
        </p>
      </div>
      </footer>
    </div>
  );
}