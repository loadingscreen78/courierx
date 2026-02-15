"use client";

// Navigation compatibility layer for Next.js migration
// This provides react-router-dom-like hooks using next/navigation

export { useRouter as useNavigate } from 'next/navigation';
export { usePathname as useLocation } from 'next/navigation';
export { useSearchParams } from 'next/navigation';
export { useParams } from 'next/navigation';
export { redirect as Navigate } from 'next/navigation';
