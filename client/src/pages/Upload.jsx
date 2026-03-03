import { useState, useCallback } from "react";
import { useDropzone } from "react-dropzone";
import {
  UploadCloud,
  Brain,
  CheckCircle,
  AlertTriangle,
  X,
  BarChart2,
  RefreshCw,
  ChevronDown,
  ChevronUp,
  Zap,
  Save,
  Edit2,
} from "lucide-react";
import { Link } from "react-router-dom";
import api from "../api/axios";

const CLASS_COLORS = {
  Glioma: {
    bar: "bg-red-500",
    text: "text-red-400",
    border: "border-red-500/30",
    bg: "bg-red-500/10",
  },
  Meningioma: {
    bar: "bg-orange-500",
    text: "text-orange-400",
    border: "border-orange-500/30",
    bg: "bg-orange-500/10",
  },
  "No Tumor": {
    bar: "bg-green-500",
    text: "text-green-400",
    border: "border-green-500/30",
    bg: "bg-green-500/10",
  },
  "Pituitary Tumor": {
    bar: "bg-purple-500",
    text: "text-purple-400",
    border: "border-purple-500/30",
    bg: "bg-purple-500/10",
  },
};
const ALL_CLASSES = ["Glioma", "Meningioma", "No Tumor", "Pituitary Tumor"];

function ScanCard({ item, onRemove }) {
  const [expanded, setExpanded] = useState(false);
  const c = item.result ? CLASS_COLORS[item.result.predicted_class] : null;

  return (
    <div
      className={`rounded-2xl border transition-all duration-300 overflow-hidden ${
        c ? `border ${c.border}` : "border-white/8"
      }`}
      style={{ background: "rgba(255,255,255,0.04)" }}
    >
      <div className="flex items-center gap-3 p-3 sm:p-4">
        {/* Thumbnail */}
        <div className="relative w-12 h-12 sm:w-14 sm:h-14 rounded-xl overflow-hidden bg-dark-800 border border-white/8 flex-shrink-0">
          <img
            src={item.preview}
            alt="MRI"
            className="w-full h-full object-cover"
          />
          {item.loading && (
            <div
              className="absolute inset-0 flex items-center justify-center"
              style={{ background: "rgba(3,13,13,0.85)" }}
            >
              <div className="w-4 h-4 border-2 border-t-brand-500 border-white/20 rounded-full animate-spin" />
            </div>
          )}
          {item.result && !item.loading && (
            <div
              className={`absolute inset-0 ${c.bg} flex items-center justify-center`}
            >
              <CheckCircle size={16} className={c.text} />
            </div>
          )}
          {item.error && (
            <div
              className="absolute inset-0 flex items-center justify-center"
              style={{ background: "rgba(239,68,68,0.2)" }}
            >
              <AlertTriangle size={14} className="text-red-400" />
            </div>
          )}
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <p className="text-white/70 font-body text-sm truncate">
            {item.file.name}
          </p>
          <p className="text-white/25 font-mono text-xs mt-0.5">
            {(item.file.size / 1024).toFixed(1)} KB
          </p>
          {item.result && (
            <div className="flex items-center gap-2 mt-1">
              <span
                className={`text-xs font-mono px-1.5 py-0.5 rounded ${c.bg} ${c.text} border ${c.border}`}
              >
                {item.result.predicted_class}
              </span>
              <span className={`text-xs font-mono ${c.text}`}>
                {item.result.confidence.toFixed(1)}%
              </span>
            </div>
          )}
          {item.error && (
            <p className="text-red-400 text-xs mt-1 truncate">{item.error}</p>
          )}
          {item.loading && (
            <p className="text-brand-400 text-xs mt-1 font-mono animate-pulse">
              Analyzing...
            </p>
          )}
          {!item.result && !item.loading && !item.error && (
            <p className="text-white/20 text-xs mt-1">Pending analysis</p>
          )}
        </div>

        {/* Actions */}
        <div className="flex items-center gap-1.5 flex-shrink-0">
          {item.result && (
            <button
              onClick={() => setExpanded(!expanded)}
              className="w-7 h-7 rounded-lg border border-white/10 flex items-center justify-center text-white/30 hover:text-white/70 transition-all"
              style={{ background: "rgba(255,255,255,0.05)" }}
            >
              {expanded ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
            </button>
          )}
          <button
            onClick={() => onRemove(item.id)}
            className="w-7 h-7 rounded-lg border border-white/10 flex items-center justify-center text-white/30 hover:text-red-400 hover:border-red-500/30 transition-all"
            style={{ background: "rgba(255,255,255,0.05)" }}
          >
            <X size={12} />
          </button>
        </div>
      </div>

      {/* Expanded Result */}
      {expanded && item.result && (
        <div className="px-3 sm:px-4 pb-4 pt-1 border-t border-white/8 space-y-3">
          <div>
            <div className="flex justify-between mb-1.5">
              <span className="text-white/40 font-mono text-xs">
                Confidence
              </span>
              <span className={`font-mono text-xs ${c.text}`}>
                {item.result.confidence.toFixed(2)}%
              </span>
            </div>
            <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
              <div
                className={`h-full ${c.bar} rounded-full`}
                style={{ width: `${item.result.confidence}%` }}
              />
            </div>
          </div>
          <div className="space-y-2">
            {ALL_CLASSES.map((cls, i) => {
              const pct = item.result.raw_prediction?.[i] || 0;
              const cc = CLASS_COLORS[cls];
              const isTop = cls === item.result.predicted_class;
              return (
                <div key={cls} className="flex items-center gap-2">
                  <span
                    className={`font-body text-xs w-28 flex-shrink-0 ${isTop ? "text-white" : "text-white/30"}`}
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
                    className={`font-mono text-xs w-14 text-right ${isTop ? cc.text : "text-white/20"}`}
                  >
                    {pct.toFixed(2)}%
                  </span>
                </div>
              );
            })}
          </div>
          {item.result.class_info?.description && (
            <p className="text-white/30 font-body text-xs leading-relaxed border-t border-white/8 pt-3">
              {item.result.class_info.description}
            </p>
          )}
        </div>
      )}
    </div>
  );
}

export default function Upload() {
  const [items, setItems] = useState([]);
  const [analyzing, setAnalyzing] = useState(false);
  const [sessionName, setSessionName] = useState("");
  const [editingName, setEditingName] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const defaultSessionName = () =>
    `Session ${new Date().toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" })}`;

  const onDrop = useCallback((accepted) => {
    const newItems = accepted.map((file) => ({
      id: Math.random().toString(36).slice(2),
      file,
      preview: URL.createObjectURL(file),
      loading: false,
      result: null,
      error: null,
    }));
    setItems((prev) => [...prev, ...newItems]);
    setSaved(false);
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { "image/*": [".jpg", ".jpeg", ".png"] },
    maxFiles: 20,
  });

  const removeItem = (id) => {
    setItems((prev) => prev.filter((i) => i.id !== id));
    setSaved(false);
  };

  const analyzeOne = async (item) => {
    setItems((prev) =>
      prev.map((i) =>
        i.id === item.id ? { ...i, loading: true, error: null } : i,
      ),
    );
    try {
      const formData = new FormData();
      formData.append("file", item.file);
      const res = await api.post("/predict", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      setItems((prev) =>
        prev.map((i) =>
          i.id === item.id ? { ...i, loading: false, result: res.data } : i,
        ),
      );
    } catch (err) {
      setItems((prev) =>
        prev.map((i) =>
          i.id === item.id
            ? {
                ...i,
                loading: false,
                error: err.response?.data?.detail || "Failed to analyze",
              }
            : i,
        ),
      );
    }
  };

  const analyzeAll = async () => {
    const pending = items.filter((i) => !i.result && !i.loading);
    if (!pending.length) return;
    setAnalyzing(true);
    setSaved(false);
    for (const item of pending) {
      await analyzeOne(item);
    }
    setAnalyzing(false);
  };

  const saveSession = async () => {
    const done = items.filter((i) => i.result);
    if (!done.length) return;
    setSaving(true);
    try {
      const scans = done.map((i) => ({
        filename: i.file.name,
        predicted_class: i.result.predicted_class,
        confidence: i.result.confidence,
        raw_prediction: i.result.raw_prediction,
        class_info: i.result.class_info,
        image_base64: i.result.image_base64,
      }));
      await api.post("/sessions", {
        session_name: sessionName || defaultSessionName(),
        scans,
      });
      setSaved(true);
    } catch (err) {
      alert("Failed to save session");
    } finally {
      setSaving(false);
    }
  };

  const clearAll = () => {
    setItems([]);
    setSaved(false);
    setSessionName("");
  };

  const pending = items.filter((i) => !i.result && !i.loading);
  const done = items.filter((i) => i.result);
  const loadingItems = items.filter((i) => i.loading);
  const allDone = items.length > 0 && done.length === items.length;

  return (
    <div className="max-w-6xl mx-auto px-3 sm:px-6 py-6 sm:py-10">
      {/* Header */}
      <div className="mb-6 flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="font-display text-2xl sm:text-3xl font-700 text-white">
            MRI Scan Analysis
          </h1>
          <p className="text-white/40 font-body mt-1 text-sm">
            Upload multiple MRI images — analyze and save as a session
          </p>
        </div>
        {done.length > 0 && (
          <div className="flex items-center gap-2">
            {saved ? (
              <span className="flex items-center gap-1.5 text-green-400 text-sm font-mono">
                <CheckCircle size={14} /> Session saved
              </span>
            ) : (
              <button
                onClick={saveSession}
                disabled={saving}
                className="btn-primary flex items-center gap-2 text-sm py-2.5"
              >
                {saving ? (
                  <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <Save size={14} />
                )}
                {saving ? "Saving..." : "Save Session"}
              </button>
            )}
          </div>
        )}
      </div>

      {/* Session name editor */}
      {items.length > 0 && (
        <div className="mb-4 flex items-center gap-2">
          {editingName ? (
            <input
              autoFocus
              value={sessionName}
              onChange={(e) => setSessionName(e.target.value)}
              onBlur={() => setEditingName(false)}
              onKeyDown={(e) => e.key === "Enter" && setEditingName(false)}
              placeholder={defaultSessionName()}
              className="input-field text-sm py-2 max-w-xs"
            />
          ) : (
            <button
              onClick={() => setEditingName(true)}
              className="flex items-center gap-2 text-white/40 hover:text-white/70 transition-colors text-sm font-body"
            >
              <Edit2 size={12} />
              <span>{sessionName || defaultSessionName()}</span>
            </button>
          )}
        </div>
      )}

      {/* Drop zone */}
      <div
        {...getRootProps()}
        className={`rounded-2xl border-2 border-dashed p-6 sm:p-10 text-center cursor-pointer transition-all duration-300 mb-4 ${
          isDragActive
            ? "border-brand-400 bg-brand-500/10"
            : "border-white/15 hover:border-brand-500/40 hover:bg-brand-500/5"
        }`}
      >
        <input {...getInputProps()} />
        <div className="flex flex-col items-center gap-3">
          <div
            className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl flex items-center justify-center border border-brand-500/20"
            style={{ background: "rgba(26,171,161,0.1)" }}
          >
            <UploadCloud size={22} className="text-brand-400" />
          </div>
          <div>
            <p className="font-display font-600 text-white text-sm sm:text-base">
              {isDragActive ? "Drop images here" : "Drop MRI images here"}
            </p>
            <p className="text-white/30 font-body text-xs sm:text-sm mt-1">
              or click to browse — multiple files supported
            </p>
            <p className="text-white/15 font-mono text-xs mt-2">
              JPG · JPEG · PNG · up to 20 files
            </p>
          </div>
        </div>
      </div>

      {/* Toolbar */}
      {items.length > 0 && (
        <div className="flex items-center justify-between gap-3 mb-4 flex-wrap">
          <div className="flex items-center gap-2 text-xs font-mono text-white/30">
            <span>
              {items.length} image{items.length !== 1 ? "s" : ""}
            </span>
            {done.length > 0 && (
              <span className="text-green-400">· {done.length} done</span>
            )}
            {loadingItems.length > 0 && (
              <span className="text-brand-400">
                · {loadingItems.length} analyzing
              </span>
            )}
            {pending.length > 0 && (
              <span className="text-white/20">· {pending.length} pending</span>
            )}
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={clearAll}
              disabled={analyzing}
              className="btn-ghost flex items-center gap-1.5 text-xs py-2 px-3"
            >
              <RefreshCw size={12} />
              Clear All
            </button>
            {pending.length > 0 && (
              <button
                onClick={analyzeAll}
                disabled={analyzing}
                className="btn-primary flex items-center gap-1.5 text-xs py-2 px-4"
              >
                {analyzing ? (
                  <div className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <Zap size={13} />
                )}
                {analyzing ? "Analyzing..." : `Analyze All (${pending.length})`}
              </button>
            )}
          </div>
        </div>
      )}

      {/* Items grid */}
      {items.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3">
          {items.map((item) => (
            <ScanCard key={item.id} item={item} onRemove={removeItem} />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-2">
          <div className="card">
            <h3 className="font-display font-600 text-white/50 text-xs uppercase tracking-wider mb-3">
              How it works
            </h3>
            <ul className="space-y-2">
              {[
                "Upload one or multiple MRI brain scan images",
                'Click "Analyze All" to classify all at once',
                "Give your session a name (optional)",
                'Click "Save Session" to store it in Reports',
              ].map((tip, i) => (
                <li
                  key={i}
                  className="flex items-start gap-2 text-white/35 font-body text-sm"
                >
                  <span className="text-brand-500 font-mono text-xs mt-0.5">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  {tip}
                </li>
              ))}
            </ul>
          </div>
          <div className="card flex flex-col items-center justify-center gap-3 min-h-[140px]">
            <div
              className="w-12 h-12 rounded-2xl flex items-center justify-center"
              style={{ background: "rgba(255,255,255,0.03)" }}
            >
              <BarChart2 size={20} className="text-white/15" />
            </div>
            <div className="text-center">
              <p className="font-display font-500 text-white/20 text-sm">
                Results saved as sessions
              </p>
              <p className="text-white/15 font-body text-xs mt-1">
                Each batch you save appears in Reports
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Summary when all done */}
      {allDone && (
        <div
          className="mt-6 card border border-brand-500/20"
          style={{ background: "rgba(26,171,161,0.05)" }}
        >
          <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
            <div className="flex items-center gap-2">
              <CheckCircle size={15} className="text-brand-400" />
              <span className="text-brand-400 font-mono text-xs uppercase tracking-wider">
                Analysis Complete — {done.length} image
                {done.length !== 1 ? "s" : ""}
              </span>
            </div>
            {!saved && (
              <button
                onClick={saveSession}
                disabled={saving}
                className="btn-primary flex items-center gap-2 text-xs py-2 px-3"
              >
                {saving ? (
                  <div className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <Save size={13} />
                )}
                {saving ? "Saving..." : "Save Session"}
              </button>
            )}
            {saved && (
              <Link
                to="/reports"
                className="text-green-400 text-xs font-mono flex items-center gap-1.5 hover:text-green-300 transition-colors"
              >
                <CheckCircle size={12} /> View in Reports →
              </Link>
            )}
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {ALL_CLASSES.map((cls) => {
              const count = done.filter(
                (i) => i.result.predicted_class === cls,
              ).length;
              const cc = CLASS_COLORS[cls];
              return (
                <div
                  key={cls}
                  className={`rounded-xl p-3 border ${cc.border} ${cc.bg} text-center`}
                >
                  <p className={`font-display text-xl font-700 ${cc.text}`}>
                    {count}
                  </p>
                  <p className="text-white/40 font-body text-xs mt-0.5">
                    {cls}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      )}

      <p className="text-white/15 font-body text-xs text-center mt-6">
        ⚠️ For educational purposes only. Not a medical diagnosis.
      </p>
    </div>
  );
}
