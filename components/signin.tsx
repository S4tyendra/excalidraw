
import { useEffect, useState } from "react";
import { Button } from "./ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import { LogOut } from "lucide-react";

export default function Signin() {
  const [session, setSession] = useState<string | null>(null);
  const [isSignoutOpen, setIsSignoutOpen] = useState(false);

  useEffect(() => {
    const s = localStorage.getItem("session_id");
    if (s) {
      setSession(s);
    }
  }, []);

  const handleSignIn = () => {
    const origin = window.location.origin;
    window.location.href = `https://draw-api.devh.in/auth/signin?origin=${encodeURIComponent(origin)}`;
  };

  const handleSignOut = async (removeData: boolean) => {
    try {
      if (session) {
        await fetch("https://draw-api.devh.in/auth/signout", {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${session}`,
          }
        });
      }
    } catch (e) {
      console.error(e);
    }
    
    localStorage.removeItem("session_id");
    setSession(null);
    setIsSignoutOpen(false);
    
    if (removeData) {
      for (const key of Object.keys(localStorage)) {
        if (key.startsWith("excalidraw-")) {
          localStorage.removeItem(key);
        }
      }
      window.location.reload();
    }
  };

  if (session) {
    return (
      <>
        <Button variant="secondary" size="sm" onClick={() => setIsSignoutOpen(true)}>
          <LogOut className="w-4 h-4 mr-2" />
          Sign Out
        </Button>
        <Dialog open={isSignoutOpen} onOpenChange={setIsSignoutOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Sign Out</DialogTitle>
              <DialogDescription className="pt-2">
                Do you want to remove your local projects and data as well?
                <br />
                <span className="text-destructive font-semibold mt-2 block">
                  Warning: If the projects were not synced to server, it will be permanently lost.
                </span>
              </DialogDescription>
            </DialogHeader>
            <DialogFooter className="flex md:justify-between items-center sm:space-x-2 mt-4 gap-2 flex-wrap">
              <Button variant="ghost" onClick={() => setIsSignoutOpen(false)}>Cancel</Button>
              <div className="flex space-x-2">
                <Button variant="destructive" onClick={() => handleSignOut(true)}>Sign Out & Remove Data</Button>
                <Button onClick={() => handleSignOut(false)}>Sign Out Only</Button>
              </div>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </>
    );
  }

  return (
    <Button onClick={handleSignIn} size="sm">Sign In</Button>
  );
}