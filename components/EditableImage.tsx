import React, { useState, useEffect } from 'react';
import { useAuth } from './AuthProvider';
import { RefreshCw, Save, Loader2 } from 'lucide-react';
import { db } from '../lib/firebase';
import { doc, updateDoc } from 'firebase/firestore';

interface EditableImageProps {
  id: string; // Matches DB primary key (string for Firestore)
  src: string;
  alt: string;
  className?: string;
  onImageUpdate?: (newSrc: string) => void;
}

export const EditableImage: React.FC<EditableImageProps> = ({
  id,
  src: initialSrc,
  alt,
  className = "",
  onImageUpdate
}) => {
  const { editMode } = useAuth();
  const [src, setSrc] = useState(initialSrc);
  const [isSaving, setIsSaving] = useState(false);

  // Load from LocalStorage if Firebase is missing (Demo Mode)
  useEffect(() => {
    if (!import.meta.env.VITE_FIREBASE_API_KEY) {
      const saved = localStorage.getItem(`vital_img_${id}`);
      if (saved) {
        setSrc(saved);
        if (onImageUpdate) onImageUpdate(saved);
      }
    }
  }, [id]);

  // Sync with prop updates (if other components update it)
  useEffect(() => {
    // Only update if we aren't using a locally saved override in Demo mode
    if (import.meta.env.VITE_FIREBASE_API_KEY || !localStorage.getItem(`vital_img_${id}`)) {
      setSrc(initialSrc);
    }
  }, [initialSrc, id]);

  const handleEdit = async () => {
    const newUrl = prompt("Enter the new Image URL (e.g., FiveManage link):", src);

    if (newUrl && newUrl !== src) {
      setIsSaving(true);

      try {
        if (import.meta.env.VITE_FIREBASE_API_KEY) {
          // Update Firebase
          const docRef = doc(db, "gallery", id);
          await updateDoc(docRef, { src: newUrl });

          alert("Image updated successfully in the cloud!");
        } else {
          // Update Local Storage (Demo Mode)
          localStorage.setItem(`vital_img_${id}`, newUrl);
          alert("Image saved to your browser (Demo Mode). Connect Firebase to save for everyone.");
        }

        // Success - update local state
        setSrc(newUrl);
        if (onImageUpdate) onImageUpdate(newUrl);

      } catch (err) {
        console.error("Error updating image:", err);
        alert("Failed to update image. Check console for details.");
      } finally {
        setIsSaving(false);
      }
    }
  };

  return (
    <div className={`relative group/image ${className}`}>
      <img
        src={src}
        alt={alt}
        className="w-full h-full object-cover"
      />

      {/* Admin Edit Overlay */}
      {editMode && (
        <div className="absolute inset-0 bg-black/60 opacity-0 group-hover/image:opacity-100 transition-opacity flex flex-col items-center justify-center gap-2 z-50 backdrop-blur-sm border-2 border-vital-500 m-2 rounded-lg border-dashed">
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleEdit();
            }}
            disabled={isSaving}
            className="bg-vital-500 text-white px-4 py-2 rounded-full font-bold shadow-lg hover:bg-vital-600 hover:scale-105 transition-all flex items-center gap-2 disabled:opacity-50 disabled:cursor-wait"
          >
            {isSaving ? <Loader2 size={16} className="animate-spin" /> : <RefreshCw size={16} />}
            {isSaving ? "Saving..." : "Change Image"}
          </button>
          <span className="text-xs text-gray-300 font-mono bg-black/50 px-2 py-1 rounded">
            ID: {id} {import.meta.env.VITE_FIREBASE_API_KEY ? '(Cloud)' : '(Local)'}
          </span>
        </div>
      )}
    </div>
  );
};