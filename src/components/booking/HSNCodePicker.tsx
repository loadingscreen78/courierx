"use client";

import { useState, useMemo, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Search, HelpCircle, Check } from 'lucide-react';
import { useHaptics } from '@/hooks/useHaptics';

// Comprehensive HSN Code Database for common gift/personal items
const HSN_DATABASE = [
  // Textiles & Clothing
  { code: '50071000', name: 'Silk fabrics', category: 'Textiles' },
  { code: '52091100', name: 'Cotton fabrics (unbleached)', category: 'Textiles' },
  { code: '52094200', name: 'Denim fabrics', category: 'Textiles' },
  { code: '54076100', name: 'Polyester fabrics', category: 'Textiles' },
  { code: '58042100', name: 'Lace fabrics', category: 'Textiles' },
  { code: '61091000', name: 'T-shirts (cotton)', category: 'Clothing' },
  { code: '61099090', name: 'T-shirts (other materials)', category: 'Clothing' },
  { code: '61101100', name: 'Sweaters/Pullovers (wool)', category: 'Clothing' },
  { code: '61103090', name: 'Sweaters (synthetic)', category: 'Clothing' },
  { code: '62034290', name: 'Trousers/Pants (cotton)', category: 'Clothing' },
  { code: '62034990', name: 'Trousers (other materials)', category: 'Clothing' },
  { code: '62044200', name: 'Dresses (cotton)', category: 'Clothing' },
  { code: '62044990', name: 'Dresses (other materials)', category: 'Clothing' },
  { code: '62052000', name: 'Shirts (cotton)', category: 'Clothing' },
  { code: '62053090', name: 'Shirts (synthetic)', category: 'Clothing' },
  { code: '62063000', name: 'Blouses (cotton)', category: 'Clothing' },
  { code: '62114290', name: 'Sarees', category: 'Clothing' },
  { code: '62114990', name: 'Traditional wear', category: 'Clothing' },
  { code: '61082100', name: 'Briefs/Panties (cotton)', category: 'Clothing' },
  { code: '62121000', name: 'Brassieres', category: 'Clothing' },
  
  // Footwear
  { code: '64039100', name: 'Footwear (leather upper)', category: 'Footwear' },
  { code: '64041100', name: 'Sports footwear', category: 'Footwear' },
  { code: '64041990', name: 'Footwear (rubber/plastic)', category: 'Footwear' },
  { code: '64052000', name: 'Footwear (textile upper)', category: 'Footwear' },
  { code: '64061090', name: 'Shoe parts/uppers', category: 'Footwear' },
  
  // Bags & Accessories
  { code: '42021210', name: 'Handbags (leather)', category: 'Bags' },
  { code: '42021290', name: 'Handbags (other materials)', category: 'Bags' },
  { code: '42022100', name: 'Handbags (leather outer)', category: 'Bags' },
  { code: '42022210', name: 'Wallets/Purses (leather)', category: 'Bags' },
  { code: '42022290', name: 'Wallets/Purses (other)', category: 'Bags' },
  { code: '42023100', name: 'Wallets (leather)', category: 'Bags' },
  { code: '42029200', name: 'Shopping bags (plastic)', category: 'Bags' },
  { code: '42029900', name: 'Other bags/cases', category: 'Bags' },
  { code: '42031000', name: 'Leather garments', category: 'Bags' },
  { code: '42032100', name: 'Leather gloves (sports)', category: 'Bags' },
  { code: '42033000', name: 'Leather belts', category: 'Bags' },
  
  // Jewellery
  { code: '71131100', name: 'Silver jewellery', category: 'Jewellery' },
  { code: '71131910', name: 'Gold jewellery (unstudded)', category: 'Jewellery' },
  { code: '71131920', name: 'Gold jewellery (studded)', category: 'Jewellery' },
  { code: '71141100', name: 'Silver articles', category: 'Jewellery' },
  { code: '71171100', name: 'Cufflinks (base metal)', category: 'Jewellery' },
  { code: '71171900', name: 'Imitation jewellery (base metal)', category: 'Jewellery' },
  { code: '71179010', name: 'Imitation jewellery (bangles)', category: 'Jewellery' },
  { code: '71179020', name: 'Imitation jewellery (necklaces)', category: 'Jewellery' },
  { code: '71179090', name: 'Imitation jewellery (other)', category: 'Jewellery' },
  
  // Electronics & Accessories
  { code: '85171210', name: 'Mobile phones', category: 'Electronics' },
  { code: '85171290', name: 'Smartphones', category: 'Electronics' },
  { code: '85177010', name: 'Mobile phone parts', category: 'Electronics' },
  { code: '85177090', name: 'Phone accessories/cases', category: 'Electronics' },
  { code: '85183000', name: 'Headphones/Earphones', category: 'Electronics' },
  { code: '85198100', name: 'Sound recording apparatus', category: 'Electronics' },
  { code: '85258000', name: 'TV cameras/Digital cameras', category: 'Electronics' },
  { code: '85287100', name: 'Set-top boxes', category: 'Electronics' },
  { code: '91021100', name: 'Wrist watches (electronic)', category: 'Electronics' },
  { code: '91021900', name: 'Wrist watches (other)', category: 'Electronics' },
  { code: '91022100', name: 'Wrist watches (automatic)', category: 'Electronics' },
  { code: '85044090', name: 'Power adapters/Chargers', category: 'Electronics' },
  { code: '85234990', name: 'Memory cards/USB drives', category: 'Electronics' },
  
  // Cosmetics & Personal Care
  { code: '33030010', name: 'Perfumes', category: 'Cosmetics' },
  { code: '33030090', name: 'Eau de toilette', category: 'Cosmetics' },
  { code: '33041000', name: 'Lip makeup products', category: 'Cosmetics' },
  { code: '33042000', name: 'Eye makeup products', category: 'Cosmetics' },
  { code: '33043000', name: 'Manicure/Pedicure products', category: 'Cosmetics' },
  { code: '33049100', name: 'Face powders', category: 'Cosmetics' },
  { code: '33049910', name: 'Face creams', category: 'Cosmetics' },
  { code: '33049990', name: 'Other cosmetics', category: 'Cosmetics' },
  { code: '33051000', name: 'Shampoos', category: 'Cosmetics' },
  { code: '33052000', name: 'Hair conditioners', category: 'Cosmetics' },
  { code: '33059000', name: 'Other hair products', category: 'Cosmetics' },
  { code: '33061000', name: 'Dentifrices/Toothpaste', category: 'Cosmetics' },
  { code: '33069000', name: 'Other oral hygiene', category: 'Cosmetics' },
  { code: '33072000', name: 'Deodorants', category: 'Cosmetics' },
  
  // Toys & Games
  { code: '95030010', name: 'Tricycles/Scooters', category: 'Toys' },
  { code: '95030021', name: 'Dolls', category: 'Toys' },
  { code: '95030029', name: 'Doll accessories', category: 'Toys' },
  { code: '95030030', name: 'Electric trains', category: 'Toys' },
  { code: '95030040', name: 'Construction sets', category: 'Toys' },
  { code: '95030060', name: 'Puzzles', category: 'Toys' },
  { code: '95030090', name: 'Other toys', category: 'Toys' },
  { code: '95042000', name: 'Billiard articles', category: 'Toys' },
  { code: '95043000', name: 'Video games', category: 'Toys' },
  { code: '95044000', name: 'Playing cards', category: 'Toys' },
  { code: '95049090', name: 'Other games', category: 'Toys' },
  
  // Stationery & Office
  { code: '48201000', name: 'Registers/Notebooks', category: 'Stationery' },
  { code: '48202000', name: 'Exercise books', category: 'Stationery' },
  { code: '48209000', name: 'Other paper stationery', category: 'Stationery' },
  { code: '96081010', name: 'Ball point pens', category: 'Stationery' },
  { code: '96081020', name: 'Felt tip pens', category: 'Stationery' },
  { code: '96082000', name: 'Felt tipped markers', category: 'Stationery' },
  { code: '96083100', name: 'Drawing pens (Indian ink)', category: 'Stationery' },
  { code: '96089100', name: 'Pen nibs', category: 'Stationery' },
  { code: '96089910', name: 'Fountain pens', category: 'Stationery' },
  { code: '96089990', name: 'Other pens', category: 'Stationery' },
  
  // Home & Kitchen
  { code: '39241010', name: 'Tableware (plastic)', category: 'Home' },
  { code: '39249090', name: 'Household articles (plastic)', category: 'Home' },
  { code: '69111000', name: 'Tableware (porcelain)', category: 'Home' },
  { code: '69120010', name: 'Tableware (ceramic)', category: 'Home' },
  { code: '70134100', name: 'Glassware (lead crystal)', category: 'Home' },
  { code: '70139900', name: 'Other glassware', category: 'Home' },
  { code: '73239300', name: 'Tableware (stainless steel)', category: 'Home' },
  { code: '73239990', name: 'Household articles (steel)', category: 'Home' },
  { code: '74182000', name: 'Sanitary ware (copper)', category: 'Home' },
  { code: '76151090', name: 'Tableware (aluminium)', category: 'Home' },
  { code: '94016100', name: 'Upholstered seats (wooden)', category: 'Home' },
  { code: '94017100', name: 'Upholstered seats (metal)', category: 'Home' },
  { code: '94051000', name: 'Chandeliers', category: 'Home' },
  { code: '94052000', name: 'Table/Desk lamps', category: 'Home' },
  { code: '63021000', name: 'Bed linen (knitted)', category: 'Home' },
  { code: '63022100', name: 'Bed linen (cotton)', category: 'Home' },
  { code: '63025100', name: 'Table linen (cotton)', category: 'Home' },
  { code: '63026000', name: 'Toilet/Kitchen linen', category: 'Home' },
  
  // Food & Sweets (for gifts)
  { code: '17049010', name: 'Chocolates', category: 'Food' },
  { code: '17049020', name: 'Sugar confectionery', category: 'Food' },
  { code: '17049090', name: 'Other confectionery', category: 'Food' },
  { code: '18063100', name: 'Chocolate (filled)', category: 'Food' },
  { code: '18063200', name: 'Chocolate (unfilled)', category: 'Food' },
  { code: '18069000', name: 'Other chocolate products', category: 'Food' },
  { code: '19053100', name: 'Sweet biscuits', category: 'Food' },
  { code: '19053200', name: 'Waffles', category: 'Food' },
  { code: '20079100', name: 'Citrus fruit jams', category: 'Food' },
  { code: '20079990', name: 'Other jams/jellies', category: 'Food' },
  { code: '21069099', name: 'Food preparations', category: 'Food' },
  
  // Books & Art
  { code: '49011010', name: 'Printed books (educational)', category: 'Books' },
  { code: '49011020', name: 'Printed books (other)', category: 'Books' },
  { code: '49019100', name: 'Dictionaries/Encyclopedias', category: 'Books' },
  { code: '49019900', name: 'Other printed books', category: 'Books' },
  { code: '49030000', name: 'Children picture books', category: 'Books' },
  { code: '97011010', name: 'Paintings (hand-painted)', category: 'Art' },
  { code: '97019000', name: 'Collages/Decorative plaques', category: 'Art' },
  { code: '97020000', name: 'Original engravings/prints', category: 'Art' },
  { code: '97030000', name: 'Original sculptures', category: 'Art' },
  
  // Sports & Fitness
  { code: '95061100', name: 'Skis', category: 'Sports' },
  { code: '95063100', name: 'Golf clubs', category: 'Sports' },
  { code: '95063200', name: 'Golf balls', category: 'Sports' },
  { code: '95064000', name: 'Table tennis equipment', category: 'Sports' },
  { code: '95065100', name: 'Tennis rackets', category: 'Sports' },
  { code: '95065900', name: 'Badminton rackets', category: 'Sports' },
  { code: '95066100', name: 'Tennis balls', category: 'Sports' },
  { code: '95066200', name: 'Inflatable balls', category: 'Sports' },
  { code: '95067000', name: 'Ice skates/Roller skates', category: 'Sports' },
  { code: '95069110', name: 'Gym/Fitness equipment', category: 'Sports' },
  { code: '95069990', name: 'Other sports equipment', category: 'Sports' },
];

// Get unique categories
const CATEGORIES = [...new Set(HSN_DATABASE.map(item => item.category))];

interface HSNCodePickerProps {
  value: string;
  onSelect: (code: string) => void;
  showInitialHint?: boolean;
}

export const HSNCodePicker = ({ value, onSelect, showInitialHint = true }: HSNCodePickerProps) => {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [showTooltip, setShowTooltip] = useState(false);
  const { lightTap } = useHaptics();

  // Auto-show tooltip for 5 seconds on first render
  useEffect(() => {
    if (showInitialHint) {
      setShowTooltip(true);
      const timer = setTimeout(() => {
        setShowTooltip(false);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [showInitialHint]);

  const filteredCodes = useMemo(() => {
    let results = HSN_DATABASE;
    
    if (selectedCategory) {
      results = results.filter(item => item.category === selectedCategory);
    }
    
    if (search.trim()) {
      const searchLower = search.toLowerCase();
      results = results.filter(item => 
        item.code.includes(search) || 
        item.name.toLowerCase().includes(searchLower) ||
        item.category.toLowerCase().includes(searchLower)
      );
    }
    
    return results;
  }, [search, selectedCategory]);

  const handleSelect = (code: string) => {
    lightTap();
    onSelect(code);
    setOpen(false);
    setSearch('');
    setSelectedCategory(null);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <Tooltip open={showTooltip} onOpenChange={setShowTooltip}>
        <TooltipTrigger asChild>
          <DialogTrigger asChild>
            <Button
              type="button"
              variant="outline"
              size="icon"
              className="h-10 w-10 shrink-0 relative"
              onClick={() => { lightTap(); setShowTooltip(false); }}
              onMouseEnter={() => setShowTooltip(true)}
              onMouseLeave={() => setShowTooltip(false)}
            >
              <HelpCircle className="h-4 w-4" />
            </Button>
          </DialogTrigger>
        </TooltipTrigger>
        <TooltipContent 
          side="top" 
          className="bg-foreground text-background px-3 py-2 max-w-[200px] text-center"
        >
          <p className="text-sm font-medium">Don&apos;t know your HSN code?</p>
          <p className="text-xs opacity-80 mt-1">Click here to search and find the right code for your item</p>
        </TooltipContent>
      </Tooltip>
      <DialogContent className="max-w-lg max-h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="font-typewriter">Find HSN Code</DialogTitle>
        </DialogHeader>
        
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by item name or code..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
            autoFocus
          />
        </div>

        {/* Category Filter */}
        <div className="flex flex-wrap gap-2">
          <Button
            type="button"
            variant={selectedCategory === null ? "default" : "outline"}
            size="sm"
            onClick={() => { lightTap(); setSelectedCategory(null); }}
            className={selectedCategory === null ? "bg-coke-red hover:bg-red-600" : ""}
          >
            All
          </Button>
          {CATEGORIES.map(category => (
            <Button
              key={category}
              type="button"
              variant={selectedCategory === category ? "default" : "outline"}
              size="sm"
              onClick={() => { lightTap(); setSelectedCategory(category); }}
              className={selectedCategory === category ? "bg-coke-red hover:bg-red-600" : ""}
            >
              {category}
            </Button>
          ))}
        </div>

        {/* Results */}
        <ScrollArea className="flex-1 -mx-6 px-6">
          <div className="space-y-1 py-2">
            {filteredCodes.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">
                No HSN codes found. Try a different search.
              </p>
            ) : (
              filteredCodes.map((item) => (
                <button
                  key={item.code}
                  type="button"
                  onClick={() => handleSelect(item.code)}
                  className={`w-full flex items-center gap-3 p-3 rounded-lg text-left transition-colors ${
                    value === item.code 
                      ? 'bg-coke-red/10 border border-coke-red/30' 
                      : 'hover:bg-muted/50'
                  }`}
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-semibold text-foreground">{item.code}</span>
                      <span className="text-xs px-2 py-0.5 rounded-full bg-muted text-muted-foreground">
                        {item.category}
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground truncate mt-0.5">{item.name}</p>
                  </div>
                  {value === item.code && (
                    <Check className="h-4 w-4 text-coke-red shrink-0" />
                  )}
                </button>
              ))
            )}
          </div>
        </ScrollArea>

        <p className="text-xs text-muted-foreground text-center pt-2 border-t">
          {filteredCodes.length} codes found • Select the most appropriate code for your item
        </p>
      </DialogContent>
    </Dialog>
  );
};
