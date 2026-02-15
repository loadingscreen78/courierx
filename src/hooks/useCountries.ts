// Hook for country data and search

import { useState, useMemo, useCallback } from 'react';
import { 
  Country, 
  countries, 
  getCountryByCode, 
  getServedCountries, 
  getNotServedCountries,
  getCountriesByRegion,
  searchCountries,
  Region,
  regionLabels,
} from '@/lib/shipping/countries';

export interface UseCountriesReturn {
  allCountries: Country[];
  servedCountries: Country[];
  notServedCountries: Country[];
  searchResults: Country[];
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  getCountry: (code: string) => Country | undefined;
  getCountriesForRegion: (region: Region) => Country[];
  groupedCountries: Record<Region, Country[]>;
  regionLabels: Record<Region, string>;
}

export const useCountries = (): UseCountriesReturn => {
  const [searchQuery, setSearchQuery] = useState('');

  const servedCountries = useMemo(() => getServedCountries(), []);
  const notServedCountries = useMemo(() => getNotServedCountries(), []);

  const searchResults = useMemo(() => {
    if (!searchQuery.trim()) {
      return servedCountries;
    }
    return searchCountries(searchQuery).filter(c => c.isServed);
  }, [searchQuery, servedCountries]);

  const getCountry = useCallback((code: string) => {
    return getCountryByCode(code);
  }, []);

  const getCountriesForRegion = useCallback((region: Region) => {
    return getCountriesByRegion(region).filter(c => c.isServed);
  }, []);

  const groupedCountries = useMemo(() => {
    const groups: Record<Region, Country[]> = {
      'middle-east': [],
      'asia-pacific': [],
      'europe': [],
      'americas': [],
      'africa': [],
    };

    servedCountries.forEach(country => {
      groups[country.region].push(country);
    });

    // Sort each group alphabetically
    Object.keys(groups).forEach(key => {
      groups[key as Region].sort((a, b) => a.name.localeCompare(b.name));
    });

    return groups;
  }, [servedCountries]);

  return {
    allCountries: countries,
    servedCountries,
    notServedCountries,
    searchResults,
    searchQuery,
    setSearchQuery,
    getCountry,
    getCountriesForRegion,
    groupedCountries,
    regionLabels,
  };
};
