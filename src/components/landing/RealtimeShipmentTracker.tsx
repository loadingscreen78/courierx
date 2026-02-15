"use client";

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Package, Clock, MapPin, TrendingUp, Sparkles } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface ShipmentData {
  id: string;
  tracking_number: string;
  shipment_type: string;
  status: string;
  destination_country: string;
  destination_address: string;
  total_amount: number;
  created_at: string;
}

export const RealtimeShipmentTracker = () => {
  const [shipments, setShipments] = useState<ShipmentData[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  // Fetch top 5 recent shipments
  useEffect(() => {
    const fetchShipments = async () => {
      try {
        console.log('🔍 Fetching shipments from database...');
        
        // Try to get all shipments (including drafts for now to debug)
        const { data, error, count } = await supabase
          .from('shipments')
          .select('id, tracking_number, shipment_type, status, destination_country, destination_address, total_amount, created_at', { count: 'exact' })
          .order('created_at', { ascending: false })
          .limit(5);

        console.log('📊 Query result:', { data, error, count });

        if (error) {
          console.error('❌ Error fetching shipments:', error);
          console.error('Error details:', JSON.stringify(error, null, 2));
        } else if (data && data.length > 0) {
          console.log('✅ Fetched shipments:', data);
          console.log(`📦 Found ${data.length} shipments`);
          setShipments(data);
        } else {
          console.log('⚠️ No shipments found in database');
          console.log('Total count:', count);
        }
      } catch (error) {
        console.error('💥 Exception while fetching shipments:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchShipments();

    // Subscribe to real-time updates
    const channel = supabase
      .channel('shipments-tracker')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'shipments'
        },
        () => {
          console.log('Shipment update detected, refetching...');
          fetchShipments();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  // Auto-rotate through shipments - SLOWER (6 seconds)
  useEffect(() => {
    if (shipments.length <= 1) return;

    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % shipments.length);
    }, 6000); // Changed from 4s to 6s for slower, more elegant transitions

    return () => clearInterval(interval);
  }, [shipments.length]);

  const getStatusColor = (status: string) => {
    const statusMap: Record<string, string> = {
      'draft': 'bg-gray-500/20 text-gray-500',
      'confirmed': 'bg-blue-500/20 text-blue-500',
      'picked_up': 'bg-purple-500/20 text-purple-500',
      'in_transit': 'bg-yellow-500/20 text-yellow-500',
      'customs_cleared': 'bg-orange-500/20 text-orange-500',
      'customs_clearance': 'bg-orange-500/20 text-orange-500',
      'out_for_delivery': 'bg-cyan-500/20 text-cyan-500',
      'delivered': 'bg-candlestick-green/20 text-candlestick-green',
      'cancelled': 'bg-red-500/20 text-red-500',
    };
    return statusMap[status] || 'bg-gray-500/20 text-gray-500';
  };

  const getStatusText = (status: string) => {
    const textMap: Record<string, string> = {
      'draft': 'Draft',
      'confirmed': 'Confirmed',
      'picked_up': 'Picked Up',
      'in_transit': 'In Transit',
      'customs_cleared': 'Customs Cleared',
      'customs_clearance': 'Customs Clearance',
      'out_for_delivery': 'Out for Delivery',
      'delivered': 'Delivered',
      'cancelled': 'Cancelled',
    };
    return textMap[status] || status;
  };

  const getShipmentIcon = (type: string) => {
    // Return different icons based on shipment type
    const iconMap: Record<string, any> = {
      'medicine': Package, // Could use Pill icon if available
      'document': Package, // Could use FileText icon if available
      'gift': Package,     // Could use Gift icon if available
    };
    return iconMap[type] || Package;
  };

  const getProgressPercentage = (status: string) => {
    const progressMap: Record<string, number> = {
      'draft': 10,
      'confirmed': 20,
      'picked_up': 35,
      'in_transit': 60,
      'customs_cleared': 75,
      'customs_clearance': 75,
      'out_for_delivery': 90,
      'delivered': 100,
      'cancelled': 0,
    };
    return progressMap[status] || 0;
  };

  if (isLoading) {
    return (
      <div className="relative bg-card border border-border rounded-2xl p-8 shadow-2xl backdrop-blur-sm h-[420px] flex items-center justify-center">
        <div className="animate-pulse space-y-4 w-full">
          <div className="h-6 bg-muted rounded w-3/4"></div>
          <div className="h-4 bg-muted rounded w-1/2"></div>
          <div className="h-2 bg-muted rounded w-full mt-6"></div>
          <div className="space-y-2 mt-6">
            <div className="h-3 bg-muted rounded w-full"></div>
            <div className="h-3 bg-muted rounded w-full"></div>
            <div className="h-3 bg-muted rounded w-full"></div>
          </div>
        </div>
      </div>
    );
  }

  if (shipments.length === 0) {
    return (
      <div className="relative bg-card border border-border rounded-2xl p-8 shadow-2xl backdrop-blur-sm h-[420px] flex items-center justify-center">
        <div className="text-center space-y-3">
          <Package className="h-12 w-12 text-muted-foreground mx-auto opacity-50" />
          <p className="text-muted-foreground">No shipments yet</p>
          <p className="text-sm text-muted-foreground/70">Start shipping to see live tracking</p>
        </div>
      </div>
    );
  }

  const currentShipment = shipments[currentIndex];
  const ShipmentIcon = getShipmentIcon(currentShipment.shipment_type);
  const progress = getProgressPercentage(currentShipment.status);

  return (
    <div className="relative bg-gradient-to-br from-card via-card to-card/95 border border-border/50 rounded-2xl p-8 shadow-2xl backdrop-blur-sm overflow-hidden h-[420px]">
      {/* Enhanced Glow Effect */}
      <div className="absolute -inset-10 bg-gradient-to-r from-coke-red/10 via-primary/5 to-candlestick-green/10 rounded-full blur-3xl opacity-60 pointer-events-none animate-pulse" />
      
      {/* Subtle Grid Pattern */}
      <div className="absolute inset-0 opacity-[0.02]" style={{
        backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23000000' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
      }} />
      
      <div className="relative space-y-6 h-full flex flex-col">
        {/* Header with Smooth Animation */}
        <AnimatePresence mode="wait">
          <motion.div
            key={currentShipment.id}
            initial={{ y: 60, opacity: 0, scale: 0.95 }}
            animate={{ y: 0, opacity: 1, scale: 1 }}
            exit={{ y: -60, opacity: 0, scale: 0.95 }}
            transition={{ 
              duration: 0.7,
              ease: [0.25, 0.1, 0.25, 1] // Smooth cubic-bezier
            }}
            className="flex items-center justify-between"
          >
            <div className="flex items-center gap-3">
              <motion.div
                animate={{ 
                  rotate: [0, 5, -5, 0],
                  scale: [1, 1.05, 1]
                }}
                transition={{ 
                  duration: 5, 
                  repeat: Infinity, 
                  ease: "easeInOut" 
                }}
                className="w-14 h-14 rounded-full bg-gradient-to-br from-primary/20 to-primary/10 flex items-center justify-center flex-shrink-0 shadow-lg"
              >
                <ShipmentIcon className="h-7 w-7 text-primary" />
              </motion.div>
              <div className="min-w-0">
                <p className="font-semibold text-lg truncate capitalize flex items-center gap-2">
                  {currentShipment.shipment_type} Shipment
                  <Sparkles className="h-4 w-4 text-coke-red animate-pulse" />
                </p>
                <p className="text-sm text-muted-foreground truncate flex items-center gap-1">
                  <MapPin className="h-3.5 w-3.5" />
                  {currentShipment.destination_address.split(',').slice(-2).join(',')}
                </p>
              </div>
            </div>
            <motion.span
              animate={{ 
                scale: [1, 1.03, 1],
                boxShadow: [
                  '0 0 0 0 rgba(var(--primary), 0)',
                  '0 0 0 4px rgba(var(--primary), 0.1)',
                  '0 0 0 0 rgba(var(--primary), 0)'
                ]
              }}
              transition={{ duration: 2.5, repeat: Infinity }}
              className={`px-4 py-1.5 rounded-full text-sm font-medium whitespace-nowrap ${getStatusColor(currentShipment.status)}`}
            >
              {getStatusText(currentShipment.status)}
            </motion.span>
          </motion.div>
        </AnimatePresence>
        
        {/* Progress Section with Smooth Animation */}
        <AnimatePresence mode="wait">
          <motion.div
            key={`progress-${currentShipment.id}`}
            initial={{ y: 60, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -60, opacity: 0 }}
            transition={{ 
              duration: 0.7,
              delay: 0.15,
              ease: [0.25, 0.1, 0.25, 1]
            }}
            className="space-y-3"
          >
            <div className="flex justify-between text-sm items-center">
              <span className="text-muted-foreground flex items-center gap-2">
                <TrendingUp className="h-4 w-4" />
                Delivery Progress
              </span>
              <motion.span 
                className="font-semibold text-lg"
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.3, type: "spring", stiffness: 200 }}
              >
                {progress}%
              </motion.span>
            </div>
            <div className="h-3 bg-muted/50 rounded-full overflow-hidden shadow-inner">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${progress}%` }}
                transition={{ 
                  duration: 1.5, 
                  delay: 0.4,
                  ease: [0.25, 0.1, 0.25, 1]
                }}
                className="h-full bg-gradient-to-r from-primary via-coke-red to-candlestick-green rounded-full relative overflow-hidden"
              >
                {/* Shimmer effect */}
                <motion.div
                  className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent"
                  animate={{ x: ['-100%', '200%'] }}
                  transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                />
              </motion.div>
            </div>
          </motion.div>
        </AnimatePresence>

        {/* Tracking Number with Smooth Animation */}
        <AnimatePresence mode="wait">
          <motion.div
            key={`tracking-${currentShipment.id}`}
            initial={{ y: 60, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -60, opacity: 0 }}
            transition={{ 
              duration: 0.7,
              delay: 0.3,
              ease: [0.25, 0.1, 0.25, 1]
            }}
            className="bg-gradient-to-br from-muted/50 to-muted/30 rounded-xl p-4 border border-border/50 shadow-sm"
          >
            <p className="text-xs text-muted-foreground mb-1.5 uppercase tracking-wider">Tracking Number</p>
            <p className="font-mono text-sm font-bold tracking-wide">{currentShipment.tracking_number}</p>
          </motion.div>
        </AnimatePresence>

        {/* Amount Display */}
        <AnimatePresence mode="wait">
          <motion.div
            key={`amount-${currentShipment.id}`}
            initial={{ y: 60, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -60, opacity: 0 }}
            transition={{ 
              duration: 0.7,
              delay: 0.45,
              ease: [0.25, 0.1, 0.25, 1]
            }}
            className="flex items-center justify-between text-sm"
          >
            <span className="text-muted-foreground">Shipment Value</span>
            <span className="font-bold text-lg text-primary">₹{currentShipment.total_amount.toLocaleString()}</span>
          </motion.div>
        </AnimatePresence>

        {/* Shipment Indicators */}
        <div className="flex items-center justify-between text-xs text-muted-foreground mt-auto pt-4 border-t border-border/50">
          <div className="flex items-center gap-4">
            <motion.span 
              className="flex items-center gap-1.5"
              animate={{ opacity: [0.5, 1, 0.5] }}
              transition={{ duration: 2, repeat: Infinity }}
            >
              <Clock className="h-3.5 w-3.5 text-coke-red" />
              Live Tracking
            </motion.span>
            <span className="font-medium">
              {shipments.length} Active Shipment{shipments.length !== 1 ? 's' : ''}
            </span>
          </div>
          {shipments.length > 1 && (
            <div className="flex gap-1.5">
              {shipments.map((_, idx) => (
                <motion.div
                  key={idx}
                  className={`h-2 rounded-full transition-all duration-500 ${
                    idx === currentIndex 
                      ? 'w-8 bg-gradient-to-r from-primary to-coke-red' 
                      : 'w-2 bg-muted'
                  }`}
                  animate={{
                    scale: idx === currentIndex ? [1, 1.1, 1] : 0.8,
                  }}
                  transition={{
                    duration: 0.5,
                    repeat: idx === currentIndex ? Infinity : 0,
                    repeatDelay: 1
                  }}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
