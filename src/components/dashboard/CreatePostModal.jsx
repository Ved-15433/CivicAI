import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  X, 
  Image as ImageIcon, 
  Plus, 
  Link as LinkIcon, 
  AlertCircle,
  Loader2,
  Trash2,
  CheckCircle2,
  HelpCircle,
  ArrowRight
} from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useIssues } from '../../context/IssueContext';

const CreatePostModal = ({ isOpen, onClose, onSuccess }) => {
  const { user, userReports } = useIssues();
  const [content, setContent] = useState('');
  const [images, setImages] = useState([]);
  const [isBeforeAfter, setIsBeforeAfter] = useState(false);
  const [selectedIssueId, setSelectedIssueId] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const fileInputRef = useRef(null);

  // Filter only resolved or in-progress issues for before/after?
  // Let's allow any issue they've reported.
  const myIssues = userReports.map(r => r.issues).filter(Boolean);

  const handleImageChange = (e) => {
    const files = Array.from(e.target.files);
    if (images.length + files.length > 4) {
      setError('You can only upload up to 4 images.');
      return;
    }

    const newImages = files.map(file => ({
      file,
      preview: URL.createObjectURL(file),
      label: isBeforeAfter ? (images.length === 0 ? 'before' : 'after') : 'standard'
    }));

    setImages(prev => [...prev, ...newImages]);
    setError(null);
  };

  const removeImage = (index) => {
    setImages(prev => {
      const updated = [...prev];
      URL.revokeObjectURL(updated[index].preview);
      updated.splice(index, 1);
      return updated;
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!content && images.length === 0) {
      setError('Post must have either text or an image.');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      // 1. Create the post
      const { data: post, error: postError } = await supabase
        .from('posts')
        .insert({
          user_id: user.id,
          content,
          post_type: isBeforeAfter ? 'before-after' : 'standard',
          issue_id: selectedIssueId
        })
        .select()
        .single();

      if (postError) throw postError;

      // 2. Upload images and link to post
      if (images.length > 0) {
        const mediaPromises = images.map(async (img, idx) => {
          const fileExt = img.file.name.split('.').pop();
          const fileName = `${user.id}/${post.id}/${Date.now()}-${idx}.${fileExt}`;
          
          const { error: uploadError } = await supabase.storage
            .from('post-media')
            .upload(fileName, img.file);

          if (uploadError) throw uploadError;

          const { data: { publicUrl } } = supabase.storage
            .from('post-media')
            .getPublicUrl(fileName);

          return {
            post_id: post.id,
            url: publicUrl,
            media_type: 'image',
            label: isBeforeAfter ? (idx === 0 ? 'before' : 'after') : 'standard',
            order_index: idx
          };
        });

        const mediaData = await Promise.all(mediaPromises);
        const { error: mediaError } = await supabase
          .from('post_media')
          .insert(mediaData);

        if (mediaError) throw mediaError;
      }

      onSuccess();
      onClose();
      // Reset form
      setContent('');
      setImages([]);
      setSelectedIssueId(null);
      setIsBeforeAfter(false);
    } catch (err) {
      console.error('Error creating post:', err);
      setError(err.message || 'Failed to create post. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-slate-950/80 backdrop-blur-md"
          />
          
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="relative w-full max-w-2xl bg-slate-900 border border-white/10 rounded-3xl shadow-2xl overflow-hidden"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-white/5 bg-white/5">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-blue-600/20 border border-blue-500/20 flex items-center justify-center">
                  <Plus className="w-5 h-5 text-blue-400" />
                </div>
                <div>
                  <h2 className="text-xl font-black text-white tracking-tight leading-tight">Create Civic Post</h2>
                  <p className="text-xs text-slate-500 font-bold uppercase tracking-widest">Share your impact</p>
                </div>
              </div>
              <button 
                onClick={onClose}
                className="p-2 hover:bg-white/5 rounded-full text-slate-400 hover:text-white transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-6 max-h-[70vh] overflow-y-auto custom-scrollbar">
              {error && (
                <motion.div 
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="flex items-center gap-3 p-4 bg-red-500/10 border border-red-500/20 rounded-2xl text-red-400 text-sm"
                >
                  <AlertCircle className="w-5 h-5 shrink-0" />
                  <p className="font-bold">{error}</p>
                </motion.div>
              )}

              {/* Text Content */}
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Write your experience</label>
                <textarea
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  placeholder="Tell the community about your civic update... (e.g., 'Finally fixed!', 'Working on it...')"
                  className="w-full h-32 bg-slate-950/50 border border-white/10 rounded-2xl p-4 text-white text-sm focus:ring-2 focus:ring-blue-500/50 focus:border-transparent transition-all outline-none resize-none"
                />
              </div>

              {/* Media Upload */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Images ({images.length}/4)</label>
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={images.length >= 4}
                    className="flex items-center gap-2 px-3 py-1.5 bg-blue-600 hover:bg-blue-500 disabled:bg-slate-800 disabled:text-slate-600 rounded-xl text-[10px] font-black text-white uppercase tracking-widest transition-all"
                  >
                    <Plus className="w-3 h-3" />
                    Add Photo
                  </button>
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleImageChange}
                    accept="image/*"
                    multiple
                    className="hidden"
                  />
                </div>

                {images.length > 0 && (
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {images.map((img, idx) => (
                      <div key={idx} className="relative aspect-square rounded-2xl overflow-hidden border border-white/10 group">
                        <img src={img.preview} alt="Preview" className="w-full h-full object-cover" />
                        <button
                          type="button"
                          onClick={() => removeImage(idx)}
                          className="absolute top-2 right-2 p-1.5 bg-red-500 rounded-lg text-white opacity-0 group-hover:opacity-100 transition-opacity shadow-lg"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                        {isBeforeAfter && (
                          <div className={`absolute bottom-0 inset-x-0 py-1 text-center text-[8px] font-black uppercase tracking-tighter ${idx === 0 ? 'bg-orange-500 text-white' : 'bg-green-500 text-white'}`}>
                            {idx === 0 ? 'Before' : 'After'}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Tag an Issue */}
              <div className="space-y-4 pt-4 border-t border-white/5">
                <div className="flex items-center justify-between">
                   <div className="flex items-center gap-2">
                     <LinkIcon className="w-4 h-4 text-blue-400" />
                     <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Link related issue (Optional)</span>
                   </div>
                   {selectedIssueId && (
                     <button 
                        type="button"
                        onClick={() => {
                          setSelectedIssueId(null);
                          setIsBeforeAfter(false);
                        }}
                        className="text-[10px] font-bold text-red-400 hover:text-red-300 transition-colors uppercase"
                     >
                       Remove Link
                     </button>
                   )}
                </div>

                <div className="grid grid-cols-1 gap-2 max-h-40 overflow-y-auto pr-2 custom-scrollbar">
                  {myIssues.length > 0 ? (
                    myIssues.map((issue) => (
                      <button
                        key={issue.id}
                        type="button"
                        onClick={() => setSelectedIssueId(issue.id)}
                        className={`flex items-center justify-between p-3 rounded-2xl border transition-all text-left ${
                          selectedIssueId === issue.id
                            ? 'bg-blue-600/10 border-blue-500/50 text-blue-400'
                            : 'bg-white/5 border-white/5 text-slate-400 hover:bg-white/10'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                           <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${selectedIssueId === issue.id ? 'bg-blue-600 text-white' : 'bg-slate-800 text-slate-500'}`}>
                             {selectedIssueId === issue.id ? <CheckCircle2 className="w-4 h-4" /> : <LinkIcon className="w-4 h-4" />}
                           </div>
                           <div className="min-w-0">
                             <p className="text-xs font-black truncate">{issue.title}</p>
                             <p className="text-[10px] opacity-70 truncate">{issue.location_label || 'Location not specified'}</p>
                           </div>
                        </div>
                        <div className={`px-2 py-0.5 rounded text-[8px] font-black uppercase ${
                          issue.status === 'Resolved' ? 'bg-green-500/20 text-green-400' : 'bg-orange-500/20 text-orange-400'
                        }`}>
                          {issue.status}
                        </div>
                      </button>
                    ))
                  ) : (
                    <div className="py-4 text-center bg-white/5 rounded-2xl border border-dashed border-white/10">
                      <p className="text-[10px] font-bold text-slate-500 uppercase">You haven't reported any issues yet.</p>
                    </div>
                  )}
                </div>

                {selectedIssueId && (
                   <div className="p-4 bg-blue-600/5 border border-blue-500/20 rounded-2xl flex items-center justify-between gap-4">
                      <div className="flex items-center gap-3">
                         <div className="w-8 h-8 rounded-full bg-blue-600/20 flex items-center justify-center shrink-0">
                            <HelpCircle className="w-4 h-4 text-blue-400" />
                         </div>
                         <div>
                            <p className="text-[10px] font-black text-white uppercase tracking-tight leading-tight">Civic Storytelling</p>
                            <p className="text-[9px] text-slate-500 font-medium">Create a "Before & After" update to show the resolution journey?</p>
                         </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => setIsBeforeAfter(!isBeforeAfter)}
                        className={`relative w-12 h-6 rounded-full transition-colors duration-300 shrink-0 ${isBeforeAfter ? 'bg-blue-600' : 'bg-slate-700'}`}
                      >
                        <div className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full transition-transform duration-300 ${isBeforeAfter ? 'translate-x-6' : ''}`} />
                      </button>
                   </div>
                )}
              </div>

              {/* Footer */}
              <div className="pt-6 border-t border-white/5 flex gap-4">
                <button
                  type="button"
                  onClick={onClose}
                  className="flex-1 py-4 px-6 bg-white/5 hover:bg-white/10 text-white font-black text-xs uppercase tracking-widest rounded-2xl transition-all border border-white/5"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-[2] py-4 px-6 bg-blue-600 hover:bg-blue-500 disabled:bg-blue-600/50 disabled:cursor-not-allowed text-white font-black text-xs uppercase tracking-widest rounded-2xl transition-all shadow-xl shadow-blue-500/20 flex items-center justify-center gap-2"
                >
                  {isSubmitting ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <>
                      Share to Feed
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default CreatePostModal;
