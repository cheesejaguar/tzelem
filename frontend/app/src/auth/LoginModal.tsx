import React from "react";
import { useAuth } from "../contexts/AuthContext";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "../components/ui/dialog";
import { Button } from "../components/ui/button";
import { Github, AlertCircle } from "lucide-react";
import { Alert, AlertDescription } from "../components/ui/alert";

const GoogleIcon = () => (
  <svg className="w-5 h-5" viewBox="0 0 24 24">
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

interface LoginModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title?: string;
  description?: string;
}

export const LoginModal: React.FC<LoginModalProps> = ({
  open,
  onOpenChange,
  title = "Welcome to Tzelem",
  description = "Sign in to your account to continue",
}) => {
  const { loading, signInWithProvider, error } = useAuth();

  const handleSignIn = async (provider: "google" | "github") => {
    try {
      await signInWithProvider(provider);
      // Modal will close automatically when user is authenticated
    } catch (err) {
      console.error("Sign in failed:", err);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader className="text-center">
          <DialogTitle className="text-2xl font-bold">{title}</DialogTitle>
          <DialogDescription className="text-muted-foreground">
            {description}
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col space-y-3 mt-6">
          <Button
            variant="outline"
            size="lg"
            onClick={() => handleSignIn("google")}
            disabled={loading}
            className="w-full flex items-center justify-center space-x-3 h-12"
          >
            <GoogleIcon />
            <span>Continue with Google</span>
          </Button>

          <Button
            variant="outline"
            size="lg"
            onClick={() => handleSignIn("github")}
            disabled={loading}
            className="w-full flex items-center justify-center space-x-3 h-12"
          >
            <Github className="w-5 h-5" />
            <span>Continue with GitHub</span>
          </Button>
        </div>

        {error && (
          <Alert variant="destructive" className="mt-4">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <div className="text-xs text-center text-muted-foreground mt-6">
          By signing in, you agree to our Terms of Service and Privacy Policy.
        </div>
      </DialogContent>
    </Dialog>
  );
};
