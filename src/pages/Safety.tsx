import { motion } from "framer-motion";
import { useNavigate } from "react-router";
import { Button } from "@/components/ui/button";
import { api } from "@/convex/_generated/api";
import { useQuery } from "convex/react";
import { fadeUp } from "@/lib/animations";
import {
  ArrowLeft,
  Shield,
  Phone,
  AlertTriangle,
  Heart,
  ExternalLink,
  BookOpen,
} from "lucide-react";

export default function Safety() {
  const navigate = useNavigate();
  const resources = useQuery(api.safety.getSafetyResources, {});

  return (
    <div className="min-h-screen px-4 py-8">
      <div className="absolute top-20 left-1/4 w-96 h-96 bg-primary/5 rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-3xl mx-auto relative">
        <div className="flex items-center gap-3 mb-8">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)} className="h-8 w-8">
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <h1 className="text-2xl font-bold text-foreground">Safety</h1>
        </div>

        {/* Emergency Notice */}
        <motion.div
          {...fadeUp}
          className="glass-card rounded-2xl p-8 mb-6 border-l-4 border-l-red-500"
        >
          <div className="flex items-start gap-4">
            <div className="w-10 h-10 rounded-xl bg-red-500/10 flex items-center justify-center shrink-0">
              <AlertTriangle className="w-5 h-5 text-red-600" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-foreground mb-2">
                This is not an emergency service
              </h2>
              <p className="text-sm text-muted-foreground leading-relaxed mb-4">
                Sathiii is not a substitute for professional medical or
                psychological care. If you or someone you know is in immediate
                danger, please contact emergency services right away.
              </p>
              <div className="flex flex-wrap gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="rounded-xl"
                  onClick={() => window.open("tel:911")}
                >
                  <Phone className="w-3 h-3 mr-2" />
                  Call 911
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="rounded-xl"
                  onClick={() => window.open("tel:988")}
                >
                  <Phone className="w-3 h-3 mr-2" />
                  988 Lifeline
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="rounded-xl"
                  onClick={() => window.open("https://www.crisistextline.org/", "_blank")}
                >
                  <ExternalLink className="w-3 h-3 mr-2" />
                  Crisis Text Line
                </Button>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Crisis Resources */}
        <motion.div
          {...fadeUp}
          transition={{ ...fadeUp.transition, delay: 0.1 }}
          className="glass-card rounded-2xl p-6 mb-6"
        >
          <h3 className="font-semibold text-foreground mb-4 flex items-center gap-2">
            <Phone className="w-5 h-5 text-primary" />
            Crisis Resources
          </h3>
          <div className="space-y-3">
            {[
              {
                name: "National Suicide Prevention Lifeline",
                phone: "988",
                desc: "24/7 free and confidential support",
              },
              {
                name: "Crisis Text Line",
                phone: "Text HOME to 741741",
                desc: "Free 24/7 text-based support",
              },
              {
                name: "National Domestic Violence Hotline",
                phone: "1-800-799-7233",
                desc: "24/7 confidential support",
              },
              {
                name: "SAMHSA National Helpline",
                phone: "1-800-662-4357",
                desc: "Free treatment referral service",
              },
            ].map((resource) => (
              <div key={resource.name} className="flex items-center justify-between p-3 rounded-xl glass-card">
                <div>
                  <p className="text-sm font-medium text-foreground">{resource.name}</p>
                  <p className="text-xs text-muted-foreground">{resource.desc}</p>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  className="rounded-xl shrink-0"
                  onClick={() => window.open(`tel:${resource.phone.replace(/[^0-9]/g, "")}`)}
                >
                  {resource.phone}
                </Button>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Platform Safety Info */}
        <motion.div
          {...fadeUp}
          transition={{ ...fadeUp.transition, delay: 0.2 }}
          className="glass-card rounded-2xl p-6 mb-6"
        >
          <h3 className="font-semibold text-foreground mb-4 flex items-center gap-2">
            <Shield className="w-5 h-5 text-primary" />
            Sathiii Safety Features
          </h3>
          <ul className="space-y-3 text-sm text-muted-foreground">
            <li className="flex items-start gap-3">
              <Heart className="w-4 h-4 text-primary mt-0.5 shrink-0" />
              <span>All conversations are anonymous — your real identity is never shared.</span>
            </li>
            <li className="flex items-start gap-3">
              <Heart className="w-4 h-4 text-primary mt-0.5 shrink-0" />
              <span>Listeners are vetted and trained before they can have conversations.</span>
            </li>
            <li className="flex items-start gap-3">
              <Heart className="w-4 h-4 text-primary mt-0.5 shrink-0" />
              <span>You can report, block, or end any conversation at any time.</span>
            </li>
            <li className="flex items-start gap-3">
              <Heart className="w-4 h-4 text-primary mt-0.5 shrink-0" />
              <span>Admins review reports and take action to keep the platform safe.</span>
            </li>
            <li className="flex items-start gap-3">
              <Heart className="w-4 h-4 text-primary mt-0.5 shrink-0" />
              <span>Blocked users will never be matched with you again.</span>
            </li>
          </ul>
        </motion.div>

        {/* Dynamic Resources */}
        {resources && resources.length > 0 && (
          <motion.div
            {...fadeUp}
            transition={{ ...fadeUp.transition, delay: 0.3 }}
            className="glass-card rounded-2xl p-6"
          >
            <h3 className="font-semibold text-foreground mb-4 flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-primary" />
              Additional Resources
            </h3>
            <div className="space-y-3">
              {resources.map((r) => (
                <div key={r._id} className="p-3 rounded-xl glass-card">
                  <p className="text-sm font-medium text-foreground">{r.title}</p>
                  <p className="text-xs text-muted-foreground mt-1">{r.description}</p>
                  {r.phone && (
                    <p className="text-xs text-primary mt-1">{r.phone}</p>
                  )}
                  {r.url && (
                    <a
                      href={r.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-primary hover:underline mt-1 inline-block"
                    >
                      Visit website →
                    </a>
                  )}
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}
