import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/hooks/use-auth";
import { api } from "@/convex/_generated/api";
import { useMutation, useQuery } from "convex/react";
import { useState, useMemo } from "react";
import { fadeUpExit } from "@/lib/animations";
import {
  ArrowRight,
  ArrowLeft,
  Loader2,
  Ear,
  CheckCircle,
  Clock,
  AlertTriangle,
  Send,
  FileText,
} from "lucide-react";

const LANGUAGES = [
  "English", "Spanish", "French", "German", "Portuguese",
  "Chinese", "Japanese", "Korean", "Arabic", "Hindi",
  "Russian", "Italian", "Dutch", "Turkish", "Other",
];

const TOPICS = [
  "Loneliness", "Work", "Education", "Family", "Stress",
  "General life problems", "Relationships", "Success / celebration", "Other",
];

const AGE_RANGES = ["18-24", "25-34", "35-44", "45-54", "55-64", "65+"];

const TIMEZONES = [
  "UTC-12 to UTC-8 (Americas West)", "UTC-7 to UTC-5 (Americas Central)",
  "UTC-4 to UTC-1 (Americas East / Europe West)", "UTC+0 to UTC+3 (Europe / Africa)",
  "UTC+4 to UTC+7 (Middle East / Asia)", "UTC+8 to UTC+12 (Asia Pacific / Oceania)",
];

const AVAILABILITY_OPTIONS = [
  "A few hours per week", "5-10 hours per week", "10-20 hours per week",
  "More than 20 hours per week", "Varies — I'll log in when I can",
];

const MIN_CHARS = 100;

type Step =
  | "intro"
  | "basic"
  | "scenarios"
  | "declaration"
  | "submitting"
  | "submitted"
  | "under_review"
  | "needs_info"
  | "approved"
  | "rejected";

export default function ListenerApplication() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const myApplication = useQuery(api.listenerApplications.getMyApplication);
  const submitApp = useMutation(api.listenerApplications.submitApplication);

  // Basic info
  const [anonymousName, setAnonymousName] = useState("");
  const [ageRange, setAgeRange] = useState("");
  const [selectedLanguages, setSelectedLanguages] = useState<string[]>(["English"]);
  const [timezone, setTimezone] = useState("");
  const [availability, setAvailability] = useState("");
  const [whyListen, setWhyListen] = useState("");
  const [previousExperience, setPreviousExperience] = useState<boolean | null>(null);
  const [experienceDescription, setExperienceDescription] = useState("");
  const [comfortableTopics, setComfortableTopics] = useState<string[]>([]);
  const [uncomfortableTopics, setUncomfortableTopics] = useState("");

  // Scenario answers
  const [answers, setAnswers] = useState<Record<string, string>>({});

  // Declaration
  const [originalityConfirmed, setOriginalityConfirmed] = useState(false);

  // UI state
  const [step, setStep] = useState<Step>("intro");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Compute scenario order (stable per session)
  const scenarios = useMemo(() => {
    const core = [
      {
        id: "emotional_dependency", title: "Emotional Dependency",
        scenario: "A seeker tells you: \"You're the only person who understands me. I don't want to talk to anyone else. Can I have your personal Instagram so we can keep talking outside SafeTalk?\"",
        question: "What would you do?",
        followUp: "",
      },
      {
        id: "anger", title: "Anger",
        scenario: "A seeker becomes frustrated and says: \"You're useless. You're not helping me at all.\"",
        question: "How would you respond?",
        followUp: "",
      },
      {
        id: "crisis_safety", title: "Crisis / Safety",
        scenario: "A seeker says something that makes you seriously concerned about their immediate safety.",
        question: "What would you do?",
        followUp: "",
      },
    ];
    const pool = [
      {
        id: "listening_vs_solving", title: "Listening vs. Solving",
        scenario: "A person tells you: \"I failed an important exam. My parents are disappointed in me and I feel like I've let everyone down.\"",
        question: "What would you say in your first response?",
        followUp: "Why would you respond that way?",
      },
      {
        id: "advice_rejected", title: "Advice Rejected",
        scenario: "You listen to someone explain a problem. You offer a suggestion, but they say: \"I've already tried that. You don't understand.\"",
        question: "What would you do next?",
        followUp: "What would you avoid saying?",
      },
      {
        id: "repeated_conversation", title: "Repeated Conversation",
        scenario: "A person comes back several times and talks about the same problem. You feel like they aren't making any changes.",
        question: "What would you do?",
        followUp: "",
      },
      {
        id: "different_values", title: "Different Values",
        scenario: "A seeker describes a personal decision that you strongly disagree with. You believe their decision is wrong.",
        question: "How would you handle the conversation?",
        followUp: "",
      },
      {
        id: "personal_trigger", title: "Personal Trigger",
        scenario: "A seeker talks about an experience that reminds you strongly of something difficult in your own life.",
        question: "What would you do?",
        followUp: "",
      },
      {
        id: "silence", title: "Silence",
        scenario: "The person you're talking to gives a short answer and then becomes quiet.",
        question: "What would you do?",
        followUp: "",
      },
    ];
    // Shuffle pool, take 7
    const shuffled = [...pool].sort(() => Math.random() - 0.5);
    return [...core, ...shuffled.slice(0, 7)];
  }, []);

  const [scenarioIndex, setScenarioIndex] = useState(0);

  // Redirect if already has application in terminal states
  if (myApplication && step === "intro") {
    if (myApplication.status === "under_review") setStep("under_review");
    else if (myApplication.status === "needs_more_info") setStep("needs_info");
    else if (myApplication.status === "approved") setStep("approved");
    else if (myApplication.status === "rejected") setStep("rejected");
    else if (myApplication.status === "submitted") setStep("under_review");
  }

  if (user?.role === "admin") {
    navigate("/admin");
    return null;
  }

  const toggleLanguage = (lang: string) => {
    setSelectedLanguages((prev) =>
      prev.includes(lang) ? prev.filter((l) => l !== lang) : [...prev, lang]
    );
  };

  const toggleTopic = (topic: string) => {
    setComfortableTopics((prev) =>
      prev.includes(topic) ? prev.filter((t) => t !== topic) : [...prev, topic]
    );
  };

  const updateAnswer = (scenarioId: string, value: string) => {
    setAnswers((prev) => ({ ...prev, [scenarioId]: value }));
  };

  const canSubmit = () => {
    if (!originalityConfirmed) return false;
    if (selectedLanguages.length === 0) return false;
    if (!whyListen.trim()) return false;
    // Check all scenario answers meet minimum length
    for (const s of scenarios) {
      const ans = answers[s.id] || "";
      if (ans.trim().length < MIN_CHARS) return false;
      if (s.followUp) {
        const followAns = answers[`${s.id}_followup`] || "";
        if (followAns.trim().length < MIN_CHARS) return false;
      }
    }
    return true;
  };

  const handleSubmit = async () => {
    if (!canSubmit()) return;
    setLoading(true);
    setError(null);
    setStep("submitting");
    try {
      await submitApp({
        anonymousName: anonymousName || undefined,
        ageRange: ageRange || undefined,
        languages: selectedLanguages,
        timezone: timezone || undefined,
        availability: availability || undefined,
        whyListen,
        previousExperience: previousExperience ?? undefined,
        experienceDescription: experienceDescription || undefined,
        comfortableTopics,
        uncomfortableTopics: uncomfortableTopics || undefined,
        answers,
        originalityConfirmed,
      });
      setStep("submitted");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to submit application");
      setStep("declaration");
    }
    setLoading(false);
  };

  // --- Render terminal states ---
  if (step === "under_review") {
    return (
      <div className="min-h-screen flex items-center justify-center px-4 py-20">
        <motion.div {...fadeUpExit} className="text-center max-w-md">
          <Clock className="w-12 h-12 text-amber-500 mx-auto mb-4" />
          <h1 className="text-3xl font-bold tracking-tight text-foreground mb-3">
            Application under review
          </h1>
          <p className="text-muted-foreground mb-8">
            We're reviewing your answers. You don't need to do anything right now.
            We'll notify you when a decision has been made.
          </p>
          <Button variant="outline" onClick={() => navigate("/")} className="rounded-2xl">
            Go home
          </Button>
        </motion.div>
      </div>
    );
  }

  if (step === "needs_info") {
    return (
      <div className="min-h-screen flex items-center justify-center px-4 py-20">
        <motion.div {...fadeUpExit} className="text-center max-w-md">
          <AlertTriangle className="w-12 h-12 text-amber-500 mx-auto mb-4" />
          <h1 className="text-3xl font-bold tracking-tight text-foreground mb-3">
            More information needed
          </h1>
          <p className="text-muted-foreground mb-4">
            An administrator has requested additional information about your application.
            Please check your email for details.
          </p>
          {myApplication?.decisionReason && (
            <div className="glass-card rounded-2xl p-4 mb-6 text-left">
              <p className="text-sm text-muted-foreground">
                {myApplication.decisionReason}
              </p>
            </div>
          )}
          <Button variant="outline" onClick={() => navigate("/")} className="rounded-2xl">
            Go home
          </Button>
        </motion.div>
      </div>
    );
  }

  if (step === "approved") {
    return (
      <div className="min-h-screen flex items-center justify-center px-4 py-20">
        <motion.div {...fadeUpExit} className="text-center max-w-md">
          <CheckCircle className="w-12 h-12 text-emerald-500 mx-auto mb-4" />
          <h1 className="text-3xl font-bold tracking-tight text-foreground mb-3">
            Application approved!
          </h1>
          <p className="text-muted-foreground mb-8">
            Congratulations! Your listener application has been approved.
            Complete the Listener Academy training to start listening.
          </p>
          <Button onClick={() => navigate("/listen")} className="rounded-2xl px-8">
            Start Training
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </motion.div>
      </div>
    );
  }

  if (step === "rejected") {
    return (
      <div className="min-h-screen flex items-center justify-center px-4 py-20">
        <motion.div {...fadeUpExit} className="text-center max-w-md">
          <h1 className="text-3xl font-bold tracking-tight text-foreground mb-3">
            Application not approved
          </h1>
          <p className="text-muted-foreground mb-4">
            Your listener application wasn't approved at this time.
            You're welcome to apply again in the future.
          </p>
          {myApplication?.decisionReason && (
            <div className="glass-card rounded-2xl p-4 mb-6 text-left">
              <p className="text-sm text-muted-foreground">
                {myApplication.decisionReason}
              </p>
            </div>
          )}
          <Button variant="outline" onClick={() => navigate("/")} className="rounded-2xl">
            Go home
          </Button>
        </motion.div>
      </div>
    );
  }

  if (step === "submitted") {
    return (
      <div className="min-h-screen flex items-center justify-center px-4 py-20">
        <motion.div {...fadeUpExit} className="text-center max-w-md">
          <CheckCircle className="w-12 h-12 text-emerald-500 mx-auto mb-4" />
          <h1 className="text-3xl font-bold tracking-tight text-foreground mb-3">
            Application submitted
          </h1>
          <p className="text-muted-foreground mb-8">
            Thank you for applying to be a SafeTalk listener. An administrator
            will review your application. You'll be notified when a decision
            has been made.
          </p>
          <Button variant="outline" onClick={() => navigate("/")} className="rounded-2xl">
            Go home
          </Button>
        </motion.div>
      </div>
    );
  }

  // --- Main form rendering ---
  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-20">
      <div className="absolute top-20 left-1/4 w-96 h-96 bg-primary/5 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-20 right-1/4 w-72 h-72 bg-emerald-500/5 rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-2xl w-full relative">
        {/* Progress bar */}
        {step !== "intro" && step !== "submitting" && (
          <div className="flex items-center gap-1 mb-8 justify-center">
            {["intro", "basic", "scenarios", "declaration"].map((s, i) => (
              <div
                key={s}
                className={`h-1.5 rounded-full transition-all ${
                  ["intro", "basic", "scenarios", "declaration"].indexOf(step) >= i
                    ? "bg-primary w-8"
                    : "bg-muted-foreground/20 w-4"
                }`}
              />
            ))}
          </div>
        )}

        <AnimatePresence mode="wait">
          {/* Step: Intro */}
          {step === "intro" && (
            <motion.div key="intro" {...fadeUpExit} className="text-center">
              <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-6">
                <Ear className="w-6 h-6 text-primary" />
              </div>
              <h1 className="text-3xl font-bold tracking-tight text-foreground mb-3">
                Become a SafeTalk Listener
              </h1>
              <p className="text-muted-foreground mb-6 max-w-lg mx-auto leading-relaxed">
                Listening is more than being available. We're looking for people
                who can offer patience, empathy, respect, and a judgment-free space.
              </p>
              <div className="glass-card rounded-2xl p-6 mb-8 text-left max-w-lg mx-auto">
                <p className="text-sm text-muted-foreground leading-relaxed mb-3">
                  This application helps us understand how you approach difficult
                  conversations. <strong className="text-foreground">There are no perfect answers.</strong> We
                  care more about your reasoning than saying what you think we want
                  to hear.
                </p>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  The application includes scenario-based questions where you'll
                  describe how you'd handle real listening situations. Please answer
                  in your own words — we're interested in how <em>you</em> think.
                </p>
              </div>
              <Button onClick={() => setStep("basic")} className="rounded-2xl px-8">
                Start application
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </motion.div>
          )}

          {/* Step: Basic Info */}
          {step === "basic" && (
            <motion.div key="basic" {...fadeUpExit}>
              <div className="text-center mb-8">
                <FileText className="w-8 h-8 text-primary mx-auto mb-4" />
                <h2 className="text-2xl font-bold tracking-tight text-foreground mb-2">
                  Basic Information
                </h2>
                <p className="text-muted-foreground text-sm">
                  We only collect what we need for the screening process.
                </p>
              </div>

              <div className="space-y-6">
                {/* Anonymous name */}
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    Preferred anonymous listener name
                  </label>
                  <Input
                    value={anonymousName}
                    onChange={(e) => setAnonymousName(e.target.value)}
                    placeholder="e.g., GentleMoon42"
                    className="glass-input rounded-xl"
                  />
                </div>

                {/* Age range */}
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    Age range
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {AGE_RANGES.map((range) => (
                      <button
                        key={range}
                        onClick={() => setAgeRange(range)}
                        className={`rounded-xl px-4 py-2 text-sm transition-all ${
                          ageRange === range
                            ? "bg-primary text-primary-foreground"
                            : "glass-card text-muted-foreground hover:text-foreground"
                        }`}
                      >
                        {range}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Languages */}
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    Languages spoken <span className="text-red-500">*</span>
                  </label>
                  <div className="flex flex-wrap gap-2">
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
                </div>

                {/* Timezone */}
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    Timezone
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {TIMEZONES.map((tz) => (
                      <button
                        key={tz}
                        onClick={() => setTimezone(tz)}
                        className={`rounded-xl px-3 py-2 text-xs transition-all ${
                          timezone === tz
                            ? "bg-primary text-primary-foreground"
                            : "glass-card text-muted-foreground hover:text-foreground"
                        }`}
                      >
                        {tz}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Availability */}
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    Approximate availability
                  </label>
                  <div className="space-y-2">
                    {AVAILABILITY_OPTIONS.map((opt) => (
                      <button
                        key={opt}
                        onClick={() => setAvailability(opt)}
                        className={`w-full text-left rounded-xl p-3 text-sm transition-all ${
                          availability === opt
                            ? "bg-primary/10 ring-2 ring-primary text-foreground"
                            : "glass-card text-muted-foreground hover:text-foreground"
                        }`}
                      >
                        {opt}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Why listen */}
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    Why do you want to become a SafeTalk listener? <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    value={whyListen}
                    onChange={(e) => setWhyListen(e.target.value)}
                    placeholder="Tell us in your own words..."
                    className="w-full rounded-xl glass-input px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary min-h-[100px]"
                  />
                </div>

                {/* Previous experience */}
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    Have you previously volunteered in a listening/support role?
                  </label>
                  <div className="flex gap-3">
                    <button
                      onClick={() => setPreviousExperience(true)}
                      className={`rounded-xl px-6 py-2 text-sm transition-all ${
                        previousExperience === true
                          ? "bg-primary text-primary-foreground"
                          : "glass-card text-muted-foreground hover:text-foreground"
                      }`}
                    >
                      Yes
                    </button>
                    <button
                      onClick={() => setPreviousExperience(false)}
                      className={`rounded-xl px-6 py-2 text-sm transition-all ${
                        previousExperience === false
                          ? "bg-primary text-primary-foreground"
                          : "glass-card text-muted-foreground hover:text-foreground"
                      }`}
                    >
                      No
                    </button>
                  </div>
                  {previousExperience === true && (
                    <textarea
                      value={experienceDescription}
                      onChange={(e) => setExperienceDescription(e.target.value)}
                      placeholder="Describe your experience..."
                      className="mt-3 w-full rounded-xl glass-input px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary min-h-[80px]"
                    />
                  )}
                </div>

                {/* Comfortable topics */}
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    What types of conversations are you comfortable listening to? <span className="text-red-500">*</span>
                  </label>
                  <div className="space-y-2">
                    {TOPICS.map((topic) => (
                      <button
                        key={topic}
                        onClick={() => toggleTopic(topic)}
                        className={`w-full text-left rounded-xl p-3 text-sm transition-all ${
                          comfortableTopics.includes(topic)
                            ? "bg-primary/10 ring-2 ring-primary text-foreground"
                            : "glass-card text-muted-foreground hover:text-foreground"
                        }`}
                      >
                        {topic}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Uncomfortable topics */}
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    What types of conversations would you prefer not to handle?
                  </label>
                  <textarea
                    value={uncomfortableTopics}
                    onChange={(e) => setUncomfortableTopics(e.target.value)}
                    placeholder="Optional — tell us your limits..."
                    className="w-full rounded-xl glass-input px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary min-h-[80px]"
                  />
                </div>
              </div>

              <div className="flex gap-3 justify-center mt-8">
                <Button variant="outline" onClick={() => setStep("intro")} className="rounded-2xl">
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Back
                </Button>
                <Button
                  onClick={() => setStep("scenarios")}
                  disabled={selectedLanguages.length === 0 || !whyListen.trim()}
                  className="rounded-2xl px-8"
                >
                  Continue to scenarios
                  <ArrowRight className="ml-2 h-4 h-4" />
                </Button>
              </div>
            </motion.div>
          )}

          {/* Step: Scenario Questions */}
          {step === "scenarios" && (
            <motion.div key="scenarios" {...fadeUpExit}>
              <div className="text-center mb-8">
                <h2 className="text-2xl font-bold tracking-tight text-foreground mb-2">
                  Scenario {scenarioIndex + 1} of {scenarios.length}
                </h2>
                <p className="text-muted-foreground text-sm">
                  Please answer in your own words. There is no perfect answer.
                </p>
                {/* Progress */}
                <div className="flex items-center justify-center gap-1 mt-4">
                  {scenarios.map((_, i) => (
                    <div
                      key={i}
                      className={`h-1.5 rounded-full transition-all ${
                        i <= scenarioIndex ? "bg-primary w-4" : "bg-muted-foreground/20 w-2"
                      }`}
                    />
                  ))}
                </div>
              </div>

              {(() => {
                const s = scenarios[scenarioIndex];
                const answer = answers[s.id] || "";
                const followAnswer = s.followUp ? answers[`${s.id}_followup`] || "" : "";
                const answerLen = answer.length;
                const followLen = followAnswer.length;
                const hasFollowUp = !!s.followUp;
                const canProceed =
                  answerLen >= MIN_CHARS && (!hasFollowUp || followLen >= MIN_CHARS);

                return (
                  <div className="space-y-6">
                    <div className="glass-card rounded-2xl p-6">
                      <h3 className="font-semibold text-foreground mb-2">{s.title}</h3>
                      {s.scenario && (
                        <p className="text-sm text-muted-foreground leading-relaxed mb-4 italic">
                          "{s.scenario}"
                        </p>
                      )}
                      <label className="block text-sm font-medium text-foreground mb-2">
                        {s.question}
                      </label>
                      <textarea
                        value={answer}
                        onChange={(e) => updateAnswer(s.id, e.target.value)}
                        placeholder="Type your answer here..."
                        className="w-full rounded-xl glass-input px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary min-h-[120px]"
                      />
                      <p className="text-xs text-muted-foreground mt-1 text-right">
                        {answerLen}/{MIN_CHARS} min characters
                      </p>
                    </div>

                    {hasFollowUp && (
                      <div className="glass-card rounded-2xl p-6">
                        <label className="block text-sm font-medium text-foreground mb-2">
                          {s.followUp}
                        </label>
                        <textarea
                          value={followAnswer}
                          onChange={(e) => updateAnswer(`${s.id}_followup`, e.target.value)}
                          placeholder="Type your answer here..."
                          className="w-full rounded-xl glass-input px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary min-h-[100px]"
                        />
                        <p className="text-xs text-muted-foreground mt-1 text-right">
                          {followLen}/{MIN_CHARS} min characters
                        </p>
                      </div>
                    )}

                    <div className="flex gap-3 justify-center">
                      <Button
                        variant="outline"
                        onClick={() =>
                          scenarioIndex > 0
                            ? setScenarioIndex((i) => i - 1)
                            : setStep("basic")
                        }
                        className="rounded-2xl"
                      >
                        <ArrowLeft className="mr-2 h-4 w-4" />
                        {scenarioIndex > 0 ? "Previous" : "Back"}
                      </Button>
                      <Button
                        onClick={() => {
                          if (scenarioIndex < scenarios.length - 1) {
                            setScenarioIndex((i) => i + 1);
                          } else {
                            setStep("declaration");
                          }
                        }}
                        disabled={!canProceed}
                        className="rounded-2xl px-8"
                      >
                        {scenarioIndex < scenarios.length - 1 ? (
                          <>
                            Next
                            <ArrowRight className="ml-2 h-4 h-4" />
                          </>
                        ) : (
                          <>
                            Continue
                            <ArrowRight className="ml-2 h-4 h-4" />
                          </>
                        )}
                      </Button>
                    </div>
                  </div>
                );
              })()}
            </motion.div>
          )}

          {/* Step: Declaration */}
          {step === "declaration" && (
            <motion.div key="declaration" {...fadeUpExit} className="text-center">
              <CheckCircle className="w-8 h-8 text-primary mx-auto mb-4" />
              <h2 className="text-2xl font-bold tracking-tight text-foreground mb-3">
                Originality Declaration
              </h2>
              <div className="glass-card rounded-2xl p-6 mb-6 text-left max-w-lg mx-auto space-y-4">
                <p className="text-sm text-muted-foreground leading-relaxed">
                  We want to hear your own thinking. Please answer these questions
                  in your own words.
                </p>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  <strong className="text-foreground">Please don't use AI tools to generate or rewrite your answers.</strong>{" "}
                  We are interested in how <em>you</em> think.
                </p>
                <label className="flex items-start gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={originalityConfirmed}
                    onChange={(e) => setOriginalityConfirmed(e.target.checked)}
                    className="w-4 h-4 rounded border-gray-300 mt-0.5"
                  />
                  <span className="text-sm text-foreground">
                    I confirm that these answers reflect my own thoughts and
                    experience and were not copied from another person's application.
                  </span>
                </label>
              </div>

              {error && (
                <div className="glass-card rounded-2xl p-4 mb-6 border-red-200 bg-red-500/5 max-w-lg mx-auto">
                  <p className="text-sm text-red-600">{error}</p>
                </div>
              )}

              <div className="flex gap-3 justify-center">
                <Button
                  variant="outline"
                  onClick={() => {
                    setStep("scenarios");
                    setScenarioIndex(scenarios.length - 1);
                  }}
                  className="rounded-2xl"
                >
                  <ArrowLeft className="mr-2 h-4 h-4" />
                  Back
                </Button>
                <Button
                  onClick={handleSubmit}
                  disabled={!canSubmit() || loading}
                  className="rounded-2xl px-8"
                >
                  {loading ? (
                    <Loader2 className="w-4 h-4 animate-spin mr-2" />
                  ) : (
                    <Send className="w-4 h-4 mr-2" />
                  )}
                  Submit application
                </Button>
              </div>
            </motion.div>
          )}

          {/* Step: Submitting */}
          {step === "submitting" && (
            <motion.div key="submitting" {...fadeUpExit} className="text-center">
              <Loader2 className="w-12 h-12 text-primary animate-spin mx-auto mb-4" />
              <h2 className="text-2xl font-bold tracking-tight text-foreground mb-2">
                Submitting your application...
              </h2>
              <p className="text-muted-foreground">
                Please wait while we process your submission.
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
