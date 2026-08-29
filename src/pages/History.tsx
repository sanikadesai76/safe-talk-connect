import { motion } from "framer-motion";
import { useNavigate } from "react-router";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";
import { api } from "@/convex/_generated/api";
import { useQuery } from "convex/react";
import {
  ArrowLeft,
  MessageCircle,
  Clock,
  CheckCircle,
  AlertTriangle,
} from "lucide-react";

export default function History() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const conversations = useQuery(api.matching.getMyConversations);

  const statusColor = (status: string) => {
    switch (status) {
      case "active":
        return "bg-emerald-500";
      case "ended":
        return "bg-muted-foreground/40";
      case "reported":
        return "bg-red-500";
      default:
        return "bg-muted-foreground/30";
    }
  };

  return (
    <div className="min-h-screen px-4 py-8">
      <div className="absolute top-20 left-1/4 w-96 h-96 bg-primary/5 rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-3xl mx-auto relative">
        <div className="flex items-center gap-3 mb-8">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)} className="h-8 w-8">
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <h1 className="text-2xl font-bold text-foreground">Conversation History</h1>
        </div>

        {!conversations ? (
          <div className="text-center py-12">
            <Clock className="w-8 h-8 animate-spin text-muted-foreground mx-auto" />
          </div>
        ) : conversations.length === 0 ? (
          <div className="glass-card rounded-2xl p-12 text-center">
            <MessageCircle className="w-12 h-12 text-muted-foreground/30 mx-auto mb-4" />
            <p className="text-muted-foreground">
              No conversations yet. Start by finding a listener.
            </p>
            <Button
              onClick={() =>
                user?.role === "listener"
                  ? navigate("/listener-dashboard")
                  : navigate("/seek")
              }
              className="mt-4 rounded-xl"
            >
              Find a listener
            </Button>
          </div>
        ) : (
          <div className="space-y-3">
            {conversations.map((conv, i) => (
              <motion.div
                key={conv._id}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                className="glass-card rounded-2xl p-5"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`w-2 h-2 rounded-full ${statusColor(conv.status)}`} />
                    <div>
                      <p className="text-sm font-medium text-foreground">
                        {conv.myRole === "seeker"
                          ? conv.listenerAnonymousName || "Listener"
                          : conv.seekerAnonymousName}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(conv.createdAt).toLocaleDateString()} ·{" "}
                        {conv.status}
                        {conv.endedBy && ` · ended by ${conv.endedBy}`}
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    {conv.status === "active" && (
                      <Button
                        size="sm"
                        onClick={() => navigate(`/chat/${conv._id}`)}
                        className="rounded-xl"
                      >
                        Open
                      </Button>
                    )}
                    {conv.status === "ended" && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => navigate(`/feedback/${conv._id}`)}
                        className="rounded-xl"
                      >
                        Feedback
                      </Button>
                    )}
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
