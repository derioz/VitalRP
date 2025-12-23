import React from 'react';
import { Youtube, Instagram } from 'lucide-react';

// Centered vertically in 100x100 box (Y: 15-95)
// Matches Navbar logo geometry
const VitalLogo = ({ className = "w-8 h-8" }: { className?: string }) => (
  <svg 
    viewBox="0 0 100 100" 
    fill="none" 
    xmlns="http://www.w3.org/2000/svg" 
    className={className}
    preserveAspectRatio="xMidYMid meet"
  >
    <defs>
      <linearGradient id="vitalLogoGradientFooter" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#FBBF24" />
        <stop offset="50%" stopColor="#F97316" />
        <stop offset="100%" stopColor="#EF4444" />
      </linearGradient>
    </defs>
    <path 
      d="M10 15 L50 95 L90 15 L70 15 L50 55 L30 15 Z" 
      fill="url(#vitalLogoGradientFooter)" 
    />
  </svg>
);

const DiscordLogo = ({ className }: { className?: string }) => (
  <svg 
    role="img" 
    viewBox="0 0 24 24" 
    xmlns="http://www.w3.org/2000/svg" 
    fill="currentColor"
    className={className}
  >
    <title>Discord</title>
    <path d="M20.317 4.3698a19.7913 19.7913 0 00-4.8851-1.5152.0741.0741 0 00-.0785.0371c-.211.3753-.4447.8648-.6083 1.2495-1.8447-.2762-3.68-.2762-5.4868 0-.1636-.3933-.4058-.8742-.6177-1.2495a.077.077 0 00-.0785-.037 19.7363 19.7363 0 00-4.8852 1.515.0699.0699 0 00-.0321.0277C.5334 9.0458-.319 13.5799.0992 18.0578a.0824.0824 0 00.0312.0561c2.0528 1.5076 4.0413 2.4228 5.9929 3.0294a.0777.0777 0 00.0842-.0276c.4616-.6304.8731-1.2952 1.226-1.9942a.076.076 0 00-.0416-.1057c-.6528-.2476-1.2743-.5495-1.8722-.8923a.077.077 0 01-.0076-.1277c.1258-.0943.2517-.1923.3718-.2914a.0743.0743 0 01.0776-.0105c3.9278 1.7933 8.18 1.7933 12.0614 0a.0739.0739 0 01.0785.0095c.1202.099.246.1981.3728.2924a.077.077 0 01-.0066.1276 12.2986 12.2986 0 01-1.873.8914.0766.0766 0 00-.0407.1067c.3604.698.7719 1.3628 1.225 1.9932a.076.076 0 00.0842.0286c1.961-.6067 3.9495-1.5219 6.0023-3.0294a.077.077 0 00.0313-.0552c.5004-5.177-.8382-9.6739-3.5485-13.6604a.061.061 0 00-.0312-.0286zM8.02 15.3312c-1.1825 0-2.1569-1.0857-2.1569-2.419 0-1.3332.9555-2.4189 2.157-2.4189 1.2108 0 2.1757 1.0952 2.1568 2.419 0 1.3332-.946 2.419-2.1568 2.419zm7.9748 0c-1.1825 0-2.1569-1.0857-2.1569-2.419 0-1.3332.9554-2.4189 2.1569-2.4189 1.2108 0 2.1757 1.0952 2.1568 2.419 0 1.3332-.946 2.419-2.1568 2.419z"/>
  </svg>
);

const XLogo = ({ className }: { className?: string }) => (
  <svg 
    viewBox="0 0 24 24" 
    fill="currentColor" 
    className={className}
    xmlns="http://www.w3.org/2000/svg"
  >
    <title>X (Twitter)</title>
    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
  </svg>
);

const TikTokLogo = ({ className }: { className?: string }) => (
  <svg 
    viewBox="0 0 24 24" 
    fill="currentColor" 
    className={className}
    xmlns="http://www.w3.org/2000/svg"
  >
    <title>TikTok</title>
    <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z"/>
  </svg>
);

export const Footer: React.FC = () => {
  const links = [
    { label: 'Home', href: '#home' },
    { label: 'Rules', href: 'https://docs.google.com/document/d/1ZhxNk5zCsZy9eE1Xlo8ALanxtjsFV6TclpAoNHUZHpo/edit?tab=t.0', isExternal: true },
    { label: 'Staff', href: '#staff' },
    { label: 'Gallery', href: '#gallery' },
    { label: 'Forums', href: '#', isComingSoon: true },
    { label: 'Store', href: 'https://vitalrp.tebex.io/', isExternal: true },
  ];

  return (
    <footer className="bg-dark-950 pt-20 pb-10 border-t border-white/5">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-16">
          <div className="col-span-1 md:col-span-2">
            <div className="flex items-center gap-3 mb-6">
              <VitalLogo className="w-10 h-10 flex-shrink-0" />
              <span className="text-2xl font-display font-bold text-white">VITAL RP</span>
            </div>
            <p className="text-gray-500 text-sm leading-relaxed max-w-sm">
              Vital RP is a premium FiveM roleplay community focused on storytelling, character development, and high-quality interactions. Join us today and start your journey in Los Santos.
            </p>
          </div>
          
          <div>
            <h4 className="text-white font-display font-bold mb-6">QUICK LINKS</h4>
            <ul className="space-y-4">
              {links.map((item) => (
                <li key={item.label} className="w-fit">
                  {item.isComingSoon ? (
                    <div className="group relative flex items-center cursor-help">
                      <span className="text-gray-500 text-sm font-tech uppercase tracking-wider group-hover:text-vital-500 transition-colors">
                        {item.label}
                      </span>
                      <span className="absolute left-full ml-3 px-2 py-0.5 bg-vital-500 text-white text-[9px] font-bold rounded opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-300 pointer-events-none">
                        SOON
                      </span>
                    </div>
                  ) : (
                    <a 
                      href={item.href} 
                      target={item.isExternal ? "_blank" : undefined}
                      rel={item.isExternal ? "noreferrer" : undefined}
                      className="text-gray-500 hover:text-vital-500 transition-colors text-sm font-tech uppercase tracking-wider block"
                    >
                      {item.label}
                    </a>
                  )}
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="text-white font-display font-bold mb-6">SOCIALS</h4>
            <div className="flex gap-4">
              <a href="https://discord.gg/vitalrp" target="_blank" rel="noreferrer" className="w-10 h-10 rounded bg-dark-800 flex items-center justify-center text-gray-400 hover:bg-vital-600 hover:text-white transition-all" aria-label="Discord">
                <DiscordLogo className="w-5 h-5" />
              </a>
              <a href="https://x.com/vital_roleplay/" target="_blank" rel="noreferrer" className="w-10 h-10 rounded bg-dark-800 flex items-center justify-center text-gray-400 hover:bg-black hover:text-white transition-all" aria-label="X (Twitter)">
                <XLogo className="w-5 h-5" />
              </a>
              <a href="https://www.youtube.com/@VitalRP" target="_blank" rel="noreferrer" className="w-10 h-10 rounded bg-dark-800 flex items-center justify-center text-gray-400 hover:bg-red-600 hover:text-white transition-all" aria-label="YouTube">
                <Youtube size={20} />
              </a>
               <a href="https://www.instagram.com/vital_roleplay/" target="_blank" rel="noreferrer" className="w-10 h-10 rounded bg-dark-800 flex items-center justify-center text-gray-400 hover:bg-pink-600 hover:text-white transition-all" aria-label="Instagram">
                <Instagram size={20} />
              </a>
              <a href="https://www.tiktok.com/@vitalroleplay_" target="_blank" rel="noreferrer" className="w-10 h-10 rounded bg-dark-800 flex items-center justify-center text-gray-400 hover:bg-[#00f2ea] hover:text-black transition-all" aria-label="TikTok">
                <TikTokLogo className="w-5 h-5" />
              </a>
            </div>
          </div>
        </div>

        <div className="border-t border-white/5 pt-8 flex flex-col md:flex-row justify-between items-center gap-6">
          <p className="text-gray-600 text-xs font-sans order-2 md:order-1">
            © {new Date().getFullYear()} Vital Roleplay. Not affiliated with Rockstar Games.
          </p>
          
          <div className="flex items-center gap-2 order-1 md:order-2 bg-dark-900/50 px-3 py-1.5 rounded-full border border-white/5 hover:border-vital-500/20 transition-colors cursor-default">
             <span className="text-gray-500 text-[10px] font-tech uppercase tracking-widest">Created by Damon</span>
             <img src="https://r2.fivemanage.com/image/hVrQuL5nJWbT.png" alt="Crown" className="w-5 h-5 object-contain" />
          </div>
        </div>
      </div>
    </footer>
  );
};