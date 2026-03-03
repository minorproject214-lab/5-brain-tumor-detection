import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import {
  Brain,
  Upload,
  FileText,
  Shield,
  Zap,
  Target,
  ChevronRight,
  Activity,
} from "lucide-react";

const TUMOR_TYPES = [
  {
    name: "Glioma",
    description:
      "Tumors arising from glial cells. Among the most common primary brain tumors affecting the brain and spine.",
    severity: "High Risk",
    color: "text-red-400",
    bg: "bg-red-500/10",
    border: "border-red-500/20",
  },
  {
    name: "Meningioma",
    description:
      "Arise from the meninges surrounding the brain. Most are benign and slow-growing with good prognosis.",
    severity: "Medium Risk",
    color: "text-orange-400",
    bg: "bg-orange-500/10",
    border: "border-orange-500/20",
  },
  {
    name: "No Tumor",
    description:
      "Normal MRI scan with no detectable tumor or abnormal growth patterns in the brain tissue.",
    severity: "Clear",
    color: "text-green-400",
    bg: "bg-green-500/10",
    border: "border-green-500/20",
  },
  {
    name: "Pituitary Tumor",
    description:
      "Form in the pituitary gland at the base of the brain. Usually benign adenomas with effective treatments.",
    severity: "Medium Risk",
    color: "text-purple-400",
    bg: "bg-purple-500/10",
    border: "border-purple-500/20",
  },
];

const FEATURES = [
  {
    icon: Zap,
    title: "Instant Analysis",
    desc: "Get classification results in under 2 seconds using our trained CNN model.",
  },
  {
    icon: Target,
    title: "4-Class Detection",
    desc: "Identifies Glioma, Meningioma, Pituitary tumors, or confirms No Tumor.",
  },
  {
    icon: Shield,
    title: "Secure & Private",
    desc: "All scans are encrypted and stored securely in your personal account.",
  },
  {
    icon: Activity,
    title: "Confidence Scores",
    desc: "Receive probability scores for each class alongside the prediction.",
  },
];

export default function Home() {
  const { user } = useAuth();

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-10 space-y-16">
      {/* Hero */}
      <section className="relative text-center py-12">
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-brand-500/8 rounded-full blur-3xl" />
        </div>
        <div className="relative">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full glass border border-brand-500/20 text-brand-400 text-xs font-mono mb-6">
            <span className="w-1.5 h-1.5 rounded-full bg-brand-400 animate-pulse" />
            AI-Powered MRI Classification
          </div>
          <h1 className="font-display text-4xl sm:text-5xl md:text-6xl font-800 text-white leading-tight mb-4">
            Detect Brain Tumors
            <br />
            <span className="text-brand-400 text-glow">With Precision</span>
          </h1>
          <p className="text-white/40 font-body text-lg max-w-xl mx-auto leading-relaxed mb-8">
            Upload an MRI scan and get instant AI-powered classification across
            4 tumor types using our trained deep learning model.
          </p>
          <div className="flex items-center justify-center gap-3 flex-wrap">
            <Link to="/upload" className="btn-primary flex items-center gap-2">
              <Upload size={16} />
              Upload MRI Scan
            </Link>
            <Link to="/reports" className="btn-ghost flex items-center gap-2">
              <FileText size={16} />
              View Reports
            </Link>
          </div>
        </div>
      </section>

      {/* Features */}
      <section>
        <div className="text-center mb-8">
          <h2 className="font-display text-2xl font-700 text-white">
            How it works
          </h2>
          <p className="text-white/30 font-body mt-2 text-sm">
            Powered by a CNN model trained on 3,000+ MRI images
          </p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {FEATURES.map(({ icon: Icon, title, desc }) => (
            <div key={title} className="card glass-hover group">
              <div className="w-10 h-10 rounded-xl bg-brand-500/15 border border-brand-500/20 flex items-center justify-center mb-4 group-hover:bg-brand-500/25 transition-all">
                <Icon size={18} className="text-brand-400" />
              </div>
              <h3 className="font-display font-600 text-white mb-2">{title}</h3>
              <p className="text-white/40 font-body text-sm leading-relaxed">
                {desc}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* Tumor Types */}
      <section>
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="font-display text-2xl font-700 text-white">
              Detectable Conditions
            </h2>
            <p className="text-white/30 font-body mt-1 text-sm">
              Four classification categories
            </p>
          </div>
          <Link
            to="/upload"
            className="hidden sm:flex items-center gap-1.5 text-brand-400 hover:text-brand-300 text-sm font-display font-medium transition-colors"
          >
            Scan Now <ChevronRight size={14} />
          </Link>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {TUMOR_TYPES.map((t) => (
            <div
              key={t.name}
              className={`card glass-hover border ${t.border} group`}
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div
                    className={`w-9 h-9 rounded-lg ${t.bg} border ${t.border} flex items-center justify-center`}
                  >
                    <Brain size={16} className={t.color} />
                  </div>
                  <h3 className="font-display font-600 text-white">{t.name}</h3>
                </div>
                <span
                  className={`text-xs font-mono px-2.5 py-1 rounded-full ${t.bg} ${t.color} border ${t.border}`}
                >
                  {t.severity}
                </span>
              </div>
              <p className="text-white/40 font-body text-sm leading-relaxed">
                {t.description}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="card text-center py-12 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-brand-500/8 to-transparent" />
        <div className="relative">
          <h2 className="font-display text-2xl sm:text-3xl font-700 text-white mb-3">
            Ready to analyze an MRI?
          </h2>
          <p className="text-white/40 font-body mb-6 max-w-md mx-auto">
            Upload your MRI image and get an instant classification result with
            confidence scores.
          </p>
          <Link
            to="/upload"
            className="btn-primary inline-flex items-center gap-2"
          >
            <Upload size={16} />
            Start Scanning
          </Link>
        </div>
      </section>

      {/* Disclaimer */}
      <p className="text-center text-white/20 text-xs font-body pb-4">
        ⚠️ This is an educational AI tool. Results should not be used as medical
        diagnosis. Always consult a qualified physician.
      </p>
    </div>
  );
}
