import { useLocation } from 'react-router-dom';
export function usePathname() { return useLocation().pathname; }
