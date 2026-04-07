export type Marketplace = {
  id: string;
  nome: string;
  comissao: number;
  taxaFixa: number;
  freteGratis: number;
  obs: string;
};

export const marketplaces: Marketplace[] = [
  {
    id: "ml_premium",
    nome: "Mercado Livre (Premium)",
    comissao: 0.175,
    taxaFixa: 6.0,
    freteGratis: 79.0,
    obs: "Exige PJ para escala e emissão de NF.",
  },
  {
    id: "enjoei",
    nome: "Enjoei",
    comissao: 0.185,
    taxaFixa: 5.0,
    freteGratis: 0,
    obs: "Aceita PF. Ideal para moda e acessórios.",
  },
  {
    id: "shopee",
    nome: "Shopee",
    comissao: 0.14,
    taxaFixa: 4.0,
    freteGratis: 0,
    obs: "Aceita PF. Plataforma de alto giro.",
  },
  {
    id: "amazon",
    nome: "Amazon",
    comissao: 0.15,
    taxaFixa: 0.0,
    freteGratis: 0,
    obs: "Geralmente exige conta PJ/Pro.",
  },
  {
    id: "olx_pay",
    nome: "OLX Pay",
    comissao: 0.1,
    taxaFixa: 0.0,
    freteGratis: 0,
    obs: "Aceita PF. Foco em desapego e entrega local.",
  },
];

export type CalcOptions = {
  precoVenda: number;
  custoPago: number;
  incluiImpostoMEI: boolean;
  freteVendedor: boolean;
};

export type Resultado = {
  marketplace: Marketplace;
  impostoMEI: number;
  comissao: number;
  taxaFixa: number;
  taxasTotais: number;
  voceRecebe: number;
  lucroReal: number;
  margem: number;
};

export function calcularParaMarketplace(
  m: Marketplace,
  { precoVenda, custoPago, incluiImpostoMEI, freteVendedor }: CalcOptions
): Resultado {
  const impostoMEI = incluiImpostoMEI ? precoVenda * 0.06 : 0;
  const comissao = precoVenda * m.comissao;
  let taxaFixa = m.taxaFixa;
  if (m.id === "ml_premium" && precoVenda >= m.freteGratis) {
    taxaFixa = 0;
  }
  const taxasTotais = impostoMEI + comissao + taxaFixa;
  const voceRecebe = precoVenda - taxasTotais;
  const custoTotal = custoPago + (freteVendedor ? 25 : 0);
  const lucroReal = voceRecebe - custoTotal;
  const margem = custoPago > 0 ? (lucroReal / custoPago) * 100 : 0;
  return {
    marketplace: m,
    impostoMEI,
    comissao,
    taxaFixa,
    taxasTotais,
    voceRecebe,
    lucroReal,
    margem,
  };
}

export function calcularTodos(opts: CalcOptions): Resultado[] {
  return marketplaces.map((m) => calcularParaMarketplace(m, opts));
}
