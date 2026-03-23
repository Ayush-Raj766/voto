import { AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useWallet } from "@/hooks/useWallet";

export function NetworkWarning() {
  const { isConnected, isCorrectNetwork, switchNetwork } = useWallet();

  if (!isConnected || isCorrectNetwork) return null;

  return (
    <div className="fixed top-0 left-0 right-0 z-50 flex items-center justify-center gap-3 bg-destructive/90 px-4 py-2 text-sm text-destructive-foreground backdrop-blur-sm">
      <AlertTriangle className="h-4 w-4" />
      <span>Wrong network detected. Please switch to Sepolia Testnet.</span>
      <Button size="sm" variant="secondary" onClick={switchNetwork} className="h-7 text-xs">
        Switch Network
      </Button>
    </div>
  );
}
