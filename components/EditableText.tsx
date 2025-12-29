import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from './AuthProvider';
import { Edit } from 'lucide-react';

interface EditableTextProps {
  id: string; // Unique ID for saving content
  defaultText: string;
  className?: string;
  as?: 'h1' | 'h2' | 'h3' | 'p' | 'span' | 'div';
}

export const EditableText: React.FC<EditableTextProps> = ({ 
  id, 
  defaultText, 
  className = "", 
  as: Component = 'span' 
}) => {
  const { editMode } = useAuth();
  const [text, setText] = useState(defaultText);
  const [isFocused, setIsFocused] = useState(false);
  
  // In a real app, we would load the saved text from localStorage or DB here
  useEffect(() => {
    const saved = localStorage.getItem(`vital_content_${id}`);
    if (saved) setText(saved);
  }, [id]);

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement | HTMLInputElement>) => {
    setText(e.target.value);
    localStorage.setItem(`vital_content_${id}`, e.target.value);
  };

  if (editMode) {
    return (
      <div className={`relative group/edit inline-block ${className}`}>
        {/* Render a textarea that mimics the text style, or a contentEditable div */}
        <div 
          contentEditable
          suppressContentEditableWarning
          onBlur={(e) => {
            setIsFocused(false);
            localStorage.setItem(`vital_content_${id}`, e.currentTarget.innerText);
            setText(e.currentTarget.innerText);
          }}
          onFocus={() => setIsFocused(true)}
          className={`min-w-[20px] outline-none border-2 border-dashed border-vital-500/50 hover:border-vital-500 bg-vital-500/10 rounded px-1 transition-colors cursor-text ${isFocused ? 'bg-black/50 border-vital-500' : ''}`}
        >
          {text}
        </div>
        
        {/* Hover Indicator */}
        <div className="absolute -top-3 -right-3 opacity-0 group-hover/edit:opacity-100 transition-opacity pointer-events-none bg-vital-500 text-white p-1 rounded-full shadow-lg z-50">
          <Edit size={10} />
        </div>
      </div>
    );
  }

  // Normal Render
  return (
    <Component className={className}>
      {text}
    </Component>
  );
};