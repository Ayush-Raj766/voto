import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { useWallet } from "@/hooks/useWallet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "@/hooks/use-toast";
import { LogIn, Wallet, Eye, EyeOff, Vote } from "lucide-react";
import { motion } from "framer-motion";

const loginSchema = z.object({
  email: z.string().email("Invalid email"),
  password: z.string().min(1, "Password is required"),
});

type FormData = z.infer<typeof loginSchema>;

export default function LoginPage() {
  const { login } = useAuth();
  const wallet = useWallet();
  const navigate = useNavigate();

  const [showPw, setShowPw] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(loginSchema),
  });

  const redirectByRole = (role: string) => {
    if (role === "admin") navigate("/admin");
    else if (role === "subadmin") navigate("/subadmin");
    else navigate("/voter");
  };

  const onSubmit = async (data: FormData) => {
    try {
      setIsSubmitting(true);

      let walletAddress: string | undefined;

      if (wallet.isConnected) {
        walletAddress = wallet.address;
      }

      /* Login via backend */
      await login(data.email, data.password, walletAddress);

      toast({
        title: "Login successful",
        description: "Welcome back to BlockVote",
      });

      const savedUser = localStorage.getItem("bv_user");

      if (savedUser) {
        const user = JSON.parse(savedUser);
        redirectByRole(user.role);
      }
    } catch (err: any) {
      toast({
        title: "Login failed",
        description: err?.response?.data?.message || "Invalid credentials",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass-card w-full max-w-md p-8"
      >
        {/* Header */}
        <div className="mb-6 text-center">
          <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-xl bg-primary/20">
            <Vote className="h-7 w-7 text-primary" />
          </div>

          <h1 className="text-2xl font-bold">Welcome Back</h1>

          <p className="mt-1 text-sm text-muted-foreground">
            Sign in to your BlockVote account
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">

          {/* Email */}
          <div>
            <Label>Email</Label>

            <Input
              {...register("email")}
              type="email"
              placeholder="you@example.com"
              className="mt-1 bg-secondary/50"
            />

            {errors.email && (
              <p className="mt-1 text-xs text-destructive">
                {errors.email.message}
              </p>
            )}
          </div>

          {/* Password */}
          <div>
            <Label>Password</Label>

            <div className="relative mt-1">
              <Input
                {...register("password")}
                type={showPw ? "text" : "password"}
                className="bg-secondary/50 pr-10"
              />

              <button
                type="button"
                onClick={() => setShowPw(!showPw)}
                className="absolute right-3 top-2.5 text-muted-foreground"
              >
                {showPw ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </button>
            </div>

            {errors.password && (
              <p className="mt-1 text-xs text-destructive">
                {errors.password.message}
              </p>
            )}
          </div>

          {/* Wallet */}
          <div>
            <Label>MetaMask </Label>

            {wallet.isConnected ? (
              <div className="mt-1 flex items-center gap-2 rounded-md border border-primary/30 bg-primary/10 px-3 py-2 text-sm">
                <Wallet className="h-4 w-4 text-primary" />

                <span className="truncate font-mono text-xs">
                  {wallet.address}
                </span>
              </div>
            ) : (
              <Button
                type="button"
                variant="outline"
                onClick={wallet.connect}
                disabled={wallet.isConnecting}
                className="mt-1 w-full"
              >
                <Wallet className="mr-2 h-4 w-4" />

                {wallet.isConnecting
                  ? "Connecting..."
                  : "Connect MetaMask"}
              </Button>
            )}
          </div>

          {/* Login Button */}
          <Button
            type="submit"
            disabled={isSubmitting}
            className="w-full glow-primary"
          >
            <LogIn className="mr-2 h-4 w-4" />

            {isSubmitting ? "Signing In..." : "Sign In"}
          </Button>
        </form>

        {/* Footer */}
        <p className="mt-6 text-center text-sm text-muted-foreground">
          Don't have an account?{" "}
          <Link
            to="/auth/register"
            className="font-medium text-primary hover:underline"
          >
            Create Account
          </Link>
        </p>
      </motion.div>
    </div>
  );
}