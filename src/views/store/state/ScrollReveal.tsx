'use client';

import { useEffect } from 'react';

/**
 * Hace que las tarjetas de perfume (.aurora-card) aparezcan deslizándose al entrar en pantalla.
 * Solo agrega clases: el efecto lo define aurora.css (estética "Degradado") y se apaga con
 * "reducir movimiento". También vigila tarjetas nuevas (al filtrar o buscar en el catálogo).
 */
export function ScrollReveal() {
  useEffect(() => {
    if (typeof IntersectionObserver === 'undefined') return;
    const html = document.documentElement;
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (!e.isIntersecting) continue;
          e.target.classList.add('is-in');
          io.unobserve(e.target);
        }
      },
      { rootMargin: '0px 0px -8% 0px', threshold: 0.12 },
    );
    const watch = () => {
      document.querySelectorAll<HTMLElement>('.aurora-card:not(.is-in):not([data-reveal-watch])').forEach((el, i) => {
        el.dataset.revealWatch = '1';
        el.style.setProperty('--reveal-delay', `${(i % 3) * 90}ms`);
        io.observe(el);
      });
    };
    watch();
    html.classList.add('reveal-on');
    const mo = new MutationObserver(watch);
    mo.observe(document.body, { childList: true, subtree: true });
    return () => {
      io.disconnect();
      mo.disconnect();
      html.classList.remove('reveal-on');
    };
  }, []);
  return null;
}
