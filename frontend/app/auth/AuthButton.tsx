import React from "react";
import { useAuth } from "../src/contexts/AuthContext";
import { Button } from "../src/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "../src/components/ui/dropdown-menu";
import { User, LogOut, Github } from "lucide-react";

const GoogleIcon = () => (
  <svg className="w-4 h-4" viewBox="0 0 24 24">
    <path
      fill="currentColor"
      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
    />
    <path
      fill="currentColor"
      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
    />
    <path
      fill="currentColor"
      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
    />
    <path
      fill="currentColor"
      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
    />
  </svg>
);

interface AuthButtonProps {
  variant?: "default" | "outline";
  size?: "default" | "sm" | "lg";
  className?: string;
}

export const AuthButton: React.FC<AuthButtonProps> = ({
  variant = "default",
  size = "default",
  className = "",
}) => {
  const { user, loading, signInWithProvider, signOut, error } = useAuth();

  const handleSignIn = async (provider: "google" | "github") => {
    try {
      await signInWithProvider(provider);
    } catch (err) {
      console.error("Sign in failed:", err);
    }
  };

  const handleSignOut = async () => {
    try {
      await signOut();
    } catch (err) {
      console.error("Sign out failed:", err);
    }
  };

  // Loading state
  if (loading) {
    return (
      <Button variant={variant} size={size} disabled className={className}>
        Loading...
      </Button>
    );
  }

  // Authenticated state
  if (user) {
    const displayName =
      user.user_metadata?.full_name ||
      user.user_metadata?.name ||
      user.user_metadata?.user_name ||
      user.email?.split("@")[0] ||
      "User";

    const avatar = user.user_metadata?.avatar_url;

    return (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant={variant}
            size={size}
            className={`${className} flex items-center gap-2`}
          >
            {avatar ? (
              <img
                src={avatar}
                alt={displayName}
                className="w-5 h-5 rounded-full"
              />
            ) : (
              <User className="w-4 h-4" />
            )}
            <span className="hidden sm:inline-block">{displayName}</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56">
          <div className="px-2 py-1.5 text-sm text-muted-foreground">
            {user.email}
          </div>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            onClick={handleSignOut}
            className="text-red-600 cursor-pointer"
          >
            <LogOut className="w-4 h-4 mr-2" />
            Sign out
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    );
  }

  // Unauthenticated state
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant={variant} size={size} className={className}>
          Sign In
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuItem
          onClick={() => handleSignIn("google")}
          className="cursor-pointer"
        >
          <GoogleIcon />
          <span className="ml-2">Continue with Google</span>
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() => handleSignIn("github")}
          className="cursor-pointer"
        >
          <Github className="w-4 h-4" />
          <span className="ml-2">Continue with GitHub</span>
        </DropdownMenuItem>
        {error && (
          <>
            <DropdownMenuSeparator />
            <div className="px-2 py-1.5 text-sm text-red-600">{error}</div>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
