import React, { useState, useEffect } from 'react';
import { useAuth } from './AuthProvider';
import { Edit } from 'lucide-react';
import { doc, onSnapshot, setDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { EditModal } from './EditModal';

interface EditableTextProps {
  id: string; // Field name in Firestore (e.g., 'heroTitle')
  defaultText: string;
  className?: string;
  as?: 'h1' | 'h2' | 'h3' | 'p' | 'span' | 'div';
  collectionName?: string;
  docId?: string;
  label?: string;
  multiline?: boolean;
}

export const EditableText: React.FC<EditableTextProps> = ({
  id,
  defaultText,
  className = "",
  as: Component = 'span',
  collectionName = 'site_content',
  docId = 'home',
  label = 'Edit Content',
  multiline = false
}) => {
  const { editMode } = useAuth();
  const [text, setText] = useState(defaultText);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Real-time listener for content
  useEffect(() => {
    if (!db) return;
    const unsub = onSnapshot(doc(db, collectionName, docId), (doc) => {
      if (doc.exists()) {
        const data = doc.data();
        if (data && data[id]) {
          setText(data[id]);
        }
      }
    });
    return () => unsub();
  }, [id, collectionName, docId]);

  const handleSave = async (newValue: string) => {
    if (!db) return;
    await setDoc(doc(db, collectionName, docId), {
      [id]: newValue
    }, { merge: true });
  };

  if (editMode) {
    return (
      <>
        <div className={`relative group/edit inline-block ${className}`}>
          <Component>
            {text}
          </Component>

          {/* Hover Indicator / Edit Button */}
          <button
            onClick={() => setIsModalOpen(true)}
            className="absolute -top-3 -right-3 opacity-0 group-hover/edit:opacity-100 transition-opacity bg-vital-500 text-white p-1.5 rounded-full shadow-lg z-50 hover:bg-vital-600 hover:scale-110 transform duration-200"
            title="Edit"
          >
            <Edit size={12} />
          </button>
        </div>

        <EditModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          onSave={handleSave}
          initialValue={text}
          label={label}
          multiline={multiline}
        />
      </>
    );
  }

  // Normal Render
  return (
    <Component className={className}>
      {text}
    </Component>
  );
};