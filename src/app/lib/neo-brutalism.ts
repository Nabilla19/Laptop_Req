// Neo-Brutalism Light Theme Design Tokens & Class Helpers

export const neoColors = {
  // Core
  bg: "#F8F7F2",
  surface: "#FFFFFF",
  text: "#171717",
  textSecondary: "#666666",
  border: "#171717",

  // Accents
  butterYellow: "#F4D35E",
  mintGreen: "#B8E0D2",
  softCoral: "#FF9B85",
  lavender: "#C9B8F5",

  // Neutrals
  white: "#FFFFFF",
  lightGray: "#EAE8E1",
  mediumGray: "#D6D3CB",
  mutedGray: "#858585",
  black: "#171717",
};

export const neoClasses = {
  border: "border-2 border-[#171717]",
  borderThin: "border border-[#171717]",
  shadowSm: "shadow-[3px_3px_0px_#171717]",
  shadow: "shadow-[4px_4px_0px_#171717]",
  shadowLg: "shadow-[6px_6px_0px_#171717]",
  shadowXl: "shadow-[8px_8px_0px_#171717]",
  
  card: "bg-white border-2 border-[#171717] rounded-[8px] shadow-[4px_4px_0px_#171717]",
  cardLg: "bg-white border-2 border-[#171717] rounded-[8px] shadow-[6px_6px_0px_#171717]",
  
  buttonPrimary: "font-['Space_Grotesk',sans-serif] bg-[#171717] text-white font-bold border-2 border-[#171717] rounded-[6px] shadow-[3px_3px_0px_#171717] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[1px_1px_0px_#171717] active:translate-x-[3px] active:translate-y-[3px] active:shadow-none transition-all disabled:opacity-50 disabled:pointer-events-none",
  buttonSecondary: "font-['Space_Grotesk',sans-serif] bg-white text-[#171717] font-bold border-2 border-[#171717] rounded-[6px] shadow-[3px_3px_0px_#171717] hover:bg-[#EAE8E1] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[1px_1px_0px_#171717] active:translate-x-[3px] active:translate-y-[3px] active:shadow-none transition-all disabled:opacity-50 disabled:pointer-events-none",
  buttonAccent: "font-['Space_Grotesk',sans-serif] bg-[#F4D35E] text-[#171717] font-bold border-2 border-[#171717] rounded-[6px] shadow-[3px_3px_0px_#171717] hover:bg-[#ecd04e] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[1px_1px_0px_#171717] active:translate-x-[3px] active:translate-y-[3px] active:shadow-none transition-all disabled:opacity-50 disabled:pointer-events-none",
  buttonCoral: "font-['Space_Grotesk',sans-serif] bg-[#FF9B85] text-[#171717] font-bold border-2 border-[#171717] rounded-[6px] shadow-[3px_3px_0px_#171717] hover:bg-[#f78d75] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[1px_1px_0px_#171717] active:translate-x-[3px] active:translate-y-[3px] active:shadow-none transition-all disabled:opacity-50 disabled:pointer-events-none",
  buttonMint: "font-['Space_Grotesk',sans-serif] bg-[#B8E0D2] text-[#171717] font-bold border-2 border-[#171717] rounded-[6px] shadow-[3px_3px_0px_#171717] hover:bg-[#a7d9c9] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[1px_1px_0px_#171717] active:translate-x-[3px] active:translate-y-[3px] active:shadow-none transition-all disabled:opacity-50 disabled:pointer-events-none",

  input: "bg-white text-[#171717] border-2 border-[#171717] rounded-[6px] px-3.5 py-2.5 font-medium outline-none focus:shadow-[3px_3px_0px_#F4D35E] transition-all placeholder:text-[#858585]",
  select: "bg-white text-[#171717] border-2 border-[#171717] rounded-[6px] px-3.5 py-2.5 font-medium outline-none focus:shadow-[3px_3px_0px_#F4D35E] transition-all",
  badge: "inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-bold border border-[#171717] rounded-[4px] uppercase tracking-wide",
};

export const neoTypography = {
  hero: "font-['Space_Grotesk',sans-serif] font-extrabold text-[#171717] tracking-tight leading-tight",
  pageTitle: "font-['Space_Grotesk',sans-serif] text-2xl md:text-3xl font-bold text-[#171717] tracking-tight",
  sectionTitle: "font-['Space_Grotesk',sans-serif] text-xl font-bold text-[#171717] tracking-tight",
  cardTitle: "font-['Space_Grotesk',sans-serif] text-base md:text-lg font-bold text-[#171717]",
  label: "font-['Space_Grotesk',sans-serif] text-xs font-bold uppercase tracking-wider text-[#666666]",
  body: "font-['Inter',sans-serif] text-sm text-[#171717]",
  caption: "font-['Inter',sans-serif] text-xs text-[#666666]",
};
