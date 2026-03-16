import { Shield, Twitter, Github, Linkedin } from 'lucide-react';

const Footer = () => {
  return (
    <footer className="py-20 bg-slate-950 border-t border-white/5">
      <div className="container px-6 mx-auto max-w-7xl">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12">
          <div className="col-span-1 md:col-span-2">
            <div className="flex items-center gap-2 mb-6">
              <Shield className="w-6 h-6 text-blue-500" />
              <span className="text-xl font-bold text-white">CivicAI</span>
            </div>
            <p className="text-slate-400 max-w-sm mb-8">
              The intelligent infrastructure layer for modern cities. 
              Bridging the gap between citizen reporting and departmental action.
            </p>
            <div className="flex gap-4">
              <a href="#" className="p-2 glass rounded-lg hover:bg-white/10 transition-colors text-slate-400 hover:text-white">
                <Twitter className="w-5 h-5" />
              </a>
              <a href="#" className="p-2 glass rounded-lg hover:bg-white/10 transition-colors text-slate-400 hover:text-white">
                <Github className="w-5 h-5" />
              </a>
              <a href="#" className="p-2 glass rounded-lg hover:bg-white/10 transition-colors text-slate-400 hover:text-white">
                <Linkedin className="w-5 h-5" />
              </a>
            </div>
          </div>

          <div>
            <h4 className="text-white font-bold mb-6">Platform</h4>
            <ul className="space-y-4 text-slate-400 text-sm">
              <li><a href="#features" className="hover:text-white transition-colors">Features</a></li>
              <li><a href="#how-it-works" className="hover:text-white transition-colors">How it Works</a></li>
              <li><a href="#" className="hover:text-white transition-colors">Security</a></li>
              <li><a href="#" className="hover:text-white transition-colors">Roadmap</a></li>
            </ul>
          </div>

          <div>
            <h4 className="text-white font-bold mb-6">Company</h4>
            <ul className="space-y-4 text-slate-400 text-sm">
              <li><a href="#" className="hover:text-white transition-colors">About Us</a></li>
              <li><a href="#" className="hover:text-white transition-colors">Contact</a></li>
              <li><a href="#" className="hover:text-white transition-colors">Privacy Policy</a></li>
              <li><a href="#" className="hover:text-white transition-colors">Terms of Service</a></li>
            </ul>
          </div>
        </div>

        <div className="mt-20 pt-8 border-t border-white/5 text-center text-slate-500 text-sm">
          <p>© {new Date().getFullYear()} CivicAI. Built for Hackathons, Scaling for Cities.</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
