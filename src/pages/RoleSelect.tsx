import { motion, type Transition } from "framer-motion";
import { useNavigate } from "react-router";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";
import { api } from "@/convex/_generated/api";
import { useMutation } from "convex/react";
import { useState } from "react";
import {
  MessageCircle,
  Ear,
  ArrowRight,
  Loader2,
  HandHeart,
} from "lucide-react";

const fadeUp = {
  initial: { opacity: 0, y: 24 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] as [number, number, number, number] },
};

export default function RoleSelect() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const setRole = useMutation(api.users.setRole);
  const [loading, setLoading] = useState<"seeker" | "listener" | null>(null);

  if (user?.role === "seeker") {
    navigate("/seek");
    return null;
  }
  if (user?.role === "listener") {
    navigate("/listen");
    return null;
  }
  if (user?.role === "admin") {
    navigate("/admin");
    return null;
  }

  const handleSelect = async (role: "seeker" | "listener") => {
    setLoading(role);
    try {
      await setRole({ role });
      if (role === "seeker") navigate("/seek");
      else navigate("/listen");
    } catch (err) {
      console.error(err);
      setLoading(null);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-20">
      <div className="absolute top-20 left-1/4 w-96 h-96 bg-primary/5 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-20 right-1/4 w-72 h-72 bg-blue-400/5 rounded-full blur-3xl pointer-events-none" />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="max-w-2xl w-full text-center relative"
      >
        <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-6">
          <HandHeart className="w-6 h-6 text-primary" />
        </div>

        <h1 className="text-3xl md:text-4xl font-bold tracking-tight text-foreground mb-3">
          How would you like to use Sathiii?
        </h1>
        <p className="text-muted-foreground text-lg mb-10 max-w-lg mx-auto">
          Choose your role. You can always change this later.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <motion.button
            {...fadeUp}
            whileHover={{ y: -4 }}
            onClick={() => handleSelect("seeker")}
            disabled={loading !== null}
            className="glass-card rounded-2xl p-8 text-left group hover:shadow-lg hover:shadow-primary/5 transition-all cursor-pointer disabled:opacity-50"
          >
            <div className="w-12 h-12 rounded-2xl bg-blue-500/10 flex items-center justify-center mb-4 text-blue-600 group-hover:bg-blue-500/15 transition-colors">
              <MessageCircle className="w-5 h-5" />
            </div>
            <h2 className="text-xl font-semibold text-foreground mb-2">
              I need someone to talk to
            </h2>
            <p className="text-sm text-muted-foreground leading-relaxed mb-4">
              Connect anonymously with a listener who can provide a safe,
              non-judgmental space.
            </p>
            <div className="flex items-center gap-2 text-sm text-primary font-medium">
              {loading === "seeker" ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <>
                  Get started <ArrowRight className="w-4 h-4" />
                </>
              )}
            </div>
          </motion.button>

          <motion.button
            {...fadeUp}
            transition={{ ...fadeUp.transition, delay: 0.1 }}
            whileHover={{ y: -4 }}
            onClick={() => handleSelect("listener")}
            disabled={loading !== null}
            className="glass-card rounded-2xl p-8 text-left group hover:shadow-lg hover:shadow-primary/5 transition-all cursor-pointer disabled:opacity-50"
          >
            <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 flex items-center justify-center mb-4 text-emerald-600 group-hover:bg-emerald-500/15 transition-colors">
              <Ear className="w-5 h-5" />
            </div>
            <h2 className="text-xl font-semibold text-foreground mb-2">
              I want to listen
            </h2>
            <p className="text-sm text-muted-foreground leading-relaxed mb-4">
              Become a trained volunteer listener and help people who need someone
              to talk to.
            </p>
            <div className="flex items-center gap-2 text-sm text-primary font-medium">
              {loading === "listener" ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <>
                  Become a listener <ArrowRight className="w-4 h-4" />
                </>
              )}
            </div>
          </motion.button>
        </div>

        <p className="mt-8 text-xs text-muted-foreground">
          Looking for admin access?{" "}
          <button
            onClick={() => navigate("/auth")}
            className="underline hover:text-foreground transition-colors"
          >
            Sign in with admin account
          </button>
        </p>
      </motion.div>
    </div>
  );
}
