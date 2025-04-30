import { Button } from "@/components/ui/button";
import { SignedOut, SignInButton, SignUpButton } from "@clerk/clerk-react";

export const AuthButton = () => {
  return (
    <SignedOut>
      <div className="flex gap-x-3 py-20 justify-center items-center">
        <SignInButton>
          <Button
            variant="outline"
            className="px-10 rounded-full text-white border-white hover:bg-white hover:text-black transition-all">
            Sign In
          </Button>
        </SignInButton>
        <SignUpButton>
          <Button 
            variant="default" 
            className="px-10 rounded-full bg-white text-black hover:bg-gray-200 transition-all">
            Sign Up
          </Button>
        </SignUpButton>
      </div>
    </SignedOut>
  );
};
