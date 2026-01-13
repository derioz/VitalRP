import React, { useState, useEffect } from 'react';
import { useAuth } from './AuthProvider';
import { RefreshCw, Loader2, Image as ImageIcon } from 'lucide-react';
import { db } from '../lib/firebase';
import { doc, onSnapshot, setDoc } from 'firebase/firestore';
import { EditModal } from './EditModal';

interface EditableImageProps {
  id: string; // Field name in Firestore
  defaultSrc: string;
  alt: string;
  className?: string;
  collectionName?: string;
  docId?: string;
  label?: string;
}

export const EditableImage: React.FC<EditableImageProps> = ({
  id,
  defaultSrc,
  alt,
  className = "",
  collectionName = 'site_content',
  docId = 'home',
  label = 'Change Image'
}) => {
  const { editMode } = useAuth();
  const [src, setSrc] = useState(defaultSrc);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Real-time listener
  useEffect(() => {
    if (!db) return;
    const unsub = onSnapshot(doc(db, collectionName, docId), (doc) => {
      if (doc.exists()) {
        const data = doc.data();
        if (data && data[id]) {
          setSrc(data[id]);
        }
      }
    });
    return () => unsub();
  }, [id, collectionName, docId]);

  const handleSave = async (newUrl: string) => {
    if (!db || !newUrl) return;
    await setDoc(doc(db, collectionName, docId), {
      [id]: newUrl
    }, { merge: true });
  };

  return (
    <>
      <div className={`relative group/image ${className}`}>
        <img
          src={src}
          alt={alt}
          className={`w-full h-full object-cover ${className}`} // Ensure class applies to img or container as needed
        />

        {/* Admin Edit Overlay */}
        {editMode && (
          <div className="absolute inset-0 bg-black/60 opacity-0 group-hover/image:opacity-100 transition-opacity flex flex-col items-center justify-center gap-2 z-50 backdrop-blur-sm border-2 border-vital-500 m-2 rounded-lg border-dashed">
            <button
              onClick={(e) => {
                e.stopPropagation();
                setIsModalOpen(true);
              }}
              className="bg-vital-500 text-white px-4 py-2 rounded-full font-bold shadow-lg hover:bg-vital-600 hover:scale-105 transition-all flex items-center gap-2"
            >
              <ImageIcon size={16} />
              Change Image
            </button>
            <span className="text-xs text-gray-300 font-mono bg-black/50 px-2 py-1 rounded">
              ID: {id}
            </span>
          </div>
        )}
      </div>

      <EditModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleSave}
        initialValue={src}
        label={label}
      />
    </>
  );
};