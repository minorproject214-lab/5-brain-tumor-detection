import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import {
  FileText,
  Brain,
  Trash2,
  Upload,
  ChevronDown,
  ChevronUp,
  Calendar,
  AlertTriangle,
  CheckCircle,
  Layers,
} from "lucide-react";
import api from "../api/axios";

const CLASS_COLORS = {
  Glioma: {
    text: "text-red-400",
    border: "border-red-500/20",
    bg: "bg-red-500/10",
    bar: "bg-red-500",
  },
  Meningioma: {
    text: "text-orange-400",
    border: "border-orange-500/20",
    bg: "bg-orange-500/10",
    bar: "bg-orange-500",
  },
  "No Tumor": {
    text: "text-green-400",
    border: "border-green-500/20",
    bg: "bg-green-500/10",
    bar: "bg-green-500",
  },
  "Pituitary Tumor": {
    text: "text-purple-400",
    border: "border-purple-500/20",
    bg: "bg-purple-500/10",
    bar: "bg-purple-500",
  },
};
const ALL_CLASSES = ["Glioma", "Meningioma", "No Tumor", "Pituitary Tumor"];

function ScanRow({ scan }) {
  const [expanded, setExpanded] = useState(false);
  const c = CLASS_COLORS[scan.predicted_class] || CLASS_COLORS["Glioma"];

  return (
    <div
      className={`rounded-xl border transition-all ${c.border}`}
      style={{ background: "rgba(255,255,255,0.03)" }}
    >
      <div className="flex items-center gap-3 p-3">
        {/* Thumbnail */}
        <div className="w-10 h-10 rounded-lg overflow-hidden bg-dark-800 border border-white/8 flex-shrink-0">
          {scan.image_base64 ? (
            <img
              src={`data:image/jpeg;base64,${scan.image_base64}`}
              alt="MRI"
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <Brain size={14} className="text-white/15" />
            </div>
          )}
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <p className="text-white/60 font-body text-xs truncate">
            {scan.filename}
          </p>
          <div className="flex items-center gap-2 mt-0.5">
            <span
              className={`text-xs font-mono px-1.5 py-0.5 rounded ${c.bg} ${c.text} border ${c.border}`}
            >
              {scan.predicted_class}
            </span>
            <span className={`font-mono text-xs ${c.text}`}>
              {scan.confidence?.toFixed(1)}%
            </span>
          </div>
        </div>

        <button
          onClick={() => setExpanded(!expanded)}
          className="w-6 h-6 rounded-lg border border-white/10 flex items-center justify-center text-white/25 hover:text-white/60 transition-all flex-shrink-0"
          style={{ background: "rgba(255,255,255,0.04)" }}
        >
          {expanded ? <ChevronUp size={11} /> : <ChevronDown size={11} />}
        </button>
      </div>

      {/* Expanded */}
      {expanded && (
        <div className="px-3 pb-3 border-t border-white/8 pt-2 space-y-2">
          {scan.image_base64 && (
            <div className="rounded-lg overflow-hidden max-h-40 bg-dark-800">
              <img
                src={`data:image/jpeg;base64,${scan.image_base64}`}
                alt="MRI full"
                className="w-full h-full object-contain"
              />
            </div>
          )}
          <div className="space-y-1.5">
            {ALL_CLASSES.map((cls, i) => {
              const pct = scan.raw_prediction?.[i] || 0;
              const cc = CLASS_COLORS[cls];
              const isTop = cls === scan.predicted_class;
              return (
                <div key={cls} className="flex items-center gap-2">
                  <span
                    className={`font-body text-xs w-24 flex-shrink-0 ${isTop ? "text-white" : "text-white/25"}`}
                  >
                    {cls}
                  </span>
                  <div className="flex-1 h-1 bg-white/5 rounded-full overflow-hidden">
                    <div
                      className={`h-full ${cc.bar} rounded-full`}
                      style={{
                        width: `${Math.min(pct, 100)}%`,
                        opacity: isTop ? 1 : 0.3,
                      }}
                    />
                  </div>
                  <span
                    className={`font-mono text-xs w-12 text-right ${isTop ? cc.text : "text-white/20"}`}
                  >
                    {pct.toFixed(2)}%
                  </span>
                </div>
              );
            })}
          </div>
          {scan.class_info?.description && (
            <p className="text-white/25 font-body text-xs leading-relaxed pt-1">
              {scan.class_info.description}
            </p>
          )}
        </div>
      )}
    </div>
  );
}

function SessionCard({ session, onDelete }) {
  const [expanded, setExpanded] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const date = new Date(session.created_at);

  const handleDelete = async () => {
    if (!confirm("Delete this entire session?")) return;
    setDeleting(true);
    try {
      await api.delete(`/sessions/${session.id}`);
      onDelete(session.id);
    } catch {
      alert("Failed to delete session");
    } finally {
      setDeleting(false);
    }
  };

  // dominant class
  const dominant = ALL_CLASSES.reduce((a, b) =>
    (session.summary?.[a] || 0) >= (session.summary?.[b] || 0) ? a : b,
  );
  const dc = CLASS_COLORS[dominant];

  return (
    <div className="card border border-white/8 hover:border-white/15 transition-all duration-300">
      {/* Session Header */}
      <div className="flex items-start gap-3">
        <div
          className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 border ${dc.border} ${dc.bg}`}
        >
          <Layers size={16} className={dc.text} />
        </div>

        <div className="flex-1 min-w-0">
          <h3 className="font-display font-600 text-white text-sm sm:text-base truncate">
            {session.session_name}
          </h3>
          <div className="flex items-center gap-2 mt-1 flex-wrap">
            <span className="text-white/30 font-mono text-xs">
              {session.total} scan{session.total !== 1 ? "s" : ""}
            </span>
            <span className="text-white/15">·</span>
            <div className="flex items-center gap-1 text-white/20">
              <Calendar size={10} />
              <span className="font-mono text-xs">
                {date.toLocaleDateString()}{" "}
                {date.toLocaleTimeString([], {
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-1.5 flex-shrink-0">
          <button
            onClick={() => setExpanded(!expanded)}
            className="w-7 h-7 rounded-lg border border-white/10 flex items-center justify-center text-white/30 hover:text-white/70 transition-all"
            style={{ background: "rgba(255,255,255,0.05)" }}
          >
            {expanded ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
          </button>
          <button
            onClick={handleDelete}
            disabled={deleting}
            className="w-7 h-7 rounded-lg border border-white/10 flex items-center justify-center text-white/30 hover:text-red-400 hover:border-red-500/30 transition-all"
            style={{ background: "rgba(255,255,255,0.05)" }}
          >
            {deleting ? (
              <div className="w-3 h-3 border border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <Trash2 size={13} />
            )}
          </button>
        </div>
      </div>

      {/* Summary pills */}
      <div className="flex gap-2 mt-3 flex-wrap">
        {ALL_CLASSES.map((cls) => {
          const count = session.summary?.[cls] || 0;
          if (count === 0) return null;
          const cc = CLASS_COLORS[cls];
          return (
            <span
              key={cls}
              className={`flex items-center gap-1 text-xs font-mono px-2 py-1 rounded-lg border ${cc.border} ${cc.bg} ${cc.text}`}
            >
              {count} {cls}
            </span>
          );
        })}
      </div>

      {/* Expanded scans */}
      {expanded && session.scans?.length > 0 && (
        <div className="mt-4 pt-4 border-t border-white/8 space-y-2">
          <p className="text-white/30 font-mono text-xs uppercase tracking-wider mb-3">
            Individual Scans ({session.scans.length})
          </p>
          {session.scans.map((scan, i) => (
            <ScanRow key={i} scan={scan} />
          ))}
        </div>
      )}
    </div>
  );
}

export default function Reports() {
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    api
      .get("/sessions")
      .then((res) => setSessions(res.data))
      .catch(() => setError("Failed to load sessions"))
      .finally(() => setLoading(false));
  }, []);

  const handleDelete = (id) =>
    setSessions((prev) => prev.filter((s) => s.id !== id));

  // Overall stats across all sessions
  const totalScans = sessions.reduce((a, s) => a + (s.total || 0), 0);
  const totalByClass = ALL_CLASSES.reduce((acc, cls) => {
    acc[cls] = sessions.reduce((a, s) => a + (s.summary?.[cls] || 0), 0);
    return acc;
  }, {});

  return (
    <div className="max-w-4xl mx-auto px-3 sm:px-6 py-6 sm:py-10">
      {/* Header */}
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <div>
          <h1 className="font-display text-2xl sm:text-3xl font-700 text-white">
            Scan Sessions
          </h1>
          <p className="text-white/40 font-body mt-1 text-sm">
            Your saved MRI analysis sessions
          </p>
        </div>
        <Link
          to="/upload"
          className="btn-primary flex items-center gap-2 text-sm py-2.5"
        >
          <Upload size={14} />
          New Scan
        </Link>
      </div>

      {/* Global stats */}
      {sessions.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 mb-6">
          <div className="card text-center py-3 sm:col-span-1">
            <p className="font-display text-2xl font-700 text-brand-400">
              {sessions.length}
            </p>
            <p className="text-white/30 font-body text-xs mt-0.5">Sessions</p>
          </div>
          <div className="card text-center py-3 sm:col-span-1">
            <p className="font-display text-2xl font-700 text-white">
              {totalScans}
            </p>
            <p className="text-white/30 font-body text-xs mt-0.5">
              Total Scans
            </p>
          </div>
          {ALL_CLASSES.slice(0, 3).map((cls) => {
            const cc = CLASS_COLORS[cls];
            return (
              <div key={cls} className="card text-center py-3">
                <p className={`font-display text-2xl font-700 ${cc.text}`}>
                  {totalByClass[cls]}
                </p>
                <p className="text-white/30 font-body text-xs mt-0.5 truncate">
                  {cls}
                </p>
              </div>
            );
          })}
        </div>
      )}

      {/* Content */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 gap-4">
          <div className="w-10 h-10 border-2 border-brand-500/30 border-t-brand-500 rounded-full animate-spin" />
          <p className="text-white/30 font-body text-sm">Loading sessions...</p>
        </div>
      ) : error ? (
        <div className="card text-center py-12">
          <AlertTriangle size={32} className="text-red-400 mx-auto mb-3" />
          <p className="text-red-400 font-display font-600">{error}</p>
        </div>
      ) : sessions.length === 0 ? (
        <div className="card text-center py-16">
          <div
            className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4"
            style={{ background: "rgba(255,255,255,0.03)" }}
          >
            <FileText size={24} className="text-white/15" />
          </div>
          <h3 className="font-display font-600 text-white/30 mb-2">
            No sessions yet
          </h3>
          <p className="text-white/20 font-body text-sm mb-6">
            Upload MRI scans and save them as a session
          </p>
          <Link
            to="/upload"
            className="btn-primary inline-flex items-center gap-2"
          >
            <Upload size={15} />
            Upload MRI
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {sessions.map((session) => (
            <SessionCard
              key={session.id}
              session={session}
              onDelete={handleDelete}
            />
          ))}
        </div>
      )}
    </div>
  );
}
