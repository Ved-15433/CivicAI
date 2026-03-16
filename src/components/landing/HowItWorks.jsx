import { motion } from 'framer-motion';
import { Camera, Brain, BarChart3, Send } from 'lucide-react';

const steps = [
  {
    icon: <Camera className="w-6 h-6" />,
    title: "Report",
    description: "Citizen snaps a photo and describes the issue through our simple interface.",
    color: "bg-blue-500"
  },
  {
    icon: <Brain className="w-6 h-6" />,
    title: "Analyze",
    description: "Gemini AI analyzes the image and text to identify severity and impact.",
    color: "bg-purple-500"
  },
  {
    icon: <BarChart3 className="w-6 h-6" />,
    title: "Rank",
    description: "Our scoring engine calculates a priority rank based on public safety.",
    color: "bg-indigo-500"
  },
  {
    icon: <Send className="w-6 h-6" />,
    title: "Route",
    description: "The issue is automatically dispatched to the relevant city department.",
    color: "bg-emerald-500"
  }
];

const HowItWorks = () => {
  return (
    <section id="how-it-works" className="py-24 relative">
      <div className="container px-6 mx-auto max-w-7xl">
        <div className="text-center mb-16">
          <h2 className="text-3xl font-bold text-white md:text-5xl">How CivicAI Works</h2>
          <p className="mt-4 text-slate-400 max-w-2xl mx-auto">
            A seamless intelligence layer between your citizens and your city departments.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {steps.map((step, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
              className="relative p-8 rounded-3xl glass hover:bg-white/5 transition-colors group"
            >
              <div className={`w-12 h-12 rounded-2xl ${step.color} flex items-center justify-center text-white mb-6 shadow-lg shadow-${step.color.split('-')[1]}-500/20 group-hover:scale-110 transition-transform`}>
                {step.icon}
              </div>
              <h3 className="text-xl font-bold text-white mb-3">{step.title}</h3>
              <p className="text-slate-400 leading-relaxed text-sm">
                {step.description}
              </p>
              
              {index < steps.length - 1 && (
                 <div className="hidden lg:block absolute top-1/2 -right-4 w-8 h-[2px] bg-gradient-to-r from-white/10 to-transparent" />
              )}
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default HowItWorks;
