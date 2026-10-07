// src/navigation.js
// Secciones de la app y sus páginas. Lo usan la home, la barra superior y el
// menú lateral: para añadir una sección basta con añadir una entrada aquí.
import {
  Wallet, ShieldCheck, Sofa, Home as HomeIcon,
} from 'lucide-react';

// Una página se identifica por su ruta y, opcionalmente, por el parámetro ?v=.
// Si varias páginas comparten ruta, la primera es la que se muestra sin ?v=.
export const SECCIONES = [
  {
    key: 'finanzas', label: 'Finanzas', Icon: Wallet,
    rutas: ['/finanzas'],
    tono: { bg: '#DEEBFA', edge: '#C3D9F2', ink: '#1D4E89', bgD: '#24384F', edgeD: '#34506F', inkD: '#9EC7F2' },
    paginas: [
      { label: 'Anual', path: '/finanzas', v: 'anual' },
      { label: 'Mensual', path: '/finanzas', v: 'mensual' },
    ],
  },
  {
    key: 'seguros', label: 'Seguros', Icon: ShieldCheck,
    rutas: ['/seguros'],
    tono: { bg: '#DFF2E4', edge: '#C2E3CC', ink: '#1E6B3A', bgD: '#22402C', edgeD: '#335C41', inkD: '#94D8A8' },
    paginas: [
      { label: 'Resumen', path: '/seguros', v: 'resumen' },
      { label: 'Listado', path: '/seguros', v: 'listado' },
    ],
  },
  {
    key: 'casa', label: 'Casa', Icon: Sofa,
    rutas: ['/casa'],
    inicio: '/casa',
    tono: { bg: '#ECE4F7', edge: '#D8CBEE', ink: '#5B3A8C', bgD: '#2E2540', edgeD: '#4A3B66', inkD: '#C9B3EE' },
    paginas: [
      { label: 'Pilas', path: '/casa/pilas' },
    ],
  },
  {
    key: 'pse', label: 'P.S. Espada', Icon: HomeIcon,
    rutas: ['/reports', '/statistics', '/transactions', '/avance', '/admin'],
    tono: { bg: '#FCEEDC', edge: '#F0DBBB', ink: '#8A5A16', bgD: '#453520', edgeD: '#614B2D', inkD: '#EBC386' },
    paginas: [
      { label: 'Resumen', path: '/reports' },
      { label: 'Estadísticas', path: '/statistics' },
      { label: 'Movimientos', path: '/transactions' },
      { label: 'Avance', path: '/avance' },
      { label: 'Admin', path: '/admin' },
    ],
  },
];

export const urlPagina = (p) => (p.v ? `${p.path}?v=${p.v}` : p.path);

// Adónde lleva el acceso de la sección en la home.
export const inicioSeccion = (s) => s.inicio || urlPagina(s.paginas[0]);

// Variables CSS del tono de una sección (claro y oscuro), para usar en style={}.
export const varsTono = (s) => ({
  '--tono-bg': s.tono.bg, '--tono-edge': s.tono.edge, '--tono-ink': s.tono.ink,
  '--tono-bg-d': s.tono.bgD, '--tono-edge-d': s.tono.edgeD, '--tono-ink-d': s.tono.inkD,
});

// { seccion, pagina } de la URL actual; null si no pertenece a ninguna sección (home).
export function ubicacion(pathname, search) {
  const seccion = SECCIONES.find(s => s.rutas.some(r => pathname === r || pathname.startsWith(`${r}/`)));
  if (!seccion) return null;
  const v = new URLSearchParams(search).get('v');
  const candidatas = seccion.paginas.filter(p => p.path === pathname);
  const pagina = candidatas.find(p => p.v && p.v === v) || candidatas[0] || null;
  return { seccion, pagina };
}
