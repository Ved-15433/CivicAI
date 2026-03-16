import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Camera, MapPin, Send, ArrowLeft, Loader2, CheckCircle2, Brain, Sparkles, AlertCircle, Clock, Users } from 'lucide-react';
import { supabase } from '../lib/supabase';
import BackgroundEffects from '../components/landing/BackgroundEffects';
import { Link } from 'react-router-dom';

const ReportIssue = () => {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [aiProcessing, setAiProcessing] = useState(false);
  const [image, setImage] = useState(null);
  const [preview, setPreview] = useState(null);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [aiResult, setAiResult] = useState(null);
  const [errorState, setErrorState] = useState(null);
  const [location, setLocation] = useState({ lat: null, lng: null, label: '' });
  const [locating, setLocating] = useState(false);
  const [isManualLocation, setIsManualLocation] = useState(false);

  const detectLocation = () => {
    setLocating(true);
    if (!navigator.geolocation) {
      setErrorState("Geolocation is not supported by your browser");
      setLocating(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        const address = await fetchAddress(latitude, longitude);
        setLocation({ lat: latitude, lng: longitude, label: address });
        setLocating(false);
      },
      (error) => {
        console.error("Geolocation error:", error);
        setErrorState("Unable to retrieve your location. Please enter it manually.");
        setLocating(false);
      }
    );
  };

  const fetchAddress = async (lat, lng) => {
    try {
      const response = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`);
      const data = await response.json();
      return data.display_name || `${lat.toFixed(4)}, ${lng.toFixed(4)}`;
    } catch (err) {
      return `${lat.toFixed(4)}, ${lng.toFixed(4)}`;
    }
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setImage(file);
      setPreview(URL.createObjectURL(file));
      setStep(2);
    }
  };

  const handleSubmit = async () => {
    setLoading(true);
    try {
      // 1. Upload Image to Supabase Storage
      let imageUrl = null;
      if (image) {
        const fileExt = image.name.split('.').pop();
        const fileName = `${Math.random()}.${fileExt}`;
        const { error: uploadError, data } = await supabase.storage
          .from('complaint-images')
          .upload(fileName, image);
        
        if (uploadError) throw uploadError;
        imageUrl = data.path;
      }

      // 2. Submit Complaint to Database
      const { data: { user } } = await supabase.auth.getUser();
      console.log(`[SUBMIT] Attempting insert for user: ${user?.id || 'anonymous'}`);

      const { data: complaint, error: dbError } = await supabase
        .from('complaints')
        .insert({
          title: title || description.substring(0, 30) + '...',
          description: description,
          image_url: imageUrl,
          status: 'pending',
          user_id: user?.id || null,
          analysis_status: 'pending',
          latitude: location.lat,
          longitude: location.lng,
          location_label: location.label
        })
        .select()
        .single();

      if (dbError) throw dbError;
      console.log(`[SUBMIT] Complaint created: ${complaint.id}. Calling AI...`);

      // 3. Trigger AI Processing
      setAiProcessing(true);
      
      try {
        const { data: aiResponse, error: aiError } = await supabase.functions.invoke('process-complaint', {
          body: { complaint_id: complaint.id }
        });

        if (aiError) throw aiError;

        if (!aiResponse?.success) {
          throw new Error(aiResponse?.error || "AI returned unsuccessful status");
        }

        console.log(`[SUBMIT] AI Success for ${complaint.id}:`, aiResponse.data);
        setAiResult(aiResponse.data);
      } catch (invokeErr) {
        console.error(`[AI ERROR] Function invocation for ${complaint.id} failed:`, invokeErr);
        
        // Update DB to show failure instead of "Pending" forever
        await supabase
          .from('complaints')
          .update({ 
            analysis_status: 'failed', 
            error_message: invokeErr.message || "AI invocation failed" 
          })
          .eq('id', complaint.id);
          
        setAiResult(null);
      }

      setSubmitted(true);
    } catch (err) {
      console.error("Submission error:", err);
      setErrorState(err.message || "Connection failed. Please check your network.");
    } finally {
      setLoading(false);
      setAiProcessing(false);
    }
  };

  return (
    <div className="min-h-screen pt-20 pb-12 relative overflow-hidden selection:bg-blue-500/30">
      <BackgroundEffects />
      
      <div className="container px-6 mx-auto max-w-2xl relative z-10">
        <Link to="/" className="inline-flex items-center gap-2 text-slate-400 hover:text-white transition-colors mb-8 group">
          <ArrowLeft className="w-4 h-4 transition-transform group-hover:-translate-x-1" />
          Back to Home
        </Link>

        <div className="p-8 rounded-[2rem] glass border border-white/10 shadow-2xl bg-slate-900/40 backdrop-blur-xl relative overflow-hidden">
          {/* Progress Bar */}
          {!submitted && (
             <div className="absolute top-0 left-0 right-0 h-1 bg-white/5">
                <motion.div 
                  initial={{ width: 0 }}
                  animate={{ width: `${(step / 2) * 100}%` }}
                  className="h-full bg-blue-500 shadow-[0_0_10px_rgba(59,130,246,0.5)]"
                />
             </div>
          )}

          <AnimatePresence mode="wait">
            {!submitted ? (
              aiProcessing ? (
                <motion.div
                  key="ai-loading"
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 1.1 }}
                  className="py-20 flex flex-col items-center text-center"
                >
                  <div className="relative mb-8">
                     <motion.div
                       animate={{ rotate: 360 }}
                       transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
                       className="w-24 h-24 rounded-full border-t-2 border-b-2 border-blue-500"
                     />
                     <div className="absolute inset-0 flex items-center justify-center">
                        <Brain className="w-10 h-10 text-blue-400 animate-pulse" />
                     </div>
                     <motion.div
                       animate={{ opacity: [0, 1, 0], scale: [1, 1.2, 1] }}
                       transition={{ duration: 2, repeat: Infinity }}
                       className="absolute -top-2 -right-2 p-1 bg-blue-500/20 rounded-lg text-blue-400"
                     >
                        <Sparkles className="w-4 h-4" />
                     </motion.div>
                  </div>
                  <h2 className="text-2xl font-bold text-white mb-2">Analyzing with Gemini AI</h2>
                  <p className="text-slate-400 max-w-sm">Classifying issue type, calculating severity, and routing to the right department...</p>
                  
                  <div className="mt-8 space-y-3 w-full max-w-xs">
                     {[1,2,3].map(i => (
                       <div key={i} className="h-2 bg-white/5 rounded-full overflow-hidden">
                          <motion.div
                            animate={{ x: [-100, 300] }}
                            transition={{ duration: 1.5, repeat: Infinity, delay: i * 0.2 }}
                            className="w-24 h-full bg-gradient-to-r from-transparent via-blue-500/50 to-transparent"
                          />
                       </div>
                     ))}
                  </div>
                </motion.div>
              ) : (
                <motion.div
                  key="form"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                >
                  <div className="mb-8">
                    <h1 className="text-3xl font-bold text-white mb-2">Report an Issue</h1>
                    <p className="text-slate-400">Step {step}: {step === 1 ? 'Describe the problem' : 'Provide details'}</p>
                  </div>

                  {step === 1 && (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="space-y-6"
                    >
                      <label className="group relative flex flex-col items-center justify-center w-full h-72 border-2 border-dashed border-white/10 rounded-3xl cursor-pointer hover:border-blue-500/50 hover:bg-blue-500/5 transition-all duration-300">
                        {preview ? (
                           <div className="relative w-full h-full p-2">
                             <img src={preview} alt="Preview" className="w-full h-full object-cover rounded-2xl" />
                             <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center rounded-2xl">
                                <span className="text-white font-bold bg-white/10 px-4 py-2 rounded-full backdrop-blur-md">Change Photo</span>
                             </div>
                           </div>
                        ) : (
                          <div className="flex flex-col items-center justify-center pt-5 pb-6">
                            <div className="w-16 h-16 bg-blue-500/10 rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                              <Camera className="w-8 h-8 text-blue-400" />
                            </div>
                            <p className="mb-2 text-sm text-slate-300">
                              <span className="font-semibold">Tap to capture</span> or drag photo
                            </p>
                            <p className="text-xs text-slate-500 uppercase tracking-widest">Supports JPG, PNG, WEBP</p>
                          </div>
                        )}
                        <input type="file" className="hidden" accept="image/*" onChange={handleImageChange} />
                      </label>

                      <div className="space-y-4">
                        <div className="relative">
                          <textarea 
                            rows={3}
                            className="w-full bg-slate-950/50 border border-white/10 rounded-[1.5rem] p-5 text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all resize-none placeholder:text-slate-600"
                            placeholder="Briefly, what is the problem?"
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                          />
                        </div>
                        
                        <button 
                          onClick={() => setStep(2)}
                          disabled={!description && !image}
                          className="w-full py-4 bg-white/5 hover:bg-white/10 text-white rounded-2xl font-bold transition-all disabled:opacity-30 flex items-center justify-center gap-2 group"
                        >
                          Next Step
                        </button>
                      </div>
                    </motion.div>
                  )}

                  {step === 2 && (
                    <motion.div
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      className="space-y-6"
                    >
                      <div className="space-y-4">
                         <div className="space-y-2">
                            <label className="text-xs font-bold text-slate-500 uppercase tracking-widest px-1">Location Context</label>
                             <div className={`p-4 rounded-2xl bg-slate-950/50 border ${location.lat ? 'border-blue-500/50' : 'border-white/10'} space-y-4 transition-all duration-300`}>
                               <div className="flex items-center justify-between">
                                 <div className="flex items-center gap-4">
                                   <div className={`w-10 h-10 rounded-xl ${location.lat ? 'bg-blue-500 text-white' : 'bg-blue-500/10 text-blue-400'} flex items-center justify-center transition-all`}>
                                     {locating ? <Loader2 className="w-5 h-5 animate-spin" /> : <MapPin className="w-5 h-5" />}
                                   </div>
                                   <div>
                                     <p className="text-sm font-bold text-white">
                                       {location.label || (location.lat ? 'Location Captured' : 'Detect Location')}
                                     </p>
                                     <p className="text-xs text-slate-500">
                                       {location.lat ? `${location.lat.toFixed(4)}, ${location.lng.toFixed(4)}` : 'Auto-detect via GPS'}
                                     </p>
                                   </div>
                                 </div>
                                 <div className="flex gap-2">
                                   {!location.lat && !locating && (
                                     <button 
                                       onClick={detectLocation}
                                       className="text-xs font-bold text-blue-400 px-3 py-1 rounded-lg hover:bg-blue-400/10 transition-colors"
                                     >
                                       Detect
                                     </button>
                                   )}
                                   <button 
                                     onClick={() => setIsManualLocation(!isManualLocation)}
                                     className="text-xs font-bold text-slate-400 px-3 py-1 rounded-lg hover:bg-white/5 transition-colors"
                                   >
                                     {isManualLocation ? 'Hide' : 'Manual'}
                                   </button>
                                 </div>
                               </div>

                               {isManualLocation && (
                                 <motion.div 
                                   initial={{ opacity: 0, height: 0 }}
                                   animate={{ opacity: 1, height: 'auto' }}
                                   className="space-y-4 pt-4 border-t border-white/5"
                                 >
                                   <div className="grid grid-cols-2 gap-4">
                                     <div className="space-y-2">
                                       <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest pl-1">Latitude</label>
                                       <input 
                                         type="number" 
                                         step="any"
                                         className="w-full bg-slate-900 border border-white/10 rounded-xl p-3 text-white text-sm focus:ring-1 focus:ring-blue-500/50 outline-none"
                                         value={location.lat || ''}
                                         onChange={(e) => setLocation({...location, lat: parseFloat(e.target.value)})}
                                         placeholder="0.0000"
                                       />
                                     </div>
                                     <div className="space-y-2">
                                       <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest pl-1">Longitude</label>
                                       <input 
                                         type="number" 
                                         step="any"
                                         className="w-full bg-slate-900 border border-white/10 rounded-xl p-3 text-white text-sm focus:ring-1 focus:ring-blue-500/50 outline-none"
                                         value={location.lng || ''}
                                         onChange={(e) => setLocation({...location, lng: parseFloat(e.target.value)})}
                                         placeholder="0.0000"
                                       />
                                     </div>
                                   </div>
                                   <div className="space-y-2">
                                     <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest pl-1">Location Label / Address</label>
                                     <input 
                                       type="text" 
                                       className="w-full bg-slate-900 border border-white/10 rounded-xl p-3 text-white text-sm focus:ring-1 focus:ring-blue-500/50 outline-none"
                                       value={location.label || ''}
                                       onChange={(e) => setLocation({...location, label: e.target.value})}
                                       placeholder="e.g. Main Street near Central Park"
                                     />
                                   </div>
                                 </motion.div>
                               )}
                             </div>
                         </div>

                         <div className="space-y-2">
                            <label className="text-xs font-bold text-slate-500 uppercase tracking-widest px-1">Department Notification</label>
                            <div className="p-4 rounded-2xl bg-slate-950/50 border border-white/10 flex items-center gap-4 opacity-70">
                               <div className="w-10 h-10 rounded-xl bg-slate-800 flex items-center justify-center text-slate-500">
                                 <Sparkles className="w-5 h-5" />
                               </div>
                               <div>
                                 <p className="text-sm font-bold text-slate-300">Auto-Routing Enabled</p>
                                 <p className="text-xs text-slate-500">AI will determine the best department</p>
                               </div>
                            </div>
                         </div>
                      </div>

                      <div className="flex gap-4 pt-4">
                        <button 
                          onClick={() => setStep(1)}
                          className="flex-1 py-4 glass text-white rounded-2xl font-bold hover:bg-white/5 transition-colors"
                        >
                          Back
                        </button>
                        <button 
                          onClick={handleSubmit}
                          disabled={loading || !description}
                          className="flex-[2] py-4 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white rounded-2xl font-bold transition-all shadow-lg shadow-blue-500/25 flex items-center justify-center gap-3 active:scale-95"
                        >
                          {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <><Send className="w-5 h-5" /> Finalize & Submit</>}
                        </button>
                      </div>
                    </motion.div>
                  )}
                </motion.div>
              )
            ) : (
              <motion.div
                key="success"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="text-center"
              >
                <div className="w-24 h-24 bg-green-500/20 rounded-full flex items-center justify-center text-green-500 mx-auto mb-8 shadow-2xl shadow-green-500/20 relative">
                  <CheckCircle2 className="w-12 h-12" />
                  <motion.div
                    animate={{ scale: [1, 1.5, 1], opacity: [0, 0.5, 0] }}
                    transition={{ duration: 2, repeat: Infinity }}
                    className="absolute inset-0 border-4 border-green-500 rounded-full"
                  />
                </div>
                
                <h2 className="text-3xl font-bold text-white mb-2">Issue Reported!</h2>
                <p className="text-slate-400 mb-8 max-w-sm mx-auto">
                  {aiResult ? "Gemini AI has completed the analysis and prioritized your request." : "Report received. AI analysis is currently in queue and will appear on the dashboard shortly."}
                </p>

                {aiResult && (
                  <motion.div 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                    className="bg-slate-950/50 rounded-3xl p-6 border border-white/5 mb-10 text-left space-y-6"
                  >
                    <div className="flex items-start gap-4">
                       <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center text-blue-400 flex-shrink-0">
                          <Sparkles className="w-5 h-5" />
                       </div>
                       <div>
                          <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-1">AI Summary</p>
                          <p className="text-white text-sm leading-relaxed">{aiResult.summary}</p>
                       </div>
                    </div>

                    <div className="grid grid-cols-3 gap-4">
                       <div className="p-4 rounded-2xl bg-white/5 border border-white/5">
                          <div className="flex items-center gap-2 mb-2">
                             <AlertCircle className="w-3 h-3 text-red-400" />
                             <span className="text-[10px] font-bold text-slate-500 uppercase tracking-tighter">Severity</span>
                          </div>
                          <p className="text-xl font-bold text-white">{aiResult.severity}<span className="text-xs text-slate-500">/5</span></p>
                       </div>
                       <div className="p-4 rounded-2xl bg-white/5 border border-white/5">
                          <div className="flex items-center gap-2 mb-2">
                             <Clock className="w-3 h-3 text-amber-400" />
                             <span className="text-[10px] font-bold text-slate-500 uppercase tracking-tighter">Urgency</span>
                          </div>
                          <p className="text-xl font-bold text-white">{aiResult.urgency}<span className="text-xs text-slate-500">/5</span></p>
                       </div>
                       <div className="p-4 rounded-2xl bg-white/5 border border-white/5">
                          <div className="flex items-center gap-2 mb-2">
                             <Users className="w-3 h-3 text-indigo-400" />
                             <span className="text-[10px] font-bold text-slate-500 uppercase tracking-tighter">Impact</span>
                          </div>
                          <p className="text-xl font-bold text-white">{aiResult.public_impact}<span className="text-xs text-slate-500">/5</span></p>
                       </div>
                    </div>

                    <div className="pt-2">
                       <div className="flex justify-between items-end mb-2">
                          <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">Priority Score</p>
                          <p className="text-2xl font-black text-blue-400">
                             {((aiResult.severity * 0.4) + (aiResult.urgency * 0.4) + (aiResult.public_impact * 0.2)).toFixed(1)}
                          </p>
                       </div>
                       <div className="h-2 w-full bg-white/5 rounded-full overflow-hidden">
                          <motion.div 
                            initial={{ width: 0 }}
                            animate={{ width: `${(((aiResult.severity * 0.4) + (aiResult.urgency * 0.4) + (aiResult.public_impact * 0.2)) / 5) * 100}%` }}
                            transition={{ delay: 0.6, duration: 1 }}
                            className="h-full bg-gradient-to-r from-blue-500 to-indigo-500"
                          />
                       </div>
                    </div>
                  </motion.div>
                )}

                <div className="flex flex-col gap-4">
                  <Link to="/" className="w-full py-5 bg-blue-600 hover:bg-blue-500 text-white rounded-[1.25rem] font-bold transition-all shadow-xl shadow-blue-500/20 active:scale-95">
                    Return to Home
                  </Link>
                  <button className="w-full py-5 glass text-white rounded-[1.25rem] font-bold hover:bg-white/5 transition-colors">
                    Track Report Status
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
};

export default ReportIssue;
