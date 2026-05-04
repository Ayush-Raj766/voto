import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { Shield, Wallet, UserPlus, CheckCircle, ArrowRight } from "lucide-react";

export default function Index() {
  const steps = [
    {
      icon: <Wallet className="h-6 w-6 text-primary" />,
      title: "1. Get MetaMask",
      description: "Install the MetaMask browser extension and create a wallet to interact with the blockchain.",
    },
    {
      icon: <UserPlus className="h-6 w-6 text-primary" />,
      title: "2. Register",
      description: "Sign up on our platform and connect your MetaMask wallet to link your identity.",
    },
    {
      icon: <Shield className="h-6 w-6 text-primary" />,
      title: "3. Verification",
      description: "Wait for the admin or sub-admin of your organization to verify and approve your account.",
    },
    {
      icon: <CheckCircle className="h-6 w-6 text-primary" />,
      title: "4. Vote",
      description: "Once approved, you can securely participate in active elections using your wallet.",
    },
  ];

  return (
    <div className="min-h-screen bg-background selection:bg-primary/30">
      <div className="container mx-auto px-4 py-16 sm:px-6 lg:px-8">
        
        {/* Hero Section */}
        <div className="text-center max-w-3xl mx-auto mb-20">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-2xl bg-primary/20 shadow-[0_0_30px_rgba(var(--primary),0.3)]">
              <Shield className="h-10 w-10 text-primary" />
            </div>
            <h1 className="text-4xl font-extrabold tracking-tight sm:text-5xl md:text-6xl mb-6">
              Welcome to <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-primary/60">SecureVote Hub</span>
            </h1>
            <p className="text-xl text-muted-foreground mb-8">
              A fully decentralized, transparent, and immutable voting platform powered by blockchain technology.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link to="/auth/register">
                <Button size="lg" className="w-full sm:w-auto glow-primary text-lg px-8 h-12">
                  Get Started <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>
              <Link to="/auth/login">
                <Button size="lg" variant="outline" className="w-full sm:w-auto text-lg px-8 h-12">
                  Sign In
                </Button>
              </Link>
            </div>
          </motion.div>
        </div>

        {/* Steps Section */}
        <div className="max-w-5xl mx-auto">
          <motion.div 
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="text-center mb-12"
          >
            <h2 className="text-3xl font-bold mb-4">How It Works</h2>
            <p className="text-muted-foreground">Follow these simple steps to cast your secure vote.</p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {steps.map((step, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.3 + index * 0.1 }}
                className="glass-card p-6 flex flex-col items-center text-center hover:-translate-y-1 transition-transform duration-300"
              >
                <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-secondary/80">
                  {step.icon}
                </div>
                <h3 className="text-lg font-semibold mb-2">{step.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {step.description}
                </p>
              </motion.div>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
}
