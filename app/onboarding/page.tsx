"use client";

import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import Onboarding from '@/views/Onboarding';

export default function OnboardingPage() {
  return (
    <ProtectedRoute>
      <Onboarding />
    </ProtectedRoute>
  );
}
