import { useState } from 'react';
import { Search, Truck, FileText, Gift, Wallet, Shield, UserCheck, Pill } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { faqData, type FAQCategory } from '@/lib/support/faqData';

const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  Truck,
  FileText,
  Gift,
  Wallet,
  Shield,
  UserCheck,
  Pill,
};

export function FAQSection() {
  const [searchQuery, setSearchQuery] = useState('');

  const filteredFAQ = searchQuery
    ? faqData.map(category => ({
        ...category,
        questions: category.questions.filter(
          q =>
            q.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
            q.answer.toLowerCase().includes(searchQuery.toLowerCase())
        ),
      })).filter(category => category.questions.length > 0)
    : faqData;

  return (
    <div className="space-y-6">
      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search frequently asked questions..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* FAQ Categories */}
      {filteredFAQ.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          <p>No matching questions found.</p>
          <p className="text-sm mt-1">Try a different search term or browse all categories.</p>
        </div>
      ) : (
        <div className="space-y-6">
          {filteredFAQ.map((category) => (
            <FAQCategorySection key={category.category} category={category} />
          ))}
        </div>
      )}
    </div>
  );
}

function FAQCategorySection({ category }: { category: FAQCategory }) {
  const IconComponent = iconMap[category.icon] || FileText;

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <div className="p-2 rounded-lg bg-primary/10">
          <IconComponent className="h-4 w-4 text-primary" />
        </div>
        <h3 className="font-semibold font-mono text-foreground">{category.category}</h3>
      </div>
      
      <Accordion type="single" collapsible className="w-full">
        {category.questions.map((faq, index) => (
          <AccordionItem key={index} value={`${category.category}-${index}`} className="border-border/50">
            <AccordionTrigger className="text-left text-sm hover:no-underline hover:text-primary">
              {faq.question}
            </AccordionTrigger>
            <AccordionContent className="text-muted-foreground text-sm leading-relaxed">
              {faq.answer}
            </AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
    </div>
  );
}
