/* =========================================================
   favoritos.js — Página de favoritos
   ========================================================= */

(() => {
  'use strict';

  const { lerFavoritos, salvarFavoritos, escaparHTML, capaURL, urlDetalhes, toast } = window.App;

  const refs = {
    area: document.getElementById('areaFavoritos'),
    contador: document.getElementById('contador'),
    btnLimpar: document.getElementById('btnLimpar'),
    acoes: document.getElementById('acoes'),
  };

  function render() {
    const lista = lerFavoritos();

    refs.contador.textContent =
      `${lista.length} ${lista.length === 1 ? 'livro salvo' : 'livros salvos'}`;

    if (lista.length === 0) {
      refs.acoes.style.display = 'none';
      refs.area.innerHTML = `
        <div class="state-empty">
          <span class="state-empty__icon">⭐</span>
          <h3 class="state-empty__title">Nenhum favorito ainda</h3>
          <p class="state-empty__text">
            Explore o acervo e toque na estrela para guardar seus livros preferidos aqui.
          </p>
          <a href="busca.html" class="btn btn--primary">
            <span class="btn__icon">🔍</span> Explorar acervo
          </a>
        </div>`;
      return;
    }

    refs.acoes.style.display = '';

    const cards = lista.map((livro, i) => {
      const capa = capaURL(livro.cover_i, 'M');
      const autor = livro.author_name?.length
        ? livro.author_name.slice(0, 2).join(', ')
        : 'Autor desconhecido';

      return `
        <a class="book-card" href="${urlDetalhes(livro.key)}" style="animation-delay:${i * 0.04}s">
          <div class="book-card__cover">
            ${capa
              ? `<img src="${capa}" alt="Capa de ${escaparHTML(livro.title)}" loading="lazy" onerror="this.parentElement.innerHTML='<span class=\\'book-card__cover-fallback\\'>📖</span>'" />`
              : `<span class="book-card__cover-fallback">📖</span>`}
          </div>
          <div class="book-card__body">
            <div class="book-card__title">${escaparHTML(livro.title)}</div>
            <div class="book-card__author">${escaparHTML(autor)}</div>
            <div class="book-card__meta">
              <span>${livro.first_publish_year || '—'}</span>
              <button class="book-card__remove" type="button"
                      data-key="${escaparHTML(livro.key)}"
                      title="Remover" aria-label="Remover dos favoritos">🗑️</button>
            </div>
          </div>
        </a>`;
    }).join('');

    refs.area.innerHTML = `<div class="books-grid">${cards}</div>`;
  }

  document.addEventListener('DOMContentLoaded', () => {
    render();

    // Remover individual (delegação)
    refs.area.addEventListener('click', (e) => {
      const btn = e.target.closest('.book-card__remove');
      if (!btn) return;
      e.preventDefault();
      e.stopPropagation();

      const key = btn.dataset.key;
      const lista = lerFavoritos().filter((f) => f.key !== key);
      salvarFavoritos(lista);
      toast('🗑️ Removido dos favoritos');
      render();
    });

    // Limpar tudo
    refs.btnLimpar.addEventListener('click', () => {
      if (!confirm('Tem certeza que deseja apagar todos os favoritos?')) return;
      salvarFavoritos([]);
      toast('🗑️ Todos os favoritos foram removidos');
      render();
    });
  });
})();