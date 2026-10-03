import React from 'react';
import { CharacterEditorView } from '../../../components/wiki/CharacterEditorView';

export const WikiCharacterNew: React.FC = () => {
  return <CharacterEditorView isNew={true} />;
};
