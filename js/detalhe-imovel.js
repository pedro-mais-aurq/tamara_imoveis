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
// Estado da galeria / lightbox
// ============================================================

// Lista completa de imagens do imóvel atualmente exibido
// (não apenas as 5 miniaturas visíveis no grid).
let imagensGaleriaAtual = [];

const estadoLightbox = {
  indice: 0,
};

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
// Lightbox (visualizador de imagens excedentes)
// ============================================================

function injetarEstilosLightbox() {
  if (document.getElementById('tn-lightbox-estilos')) return;

  const style = document.createElement('style');
  style.id = 'tn-lightbox-estilos';
  style.textContent = `
    .imovel-galeria__item {
      cursor: pointer;
    }

    body.tn-lightbox-open {
      overflow: hidden;
    }

    .tn-lightbox {
      display: none;
      position: fixed;
      inset: 0;
      z-index: 9999;
      background: rgba(10, 10, 10, 0.92);
      align-items: center;
      justify-content: center;
    }

    .tn-lightbox.is-aberto {
      display: flex;
    }

    .tn-lightbox__conteudo {
      position: relative;
      max-width: 90vw;
      max-height: 86vh;
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 12px;
    }

    .tn-lightbox__imagem {
      max-width: 90vw;
      max-height: 78vh;
      object-fit: contain;
      border-radius: 4px;
      box-shadow: 0 10px 40px rgba(0, 0, 0, 0.5);
    }

    .tn-lightbox__contador {
      color: #f2f2f2;
      font-family: 'Montserrat', sans-serif;
      font-size: 14px;
      letter-spacing: 0.04em;
    }

    .tn-lightbox__fechar {
      position: absolute;
      top: 20px;
      right: 24px;
      background: transparent;
      border: none;
      color: #f2f2f2;
      font-size: 34px;
      line-height: 1;
      cursor: pointer;
      z-index: 2;
    }

    .tn-lightbox__nav {
      background: rgba(255, 255, 255, 0.08);
      border: none;
      color: #f2f2f2;
      font-size: 22px;
      width: 48px;
      height: 48px;
      border-radius: 50%;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: background 0.2s ease;
    }

    .tn-lightbox__nav:hover {
      background: rgba(255, 255, 255, 0.18);
    }

    .tn-lightbox__nav--prev {
      margin-right: 16px;
    }

    .tn-lightbox__nav--next {
      margin-left: 16px;
    }

    @media (max-width: 640px) {
      .tn-lightbox__nav {
        width: 40px;
        height: 40px;
        font-size: 18px;
      }

      .tn-lightbox__fechar {
        top: 12px;
        right: 12px;
        font-size: 30px;
      }
    }
  `;
  document.head.appendChild(style);
}

function garantirLightboxNoDOM() {
  if (document.getElementById('tn-lightbox')) return;

  const overlay = document.createElement('div');
  overlay.id = 'tn-lightbox';
  overlay.className = 'tn-lightbox';
  overlay.innerHTML = `
    <button type="button" class="tn-lightbox__fechar" aria-label="Fechar">&times;</button>
    <button type="button" class="tn-lightbox__nav tn-lightbox__nav--prev" aria-label="Imagem anterior">&#10094;</button>
    <div class="tn-lightbox__conteudo">
      <img class="tn-lightbox__imagem" src="" alt="">
      <div class="tn-lightbox__contador"></div>
    </div>
    <button type="button" class="tn-lightbox__nav tn-lightbox__nav--next" aria-label="Próxima imagem">&#10095;</button>
  `;
  document.body.appendChild(overlay);

  overlay.querySelector('.tn-lightbox__fechar').addEventListener('click', fecharLightbox);
  overlay.querySelector('.tn-lightbox__nav--prev').addEventListener('click', () => navegarLightbox(-1));
  overlay.querySelector('.tn-lightbox__nav--next').addEventListener('click', () => navegarLightbox(1));

  // Fecha ao clicar fora da imagem (no fundo escuro)
  overlay.addEventListener('click', (evento) => {
    if (evento.target === overlay) fecharLightbox();
  });
}

function atualizarImagemLightbox() {
  const overlay = document.getElementById('tn-lightbox');
  if (!overlay) return;

  const total = imagensGaleriaAtual.length;
  const imagem = imagensGaleriaAtual[estadoLightbox.indice];

  const imgEl = overlay.querySelector('.tn-lightbox__imagem');
  const contadorEl = overlay.querySelector('.tn-lightbox__contador');

  imgEl.src = imagem?.url || PLACEHOLDER_IMAGEM;
  imgEl.alt = imagem?.alt || 'Foto do imóvel';
  imgEl.onerror = () => {
    imgEl.onerror = null;
    imgEl.src = PLACEHOLDER_IMAGEM;
  };

  contadorEl.textContent = total > 0 ? `${estadoLightbox.indice + 1} / ${total}` : '';

  const mostrarNav = total > 1;
  overlay.querySelectorAll('.tn-lightbox__nav').forEach((botao) => {
    botao.style.display = mostrarNav ? 'flex' : 'none';
  });
}

function aoPressionarTeclaLightbox(evento) {
  if (evento.key === 'Escape') fecharLightbox();
  if (evento.key === 'ArrowRight') navegarLightbox(1);
  if (evento.key === 'ArrowLeft') navegarLightbox(-1);
}

function abrirLightbox(indiceInicial) {
  if (imagensGaleriaAtual.length === 0) return;

  injetarEstilosLightbox();
  garantirLightboxNoDOM();

  estadoLightbox.indice = indiceInicial;
  atualizarImagemLightbox();

  const overlay = document.getElementById('tn-lightbox');
  overlay.classList.add('is-aberto');
  document.body.classList.add('tn-lightbox-open');
  document.addEventListener('keydown', aoPressionarTeclaLightbox);
}

function fecharLightbox() {
  const overlay = document.getElementById('tn-lightbox');
  if (overlay) overlay.classList.remove('is-aberto');
  document.body.classList.remove('tn-lightbox-open');
  document.removeEventListener('keydown', aoPressionarTeclaLightbox);
}

function navegarLightbox(direcao) {
  const total = imagensGaleriaAtual.length;
  if (total === 0) return;
  estadoLightbox.indice = (estadoLightbox.indice + direcao + total) % total;
  atualizarImagemLightbox();
}

// Delegação de clique: funciona mesmo após o innerHTML da galeria
// ser recriado a cada renderização do imóvel.
document.addEventListener('click', (evento) => {
  const item = evento.target.closest('.imovel-galeria__item');
  if (!item) return;
  const indice = Number(item.dataset.indice || 0);
  abrirLightbox(indice);
});

// ============================================================
// Templates visuais
// ============================================================

function renderizarGaleria(imagens) {
  const lista = Array.isArray(imagens) && imagens.length > 0
    ? [...imagens].sort((a, b) => (a.ordem || 0) - (b.ordem || 0))
    : [{ url: PLACEHOLDER_IMAGEM, alt: "Imóvel sem imagem disponível" }];

  // Guarda a lista completa para o lightbox poder navegar por
  // todas as fotos, inclusive as que excedem as 5 miniaturas.
  imagensGaleriaAtual = lista;

  const single = lista.length === 1;
  const visiveis = lista.slice(0, 5);
  const extras = lista.length - visiveis.length;

  const itens = visiveis.map((img, index) => {
    const url = img.url || PLACEHOLDER_IMAGEM;
    const alt = escapeHtml(img.alt || 'Foto do imóvel');
    const isMain = index === 0;
    const isLast = !isMain && index === visiveis.length - 1 && extras > 0;

    return `
      <div class="imovel-galeria__item${isMain ? ' imovel-galeria__item--main' : ''}" data-indice="${index}" role="button" tabindex="0" aria-label="Ampliar foto ${index + 1}">
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