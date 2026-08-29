import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";
import { api } from "@/convex/_generated/api";
import { useMutation, useQuery } from "convex/react";
import { useEffect, useState } from "react";
import { fadeUpExit } from "@/lib/animations";
import {
  RefreshCw,
  Search,
  Loader2,
  ArrowRight,
  ArrowLeft,
  MessageCircle,
  Sparkles,
  Users,
  Clock,
  AlertTriangle,
  Shield,
} from "lucide-react";

const CATEGORIES = [
  { id: "listen", label: "I just want someone to listen", icon: "👂" },
  { id: "talk", label: "I want to talk through something", icon: "💬" },
  { id: "lonely", label: "I'm feeling lonely", icon: "🌙" },
  { id: "encouragement", label: "I need encouragement", icon: "✨" },
  { id: "difficult", label: "I'm having a difficult day", icon: "🌧️" },
  { id: "positive", label: "I want to share something positive", icon: "☀️" },
  { id: "general", label: "I don't really know — I just want to talk", icon: "🤍" },
];

export default function SeekOnboarding() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const regenerateName = useMutation(api.users.regenerateAnonymousName);
  const findListener = useMutation(api.matching.findListener);
  const activeConversation = useQuery(api.matching.getMyActiveConversation);

  const [step, setStep] = useState<"categories" | "name" | "searching" | "no-listener">(
    user?.anonymousName ? "categories" : "name"
  );
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [anonymousName, setAnonymousName] = useState(user?.anonymousName || "");
  const [isRegenerating, setIsRegenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [waitingQueue, setWaitingQueue] = useState(false);

  // Redirect if already in a conversation
  useEffect(() => {
    if (activeConversation) {
      navigate(`/chat/${activeConversation._id}`);
    }
  }, [activeConversation, navigate]);

  if (activeConversation) return null;

  const toggleCategory = (id: string) => {
    setSelectedCategories((prev) =>
      prev.includes(id) ? prev.filter((c) => c !== id) : [...prev, id]
    );
  };

  const handleRegenerate = async () => {
    setIsRegenerating(true);
    try {
      const result = await regenerateName();
      setAnonymousName(result.anonymousName);
    } catch (err) {
      console.error(err);
    }
    setIsRegenerating(false);
  };

  const handleFindListener = async () => {
    if (selectedCategories.length === 0) {
      setError("Please select at least one category");
      return;
    }

    setStep("searching");
    setError(null);

    try {
      const result = await findListener({
        categories: selectedCategories,
        anonymousName: anonymousName,
      });

      if (result.matched && result.conversationId) {
        navigate(`/chat/${result.conversationId}`);
      } else {
        setStep("no-listener");
        setWaitingQueue(true);
      }
    } catch (err) {
      console.error(err);
      setError(err instanceof Error ? err.message : "Something went wrong");
      setStep("categories");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-20">
      <div className="absolute top-20 left-1/4 w-96 h-96 bg-primary/5 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-20 right-1/4 w-72 h-72 bg-blue-400/5 rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-xl w-full relative">
        {/* Step indicator */}
        <div className="flex items-center justify-center gap-2 mb-8">
          {["name", "categories", "searching", "no-listener"].map((s, i) => (
            <div
              key={s}
              className={`w-2 h-2 rounded-full transition-colors ${
                step === s ? "bg-primary w-6" : "bg-muted-foreground/30"
              }`}
            />
          ))}
        </div>

        <AnimatePresence mode="wait">
          {/* Step: Anonymous Name */}
          {step === "name" && (
            <motion.div key="name" {...fadeUpExit} className="text-center">
              <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-6">
                <Sparkles className="w-6 h-6 text-primary" />
              </div>
              <h1 className="text-3xl font-bold tracking-tight text-foreground mb-3">
                Choose your anonymous name
              </h1>
              <p className="text-muted-foreground mb-8">
                This is how others will see you. Your real identity stays hidden.
              </p>

              <div className="glass-card rounded-2xl p-6 mb-6">
                <p className="text-2xl font-semibold text-foreground mb-4">
                  {anonymousName || "Generating..."}
                </p>
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
                  Generate new name
                </Button>
              </div>

              <Button
                onClick={() => setStep("categories")}
                className="rounded-2xl px-8"
              >
                Continue
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </motion.div>
          )}

          {/* Step: Categories */}
          {step === "categories" && (
            <motion.div key="categories" {...fadeUpExit} className="text-center">
              <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-6">
                <MessageCircle className="w-6 h-6 text-primary" />
              </div>
              <h1 className="text-3xl font-bold tracking-tight text-foreground mb-3">
                What do you need right now?
              </h1>
              <p className="text-muted-foreground mb-8">
                Select one or more — this helps us find the right listener for
                you.
              </p>

              {error && (
                <p className="text-sm text-red-500 mb-4">{error}</p>
              )}

              <div className="space-y-3 mb-8">
                {CATEGORIES.map((cat) => (
                  <motion.button
                    key={cat.id}
                    whileHover={{ scale: 1.01 }}
                    whileTap={{ scale: 0.99 }}
                    onClick={() => toggleCategory(cat.id)}
                    className={`w-full glass-card rounded-xl p-4 text-left flex items-center gap-4 transition-all ${
                      selectedCategories.includes(cat.id)
                        ? "ring-2 ring-primary shadow-md"
                        : "hover:shadow-md"
                    }`}
                  >
                    <span className="text-xl">{cat.icon}</span>
                    <span className="text-sm font-medium text-foreground">
                      {cat.label}
                    </span>
                    {selectedCategories.includes(cat.id) && (
                      <div className="ml-auto w-5 h-5 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs">
                        ✓
                      </div>
                    )}
                  </motion.button>
                ))}
              </div>

              <div className="flex gap-3 justify-center">
                <Button
                  variant="outline"
                  onClick={() => setStep("name")}
                  className="rounded-2xl"
                >
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Back
                </Button>
                <Button
                  onClick={handleFindListener}
                  disabled={selectedCategories.length === 0}
                  className="rounded-2xl px-8"
                >
                  <Search className="mr-2 h-4 w-4" />
                  Find me a listener
                </Button>
              </div>
            </motion.div>
          )}

          {/* Step: Searching */}
          {step === "searching" && (
            <motion.div key="searching" {...fadeUpExit} className="text-center">
              <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-6">
                <Loader2 className="w-8 h-8 text-primary animate-spin" />
              </div>
              <h1 className="text-3xl font-bold tracking-tight text-foreground mb-3">
                Finding a listener...
              </h1>
              <p className="text-muted-foreground">
                We're looking for an available listener for you.
              </p>
            </motion.div>
          )}

          {/* Step: No listener available */}
          {step === "no-listener" && (
            <motion.div key="no-listener" {...fadeUpExit} className="text-center">
              <div className="w-12 h-12 rounded-2xl bg-amber-500/10 flex items-center justify-center mx-auto mb-6">
                <Clock className="w-6 h-6 text-amber-600" />
              </div>
              <h1 className="text-3xl font-bold tracking-tight text-foreground mb-3">
                No listeners available right now
              </h1>
              <p className="text-muted-foreground mb-8">
                All our listeners are currently in conversations. You've been
                added to the queue and we'll match you as soon as someone is
                available.
              </p>

              {waitingQueue && (
                <div className="glass-card rounded-2xl p-6 mb-8">
                  <div className="flex items-center gap-3 justify-center mb-3">
                    <Users className="w-5 h-5 text-primary" />
                    <span className="font-medium text-foreground">
                      You're in the queue
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    We'll notify you when a listener becomes available. Stay on
                    this page or check back later.
                  </p>
                </div>
              )}

              <div className="flex gap-3 justify-center">
                <Button
                  variant="outline"
                  onClick={() => setStep("categories")}
                  className="rounded-2xl"
                >
                  Try again
                </Button>
                <Button
                  onClick={() => navigate("/")}
                  variant="ghost"
                  className="rounded-2xl"
                >
                  Go home
                </Button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Safety note */}
        <div className="mt-12 text-center">
          <div className="inline-flex items-center gap-2 text-xs text-muted-foreground">
            <Shield className="w-3 h-3" />
            <span>
              This is not a crisis service. If you're in danger, call{" "}
              <strong>911</strong> or your local emergency number.
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
