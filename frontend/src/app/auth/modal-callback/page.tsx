'use client';

import { OAuthCallbackHandler } from '@/ui-system/components/auth/OAuthCallbackHandler';

/**
 * Modal-specific OAuth callback route
 * Renders the OAuthCallbackHandler component for popup window processing
 */
export default function ModalCallbackPage() {
  return <OAuthCallbackHandler />;
}