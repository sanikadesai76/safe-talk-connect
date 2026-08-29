import { motion } from "framer-motion";
import { useNavigate, useParams } from "react-router";
import { Button } from "@/components/ui/button";
import { api } from "@/convex/_generated/api";
import { useMutation, useQuery } from "convex/react";
import { useState } from "react";
import { fadeUpExit } from "@/lib/animations";
import type { Id } from "@/convex/_generated/dataModel";
import {
  Star,
  Heart,
  ThumbsUp,
  ArrowRight,
  Loader2,
  CheckCircle,
  Shield,
} from "lucide-react";



export default function Feedback() {
  const { conversationId } = useParams<{ conversationId: string }>();
  const navigate = useNavigate();
  const submitFeedback = useMutation(api.ratings.submitFeedback);
  const hasSubmitted = useQuery(
    api.ratings.hasSubmittedFeedback,
    conversationId ? { conversationId: conversationId as Id<"conversations"> } : "skip"
  );

  const [step, setStep] = useState<"stars" | "heard" | "feeling" | "again" | "done">("stars");
  const [stars, setStars] = useState(0);
  const [hoveredStar, setHoveredStar] = useState(0);
  const [feltHeard, setFeltHeard] = useState("");
  const [feelingNow, setFeelingNow] = useState("");
  const [wouldTalkAgain, setWouldTalkAgain] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(false);

  if (!conversationId) {
    navigate("/");
    return null;
  }

  if (hasSubmitted) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <motion.div {...fadeUpExit} className="text-center max-w-md">
          <CheckCircle className="w-12 h-12 text-emerald-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-foreground mb-3">
            Thank you for your feedback
          </h1>
          <p className="text-muted-foreground mb-6">
            Your feedback helps us keep SafeTalk safe and effective.
          </p>
          <Button onClick={() => navigate("/")} className="rounded-xl">
            Go home
          </Button>
        </motion.div>
      </div>
    );
  }

  const handleSubmit = async () => {
    if (!conversationId) return;
    setLoading(true);
    try {
      await submitFeedback({
        conversationId: conversationId as Id<"conversations">,
        stars,
        feltHeard,
        feelingNow: feelingNow || undefined,
        wouldTalkAgain: wouldTalkAgain ?? true,
      });
      setStep("done");
    } catch (err) {
      console.error(err);
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-20">
      <div className="absolute top-20 left-1/4 w-96 h-96 bg-primary/5 rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-lg w-full relative">
        {step === "done" ? (
          <motion.div {...fadeUpExit} className="text-center">
            <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 flex items-center justify-center mx-auto mb-6">
              <Heart className="w-6 h-6 text-emerald-600" />
            </div>
            <h1 className="text-3xl font-bold tracking-tight text-foreground mb-3">
              Thank you
            </h1>
            <p className="text-muted-foreground mb-8">
              Your feedback helps us improve the experience for everyone.
            </p>
            <Button onClick={() => navigate("/")} className="rounded-2xl px-8">
              Go home
            </Button>
          </motion.div>
        ) : step === "stars" ? (
          <motion.div {...fadeUpExit} className="text-center">
            <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-6">
              <Star className="w-6 h-6 text-primary" />
            </div>
            <h1 className="text-3xl font-bold tracking-tight text-foreground mb-3">
              How was the conversation?
            </h1>
            <p className="text-muted-foreground mb-8">
              Your feedback is anonymous and helps us maintain quality.
            </p>

            <div className="flex justify-center gap-2 mb-8">
              {[1, 2, 3, 4, 5].map((s) => (
                <button
                  key={s}
                  onMouseEnter={() => setHoveredStar(s)}
                  onMouseLeave={() => setHoveredStar(0)}
                  onClick={() => setStars(s)}
                  className="transition-transform hover:scale-110"
                >
                  <Star
                    className={`w-10 h-10 ${
                      s <= (hoveredStar || stars)
                        ? "fill-amber-400 text-amber-400"
                        : "text-muted-foreground/30"
                    }`}
                  />
                </button>
              ))}
            </div>

            <Button
              onClick={() => setStep("heard")}
              disabled={stars === 0}
              className="rounded-2xl px-8"
            >
              Continue
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </motion.div>
        ) : step === "heard" ? (
          <motion.div {...fadeUpExit} className="text-center">
            <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-6">
              <ThumbsUp className="w-6 h-6 text-primary" />
            </div>
            <h1 className="text-3xl font-bold tracking-tight text-foreground mb-3">
              Did you feel heard?
            </h1>
            <p className="text-muted-foreground mb-8">
              Did the listener understand and acknowledge what you were sharing?
            </p>

            <div className="space-y-3 mb-8">
              {["Yes", "Somewhat", "No"].map((option) => (
                <button
                  key={option}
                  onClick={() => setFeltHeard(option.toLowerCase())}
                  className={`w-full rounded-xl p-4 text-sm transition-all ${
                    feltHeard === option.toLowerCase()
                      ? "bg-primary/10 ring-2 ring-primary text-foreground"
                      : "glass-card text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {option}
                </button>
              ))}
            </div>

            <Button
              onClick={() => setStep("feeling")}
              disabled={!feltHeard}
              className="rounded-2xl px-8"
            >
              Continue
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </motion.div>
        ) : step === "feeling" ? (
          <motion.div {...fadeUpExit} className="text-center">
            <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-6">
              <Heart className="w-6 h-6 text-primary" />
            </div>
            <h1 className="text-3xl font-bold tracking-tight text-foreground mb-3">
              How do you feel now?
            </h1>
            <p className="text-muted-foreground mb-8">
              Compared to before the conversation.
            </p>

            <div className="space-y-3 mb-8">
              {["Better", "About the same", "Worse"].map((option) => (
                <button
                  key={option}
                  onClick={() => setFeelingNow(option.toLowerCase())}
                  className={`w-full rounded-xl p-4 text-sm transition-all ${
                    feelingNow === option.toLowerCase()
                      ? "bg-primary/10 ring-2 ring-primary text-foreground"
                      : "glass-card text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {option}
                </button>
              ))}
            </div>

            <Button
              onClick={() => setStep("again")}
              disabled={!feelingNow}
              className="rounded-2xl px-8"
            >
              Continue
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </motion.div>
        ) : step === "again" ? (
          <motion.div {...fadeUpExit} className="text-center">
            <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-6">
              <Heart className="w-6 h-6 text-primary" />
            </div>
            <h1 className="text-3xl font-bold tracking-tight text-foreground mb-3">
              Would you talk to this person again?
            </h1>
            <p className="text-muted-foreground mb-8">
              This helps us understand if we're making good matches.
            </p>

            <div className="flex gap-4 justify-center mb-8">
              <button
                onClick={() => setWouldTalkAgain(true)}
                className={`rounded-xl px-8 py-4 text-sm transition-all ${
                  wouldTalkAgain === true
                    ? "bg-primary/10 ring-2 ring-primary text-foreground"
                    : "glass-card text-muted-foreground hover:text-foreground"
                }`}
              >
                Yes
              </button>
              <button
                onClick={() => setWouldTalkAgain(false)}
                className={`rounded-xl px-8 py-4 text-sm transition-all ${
                  wouldTalkAgain === false
                    ? "bg-primary/10 ring-2 ring-primary text-foreground"
                    : "glass-card text-muted-foreground hover:text-foreground"
                }`}
              >
                No
              </button>
            </div>

            <Button
              onClick={handleSubmit}
              disabled={wouldTalkAgain === null || loading}
              className="rounded-2xl px-8"
            >
              {loading ? (
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
              ) : null}
              Submit feedback
            </Button>
          </motion.div>
        ) : null}

        <div className="mt-12 text-center">
          <div className="inline-flex items-center gap-2 text-xs text-muted-foreground">
            <Shield className="w-3 h-3" />
            <span>Your feedback is anonymous</span>
          </div>
        </div>
      </div>
    </div>
  );
}
