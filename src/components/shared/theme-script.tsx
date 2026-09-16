const script = `(function () {
 try {
 var stored = localStorage.getItem("olympiad-theme");
 var prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
 var dark = stored ==="dark"|| (stored !=="light"&& prefersDark);
 document.documentElement.classList.toggle("dark", dark);
 document.documentElement.style.colorScheme = dark ?"dark":"light";
 } catch (error) {
 /* storage unavailable - fall back to the light theme */
 }
})();
`;
export function ThemeScript() {
    return <script dangerouslySetInnerHTML={{ __html: script }}/>;
}
