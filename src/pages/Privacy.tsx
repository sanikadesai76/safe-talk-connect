import { motion } from "framer-motion";
import { useNavigate } from "react-router";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Shield } from "lucide-react";

export default function Privacy() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen px-4 py-8">
      <div className="absolute top-20 left-1/4 w-96 h-96 bg-primary/5 rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-3xl mx-auto relative">
        <div className="flex items-center gap-3 mb-8">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)} className="h-8 w-8">
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <h1 className="text-2xl font-bold text-foreground">Privacy Policy</h1>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass-card rounded-2xl p-8 mb-6"
        >
          <div className="inline-flex items-center gap-2 text-xs text-amber-600 bg-amber-500/10 rounded-full px-3 py-1 mb-6">
            <Shield className="w-3 h-3" />
            Placeholder — for professional/legal review
          </div>

          <div className="prose prose-sm max-w-none text-muted-foreground space-y-6">
            <div>
              <h2 className="text-lg font-semibold text-foreground mb-2">1. Information We Collect</h2>
              <p className="text-sm leading-relaxed">
                SafeTalk collects minimal personal information. We collect your email address for
                authentication purposes only. We do not collect your real name, address, phone
                number, or other personally identifiable information unless you choose to provide it.
              </p>
            </div>

            <div>
              <h2 className="text-lg font-semibold text-foreground mb-2">2. How We Use Your Information</h2>
              <p className="text-sm leading-relaxed">
                Your email is used solely for authentication and account management. Conversation
                content is stored to enable real-time messaging and is accessible only to conversation
                participants and administrators for safety purposes.
              </p>
            </div>

            <div>
              <h2 className="text-lg font-semibold text-foreground mb-2">3. Anonymous Identity</h2>
              <p className="text-sm leading-relaxed">
                When you enter a conversation, you are assigned an anonymous display name. Your real
                identity is never shared with conversation partners. Other users cannot see your email,
                real name, or any personally identifying information.
              </p>
            </div>

            <div>
              <h2 className="text-lg font-semibold text-foreground mb-2">4. Data Sharing</h2>
              <p className="text-sm leading-relaxed">
                We do not sell, trade, or share your personal information with third parties for
                marketing purposes. Conversation data may be reviewed by administrators for safety
                and moderation purposes only.
              </p>
            </div>

            <div>
              <h2 className="text-lg font-semibold text-foreground mb-2">5. Data Security</h2>
              <p className="text-sm leading-relaxed">
                We implement appropriate security measures to protect your personal information.
                However, no method of transmission over the Internet is 100% secure.
              </p>
            </div>

            <div>
              <h2 className="text-lg font-semibold text-foreground mb-2">6. Contact</h2>
              <p className="text-sm leading-relaxed">
                For privacy-related questions, please contact us through the platform.
              </p>
            </div>

            <p className="text-xs text-amber-600 italic">
              This privacy policy is a placeholder and should be reviewed by a legal professional
              before the platform goes live.
            </p>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
