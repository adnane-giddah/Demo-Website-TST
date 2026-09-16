const LOGO_WIDTH = 366;
const LOGO_HEIGHT = 442;
const PORTFOLIO_URL = "https://adnane-giddah.github.io/Portfolio/";
export function Watermark() {
    return (<a href={PORTFOLIO_URL} target="_blank" rel="noopener noreferrer" aria-label="Visit the developer's portfolio" className="fixed bottom-4 right-4 z-40">
      
      <img src="/brand/watermark.svg" alt="" width={LOGO_WIDTH} height={LOGO_HEIGHT} className="h-10 w-auto object-contain opacity-40 grayscale select-none transition-opacity hover:opacity-70 dark:invert dark:opacity-30 dark:hover:opacity-60"/>
    </a>);
}
