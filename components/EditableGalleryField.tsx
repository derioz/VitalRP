import React, { useState, useEffect } from 'react';
import { useAuth } from './AuthProvider';
import { Edit } from 'lucide-react';
import { db } from '../lib/firebase';
import { doc, onSnapshot, updateDoc } from 'firebase/firestore';
import { EditModal } from './EditModal';

interface EditableGalleryFieldProps {
  id: string; // Document ID
  field: 'title' | 'location' | 'category';
  value: string;
  className?: string;
  as?: 'h1' | 'h2' | 'h3' | 'h4' | 'p' | 'span' | 'div';
}

export const EditableGalleryField: React.FC<EditableGalleryFieldProps> = ({
  id,
  field,
  value: initialValue,
  className = "",
  as: Component = 'span'
}) => {
  const { editMode } = useAuth();
  const [value, setValue] = useState(initialValue);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Real-time listener for the specific gallery item
  useEffect(() => {
    if (!db) return;
    const unsub = onSnapshot(doc(db, "gallery", id), (doc) => {
      if (doc.exists()) {
        const data = doc.data();
        if (data && data[field]) {
          setValue(data[field]);
        }
      }
    });
    return () => unsub();
  }, [id, field]);

  const handleSave = async (newValue: string) => {
    if (!db) return;
    await updateDoc(doc(db, "gallery", id), {
      [field]: newValue
    });
  };

  if (editMode) {
    return (
      <>
        <div
          onClick={(e) => {
            e.stopPropagation();
            setIsModalOpen(true);
          }}
          className={`relative group/edit inline-block cursor-pointer hover:bg-vital-500/20 rounded px-1 -mx-1 transition-colors ${className}`}
          title={`Click to edit ${field}`}
        >
          <Component>
            {value}
          </Component>

          {/* Hover Indicator */}
          <div className="absolute -top-2 -right-2 opacity-0 group-hover/edit:opacity-100 transition-opacity bg-vital-500 text-white p-1 rounded-full shadow-lg z-50">
            <Edit size={10} />
          </div>
        </div>

        <EditModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          onSave={handleSave}
          initialValue={value}
          label={`Edit ${field.charAt(0).toUpperCase() + field.slice(1)}`}
        />
      </>
    );
  }

  // Normal Render
  return (
    <Component className={className}>
      {value}
    </Component>
  );
};