// ============================================================
// detalhe-imovel.js
// Busca o imóvel (por slug ou id) usando o service já existente
// do projeto e renderiza o conteúdo dentro de #detalhe-imovel.
//
// Não cria conexão própria com o Supabase: a busca é sempre
// feita através de ../supabase/imoveisService.js.
// ============================================================

import {
  buscarImovelPorSlug,
  buscarImovelPorId,
} from "../supabase/imoveisService.js";

const WHATSAPP_NUMERO = "5531982481194";
const PLACEHOLDER_IMAGEM = "./imagens/placeholder-imovel.jpg";

// ============================================================
// Utilidades
// ============================================================

function pegarParametrosDaURL() {
  const params = new URLSearchParams(window.location.search);
  return {
    slug: params.get('slug'),
    id: params.get('id'),
  };
}

function formatarPreco(valor) {
  if (valor === null || valor === undefined || valor === '') return 'Consulte';
  const numero = Number(valor);
  if (Number.isNaN(numero) || numero <= 0) return 'Consulte';
  return numero.toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    maximumFractionDigits: 0,
  });
}

function escapeHtml(str) {
  if (str === null || str === undefined) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function montarLinkWhatsApp(imovel) {
  const mensagem = `Olá, tenho interesse no imóvel ${imovel.codigo || ''} - ${imovel.titulo}`;
  return `https://wa.me/${WHATSAPP_NUMERO}?text=${encodeURIComponent(mensagem)}`;
}

// ============================================================
// Templates visuais
// ============================================================

function renderizarGaleria(imagens) {
  const lista = Array.isArray(imagens) && imagens.length > 0
    ? [...imagens].sort((a, b) => (a.ordem || 0) - (b.ordem || 0))
    : [{ url: PLACEHOLDER_IMAGEM, alt: "Imóvel sem imagem disponível" }];

  const single = lista.length === 1;
  const visiveis = lista.slice(0, 5);
  const extras = lista.length - visiveis.length;

  const itens = visiveis.map((img, index) => {
    const url = img.url || PLACEHOLDER_IMAGEM;
    const alt = escapeHtml(img.alt || 'Foto do imóvel');
    const isMain = index === 0;
    const isLast = !isMain && index === visiveis.length - 1 && extras > 0;

    return `
      <div class="imovel-galeria__item${isMain ? ' imovel-galeria__item--main' : ''}">
        <img src="${url}" alt="${alt}" loading="${isMain ? 'eager' : 'lazy'}"
          onerror="this.onerror=null;this.src='${PLACEHOLDER_IMAGEM}';">
        ${isLast ? `<div class="imovel-galeria__more">+${extras} fotos</div>` : ''}
      </div>
    `;
  }).join('');

  return `
    <div class="property-gallery imovel-galeria${single ? ' is-single' : ''}">
      ${itens}
    </div>
  `;
}

function renderizarCaracteristicas(relacoes) {
  const nomes = (Array.isArray(relacoes) ? relacoes : [])
    .map((rel) => rel?.caracteristicas?.nome || rel?.caracteristica?.nome)
    .filter(Boolean);

  if (nomes.length === 0) return '';

  const chips = nomes.map((nome) => `
    <span class="property-feature-chip">
      <span class="dot"></span>${escapeHtml(nome)}
    </span>
  `).join('');

  return `
    <div class="imovel-caracteristicas property-features">
      <h2>Características</h2>
      <div class="property-features__grid">
        ${chips}
      </div>
    </div>
  `;
}

function renderizarFatos(imovel) {
  const fatos = [
    { valor: imovel.quartos, label: 'Quartos' },
    { valor: imovel.suites, label: 'Suítes' },
    { valor: imovel.banheiros, label: 'Banheiros' },
    { valor: imovel.vagas, label: 'Vagas' },
    { valor: imovel.area_privativa || imovel.area_total, label: (imovel.area_privativa ? 'Área privativa' : 'Área total') + ' (m²)' },
    { valor: imovel.condominio ? formatarPreco(imovel.condominio) : null, label: 'Condomínio' },
    { valor: imovel.iptu ? formatarPreco(imovel.iptu) : null, label: 'IPTU' },
  ].filter((f) => f.valor !== null && f.valor !== undefined && f.valor !== '');

  if (fatos.length === 0) return '';

  const cards = fatos.map((f) => `
    <div class="property-fact">
      <div class="value">${escapeHtml(f.valor)}</div>
      <div class="label">${escapeHtml(f.label)}</div>
    </div>
  `).join('');

  return `<div class="imovel-detalhe__dados property-facts">${cards}</div>`;
}

function renderizarImovel(imovel) {
  const container = document.getElementById('detalhe-imovel');
  if (!container || !imovel) return;

  document.title = `${imovel.titulo || 'Imóvel'} | Tâmara Neres Imóveis`;

  const bairro = imovel.bairros?.nome || '';
  const tituloSeguro = escapeHtml(imovel.titulo || 'Imóvel');
  const descricao = imovel.descricao && imovel.descricao.trim().length > 0
    ? escapeHtml(imovel.descricao)
    : 'Descrição não disponível para este imóvel no momento. Entre em contato para saber mais detalhes.';

  const metaPartes = [];
  if (imovel.codigo) metaPartes.push(`<span>Cód. ${escapeHtml(imovel.codigo)}</span>`);
  if (imovel.tipo) metaPartes.push(`<span>${escapeHtml(imovel.tipo)}</span>`);
  if (imovel.finalidade) metaPartes.push(`<span>${escapeHtml(imovel.finalidade)}</span>`);

  const linkWhatsApp = montarLinkWhatsApp(imovel);

  container.innerHTML = `
    <div class="property-detail-page">

      <div class="property-crumb">
        <a href="imoveis-catalogo.html">Imóveis</a>
        <span class="sep">/</span>
        <span class="current">${tituloSeguro}</span>
      </div>

      ${renderizarGaleria(imovel.imagens)}

      <div class="property-body">
        <div class="property-main">

          <div class="imovel-detalhe">
            <div class="imovel-detalhe__header property-summary">
              ${bairro ? `<span class="eyebrow">${escapeHtml(bairro)}</span>` : ''}
              <h1>${tituloSeguro}</h1>

              ${metaPartes.length ? `<div class="property-summary__meta">${metaPartes.join('')}</div>` : ''}

              <div class="imovel-detalhe__preco">
                <small>Valor</small>
                ${formatarPreco(imovel.preco)}
              </div>
            </div>

            ${renderizarFatos(imovel)}

            <div class="imovel-descricao property-description">
              <h2>Descrição</h2>
              <div class="property-description__body">${descricao}</div>
            </div>

            ${renderizarCaracteristicas(imovel.imovel_caracteristicas)}
          </div>

        </div>

        <aside class="property-sidebar">
          <span class="eyebrow dark">Fale com a corretora</span>
          <h3>Interessado neste imóvel?</h3>
          <p>Receba mais informações, agende uma visita ou tire suas dúvidas diretamente pelo WhatsApp.</p>
          <a class="btn primary" href="${linkWhatsApp}" target="_blank" rel="noopener noreferrer">
            Entrar em contato
          </a>
          <div class="property-sidebar__divider"></div>
          ${imovel.codigo ? `<div class="property-sidebar__row"><span>Código</span><strong>${escapeHtml(imovel.codigo)}</strong></div>` : ''}
          ${bairro ? `<div class="property-sidebar__row"><span>Bairro</span><strong>${escapeHtml(bairro)}</strong></div>` : ''}
        </aside>
      </div>

    </div>
  `;
}

function renderizarEstado(mensagem, isErro = false) {
  const container = document.getElementById('detalhe-imovel');
  if (!container) return;
  container.innerHTML = `
    <div class="property-state${isErro ? ' is-error' : ''}">
      <p>${escapeHtml(mensagem)}</p>
    </div>
  `;
}

// ============================================================
// Inicialização
// ============================================================

async function initDetalheImovel() {
  const { slug, id } = pegarParametrosDaURL();

  if (!slug && !id) {
    renderizarEstado('Imóvel não encontrado.', true);
    return;
  }

  renderizarEstado('Carregando imóvel...');

  try {
    const imovel = slug
      ? await buscarImovelPorSlug(slug)
      : await buscarImovelPorId(id);

    if (!imovel) {
      renderizarEstado('Imóvel não encontrado.', true);
      return;
    }

    renderizarImovel(imovel);
  } catch (erro) {
    console.error('Erro ao carregar imóvel:', erro);
    renderizarEstado('Não foi possível carregar este imóvel. Tente novamente em instantes.', true);
  }
}

initDetalheImovel();
