/* =========================================================
   busca.js — Página de busca completa (v2 corrigida)
   ========================================================= */

(() => {
  'use strict';

  const { toast, escaparHTML, capaURL, urlDetalhes, ehFavorito, toggleFavorito } = window.App;

  const API = 'https://openlibrary.org/search.json';
  const LIMITE_POR_PAGINA = 24;

  const $ = (id) => document.getElementById(id);
  const refs = {
    form: $('formBusca'),
    termo: $('termo'),
    campo: $('campo'),
    ordenacao: $('ordenacao'),
    btn: $('btnBuscar'),
    btnIcon: document.querySelector('#btnBuscar .btn__icon'),
    btnText: document.querySelector('#btnBuscar .btn__text'),
    area: $('areaResultados'),
    info: $('infoResultados'),
    pag: $('paginacao'),
  };

  const estado = {
    query: '',
    pagina: 1,
    total: 0,
    controller: null,
  };

  /* ---------- Render ---------- */
  function renderLoading() {
    const cards = Array.from({ length: 8 }, () => `
      <div class="skeleton-book">
        <div class="skeleton-book__cover"></div>
        <div class="skeleton-book__body">
          <div class="skeleton-book__line skeleton-book__line--lg"></div>
          <div class="skeleton-book__line"></div>
          <div class="skeleton-book__line skeleton-book__line--sm"></div>
        </div>
      </div>`).join('');
    refs.area.innerHTML = `<div class="books-grid">${cards}</div>`;
    refs.info.classList.add('is-hidden');
    refs.pag.classList.add('is-hidden');
  }

  function renderVazio() {
    refs.area.innerHTML = `
      <div class="state-empty">
        <span class="state-empty__icon">🔍</span>
        <h3 class="state-empty__title">Comece sua busca</h3>
        <p class="state-empty__text">
          Digite um título, autor ou assunto acima para explorar o acervo.
        </p>
      </div>`;
  }

  function renderSemResultados() {
    refs.area.innerHTML = `
      <div class="state-empty">
        <span class="state-empty__icon">📭</span>
        <h3 class="state-empty__title">Nenhum livro encontrado</h3>
        <p class="state-empty__text">
          Não encontramos resultados para "<b>${escaparHTML(estado.query)}</b>".
          Tente outras palavras-chave.
        </p>
      </div>`;
  }

  function renderErro(titulo, texto) {
    refs.area.innerHTML = `
      <div class="state-error" role="alert">
        <span class="state-error__icon">⚠️</span>
        <div>
          <strong class="state-error__title">${escaparHTML(titulo)}</strong>
          <p class="state-error__text">${escaparHTML(texto)}</p>
        </div>
      </div>`;
  }

  function renderResultados(docs) {
    const cards = docs.map((doc, i) => {
      const capa = capaURL(doc.cover_i, 'M');
      const autor = doc.author_name ? doc.author_name.slice(0, 2).join(', ') : 'Autor desconhecido';
      const fav = ehFavorito(doc.key);

      return `
        <a class="book-card" href="${urlDetalhes(doc.key)}" style="animation-delay:${i * 0.03}s">
          <div class="book-card__cover">
            ${capa
              ? `<img src="${capa}" alt="Capa de ${escaparHTML(doc.title)}" loading="lazy" onerror="this.parentElement.innerHTML='<span class=\\'book-card__cover-fallback\\'>📖</span>'" />`
              : `<span class="book-card__cover-fallback">📖</span>`}
          </div>
          <div class="book-card__body">
            <div class="book-card__title">${escaparHTML(doc.title)}</div>
            <div class="book-card__author">${escaparHTML(autor)}</div>
            <div class="book-card__meta">
              <span class="book-card__year">${doc.first_publish_year || '—'}</span>
              <button class="book-card__fav ${fav ? 'is-active' : ''}"
                      type="button"
                      data-key="${escaparHTML(doc.key)}"
                      title="${fav ? 'Remover dos favoritos' : 'Adicionar aos favoritos'}"
                      aria-label="${fav ? 'Remover dos favoritos' : 'Adicionar aos favoritos'}">
                ${fav ? '⭐' : '☆'}
              </button>
            </div>
          </div>
        </a>`;
    }).join('');

    refs.area.innerHTML = `<div class="books-grid">${cards}</div>`;
  }

  function renderInfo() {
    const inicio = (estado.pagina - 1) * LIMITE_POR_PAGINA + 1;
    const fim = Math.min(estado.pagina * LIMITE_POR_PAGINA, estado.total);
    refs.info.innerHTML = `
      <span>Mostrando <b>${inicio}–${fim}</b> de <b>${estado.total.toLocaleString('pt-BR')}</b> resultados</span>
      <span>·</span>
      <span>Busca: "<b>${escaparHTML(estado.query)}</b>"</span>`;
    refs.info.classList.remove('is-hidden');
  }

  function renderPaginacao() {
    const totalPaginas = Math.min(Math.ceil(estado.total / LIMITE_POR_PAGINA), 50);
    if (totalPaginas <= 1) { refs.pag.classList.add('is-hidden'); return; }

    refs.pag.classList.remove('is-hidden');
    const atual = estado.pagina;
    const botoes = [];

    botoes.push(`<button class="page-btn" data-page="${atual - 1}" ${atual === 1 ? 'disabled' : ''}>←</button>`);

    const inicio = Math.max(1, atual - 2);
    const fim = Math.min(totalPaginas, atual + 2);

    if (inicio > 1) {
      botoes.push(`<button class="page-btn" data-page="1">1</button>`);
      if (inicio > 2) botoes.push(`<span class="muted" style="padding:0 6px;">…</span>`);
    }
    for (let i = inicio; i <= fim; i++) {
      botoes.push(`<button class="page-btn ${i === atual ? 'is-active' : ''}" data-page="${i}">${i}</button>`);
    }
    if (fim < totalPaginas) {
      if (fim < totalPaginas - 1) botoes.push(`<span class="muted" style="padding:0 6px;">…</span>`);
      botoes.push(`<button class="page-btn" data-page="${totalPaginas}">${totalPaginas}</button>`);
    }

    botoes.push(`<button class="page-btn" data-page="${atual + 1}" ${atual === totalPaginas ? 'disabled' : ''}>→</button>`);

    refs.pag.innerHTML = botoes.join('');
  }

  /* ---------- API ---------- */
  async function buscar(pagina = 1) {
    const termo = refs.termo.value.trim();
    if (!termo) {
      toast('Digite algo para buscar', 'erro');
      refs.termo.focus();
      return;
    }

    estado.query = termo;
    estado.pagina = pagina;

    if (estado.controller) estado.controller.abort();
    estado.controller = new AbortController();
    const { signal } = estado.controller;

    refs.btn.disabled = true;
    refs.btnIcon.textContent = '⏳';
    refs.btnText.textContent = 'Buscando…';
    renderLoading();

    /* -------- Monta os parâmetros da URL -------- */
    const params = new URLSearchParams();

    // Filtro por campo (title, author, subject, isbn) ou busca geral (q)
    const campo = refs.campo.value;
    if (campo) {
      params.set(campo, termo);  // ex.: title=harry+potter
    } else {
      params.set('q', termo);    // ex.: q=harry+potter
    }

    params.set('limit', String(LIMITE_POR_PAGINA));
    params.set('offset', String((pagina - 1) * LIMITE_POR_PAGINA));

    // Ordenação — só envia se for um valor VÁLIDO
    const sort = refs.ordenacao.value;
    if (['new', 'old', 'editions', 'random'].includes(sort)) {
      params.set('sort', sort);
    }

    const url = `${API}?${params.toString()}`;
    console.log('🔍 Requisição:', url);

    try {
      const resp = await fetch(url, { signal });
      console.log('📡 Status HTTP:', resp.status, resp.statusText);

      if (!resp.ok) throw new Error('HTTP ' + resp.status);

      const dados = await resp.json();
      console.log('📚 Resposta:', {
        numFound: dados.numFound,
        docsRecebidos: dados.docs ? dados.docs.length : 0,
        primeiro: dados.docs?.[0],
      });

      estado.total = dados.numFound || 0;

      if (!dados.docs || dados.docs.length === 0) {
        renderSemResultados();
        refs.info.classList.add('is-hidden');
        refs.pag.classList.add('is-hidden');
        return;
      }

      renderResultados(dados.docs);
      renderInfo();
      renderPaginacao();
      atualizarURL(termo, pagina);
    } catch (e) {
      console.error('❌ Erro na busca:', e);
      if (e.name === 'AbortError') return;
      renderErro(
        'Não foi possível realizar a busca',
        'Houve um problema de comunicação. Verifique sua conexão e tente novamente.'
      );
      refs.info.classList.add('is-hidden');
      refs.pag.classList.add('is-hidden');
    } finally {
      refs.btn.disabled = false;
      refs.btnIcon.textContent = '🔎';
      refs.btnText.textContent = 'Buscar';
    }
  }

  function atualizarURL(termo, pagina) {
    const params = new URLSearchParams({ q: termo });
    if (pagina > 1) params.set('page', pagina);
    history.replaceState(null, '', `${window.location.pathname}?${params}`);
  }

  /* ---------- Eventos ---------- */
  function init() {
    refs.form.addEventListener('submit', (e) => { e.preventDefault(); buscar(1); });

    refs.termo.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') { e.preventDefault(); buscar(1); }
    });

    document.querySelectorAll('.chip-btn').forEach((btn) => {
      btn.addEventListener('click', () => {
        refs.termo.value = btn.dataset.busca;
        buscar(1);
      });
    });

    // Paginação
    refs.pag.addEventListener('click', (e) => {
      const btn = e.target.closest('[data-page]');
      if (!btn || btn.disabled) return;
      const p = Number(btn.dataset.page);
      if (p >= 1) buscar(p);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });

    // Favoritos (delegação)
    refs.area.addEventListener('click', (e) => {
      const btn = e.target.closest('.book-card__fav');
      if (!btn) return;
      e.preventDefault();
      e.stopPropagation();

      const key = btn.dataset.key;
      const card = btn.closest('.book-card');
      const title = card.querySelector('.book-card__title').textContent;

      const ativo = toggleFavorito({ key, title });
      btn.classList.toggle('is-active', ativo);
      btn.textContent = ativo ? '⭐' : '☆';
    });

    // URL params (vindo da home ou histórico)
    const params = new URLSearchParams(window.location.search);
    const q = params.get('q');
    const page = Number(params.get('page')) || 1;
    if (q) {
      refs.termo.value = q;
      buscar(page);
    } else {
      renderVazio();
    }
  }

  document.addEventListener('DOMContentLoaded', init);
})();