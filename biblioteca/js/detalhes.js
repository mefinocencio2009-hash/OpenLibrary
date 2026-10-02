/* =========================================================
   detalhes.js — Página de detalhes do livro (Works API)
   ========================================================= */

(() => {
  'use strict';

  const { toast, escaparHTML, capaURL, ehFavorito, toggleFavorito } = window.App;

  const API_WORK = 'https://openlibrary.org';
  const area = document.getElementById('areaDetalhes');

  /* ---------- Utilitários ---------- */
  function extrairDescricao(desc) {
    if (!desc) return null;
    if (typeof desc === 'string') return desc;
    if (typeof desc === 'object' && desc.value) return desc.value;
    return null;
  }

  /* ---------- Render ---------- */
  function renderLoading() {
    area.innerHTML = `
      <div class="state-empty">
        <span class="state-empty__icon">📖</span>
        <h3 class="state-empty__title">Carregando detalhes…</h3>
      </div>`;
  }

  function renderErro(titulo, texto) {
    area.innerHTML = `
      <div class="state-error" role="alert" style="max-width:560px;margin:40px auto;">
        <span class="state-error__icon">⚠️</span>
        <div>
          <strong class="state-error__title">${escaparHTML(titulo)}</strong>
          <p class="state-error__text">${escaparHTML(texto)}</p>
        </div>
      </div>
      <div class="center" style="margin-top:20px;">
        <a href="busca.html" class="btn btn--ghost">
          <span class="btn__icon">←</span> Voltar para busca
        </a>
      </div>`;
  }

  function renderDetalhes(work, key, autorNome) {
    const titulo = work.title || 'Título desconhecido';
    const descricao = extrairDescricao(work.description);
    const capa = capaURL(work.covers?.[0], 'L') || null;
    const autores = work.authors?.map((a) => a.author?.key || a.key).filter(Boolean) || [];
    const subjects = (work.subjects || []).slice(0, 12);
    const ano = work.first_publish_date
      ? work.first_publish_date.match(/\d{4}/)?.[0]
      : null;
    const fav = ehFavorito(key);

    area.innerHTML = `
      <div class="book-hero">
        <div class="book-hero__cover">
          ${capa
            ? `<img src="${capa}" alt="Capa de ${escaparHTML(titulo)}" onerror="this.parentElement.innerHTML='<span class=\\'book-hero__cover-fallback\\'>📖</span>'" />`
            : `<span class="book-hero__cover-fallback">📖</span>`}
        </div>

        <div class="book-hero__body">
          <div class="book-hero__badges">
            <span class="badge badge--amber">Livro</span>
            ${work.covers?.length > 1 ? `<span class="badge badge--cyan">${work.covers.length} capas</span>` : ''}
          </div>

          <h1 class="book-hero__title">${escaparHTML(titulo)}</h1>

          ${autorNome ? `
            <p class="book-hero__author">
              ✍️ ${escaparHTML(autorNome)}
            </p>` : ''}

          ${descricao ? `
            <p class="book-hero__desc" id="descricao">${escaparHTML(descricao)}</p>
            <button type="button" class="btn-toggle-desc" id="btnToggleDesc">Ler mais ↓</button>
          ` : '<p class="muted">Sem descrição disponível.</p>'}

          <div class="book-hero__actions">
            <button class="btn-fav-grande ${fav ? 'is-active' : ''}" id="btnFavGrande"
                    data-key="${escaparHTML(key)}"
                    data-title="${escaparHTML(titulo)}">
              ${fav ? '⭐ Nos favoritos' : '☆ Adicionar aos favoritos'}
            </button>
            <a href="busca.html" class="btn btn--ghost">
              <span class="btn__icon">←</span> Voltar
            </a>
          </div>

          <div class="book-info">
            ${ano ? `
              <div class="info-cell">
                <div class="info-cell__label">Primeira publicação</div>
                <div class="info-cell__value">${ano}</div>
              </div>` : ''}
            ${work.subjects?.length ? `
              <div class="info-cell">
                <div class="info-cell__label">Assuntos</div>
                <div class="info-cell__value">${work.subjects.length}</div>
              </div>` : ''}
            ${work.covers?.length ? `
              <div class="info-cell">
                <div class="info-cell__label">Edições</div>
                <div class="info-cell__value">${work.covers.length}+</div>
              </div>` : ''}
            <div class="info-cell">
              <div class="info-cell__label">ID Open Library</div>
              <div class="info-cell__value" style="font-size:12px;font-family:'JetBrains Mono',monospace;">${escaparHTML(key)}</div>
            </div>
          </div>

          ${subjects.length ? `
            <div>
              <p class="info-cell__label" style="margin-bottom:8px;">Assuntos relacionados</p>
              <div class="subjects">
                ${subjects.map((s) => `
                  <a href="busca.html?q=${encodeURIComponent(s)}" class="subject-tag">${escaparHTML(s)}</a>
                `).join('')}
              </div>
            </div>` : ''}
        </div>
      </div>`;

    // Toggle descrição
    const btnToggle = document.getElementById('btnToggleDesc');
    const desc = document.getElementById('descricao');
    if (btnToggle && desc) {
      btnToggle.addEventListener('click', () => {
        const expandido = desc.classList.toggle('is-expandido');
        btnToggle.textContent = expandido ? 'Mostrar menos ↑' : 'Ler mais ↓';
      });
    }

    // Favorito
    const btnFav = document.getElementById('btnFavGrande');
    if (btnFav) {
      btnFav.addEventListener('click', () => {
        const ativo = toggleFavorito({ key, title: titulo });
        btnFav.classList.toggle('is-active', ativo);
        btnFav.textContent = ativo ? '⭐ Nos favoritos' : '☆ Adicionar aos favoritos';
      });
    }

    // Link para Open Library
    const linkOL = document.createElement('a');
    linkOL.href = `https://openlibrary.org${key}`;
    linkOL.target = '_blank';
    linkOL.rel = 'noopener noreferrer';
    linkOL.className = 'btn btn--ghost';
    linkOL.innerHTML = '<span class="btn__icon">🔗</span> Ver na Open Library';
    document.querySelector('.book-hero__actions')?.appendChild(linkOL);
  }

  /* ---------- API ---------- */
  async function carregarDetalhes(key) {
    renderLoading();

    try {
      const resp = await fetch(`${API_WORK}${key}.json`);
      if (!resp.ok) throw new Error('HTTP ' + resp.status);

      const work = await resp.json();

      // Busca nome do autor (primeiro autor)
      let autorNome = null;
      const primeiroAutor = work.authors?.[0]?.author?.key;
      if (primeiroAutor) {
        try {
          const respAutor = await fetch(`${API_WORK}${primeiroAutor}.json`);
          if (respAutor.ok) {
            const autor = await respAutor.json();
            autorNome = autor.name || null;
          }
        } catch { /* silencioso */ }
      }

      renderDetalhes(work, key, autorNome);
    } catch (e) {
      renderErro('Livro não encontrado',
        'Não foi possível carregar os detalhes deste livro. O ID pode ser inválido.');
    }
  }

  /* ---------- Init ---------- */
  document.addEventListener('DOMContentLoaded', () => {
    const params = new URLSearchParams(window.location.search);
    const key = params.get('key');

    if (!key) {
      renderErro('Livro não especificado', 'Nenhum ID de livro foi fornecido na URL.');
      return;
    }

    carregarDetalhes(key);
  });
})();