import { supabase } from "./supabaseClient.js";

export async function buscarImovelPorId(id) {
    const { data, error } = await supabase
        .from("imoveis")
        .select(`
      id,
      codigo,
      titulo,
      slug,
      descricao,
      tipo,
      finalidade,
      status,
      preco,
      condominio,
      iptu,
      area_privativa,
      area_total,
      quartos,
      suites,
      banheiros,
      vagas,
      andar,
      mobiliado,
      aceita_financiamento,
      aceita_permuta,
      destaque,
      bairros (
        nome,
        slug,
        cidade,
        estado
      ),
      imagens (
        url,
        alt,
        ordem,
        capa
      ),
      videos (
        url,
        tipo_video
      ),
      imovel_caracteristicas (
        caracteristicas (
          nome
        )
      )
    `)
        .eq("id", id)
        .single();

    if (error) {
        console.error("Erro ao buscar imóvel por ID:", error);
        throw error;
    }

    return data;
}

export async function buscarImovelPorSlug(slug) {
  const { data, error } = await supabase
    .from("imoveis")
    .select(`
      id,
      codigo,
      titulo,
      slug,
      descricao,
      tipo,
      finalidade,
      status,
      preco,
      condominio,
      iptu,
      area_privativa,
      area_total,
      quartos,
      suites,
      banheiros,
      vagas,
      andar,
      mobiliado,
      aceita_financiamento,
      aceita_permuta,
      destaque,
      bairros (
        nome,
        slug,
        cidade,
        estado
      ),
      imagens (
        url,
        alt,
        ordem,
        capa
      ),
      imovel_caracteristicas (
        caracteristicas (
          nome
        )
      )
    `)
    .eq("slug", slug)
    .eq("status", "disponivel")
    .single();

  if (error) {
    console.error("Erro ao buscar imóvel por slug:", error);
    throw error;
  }

  return data;
}


function escolherImagemCapa(imagens = []) {
    if (!Array.isArray(imagens) || imagens.length === 0) {
        return "./imagens/placeholder-imovel.jpg";
    }

    const capa = imagens.find((imagem) => imagem.capa);
    return (capa || imagens[0]).url || "./imagens/placeholder-imovel.jpg";
}

function normalizarImovel(imovel) {
    return {
        id: imovel.id,
        slug: imovel.slug,
        name: imovel.titulo,
        type: imovel.tipo,
        bairro: imovel.bairros?.nome || "Belo Horizonte",
        suites: imovel.suites ?? 0,
        vagas: imovel.vagas ?? 0,
        area: imovel.area_privativa ?? imovel.area_total ?? 0,
        price: imovel.preco ?? 0,
        image: escolherImagemCapa(imovel.imagens),
    };
}

export async function buscarImoveisCatalogo() {
    const { data, error } = await supabase
        .from("imoveis")
        .select(`
      id,
      codigo,
      titulo,
      slug,
      tipo,
      status,
      preco,
      area_privativa,
      area_total,
      suites,
      vagas,
      bairros (
        nome,
        slug
      ),
      imagens (
        url,
        alt,
        ordem,
        capa
      )
    `)
        .eq("status", "disponivel")
        .order("created_at", { ascending: false });

    if (error) {
        console.error("Erro ao buscar imóveis no Supabase:");
        console.error("message:", error.message);
        console.error("details:", error.details);
        console.error("hint:", error.hint);
        console.error("code:", error.code);
        console.error("erro completo:", JSON.stringify(error, null, 2));

        throw error;
    }


    return (data || []).map(normalizarImovel);
}