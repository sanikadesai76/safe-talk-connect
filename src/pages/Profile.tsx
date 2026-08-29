import { motion } from "framer-motion";
import { useNavigate } from "react-router";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";
import { api } from "@/convex/_generated/api";
import { useMutation, useQuery } from "convex/react";
import {
  ArrowLeft,
  RefreshCw,
  User,
  Shield,
  Star,
  MessageCircle,
  Loader2,
} from "lucide-react";
import { useState } from "react";

export default function Profile() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const regenerateName = useMutation(api.users.regenerateAnonymousName);
  const [isRegenerating, setIsRegenerating] = useState(false);
  const conversations = useQuery(api.matching.getMyConversations);
  const myRatings = useQuery(api.ratings.getMyRatings);

  const handleRegenerate = async () => {
    setIsRegenerating(true);
    try {
      await regenerateName();
    } catch (err) {
      console.error(err);
    }
    setIsRegenerating(false);
  };

  const totalConversations = conversations?.length || 0;
  const avgRating = myRatings && myRatings.length > 0
    ? (myRatings.reduce((sum, r) => sum + r.stars, 0) / myRatings.length).toFixed(1)
    : "—";

  return (
    <div className="min-h-screen px-4 py-8">
      <div className="absolute top-20 left-1/4 w-96 h-96 bg-primary/5 rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-2xl mx-auto relative">
        <div className="flex items-center gap-3 mb-8">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)} className="h-8 w-8">
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <h1 className="text-2xl font-bold text-foreground">Profile</h1>
        </div>

        {/* Profile Card */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass-card rounded-2xl p-8 mb-6"
        >
          <div className="flex items-center gap-4 mb-6">
            <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center">
              <User className="w-8 h-8 text-primary" />
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground">
                {user?.anonymousName || "Anonymous"}
              </p>
              <p className="text-sm text-muted-foreground capitalize">
                {user?.role || "No role selected"}
              </p>
            </div>
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={handleRegenerate}
            disabled={isRegenerating}
            className="rounded-xl"
          >
            {isRegenerating ? (
              <Loader2 className="w-4 h-4 animate-spin mr-2" />
            ) : (
              <RefreshCw className="w-4 h-4 mr-2" />
            )}
            Generate new anonymous name
          </Button>
        </motion.div>

        {/* Stats */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="grid grid-cols-3 gap-4 mb-6"
        >
          {[
            { label: "Conversations", value: totalConversations, icon: <MessageCircle className="w-4 h-4" /> },
            { label: "Avg Rating", value: avgRating, icon: <Star className="w-4 h-4" /> },
            { label: "Role", value: user?.role || "—", icon: <Shield className="w-4 h-4" /> },
          ].map((stat) => (
            <div key={stat.label} className="glass-card rounded-2xl p-4 text-center">
              <div className="text-primary mb-2 flex justify-center">{stat.icon}</div>
              <p className="text-xl font-bold text-foreground">{stat.value}</p>
              <p className="text-xs text-muted-foreground">{stat.label}</p>
            </div>
          ))}
        </motion.div>

        {/* Privacy Note */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="glass-card rounded-2xl p-6"
        >
          <h3 className="font-medium text-foreground mb-2">Privacy</h3>
          <p className="text-sm text-muted-foreground leading-relaxed">
            Your real identity is never shared with conversation partners. You
            communicate using your anonymous display name. Your email and other
            personal information are kept private.
          </p>
        </motion.div>
      </div>
    </div>
  );
}
