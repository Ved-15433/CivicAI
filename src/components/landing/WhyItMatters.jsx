import { motion } from 'framer-motion';
import { TrendingUp, Clock, Users } from 'lucide-react';

const WhyItMatters = () => {
  return (
    <section className="py-24 relative overflow-hidden">
      <div className="container px-6 mx-auto max-w-7xl">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          <div>
            <h2 className="text-3xl font-bold text-white md:text-5xl leading-tight">
              Transforming Civic <br />
              <span className="text-blue-500">Infrastructure</span>
            </h2>
            <p className="mt-6 text-slate-400 text-lg">
              Outdated systems rely on manual triaging that leads to dangerous delays. 
              CivicAI brings silicon-speed intelligence to physical governance.
            </p>

            <div className="mt-10 space-y-8">
              <div className="flex gap-4">
                <div className="flex-shrink-0 w-12 h-12 rounded-2xl glass flex items-center justify-center text-blue-400">
                  <Clock className="w-6 h-6" />
                </div>
                <div>
                  <h4 className="text-xl font-bold text-white">80% Faster Triage</h4>
                  <p className="text-slate-400 text-sm mt-1">AI identifies critical hazards instantly, bypassing administrative bottlenecks.</p>
                </div>
              </div>
              <div className="flex gap-4">
                <div className="flex-shrink-0 w-12 h-12 rounded-2xl glass flex items-center justify-center text-purple-400">
                  <TrendingUp className="w-6 h-6" />
                </div>
                <div>
                  <h4 className="text-xl font-bold text-white">Resource Optimization</h4>
                  <p className="text-slate-400 text-sm mt-1">Route the right crews to the right locations based on real-world impact data.</p>
                </div>
              </div>
              <div className="flex gap-4">
                <div className="flex-shrink-0 w-12 h-12 rounded-2xl glass flex items-center justify-center text-emerald-400">
                  <Users className="w-6 h-6" />
                </div>
                <div>
                  <h4 className="text-xl font-bold text-white">Citizen Trust</h4>
                  <p className="text-slate-400 text-sm mt-1">Transparent real-time status updates keep the public informed and engaged.</p>
                </div>
              </div>
            </div>
          </div>

          <div className="relative">
            <div className="absolute inset-0 bg-blue-500/20 blur-[100px] rounded-full" />
            <motion.div
              initial={{ rotate: 10, opacity: 0 }}
              whileInView={{ rotate: 5, opacity: 1 }}
              viewport={{ once: true }}
              className="relative p-8 glass rounded-3xl border border-white/10"
            >
               <div className="space-y-4">
                 <div className="h-4 w-1/2 bg-white/10 rounded-full" />
                 <div className="h-4 w-3/4 bg-white/10 rounded-full" />
                 <div className="h-32 w-full bg-blue-500/20 rounded-2xl border border-blue-500/20 flex items-center justify-center">
                    <span className="text-blue-400 text-sm font-semibold tracking-widest uppercase">Predictive Analysis</span>
                 </div>
                 <div className="h-4 w-2/3 bg-white/10 rounded-full" />
               </div>
            </motion.div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default WhyItMatters;
