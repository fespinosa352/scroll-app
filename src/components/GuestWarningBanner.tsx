import { Alert, AlertDescription } from "@/components/ui/alert";
import { Info, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";

export const GuestWarningBanner = () => {
  const { isGuest, signOut } = useAuth();

  if (!isGuest) return null;

  return (
    <Alert className="mb-4 border-amber-200 bg-amber-50">
      <Info className="h-4 w-4 text-amber-600" />
      <AlertDescription className="flex items-center justify-between text-amber-800">
        <span>
          <strong>Demo Mode:</strong> You're using a guest account. Data is temporary and some features may show errors due to limited demo functionality.
        </span>
        <Button 
          variant="outline" 
          size="sm" 
          onClick={signOut}
          className="ml-4 text-amber-700 border-amber-300 hover:bg-amber-100"
        >
          <LogOut className="h-3 w-3 mr-1" />
          Sign Out
        </Button>
      </AlertDescription>
    </Alert>
  );
};