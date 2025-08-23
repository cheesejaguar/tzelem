import React, { useState } from "react";
import { useAuth } from "../contexts/AuthContext";
import { LoginModal } from "./LoginModal";

interface ProtectedRouteProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
  requireAuth?: boolean;
  loginTitle?: string;
  loginDescription?: string;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  children,
  fallback,
  requireAuth = true,
  loginTitle = "Authentication Required",
  loginDescription = "Please sign in to access this feature",
}) => {
  const { user, loading } = useAuth();
  const [showLoginModal, setShowLoginModal] = useState(false);

  // Show loading spinner while checking auth state
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[200px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  // If auth is required and user is not authenticated
  if (requireAuth && !user) {
    if (fallback) {
      return <>{fallback}</>;
    }

    // Auto-show login modal
    if (!showLoginModal) {
      setShowLoginModal(true);
    }

    return (
      <>
        <LoginModal
          open={showLoginModal}
          onOpenChange={setShowLoginModal}
          title={loginTitle}
          description={loginDescription}
        />
        <div className="flex items-center justify-center min-h-[200px] text-center">
          <div>
            <p className="text-muted-foreground mb-4">
              Please sign in to continue
            </p>
            <button
              onClick={() => setShowLoginModal(true)}
              className="text-blue-600 hover:underline"
            >
              Sign in
            </button>
          </div>
        </div>
      </>
    );
  }

  // User is authenticated or auth is not required
  return <>{children}</>;
};

// Hook for conditional rendering based on auth state
export const useAuthGuard = () => {
  const { user, loading } = useAuth();

  return {
    isAuthenticated: !!user,
    isLoading: loading,
    user,
  };
};
