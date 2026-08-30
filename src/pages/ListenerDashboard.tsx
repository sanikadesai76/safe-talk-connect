import { motion } from "framer-motion";
import { Navigate, useNavigate } from "react-router";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";
import { api } from "@/convex/_generated/api";
import { useMutation, useQuery } from "convex/react";
import { fadeUp } from "@/lib/animations";
import {
  LogOut,
  Clock,
  MessageCircle,
  Star,
  BookOpen,
  Shield,
  ToggleLeft,
  ToggleRight,
  ArrowRight,
  History,
  Heart,
} from "lucide-react";

export default function ListenerDashboard() {
  const navigate = useNavigate();
  const { user, signOut, isLoading } = useAuth();
  const profile = useQuery(api.listeners.getMyProfile);
  const toggleAvailability = useMutation(api.listeners.toggleAvailability);
  const activeConversation = useQuery(api.matching.getMyActiveConversation);
  const conversations = useQuery(api.matching.getMyConversations);

  const handleSignOut = async () => {
    await signOut();
    navigate("/");
  };

  const handleToggleAvailability = async () => {
    if (!profile) return;
    try {
      await toggleAvailability({
        available: profile.availability !== "available",
      });
    } catch (err) {
      console.error(err);
    }
  };

  // Role guard: redirect non-listeners
  if (!isLoading && user && user.role !== "listener") {
    return <Navigate to="/seek" replace />;
  }

  // Still loading
  if (isLoading || (user?.role === "listener" && profile === undefined)) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-pulse text-muted-foreground">Loading...</div>
      </div>
    );
  }

  if (profile?.approvalStatus === "pending") {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <motion.div {...fadeUp} className="text-center max-w-md">
          <Clock className="w-12 h-12 text-amber-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-foreground mb-3">
            Waiting for approval
          </h1>
          <p className="text-muted-foreground mb-6">
            Your listener application is being reviewed. You'll be notified when
            approved.
          </p>
          <Button variant="outline" onClick={() => navigate("/")}>
            Go home
          </Button>
        </motion.div>
      </div>
    );
  }

  if (profile?.approvalStatus === "rejected") {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <motion.div {...fadeUp} className="text-center max-w-md">
          <h1 className="text-2xl font-bold text-foreground mb-3">
            Application not approved
          </h1>
          <p className="text-muted-foreground mb-6">
            Unfortunately, your listener application was not approved at this
            time. Please contact support for more information.
          </p>
          <Button variant="outline" onClick={() => navigate("/")}>
            Go home
          </Button>
        </motion.div>
      </div>
    );
  }

  if (profile?.approvalStatus === "suspended") {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <motion.div {...fadeUp} className="text-center max-w-md">
          <h1 className="text-2xl font-bold text-foreground mb-3">
            Account suspended
          </h1>
          <p className="text-muted-foreground mb-6">
            Your listener account has been suspended. Please contact an
            administrator for assistance.
          </p>
          <Button variant="outline" onClick={() => navigate("/")}>
            Go home
          </Button>
        </motion.div>
      </div>
    );
  }

  const isAvailable = profile?.availability === "available";
  const recentConversations =
    conversations?.filter((c) => c.myRole === "listener").slice(0, 5) || [];
  const avgRating = profile?.avgRating != null ? profile.avgRating.toFixed(1) : "—";

  return (
    <div className="min-h-screen px-4 py-8">
      <div className="absolute top-20 left-1/4 w-96 h-96 bg-primary/5 rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-4xl mx-auto relative">
        {/* Header */}
        <motion.div {...fadeUp} className="flex items-center justify-between mb-8">
          <div>
            <p className="text-sm text-muted-foreground">Listener dashboard</p>
            <h1 className="text-2xl font-bold text-foreground">
              Welcome, {user?.anonymousName || "Listener"}
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
            className="glass-card rounded-2xl p-6 mb-6 border-l-4 border-l-emerald-500"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <div>
                  <p className="font-medium text-foreground">Active conversation</p>
                  <p className="text-sm text-muted-foreground">
                    Chatting with {activeConversation.seekerAnonymousName}
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

        {/* Availability Toggle */}
        <motion.div
          {...fadeUp}
          transition={{ ...fadeUp.transition, delay: 0.1 }}
          className="glass-card rounded-2xl p-6 mb-6"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                isAvailable ? "bg-emerald-500/10" : "bg-muted"
              }`}>
                {isAvailable ? (
                  <ToggleRight className="w-5 h-5 text-emerald-600" />
                ) : (
                  <ToggleLeft className="w-5 h-5 text-muted-foreground" />
                )}
              </div>
              <div>
                <p className="font-medium text-foreground">
                  {isAvailable ? "Available to listen" : "Currently unavailable"}
                </p>
                <p className="text-sm text-muted-foreground">
                  {isAvailable
                    ? "You can receive new conversations"
                    : "Turn on to receive conversations"}
                </p>
              </div>
            </div>
            <Button
              onClick={handleToggleAvailability}
              variant={isAvailable ? "outline" : "default"}
              className="rounded-xl"
            >
              {isAvailable ? "Go offline" : "Go online"}
            </Button>
          </div>
        </motion.div>

        {/* Stats Grid */}
        <motion.div
          {...fadeUp}
          transition={{ ...fadeUp.transition, delay: 0.2 }}
          className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6"
        >
          {[
            {
              label: "Status",
              value: profile?.approvalStatus || "—",
              icon: <Shield className="w-4 h-4" />,
            },
            {
              label: "Conversations",
              value: profile?.totalConversations || 0,
              icon: <MessageCircle className="w-4 h-4" />,
            },
            {
              label: "Rating",
              value: avgRating,
              icon: <Star className="w-4 h-4" />,
            },
            {
              label: "Training",
              value: profile?.trainingCompleted ? "Complete" : "Pending",
              icon: <BookOpen className="w-4 h-4" />,
            },
          ].map((stat) => (
            <div key={stat.label} className="glass-card rounded-2xl p-4 text-center">
              <div className="text-primary mb-2 flex justify-center">{stat.icon}</div>
              <p className="text-2xl font-bold text-foreground">{stat.value}</p>
              <p className="text-xs text-muted-foreground">{stat.label}</p>
            </div>
          ))}
        </motion.div>

        {/* Quick Actions */}
        <motion.div
          {...fadeUp}
          transition={{ ...fadeUp.transition, delay: 0.3 }}
          className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6"
        >
          <Button
            variant="outline"
            onClick={() => navigate("/history")}
            className="glass-card rounded-2xl p-6 h-auto justify-start"
          >
            <History className="w-5 h-5 mr-3 text-primary" />
            <div className="text-left">
              <p className="font-medium text-foreground">History</p>
              <p className="text-xs text-muted-foreground">Past conversations</p>
            </div>
          </Button>
          <Button
            variant="outline"
            onClick={() => navigate("/profile")}
            className="glass-card rounded-2xl p-6 h-auto justify-start"
          >
            <Heart className="w-5 h-5 mr-3 text-primary" />
            <div className="text-left">
              <p className="font-medium text-foreground">Profile</p>
              <p className="text-xs text-muted-foreground">Your settings</p>
            </div>
          </Button>
          <Button
            variant="outline"
            onClick={() => navigate("/safety")}
            className="glass-card rounded-2xl p-6 h-auto justify-start"
          >
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
              No conversations yet. Turn on availability to start receiving them.
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
                      {conv.seekerAnonymousName}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(conv.createdAt).toLocaleDateString()} · {conv.status}
                    </p>
                  </div>
                  {conv.status === "active" && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => navigate(`/chat/${conv._id}`)}
                      className="rounded-xl"
                    >
                      Open
                    </Button>
                  )}
                </div>
              ))}
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
}
