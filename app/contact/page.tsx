import Contact from '@/views/Contact';

export const metadata = {
  title: 'Contact Us — CourierX Shipping Support & Inquiries',
  description: 'Get in touch with CourierX for international and domestic shipping inquiries, support, tracking help, and partnership opportunities. Available via email, phone, and WhatsApp.',
  keywords: ['contact courierx', 'courier support India', 'shipping help', 'courier customer service'],
  alternates: { canonical: 'https://courierx.in/contact' },
};

export default function ContactPage() {
  return <Contact />;
}
