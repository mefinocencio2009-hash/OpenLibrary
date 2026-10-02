/* =========================================================
   shared.js — Componentes compartilhados em todas as páginas
   ========================================================= */

(() => {
  'use strict';

  const STORAGE_TEMA = 'biblioteca:tema';
  const STORAGE_FAVORITOS = 'biblioteca:favoritos';

  /* -------------------------------------------------------
     1. NAVEGAÇÃO
     ------------------------------------------------------- */
  const NAV_LINKS = [
    { href: 'index.html',     label: 'Início',     icone: '🏠' },
    { href: 'busca.html',     label: 'Busca',      icone: '🔍' },
    { href: 'favoritos.html', label: 'Favoritos',  icone: '⭐' },
    { href: 'sobre.html',     label: 'Sobre',      icone: '📘' },
  ];

  function paginaAtual() {
    const path = window.location.pathname.split('/').pop();
    return path === '' ? 'index.html' : path;
  }

  function injetarHeader() {
    const host = document.querySelector('[data-header]');
    if (!host) return;

    const atual = paginaAtual();
    const linksHTML = NAV_LINKS
      .map((l) => `
        <a href="${l.href}" class="nav__link ${atual === l.href ? 'is-active' : ''}">
          <span class="nav__icon" aria-hidden="true">${l.icone}</span>
          <span>${l.label}</span>
        </a>`)
      .join('');

    host.outerHTML = `
      <header class="site-header">
        <div class="site-header__inner">
          <a href="index.html" class="brand" aria-label="Página inicial">
            <span class="brand__icon">📚</span>
            <span>Biblioteca<span class="brand__accent">Digital</span></span>
          </a>

          <nav class="nav" id="navPrincipal" aria-label="Navegação principal">
            ${linksHTML}
          </nav>

          <div class="site-header__tools">
            <button class="theme-toggle" id="btnTema" type="button"
                    title="Alternar tema" aria-label="Alternar tema">
              <span class="theme-toggle__icon">🌙</span>
            </button>

            <button class="menu-toggle" id="btnMenu" type="button"
                    aria-label="Abrir menu" aria-expanded="false" aria-controls="navPrincipal">
              <span></span><span></span><span></span>
            </button>
          </div>
        </div>
      </header>`;

    const btnMenu = document.getElementById('btnMenu');
    const nav = document.getElementById('navPrincipal');
    btnMenu.addEventListener('click', () => {
      const aberto = nav.classList.toggle('is-open');
      btnMenu.setAttribute('aria-expanded', String(aberto));
    });
  }

  function injetarFooter() {
    const host = document.querySelector('[data-footer]');
    if (!host) return;

    const totalFav = lerFavoritos().length;

    host.outerHTML = `
      <footer class="site-footer">
        <div class="site-footer__inner">
          <div class="site-footer__col">
            <span class="brand__icon">📚</span>
            <div>
              <strong>Biblioteca Digital</strong>
              <p>Projeto SA2 · Consumo de API — Programação Front-End</p>
            </div>
          </div>

          <div class="site-footer__col">
            <strong>Fontes</strong>
            <a href="https://openlibrary.org/" target="_blank" rel="noopener noreferrer">Open Library</a>
            <a href="https://covers.openlibrary.org/" target="_blank" rel="noopener noreferrer">Covers API</a>
            <a href="https://archive.org/" target="_blank" rel="noopener noreferrer">Internet Archive</a>
          </div>

          <div class="site-footer__col">
            <strong>Navegação</strong>
            ${NAV_LINKS.map((l) => `<a href="${l.href}">${l.label}</a>`).join('')}
          </div>
        </div>

        <div class="site-footer__bottom">
          <span>Feito com <span class="heart">♥</span> em JavaScript puro</span>
          <span id="favCount">⭐ ${totalFav} ${totalFav === 1 ? 'favorito' : 'favoritos'}</span>
        </div>
      </footer>`;
  }

  /* -------------------------------------------------------
     2. TEMA
     ------------------------------------------------------- */
  function aplicarTema(tema) {
    document.documentElement.setAttribute('data-tema', tema);
    const btn = document.getElementById('btnTema');
    if (btn) btn.querySelector('.theme-toggle__icon').textContent = tema === 'claro' ? '☀️' : '🌙';
    try { localStorage.setItem(STORAGE_TEMA, tema); } catch {}
  }

  function inicializarTema() {
    let salvo = 'escuro';
    try { salvo = localStorage.getItem(STORAGE_TEMA) || 'escuro'; } catch {}
    aplicarTema(salvo);

    document.addEventListener('click', (e) => {
      if (!e.target.closest('#btnTema')) return;
      const atual = document.documentElement.getAttribute('data-tema');
      aplicarTema(atual === 'claro' ? 'escuro' : 'claro');
    });
  }

  /* -------------------------------------------------------
     3. TOAST
     ------------------------------------------------------- */
  let toastTimer;
  function toast(mensagem, tipo = 'ok') {
    let el = document.getElementById('toast');
    if (!el) {
      el = document.createElement('div');
      el.id = 'toast';
      el.className = 'toast';
      el.setAttribute('role', 'status');
      el.setAttribute('aria-live', 'polite');
      document.body.appendChild(el);
    }
    el.textContent = mensagem;
    el.className = 'toast is-visible' + (tipo === 'erro' ? ' is-error' : '');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => el.classList.remove('is-visible'), 3000);
  }

  /* -------------------------------------------------------
     4. FAVORITOS (localStorage)
     ------------------------------------------------------- */
  function lerFavoritos() {
    try {
      const raw = localStorage.getItem(STORAGE_FAVORITOS);
      return raw ? JSON.parse(raw) : [];
    } catch {
      localStorage.removeItem(STORAGE_FAVORITOS);
      return [];
    }
  }

  function salvarFavoritos(lista) {
    try { localStorage.setItem(STORAGE_FAVORITOS, JSON.stringify(lista)); } catch {}
    atualizarContadorFav();
  }

  function ehFavorito(key) {
    return lerFavoritos().some((f) => f.key === key);
  }

  function toggleFavorito(livro) {
    const lista = lerFavoritos();
    const index = lista.findIndex((f) => f.key === livro.key);

    if (index >= 0) {
      lista.splice(index, 1);
      salvarFavoritos(lista);
      toast('💔 Removido dos favoritos');
      return false;
    } else {
      lista.unshift({
        key: livro.key,
        title: livro.title,
        author_name: livro.author_name || [],
        first_publish_year: livro.first_publish_year,
        cover_i: livro.cover_i,
        edition_count: livro.edition_count,
      });
      salvarFavoritos(lista);
      toast('⭐ Adicionado aos favoritos!');
      return true;
    }
  }

  function atualizarContadorFav() {
    const el = document.getElementById('favCount');
    if (!el) return;
    const total = lerFavoritos().length;
    el.textContent = `⭐ ${total} ${total === 1 ? 'favorito' : 'favoritos'}`;
  }

  /* -------------------------------------------------------
     5. UTILITÁRIOS
     ------------------------------------------------------- */
  function escaparHTML(str) {
    return String(str)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
  }

  function capaURL(coverId, size = 'M') {
    if (!coverId) return null;
    return `https://covers.openlibrary.org/b/id/${coverId}-${size}.jpg`;
  }

  function urlDetalhes(key) {
    return `detalhes.html?key=${encodeURIComponent(key)}`;
  }

  /* -------------------------------------------------------
     6. INIT + EXPORT
     ------------------------------------------------------- */
  function init() {
    injetarHeader();
    injetarFooter();
    inicializarTema();
  }

  window.App = {
    toast, escaparHTML, capaURL, urlDetalhes,
    lerFavoritos, salvarFavoritos, ehFavorito, toggleFavorito,
    atualizarContadorFav,
  };

  document.addEventListener('DOMContentLoaded', init);
})();