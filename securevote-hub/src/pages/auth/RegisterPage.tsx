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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "@/hooks/use-toast";
import { Wallet, UserPlus, Eye, EyeOff, Shield } from "lucide-react";
import { motion } from "framer-motion";
import { ethers } from "ethers"
import contractABI from "@/abi/Voting.json"

const CONTRACT_ADDRESS = import.meta.env.VITE_CONTRACT_ADDRESS

const registerSchema = z.object({
  fullName: z.string().min(2, "Name must be at least 2 characters").max(100),
  email: z.string().email("Invalid email address"),
  aadhaarId: z.string().regex(/^\d{4}-\d{4}-\d{4}$/, "Format: 1234-5678-9012"),
  password: z.string().min(8, "Password must be at least 8 characters")
    .regex(/[A-Z]/, "Must contain uppercase letter")
    .regex(/[0-9]/, "Must contain a number")
    .regex(/[^A-Za-z0-9]/, "Must contain a special character"),
  confirmPassword: z.string(),
  role: z.enum(["admin", "voter", "subadmin"]),
}).refine((d) => d.password === d.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

type FormData = z.infer<typeof registerSchema>;

export default function RegisterPage() {
  const { register: registerUser } = useAuth();
  const wallet = useWallet();
  const navigate = useNavigate();
  const [showPw, setShowPw] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { register, handleSubmit, setValue, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(registerSchema),
    defaultValues: { role: "voter" },
  });

  const onSubmit = async (data: FormData) => {

    if (!wallet.address) {
      toast({ title: "Connect your wallet first", variant: "destructive" })
      return
    }

    setIsSubmitting(true)

    try {

      // Reliance on AuthContext.register which handles both Blockchain and DB registration

      /* -------- Backend registration -------- */

      await registerUser({
        fullName: data.fullName,
        email: data.email,
        password: data.password,
        aadhaarId: data.aadhaarId,
        role: data.role,
        walletAddress: wallet.address
      })

      toast({ title: "Registration successful!" })

      navigate(
        data.role === "admin"
          ? "/admin"
          : data.role === "subadmin"
            ? "/subadmin"
            : "/voter"
      )

    } catch (err: any) {

      toast({
        title: err.message || "Registration failed",
        variant: "destructive"
      })

    } finally {

      setIsSubmitting(false)

    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass-card w-full max-w-lg p-8"
      >
        <div className="mb-6 text-center">
          <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-xl bg-primary/20">
            <Shield className="h-7 w-7 text-primary" />
          </div>
          <h1 className="text-2xl font-bold">Create Account</h1>
          <p className="mt-1 text-sm text-muted-foreground">Join the decentralized voting platform</p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <Label>Full Name</Label>
            <Input {...register("fullName")} placeholder="John Doe" className="mt-1 bg-secondary/50" />
            {errors.fullName && <p className="mt-1 text-xs text-destructive">{errors.fullName.message}</p>}
          </div>

          <div>
            <Label>Email</Label>
            <Input {...register("email")} type="email" placeholder="john@example.com" className="mt-1 bg-secondary/50" />
            {errors.email && <p className="mt-1 text-xs text-destructive">{errors.email.message}</p>}
          </div>

          <div>
            <Label>Aadhaar / National ID</Label>
            <Input {...register("aadhaarId")} placeholder="1234-5678-9012" className="mt-1 bg-secondary/50" />
            {errors.aadhaarId && <p className="mt-1 text-xs text-destructive">{errors.aadhaarId.message}</p>}
          </div>

          <div>
            <Label>Role</Label>
            <Select defaultValue="voter" onValueChange={(v) => setValue("role", v as "admin" | "voter" | "subadmin")}>
              <SelectTrigger className="mt-1 bg-secondary/50">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="voter">Voter</SelectItem>
                <SelectItem value="admin">Admin</SelectItem>
                <SelectItem value="subadmin">Sub-Admin</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label>Password</Label>
            <div className="relative mt-1">
              <Input {...register("password")} type={showPw ? "text" : "password"} className="bg-secondary/50 pr-10" />
              <button type="button" onClick={() => setShowPw(!showPw)} className="absolute right-3 top-2.5 text-muted-foreground">
                {showPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
            {errors.password && <p className="mt-1 text-xs text-destructive">{errors.password.message}</p>}
          </div>

          <div>
            <Label>Confirm Password</Label>
            <Input {...register("confirmPassword")} type="password" className="mt-1 bg-secondary/50" />
            {errors.confirmPassword && <p className="mt-1 text-xs text-destructive">{errors.confirmPassword.message}</p>}
          </div>

          <div>
            <Label>Wallet Address</Label>
            {wallet.isConnected ? (
              <div className="mt-1 flex items-center gap-2 rounded-md border border-primary/30 bg-primary/10 px-3 py-2 text-sm">
                <Wallet className="h-4 w-4 text-primary" />
                <span className="truncate font-mono text-xs">{wallet.address}</span>
              </div>
            ) : (
              <Button type="button" variant="outline" onClick={wallet.connect} disabled={wallet.isConnecting} className="mt-1 w-full">
                <Wallet className="mr-2 h-4 w-4" />
                {wallet.isConnecting ? "Connecting..." : "Connect MetaMask"}
              </Button>
            )}
            {wallet.error && <p className="mt-1 text-xs text-destructive">{wallet.error}</p>}
          </div>

          <Button type="submit" disabled={isSubmitting} className="w-full glow-primary">
            <UserPlus className="mr-2 h-4 w-4" />
            {isSubmitting ? "Creating Account..." : "Register"}
          </Button>
        </form>

        <p className="mt-6 text-center text-sm text-muted-foreground">
          Already have an account?{" "}
          <Link to="/auth/login" className="font-medium text-primary hover:underline">Sign In</Link>
        </p>
      </motion.div>
    </div>
  );
}