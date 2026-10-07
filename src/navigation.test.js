// src/navigation.test.js
import { describe, it, expect } from 'vitest';
import { ubicacion, urlPagina, inicioSeccion, SECCIONES } from './navigation';

const donde = (path, search = '') => {
  const u = ubicacion(path, search);
  return u && [u.seccion.key, u.pagina?.label ?? null];
};

describe('ubicacion', () => {
  it('devuelve null en la home y en rutas desconocidas', () => {
    expect(ubicacion('/', '')).toBeNull();
    expect(ubicacion('/login', '')).toBeNull();
  });

  it('distingue páginas por ?v= y usa la primera si no hay ?v=', () => {
    expect(donde('/finanzas', '?v=mensual')).toEqual(['finanzas', 'Mensual']);
    expect(donde('/finanzas', '')).toEqual(['finanzas', 'Anual']);
    expect(donde('/seguros', '?v=otra')).toEqual(['seguros', 'Resumen']);
  });

  it('reconoce subrutas y páginas sin ?v=', () => {
    expect(donde('/casa', '')).toEqual(['casa', null]);
    expect(donde('/casa/pilas', '?v=historial')).toEqual(['casa', 'Pilas']);
    expect(donde('/avance', '')).toEqual(['pse', 'Avance']);
  });
});

describe('urlPagina / inicioSeccion', () => {
  it('construye las URLs', () => {
    expect(urlPagina({ path: '/seguros', v: 'listado' })).toBe('/seguros?v=listado');
    expect(urlPagina({ path: '/reports' })).toBe('/reports');
    expect(SECCIONES.map(inicioSeccion)).toEqual(['/finanzas?v=anual', '/seguros?v=resumen', '/casa', '/reports']);
  });
});
