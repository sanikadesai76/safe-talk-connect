import { motion } from "framer-motion";
import { Navigate, useNavigate } from "react-router";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";
import { api } from "@/convex/_generated/api";
import { useQuery } from "convex/react";
import { fadeUp } from "@/lib/animations";
import {
  LogOut,
  MessageCircle,
  Search,
  History,
  Shield,
  Heart,
  ArrowRight,
  Sparkles,
} from "lucide-react";

export default function SeekerDashboard() {
  const navigate = useNavigate();
  const { user, signOut, isLoading } = useAuth();
  const activeConversation = useQuery(api.matching.getMyActiveConversation);
  const conversations = useQuery(api.matching.getMyConversations);

  const handleSignOut = async () => {
    await signOut();
    navigate("/");
  };

  // Role guard: redirect non-seekers
  if (!isLoading && user && user.role !== "seeker") {
    if (user.role === "admin") return <Navigate to="/admin" replace />;
    if (user.role === "listener") return <Navigate to="/listener-dashboard" replace />;
    return <Navigate to="/role" replace />;
  }

  // Still loading
  if (isLoading || user === undefined) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-pulse text-muted-foreground">Loading...</div>
      </div>
    );
  }

  const recentConversations =
    conversations?.filter((c) => c.myRole === "seeker").slice(0, 5) || [];
  const totalConversations = conversations?.filter((c) => c.myRole === "seeker").length || 0;

  return (
    <div className="min-h-screen px-4 py-8">
      <div className="absolute top-20 left-1/4 w-96 h-96 bg-primary/5 rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-4xl mx-auto relative">
        {/* Header */}
        <motion.div {...fadeUp} className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-8">
          <div>
            <p className="text-sm text-muted-foreground">Your dashboard</p>
            <h1 className="text-2xl font-bold text-foreground">
              Welcome, {user?.anonymousName || "there"}
            </h1>
          </div>
          <Button variant="outline" onClick={handleSignOut} className="rounded-xl">
            <LogOut className="w-4 h-4 mr-2" />
            Sign out
          </Button>
        </motion.div>

        {/* Active conversation banner */}
        {activeConversation && (
          <motion.div
            {...fadeUp}
            className="glass-card rounded-2xl p-4 sm:p-6 mb-6 border-l-4 border-l-emerald-500"
          >
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <div>
                  <p className="font-medium text-foreground">Active conversation</p>
                  <p className="text-sm text-muted-foreground">
                    You're chatting with a listener right now
                  </p>
                </div>
              </div>
              <Button
                onClick={() => navigate(`/chat/${activeConversation._id}`)}
                className="rounded-xl"
              >
                Open chat
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </div>
          </motion.div>
        )}

        {/* Find a Listener CTA */}
        {!activeConversation && (
          <motion.div
            {...fadeUp}
            transition={{ ...fadeUp.transition, delay: 0.1 }}
            className="glass-card rounded-2xl p-4 sm:p-6 mb-6"
          >
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center">
                  <Sparkles className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <p className="font-medium text-foreground">Need someone to talk to?</p>
                  <p className="text-sm text-muted-foreground">
                    Connect with an available listener — anonymously and without judgment.
                  </p>
                </div>
              </div>
              <Button onClick={() => navigate("/seek")} className="rounded-xl">
                <Search className="w-4 h-4 mr-2" />
                Find a listener
              </Button>
            </div>
          </motion.div>
        )}

        {/* Stats */}
        <motion.div
          {...fadeUp}
          transition={{ ...fadeUp.transition, delay: 0.2 }}
          className="grid grid-cols-2 gap-4 mb-6"
        >
          <div className="glass-card rounded-2xl p-4 text-center">
            <div className="text-primary mb-2 flex justify-center">
              <MessageCircle className="w-4 h-4" />
            </div>
            <p className="text-2xl font-bold text-foreground">{totalConversations}</p>
            <p className="text-xs text-muted-foreground">Conversations</p>
          </div>
          <div className="glass-card rounded-2xl p-4 text-center">
            <div className="text-primary mb-2 flex justify-center">
              <Shield className="w-4 h-4" />
            </div>
            <p className="text-2xl font-bold text-foreground">
              {user?.anonymousName ? "Set" : "Not set"}
            </p>
            <p className="text-xs text-muted-foreground">Anonymous name</p>
          </div>
        </motion.div>

        {/* Quick Actions */}
        <motion.div
          {...fadeUp}
          transition={{ ...fadeUp.transition, delay: 0.3 }}
          className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6"
        >              <Button
            variant="outline"
            onClick={() => navigate("/history")}
            className="glass-card rounded-2xl p-4 sm:p-6 h-auto justify-start"
            <History className="w-5 h-5 mr-3 text-primary" />
            <div className="text-left">
              <p className="font-medium text-foreground">History</p>
              <p className="text-xs text-muted-foreground">Past conversations</p>
            </div>
          </Button>              <Button
            variant="outline"
            onClick={() => navigate("/profile")}
            className="glass-card rounded-2xl p-4 sm:p-6 h-auto justify-start"
            <Heart className="w-5 h-5 mr-3 text-primary" />
            <div className="text-left">
              <p className="font-medium text-foreground">Profile</p>
              <p className="text-xs text-muted-foreground">Your settings</p>
            </div>
          </Button>              <Button
            variant="outline"
            onClick={() => navigate("/safety")}
            className="glass-card rounded-2xl p-4 sm:p-6 h-auto justify-start"
            <Shield className="w-5 h-5 mr-3 text-amber-600" />
            <div className="text-left">
              <p className="font-medium text-foreground">Safety</p>
              <p className="text-xs text-muted-foreground">Resources & guidelines</p>
            </div>
          </Button>
        </motion.div>

        {/* Recent Conversations */}
        <motion.div
          {...fadeUp}
          transition={{ ...fadeUp.transition, delay: 0.4 }}
          className="glass-card rounded-2xl p-6"
        >
          <h2 className="font-semibold text-foreground mb-4">Recent conversations</h2>
          {recentConversations.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">
              No conversations yet. Tap "Find a listener" to get started.
            </p>
          ) : (
            <div className="space-y-3">
              {recentConversations.map((conv) => (
                <div
                  key={conv._id}
                  className="flex items-center justify-between p-3 rounded-xl glass-card"
                >
                  <div>
                    <p className="text-sm font-medium text-foreground">
                      Conversation with listener
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(conv.createdAt).toLocaleDateString()} · {conv.status}
                    </p>
                  </div>
                  {conv.status === "active" ? (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => navigate(`/chat/${conv._id}`)}
                      className="rounded-xl"
                    >
                      Open
                    </Button>
                  ) : conv.status === "ended" ? (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => navigate(`/feedback/${conv._id}`)}
                      className="rounded-xl"
                    >
                      Feedback
                    </Button>
                  ) : null}
                </div>
              ))}
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
}
