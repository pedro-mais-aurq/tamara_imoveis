/* =========================================================================
   CATÁLOGO DE IMÓVEIS — VERSÃO COMPATÍVEL COM INDEX + CATÁLOGO COMPLETO
   -------------------------------------------------------------------------
   Este arquivo funciona em dois contextos:

   1. index.html
      - Precisa apenas de #prop-grid ou .prop-grid
      - Renderiza no máximo 3 imóveis

   2. Página completa de catálogo
      - Usa #prop-grid
      - Usa filtros:
        #empty-state
        #search-input
        #bairro-select
        #preco-select
        #clear-filters
        #results-meta

   IMPORTANTE:
   Como este arquivo usa import/export, o script no HTML deve ser carregado com:

   <script type="module" src="./js/catalogo.js"></script>
   ========================================================================= */

import { buscarImoveisCatalogo } from "../supabase/imoveisService.js";

console.log("catalogo.js carregado");

let PROPERTIES_DATA = [];

const HOME_LIMIT = 3;

// Se sua página individual for rota Next.js, troque para "/imovel".
// Se for HTML estático, mantenha "/imovel.html".
const DETALHE_IMOVEL_PATH = "./imovel.html";

/* =========================================================================
   ELEMENTOS DO DOM
   ========================================================================= */

const gridEl =
    document.getElementById("prop-grid") ||
    document.querySelector(".prop-grid");

const emptyStateEl = document.getElementById("empty-state");
const searchInput = document.getElementById("search-input");
const bairroSelect = document.getElementById("bairro-select");
const precoSelect = document.getElementById("preco-select");
const clearBtn = document.getElementById("clear-filters");
const resultsMeta = document.getElementById("results-meta");

const catalogoCompletoExiste =
    gridEl &&
    emptyStateEl &&
    searchInput &&
    bairroSelect &&
    precoSelect &&
    clearBtn &&
    resultsMeta;

const apenasGridExiste =
    gridEl && !catalogoCompletoExiste;

/* =========================================================================
   HELPERS
   ========================================================================= */

function formatPrice(value) {
    const numericValue = Number(value);

    if (!numericValue || numericValue <= 0) {
        return "Consulte";
    }

    return "R$ " + (numericValue / 1000000).toLocaleString("pt-BR", {
        minimumFractionDigits: numericValue % 1000000 === 0 ? 0 : 1,
        maximumFractionDigits: 1
    }) + " M";
}

function normalizarTexto(value) {
    return String(value || "")
        .trim()
        .toLowerCase();
}



function getDetalheUrl(property) {
    const detalheUrl = new URL(DETALHE_IMOVEL_PATH, window.location.href);

    if (property?.slug) {
        detalheUrl.searchParams.set("slug", property.slug);
    } else if (property?.id) {
        detalheUrl.searchParams.set("id", property.id);
    }

    return detalheUrl;
}

function limparCardsAntigos() {
    if (!gridEl) return;

    [...gridEl.querySelectorAll(".prop-card")].forEach((el) => {
        el.remove();
    });
}

function animarCards() {
    requestAnimationFrame(() => {
        gridEl.querySelectorAll(".prop-card").forEach((el, i) => {
            setTimeout(() => {
                el.classList.add("show");
            }, i * 40);
        });
    });
}

/* =========================================================================
   CARD DO IMÓVEL
   ========================================================================= */

function renderCard(property) {
    const card = document.createElement("article");
    card.className = "prop-card";
    card.dataset.id = property.id;

    const link = document.createElement("a");
    link.className = "prop-card-link";

    const detalheUrl = getDetalheUrl(property);

    link.href = detalheUrl.href;

    link.addEventListener("click", (event) => {
        event.preventDefault();

        console.log("Navegando para:", detalheUrl.href);

        window.location.assign(detalheUrl.href);
    });

    const media = document.createElement("div");
    media.className = "prop-media";

    const image = document.createElement("img");
    image.src = property.image || "./imagens/placeholder-imovel.jpg";
    image.alt = `${property.type || "Imóvel"} em ${property.bairro || "Belo Horizonte"} — ${property.name || "Tâmara Neres Imóveis"}`;
    image.loading = "lazy";

    const tag = document.createElement("span");
    tag.className = "prop-tag";
    tag.textContent = property.type || "Imóvel";

    const overlay = document.createElement("div");
    overlay.className = "prop-overlay";

    const view = document.createElement("span");
    view.className = "prop-view";
    view.textContent = "Ver detalhes";

    overlay.appendChild(view);

    media.appendChild(image);
    media.appendChild(tag);
    media.appendChild(overlay);

    const info = document.createElement("div");
    info.className = "prop-info";

    const textGroup = document.createElement("div");

    const loc = document.createElement("div");
    loc.className = "loc";
    loc.textContent = `${property.bairro || "Belo Horizonte"} · BH`;

    const title = document.createElement("div");
    title.className = "ttl";
    title.textContent = property.name || "Imóvel disponível";

    const features = document.createElement("div");
    features.className = "feat";

    const suites = Number(property.suites) || 0;
    const vagas = Number(property.vagas) || 0;
    const area = Number(property.area) || 0;

    features.textContent = `${suites} suítes · ${vagas} vagas · ${area} m²`;

    textGroup.appendChild(loc);
    textGroup.appendChild(title);
    textGroup.appendChild(features);

    const price = document.createElement("div");
    price.className = "price";

    const small = document.createElement("small");
    small.textContent = "a partir de";

    const priceText = document.createTextNode(formatPrice(property.price));

    price.appendChild(small);
    price.appendChild(priceText);

    info.appendChild(textGroup);
    info.appendChild(price);

    link.appendChild(media);
    link.appendChild(info);

    card.appendChild(link);

    return card;
}

/* =========================================================================
   RENDERIZAÇÃO GENÉRICA
   ========================================================================= */

function renderGrid(properties, options = {}) {
    const {
        limit = null,
        usarEmptyState = true,
        atualizarMeta = true
    } = options;

    if (!gridEl) return;

    limparCardsAntigos();

    const lista = Array.isArray(properties) ? properties : [];
    const listaLimitada = limit ? lista.slice(0, limit) : lista;

    if (listaLimitada.length === 0) {
        if (emptyStateEl && usarEmptyState) {
            emptyStateEl.classList.add("show");
        }

        if (resultsMeta && atualizarMeta) {
            resultsMeta.textContent = "Nenhum imóvel encontrado";
        }

        return;
    }

    if (emptyStateEl && usarEmptyState) {
        emptyStateEl.classList.remove("show");
    }

    const fragment = document.createDocumentFragment();

    listaLimitada.forEach((property) => {
        fragment.appendChild(renderCard(property));
    });

    if (emptyStateEl && gridEl.contains(emptyStateEl)) {
        gridEl.insertBefore(fragment, emptyStateEl);
    } else {
        gridEl.appendChild(fragment);
    }

    animarCards();

    if (resultsMeta && atualizarMeta) {
        resultsMeta.innerHTML = listaLimitada.length === 1
            ? `<strong>1</strong> imóvel encontrado`
            : `<strong>${listaLimitada.length}</strong> imóveis encontrados`;
    }
}

/* =========================================================================
   FILTROS — SOMENTE CATÁLOGO COMPLETO
   ========================================================================= */

function populateBairroOptions() {
    if (!bairroSelect) return;

    bairroSelect.innerHTML = `<option value="">Todos os bairros</option>`;

    const bairros = [
        ...new Set(
            PROPERTIES_DATA
                .map((property) => property.bairro)
                .filter(Boolean)
        )
    ].sort();

    bairros.forEach((bairro) => {
        const opt = document.createElement("option");
        opt.value = bairro;
        opt.textContent = bairro;
        bairroSelect.appendChild(opt);
    });
}

function applyFilters() {
    const term = normalizarTexto(searchInput?.value);
    const bairro = bairroSelect?.value || "";
    const precoRange = precoSelect?.value || "";

    let min = 0;
    let max = Infinity;

    if (precoRange) {
        const [minStr, maxStr] = precoRange.split("-");

        min = Number(minStr) || 0;
        max = Number(maxStr) || Infinity;
    }

    return PROPERTIES_DATA.filter((property) => {
        const name = normalizarTexto(property.name);
        const propertyBairro = property.bairro || "";
        const price = Number(property.price) || 0;

        const matchesTerm = !term || name.includes(term);
        const matchesBairro = !bairro || propertyBairro === bairro;
        const matchesPreco = price >= min && price <= max;

        return matchesTerm && matchesBairro && matchesPreco;
    });
}

function renderGridFiltrado() {
    const filtered = applyFilters();

    renderGrid(filtered, {
        limit: null,
        usarEmptyState: true,
        atualizarMeta: true
    });
}

function clearFilters() {
    if (searchInput) searchInput.value = "";
    if (bairroSelect) bairroSelect.value = "";
    if (precoSelect) precoSelect.value = "";

    renderGridFiltrado();
}

function inicializarEventosDeFiltro() {
    if (!catalogoCompletoExiste) return;

    searchInput.addEventListener("input", renderGridFiltrado);
    bairroSelect.addEventListener("change", renderGridFiltrado);
    precoSelect.addEventListener("change", renderGridFiltrado);
    clearBtn.addEventListener("click", clearFilters);
}

/* =========================================================================
   INIT — INDEX
   ========================================================================= */

async function initCatalogoIndex() {
    if (!gridEl) return;

    try {
        PROPERTIES_DATA = await buscarImoveisCatalogo();

        renderGrid(PROPERTIES_DATA, {
            limit: HOME_LIMIT,
            usarEmptyState: false,
            atualizarMeta: false
        });

        console.log(`Index carregado com limite de ${HOME_LIMIT} imóveis.`);
    } catch (error) {
        console.error("Erro ao carregar imóveis no index:", error);

        limparCardsAntigos();

        const erro = document.createElement("p");
        erro.className = "catalogo-erro";
        erro.textContent = "Não foi possível carregar os imóveis no momento.";

        gridEl.appendChild(erro);
    }
}

/* =========================================================================
   INIT — CATÁLOGO COMPLETO
   ========================================================================= */

async function initCatalogoCompleto() {
    if (!catalogoCompletoExiste) return;

    resultsMeta.textContent = "Carregando imóveis...";

    try {
        PROPERTIES_DATA = await buscarImoveisCatalogo();

        populateBairroOptions();
        inicializarEventosDeFiltro();
        renderGridFiltrado();

        console.log("Catálogo completo carregado.");
    } catch (error) {
        console.error("Erro ao inicializar catálogo:", error);

        limparCardsAntigos();

        if (emptyStateEl) {
            emptyStateEl.classList.add("show");
        }

        if (resultsMeta) {
            resultsMeta.textContent = "Não foi possível carregar os imóveis.";
        }
    }
}

/* =========================================================================
   BOOT
   ========================================================================= */

async function init() {
    if (!gridEl) {
        console.warn("Nenhum grid de imóveis encontrado na página.");
        return;
    }

    if (catalogoCompletoExiste) {
        await initCatalogoCompleto();
        return;
    }

    if (apenasGridExiste) {
        await initCatalogoIndex();
        return;
    }
}

init();
