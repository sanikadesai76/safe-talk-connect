import { motion } from "framer-motion";
import { useNavigate } from "react-router";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/hooks/use-auth";
import { api } from "@/convex/_generated/api";
import { useMutation, useQuery } from "convex/react";
import { useState } from "react";
import { ArrowLeft, Plus, Trash2, Shield } from "lucide-react";

export default function AdminSafetyResources() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const resources = useQuery(api.safety.getSafetyResources, {});
  const addResource = useMutation(api.safety.addSafetyResource);
  const deleteResource = useMutation(api.safety.deleteSafetyResource);

  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    title: "",
    description: "",
    country: "US",
    phone: "",
    url: "",
    category: "crisis",
    isEmergency: false,
  });

  if (!user || user.role !== "admin") {
    navigate("/admin");
    return null;
  }

  const handleAdd = async () => {
    if (!form.title || !form.description) return;
    try {
      await addResource({
        ...form,
        phone: form.phone || undefined,
        url: form.url || undefined,
      });
      setShowForm(false);
      setForm({
        title: "",
        description: "",
        country: "US",
        phone: "",
        url: "",
        category: "crisis",
        isEmergency: false,
      });
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="min-h-screen px-4 py-8">
      <div className="max-w-3xl mx-auto">
        <div className="flex items-center gap-3 mb-8">
          <Button variant="ghost" size="icon" onClick={() => navigate("/admin")} className="h-8 w-8">
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <h1 className="text-2xl font-bold text-foreground">Safety Resources</h1>
        </div>

        <Button onClick={() => setShowForm(!showForm)} className="mb-6 rounded-xl">
          <Plus className="w-4 h-4 mr-2" />
          Add resource
        </Button>

        {showForm && (
          <motion.div
            initial={{ opacity: 0, y: -12 }}
            animate={{ opacity: 1, y: 0 }}
            className="glass-card rounded-2xl p-6 mb-6"
          >
            <div className="space-y-4">
              <Input
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                placeholder="Title"
                className="glass-input"
              />
              <textarea
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                placeholder="Description"
                className="w-full rounded-xl glass-input px-4 py-3 text-sm min-h-[80px]"
              />
              <div className="grid grid-cols-2 gap-4">
                <Input
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                  placeholder="Phone (optional)"
                  className="glass-input"
                />
                <Input
                  value={form.url}
                  onChange={(e) => setForm({ ...form, url: e.target.value })}
                  placeholder="URL (optional)"
                  className="glass-input"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <Input
                  value={form.country}
                  onChange={(e) => setForm({ ...form, country: e.target.value })}
                  placeholder="Country code"
                  className="glass-input"
                />
                <select
                  value={form.category}
                  onChange={(e) => setForm({ ...form, category: e.target.value })}
                  className="rounded-xl glass-input px-4 py-2 text-sm"
                >
                  <option value="crisis">Crisis</option>
                  <option value="hotline">Hotline</option>
                  <option value="therapy">Therapy</option>
                  <option value="other">Other</option>
                </select>
              </div>
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={form.isEmergency}
                  onChange={(e) => setForm({ ...form, isEmergency: e.target.checked })}
                />
                Emergency resource
              </label>
              <div className="flex gap-2">
                <Button onClick={handleAdd} className="rounded-xl">
                  Add
                </Button>
                <Button variant="outline" onClick={() => setShowForm(false)} className="rounded-xl">
                  Cancel
                </Button>
              </div>
            </div>
          </motion.div>
        )}

        <div className="space-y-3">
          {resources?.map((r) => (
            <div key={r._id} className="glass-card rounded-2xl p-4 flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2">
                  {r.isEmergency && (
                    <span className="px-2 py-0.5 rounded-full text-xs bg-red-100 text-red-800">
                      Emergency
                    </span>
                  )}
                  <span className="px-2 py-0.5 rounded-full text-xs bg-gray-100 text-gray-800">
                    {r.category}
                  </span>
                </div>
                <p className="text-sm font-medium text-foreground mt-1">{r.title}</p>
                <p className="text-xs text-muted-foreground">{r.description}</p>
                {r.phone && <p className="text-xs text-primary">{r.phone}</p>}
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => deleteResource({ resourceId: r._id })}
                className="rounded-xl text-red-600"
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
          ))}
          {resources && resources.length === 0 && (
            <div className="glass-card rounded-2xl p-8 text-center">
              <Shield className="w-8 h-8 text-muted-foreground/30 mx-auto mb-3" />
              <p className="text-muted-foreground text-sm">
                No safety resources yet. Add one above.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
