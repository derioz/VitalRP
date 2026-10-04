import React from 'react';
import { useParams } from 'react-router-dom';
import { WikiEntityView } from '../../../components/wiki/WikiEntityView';
export function WikiEntityRoute() { const { id } = useParams(); return <WikiEntityView id={id} />; }
