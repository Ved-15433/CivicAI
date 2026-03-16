import { motion } from 'framer-motion';
import { LayoutDashboard, Map, MessageSquare, Zap, Shield, Search } from 'lucide-react';

const features = [
  {
    icon: <Zap className="w-5 h-5" />,
    title: "Instant Triage",
    desc: "Reduce response times from days to minutes with automated AI scoring."
  },
  {
    icon: <Shield className="w-5 h-5" />,
    title: "Severity Detection",
    desc: "Gemini Vision identifies hazards like structural damage or safety risks."
  },
  {
    icon: <LayoutDashboard className="w-5 h-5" />,
    title: "Admin Dashboard",
    desc: "Comprehensive overview of department workloads and issue distribution."
  },
  {
    icon: <Map className="w-5 h-5" />,
    title: "Hotspot Mapping",
    desc: "Visualize where issues are occurring to optimize resource allocation."
  },
  {
    icon: <Search className="w-5 h-5" />,
    title: "Duplicate Detection",
    desc: "Intelligently group similar complaints to avoid redundant efforts."
  },
  {
    icon: <MessageSquare className="w-5 h-5" />,
    title: "AI Summaries",
    desc: "Auto-generated summaries help officials understand the core issue fast."
  }
];

const Features = () => {
  return (
    <section id="features" className="py-24 bg-white/5">
      <div className="container px-6 mx-auto max-w-7xl">
        <div className="text-center mb-16">
          <h2 className="text-3xl font-bold text-white md:text-5xl">Built for Scale</h2>
          <p className="mt-4 text-slate-400">Everything you need to modernize your city's infrastructure.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, scale: 0.95 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
              className="p-8 rounded-3xl border border-white/5 bg-slate-900/50 hover:border-blue-500/30 transition-all duration-300 group"
            >
              <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center text-blue-400 mb-6 group-hover:bg-blue-600 group-hover:text-white transition-colors">
                {feature.icon}
              </div>
              <h3 className="text-xl font-bold text-white mb-2">{feature.title}</h3>
              <p className="text-slate-400 text-sm leading-relaxed">
                {feature.desc}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Features;
