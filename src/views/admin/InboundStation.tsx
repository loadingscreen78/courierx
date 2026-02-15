"use client";

import { useState, useRef, useEffect } from 'react';
import { AdminLayout } from '@/components/admin/layout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  ScanLine, 
  Search, 
  CheckCircle2, 
  XCircle, 
  Package, 
  User, 
  MapPin,
  Phone,
  ArrowRight
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useSoundEffects } from '@/hooks/useSoundEffects';
import { useRouter } from 'next/navigation';

interface FoundShipment {
  id: string;
  tracking_number: string;
  domestic_tracking_id: string;
  recipient_name: string;
  recipient_phone: string;
  destination_country: string;
  shipment_type: string;
  status: string;
  user_id: string;
  profiles?: {
    full_name: string;
    phone_number: string;
  };
}

export default function InboundStation() {
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [foundShipment, setFoundShipment] = useState<FoundShipment | null>(null);
  const [searchResult, setSearchResult] = useState<'found' | 'not_found' | null>(null);
  const [isMarking, setIsMarking] = useState(false);
  
  const inputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  const { playSuccess, playError } = useSoundEffects();
  const router = useRouter();

  // Auto-focus input on mount
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;

    setIsSearching(true);
    setFoundShipment(null);
    setSearchResult(null);

    try {
      // Search by domestic tracking ID or tracking number
      const { data, error } = await supabase
        .from('shipments')
        .select('*')
        .or(`domestic_tracking_id.eq.${searchQuery},tracking_number.eq.${searchQuery}`)
        .maybeSingle();

      if (error) throw error;

      if (data) {
        setFoundShipment(data);
        setSearchResult('found');
        playSuccess();
        toast({
          title: 'Shipment Found!',
          description: `Tracking: ${data.tracking_number || data.domestic_tracking_id}`,
        });
      } else {
        setSearchResult('not_found');
        playError();
        toast({
          title: 'Shipment Not Found',
          description: 'No matching shipment found. Try searching by phone number.',
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('Search error:', error);
      playError();
      toast({
        title: 'Search Error',
        description: 'Failed to search for shipment.',
        variant: 'destructive',
      });
    } finally {
      setIsSearching(false);
    }
  };

  const handleMarkArrived = async () => {
    if (!foundShipment) return;

    setIsMarking(true);

    try {
      // Update shipment status
      const { error: updateError } = await supabase
        .from('shipments')
        .update({ status: 'at_warehouse' })
        .eq('id', foundShipment.id);

      if (updateError) throw updateError;

      // Add tracking log
      const { error: logError } = await supabase
        .from('domestic_tracking_logs')
        .insert({
          shipment_id: foundShipment.id,
          status: 'DELIVERED_TO_WAREHOUSE',
          location: 'CourierX Warehouse, Mumbai',
        });

      if (logError) throw logError;

      playSuccess();
      toast({
        title: 'Status Updated!',
        description: 'Shipment marked as arrived at warehouse.',
      });

      // Reset for next scan
      setSearchQuery('');
      setFoundShipment(null);
      setSearchResult(null);
      inputRef.current?.focus();
    } catch (error) {
      console.error('Update error:', error);
      playError();
      toast({
        title: 'Update Failed',
        description: 'Failed to update shipment status.',
        variant: 'destructive',
      });
    } finally {
      setIsMarking(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  return (
    <AdminLayout>
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="text-center">
          <h1 className="text-2xl font-typewriter font-bold">Inbound Station</h1>
          <p className="text-muted-foreground">Scan or enter domestic AWB to receive packages</p>
        </div>

        {/* Scanner Input - Prominent */}
        <Card className="border-2 border-dashed border-primary/30">
          <CardContent className="p-8">
            <div className="flex flex-col items-center gap-6">
              <div className="w-20 h-20 rounded-2xl bg-primary/10 flex items-center justify-center">
                <ScanLine className="h-10 w-10 text-primary" />
              </div>
              
              <div className="w-full max-w-md space-y-4">
                <div className="relative">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                  <Input
                    ref={inputRef}
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="Scan barcode or enter AWB number..."
                    className="pl-12 h-14 text-lg font-typewriter text-center"
                    autoComplete="off"
                  />
                </div>
                
                <Button 
                  onClick={handleSearch} 
                  className="w-full h-12 btn-press"
                  disabled={isSearching || !searchQuery.trim()}
                >
                  {isSearching ? 'Searching...' : 'Search Shipment'}
                </Button>
              </div>

              <p className="text-sm text-muted-foreground">
                Scan the domestic courier barcode (Delhivery/BlueDart AWB) or enter manually
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Search Result */}
        {searchResult === 'found' && foundShipment && (
          <Card className="border-success/50 bg-success/5">
            <CardHeader className="pb-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-success/20 flex items-center justify-center">
                  <CheckCircle2 className="h-5 w-5 text-success" />
                </div>
                <div>
                  <CardTitle className="font-typewriter">Shipment Found</CardTitle>
                  <CardDescription>
                    {foundShipment.tracking_number || foundShipment.domestic_tracking_id}
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Shipment Details */}
              <div className="grid grid-cols-2 gap-4">
                <div className="flex items-start gap-3">
                  <User className="h-5 w-5 text-muted-foreground mt-0.5" />
                  <div>
                    <p className="text-sm text-muted-foreground">Recipient</p>
                    <p className="font-medium">{foundShipment.recipient_name}</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Phone className="h-5 w-5 text-muted-foreground mt-0.5" />
                  <div>
                    <p className="text-sm text-muted-foreground">Phone</p>
                    <p className="font-medium">{foundShipment.recipient_phone || 'N/A'}</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <MapPin className="h-5 w-5 text-muted-foreground mt-0.5" />
                  <div>
                    <p className="text-sm text-muted-foreground">Destination</p>
                    <p className="font-medium">{foundShipment.destination_country}</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Package className="h-5 w-5 text-muted-foreground mt-0.5" />
                  <div>
                    <p className="text-sm text-muted-foreground">Type</p>
                    <Badge variant="outline" className="capitalize">
                      {foundShipment.shipment_type}
                    </Badge>
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-3 pt-4 border-t">
                <Button 
                  onClick={handleMarkArrived}
                  className="flex-1 btn-press bg-success hover:bg-success/90"
                  disabled={isMarking || foundShipment.status === 'at_warehouse'}
                >
                  {isMarking ? 'Updating...' : foundShipment.status === 'at_warehouse' ? 'Already Received' : 'Mark as Arrived'}
                </Button>
                <Button 
                  variant="outline"
                  onClick={() => router.push(`/admin/qc/${foundShipment.id}`)}
                  className="btn-press"
                >
                  Go to QC
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Not Found State */}
        {searchResult === 'not_found' && (
          <Card className="border-destructive/50 bg-destructive/5">
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-destructive/20 flex items-center justify-center">
                  <XCircle className="h-6 w-6 text-destructive" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold">Unknown Shipment</h3>
                  <p className="text-sm text-muted-foreground">
                    No shipment found with AWB: {searchQuery}
                  </p>
                </div>
              </div>
              <div className="mt-4 pt-4 border-t">
                <p className="text-sm text-muted-foreground mb-3">Try searching by:</p>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={() => {
                    setSearchQuery('');
                    setSearchResult(null);
                    inputRef.current?.focus();
                  }}>
                    Customer Phone
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => {
                    setSearchQuery('');
                    setSearchResult(null);
                    inputRef.current?.focus();
                  }}>
                    Booking ID
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </AdminLayout>
  );
}

