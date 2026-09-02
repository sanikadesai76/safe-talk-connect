import { motion } from "framer-motion";
import { useNavigate } from "react-router";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";
import { fadeUp, stagger } from "@/lib/animations";
import {
  Heart,
  Shield,
  MessageCircle,
  Users,
  AlertTriangle,
  Ear,
  HandHeart,
  Lock,
  ArrowRight,
  Sparkles,
  CheckCircle,
  XCircle,
  Phone,
} from "lucide-react";

function GlassNav() {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();

  return (
    <motion.nav
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="fixed top-0 left-0 right-0 z-50"
    >
      <div className="mx-auto max-w-6xl px-4 pt-4">
        <div className="glass-strong rounded-2xl px-4 sm:px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-primary/10 flex items-center justify-center">
              <HandHeart className="w-4 h-4 text-primary" />
            </div>
            <span className="text-lg font-semibold tracking-tight text-foreground">
              Sathiii
            </span>
          </div>
          <div className="flex items-center gap-1.5 sm:gap-3">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate("/safety")}
              className="text-muted-foreground hover:text-foreground hidden sm:inline-flex"
            >
              Safety
            </Button>
            {isAuthenticated ? (
              <Button
                size="sm"
                onClick={() => navigate("/dashboard")}
                className="rounded-xl"
              >
                Dashboard
              </Button>
            ) : (
              <>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => navigate("/auth")}
                  className="text-muted-foreground hover:text-foreground hidden sm:inline-flex"
                >
                  Log in
                </Button>
                <Button
                  size="sm"
                  onClick={() => navigate("/auth")}
                  className="rounded-xl"
                >
                  Get started
                </Button>
              </>
            )}
          </div>
        </div>
      </div>
    </motion.nav>
  );
}

export default function Landing() {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();

  return (
    <div className="min-h-screen relative overflow-hidden">
      <GlassNav />

      {/* Hero Section */}
      <section className="relative pt-28 sm:pt-32 pb-14 sm:pb-20 px-4">
        {/* Decorative blurred orbs */}
        <div className="absolute top-20 left-1/4 w-96 h-96 bg-primary/5 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute top-40 right-1/4 w-72 h-72 bg-blue-400/5 rounded-full blur-3xl pointer-events-none" />

        <div className="max-w-4xl mx-auto text-center relative">
          <motion.div {...fadeUp} className="mb-6 inline-flex items-center gap-2 glass-card rounded-full px-4 py-2 text-sm text-muted-foreground">
            <Shield className="w-4 h-4 text-primary" />
            <span>A safe space for honest conversations</span>
          </motion.div>

          <motion.h1
            {...fadeUp}
            transition={{ ...fadeUp.transition, delay: 0.1 }}
            className="text-4xl sm:text-5xl md:text-7xl font-bold tracking-tight text-foreground leading-[1.1]"
          >
            A safe place
            <br />
            <span className="text-primary">to talk.</span>
          </motion.h1>

          <motion.p
            {...fadeUp}
            transition={{ ...fadeUp.transition, delay: 0.2 }}
            className="mt-5 sm:mt-6 text-base sm:text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed"
          >
            When you have no one to turn to, Sathiii connects you with a real
            listener — anonymously, without judgment or pressure.
          </motion.p>

          <motion.div
            {...fadeUp}
            transition={{ ...fadeUp.transition, delay: 0.3 }}
            className="mt-8 sm:mt-10 flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center"
          >
            <Button
              size="lg"
              onClick={() =>
                navigate(isAuthenticated ? "/seek" : "/auth?returnTo=/seek")
              }
              className="rounded-2xl px-6 sm:px-8 py-5 sm:py-6 text-sm sm:text-base font-medium shadow-lg shadow-primary/10"
            >
              <MessageCircle className="mr-2 h-5 w-5" />
              I need someone to talk to
            </Button>
            <Button
              size="lg"
              variant="outline"
              onClick={() =>
                navigate(isAuthenticated ? "/listen" : "/auth?returnTo=/listen")
              }
              className="rounded-2xl px-6 sm:px-8 py-5 sm:py-6 text-sm sm:text-base font-medium glass-card"
            >
              <Ear className="mr-2 h-5 w-5" />
              I want to listen
            </Button>
          </motion.div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-20 px-4">
        <div className="max-w-5xl mx-auto">
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="text-center mb-14"
          >
            <h2 className="text-3xl md:text-4xl font-bold tracking-tight text-foreground">
              How it works
            </h2>
            <p className="mt-3 text-muted-foreground text-lg">
              Four simple steps to feel heard
            </p>
          </motion.div>

          <motion.div
            variants={stagger}
            initial="initial"
            whileInView="animate"
            viewport={{ once: true }}
            className="grid grid-cols-1 md:grid-cols-4 gap-6"
          >
            {[
              {
                icon: <MessageCircle className="w-5 h-5" />,
                title: "Tell us what you need",
                desc: "Choose what kind of support would help right now.",
                step: "1",
              },
              {
                icon: <Users className="w-5 h-5" />,
                title: "Get matched",
                desc: "We'll connect you with an available listener.",
                step: "2",
              },
              {
                icon:              <Heart className="w-5 h-5" />,
                title: "Talk freely",
                desc: "Have a private, judgment-free conversation.",
                step: "3",
              },
              {
                icon:              <Sparkles className="w-5 h-5" />,
                title: "Share feedback",
                desc: "Let us know how it went so we can keep improving.",
                step: "4",
              },
            ].map((item, i) => (
              <motion.div
                key={item.step}
                variants={fadeUp}
                className="glass-card rounded-2xl p-6 text-center relative group hover:shadow-lg hover:shadow-primary/5 transition-shadow"
              >
                <div className="absolute -top-3 -left-1 w-8 h-8 rounded-full bg-primary text-primary-foreground text-sm font-bold flex items-center justify-center">
                  {item.step}
                </div>
                <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-4 text-primary group-hover:bg-primary/15 transition-colors">
                  {item.icon}
                </div>
                <h3 className="font-semibold text-foreground mb-2">{item.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {item.desc}
                </p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* What Sathiii Is / Is Not */}
      <section className="py-14 sm:py-20 px-4">
        <div className="max-w-5xl mx-auto">
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="text-center mb-14"
          >
            <h2 className="text-3xl md:text-4xl font-bold tracking-tight text-foreground">
              What Sathiii is
            </h2>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* What Sathiii IS */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="glass-card rounded-2xl p-5 sm:p-8"
            >
              <h3 className="text-base sm:text-lg font-semibold text-foreground mb-4 sm:mb-6 flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-emerald-500" />
                What Sathiii is
              </h3>
              <ul className="space-y-3 sm:space-y-4">
                {[
                  "Human connection with a real person",
                  "Anonymous conversations",
                  "Non-judgmental listening",
                  "Non-romantic and safe",
                  "Focused on your well-being",
                ].map((item) => (
                  <li key={item} className="flex items-start gap-3">
                    <CheckCircle className="w-4 h-4 text-emerald-500 mt-0.5 shrink-0" />
                    <span className="text-sm text-foreground">{item}</span>
                  </li>
                ))}
              </ul>
            </motion.div>

            {/* What Sathiii is NOT */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="glass-card rounded-2xl p-5 sm:p-8"
            >
              <h3 className="text-base sm:text-lg font-semibold text-foreground mb-4 sm:mb-6 flex items-center gap-2">
                <XCircle className="w-5 h-5 text-red-400" />
                What Sathiii is NOT
              </h3>
              <ul className="space-y-3 sm:space-y-4">
                {[
                  "Emergency medical care",
                  "Professional psychotherapy",
                  "A dating platform",
                  "A diagnosis tool",
                  "AI pretending to be human",
                ].map((item) => (
                  <li key={item} className="flex items-start gap-3">
                    <XCircle className="w-4 h-4 text-red-400 mt-0.5 shrink-0" />
                    <span className="text-sm text-foreground">{item}</span>
                  </li>
                ))}
              </ul>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Safety Disclaimer */}
      <section className="py-12 sm:py-16 px-4">
        <div className="max-w-3xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="glass-card rounded-2xl p-5 sm:p-8 text-center border-amber-200/50"
          >
            <div className="w-12 h-12 rounded-2xl bg-amber-500/10 flex items-center justify-center mx-auto mb-4">
              <AlertTriangle className="w-6 h-6 text-amber-600" />
            </div>
            <h3 className="text-lg font-semibold text-foreground mb-3">
              Important Safety Notice
            </h3>
            <p className="text-sm text-muted-foreground leading-relaxed mb-4">
              Sathiii is <strong>not</strong> an emergency service and is{" "}
              <strong>not</strong> a substitute for professional medical or
              psychological care. If you or someone you know is in immediate
              danger, please contact your local emergency services or crisis
              hotline immediately.
            </p>
            <div className="flex flex-wrap gap-3 justify-center">
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigate("/safety")}
                className="rounded-xl"
              >
                <Phone className="mr-2 h-4 w-4" />
                View crisis resources
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate("/safety")}
                className="text-muted-foreground"
              >
                Safety page
              </Button>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Features */}
      <section className="py-14 sm:py-20 px-4">
        <div className="max-w-5xl mx-auto">
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="text-center mb-10 sm:mb-14"
          >
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold tracking-tight text-foreground">
              Built with safety in mind
            </h2>
          </motion.div>

          <motion.div
            variants={stagger}
            initial="initial"
            whileInView="animate"
            viewport={{ once: true }}
            className="grid grid-cols-1 md:grid-cols-3 gap-6"
          >
            {[
              {
                icon: <Lock className="w-5 h-5" />,
                title: "Private & anonymous",
                desc: "Your real identity is never shared. You choose an anonymous name for each conversation.",
              },
              {
                icon: <Shield className="w-5 h-5" />,
                title: "Vetted listeners",
                desc: "Every listener goes through training and approval before they can have conversations.",
              },
              {
                icon: <HandHeart className="w-5 h-5" />,
                title: "Human, not AI",
                desc: "You talk to a real person, not a chatbot. Genuine human connection, not artificial empathy.",
              },
            ].map((item) => (
              <motion.div
                key={item.title}
                variants={fadeUp}
                className="glass-card rounded-2xl p-5 sm:p-6 group hover:shadow-lg hover:shadow-primary/5 transition-shadow"
              >
                <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center mb-4 text-primary group-hover:bg-primary/15 transition-colors">
                  {item.icon}
                </div>
                <h3 className="font-semibold text-foreground mb-2">{item.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {item.desc}
                </p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-14 sm:py-20 px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="max-w-3xl mx-auto glass-strong rounded-3xl p-6 sm:p-10 text-center"
        >
          <h2 className="text-3xl font-bold tracking-tight text-foreground mb-4">
            Ready to feel heard?
          </h2>
          <p className="text-muted-foreground mb-8 max-w-lg mx-auto">
            You don't have to have everything figured out. Sometimes you just
            need someone to listen.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button
              size="lg"
              onClick={() =>
                navigate(isAuthenticated ? "/seek" : "/auth?returnTo=/seek")
              }
              className="rounded-2xl px-8 py-6 text-base font-medium"
            >
              Start talking
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
          </div>
        </motion.div>
      </section>

      {/* Footer */}
      <footer className="py-10 px-4 border-t border-border/50">
        <div className="max-w-5xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">              <HandHeart className="w-4 h-4" />
            <span>Sathiii</span>
          </div>
          <div className="flex items-center gap-4 sm:gap-6 text-sm text-muted-foreground flex-wrap justify-center">
            <button
              onClick={() => navigate("/privacy")}
              className="hover:text-foreground transition-colors"
            >
              Privacy
            </button>
            <button
              onClick={() => navigate("/terms")}
              className="hover:text-foreground transition-colors"
            >
              Terms
            </button>
            <button
              onClick={() => navigate("/safety")}
              className="hover:text-foreground transition-colors"
            >
              Safety
            </button>
            <button
              onClick={() => navigate("/guidelines")}
              className="hover:text-foreground transition-colors"
            >
              Guidelines
            </button>
          </div>
        </div>
      </footer>
    </div>
  );
}
