'use client';

import React, { useRef, useEffect, useState } from 'react';
import { motion } from 'framer-motion';

interface OAuthIframeProps {
  oauthUrl: string;
  onSuccess: () => void;
  onError: (error: string) => void;
  onCancel: () => void;
  isVisible: boolean;
}

export const OAuthIframe: React.FC<OAuthIframeProps> = ({
  oauthUrl,
  onSuccess,
  onError,
  onCancel,
  isVisible
}) => {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!isVisible) return;

    // Listen for messages from iframe
    const handleMessage = (event: MessageEvent) => {
      // Only accept messages from our callback page
      if (event.origin !== window.location.origin) return;

      if (event.data.type === 'oauth-iframe-success') {
        console.log('OAuth iframe success received');
        onSuccess();
      } else if (event.data.type === 'oauth-iframe-error') {
        console.log('OAuth iframe error received:', event.data.error);
        onError(event.data.error || 'OAuth authentication failed');
      }
    };

    window.addEventListener('message', handleMessage);

    return () => {
      window.removeEventListener('message', handleMessage);
    };
  }, [isVisible, onSuccess, onError]);

  const handleIframeLoad = () => {
    setIsLoading(false);
  };

  const handleCancel = () => {
    setIsLoading(true);
    onCancel();
  };

  if (!isVisible) return null;

  return (
    <motion.div 
      className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <motion.div 
        className="bg-gray-900 rounded-2xl border border-gray-700 shadow-2xl w-full max-w-md h-[600px] flex flex-col"
        initial={{ scale: 0.9, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.9, y: 20 }}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-700">
          <h3 className="text-lg font-medium text-white">Sign in with Google</h3>
          <button
            onClick={handleCancel}
            className="text-gray-400 hover:text-white transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Loading State */}
        {isLoading && (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <div className="h-8 w-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
              <p className="text-gray-300">Loading Google Sign In...</p>
            </div>
          </div>
        )}

        {/* OAuth Iframe */}
        <iframe
          ref={iframeRef}
          src={oauthUrl}
          className={`flex-1 w-full border-0 rounded-b-2xl ${isLoading ? 'hidden' : 'block'}`}
          onLoad={handleIframeLoad}
          title="Google OAuth"
          sandbox="allow-same-origin allow-scripts allow-forms allow-top-navigation"
        />
      </motion.div>
    </motion.div>
  );
};