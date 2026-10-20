// src/config/themes.js

export const themeStyles = {
  cyberpunk: {
    name: 'Cyberpunk (Dev)',
    bgMain: 'bg-[#080b16]',
    container: 'bg-[#101426] border-cyan-500/20 text-white',
    filterBox: 'bg-[#080b16] border-gray-800',
    card: 'bg-[#080b16] border-cyan-500/20 hover:border-cyan-500/50 text-white',
    input: 'bg-[#101426] border-gray-800 text-white focus:border-cyan-500',
    title: 'text-cyan-400',
    subText: 'text-gray-400',
    badge: 'bg-cyan-500/10 text-cyan-300 border-cyan-500/20',
    buttonBack: 'bg-[#101426] border-cyan-500/20 text-gray-300 hover:bg-cyan-500/10',
  },
  'dark-corp': {
    name: 'Oscuro Corporativo',
    bgMain: 'bg-slate-950',
    container: 'bg-slate-900 border-slate-800 text-slate-100',
    filterBox: 'bg-slate-950 border-slate-800',
    card: 'bg-slate-950 border-slate-800 hover:border-slate-700 text-slate-100',
    input: 'bg-slate-900 border-slate-800 text-slate-100 focus:border-[#ED1651]',
    title: 'text-[#ED1651]',
    subText: 'text-slate-400',
    badge: 'bg-[#2A0087] text-white border-transparent',
    buttonBack: 'bg-slate-900 border-slate-800 text-slate-300 hover:bg-slate-800',
  },
  'light-corp': {
    name: 'Claro Corporativo',
    bgMain: 'bg-slate-100',
    container: 'bg-white border-slate-200 text-slate-900 shadow-sm',
    filterBox: 'bg-slate-50 border-slate-200',
    card: 'bg-white border-slate-200 hover:border-slate-300 text-slate-900 shadow-sm',
    input: 'bg-white border-slate-300 text-slate-900 focus:border-[#2A0087]',
    title: 'text-[#2A0087]',
    subText: 'text-slate-500',
    badge: 'bg-slate-200 text-slate-800 border-slate-300',
    buttonBack: 'bg-white border-slate-300 text-slate-700 hover:bg-slate-50',
  }
};