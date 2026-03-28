import { useState, useEffect, useCallback } from 'react';

interface PostOffice {
  Name: string;
  District: string;
  State: string;
  Block: string;
}

interface PincodeLookupResult {
  state: string;
  district: string;
  areas: string[]; // All post office names for this pincode
  loading: boolean;
  error: string | null;
}

/**
 * Fetches all post offices for a given 6-digit pincode from India Post API.
 * Returns state, district, and a list of area names for dropdown selection.
 */
export function usePincodeLookup(pincode: string): PincodeLookupResult {
  const [state, setState] = useState('');
  const [district, setDistrict] = useState('');
  const [areas, setAreas] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!pincode || pincode.length !== 6 || !/^\d{6}$/.test(pincode)) {
      setState('');
      setDistrict('');
      setAreas([]);
      setError(null);
      return;
    }

    let cancelled = false;
    setLoading(true);
    setError(null);

    fetch(`/api/public/pincode-lookup?pincode=${pincode}`)
      .then(r => r.json())
      .then(data => {
        if (cancelled) return;
        if (data.success) {
          setState(data.state || '');
          setDistrict(data.district || '');
          // areas come from the full post office list
          const areaList: string[] = data.areas || (data.district ? [data.district] : []);
          setAreas([...new Set(areaList)]);
        } else {
          setError('Invalid pincode');
        }
      })
      .catch(() => {
        if (!cancelled) setError('Lookup failed');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => { cancelled = true; };
  }, [pincode]);

  return { state, district, areas, loading, error };
}
