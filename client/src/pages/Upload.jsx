import { useState, useCallback } from "react";
import { useDropzone } from "react-dropzone";
import {
  UploadCloud,
  Brain,
  CheckCircle,
  X,
  BarChart2,
  RefreshCw,
  ChevronDown,
  ChevronUp,
  Zap,
  Save,
  Edit2,
  AlertTriangle,
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

const CLASS_INFO = {
  Glioma:
    "Gliomas arise from glial cells in the brain or spine. Among the most common primary brain tumors.",
  Meningioma:
    "Meningiomas arise from the meninges. Most are benign and slow-growing with good prognosis.",
  "No Tumor":
    "No tumor detected. The brain appears normal with no signs of abnormal growth.",
  "Pituitary Tumor":
    "Form in the pituitary gland at the base of the brain. Usually benign and treatable.",
};

function ScanCard({ item, onRemove, onClassify }) {
  const [expanded, setExpanded] = useState(false);
  const c = item.predicted_class ? CLASS_COLORS[item.predicted_class] : null;

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
          {item.predicted_class && (
            <div
              className={`absolute inset-0 ${c.bg} flex items-center justify-center`}
            >
              <CheckCircle size={16} className={c.text} />
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
          {item.predicted_class ? (
            <div className="flex items-center gap-2 mt-1">
              <span
                className={`text-xs font-mono px-1.5 py-0.5 rounded ${c.bg} ${c.text} border ${c.border}`}
              >
                {item.predicted_class}
              </span>
            </div>
          ) : (
            /* Class selector */
            <select
              onChange={(e) =>
                e.target.value && onClassify(item.id, e.target.value)
              }
              defaultValue=""
              className="mt-1.5 text-xs font-mono rounded-lg px-2 py-1 border border-white/10 text-white/50 focus:outline-none focus:border-brand-500/40"
              style={{ background: "rgba(255,255,255,0.05)" }}
            >
              <option value="" disabled>
                Select class...
              </option>
              {ALL_CLASSES.map((cls) => (
                <option key={cls} value={cls} style={{ background: "#0d1f1f" }}>
                  {cls}
                </option>
              ))}
            </select>
          )}
        </div>

        {/* Actions */}
        <div className="flex items-center gap-1.5 flex-shrink-0">
          {item.predicted_class && (
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

      {/* Expanded info */}
      {expanded && item.predicted_class && (
        <div className="px-3 sm:px-4 pb-4 pt-1 border-t border-white/8">
          <p className="text-white/30 font-body text-xs leading-relaxed">
            {CLASS_INFO[item.predicted_class]}
          </p>
          <button
            onClick={() => onClassify(item.id, null)}
            className="mt-2 text-xs text-white/20 hover:text-white/50 font-mono transition-colors"
          >
            ← Change classification
          </button>
        </div>
      )}
    </div>
  );
}

export default function Upload() {
  const [items, setItems] = useState([]);
  const [sessionName, setSessionName] = useState("");
  const [editingName, setEditingName] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const defaultSessionName = () =>
    `Session ${new Date().toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })}`;

  const onDrop = useCallback((accepted) => {
    const newItems = accepted.map((file) => ({
      id: Math.random().toString(36).slice(2),
      file,
      preview: URL.createObjectURL(file),
      predicted_class: null,
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

  const classifyItem = (id, cls) => {
    setItems((prev) =>
      prev.map((i) => (i.id === id ? { ...i, predicted_class: cls } : i)),
    );
    setSaved(false);
  };

  const clearAll = () => {
    setItems([]);
    setSaved(false);
    setSessionName("");
  };

  const toBase64 = (file) =>
    new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result.split(",")[1]);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });

  const saveSession = async () => {
    const classified = items.filter((i) => i.predicted_class);
    if (!classified.length) return;
    setSaving(true);
    try {
      const scans = await Promise.all(
        classified.map(async (i) => ({
          filename: i.file.name,
          predicted_class: i.predicted_class,
          confidence: null,
          raw_prediction: [],
          class_info: { description: CLASS_INFO[i.predicted_class] },
          image_base64: await toBase64(i.file),
        })),
      );
      await api.post("/sessions", {
        session_name: sessionName || defaultSessionName(),
        scans,
      });
      setSaved(true);
    } catch {
      alert("Failed to save session");
    } finally {
      setSaving(false);
    }
  };

  const classified = items.filter((i) => i.predicted_class);
  const unclassified = items.filter((i) => !i.predicted_class);
  const allClassified = items.length > 0 && classified.length === items.length;

  return (
    <div className="max-w-6xl mx-auto px-3 sm:px-6 py-6 sm:py-10">
      {/* Header */}
      <div className="mb-6 flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="font-display text-2xl sm:text-3xl font-700 text-white">
            MRI Scan Upload
          </h1>
          <p className="text-white/40 font-body mt-1 text-sm">
            Upload MRI images, classify each one, then save as a session
          </p>
        </div>
        {classified.length > 0 && (
          <div className="flex items-center gap-2">
            {saved ? (
              <Link
                to="/reports"
                className="flex items-center gap-1.5 text-green-400 text-sm font-mono hover:text-green-300 transition-colors"
              >
                <CheckCircle size={14} /> View in Reports →
              </Link>
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

      {/* Session name */}
      {items.length > 0 && (
        <div className="mb-4">
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
              className="flex items-center gap-2 text-white/35 hover:text-white/60 transition-colors text-sm font-body"
            >
              <Edit2 size={12} />
              {sessionName || defaultSessionName()}
            </button>
          )}
        </div>
      )}

      {/* Dropzone */}
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
            className="w-12 h-12 rounded-2xl flex items-center justify-center border border-brand-500/20"
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
            {classified.length > 0 && (
              <span className="text-green-400">
                · {classified.length} classified
              </span>
            )}
            {unclassified.length > 0 && (
              <span className="text-white/20">
                · {unclassified.length} pending
              </span>
            )}
          </div>
          <button
            onClick={clearAll}
            className="btn-ghost flex items-center gap-1.5 text-xs py-2 px-3"
          >
            <RefreshCw size={12} />
            Clear All
          </button>
        </div>
      )}

      {/* Notice */}
      {items.length > 0 && unclassified.length > 0 && (
        <div
          className="mb-4 flex items-center gap-2 px-3 py-2.5 rounded-xl border border-brand-500/20 text-brand-400 text-xs font-body"
          style={{ background: "rgba(26,171,161,0.05)" }}
        >
          <AlertTriangle size={13} />
          Select a classification for each image using the dropdown, then save
          as a session.
        </div>
      )}

      {/* Grid */}
      {items.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3">
          {items.map((item) => (
            <ScanCard
              key={item.id}
              item={item}
              onRemove={removeItem}
              onClassify={classifyItem}
            />
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
                "Select the classification for each image",
                "Give your session a name (optional)",
                'Click "Save Session" to store in Reports',
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
                Sessions saved to Reports
              </p>
              <p className="text-white/15 font-body text-xs mt-1">
                Each saved batch appears in your Reports page
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Summary */}
      {allClassified && !saved && (
        <div
          className="mt-6 card border border-brand-500/20"
          style={{ background: "rgba(26,171,161,0.05)" }}
        >
          <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
            <div className="flex items-center gap-2">
              <CheckCircle size={15} className="text-brand-400" />
              <span className="text-brand-400 font-mono text-xs uppercase tracking-wider">
                All {items.length} images classified
              </span>
            </div>
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
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {ALL_CLASSES.map((cls) => {
              const count = classified.filter(
                (i) => i.predicted_class === cls,
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
