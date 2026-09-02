import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";
import { api } from "@/convex/_generated/api";
import { useMutation, useQuery } from "convex/react";
import { useEffect, useState } from "react";
import { fadeUpExit } from "@/lib/animations";
import {
  ArrowRight,
  ArrowLeft,
  Loader2,
  Ear,
  Shield,
  CheckCircle,
  AlertTriangle,
  BookOpen,
  HandHeart,
  MessageCircle,
  XCircle,
  Phone,
  Clock,
  Eye,
  Ban,
  Heart,
} from "lucide-react";

const WHY_LISTEN = [
  "I enjoy helping people",
  "I want to support others",
  "I know what loneliness feels like",
  "I want to volunteer",
  "Other",
];

const LANGUAGES = [
  "English", "Spanish", "French", "German", "Portuguese",
  "Chinese", "Japanese", "Korean", "Arabic", "Hindi",
  "Russian", "Italian", "Dutch", "Turkish", "Other",
];

const TOPICS = [
  "Loneliness", "Work", "Education", "Family", "Stress",
  "General life problems", "Relationships", "Success / celebration", "Other",
];

const TRAINING_SECTIONS = [
  {
    icon: <Ear className="w-6 h-6" />,
    title: "Listen first",
    content: "Do not immediately give solutions. Many people just need someone to hear them out before anything else. Start by listening, not advising.",
    color: "text-blue-600",
    bg: "bg-blue-500/10",
  },
  {
    icon: <Shield className="w-6 h-6" />,
    title: "Don't judge",
    content: "Avoid criticism, shame, or making someone feel bad about their choices. Everyone deserves to feel safe sharing their thoughts without fear of judgment.",
    color: "text-emerald-600",
    bg: "bg-emerald-500/10",
  },
  {
    icon: <XCircle className="w-6 h-6" />,
    title: "Don't diagnose",
    content: "Never claim someone has a medical or psychological disorder. You are not a therapist and should never pretend to be one. If they need professional help, encourage them to seek it.",
    color: "text-red-500",
    bg: "bg-red-500/10",
  },
  {
    icon: <Ban className="w-6 h-6" />,
    title: "Don't manipulate",
    content: "Never use another person's vulnerability for personal gain. This is a position of trust. Do not exploit it in any way.",
    color: "text-purple-600",
    bg: "bg-purple-500/10",
  },
  {
    icon: <Heart className="w-6 h-6" />,
    title: "Don't flirt",
    content: "This is not a dating platform. Never make romantic or sexual advances. Keep the relationship supportive and platonic at all times.",
    color: "text-pink-600",
    bg: "bg-pink-500/10",
  },
  {
    icon: <Eye className="w-6 h-6" />,
    title: "Respect boundaries",
    content: "Never pressure someone to reveal personal information. If someone doesn't want to share, that's completely fine. Let them guide the conversation.",
    color: "text-amber-600",
    bg: "bg-amber-500/10",
  },
  {
    icon: <Phone className="w-6 h-6" />,
    title: "Know when to escalate",
    content: "If there appears to be an immediate safety concern, follow the platform's safety procedure. Direct the person toward emergency or professional resources. You are not responsible for their safety — the platform is.",
    color: "text-orange-600",
    bg: "bg-orange-500/10",
  },
];



export default function ListenOnboarding() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const createProfile = useMutation(api.listeners.createListenerProfile);
  const completeTrainingMutation = useMutation(api.listeners.completeTraining);
  const listenerProfile = useQuery(api.listeners.getMyProfile);

  const [step, setStep] = useState<
    "info" | "languages" | "topics" | "training" | "pending" | "approved"
  >(listenerProfile?.approvalStatus === "approved" && !listenerProfile?.trainingCompleted ? "training" :
    listenerProfile?.approvalStatus === "approved" ? "approved" :
    listenerProfile?.approvalStatus === "pending" || listenerProfile?.approvalStatus === "rejected" ? "pending" : "info");

  const [whyListen, setWhyListen] = useState("");
  const [customWhy, setCustomWhy] = useState("");
  const [selectedLanguages, setSelectedLanguages] = useState<string[]>(["English"]);
  const [selectedTopics, setSelectedTopics] = useState<string[]>([]);
  const [trainingIndex, setTrainingIndex] = useState(0);
  const [trainingAgreed, setTrainingAgreed] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Redirect based on state (moved from render to useEffect)
  useEffect(() => {
    if (user?.role === "admin") {
      navigate("/admin", { replace: true });
      return;
    }
    if (listenerProfile === undefined) return; // still loading
    if (listenerProfile?.approvalStatus === "approved" && listenerProfile?.trainingCompleted) {
      navigate("/listener-dashboard", { replace: true });
      return;
    }
    if (!listenerProfile) {
      navigate("/listener-application", { replace: true });
      return;
    }
  }, [user, listenerProfile, navigate]);
  // If profile exists but application was rejected, show waiting
  if (listenerProfile?.approvalStatus === "rejected") {
    setStep("pending");
  }

  const toggleLanguage = (lang: string) => {
    setSelectedLanguages((prev) =>
      prev.includes(lang) ? prev.filter((l) => l !== lang) : [...prev, lang]
    );
  };

  const toggleTopic = (topic: string) => {
    setSelectedTopics((prev) =>
      prev.includes(topic) ? prev.filter((t) => t !== topic) : [...prev, topic]
    );
  };

  const handleSubmitProfile = async () => {
    setLoading(true);
    setError(null);
    try {
      await createProfile({
        whyListen: whyListen === "Other" ? customWhy : whyListen,
        languages: selectedLanguages,
        topics: selectedTopics,
      });
      setStep("training");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    }
    setLoading(false);
  };

  const handleCompleteTraining = async () => {
    if (!trainingAgreed) return;
    setLoading(true);
    try {
      await completeTrainingMutation();
      setStep("pending");
    } catch (err) {
      console.error(err);
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-20">
      <div className="absolute top-20 left-1/4 w-96 h-96 bg-primary/5 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-20 right-1/4 w-72 h-72 bg-emerald-500/5 rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-2xl w-full relative">
        <AnimatePresence mode="wait">
          {/* Step: Info */}
          {step === "info" && (
            <motion.div key="info" {...fadeUpExit} className="text-center">
              <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-6">
                <Ear className="w-6 h-6 text-primary" />
              </div>
              <h1 className="text-3xl font-bold tracking-tight text-foreground mb-3">
                Become a Listener
              </h1>
              <p className="text-muted-foreground mb-8 max-w-lg mx-auto leading-relaxed">
                A listener isn't a therapist. Your job is to listen, understand,
                and support — not diagnose or control someone's decisions.
              </p>

              <div className="glass-card rounded-2xl p-6 mb-8 text-left">
                <h3 className="font-semibold text-foreground mb-4">
                  Why do you want to listen?
                </h3>
                <div className="space-y-2">
                  {WHY_LISTEN.map((option) => (
                    <button
                      key={option}
                      onClick={() => setWhyListen(option)}
                      className={`w-full text-left rounded-xl p-3 text-sm transition-all ${
                        whyListen === option
                          ? "bg-primary/10 ring-2 ring-primary text-foreground"
                          : "glass-card text-muted-foreground hover:text-foreground"
                      }`}
                    >
                      {option}
                    </button>
                  ))}
                </div>
                {whyListen === "Other" && (
                  <input
                    type="text"
                    value={customWhy}
                    onChange={(e) => setCustomWhy(e.target.value)}
                    placeholder="Tell us more..."
                    className="mt-3 w-full rounded-xl glass-input px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                )}
              </div>

              <Button
                onClick={() => setStep("languages")}
                disabled={!whyListen || (whyListen === "Other" && !customWhy)}
                className="rounded-2xl px-8"
              >
                Continue
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </motion.div>
          )}

          {/* Step: Languages */}
          {step === "languages" && (
            <motion.div key="languages" {...fadeUpExit} className="text-center">
              <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-6">
                <MessageCircle className="w-6 h-6 text-primary" />
              </div>
              <h1 className="text-3xl font-bold tracking-tight text-foreground mb-3">
                Languages you speak
              </h1>
              <p className="text-muted-foreground mb-8">
                Select all languages you're comfortable having a conversation in.
              </p>

              <div className="flex flex-wrap gap-2 justify-center mb-8 max-w-lg mx-auto">
                {LANGUAGES.map((lang) => (
                  <button
                    key={lang}
                    onClick={() => toggleLanguage(lang)}
                    className={`rounded-xl px-4 py-2 text-sm transition-all ${
                      selectedLanguages.includes(lang)
                        ? "bg-primary text-primary-foreground"
                        : "glass-card text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    {lang}
                  </button>
                ))}
              </div>

              <div className="flex gap-3 justify-center">
                <Button variant="outline" onClick={() => setStep("info")} className="rounded-2xl">
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Back
                </Button>
                <Button
                  onClick={() => setStep("topics")}
                  disabled={selectedLanguages.length === 0}
                  className="rounded-2xl px-8"
                >
                  Continue
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </div>
            </motion.div>
          )}

          {/* Step: Topics */}
          {step === "topics" && (
            <motion.div key="topics" {...fadeUpExit} className="text-center">
              <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-6">
                <BookOpen className="w-6 h-6 text-primary" />
              </div>
              <h1 className="text-3xl font-bold tracking-tight text-foreground mb-3">
                Topics you're comfortable with
              </h1>
              <p className="text-muted-foreground mb-8">
                Select the topics you feel confident listening to.
              </p>

              <div className="space-y-2 mb-8 max-w-lg mx-auto">
                {TOPICS.map((topic) => (
                  <button
                    key={topic}
                    onClick={() => toggleTopic(topic)}
                    className={`w-full text-left rounded-xl p-4 text-sm transition-all ${
                      selectedTopics.includes(topic)
                        ? "bg-primary/10 ring-2 ring-primary text-foreground"
                        : "glass-card text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    {topic}
                  </button>
                ))}
              </div>

              {error && <p className="text-sm text-red-500 mb-4">{error}</p>}

              <div className="flex gap-3 justify-center">
                <Button variant="outline" onClick={() => setStep("languages")} className="rounded-2xl">
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Back
                </Button>
                <Button
                  onClick={handleSubmitProfile}
                  disabled={selectedTopics.length === 0 || loading}
                  className="rounded-2xl px-8"
                >
                  {loading ? (
                    <Loader2 className="w-4 h-4 animate-spin mr-2" />
                  ) : null}
                  Submit & continue to training
                </Button>
              </div>
            </motion.div>
          )}

          {/* Step: Training */}
          {step === "training" && (
            <motion.div key="training" {...fadeUpExit} className="text-center">
              <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-6">
                <BookOpen className="w-6 h-6 text-primary" />
              </div>
              <h1 className="text-3xl font-bold tracking-tight text-foreground mb-3">
                Listener Training
              </h1>
              <p className="text-muted-foreground mb-6">
                Complete this quick training before you can listen.
              </p>

              {/* Progress */}
              <div className="flex items-center justify-center gap-1 mb-8">
                {TRAINING_SECTIONS.map((_, i) => (
                  <div
                    key={i}
                    className={`h-1.5 rounded-full transition-all ${
                      i <= trainingIndex
                        ? "bg-primary w-6"
                        : "bg-muted-foreground/20 w-3"
                    }`}
                  />
                ))}
              </div>

              {/* Training content */}
              <div className="glass-card rounded-2xl p-8 text-left mb-8">
                <div className={`w-12 h-12 rounded-2xl ${TRAINING_SECTIONS[trainingIndex].bg} flex items-center justify-center mb-4 ${TRAINING_SECTIONS[trainingIndex].color}`}>
                  {TRAINING_SECTIONS[trainingIndex].icon}
                </div>
                <h3 className="text-xl font-semibold text-foreground mb-3">
                  {TRAINING_SECTIONS[trainingIndex].title}
                </h3>
                <p className="text-muted-foreground leading-relaxed">
                  {TRAINING_SECTIONS[trainingIndex].content}
                </p>
              </div>

              <div className="flex flex-col items-center gap-4">
                {trainingIndex > 0 && (
                  <Button
                    variant="outline"
                    onClick={() => setTrainingIndex((i) => i - 1)}
                    className="rounded-2xl"
                  >
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Previous
                  </Button>
                )}
                {trainingIndex < TRAINING_SECTIONS.length - 1 ? (
                  <Button
                    onClick={() => setTrainingIndex((i) => i + 1)}
                    className="rounded-2xl px-8"
                  >
                    Next
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                ) : (
                  <>
                    <label className="flex items-center gap-3 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={trainingAgreed}
                        onChange={(e) => setTrainingAgreed(e.target.checked)}
                        className="w-4 h-4 rounded border-gray-300"
                      />
                      <span className="text-sm text-foreground font-medium">
                        I understand and agree to follow these guidelines
                      </span>
                    </label>
                    <Button
                      onClick={handleCompleteTraining}
                      disabled={!trainingAgreed || loading}
                      className="rounded-2xl px-8"
                    >
                      {loading ? (
                        <Loader2 className="w-4 h-4 animate-spin mr-2" />
                      ) : (
                        <CheckCircle className="w-4 h-4 mr-2" />
                      )}
                      Complete training
                    </Button>
                  </>
                )}
              </div>
            </motion.div>
          )}

          {/* Step: Pending */}
          {step === "pending" && (
            <motion.div key="pending" {...fadeUpExit} className="text-center">
              <div className="w-12 h-12 rounded-2xl bg-amber-500/10 flex items-center justify-center mx-auto mb-6">
                <Clock className="w-6 h-6 text-amber-600" />
              </div>
              <h1 className="text-3xl font-bold tracking-tight text-foreground mb-3">
                Waiting for approval
              </h1>
              <p className="text-muted-foreground mb-8 max-w-lg mx-auto">
                Thank you for completing training! An administrator will review
                your application. You'll be notified when you're approved.
              </p>
              <div className="glass-card rounded-2xl p-6 mb-8">
                <p className="text-sm text-muted-foreground">
                  This usually takes 1-2 business days. In the meantime, you can
                  review our safety guidelines and community guidelines.
                </p>
              </div>
              <Button variant="outline" onClick={() => navigate("/")} className="rounded-2xl">
                Go home
              </Button>
            </motion.div>
          )}

          {/* Step: Approved */}
          {step === "approved" && (
            <motion.div key="approved" {...fadeUpExit} className="text-center">
              <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 flex items-center justify-center mx-auto mb-6">
                <CheckCircle className="w-6 h-6 text-emerald-600" />
              </div>
              <h1 className="text-3xl font-bold tracking-tight text-foreground mb-3">
                You're approved!
              </h1>
              <p className="text-muted-foreground mb-8">
                Go to your dashboard to set your availability and start listening.
              </p>
              <Button onClick={() => navigate("/listener-dashboard")} className="rounded-2xl px-8">
                Go to dashboard
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
