import React from 'react';

/**
 * High-definition, authentic vector SVG logos for all standardized assessment tracks.
 * Zero external font or network dependencies; crisp and vibrant at any resolution.
 */
export default function LanguageLogo({ skill = '', className = 'w-6 h-6', title }) {
  const normalized = (skill || '').toLowerCase().trim();

  // Python (Official Blue & Gold Twin Snakes)
  if (normalized.includes('python')) {
    return (
      <svg viewBox="0 0 128 128" className={className} xmlns="http://www.w3.org/2000/svg" title={title || 'Python'}>
        <path d="M63.6 5.2c-15.8 0-25 6.9-25 19.3v14.4h25v3.6H28.4C12.7 42.5 5.2 51.7 5.2 67.5c0 15.6 7.7 24.8 23.2 24.8h11.2v-16c0-11.8 10.3-21.8 22.1-21.8h21.4V30.2C83.1 14.4 75.4 5.2 63.6 5.2zm-12.8 9.5c2.7 0 4.9 2.2 4.9 4.9s-2.2 4.9-4.9 4.9-4.9-2.2-4.9-4.9 2.2-4.9 4.9-4.9z" fill="#387EB8"/>
        <path d="M64.4 122.8c15.8 0 25-6.9 25-19.3V89.1h-25v-3.6h35.2c15.7 0 23.2-9.2 23.2-25 0-15.6-7.7-24.8-23.2-24.8H88.4v16c0 11.8-10.3 21.8-22.1 21.8H44.9v24.3c0 15.8 7.7 25 19.5 25zm12.8-9.5c-2.7 0-4.9-2.2-4.9-4.9s2.2-4.9 4.9-4.9 4.9 2.2 4.9 4.9-2.2 4.9-4.9 4.9z" fill="#FFE052"/>
      </svg>
    );
  }

  // JavaScript (Official Yellow Badge + Bold JS)
  if (normalized === 'javascript' || normalized === 'js') {
    return (
      <svg viewBox="0 0 128 128" className={className} xmlns="http://www.w3.org/2000/svg" title={title || 'JavaScript'}>
        <rect width="128" height="128" rx="18" fill="#F7DF1E"/>
        <path d="M72.5 106.8c3.9 6.4 9 10.5 18.2 10.5 7.6 0 12.6-3.8 12.6-9.1 0-6.3-5-8.6-13.4-12.2l-4.6-2c-13.3-5.7-22.1-12.9-22.1-28.1 0-13.9 10.7-24.5 27.4-24.5 11.9 0 20.4 4.2 26.5 14.9l-12.8 8.2c-2.8-5-5.9-7-13.7-7-6.2 0-10.5 3.9-10.5 8.1 0 5.6 3.5 7.8 11.7 11.3l4.6 2c15.6 6.7 24.3 13.7 24.3 29.4 0 16.9-13.3 26-30.8 26-17.4 0-28.7-8.2-34.4-18.7l13-7.8zM24 105.8l13.6-8.3c2.7 4.8 5.2 8.8 10.4 8.8 5.3 0 8.7-2.1 8.7-10.1V42.3H73v54.2c0 16-9.4 23.3-24.4 23.3-13 0-20.7-6.7-24.6-14z" fill="#000000"/>
      </svg>
    );
  }

  // TypeScript (Official Blue Badge + Crisp TS)
  if (normalized.includes('typescript') || normalized === 'ts') {
    return (
      <svg viewBox="0 0 128 128" className={className} xmlns="http://www.w3.org/2000/svg" title={title || 'TypeScript'}>
        <rect width="128" height="128" rx="18" fill="#3178C6"/>
        <path d="M68 62h-21v50h-13V62H13V50h55v12zm40.5 17.5c-4.4-2.4-8.8-4.5-12.2-6.6-4.5-2.8-6.8-6.1-6.8-10.2 0-3.8 1.4-6.8 4.2-9 2.8-2.2 6.6-3.3 11.3-3.3 5.4 0 10.1 1.4 14.2 4.1 4.1 2.7 6.7 6.4 7.8 11.1l-11.6 4.7c-.5-2.6-1.9-4.8-4.1-6.4-2.2-1.6-4.5-2.4-7-2.4-2.4 0-4.3.6-5.6 1.7-1.3 1.1-2 2.6-2 4.3 0 1.6.6 3 1.8 4.2 1.2 1.2 3.1 2.4 5.7 3.6 4.4 2.1 8.8 4.3 13.1 6.5 4.3 2.2 7.6 5 9.8 8.4 2.2 3.4 3.3 7.5 3.3 12.3 0 7.4-2.7 13.1-8.1 17.1-5.4 4-12.7 6-21.9 6-8.1 0-14.8-1.9-20.1-5.7s-8.5-9.1-9.6-15.8l12.7-3.8c.8 4.1 2.6 7.2 5.5 9.3 2.9 2.1 6.8 3.2 11.7 3.2 3.6 0 6.6-.7 8.9-2.2 2.3-1.5 3.5-3.6 3.5-6.3 0-2.1-.8-3.9-2.4-5.4-1.5-1.5-4-3-7.5-4.5z" fill="#FFFFFF"/>
      </svg>
    );
  }

  // React (Official Cyan Atomic Rings)
  if (normalized.includes('react')) {
    return (
      <svg viewBox="-11.5 -10.23174 23 20.46348" className={className} xmlns="http://www.w3.org/2000/svg" title={title || 'React'}>
        <circle cx="0" cy="0" r="2.05" fill="#61DAFB"/>
        <g stroke="#61DAFB" strokeWidth="1" fill="none">
          <ellipse rx="11" ry="4.2"/>
          <ellipse rx="11" ry="4.2" transform="rotate(60)"/>
          <ellipse rx="11" ry="4.2" transform="rotate(120)"/>
        </g>
      </svg>
    );
  }

  // HTML5 & CSS3 Dual Badge
  if (normalized.includes('html') || normalized.includes('css')) {
    return (
      <svg viewBox="0 0 128 128" className={className} xmlns="http://www.w3.org/2000/svg" title={title || 'HTML5 & CSS3'}>
        <path d="M19.4 113.8L8.7 15h110.6l-10.7 98.8L64 125l-44.6-11.2z" fill="#E44D26"/>
        <path d="M64 116.3l36.5-9.2 8.9-82.6H64v91.8z" fill="#F16529"/>
        <path d="M64 45.3h-22l-1.5-16.7h47l-.3 3.6-1.2 13.1H64zm0 25.1h-11.8l-1.2-13.6h26.4l-.3 3.6-1.2 13.1H64zm0 30.6l-20.9-5.6-1.3-15h11.2l.7 7.9 10.3 2.8v9.9z" fill="#EBEBEB"/>
        <path d="M64 45.3v-16.7h23.5l-1.5 16.7H64zm0 25.1v-13.6h23.5l-2.7 30.6-20.8 5.6v-9.9l10.3-2.8 1.1-12.9H64z" fill="#FFFFFF"/>
      </svg>
    );
  }

  // SQL & Relational Databases (Classic Cylindrical Database Stack)
  if (normalized.includes('sql') || normalized.includes('database')) {
    return (
      <svg viewBox="0 0 128 128" className={className} xmlns="http://www.w3.org/2000/svg" title={title || 'SQL'}>
        <ellipse cx="64" cy="28" rx="48" ry="18" fill="#336791"/>
        <path d="M16 28v28c0 10 21.5 18 48 18s48-8 48-18V28c0 10-21.5 18-48 18S16 38 16 28z" fill="#4B8BBE"/>
        <path d="M16 56v28c0 10 21.5 18 48 18s48-8 48-18V56c0 10-21.5 18-48 18S16 66 16 56z" fill="#336791"/>
        <path d="M16 84v24c0 10 21.5 18 48 18s48-8 48-18V84c0 10-21.5 18-48 18S16 94 16 84z" fill="#204A70"/>
        <ellipse cx="64" cy="28" rx="42" ry="13" fill="#699EC9"/>
      </svg>
    );
  }

  // Java (Official Steaming Cup + Blue Base)
  if (normalized === 'java' || normalized.startsWith('java ') || normalized.startsWith('java_') || normalized.startsWith('java/')) {
    return (
      <svg viewBox="0 0 128 128" className={className} xmlns="http://www.w3.org/2000/svg" title={title || 'Java'}>
        <path d="M47.7 85.5c-6.8 1.4-15.6 2.6-15.6 8.7 0 6.6 13.9 8.2 22.9 8.6 17.5.8 45.2-1.2 45.2-12.7 0-10.7-27.1-11.7-41.2-10.9-4.1.2-8.3.9-11.3 6.3z" fill="#5382A1"/>
        <path d="M42.4 71.4c-8.9 2-20.4 4.5-20.4 12.8 0 9.8 19.3 12.5 31.7 13.3 24.3 1.5 62.7-2 62.7-18.8 0-15.4-37.5-17.7-56.9-16.7-5.9.3-12 1.3-17.1 9.4z" fill="#5382A1"/>
        <path d="M72.2 42.1c8.3-9.5 2.6-17.6-3.8-24.5-3.3-3.6-6.6-7.3-6.6-12.6h-2.5c0 6.8 3.8 11.2 7.7 15.6 5.6 6.3 9.4 12.5 2.8 19.7-4.1 4.5-4.8 9.5-2.6 14.8 2.3 5.4 6.8 9.7 11.4 14l2-1.9c-4.4-4-8.4-7.9-10.5-12.6-2.1-4.7-1.4-8.8 2.1-12.5z" fill="#E76F00"/>
        <path d="M51.6 30.5c4.7-5.4 1.5-10-2.2-13.9-1.9-2-3.8-4.1-3.8-7.1h-2.5c0 4.4 2.4 7.2 4.9 10 3.5 4 5.9 7.9 1.8 12.5-2.6 2.9-3 6-1.6 9.4 1.4 3.4 4.3 6.2 7.2 8.9l2-1.9c-2.8-2.6-5.3-5-6.6-8-1.3-3-.9-5.6 1.4-7.9z" fill="#E76F00"/>
        <path d="M89.7 101.4c-8.8 7.3-35.3 10.6-56.5 7.1-1.4-.2-2.3-1.4-2.1-2.7.2-1.4 1.4-2.3 2.7-2.1 20 3.3 45.4.1 53.6-6.6 1.1-.9 2.7-.8 3.6.3.9 1 .8 2.8-.3 4z" fill="#E76F00"/>
      </svg>
    );
  }

  // C++ (Official Blue Hexagon + C++)
  if (normalized === 'c++' || normalized === 'cpp') {
    return (
      <svg viewBox="0 0 128 128" className={className} xmlns="http://www.w3.org/2000/svg" title={title || 'C++'}>
        <path d="M116.5 33.7L66.7 5c-1.7-1-3.7-1-5.4 0L11.5 33.7c-1.7 1-2.7 2.7-2.7 4.7v57.4c0 2 1 3.7 2.7 4.7l49.8 28.7c1.7 1 3.7 1 5.4 0l49.8-28.7c1.7-1 2.7-2.7 2.7-4.7V38.4c0-2-1-3.7-2.7-4.7z" fill="#00599C"/>
        <path d="M64 21.6c-23.4 0-42.4 19-42.4 42.4S40.6 106.4 64 106.4c17.6 0 32.8-10.7 39.2-26l-14.8-6.1C84.6 83.7 75 90.9 64 90.9c-14.9 0-26.9-12-26.9-26.9S49.1 37.1 64 37.1c11 0 20.6 7.2 24.4 17.6l14.8-6.1C96.8 32.3 81.6 21.6 64 21.6z" fill="#FFFFFF"/>
        <path d="M96 59h4v-8h6v8h8v6h-8v8h-6v-8h-4v-6zm20 0h4v-8h6v8h8v6h-8v8h-6v-8h-4v-6z" fill="#004482"/>
        <path d="M94 57h4v-8h6v8h8v6h-8v8h-6v-8h-4v-6zm20 0h4v-8h6v8h8v6h-8v8h-6v-8h-4v-6z" fill="#659AD2"/>
      </svg>
    );
  }

  // C Language (Classic C Hexagon)
  if (normalized === 'c' || normalized.startsWith('c ') || normalized.startsWith('c_') || normalized.includes('c language')) {
    return (
      <svg viewBox="0 0 128 128" className={className} xmlns="http://www.w3.org/2000/svg" title={title || 'C Language'}>
        <path d="M116.5 33.7L66.7 5c-1.7-1-3.7-1-5.4 0L11.5 33.7c-1.7 1-2.7 2.7-2.7 4.7v57.4c0 2 1 3.7 2.7 4.7l49.8 28.7c1.7 1 3.7 1 5.4 0l49.8-28.7c1.7-1 2.7-2.7 2.7-4.7V38.4c0-2-1-3.7-2.7-4.7z" fill="#A8B9CC"/>
        <path d="M64 21.6c-23.4 0-42.4 19-42.4 42.4S40.6 106.4 64 106.4c17.6 0 32.8-10.7 39.2-26l-14.8-6.1C84.6 83.7 75 90.9 64 90.9c-14.9 0-26.9-12-26.9-26.9S49.1 37.1 64 37.1c11 0 20.6 7.2 24.4 17.6l14.8-6.1C96.8 32.3 81.6 21.6 64 21.6z" fill="#00599C"/>
        <path d="M64 27c-20.4 0-37 16.6-37 37s16.6 37 37 37c15.3 0 28.6-9.3 34.2-22.6l-12.9-5.3C81.9 81.6 73.5 88 64 88c-13.2 0-24-10.8-24-24s10.8-24 24-24c9.5 0 17.9 6.4 21.3 15.9l12.9-5.3C92.6 36.3 79.3 27 64 27z" fill="#FFFFFF"/>
      </svg>
    );
  }

  // C# (.NET Purple Hexagon)
  if (normalized.includes('c#') || normalized.includes('csharp') || normalized.includes('.net')) {
    return (
      <svg viewBox="0 0 128 128" className={className} xmlns="http://www.w3.org/2000/svg" title={title || 'C#'}>
        <path d="M116.5 33.7L66.7 5c-1.7-1-3.7-1-5.4 0L11.5 33.7c-1.7 1-2.7 2.7-2.7 4.7v57.4c0 2 1 3.7 2.7 4.7l49.8 28.7c1.7 1 3.7 1 5.4 0l49.8-28.7c1.7-1 2.7-2.7 2.7-4.7V38.4c0-2-1-3.7-2.7-4.7z" fill="#512BD4"/>
        <path d="M57 32c-17.7 0-32 14.3-32 32s14.3 32 32 32c13.3 0 24.8-8.1 29.6-19.6l-11.2-4.6C62.6 78.8 55.3 84.4 47 84.4c-11.3 0-20.4-9.1-20.4-20.4S35.7 43.6 47 43.6c8.3 0 15.6 5.6 18.4 12.6l11.2-4.6C71.8 40.1 60.3 32 47 32z" fill="#FFFFFF"/>
        <path d="M85 53h4l1.5-6h4.5l-1.5 6H98v4.5h-5.6l-1.4 5.5H96v4.5h-6.1l-1.6 6.5h-4.6l1.6-6.5h-5.4l-1.6 6.5h-4.6l1.6-6.5H71V57.5h5.5l1.4-5.5H73V47h6.1l1.6-6h4.6l-1.6 6h5.4l1.6-6h4.6l-1.7 6zm-7.6 10H83l1.4-5.5h-5.6l-1.4 5.5z" fill="#239120"/>
        <path d="M84 52h4l1.5-6h4.5l-1.5 6H97v4.5h-5.6l-1.4 5.5H95v4.5h-6.1l-1.6 6.5h-4.6l1.6-6.5h-5.4l-1.6 6.5h-4.6l1.6-6.5H70V56.5h5.5l1.4-5.5H72V46h6.1l1.6-6h4.6l-1.6 6h5.4l1.6-6h4.6l-1.7 6zm-7.6 10H82l1.4-5.5h-5.6l-1.4 5.5z" fill="#FFFFFF"/>
      </svg>
    );
  }

  // Go / Golang (Official Cyan Wordmark / Gopher)
  if (normalized === 'go' || normalized.startsWith('go ') || normalized.startsWith('go_') || normalized.startsWith('go(') || normalized.includes('golang')) {
    return (
      <svg viewBox="0 0 128 128" className={className} xmlns="http://www.w3.org/2000/svg" title={title || 'Go'}>
        <path d="M12.8 55.4h42.1v6.7H12.8zm-7.9 13.9h42.1V76H4.9zm15.7 13.9h31.4v6.7H20.6z" fill="#00ADD8"/>
        <path d="M78.6 37.9c-18.4 0-31.5 13.3-31.5 32.5 0 20.3 14.1 33.2 33.3 33.2 16.4 0 27.2-9.6 30.6-23.7H89.9v-7.8h30.8c.4 2.1.6 4.3.6 6.5 0 20.4-14.7 34.3-38.6 34.3-25.1 0-43.1-17.7-43.1-42.5 0-24.3 17.6-41.8 42.4-41.8 17.1 0 29.8 8.4 35.5 22.4l-8.7 5c-3.8-10.4-12.7-18.1-23.9-18.1z" fill="#00ADD8"/>
        <path d="M124.9 66.8c0 14.9-10.5 25.6-25.2 25.6-14.6 0-25.1-10.7-25.1-25.6 0-15 10.5-25.7 25.1-25.7 14.7 0 25.2 10.7 25.2 25.7zm-9.7 0c0-10.1-6.6-17.3-15.5-17.3s-15.4 7.2-15.4 17.3c0 10 6.5 17.3 15.4 17.3s15.5-7.3 15.5-17.3z" fill="#00ADD8"/>
      </svg>
    );
  }

  // Rust (Official Cogwheel + R)
  if (normalized.includes('rust')) {
    return (
      <svg viewBox="0 0 128 128" className={className} xmlns="http://www.w3.org/2000/svg" title={title || 'Rust'}>
        <circle cx="64" cy="64" r="54" fill="#000000"/>
        <path d="M64 16l3 6h6l2-7 7 4-1 7 5 3 5-5 6 6-5 5 3 5 7-1 4 7-7 2 6 6-7 4 3 6-7 1 1 7-7 2-1 7-7-2-4 7-6-6-5 5-3-5-6 6-5-5-5 5-6-6 3-5-5-5-6 6-4-7-7 2-1-7-7-2 1-7-7-1 3-6-7-4 6-6-7-2 4-7-7-1 3-5 5-5-5-5 6-6 5 5 5-3-1-7 7-4 2 7 6-6 3-6z" fill="#CE412B"/>
        <circle cx="64" cy="64" r="42" fill="#202020"/>
        <path d="M48 40h21c10 0 17 6 17 15 0 7-5 12-11 14l13 19H73l-10-16h-7v16H48V40zm8 11v11h12c5 0 8-2 8-5.5s-3-5.5-8-5.5H56z" fill="#FFFFFF"/>
      </svg>
    );
  }

  // PHP (Official Purple Oval + White PHP)
  if (normalized === 'php') {
    return (
      <svg viewBox="0 0 128 128" className={className} xmlns="http://www.w3.org/2000/svg" title={title || 'PHP'}>
        <ellipse cx="64" cy="64" rx="60" ry="36" fill="#777BB4"/>
        <path d="M44.5 48h-14l-7 32h7.8l2.2-10.2h5.7c7.4 0 12.2-4.3 13.8-11.4 1.5-6.8-1.9-10.4-8.5-10.4zm-2.8 12.7c-.7 3.3-3.1 4.7-6.8 4.7h-3.4l2.1-9.7h3.8c3.9 0 5 1.5 4.3 5zm31.7-12.7h-7.8l-7 32h7.8l2.9-13.4h8.3l-2.9 13.4h7.8l7-32h-7.8l-2.9 13.1h-8.3l2.9-13.1zm33.4 0h-14l-7 32h7.8l2.2-10.2h5.7c7.4 0 12.2-4.3 13.8-11.4 1.5-6.8-1.9-10.4-8.5-10.4zm-2.8 12.7c-.7 3.3-3.1 4.7-6.8 4.7h-3.4l2.1-9.7h3.8c3.9 0 5 1.5 4.3 5z" fill="#FFFFFF"/>
      </svg>
    );
  }

  // Ruby (Official Faceted Red Gem)
  if (normalized.includes('ruby')) {
    return (
      <svg viewBox="0 0 128 128" className={className} xmlns="http://www.w3.org/2000/svg" title={title || 'Ruby'}>
        <path d="M26 15l-19 36 57 65 57-65-19-36H26z" fill="#CC342D"/>
        <path d="M26 15l38 36-57 0 19-36z" fill="#E8473D"/>
        <path d="M102 15l-38 36 57 0-19-36z" fill="#A81D17"/>
        <path d="M64 51L7 51l57 65V51z" fill="#F45E56"/>
        <path d="M64 51l57 0-57 65V51z" fill="#880E09"/>
        <path d="M26 15h76L64 51 26 15z" fill="#FFFFFF" fillOpacity="0.85"/>
      </svg>
    );
  }

  // Swift (Official Orange Bird Soaring)
  if (normalized.includes('swift')) {
    return (
      <svg viewBox="0 0 128 128" className={className} xmlns="http://www.w3.org/2000/svg" title={title || 'Swift'}>
        <rect width="128" height="128" rx="28" fill="#F05138"/>
        <path d="M104.9 101.4c-1.3-1.1-26.6-21.7-27.4-48.4 0-.4 0-.8.1-1.2-5.7 7.7-10.7 17.5-11.6 28.5 0 .4 0 .7.1 1.1-9.9-7.9-16.3-19-17-31.2-.1-1.4 0-2.8.2-4.1-13 8.3-21.4 22.8-22.1 39.5 0 .7.1 1.4.1 2.1-5.7-6.2-9.2-14.5-9.2-23.7 0-19 14.6-34.6 33.2-36.2 12.9-1.1 24.9 4.9 32.4 14.8 6.4-5.2 13.9-8.9 22.2-10.6-2.5 3.3-4.4 7-5.8 11 8.8-3.4 18.3-4.2 27.6-2.2-6.5 4.3-12.2 9.6-17 15.8 14.8 10.6 23.3 26.9 22.8 44.9h-8.6z" fill="#FFFFFF"/>
      </svg>
    );
  }

  // Kotlin (Official Geometric Quadrilateral)
  if (normalized.includes('kotlin')) {
    return (
      <svg viewBox="0 0 128 128" className={className} xmlns="http://www.w3.org/2000/svg" title={title || 'Kotlin'}>
        <defs>
          <linearGradient id="kg1" x1="100%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#E4485D"/>
            <stop offset="50%" stopColor="#C711E1"/>
            <stop offset="100%" stopColor="#7F52FF"/>
          </linearGradient>
        </defs>
        <path d="M124 4H4v120h120L64 64l60-60z" fill="url(#kg1)"/>
        <path d="M4 4h60L4 64V4z" fill="#0095D5"/>
      </svg>
    );
  }

  // Dart & Flutter (Official Geometric Chevron)
  if (normalized.includes('dart') || normalized.includes('flutter')) {
    return (
      <svg viewBox="0 0 128 128" className={className} xmlns="http://www.w3.org/2000/svg" title={title || 'Dart'}>
        <path d="M28.4 100.8L8 80.4l51.2-51.2 20.4 20.4-51.2 51.2z" fill="#0175C2"/>
        <path d="M59.2 119.2l-20.4-20.4 39.8-39.8 20.4 20.4-39.8 39.8z" fill="#02569B"/>
        <path d="M119.2 78.4L78.4 119.2H47.6l51.2-51.2 20.4 10.4z" fill="#01579B"/>
        <path d="M78.4 8.8L37.6 49.6l20.4 20.4 40.8-40.8V8.8H78.4z" fill="#40C4FF"/>
      </svg>
    );
  }

  // Scala (Official Red Curve Staircase)
  if (normalized.includes('scala')) {
    return (
      <svg viewBox="0 0 128 128" className={className} xmlns="http://www.w3.org/2000/svg" title={title || 'Scala'}>
        <path d="M24 16c48 10 72 20 72 20v24s-24-10-72-20V16z" fill="#DC322F"/>
        <path d="M24 52c48 10 72 20 72 20v24s-24-10-72-20V52z" fill="#DC322F"/>
        <path d="M24 88c48 10 72 20 72 20v24s-24-10-72-20V88z" fill="#DC322F"/>
      </svg>
    );
  }

  // Docker & DevOps (Official Whale with Container Cargo)
  if (normalized.includes('docker') || normalized.includes('devops')) {
    return (
      <svg viewBox="0 0 128 128" className={className} xmlns="http://www.w3.org/2000/svg" title={title || 'Docker'}>
        {/* Containers */}
        <rect x="42" y="32" width="10" height="9" rx="1.5" fill="#2496ED"/>
        <rect x="55" y="32" width="10" height="9" rx="1.5" fill="#2496ED"/>
        <rect x="68" y="32" width="10" height="9" rx="1.5" fill="#2496ED"/>
        <rect x="29" y="44" width="10" height="9" rx="1.5" fill="#2496ED"/>
        <rect x="42" y="44" width="10" height="9" rx="1.5" fill="#2496ED"/>
        <rect x="55" y="44" width="10" height="9" rx="1.5" fill="#2496ED"/>
        <rect x="68" y="44" width="10" height="9" rx="1.5" fill="#2496ED"/>
        <rect x="81" y="44" width="10" height="9" rx="1.5" fill="#2496ED"/>
        {/* Whale body */}
        <path d="M122.5 59c-3.1-.9-12.7-1.4-19.5 3.9-3.2-2.3-8.8-3.9-15-4.1H5c-1.5 7.8 0 25.1 12.5 34.6 15.6 11.9 44.5 11.9 66.8 0 15.8-8.4 24.3-21.7 26.5-27.9 3.5.7 11.4 1.5 15.2-4.5.8-1.2 1.5-2 1.5-2z" fill="#2496ED"/>
        <circle cx="28" cy="74" r="2.5" fill="#FFFFFF"/>
      </svg>
    );
  }

  // Bash / Shell (Terminal Prompt >_)
  if (normalized.includes('bash') || normalized.includes('shell') || normalized.includes('linux')) {
    return (
      <svg viewBox="0 0 128 128" className={className} xmlns="http://www.w3.org/2000/svg" title={title || 'Bash'}>
        <rect width="128" height="128" rx="20" fill="#2C3E50"/>
        <path d="M26 38l28 26-28 26v-12l15-14-15-14V38zm34 44h42v10H60v-10z" fill="#4EAA25"/>
      </svg>
    );
  }

  // Generic Tech Fallback (Branded Code Icon)
  return (
    <svg viewBox="0 0 128 128" className={className} xmlns="http://www.w3.org/2000/svg" title={title || skill}>
      <rect width="128" height="128" rx="20" fill="#047857"/>
      <path d="M48 40L24 64l24 24M80 40l24 24-24 24M68 32l-8 64" stroke="#FFFFFF" strokeWidth="10" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
    </svg>
  );
}
