import { Mail, Phone, ExternalLink } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

const contactOptions = [
  {
    icon: Phone,
    title: 'East India Support',
    description: 'Speak directly with our Eastern India team',
    action: 'Call Now',
    href: 'tel:+917008368628',
    available: '10 AM - 8 PM IST',
    responseTime: '+91 7008368628',
    accent: true,
  },
  {
    icon: Phone,
    title: 'West India Support',
    description: 'Speak directly with our Western India team',
    action: 'Call Now',
    href: 'tel:+918484050057',
    available: '10 AM - 8 PM IST',
    responseTime: '+91 8484050057',
    accent: false,
  },
  {
    icon: Mail,
    title: 'Email Support',
    description: 'Detailed queries and documentation requests',
    action: 'Send Email',
    href: 'mailto:info@courierx.in?subject=Support%20Request',
    available: 'Always available',
    responseTime: 'info@courierx.in',
    accent: false,
  },
];

export function ContactSection() {
  return (
    <div className="space-y-6">
      <div className="text-center space-y-2">
        <h3 className="text-lg font-semibold font-mono text-foreground">Get in Touch</h3>
        <p className="text-muted-foreground text-sm">
          Choose your preferred way to reach us. Our support team is here to help.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        {contactOptions.map((option) => (
          <Card 
            key={option.title} 
            className={`transition-all duration-200 hover:shadow-md ${
              option.accent ? 'border-primary/50 bg-primary/5' : ''
            }`}
          >
            <CardHeader className="pb-3">
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-3 ${
                option.accent ? 'bg-primary text-primary-foreground' : 'bg-muted'
              }`}>
                <option.icon className="h-6 w-6" />
              </div>
              <CardTitle className="text-base font-mono">{option.title}</CardTitle>
              <CardDescription className="text-sm">
                {option.description}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-1 text-sm">
                <p className="text-muted-foreground">{option.available}</p>
                <p className="text-muted-foreground">{option.responseTime}</p>
              </div>
              <Button 
                asChild 
                className="w-full" 
                variant={option.accent ? 'default' : 'outline'}
              >
                <a href={option.href} target="_blank" rel="noopener noreferrer">
                  {option.action}
                  <ExternalLink className="ml-2 h-4 w-4" />
                </a>
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Additional Info */}
      <Card className="bg-muted/50">
        <CardContent className="pt-6">
          <div className="text-center space-y-2">
            <p className="text-sm text-muted-foreground">
              For fastest resolution, have your <span className="font-medium text-foreground">Tracking Number</span> or{' '}
              <span className="font-medium text-foreground">Booking ID</span> ready when contacting support.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
