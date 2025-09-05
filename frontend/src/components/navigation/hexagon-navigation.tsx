/**
 * Hexagon Navigation Component
 * Global navigation with authentication state (AC: #14, #15, #16)
 */

'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/auth/auth-context';

export interface HexagonNavigationProps {
  className?: string;
}

export const HexagonNavigation: React.FC<HexagonNavigationProps> = ({
  className = ""
}) => {
  const router = useRouter();
  const { isAuthenticated, user, signOut } = useAuth();

  const subsystems = [
    { id: 0, name: 'Anuttara', coordinate: '#0', description: 'Absolute Ground' },
    { id: 1, name: 'Paramasiva', coordinate: '#1', description: 'Foundational Architect' },
    { id: 2, name: 'Parashakti', coordinate: '#2', description: 'Cosmic Imagination' },
    { id: 3, name: 'Mahamaya', coordinate: '#3', description: 'Universal Transcription' },
    { id: 4, name: 'Nara', coordinate: '#4', description: 'Dialogical Identity' },
    { id: 5, name: 'Epii', coordinate: '#5', description: 'Synthesis & Orchestration' }
  ];

  const handleSubsystemClick = (subsystem: { id: number; name: string }) => {
    if (!isAuthenticated) {
      // Show authentication required warning for protected routes
      alert('Authentication required to access ' + subsystem.name);
      return;
    }

    // Navigate to subsystem (Nara is protected)
    const route = `/${subsystem.name.toLowerCase()}`;
    router.push(route);
  };

  const handleSignIn = () => {
    // Navigate to our new auth page
    router.push('/auth/signin');
  };

  const handleSignOut = async () => {
    // Use auth context to sign out
    await signOut();
    // Optionally redirect to home
    router.push('/');
  };

  return (
    <nav data-testid="hexagon-navigation" className={`hexagon-navigation ${className}`}>
      {/* Hexagon Grid Layout */}
      <div className="hexagon-grid">
        {subsystems.map((subsystem) => (
          <button
            key={subsystem.id}
            className={`hexagon-item ${subsystem.name.toLowerCase()}`}
            onClick={() => handleSubsystemClick(subsystem)}
            title={`${subsystem.coordinate} ${subsystem.description}`}
          >
            <div className="hexagon-content">
              <h3>{subsystem.name}</h3>
              <span className="coordinate">{subsystem.coordinate}</span>
              <p className="description">{subsystem.description}</p>
            </div>
          </button>
        ))}
      </div>

      {/* Authentication Section */}
      <div className="auth-section">
        {!isAuthenticated ? (
          <button
            className="auth-button sign-in"
            onClick={handleSignIn}
            role="button"
          >
            Sign In with Google
          </button>
        ) : (
          <div className="user-profile">
            <div className="user-info">
              {user?.picture && (
                <img 
                  src={user.picture} 
                  alt="Profile" 
                  className="profile-picture"
                />
              )}
              <span className="user-name">{user?.name}</span>
            </div>
            <button
              className="auth-button sign-out"
              onClick={handleSignOut}
              role="button"
            >
              Sign Out
            </button>
          </div>
        )}
      </div>


      <style jsx>{`
        .hexagon-navigation {
          display: flex;
          flex-direction: row;
          align-items: center;
          justify-content: space-between;
          padding: 1rem;
          min-height: auto;
          background: transparent;
        }

        .hexagon-grid {
          display: flex;
          gap: 0.75rem;
          flex-wrap: wrap;
        }

        .hexagon-item {
          position: relative;
          width: 100px;
          height: 60px;
          background: rgba(255, 255, 255, 0.1);
          border: 1px solid rgba(255, 255, 255, 0.2);
          border-radius: 8px;
          cursor: pointer;
          transition: all 0.3s ease;
          backdrop-filter: blur(10px);
        }

        .hexagon-item:hover {
          background: rgba(255, 255, 255, 0.2);
          border-color: rgba(255, 255, 255, 0.4);
          transform: translateY(-2px);
        }

        .hexagon-content {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          height: 100%;
          padding: 0.5rem;
          text-align: center;
        }

        .hexagon-content h3 {
          color: white;
          font-size: 0.75rem;
          font-weight: 600;
          margin: 0;
          line-height: 1;
        }

        .coordinate {
          color: rgba(255, 255, 255, 0.8);
          font-size: 0.625rem;
          font-weight: 500;
          margin: 0;
        }

        .description {
          display: none;
        }

        .auth-section {
          margin: 0;
        }

        .auth-button {
          padding: 0.5rem 1rem;
          border: none;
          border-radius: 6px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s ease;
          font-size: 0.875rem;
        }

        .sign-in {
          background: #4285f4;
          color: white;
        }

        .sign-in:hover {
          background: #3367d6;
        }

        .user-profile {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          background: rgba(255, 255, 255, 0.1);
          padding: 0.5rem;
          border-radius: 8px;
          backdrop-filter: blur(10px);
        }

        .user-info {
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }

        .profile-picture {
          width: 24px;
          height: 24px;
          border-radius: 50%;
        }

        .user-name {
          color: white;
          font-weight: 500;
          font-size: 0.875rem;
        }

        .sign-out {
          background: #dc3545;
          color: white;
        }

        .sign-out:hover {
          background: #c82333;
        }
      `}</style>
    </nav>
  );
};