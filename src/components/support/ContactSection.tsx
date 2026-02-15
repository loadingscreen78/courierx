import { MessageCircle, Mail, Phone, ExternalLink } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

const contactOptions = [
  {
    icon: MessageCircle,
    title: 'WhatsApp Support',
    description: 'Chat with us instantly for quick resolutions',
    action: 'Open WhatsApp',
    href: 'https://wa.me/919876543210?text=Hi%2C%20I%20need%20help%20with%20my%20CourierX%20shipment',
    available: 'Available 24/7',
    responseTime: 'Instant response',
    accent: true,
  },
  {
    icon: Mail,
    title: 'Email Support',
    description: 'Detailed queries and documentation requests',
    action: 'Send Email',
    href: 'mailto:support@courierx.in?subject=Support%20Request',
    available: 'Always available',
    responseTime: 'Response within 4 hours',
    accent: false,
  },
  {
    icon: Phone,
    title: 'Phone Support',
    description: 'Speak directly with our support team',
    action: 'Call Now',
    href: 'tel:+919876543210',
    available: '10 AM - 8 PM IST',
    responseTime: 'Mon - Sat',
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
