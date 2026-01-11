import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from './AuthProvider';
import { Edit, Loader2, Check } from 'lucide-react';
import { db } from '../lib/firebase';
import { doc, updateDoc } from 'firebase/firestore';

interface EditableGalleryFieldProps {
  id: string;
  field: 'title' | 'location' | 'category';
  value: string;
  className?: string;
  as?: 'h1' | 'h2' | 'h3' | 'h4' | 'p' | 'span' | 'div';
  onUpdate?: (newValue: string) => void;
}

export const EditableGalleryField: React.FC<EditableGalleryFieldProps> = ({
  id,
  field,
  value: initialValue,
  className = "",
  as: Component = 'span',
  onUpdate
}) => {
  const { editMode } = useAuth();
  const [value, setValue] = useState(initialValue);
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setValue(initialValue);
  }, [initialValue]);

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isEditing]);

  const handleSave = async () => {
    if (value === initialValue) {
      setIsEditing(false);
      return;
    }

    setIsSaving(true);

    try {
      if (db && import.meta.env.VITE_FIREBASE_API_KEY) {
        // Update Firebase
        const docRef = doc(db, "gallery", id);
        await updateDoc(docRef, { [field]: value });
      } else {
        // Demo Mode - No persistence for database items in local storage for simplicity
        // or we could mock it, but usually gallery is DB driven.
        console.warn("Firebase not configured, change is temporary.");
      }

      if (onUpdate) onUpdate(value);
      setIsEditing(false);
    } catch (err) {
      console.error(`Error updating ${field}:`, err);
      alert(`Failed to update ${field}`);
      setValue(initialValue); // Revert
    } finally {
      setIsSaving(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSave();
    } else if (e.key === 'Escape') {
      setValue(initialValue);
      setIsEditing(false);
    }
  };

  if (editMode) {
    if (isEditing) {
      return (
        <div className={`relative inline-block min-w-[50px] ${className}`}>
          <input
            ref={inputRef}
            type="text"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            onBlur={handleSave}
            onKeyDown={handleKeyDown}
            disabled={isSaving}
            className="w-full bg-black/80 text-white border border-vital-500 rounded px-2 py-0.5 outline-none font-inherit"
          />
          {isSaving && (
            <div className="absolute right-2 top-1/2 -translate-y-1/2">
              <Loader2 size={12} className="animate-spin text-vital-500" />
            </div>
          )}
        </div>
      );
    }

    return (
      <div
        onClick={(e) => {
          e.stopPropagation(); // Prevent parent click events
          setIsEditing(true);
        }}
        className={`relative group/edit inline-block cursor-pointer hover:bg-vital-500/20 rounded px-1 -mx-1 transition-colors ${className}`}
        title={`Click to edit ${field}`}
      >
        <Component>
          {value}
        </Component>

        {/* Hover Indicator */}
        <div className="absolute -top-2 -right-2 opacity-0 group-hover/edit:opacity-100 transition-opacity pointer-events-none bg-vital-500 text-white p-0.5 rounded-full shadow-lg z-50">
          <Edit size={8} />
        </div>
      </div>
    );
  }

  // Normal Render
  return (
    <Component className={className}>
      {value}
    </Component>
  );
};