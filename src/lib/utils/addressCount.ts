/**
 * Pure address counting function extracted from useAddresses hook.
 * The displayed "Saved Addresses" count equals the length of the addresses array.
 */

export interface AddressLike {
  id: string;
  user_id: string;
  type: string;
  label: string;
}

/** Returns the count of addresses in the array. */
export function countAddresses<T extends AddressLike>(addresses: T[]): number {
  return addresses.length;
}
