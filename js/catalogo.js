/* =========================================================================
     CATÁLOGO DE IMÓVEIS — CARCAÇA / SHELL
     -------------------------------------------------------------------------
     Este bloco simula a fonte de dados que, na versão final, virá do Supabase
     via Next.js (ex.: server component / route handler fazendo
     `supabase.from('imoveis').select('*')`).

     Para plugar o backend real:
     1. Substitua PROPERTIES_DATA por uma chamada assíncrona ao Supabase.
     2. Mantenha o mesmo formato de objeto (name, type, bairro, price, etc.)
        ou ajuste renderCard() conforme o schema da tabela.
     3. As funções applyFilters()/renderGrid() já trabalham sobre um array
        em memória — basta alimentá-las com o resultado da query.
     ========================================================================= */

import { buscarImoveisCatalogo } from "../supabase/imoveisService.js";


let PROPERTIES_DATA = [];

const gridEl = document.getElementById("prop-grid");
const emptyStateEl = document.getElementById("empty-state");
const searchInput = document.getElementById("search-input");
const bairroSelect = document.getElementById("bairro-select");
const precoSelect = document.getElementById("preco-select");
const clearBtn = document.getElementById("clear-filters");
const resultsMeta = document.getElementById("results-meta");

const catalogoExiste =
    gridEl &&
    emptyStateEl &&
    searchInput &&
    bairroSelect &&
    precoSelect &&
    clearBtn &&
    resultsMeta;

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

function populateBairroOptions() {
    bairroSelect.innerHTML = `<option value="">Todos os bairros</option>`;

    const bairros = [...new Set(PROPERTIES_DATA.map(p => p.bairro))].sort();

    bairros.forEach((bairro) => {
        const opt = document.createElement("option");
        opt.value = bairro;
        opt.textContent = bairro;
        bairroSelect.appendChild(opt);
    });
}

function renderCard(property) {
    console.log("Imóvel no card:", property.id, property.name, property.slug);

    const card = document.createElement("article");
    card.className = "prop-card";
    card.dataset.id = property.id;

  const link = document.createElement("a");
link.className = "prop-card-link";

const detalheUrl = new URL("/imovel", window.location.origin);

if (property.slug) {
    detalheUrl.searchParams.set("slug", property.slug);
} else {
    detalheUrl.searchParams.set("id", property.id);
}

link.href = detalheUrl.href;

link.addEventListener("click", (event) => {
    event.preventDefault();

    console.log("Navegando para:", detalheUrl.href);

    window.location.assign(detalheUrl.href);
});
console.log("Property usada no card:", property);
console.log("Href final do card:", link.href);

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

    const priceText = document.createTextNode(formatPrice(Number(property.price) || 0));

    price.appendChild(small);
    price.appendChild(priceText);

    info.appendChild(textGroup);
    info.appendChild(price);

    link.appendChild(media);
    link.appendChild(info);

    card.appendChild(link);

    return card;
}

function applyFilters() {
    const term = searchInput.value.trim().toLowerCase();
    const bairro = bairroSelect.value;
    const precoRange = precoSelect.value;

    let min = 0, max = Infinity;
    if (precoRange) {
        const [minStr, maxStr] = precoRange.split("-");
        min = Number(minStr);
        max = Number(maxStr);
    }

    return PROPERTIES_DATA.filter(p => {
        const matchesTerm = !term || p.name.toLowerCase().includes(term);
        const matchesBairro = !bairro || p.bairro === bairro;
        const matchesPreco = p.price >= min && p.price <= max;
        return matchesTerm && matchesBairro && matchesPreco;
    });
}

function renderGrid() {
    const filtered = applyFilters();

    // Remove cartões antigos, mantendo o nó de estado vazio
    [...gridEl.querySelectorAll(".prop-card")].forEach(el => el.remove());

    if (filtered.length === 0) {
        emptyStateEl.classList.add("show");
    } else {
        emptyStateEl.classList.remove("show");
        const fragment = document.createDocumentFragment();
        filtered.forEach(p => fragment.appendChild(renderCard(p)));
        gridEl.insertBefore(fragment, emptyStateEl);

        requestAnimationFrame(() => {
            gridEl.querySelectorAll(".prop-card").forEach((el, i) => {
                setTimeout(() => el.classList.add("show"), i * 40);
            });
        });
    }

    resultsMeta.innerHTML = filtered.length === 1
        ? `<strong>1</strong> imóvel encontrado`
        : `<strong>${filtered.length}</strong> imóveis encontrados`;
}

function clearFilters() {
    searchInput.value = "";
    bairroSelect.value = "";
    precoSelect.value = "";
    renderGrid();
}

async function initCatalogo() {
    if (!catalogoExiste) return;

    resultsMeta.textContent = "Carregando imóveis...";

    try {
        PROPERTIES_DATA = await buscarImoveisCatalogo();

        populateBairroOptions();

        searchInput.addEventListener("input", renderGrid);
        bairroSelect.addEventListener("change", renderGrid);
        precoSelect.addEventListener("change", renderGrid);
        clearBtn.addEventListener("click", clearFilters);

        renderGrid();
    } catch (error) {
        console.error("Erro ao inicializar catálogo:", error);

        [...gridEl.querySelectorAll(".prop-card")].forEach((el) => el.remove());

        emptyStateEl.classList.add("show");
        resultsMeta.textContent = "Não foi possível carregar os imóveis.";
    }
}

initCatalogo();
