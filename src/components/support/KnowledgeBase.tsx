import { useState } from 'react';
import { ChevronRight, Package, Shield, Globe, Ban, ArrowLeft } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { knowledgeBaseData, type KnowledgeCategory, type KnowledgeArticle } from '@/lib/support/knowledgeBaseData';

const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  Package,
  Shield,
  Globe,
  Ban,
};

export function KnowledgeBase() {
  const [selectedCategory, setSelectedCategory] = useState<KnowledgeCategory | null>(null);
  const [selectedArticle, setSelectedArticle] = useState<KnowledgeArticle | null>(null);

  if (selectedArticle) {
    return (
      <ArticleView 
        article={selectedArticle} 
        onBack={() => setSelectedArticle(null)} 
      />
    );
  }

  if (selectedCategory) {
    return (
      <CategoryView 
        category={selectedCategory} 
        onBack={() => setSelectedCategory(null)}
        onSelectArticle={setSelectedArticle}
      />
    );
  }

  return (
    <div className="space-y-6">
      <div className="text-center space-y-2">
        <h3 className="text-lg font-semibold font-mono text-foreground">Knowledge Base</h3>
        <p className="text-muted-foreground text-sm">
          Browse our comprehensive guides and documentation
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {knowledgeBaseData.map((category) => {
          const IconComponent = iconMap[category.icon] || Package;
          return (
            <Card 
              key={category.id}
              className="cursor-pointer transition-all duration-200 hover:shadow-md hover:border-primary/50"
              onClick={() => setSelectedCategory(category)}
            >
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                    <IconComponent className="h-5 w-5 text-primary" />
                  </div>
                  <ChevronRight className="h-5 w-5 text-muted-foreground" />
                </div>
                <CardTitle className="text-base font-mono mt-3">{category.title}</CardTitle>
                <CardDescription className="text-sm">
                  {category.articles.length} articles
                </CardDescription>
              </CardHeader>
            </Card>
          );
        })}
      </div>
    </div>
  );
}

function CategoryView({ 
  category, 
  onBack, 
  onSelectArticle 
}: { 
  category: KnowledgeCategory; 
  onBack: () => void;
  onSelectArticle: (article: KnowledgeArticle) => void;
}) {
  const IconComponent = iconMap[category.icon] || Package;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={onBack}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
            <IconComponent className="h-4 w-4 text-primary" />
          </div>
          <h3 className="text-lg font-semibold font-mono text-foreground">{category.title}</h3>
        </div>
      </div>

      <div className="space-y-3">
        {category.articles.map((article) => (
          <Card 
            key={article.id}
            className="cursor-pointer transition-all duration-200 hover:shadow-sm hover:border-primary/50"
            onClick={() => onSelectArticle(article)}
          >
            <CardHeader className="py-4">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <CardTitle className="text-sm font-medium">{article.title}</CardTitle>
                  <CardDescription className="text-xs">
                    {article.summary}
                  </CardDescription>
                </div>
                <ChevronRight className="h-4 w-4 text-muted-foreground flex-shrink-0" />
              </div>
            </CardHeader>
          </Card>
        ))}
      </div>
    </div>
  );
}

function ArticleView({ 
  article, 
  onBack 
}: { 
  article: KnowledgeArticle; 
  onBack: () => void;
}) {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={onBack}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div className="space-y-1">
          <h3 className="text-lg font-semibold font-mono text-foreground">{article.title}</h3>
          <p className="text-sm text-muted-foreground">{article.summary}</p>
        </div>
      </div>

      <Card>
        <CardContent className="pt-6">
          <ScrollArea className="h-[400px] pr-4">
            <ul className="space-y-3">
              {article.content.map((item, index) => (
                <li key={index} className="flex gap-3 text-sm">
                  <span className="text-primary font-mono">•</span>
                  <span className="text-muted-foreground leading-relaxed">{item}</span>
                </li>
              ))}
            </ul>
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  );
}
