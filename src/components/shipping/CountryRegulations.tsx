import { useMemo } from 'react';
import { FileText, Gift, Pill, ShieldAlert } from 'lucide-react';

import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useCountries } from '@/hooks/useCountries';
import {
  getDefaultGiftRegulation,
  getDefaultMedicineRegulation,
  getDocumentRegulation,
  getGiftRegulation,
  getMedicineRegulation,
} from '@/lib/shipping/regulations';
import {
  getGiftRestrictionsForCountry,
  getMedicineRestrictionsForCountry,
  getProhibitedItemsForCountry,
  ProhibitedItem,
} from '@/lib/shipping/prohibitedItems';

interface CountryRegulationsProps {
  countryCode: string;
  className?: string;
}

const SeverityBadge = ({ item }: { item: ProhibitedItem }) => {
  const variant =
    item.severity === 'blocked'
      ? 'destructive'
      : item.severity === 'restricted'
        ? 'secondary'
        : 'outline';

  return (
    <Badge variant={variant} className="whitespace-nowrap">
      {item.name}
    </Badge>
  );
};

export const CountryRegulations = ({ countryCode, className }: CountryRegulationsProps) => {
  const { getCountry } = useCountries();

  const country = useMemo(() => getCountry(countryCode), [countryCode, getCountry]);

  const medicine = useMemo(
    () => getMedicineRegulation(countryCode) ?? getDefaultMedicineRegulation(),
    [countryCode]
  );

  const gift = useMemo(() => getGiftRegulation(countryCode) ?? getDefaultGiftRegulation(), [countryCode]);

  const document = useMemo(() => getDocumentRegulation(countryCode), [countryCode]);

  const medicineRestrictions = useMemo(
    () => getMedicineRestrictionsForCountry(countryCode).slice(0, 10),
    [countryCode]
  );

  const giftRestrictions = useMemo(() => getGiftRestrictionsForCountry(countryCode).slice(0, 10), [countryCode]);

  const generalProhibitions = useMemo(
    () => getProhibitedItemsForCountry(countryCode).slice(0, 10),
    [countryCode]
  );

  const headline = country ? `${country.name} (${country.code})` : countryCode;

  return (
    <section className={cn('space-y-3', className)} aria-label="Country regulations">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ShieldAlert className="h-5 w-5" />
            Country Regulations
          </CardTitle>
          <CardDescription>
            {headline} • Indicative rules for personal shipments (CSB IV)
          </CardDescription>
        </CardHeader>

        <CardContent>
          <Tabs defaultValue="gift" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="gift" className="gap-2">
                <Gift className="h-4 w-4" />
                Gifts
              </TabsTrigger>
              <TabsTrigger value="medicine" className="gap-2">
                <Pill className="h-4 w-4" />
                Medicines
              </TabsTrigger>
              <TabsTrigger value="document" className="gap-2">
                <FileText className="h-4 w-4" />
                Documents
              </TabsTrigger>
            </TabsList>

            <TabsContent value="gift" className="mt-4 space-y-4">
              <dl className="grid gap-3 sm:grid-cols-2">
                <div>
                  <dt className="text-sm text-muted-foreground">Max declared value</dt>
                  <dd className="font-medium">₹{gift.maxDeclaredValue.toLocaleString()}</dd>
                </div>
                <div>
                  <dt className="text-sm text-muted-foreground">Duty-free threshold (indicative)</dt>
                  <dd className="font-medium">₹{gift.dutyFreeThreshold.toLocaleString()}</dd>
                </div>
                <div>
                  <dt className="text-sm text-muted-foreground">Food items</dt>
                  <dd className="font-medium">{gift.foodItemsAllowed ? 'Allowed (declared)' : 'Not allowed'}</dd>
                </div>
                <div>
                  <dt className="text-sm text-muted-foreground">Alcohol</dt>
                  <dd className="font-medium">{gift.alcoholAllowed ? 'Allowed (restricted)' : 'Not allowed'}</dd>
                </div>
              </dl>

              {(gift.cosmeticsRestrictions || gift.notes) && (
                <div className="space-y-2">
                  <Separator />
                  {gift.cosmeticsRestrictions && (
                    <p className="text-sm text-muted-foreground">
                      <span className="font-medium text-foreground">Cosmetics:</span> {gift.cosmeticsRestrictions}
                    </p>
                  )}
                  {gift.notes && <p className="text-sm text-muted-foreground">{gift.notes}</p>}
                </div>
              )}

              <div className="space-y-2">
                <p className="text-sm font-medium">Common restrictions</p>
                <div className="flex flex-wrap gap-2">
                  {giftRestrictions.length ? (
                    giftRestrictions.map((item) => <SeverityBadge key={item.id} item={item} />)
                  ) : (
                    <p className="text-sm text-muted-foreground">No special gift restrictions listed.</p>
                  )}
                </div>
              </div>
            </TabsContent>

            <TabsContent value="medicine" className="mt-4 space-y-4">
              <dl className="grid gap-3 sm:grid-cols-2">
                <div>
                  <dt className="text-sm text-muted-foreground">Prescription required</dt>
                  <dd className="font-medium">{medicine.requiresPrescription ? 'Yes' : 'No'}</dd>
                </div>
                <div>
                  <dt className="text-sm text-muted-foreground">Max supply</dt>
                  <dd className="font-medium">{medicine.maxSupplyDays} days</dd>
                </div>
                <div>
                  <dt className="text-sm text-muted-foreground">Max declared value</dt>
                  <dd className="font-medium">₹{medicine.maxDeclaredValue.toLocaleString()}</dd>
                </div>
                <div>
                  <dt className="text-sm text-muted-foreground">Controlled substances</dt>
                  <dd className="font-medium">{medicine.controlledSubstancesAllowed ? 'Allowed (with docs)' : 'Not allowed'}</dd>
                </div>
              </dl>

              {(medicine.additionalDocuments?.length || medicine.notes) && (
                <div className="space-y-2">
                  <Separator />
                  {medicine.additionalDocuments?.length ? (
                    <div className="space-y-1">
                      <p className="text-sm font-medium">Additional documents</p>
                      <ul className="list-disc pl-5 text-sm text-muted-foreground">
                        {medicine.additionalDocuments.map((doc) => (
                          <li key={doc}>{doc}</li>
                        ))}
                      </ul>
                    </div>
                  ) : null}
                  {medicine.notes && <p className="text-sm text-muted-foreground">{medicine.notes}</p>}
                </div>
              )}

              <div className="space-y-2">
                <p className="text-sm font-medium">Common medicine restrictions</p>
                <div className="flex flex-wrap gap-2">
                  {medicineRestrictions.length ? (
                    medicineRestrictions.map((item) => <SeverityBadge key={item.id} item={item} />)
                  ) : (
                    <p className="text-sm text-muted-foreground">No special medicine restrictions listed.</p>
                  )}
                </div>
              </div>
            </TabsContent>

            <TabsContent value="document" className="mt-4 space-y-4">
              <dl className="grid gap-3 sm:grid-cols-2">
                <div>
                  <dt className="text-sm text-muted-foreground">Max weight</dt>
                  <dd className="font-medium">{(document.maxWeightGrams / 1000).toFixed(1)} kg</dd>
                </div>
                <div>
                  <dt className="text-sm text-muted-foreground">Apostille required</dt>
                  <dd className="font-medium">{document.requiresApostille ? 'Often required' : 'Usually not required'}</dd>
                </div>
                <div>
                  <dt className="text-sm text-muted-foreground">Legal documents</dt>
                  <dd className="font-medium">{document.legalDocumentsAllowed ? 'Allowed' : 'Restricted'}</dd>
                </div>
                <div>
                  <dt className="text-sm text-muted-foreground">Financial documents</dt>
                  <dd className="font-medium">{document.financialDocsRestricted ? 'Restricted' : 'Allowed'}</dd>
                </div>
              </dl>

              {document.notes && (
                <div className="space-y-2">
                  <Separator />
                  <p className="text-sm text-muted-foreground">{document.notes}</p>
                </div>
              )}

              <div className="space-y-2">
                <p className="text-sm font-medium">General prohibitions</p>
                <div className="flex flex-wrap gap-2">
                  {generalProhibitions.length ? (
                    generalProhibitions.map((item) => <SeverityBadge key={item.id} item={item} />)
                  ) : (
                    <p className="text-sm text-muted-foreground">No special prohibitions listed.</p>
                  )}
                </div>
              </div>
            </TabsContent>
          </Tabs>

          <p className="mt-4 text-xs text-muted-foreground">
            Regulations are indicative and can change. Final acceptance depends on customs and the courier.
          </p>
        </CardContent>
      </Card>
    </section>
  );
};
