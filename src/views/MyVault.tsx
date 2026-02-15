"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { MapPin, FileText, Plus, ChevronRight, CheckCircle, Clock } from 'lucide-react';
import { AppLayout } from '@/components/layout/AppLayout';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { AnimatedTabContent } from '@/components/ui/loading/AnimatedTabContent';
import { AddressesTabSkeleton, DocumentsTabSkeleton } from '@/components/vault/skeletons';
import { useAddresses, type Address } from '@/hooks/useAddresses';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useQuery } from '@tanstack/react-query';

const AddressPreviewCard = ({ address }: { address: Address }) => {
  const router = useRouter();
  
  return (
    <div 
      className="flex items-center justify-between p-3 bg-muted/50 rounded-lg cursor-pointer hover:bg-muted transition-colors"
      onClick={() => router.push('/addresses')}
    >
      <div className="flex items-center gap-3">
        <div className="p-2 bg-primary/10 rounded-lg">
          <MapPin className="h-4 w-4 text-primary" />
        </div>
        <div>
          <p className="font-medium text-sm capitalize flex items-center gap-2">
            {address.label}
            {address.is_default && (
              <Badge variant="outline" className="text-xs">Default</Badge>
            )}
          </p>
          <p className="text-xs text-muted-foreground truncate max-w-[200px]">
            {address.address_line_1}, {address.city}
          </p>
        </div>
      </div>
      <ChevronRight className="h-4 w-4 text-muted-foreground" />
    </div>
  );
};

const MyVault = () => {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('addresses');
  const { addresses, loading: addressesLoading } = useAddresses();
  const { user } = useAuth();

  // Fetch KYC status from profile
  const { data: profile, isLoading: profileLoading } = useQuery({
    queryKey: ['profile-kyc', user?.id],
    queryFn: async () => {
      if (!user) return null;
      const { data, error } = await supabase
        .from('profiles')
        .select('aadhaar_verified, kyc_completed_at, aadhaar_address')
        .eq('user_id', user.id)
        .maybeSingle();
      
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  const pickupAddresses = addresses.filter(a => a.type === 'pickup').slice(0, 3);
  const deliveryAddresses = addresses.filter(a => a.type === 'delivery').slice(0, 3);

  return (
    <AppLayout>
      <div className="max-w-4xl mx-auto space-y-6 animate-fade-in">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-typewriter font-bold">My Vault</h1>
          <p className="text-muted-foreground">Manage your saved addresses and KYC documents</p>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2 mb-6">
            <TabsTrigger value="addresses" className="flex items-center gap-2">
              <MapPin className="h-4 w-4" />
              Addresses
            </TabsTrigger>
            <TabsTrigger value="documents" className="flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Documents
            </TabsTrigger>
          </TabsList>

          <TabsContent value="addresses">
            <AnimatedTabContent tabKey={activeTab}>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                  <div>
                    <CardTitle className="text-lg">Saved Addresses</CardTitle>
                    <CardDescription>Your frequently used recipient addresses</CardDescription>
                  </div>
                  <Button 
                    size="sm" 
                    className="bg-[#FF2D2D] hover:bg-[#FF2D2D]/90 text-white shadow-lg shadow-[#FF2D2D]/30"
                    onClick={() => router.push('/vault/add-address')}
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Add Address
                  </Button>
                </CardHeader>
                <CardContent className="space-y-4">
                  {addressesLoading ? (
                    <AddressesTabSkeleton />
                  ) : addresses.length === 0 ? (
                    <div className="text-center py-12 text-muted-foreground">
                      <MapPin className="h-12 w-12 mx-auto mb-4 opacity-30" />
                      <p>No saved addresses yet</p>
                      <p className="text-sm mb-4">Add addresses for quick checkout</p>
                      <Button 
                        className="bg-[#FF2D2D] hover:bg-[#FF2D2D]/90 text-white shadow-lg shadow-[#FF2D2D]/30"
                        onClick={() => router.push('/vault/add-address')}
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        Add Your First Address
                      </Button>
                    </div>
                  ) : (
                    <>
                      {/* Pickup Addresses */}
                      {pickupAddresses.length > 0 && (
                        <div className="space-y-2">
                          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                            Pickup Addresses
                          </p>
                          {pickupAddresses.map((address) => (
                            <AddressPreviewCard key={address.id} address={address} />
                          ))}
                        </div>
                      )}
                      
                      {/* Delivery Addresses */}
                      {deliveryAddresses.length > 0 && (
                        <div className="space-y-2">
                          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                            Delivery Addresses
                          </p>
                          {deliveryAddresses.map((address) => (
                            <AddressPreviewCard key={address.id} address={address} />
                          ))}
                        </div>
                      )}
                      
                      {addresses.length > 6 && (
                        <Button 
                          variant="ghost" 
                          className="w-full" 
                          onClick={() => router.push('/addresses')}
                        >
                          View all {addresses.length} addresses
                          <ChevronRight className="h-4 w-4 ml-2" />
                        </Button>
                      )}
                    </>
                  )}
                </CardContent>
              </Card>
            </AnimatedTabContent>
          </TabsContent>

          <TabsContent value="documents">
            <AnimatedTabContent tabKey={activeTab}>
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">KYC Documents</CardTitle>
                  <CardDescription>Your verified identity documents</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {profileLoading ? (
                    <DocumentsTabSkeleton />
                  ) : (
                    <>
                      {/* Aadhaar Card Status */}
                      <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
                        <div className="flex items-center gap-3">
                          <div className={`p-2 rounded-lg ${profile?.aadhaar_verified ? 'bg-success/20' : 'bg-warning/20'}`}>
                            {profile?.aadhaar_verified ? (
                              <CheckCircle className="h-5 w-5 text-success" />
                            ) : (
                              <Clock className="h-5 w-5 text-warning" />
                            )}
                          </div>
                          <div>
                            <p className="font-medium">Aadhaar Card</p>
                            <p className="text-sm text-muted-foreground">Primary KYC Document</p>
                            {profile?.aadhaar_verified && profile?.aadhaar_address && (
                              <p className="text-xs text-muted-foreground mt-1 max-w-[300px] truncate">
                                {profile.aadhaar_address}
                              </p>
                            )}
                          </div>
                        </div>
                        {profile?.aadhaar_verified ? (
                          <span className="text-xs font-medium px-2 py-1 bg-success/20 text-success rounded-full">
                            Verified
                          </span>
                        ) : (
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={() => router.push('/kyc')}
                          >
                            Verify Now
                          </Button>
                        )}
                      </div>

                      {/* Uploaded Documents */}
                      <div className="text-center py-8 text-muted-foreground border-t pt-8">
                        <FileText className="h-10 w-10 mx-auto mb-3 opacity-30" />
                        <p className="text-sm">Other documents will appear here</p>
                        <p className="text-xs">Prescriptions, IDs, and invoices from bookings</p>
                      </div>
                    </>
                  )}
                </CardContent>
              </Card>
            </AnimatedTabContent>
          </TabsContent>
        </Tabs>
      </div>
    </AppLayout>
  );
};

export default MyVault;

