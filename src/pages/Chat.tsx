import { motion } from "framer-motion";
import { useNavigate, useParams } from "react-router";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/hooks/use-auth";
import { api } from "@/convex/_generated/api";
import { useMutation, useQuery } from "convex/react";
import { useState, useEffect, useRef } from "react";
import type { Id } from "@/convex/_generated/dataModel";
import {
  Send,
  ArrowLeft,
  LogOut,
  Flag,
  Ban,
  Shield,
  AlertTriangle,
  Phone,
  Loader2,
  MessageCircle,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

const REPORT_REASONS = [
  "Harassment",
  "Sexual behavior",
  "Manipulation",
  "Asking for money",
  "Hate or abusive behavior",
  "Inappropriate content",
  "Pretending to be a professional",
  "Other",
];

export default function Chat() {
  const { conversationId } = useParams<{ conversationId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const sendMessage = useMutation(api.messages.sendMessage);
  const endConversation = useMutation(api.matching.endConversation);
  const createReport = useMutation(api.reports.createReport);
  const blockUser = useMutation(api.reports.blockUser);

  const messages = useQuery(
    api.messages.getMessagesForConversation,
    conversationId ? { conversationId: conversationId as Id<"conversations"> } : "skip"
  );
  const conversation = useQuery(
    api.matching.getMyActiveConversation
  );

  const [input, setInput] = useState("");
  const [showEndDialog, setShowEndDialog] = useState(false);
  const [showReportDialog, setShowReportDialog] = useState(false);
  const [showBlockDialog, setShowBlockDialog] = useState(false);
  const [showSafetyDialog, setShowSafetyDialog] = useState(false);
  const [reportReason, setReportReason] = useState("");
  const [reportDetails, setReportDetails] = useState("");
  const [sending, setSending] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  if (!conversationId) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-muted-foreground">No active conversation</p>
          <Button variant="outline" onClick={() => navigate("/")} className="mt-4 rounded-xl">
            Go home
          </Button>
        </div>
      </div>
    );
  }

  if (!conversation || messages === undefined) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const otherName =
    conversation.role === "seeker"
      ? conversation.listenerAnonymousName || "Listener"
      : conversation.seekerAnonymousName;
  const myRole = conversation.role;

  const handleSend = async () => {
    if (!input.trim() || sending) return;
    setSending(true);
    try {
      await sendMessage({
        conversationId: conversationId as Id<"conversations">,
        content: input.trim(),
      });
      setInput("");
      inputRef.current?.focus();
    } catch (err) {
      console.error(err);
    }
    setSending(false);
  };

  const handleEndConversation = async () => {
    try {
      await endConversation({ conversationId: conversationId as Id<"conversations"> });
      setShowEndDialog(false);
      if (myRole === "listener") navigate("/listener-dashboard");
      else navigate("/feedback/" + conversationId);
    } catch (err) {
      console.error(err);
    }
  };

  const handleReport = async () => {
    if (!reportReason) return;
    try {
      const reportedUserId =
        myRole === "seeker" ? conversation.listenerId : conversation.seekerId;
      await createReport({
        conversationId: conversationId as Id<"conversations">,
        reportedUserId,
        reason: reportReason,
        details: reportDetails || undefined,
      });
      setShowReportDialog(false);
      setReportReason("");
      setReportDetails("");
    } catch (err) {
      console.error(err);
    }
  };

  const handleBlock = async () => {
    try {
      const blockedUserId =
        myRole === "seeker" ? conversation.listenerId : conversation.seekerId;
      await blockUser({ blockedUserId });
      setShowBlockDialog(false);
      await endConversation({ conversationId: conversationId as Id<"conversations"> });
      if (myRole === "listener") navigate("/listener-dashboard");
      else navigate("/");
    } catch (err) {
      console.error(err);
    }
  };

  if (conversation.status !== "active") {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <div className="text-center">
          <MessageCircle className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-foreground mb-2">
            Conversation ended
          </h1>
          <p className="text-muted-foreground mb-6">
            This conversation has ended. Thank you for connecting.
          </p>
          <div className="flex gap-3 justify-center">
            {myRole === "seeker" && (
              <Button
                onClick={() => navigate("/feedback/" + conversationId)}
                className="rounded-xl"
              >
                Leave feedback
              </Button>
            )}
            <Button
              variant="outline"
              onClick={() =>
                myRole === "listener"
                  ? navigate("/listener-dashboard")
                  : navigate("/")
              }
              className="rounded-xl"
            >
              Go home
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col">
      {/* Header */}
      <div className="glass-strong border-b border-border/50 px-4 py-3 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            onClick={() =>
              myRole === "listener"
                ? navigate("/listener-dashboard")
                : navigate("/")
            }
            className="h-8 w-8"
          >
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="font-medium text-foreground text-sm">
                {otherName}
              </span>
            </div>
            <p className="text-xs text-muted-foreground">Anonymous conversation</p>
          </div>
        </div>
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setShowSafetyDialog(true)}
            className="h-8 w-8 text-amber-600 hover:text-amber-700"
          >
            <Shield className="w-4 h-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setShowReportDialog(true)}
            className="h-8 w-8"
          >
            <Flag className="w-4 h-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setShowBlockDialog(true)}
            className="h-8 w-8 text-red-500 hover:text-red-600"
          >
            <Ban className="w-4 h-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setShowEndDialog(true)}
            className="h-8 w-8"
          >
            <LogOut className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-6">
        <div className="max-w-2xl mx-auto space-y-4">
          {messages?.map((msg) => (
            <motion.div
              key={msg._id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className={`flex ${msg.isOwn ? "justify-end" : "justify-start"}`}
            >
              {msg.isSystem ? (
                <div className="w-full text-center py-2">
                  <span className="text-xs text-muted-foreground glass-card rounded-full px-4 py-1.5 inline-block">
                    {msg.content}
                  </span>
                </div>
              ) : (
                <div className={`max-w-[75%] ${msg.isOwn ? "order-2" : ""}`}>
                  <p className="text-xs text-muted-foreground mb-1 px-1">
                    {msg.senderAnonymousName}
                  </p>
                  <div
                    className={`rounded-2xl px-4 py-2.5 text-sm leading-relaxed ${
                      msg.isOwn
                        ? "bg-primary text-primary-foreground rounded-br-md"
                        : "glass-card text-foreground rounded-bl-md"
                    }`}
                  >
                    {msg.content}
                  </div>
                  <p className="text-[10px] text-muted-foreground/60 mt-1 px-1">
                    {new Date(msg.timestamp).toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </p>
                </div>
              )}
            </motion.div>
          ))}
          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Input */}
      <div className="glass-strong border-t border-border/50 px-4 py-3 shrink-0">
        <div className="max-w-2xl mx-auto flex gap-2">
          <Input
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                handleSend();
              }
            }}
            placeholder="Type a message..."
            className="glass-input rounded-xl border-0"
            disabled={sending}
          />
          <Button
            onClick={handleSend}
            disabled={!input.trim() || sending}
            className="rounded-xl"
          >
            {sending ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Send className="w-4 h-4" />
            )}
          </Button>
        </div>
      </div>

      {/* End Conversation Dialog */}
      <Dialog open={showEndDialog} onOpenChange={setShowEndDialog}>
        <DialogContent className="glass-strong rounded-2xl">
          <DialogHeader>
            <DialogTitle>End conversation?</DialogTitle>
            <DialogDescription>
              Are you sure you want to end this conversation? This cannot be
              undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowEndDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleEndConversation} variant="destructive">
              End conversation
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Report Dialog */}
      <Dialog open={showReportDialog} onOpenChange={setShowReportDialog}>
        <DialogContent className="glass-strong rounded-2xl">
          <DialogHeader>
            <DialogTitle>Report this user</DialogTitle>
            <DialogDescription>
              Help us keep SafeTalk safe. Select a reason for your report.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2 py-2">
            {REPORT_REASONS.map((reason) => (
              <button
                key={reason}
                onClick={() => setReportReason(reason)}
                className={`w-full text-left rounded-xl p-3 text-sm transition-all ${
                  reportReason === reason
                    ? "bg-primary/10 ring-2 ring-primary text-foreground"
                    : "glass-card text-muted-foreground hover:text-foreground"
                }`}
              >
                {reason}
              </button>
            ))}
          </div>
          {reportReason && (
            <textarea
              value={reportDetails}
              onChange={(e) => setReportDetails(e.target.value)}
              placeholder="Additional details (optional)..."
              className="w-full rounded-xl glass-input px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary min-h-[80px]"
            />
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowReportDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleReport} disabled={!reportReason}>
              Submit report
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Block Dialog */}
      <Dialog open={showBlockDialog} onOpenChange={setShowBlockDialog}>
        <DialogContent className="glass-strong rounded-2xl">
          <DialogHeader>
            <DialogTitle>Block this user?</DialogTitle>
            <DialogDescription>
              You will not be matched with this person again. The conversation
              will also end.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowBlockDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleBlock} variant="destructive">
              Block user
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Safety Dialog */}
      <Dialog open={showSafetyDialog} onOpenChange={setShowSafetyDialog}>
        <DialogContent className="glass-strong rounded-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Shield className="w-5 h-5 text-amber-600" />
              Safety & Help
            </DialogTitle>
            <DialogDescription>
              SafeTalk is not an emergency service or substitute for professional
              medical care.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="glass-card rounded-xl p-4">
              <h4 className="font-medium text-foreground mb-2 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-600" />
                In immediate danger?
              </h4>
              <p className="text-sm text-muted-foreground mb-3">
                If you or someone you know is in immediate danger, please contact
                emergency services right away.
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
                  988 Suicide & Crisis Lifeline
                </Button>
              </div>
            </div>
            <div className="glass-card rounded-xl p-4">
              <h4 className="font-medium text-foreground mb-2">
                Crisis Resources
              </h4>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• National Suicide Prevention Lifeline: 988</li>
                <li>• Crisis Text Line: Text HOME to 741741</li>
                <li>• International Association for Suicide Prevention: https://www.iasp.info/resources/Crisis_Centres/</li>
              </ul>
            </div>
          </div>
          <DialogFooter>
            <Button onClick={() => setShowSafetyDialog(false)}>
              Got it
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
