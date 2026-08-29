import { motion } from "framer-motion";
import { useNavigate } from "react-router";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Shield } from "lucide-react";

export default function Terms() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen px-4 py-8">
      <div className="absolute top-20 left-1/4 w-96 h-96 bg-primary/5 rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-3xl mx-auto relative">
        <div className="flex items-center gap-3 mb-8">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)} className="h-8 w-8">
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <h1 className="text-2xl font-bold text-foreground">Terms of Service</h1>
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
              <h2 className="text-lg font-semibold text-foreground mb-2">1. Acceptance of Terms</h2>
              <p className="text-sm leading-relaxed">
                By accessing or using Sathiii, you agree to be bound by these Terms of Service.
                If you do not agree, please do not use the platform.
              </p>
            </div>

            <div>
              <h2 className="text-lg font-semibold text-foreground mb-2">2. Platform Purpose</h2>
              <p className="text-sm leading-relaxed">
                Sathiii is a peer-listening platform for anonymous emotional support. It is NOT a
                medical service, therapy service, dating platform, or emergency service. By using
                this platform, you acknowledge this distinction.
              </p>
            </div>

            <div>
              <h2 className="text-lg font-semibold text-foreground mb-2">3. User Conduct</h2>
              <p className="text-sm leading-relaxed">
                Users must not harass, manipulate, solicit money, make romantic advances, or
                engage in any harmful behavior. Violations may result in account suspension or
                banning.
              </p>
            </div>

            <div>
              <h2 className="text-lg font-semibold text-foreground mb-2">4. No Warranty</h2>
              <p className="text-sm leading-relaxed">
                Sathiii is provided "as is" without warranties. We do not guarantee that the
                platform will be available at all times or that conversations will be free of
                disruption.
              </p>
            </div>

            <div>
              <h2 className="text-lg font-semibold text-foreground mb-2">5. Limitation of Liability</h2>
              <p className="text-sm leading-relaxed">
                Sathiii and its operators are not liable for any damages arising from the use of
                the platform. Users are responsible for their own safety and well-being.
              </p>
            </div>

            <p className="text-xs text-amber-600 italic">
              These terms are a placeholder and should be reviewed by a legal professional
              before the platform goes live.
            </p>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
