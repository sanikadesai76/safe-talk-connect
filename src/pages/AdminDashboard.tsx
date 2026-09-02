import { motion } from "framer-motion";
import { Navigate, useNavigate } from "react-router";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";
import { api } from "@/convex/_generated/api";
import { useMutation, useQuery } from "convex/react";
import { useState, useEffect } from "react";
import {
  LogOut,
  Users,
  Ear,
  MessageCircle,
  AlertTriangle,
  Star,
  Clock,
  CheckCircle,
  XCircle,
  Eye,
  Search,
  Settings,
  FileText,
  ChevronDown,
  ChevronUp,
  Loader2,
} from "lucide-react";

type Tab = "overview" | "users" | "listeners" | "reports" | "applications";

export default function AdminDashboard() {
  const navigate = useNavigate();
  const { user, signOut, isLoading } = useAuth();

  // Determine whether to fire admin queries.
  // All hooks must be called unconditionally (Rules of Hooks).
  // Convex useQuery accepts "skip" to avoid firing.
  const isAdmin = !isLoading && user?.role === "admin";

  // --- All hooks called unconditionally ---
  const metrics = useQuery(api.admin.getDashboardMetrics, isAdmin ? {} : "skip");
  const allUsers = useQuery(api.users.getAllUsers, isAdmin ? {} : "skip");
  const pendingListeners = useQuery(api.listeners.getPendingListeners, isAdmin ? {} : "skip");
  const allListeners = useQuery(api.listeners.getAllListeners, isAdmin ? {} : "skip");
  const reports = useQuery(api.admin.getRecentReports, isAdmin ? {} : "skip");
  const approveListener = useMutation(api.listeners.approveListener);
  const rejectListener = useMutation(api.listeners.rejectListener);
  const suspendListener = useMutation(api.listeners.suspendListener);
  const suspendUserMutation = useMutation(api.users.suspendUser);
  const reactivateUser = useMutation(api.users.reactivateUser);
  const banUser = useMutation(api.users.banUser);
  const updateReportStatus = useMutation(api.reports.updateReportStatus);
  const seedResources = useMutation(api.seed.seedSafetyResources);
  const clearAllData = useMutation(api.seed.clearAllData);
  const allApplications = useQuery(api.listenerApplications.getAllApplications, isAdmin ? {} : "skip");
  const updateAppStatus = useMutation(api.listenerApplications.updateApplicationStatus);
  const updateAppNotes = useMutation(api.listenerApplications.updateApplicationNotes);

  const [tab, setTab] = useState<Tab>("overview");
  const [seeding, setSeeding] = useState(false);
  const [clearing, setClearing] = useState(false);
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedAppId, setSelectedAppId] = useState<string | null>(null);
  const [reviewNote, setReviewNote] = useState("");
  const [reviewScores, setReviewScores] = useState<Record<string, number>>({});

  const handleSignOut = async () => {
    await signOut();
    navigate("/");
  };

  // --- Early returns AFTER all hooks (Rules of Hooks satisfied) ---

  // Still loading auth
  if (isLoading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-pulse text-muted-foreground">Loading...</div>
      </div>
    );
  }

  // Non-admins get redirected
  if (user.role !== "admin") {
    return <Navigate to="/" replace />;
  }

  const filteredUsers = allUsers?.filter(
    (u) =>
      u.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.anonymousName?.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  return (
    <div className="min-h-screen px-4 py-8">
      <div className="absolute top-20 left-1/4 w-96 h-96 bg-primary/5 rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-6xl mx-auto relative">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-8">
          <div>
            <p className="text-sm text-muted-foreground">Admin dashboard</p>
            <h1 className="text-2xl font-bold text-foreground">
              Sathiii Administration
            </h1>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={() => navigate("/safety-resources")} className="rounded-xl">
              <Settings className="w-4 h-4 mr-2" />
              Resources
            </Button>
            <Button variant="outline" onClick={handleSignOut} className="rounded-xl">
              <LogOut className="w-4 h-4 mr-2" />
              Sign out
            </Button>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 mb-8 glass-card rounded-xl p-1 w-fit overflow-x-auto max-w-full">
          {(
            [
              { id: "overview", label: "Overview", icon: <Eye className="w-4 h-4" /> },
              { id: "users", label: "Users", icon: <Users className="w-4 h-4" /> },
              { id: "listeners", label: "Listeners", icon: <Ear className="w-4 h-4" /> },
              { id: "reports", label: "Reports", icon: <AlertTriangle className="w-4 h-4" /> },
              { id: "applications", label: "Applications", icon: <FileText className="w-4 h-4" /> },
            ] as const
          ).map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2 rounded-lg text-xs sm:text-sm transition-all whitespace-nowrap ${
                tab === t.id
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {t.icon}
              {t.label}
              {t.id === "reports" && metrics?.pendingReports ? (
                <span className="bg-red-500 text-white text-xs rounded-full px-1.5 py-0.5">
                  {metrics.pendingReports}
                </span>
              ) : null}
              {t.id === "listeners" && pendingListeners?.length ? (
                <span className="bg-amber-500 text-white text-xs rounded-full px-1.5 py-0.5">
                  {pendingListeners.length}
                </span>
              ) : null}
              {t.id === "applications" && allApplications?.filter((a) => a.status === "submitted").length ? (
                <span className="bg-amber-500 text-white text-xs rounded-full px-1.5 py-0.5">
                  {allApplications.filter((a) => a.status === "submitted").length}
                </span>
              ) : null}
            </button>
          ))}
        </div>

        {/* Overview Tab */}
        {tab === "overview" && (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
          >
            <div className="flex flex-wrap gap-3">
              <Button
                variant="outline"
                size="sm"
                className="rounded-xl"
                disabled={seeding}
                onClick={async () => {
                  setSeeding(true);
                  try { await seedResources(); } catch (e) { console.error(e); }
                  setSeeding(false);
                }}
              >
                {seeding ? "Seeding..." : "Seed Safety Resources"}
              </Button>
              {!showClearConfirm ? (
                <Button
                  variant="outline"
                  size="sm"
                  className="rounded-xl text-red-600 border-red-200 hover:bg-red-50 hover:text-red-700"
                  disabled={clearing}
                  onClick={() => setShowClearConfirm(true)}
                >
                  Clear All Data
                </Button>
              ) : (
                <div className="flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 p-2">
                  <span className="text-sm text-red-700 font-medium px-2">Delete everything?</span>
                  <Button
                    size="sm"
                    className="rounded-lg bg-red-600 text-white hover:bg-red-700"
                    disabled={clearing}
                    onClick={async () => {
                      setClearing(true);
                      try {
                        const result = await clearAllData();
                        console.log("Cleared:", result);
                        window.location.reload();
                      } catch (e) {
                        console.error(e);
                        setClearing(false);
                        setShowClearConfirm(false);
                      }
                    }}
                  >
                    {clearing ? "Clearing..." : "Yes, clear all"}
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="rounded-lg"
                    disabled={clearing}
                    onClick={() => setShowClearConfirm(false)}
                  >
                    Cancel
                  </Button>
                </div>
              )}
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
                { label: "Total Users", value: metrics?.totalUsers || 0, icon: <Users className="w-5 h-5" />, color: "text-blue-600" },
                { label: "Seekers", value: metrics?.seekers || 0, icon: <MessageCircle className="w-5 h-5" />, color: "text-emerald-600" },
                { label: "Listeners", value: metrics?.listeners || 0, icon: <Ear className="w-5 h-5" />, color: "text-purple-600" },
                { label: "Approved", value: metrics?.approvedListeners || 0, icon: <CheckCircle className="w-5 h-5" />, color: "text-green-600" },
              ].map((stat) => (
                <div key={stat.label} className="glass-card rounded-2xl p-5">
                  <div className={`${stat.color} mb-3`}>{stat.icon}</div>
                  <p className="text-3xl font-bold text-foreground">{stat.value}</p>
                  <p className="text-xs text-muted-foreground mt-1">{stat.label}</p>
                </div>
              ))}
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
                { label: "Active Conversations", value: metrics?.activeConversations || 0, icon: <MessageCircle className="w-5 h-5" /> },
                { label: "Today's Conversations", value: metrics?.conversationsToday || 0, icon: <Clock className="w-5 h-5" /> },
                { label: "Pending Reports", value: metrics?.pendingReports || 0, icon: <AlertTriangle className="w-5 h-5" /> },
                { label: "Avg Rating", value: metrics?.avgRating || "—", icon: <Star className="w-5 h-5" /> },
              ].map((stat) => (
                <div key={stat.label} className="glass-card rounded-2xl p-5">
                  <div className="text-primary mb-3">{stat.icon}</div>
                  <p className="text-3xl font-bold text-foreground">{stat.value}</p>
                  <p className="text-xs text-muted-foreground mt-1">{stat.label}</p>
                </div>
              ))}
            </div>
          </motion.div>
        )}

        {/* Users Tab */}
        {tab === "users" && (
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
            <div className="glass-card rounded-2xl p-4 mb-4 flex items-center gap-3">
              <Search className="w-4 h-4 text-muted-foreground" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search users..."
                className="flex-1 bg-transparent text-sm text-foreground placeholder:text-muted-foreground focus:outline-none"
              />
            </div>
            <div className="space-y-2">
              {filteredUsers?.map((u) => (
                <div key={u._id}              className="glass-card rounded-2xl p-3 sm:p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="flex items-center gap-4">
                    <div className={`w-2 h-2 rounded-full ${
                      u.status === "suspended" ? "bg-red-500" :
                      u.status === "banned" ? "bg-red-700" :
                      "bg-emerald-500"
                    }`} />
                    <div>
                      <p className="text-sm font-medium text-foreground">
                        {u.anonymousName || u.name || "Unknown"}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {u.email} · {u.role || "no role"} · {u.status || "active"}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 self-end sm:self-auto">
                    {u.status !== "suspended" ? (
                      <Button variant="outline" size="sm" onClick={() => suspendUserMutation({ targetUserId: u._id })} className="rounded-xl text-xs">
                        Suspend
                      </Button>
                    ) : (
                      <Button variant="outline" size="sm" onClick={() => reactivateUser({ targetUserId: u._id })} className="rounded-xl text-xs">
                        Reactivate
                      </Button>
                    )}
                    {u.status !== "banned" && (
                      <Button variant="outline" size="sm" onClick={() => banUser({ targetUserId: u._id })} className="rounded-xl text-xs text-red-600">
                        Ban
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        )}

        {/* Listeners Tab */}
        {tab === "listeners" && (
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
            {pendingListeners && pendingListeners.length > 0 && (
              <div>
                <h2 className="text-lg font-semibold text-foreground mb-3">
                  Pending Approvals ({pendingListeners.length})
                </h2>
                <div className="space-y-2">
                  {pendingListeners.map((l) => (
                    <div key={l._id} className="glass-card rounded-2xl p-3 sm:p-4">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                        <div>
                          <p className="text-sm font-medium text-foreground">
                            {l.anonymousName || l.name || "Unknown"}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            Reason: {l.whyListen} · Training:{" "}
                            {l.trainingCompleted ? "Complete" : "Incomplete"}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            Languages: {l.languages.join(", ")} · Topics: {l.topics.join(", ")}
                          </p>
                        </div>
                        <div className="flex gap-1 self-end sm:self-auto">
                          <Button size="sm" onClick={() => approveListener({ profileId: l._id })} className="rounded-xl text-xs">
                            <CheckCircle className="w-3 h-3 mr-1" />
                            Approve
                          </Button>
                          <Button size="sm" variant="outline" onClick={() => rejectListener({ profileId: l._id })} className="rounded-xl text-xs">
                            <XCircle className="w-3 h-3 mr-1" />
                            Reject
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div>
              <h2 className="text-lg font-semibold text-foreground mb-3">All Listeners</h2>
              <div className="space-y-2">
                {allListeners?.map((l) => (                    <div key={l._id} className="glass-card rounded-2xl p-3 sm:p-4">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div className="flex items-center gap-3">
                        <div className={`w-2 h-2 rounded-full ${
                          l.approvalStatus === "approved" ? "bg-emerald-500" :
                          l.approvalStatus === "suspended" ? "bg-red-500" :
                          l.approvalStatus === "rejected" ? "bg-red-700" :
                          "bg-amber-500"
                        }`} />
                        <div>
                          <p className="text-sm font-medium text-foreground">
                            {l.anonymousName || l.name || "Unknown"}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {l.approvalStatus} · {l.availability} · Rating:{" "}
                            {l.avgRating || "—"} · Conversations: {l.totalConversations || 0}
                          </p>
                        </div>
                      </div>
                      {l.approvalStatus === "approved" && (
                        <Button variant="outline" size="sm" onClick={() => suspendListener({ profileId: l._id })} className="rounded-xl text-xs">
                          Suspend
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        )}

        {/* Applications Tab */}
        {tab === "applications" && (
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
            <h2 className="text-lg font-semibold text-foreground">
              Listener Applications ({allApplications?.length || 0})
            </h2>
            {!allApplications || allApplications.length === 0 ? (
              <div className="glass-card rounded-2xl p-8 text-center">
                <FileText className="w-8 h-8 text-muted-foreground/30 mx-auto mb-3" />
                <p className="text-muted-foreground text-sm">No applications yet.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {allApplications.map((app) => (
                  <div key={app._id} className="glass-card rounded-2xl overflow-hidden">
                    <button
                      onClick={() => setSelectedAppId(selectedAppId === app._id ? null : app._id)}
                      className="w-full p-4 text-left flex items-center justify-between hover:bg-muted/30 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <div className={`w-2 h-2 rounded-full ${
                          app.status === "submitted" ? "bg-blue-500" :
                          app.status === "approved" ? "bg-emerald-500" :
                          app.status === "rejected" ? "bg-red-500" :
                          app.status === "under_review" ? "bg-amber-500" :
                          "bg-gray-400"
                        }`} />
                        <div>
                          <p className="text-sm font-medium text-foreground">
                            {app.anonymousName}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {app.status} · {app.languages?.join(", ")} · {new Date(app.createdAt).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                      {selectedAppId === app._id ? (
                        <ChevronUp className="w-4 h-4 text-muted-foreground" />
                      ) : (
                        <ChevronDown className="w-4 h-4 text-muted-foreground" />
                      )}
                    </button>

                    {selectedAppId === app._id && (
                      <ApplicationReview
                        applicationId={app._id}
                        updateAppStatus={updateAppStatus}
                        updateAppNotes={updateAppNotes}
                        onClose={() => setSelectedAppId(null)}
                      />
                    )}
                  </div>
                ))}
              </div>
            )}
          </motion.div>
        )}

        {/* Reports Tab */}
        {tab === "reports" && (
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
            <div className="space-y-2">
              {reports?.length === 0 ? (
                <div className="glass-card rounded-2xl p-8 text-center">
                  <p className="text-muted-foreground">No reports yet</p>
                </div>
              ) : (
                reports?.map((r) => (
                  <div key={r._id} className="glass-card rounded-2xl p-3 sm:p-4">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                            r.status === "pending"
                              ? "bg-amber-100 text-amber-800"
                              : r.status === "resolved"
                              ? "bg-green-100 text-green-800"
                              : "bg-gray-100 text-gray-800"
                          }`}>
                            {r.status}
                          </span>
                          <span className="text-sm font-medium text-foreground">{r.reason}</span>
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">
                          Reporter: {r.reporterAnonymousName} · Reported: {r.reportedUserAnonymousName}
                        </p>
                        {r.details && (
                          <p className="text-xs text-muted-foreground mt-1">{r.details}</p>
                        )}
                        <p className="text-xs text-muted-foreground/60 mt-1">
                          {new Date(r.createdAt).toLocaleString()}
                        </p>
                      </div>
                      <div className="flex gap-1 self-end sm:self-auto">
                        {r.status === "pending" && (
                          <>
                            <Button size="sm" variant="outline" onClick={() => updateReportStatus({ reportId: r._id, status: "warned" })} className="rounded-xl text-xs">
                              Warn
                            </Button>
                            <Button size="sm" variant="outline" onClick={() => updateReportStatus({ reportId: r._id, status: "resolved" })} className="rounded-xl text-xs">
                              Resolve
                            </Button>
                            <Button size="sm" variant="outline" onClick={() => updateReportStatus({ reportId: r._id, status: "suspended" })} className="rounded-xl text-xs text-red-600">
                              Suspend
                            </Button>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}

// --- Application Review Sub-component ---

const RUBRIC_CATEGORIES = [
  { key: "empathy", label: "Empathy" },
  { key: "listeningOrientation", label: "Listening orientation" },
  { key: "emotionalRegulation", label: "Emotional regulation" },
  { key: "selfAwareness", label: "Self-awareness" },
  { key: "boundaries", label: "Boundaries" },
  { key: "judgment", label: "Judgment" },
  { key: "safetyAwareness", label: "Safety awareness" },
  { key: "overallSuitability", label: "Overall suitability" },
];

function ApplicationReview({
  applicationId,
  updateAppStatus,
  updateAppNotes,
  onClose,
}: {
  applicationId: string;
  updateAppStatus: any;
  updateAppNotes: any;
  onClose: () => void;
}) {
  const detail = useQuery(api.listenerApplications.getApplicationDetail, {
    applicationId: applicationId as any,
  });
  const [adminNotes, setAdminNotes] = useState("");
  const [scores, setScores] = useState<Record<string, number>>({});
  const [decisionReason, setDecisionReason] = useState("");
  const [actionLoading, setActionLoading] = useState(false);

  // Initialize scores from existing data (must be before any early return)
  useEffect(() => {
    if (detail?.scores) {
      const s: Record<string, number> = {};
      for (const cat of RUBRIC_CATEGORIES) {
        const val = (detail.scores as any)[cat.key];
        if (val !== undefined) s[cat.key] = val;
      }
      setScores(s);
    }
    if (detail?.adminNotes) setAdminNotes(detail.adminNotes);
  }, [detail]);

  if (!detail) {
    return (
      <div className="p-6 text-center">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground mx-auto" />
      </div>
    );
  }

  const handleAction = async (
    status: string,
    reason?: string,
  ) => {
    setActionLoading(true);
    try {
      // Save notes/scores first
      await updateAppNotes({
        applicationId: applicationId as any,
        adminNotes: adminNotes || undefined,
        scores: Object.keys(scores).length > 0 ? (scores as any) : undefined,
      });
      // Then update status
      await updateAppStatus({
        applicationId: applicationId as any,
        status,
        decisionReason: reason || decisionReason || undefined,
        adminNotes: adminNotes || undefined,
        scores: Object.keys(scores).length > 0 ? (scores as any) : undefined,
      });
      onClose();
    } catch (err) {
      console.error(err);
    }
    setActionLoading(false);
  };

  const scenarioIds = [
    "listening_vs_solving", "advice_rejected", "repeated_conversation",
    "emotional_dependency", "anger", "different_values",
    "personal_trigger", "silence", "crisis_safety", "self_awareness",
  ];

  return (
    <div className="p-4 sm:p-6 border-t border-border/50 space-y-6">
      {/* Flags */}
      {detail.flags && detail.flags.length > 0 && (
        <div className="rounded-xl bg-amber-500/10 border border-amber-500/20 p-3">
          <p className="text-xs font-medium text-amber-700 mb-1">⚠ Flags</p>
          <ul className="text-xs text-amber-600 space-y-0.5">
            {detail.flags.map((f: string, i: number) => (
              <li key={i}>• {f}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Basic Info */}
      <div>
        <h3 className="text-sm font-semibold text-foreground mb-3">Basic Information</h3>
        <div className="grid grid-cols-2 gap-3 text-sm">
          <div><span className="text-muted-foreground">Anonymous name:</span> {detail.anonymousName || "—"}</div>
          <div><span className="text-muted-foreground">Age range:</span> {detail.ageRange || "—"}</div>
          <div><span className="text-muted-foreground">Languages:</span> {detail.languages.join(", ")}</div>
          <div><span className="text-muted-foreground">Timezone:</span> {detail.timezone || "—"}</div>
          <div><span className="text-muted-foreground">Availability:</span> {detail.availability || "—"}</div>
          <div><span className="text-muted-foreground">Previous experience:</span> {detail.previousExperience ? "Yes" : "No"}</div>
        </div>
        {detail.experienceDescription && (
          <p className="text-sm text-muted-foreground mt-2">{detail.experienceDescription}</p>
        )}
        <p className="text-sm text-muted-foreground mt-2"><span className="text-foreground font-medium">Why listen:</span> {detail.whyListen}</p>
        <p className="text-sm text-muted-foreground"><span className="text-foreground font-medium">Comfortable topics:</span> {detail.comfortableTopics.join(", ")}</p>
        {detail.uncomfortableTopics && (
          <p className="text-sm text-muted-foreground"><span className="text-foreground font-medium">Uncomfortable topics:</span> {detail.uncomfortableTopics}</p>
        )}
      </div>

      {/* Scenario Answers */}
      <div>
        <h3 className="text-sm font-semibold text-foreground mb-3">Scenario Answers</h3>
        <div className="space-y-4">
          {scenarioIds.map((id) => {
            const answer = detail.answers?.[id];
            const followAnswer = detail.answers?.[`${id}_followup`];
            if (!answer) return null;
            return (
              <div key={id} className="glass-card rounded-xl p-4">
                <p className="text-xs font-medium text-primary mb-2 uppercase tracking-wide">
                  {id.replace(/_/g, " ")}
                </p>
                <p className="text-sm text-foreground whitespace-pre-wrap">{answer}</p>
                {followAnswer && (
                  <>
                    <p className="text-xs font-medium text-muted-foreground mt-3 mb-1">Follow-up:</p>
                    <p className="text-sm text-foreground whitespace-pre-wrap">{followAnswer}</p>
                  </>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Originality */}
      <div className="glass-card rounded-xl p-4">
        <p className="text-xs font-medium text-foreground mb-1">Originality Declaration</p>
        <p className="text-sm text-muted-foreground">
          {detail.originalityConfirmed ? "Applicant confirmed answers are their own work." : "NOT confirmed"}
        </p>
      </div>

      {/* Rubric */}
      <div>
        <h3 className="text-sm font-semibold text-foreground mb-3">Review Rubric</h3>
        <p className="text-xs text-muted-foreground mb-3">
          Do not approve based only on high scores. Review the actual answers and look for safety or boundary concerns.
        </p>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {RUBRIC_CATEGORIES.map((cat) => (
            <div key={cat.key} className="glass-card rounded-xl p-3">
              <p className="text-xs text-muted-foreground mb-2">{cat.label}</p>
              <div className="flex gap-1">
                {[1, 2, 3, 4, 5].map((val) => (
                  <button
                    key={val}
                    onClick={() => setScores((prev) => ({ ...prev, [cat.key]: val }))}
                    className={`w-8 h-8 rounded-lg text-xs font-medium transition-all ${
                      scores[cat.key] === val
                        ? "bg-primary text-primary-foreground"
                        : "glass-card text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    {val}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Admin Notes */}
      <div>
        <h3 className="text-sm font-semibold text-foreground mb-2">Admin Notes (private)</h3>
        <textarea
          value={adminNotes}
          onChange={(e) => setAdminNotes(e.target.value)}
          placeholder="Internal notes — not visible to the applicant..."
          className="w-full rounded-xl glass-input px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary min-h-[80px]"
        />
      </div>

      {/* Decision Reason */}
      <div>
        <h3 className="text-sm font-semibold text-foreground mb-2">Decision reason (optional)</h3>
        <input
          type="text"
          value={decisionReason}
          onChange={(e) => setDecisionReason(e.target.value)}
          placeholder="Reason for approval/rejection..."
          className="w-full rounded-xl glass-input px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
        />
      </div>

      {/* Actions */}
      <div className="flex flex-wrap gap-3">
        <Button
          onClick={() => handleAction("approved")}
          disabled={actionLoading}
          className="rounded-xl"
        >
          {actionLoading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <CheckCircle className="w-4 h-4 mr-2" />}
          Approve
        </Button>
        <Button
          variant="outline"
          onClick={() => handleAction("under_review")}
          disabled={actionLoading}
          className="rounded-xl"
        >
          Under review
        </Button>
        <Button
          variant="outline"
          onClick={() => handleAction("needs_more_info")}
          disabled={actionLoading}
          className="rounded-xl"
        >
          Request more info
        </Button>
        <Button
          variant="outline"
          onClick={() => handleAction("rejected")}
          disabled={actionLoading}
          className="rounded-xl text-red-600 border-red-200"
        >
          {actionLoading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <XCircle className="w-4 h-4 mr-2" />}
          Reject
        </Button>
      </div>
    </div>
  );
}
