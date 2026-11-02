// رموز الأدوات: أشكال مرسومة خصيصاً للموقع (شبكة 24×24)، كل رمز من طبقتين:
//   l = خطوط الرمز (بتتلون أبيض)، f = طبقة تظليل ناعمة وراها (بتدّي عمق من غير ما الشكل يتقل).
// الأيقونة النهائية بلاطة متدرجة بلون التصنيف + الرمز. الأدوات اللي ملهاش رمز خاص بتاخد رمز تصنيفها.

export const GL = {
  pen: { l: "M4 20l1-4.2L15.7 5.1a2 2 0 0 1 2.8 0l.4.4a2 2 0 0 1 0 2.8L8.2 19zM13.5 7.3l3.2 3.2M4 20h16", f: "M4 20l1-4.2 3.2 3.2z" },
  rewrite: { l: "M5 12a7 7 0 0 1 12-4.9M19 5v3.5h-3.5M19 12a7 7 0 0 1-12 4.9M5 19v-3.5h3.5", f: "M12 8.5a3.5 3.5 0 1 0 0 7a3.5 3.5 0 0 0 0-7z" },
  lines: { l: "M4 6h16M4 10h16M4 14h10M4 18h6", f: "M3.5 4.5h17v7h-17z" },
  check: { l: "M7 12.5l3.2 3.2L17 8.6M12 3.5a8.5 8.5 0 1 0 0 17a8.5 8.5 0 0 0 0-17z", f: "M12 3.5a8.5 8.5 0 1 0 0 17a8.5 8.5 0 0 0 0-17z" },
  doc: { l: "M6 3h8l4 4v14H6zM14 3v4h4M9 12h6M9 15.5h6M9 8.5h2", f: "M6 3h8l4 4v14H6z" },
  megaphone: { l: "M4 10v4a1 1 0 0 0 1 1h2l8 4V5L7 9H5a1 1 0 0 0-1 1zM18 9.5a3.5 3.5 0 0 1 0 5M7 15l1.4 4.5h2.2L10 16", f: "M7 9l8-4v14l-8-4z" },
  eye: { l: "M2.5 12S6 5.5 12 5.5 21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12zM12 9a3 3 0 1 0 0 6a3 3 0 0 0 0-6z", f: "M12 9a3 3 0 1 0 0 6a3 3 0 0 0 0-6z" },
  browser: { l: "M3.5 5.5h17v13h-17zM3.5 9.5h17M7 7.5h.01M10 7.5h.01M7 13h6M7 15.5h4", f: "M3.5 5.5h17v4h-17z" },
  search: { l: "M10.5 4.5a6 6 0 1 0 0 12a6 6 0 0 0 0-12zM19.5 19.5l-4.6-4.6", f: "M10.5 4.5a6 6 0 1 0 0 12a6 6 0 0 0 0-12z" },
  flag: { l: "M6 21V4M6 5h11l-2 3.5l2 3.5H6", f: "M6 5h11l-2 3.5l2 3.5H6z" },
  phone: { l: "M8 3.5h8A1.5 1.5 0 0 1 17.5 5v14a1.5 1.5 0 0 1-1.5 1.5H8A1.5 1.5 0 0 1 6.5 19V5A1.5 1.5 0 0 1 8 3.5zM10.5 17.5h3", f: "M8 5h8v11H8z" },
  camera: { l: "M4 7h3l1.5-2h7L17 7h3v12H4zM12 10a3.2 3.2 0 1 0 0 6.4A3.2 3.2 0 0 0 12 10z", f: "M12 10a3.2 3.2 0 1 0 0 6.4A3.2 3.2 0 0 0 12 10z" },
  play: { l: "M3.5 6.5h17v11h-17zM10.5 9.5v5l4.5-2.5z", f: "M10.5 9.5v5l4.5-2.5z" },
  calendar: { l: "M4 6h16v14H4zM4 10.5h16M8.5 3.5v4M15.5 3.5v4M8 14h2M13 14h3", f: "M4 6h16v4.5H4z" },
  briefcase: { l: "M4 8h16v11H4zM9 8V5.5h6V8M4 13h16", f: "M4 8h16v5H4z" },
  bulb: { l: "M9 18.5h6M10 21h4M12 3.5a5.5 5.5 0 0 0-3.2 10c.8.6 1.2 1.4 1.2 2.5h4c0-1.1.4-1.9 1.2-2.5A5.5 5.5 0 0 0 12 3.5z", f: "M12 3.5a5.5 5.5 0 0 0-3.2 10c.8.6 1.2 1.4 1.2 2.5h4c0-1.1.4-1.9 1.2-2.5A5.5 5.5 0 0 0 12 3.5z" },
  box: { l: "M12 3l8 4v10l-8 4-8-4V7zM4 7l8 4 8-4M12 11v10", f: "M4 7l8 4 8-4-8-4z" },
  bubble: { l: "M20.5 11.5a8.3 8.3 0 0 1-8.9 8.3L3.5 21l1.1-3.5A8.3 8.3 0 1 1 20.5 11.5z", f: "M20.5 11.5a8.3 8.3 0 0 1-8.9 8.3L3.5 21l1.1-3.5A8.3 8.3 0 1 1 20.5 11.5z" },
  chatdots: { l: "M20.5 11.5a8.3 8.3 0 0 1-8.9 8.3L3.5 21l1.1-3.5A8.3 8.3 0 1 1 20.5 11.5zM8.5 12h.01M12 12h.01M15.5 12h.01", f: "M20.5 11.5a8.3 8.3 0 0 1-8.9 8.3L3.5 21l1.1-3.5A8.3 8.3 0 1 1 20.5 11.5z" },
  cap: { l: "M2.5 9L12 4.5 21.5 9 12 13.5zM6.5 11.2v4.3c0 1.2 2.5 2.5 5.5 2.5s5.5-1.3 5.5-2.5v-4.3M21.5 9v5.5", f: "M2.5 9L12 4.5 21.5 9 12 13.5z" },
  quiz: { l: "M12 3.5a8.5 8.5 0 1 0 0 17a8.5 8.5 0 0 0 0-17zM9.5 9.5a2.5 2.5 0 1 1 3.5 2.3c-.7.4-1 .9-1 1.7M12 16.5h.01", f: "M12 3.5a8.5 8.5 0 1 0 0 17a8.5 8.5 0 0 0 0-17z" },
  book: { l: "M4 5.5C6.5 4 9.5 4 12 5.5V20c-2.5-1.5-5.5-1.5-8 0zM20 5.5C17.5 4 14.5 4 12 5.5V20c2.5-1.5 5.5-1.5 8 0z", f: "M4 5.5C6.5 4 9.5 4 12 5.5V20c-2.5-1.5-5.5-1.5-8 0z" },
  math: { l: "M5.5 8h5M8 5.5v5M13.5 8h5M6 14l4.5 4.5M10.5 14L6 18.5M13.5 15h5M13.5 18h5", f: "M4 4h7v7H4z" },
  translate: { l: "M4 5h9M8.5 3v2M6 5c.6 3 2.6 5.6 5.5 7M11 5c-.8 3.6-3.2 6.4-6.5 8M13 21l4-10l4 10M14.4 17.5h5.2", f: "M4 4h9v8H4z" },
  globe: { l: "M12 3.5a8.5 8.5 0 1 0 0 17a8.5 8.5 0 0 0 0-17zM3.5 12h17M12 3.5c2.5 2.6 3.6 5.4 3.6 8.5s-1.1 5.9-3.6 8.5c-2.5-2.6-3.6-5.4-3.6-8.5s1.1-5.9 3.6-8.5z", f: "M12 3.5a8.5 8.5 0 1 0 0 17a8.5 8.5 0 0 0 0-17z" },
  atext: { l: "M4 19l5-13 5 13M6 14h6M15.5 16l2 2 3.5-4", f: "M4 19l5-13 5 13z" },
  code: { l: "M8.5 7L3.5 12l5 5M15.5 7l5 5l-5 5M13.5 4.5l-3 15", f: "M8.5 7L3.5 12l5 5z" },
  terminal: { l: "M3.5 5h17v14h-17zM7 9.5l3 2.5-3 2.5M12.5 15h4.5", f: "M3.5 5h17v4h-17z" },
  bug: { l: "M9 8a3 3 0 0 1 6 0M8 9h8v6a4 4 0 0 1-8 0zM12 9v10M4 12h4M16 12h4M5 7l3 2M19 7l-3 2M5 18l3-2M19 18l-3-2", f: "M8 9h8v6a4 4 0 0 1-8 0z" },
  grid: { l: "M4 4h16v16H4zM4 9.3h16M4 14.6h16M9.3 4v16", f: "M4 4h16v5.3H4z" },
  person: { l: "M5 4h14v16H5zM12 8a2.5 2.5 0 1 0 0 5a2.5 2.5 0 0 0 0-5zM8 18c.5-2 2-3 4-3s3.5 1 4 3", f: "M12 8a2.5 2.5 0 1 0 0 5a2.5 2.5 0 0 0 0-5z" },
  mail: { l: "M3.5 6h17v12h-17zM3.5 7l8.5 6 8.5-6", f: "M3.5 6h17v1l-8.5 6-8.5-6z" },
  mic: { l: "M12 3.5a3 3 0 0 0-3 3v5a3 3 0 0 0 6 0v-5a3 3 0 0 0-3-3zM6 11a6 6 0 0 0 12 0M12 17v3.5M9 20.5h6", f: "M12 3.5a3 3 0 0 0-3 3v5a3 3 0 0 0 6 0v-5a3 3 0 0 0-3-3z" },
  reply: { l: "M9 8L4 12.5 9 17M4 12.5h9a7 7 0 0 1 7 7", f: "M9 8L4 12.5 9 17z" },
  speech: { l: "M4 5h16v11H11l-4 4v-4H4zM8 9h8M8 12h5", f: "M4 5h16v11H4z" },
  moon: { l: "M20 14.5A8 8 0 0 1 9.5 4a8 8 0 1 0 10.5 10.5z", f: "M20 14.5A8 8 0 0 1 9.5 4a8 8 0 1 0 10.5 10.5z" },
  feather: { l: "M19 4.5c-6.5 0-11 4.5-11 11V20M8 15.5h6.5C18 15.5 20 11 19 4.5M11 12h5", f: "M19 4.5c-6.5 0-11 4.5-11 11h6.5C18 15.5 20 11 19 4.5z" },
  image: { l: "M4 5h16v14H4zM4 16l4.5-4.5L13 16M12 14.5l2.5-2.5L20 17M15.5 8.5h.01", f: "M4 16l4.5-4.5L13 16v3H4z" },
  hex: { l: "M12 3l8 4.5v9L12 21l-8-4.5v-9zM12 12l8-4.5M12 12L4 7.5M12 12v9", f: "M12 12L4 7.5 12 3l8 4.5z" },
  film: { l: "M4 4h16v16H4zM8 4v16M16 4v16M4 8h4M4 12h4M4 16h4M16 8h4M16 12h4M16 16h4", f: "M8 4h8v16H8z" },
  chart: { l: "M6 3h12v18H6zM9 16v-3M12 16V9M15 16v-5", f: "M6 3h12v5H6z" },
  scales: { l: "M12 4v16M6 20h12M5 7.5h14M5 7.5l-2.5 6a3 3 0 0 0 5 0zM19 7.5l-2.5 6a3 3 0 0 0 5 0z", f: "M5 7.5l-2.5 6h5zM19 7.5l-2.5 6h5z" },
  spark: { l: "M12 3v4M12 17v4M3 12h4M17 12h4M12 8.5l1.2 2.3l2.3 1.2l-2.3 1.2L12 15.5l-1.2-2.3L8.5 12l2.3-1.2z", f: "M12 8.5l1.2 2.3l2.3 1.2l-2.3 1.2L12 15.5l-1.2-2.3L8.5 12l2.3-1.2z" },
  plane: { l: "M21 4L3 11l7 2.5L12.5 21zM10 13.5L21 4", f: "M21 4L3 11l7 2.5z" },
  sliders: { l: "M4 7h16M4 12h16M4 17h16M14 5a2 2 0 1 0 0 4a2 2 0 0 0 0-4zM8 10a2 2 0 1 0 0 4a2 2 0 0 0 0-4zM16 15a2 2 0 1 0 0 4a2 2 0 0 0 0-4z", f: "M14 5a2 2 0 1 0 0 4a2 2 0 0 0 0-4zM8 10a2 2 0 1 0 0 4a2 2 0 0 0 0-4zM16 15a2 2 0 1 0 0 4a2 2 0 0 0 0-4z" },
  poster: { l: "M6 3h12v18H6zM9 7h6M9 10h6M9 14h3", f: "M6 3h12v9H6z" },
  cutout: { l: "M12 4a3 3 0 1 0 0 6a3 3 0 0 0 0-6zM5.5 20c.6-3.8 3.2-6 6.5-6s5.9 2.2 6.5 6", f: "M12 4a3 3 0 1 0 0 6a3 3 0 0 0 0-6z" },
  resize: { l: "M4 10V4h6M20 14v6h-6M4 4l7 7M20 20l-7-7", f: "M4 4h7v7H4z" },
  compress: { l: "M10 4v6H4M14 20v-6h6M10 10L4 4M14 14l6 6", f: "M4 4h6v6H4z" },
  convert: { l: "M4 9h13l-3.5-3.5M20 15H7l3.5 3.5", f: "M4 9h13l-3.5-3.5z" },
  drop: { l: "M12 3.5c3.5 4.2 6 7.4 6 10.5a6 6 0 0 1-12 0c0-3.1 2.5-6.3 6-10.5z", f: "M12 3.5c3.5 4.2 6 7.4 6 10.5a6 6 0 0 1-12 0c0-3.1 2.5-6.3 6-10.5z" },
  palette: { l: "M12 3.5a8.5 8.5 0 1 0 0 17c1.3 0 1.8-.9 1.4-1.9c-.6-1.4.3-2.6 1.7-2.6h1.9a3.5 3.5 0 0 0 3.5-3.5c0-5-3.8-9-8.5-9zM7.8 11.5h.01M10 7.5h.01M14.5 7.5h.01", f: "M12 3.5a8.5 8.5 0 1 0 0 17c1.3 0 1.8-.9 1.4-1.9c-.6-1.4.3-2.6 1.7-2.6h1.9a3.5 3.5 0 0 0 3.5-3.5c0-5-3.8-9-8.5-9z" },
  pdf: { l: "M6 3h8l4 4v14H6zM14 3v4h4M9 17v-4h1.4a1.3 1.3 0 0 1 0 2.6H9", f: "M6 3h8l4 4v14H6z" },
  merge: { l: "M6 4v5c0 3 6 3 6 6v5M18 4v5c0 3-6 3-6 6M12 17l-2.5-2.5M12 17l2.5-2.5", f: "M6 4h12v5H6z" },
  split: { l: "M12 4v6c0 3-6 3-6 6v4M12 10c0 3 6 3 6 6v4M3.5 20h5M15.5 20h5", f: "M9 4h6v6H9z" },
  frame: { l: "M4 8V4h4M16 4h4v4M20 16v4h-4M8 20H4v-4M10 9.5l5 2.5l-5 2.5z", f: "M10 9.5l5 2.5l-5 2.5z" },
  apps: { l: "M4 4h6.5v6.5H4zM13.5 4H20v6.5h-6.5zM4 13.5h6.5V20H4zM13.5 13.5H20V20h-6.5z", f: "M4 4h6.5v6.5H4z" },
  cart: { l: "M3.5 4.5h2.5l2 10h9.5l2-7.5H7M10 19.5h.01M16.5 19.5h.01", f: "M7 7.5h12.5l-2 7H8z" },
  home: { l: "M4 11l8-7 8 7M6 9.5V20h12V9.5M10 20v-5h4v5", f: "M6 9.5L12 4.5l6 5V20H6z" },
  calc: { l: "M6 3.5h12v17H6zM8.5 6.5h7V10h-7zM9 13.5h.01M12 13.5h.01M15 13.5h.01M9 17h.01M12 17h.01M15 17h.01", f: "M8.5 6.5h7V10h-7z" },
  coin: { l: "M12 3.5a8.5 8.5 0 1 0 0 17a8.5 8.5 0 0 0 0-17zM14.5 9.2c-.6-.8-1.5-1.2-2.5-1.2-1.5 0-2.5.8-2.5 2s1 1.7 2.5 2 2.5.8 2.5 2-1 2-2.5 2c-1 0-2-.4-2.5-1.2M12 6.5V8M12 16v1.5", f: "M12 3.5a8.5 8.5 0 1 0 0 17a8.5 8.5 0 0 0 0-17z" },
  percent: { l: "M18.5 5.5l-13 13M7.5 4a3 3 0 1 0 0 6a3 3 0 0 0 0-6zM16.5 14a3 3 0 1 0 0 6a3 3 0 0 0 0-6z", f: "M7.5 4a3 3 0 1 0 0 6a3 3 0 0 0 0-6zM16.5 14a3 3 0 1 0 0 6a3 3 0 0 0 0-6z" },
  clock: { l: "M12 3.5a8.5 8.5 0 1 0 0 17a8.5 8.5 0 0 0 0-17zM12 7.5V12l3 2", f: "M12 3.5a8.5 8.5 0 1 0 0 17a8.5 8.5 0 0 0 0-17z" },
  lock: { l: "M6 11h12v9H6zM8.5 11V8a3.5 3.5 0 0 1 7 0v3M12 14.5v2.5", f: "M6 11h12v9H6z" },
  qr: { l: "M4 4h6v6H4zM14 4h6v6h-6zM4 14h6v6H4zM14 14h2.5v2.5H14zM19 14h1v1M14 19.5h1M17.5 17.5h2.5v2.5h-2.5z", f: "M4 4h6v6H4zM14 4h6v6h-6zM4 14h6v6H4z" },
  speaker: { l: "M4 10v4h3.5l5 4V6l-5 4zM16 9.5a4 4 0 0 1 0 5M18.5 7a7.5 7.5 0 0 1 0 10", f: "M4 10v4h3.5l5 4V6l-5 4z" },
  scan: { l: "M4 8V5.5A1.5 1.5 0 0 1 5.5 4H8M16 4h2.5A1.5 1.5 0 0 1 20 5.5V8M20 16v2.5a1.5 1.5 0 0 1-1.5 1.5H16M8 20H5.5A1.5 1.5 0 0 1 4 18.5V16M8 9.5h8M8 12.5h8M8 15.5h5", f: "M7 8h10v9H7z" },
  crop: { l: "M7 3.5v13.5h13.5M3.5 7H17v13.5", f: "M7 7h10v10H7z" },
  audio: { l: "M9 18V6l10-2v12M9 18a2.5 2.5 0 1 1-5 0a2.5 2.5 0 0 1 5 0zM19 16a2.5 2.5 0 1 1-5 0a2.5 2.5 0 0 1 5 0z", f: "M9 6l10-2v4L9 10z" },
  textT: { l: "M5 6V4.5h14V6M12 4.5V19.5M9 19.5h6", f: "M5 4.5h14V6H5z" },
  hash: { l: "M7 4.5l-1.6 15M13.5 4.5L12 19.5M4 9h14M3.5 15h14", f: "M4 9h14v6H4z" },
  trash: { l: "M5 6.5h14M9.5 6.5V4.5h5v2M7 6.5l.8 13h8.4l.8-13M10 10.5v6M14 10.5v6", f: "M7 6.5l.8 13h8.4l.8-13z" },
  sun: { l: "M12 8a4 4 0 1 0 0 8a4 4 0 0 0 0-8zM12 2.5v2.5M12 19v2.5M2.5 12H5M19 12h2.5M5.3 5.3l1.8 1.8M16.9 16.9l1.8 1.8M5.3 18.7l1.8-1.8M16.9 7.1l1.8-1.8", f: "M12 8a4 4 0 1 0 0 8a4 4 0 0 0 0-8z" },
  bolt: { l: "M13 3L5 13.5h6L10 21l8-10.5h-6z", f: "M13 3L5 13.5h6L10 21l8-10.5h-6z" },
  fuel: { l: "M5 20.5V5a1.5 1.5 0 0 1 1.5-1.5h6A1.5 1.5 0 0 1 14 5v15.5M4 20.5h11M14 9h2.5a1.5 1.5 0 0 1 1.5 1.5v6a1.5 1.5 0 0 0 3 0V9L18.5 6.5M7.5 7h4", f: "M5 4h9v6H5z" },
};

// رمز كل أداة (اللي مش مكتوبة هنا بتاخد رمز تصنيفها)
export const TOOL_GLYPH = {
  article: "pen", rewrite: "rewrite", summarize: "lines", proofread: "check", formalize: "doc",
  "ad-copy": "megaphone", adspy: "eye", "landing-page": "browser", "seo-article": "search", "marketing-plan": "flag",
  post: "phone", caption: "camera", "tiktok-script": "film", "youtube-title": "play", "content-calendar": "calendar",
  "business-plan": "briefcase", "business-ideas": "bulb", proposal: "doc", "product-desc": "box", "whatsapp-sales": "chatdots", "review-reply": "bubble",
  explain: "cap", quiz: "quiz", "study-plan": "calendar", "math-solver": "math", "lesson-plan": "doc",
  translate: "translate", "translate-dialect": "globe", "english-correct": "atext",
  "code-gen": "code", debug: "bug", "code-explain": "terminal", "excel-formula": "grid", cv: "person", "cover-letter": "mail", "interview-qs": "mic",
  "daily-plan": "calendar", brainstorm: "bulb", "email-writer": "mail", "email-reply": "reply", speech: "speech",
  "short-story": "book", "kids-story": "moon", poem: "feather", "image-prompt": "image", "logo-ideas": "hex", "video-prompt": "film",
  report: "chart", compare: "scales", "image-reader": "eye", "sheet-analyst": "grid", "video-qa": "chatdots", "gem-assistant": "spark", "travel-plan": "plane",
  "reel-pro": "play", "product-ad": "box", "video-factory": "film", "ai-video": "spark", "text-video": "film", "photo-video": "image",
  "photo-editor": "sliders", "poster-maker": "poster", "remove-bg": "cutout", "image-resize": "resize", "image-compress": "compress", "image-convert": "convert",
  "qr-code": "qr", "voice-studio": "speaker", "image-enhance": "sliders", "image-to-text": "scan", "pdf-delete-pages": "trash", "percent-calc": "percent", "freelance-rate": "clock", "number-words": "hash", "zakat-calc": "coin", "hijri-date": "moon",
  "word-count": "textT", "text-clean": "spark", "password-gen": "lock",
  watermark: "drop", "color-extract": "palette", "images-to-pdf": "pdf", "pdf-merge": "merge", "pdf-split": "split", "video-frame": "frame", "design-apps": "apps",
};

export const CATEGORY_GLYPH = {
  writing: "pen", marketing: "megaphone", social: "phone", business: "briefcase", ecommerce: "cart", education: "cap", language: "globe", code: "code",
  career: "person", productivity: "check", communication: "mail", creative: "feather", design: "palette", studio: "sliders", analysis: "chart", lifestyle: "home",
  calc: "calc", text: "textT", islamic: "moon", files: "pdf",
};

export const glyphFor = (toolId, catId) => GL[TOOL_GLYPH[toolId]] || GL[CATEGORY_GLYPH[catId]] || GL.spark;

/** الرمز نفسه (من غير بلاطة)، بيتلون بلون النص الحالي. بيتستخدم في شرايح التصنيفات */
export function Glyph({ name, size = 18 }) {
  const g = GL[name] || GL.spark;
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d={g.f} fill="currentColor" fillOpacity="0.16" stroke="none" />
      <path d={g.l} />
    </svg>
  );
}

// ألوان زاهية مختلفة لكل أداة (زي هويات الشركات): [بداية التدرج، نهايته، لون التمييز اللي بيتحط ورا الرمز]
export const PALETTES = [
  ["#7c3aed", "#ec4899", "#ffd21f"], // بنفسجي ← وردي
  ["#2563eb", "#06b6d4", "#fde047"], // أزرق ← سماوي
  ["#f97316", "#ef4444", "#fff1a8"], // برتقالي ← أحمر
  ["#10b981", "#06b6d4", "#fef08a"], // أخضر ← فيروزي
  ["#e11d48", "#f97316", "#ffe27a"], // أحمر وردي ← برتقالي
  ["#6366f1", "#22d3ee", "#fda4af"], // نيلي ← سماوي
  ["#16a34a", "#a3e635", "#ffffff"], // أخضر ← ليموني
  ["#db2777", "#8b5cf6", "#fcd34d"], // فوشيا ← بنفسجي
  ["#0ea5e9", "#6366f1", "#fb7185"], // سماوي ← نيلي
  ["#f59e0b", "#f43f5e", "#ffffff"], // كهرماني ← وردي
  ["#14b8a6", "#3b82f6", "#fde047"], // تركواز ← أزرق
  ["#9333ea", "#3b82f6", "#5eead4"], // بنفسجي ← أزرق
  ["#ef4444", "#ec4899", "#fde047"], // أحمر ← وردي
  ["#84cc16", "#14b8a6", "#ffffff"], // ليموني ← تركواز
];

function hash(str) {
  let h = 2166136261;
  for (let i = 0; i < str.length; i++) { h ^= str.charCodeAt(i); h = Math.imul(h, 16777619); }
  return h >>> 0;
}

/** هوية الأداة: ألوانها وشكل بلاطتها (دايرة أو مربع بحواف ناعمة) ثابتة لكل معرّف */
export function brandFor(id) {
  const h = hash(id);
  const [c1, c2, ac] = PALETTES[h % PALETTES.length];
  return { c1, c2, ac, round: (h >>> 8) % 4 === 0 };
}
