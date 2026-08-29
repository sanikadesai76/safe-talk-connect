import { motion } from "framer-motion";
import { useNavigate } from "react-router";
import { Button } from "@/components/ui/button";
import { fadeUp } from "@/lib/animations";
import {
  ArrowLeft,
  Heart,
  Shield,
  MessageCircle,
  Ban,
  AlertTriangle,
  CheckCircle,
} from "lucide-react";

export default function Guidelines() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen px-4 py-8">
      <div className="absolute top-20 left-1/4 w-96 h-96 bg-primary/5 rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-3xl mx-auto relative">
        <div className="flex items-center gap-3 mb-8">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)} className="h-8 w-8">
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <h1 className="text-2xl font-bold text-foreground">Community Guidelines</h1>
        </div>

        <motion.div
          {...fadeUp}
          className="glass-card rounded-2xl p-8 mb-6"
        >
          <p className="text-muted-foreground leading-relaxed mb-6">
            Sathiii is a community built on trust, respect, and genuine human connection.
            These guidelines help keep the platform safe and supportive for everyone.
          </p>

          <div className="space-y-6">
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center shrink-0">
                <Heart className="w-5 h-5 text-emerald-600" />
              </div>
              <div>
                <h3 className="font-semibold text-foreground mb-1">Be kind and respectful</h3>
                <p className="text-sm text-muted-foreground">
                  Treat everyone with dignity. We all come from different backgrounds and
                  experiences. Compassion goes a long way.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center shrink-0">
                <MessageCircle className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <h3 className="font-semibold text-foreground mb-1">Listen without judgment</h3>
                <p className="text-sm text-muted-foreground">
                  People come here to be heard. Avoid criticizing, shaming, or dismissing
                  someone's feelings. Empathy is the most powerful tool.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-xl bg-amber-500/10 flex items-center justify-center shrink-0">
                <Shield className="w-5 h-5 text-amber-600" />
              </div>
              <div>
                <h3 className="font-semibold text-foreground mb-1">Respect anonymity</h3>
                <p className="text-sm text-muted-foreground">
                  Never ask for or share personal identifying information. The anonymous system
                  exists to protect everyone's privacy and safety.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-xl bg-purple-500/10 flex items-center justify-center shrink-0">
                <Ban className="w-5 h-5 text-purple-600" />
              </div>
              <div>
                <h3 className="font-semibold text-foreground mb-1">No romantic or sexual behavior</h3>
                <p className="text-sm text-muted-foreground">
                  Sathiii is strictly platonic. Do not make romantic advances, flirt, or share
                  sexual content. This is grounds for immediate removal.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-xl bg-red-500/10 flex items-center justify-center shrink-0">
                <AlertTriangle className="w-5 h-5 text-red-600" />
              </div>
              <div>
                <h3 className="font-semibold text-foreground mb-1">Report concerns</h3>
                <p className="text-sm text-muted-foreground">
                  If you encounter harassment, manipulation, or any harmful behavior, use the
                  report button. Reports are reviewed by administrators.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center shrink-0">
                <CheckCircle className="w-5 h-5 text-emerald-600" />
              </div>
              <div>
                <h3 className="font-semibold text-foreground mb-1">Know when to step back</h3>
                <p className="text-sm text-muted-foreground">
                  If a conversation becomes overwhelming, it's okay to end it. Your well-being
                  matters too. Use the safety resources if you need professional support.
                </p>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
