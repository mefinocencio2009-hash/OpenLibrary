# 📚 Biblioteca Digital — SA2

Aplicação web que consome a **API pública da Open Library** para buscar livros
por título, autor, assunto ou ISBN, exibindo capas, informações detalhadas
e permitindo salvar favoritos. Desenvolvida em **JavaScript puro** como
atividade intermediária de **Consumo de API**.

---

## 👥 Integrantes da dupla

- **Nome Completo 1** — _matrícula_
- **Nome Completo 2** — _matrícula_

---

## 🔌 API utilizada

| Item | Informação |
|---|---|
| **Nome** | Open Library — Search API |
| **O que fornece** | Catálogo público de livros (título, autor, ano, capa, assuntos, edições, ISBN) |
| **Documentação oficial** | https://openlibrary.org/dev/docs/api/search |
| **Endpoint** | `https://openlibrary.org/search.json` |
| **Dado utilizado na consulta** | Termo de busca (título, autor, assunto ou ISBN) |
| **Autenticação** | Não exige chave de API |
| **CORS** | Liberado para navegador |
| **Formato de retorno** | JSON |

### API complementar — Covers

| Item | Informação |
|---|---|
| **Nome** | Open Library Covers API |
| **O que fornece** | Capas de livros em 3 tamanhos (S, M, L) |
| **Documentação** | https://openlibrary.org/dev/docs/api/covers |
| **Endpoint** | `https://covers.openlibrary.org/b/id/{coverId}-{size}.jpg` |

---

## 🎯 Funcionalidade

O usuário digita um termo de busca. A aplicação faz uma requisição assíncrona
para a Open Library, recebe os dados em JSON e renderiza dinamicamente os
resultados em cards com:

- Capa do livro
- Título
- Autor(es)
- Ano da primeira publicação
- Número de edições

Ao clicar em um livro, o usuário é levado para a **página de detalhes**, que
consome a **Works API** para exibir descrição, assuntos relacionados e mais
informações.

O usuário também pode **salvar favoritos** (persistidos em `localStorage`),
que ficam disponíveis mesmo após fechar o navegador.

---

## 📁 Estrutura do projeto
