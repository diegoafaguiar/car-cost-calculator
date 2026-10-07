# Custo de Carro

Painel para decidir entre **manter o carro atual**, **trocar por 0 km**, **trocar por seminovo** ou **assinar um carro**,
comparando o custo total de propriedade (TCO) em **1, 3 e 5 anos** com preços da **Tabela FIPE** consultados ao vivo.

## O que faz

- **Meu carro**: busca o valor na FIPE (marca → modelo → ano) ou usa um valor manual; consumo real, seguro,
  manutenção, depreciação, financiamento em aberto e gastos previstos (pneus, embreagem…).
- **Premissas configuráveis**: km/ano, % cidade, preços de gasolina/etanol/diesel/kWh, rendimento do dinheiro,
  inflação, IPVA por motorização, juros e prazo do financiamento, entrada mínima, reserva disponível, deságio na
  venda, ágio no seminovo e mensalidades de assinatura.
- **Mercado**: catálogo curado com cerca de 35 modelos populares (flex, híbridos, plug-in, elétricos) em 0 km e
  seminovos de N anos, com preços FIPE atualizados por um botão (cache de 7 dias, versão FIPE ajustável por modelo).
- **Ranking** por horizonte (curto/médio/longo), com ordenação por qualquer coluna, filtros (tipo, categoria,
  motorização, preço, custo mensal, lugares, busca, "só o que economiza"), economia vs. manter e mês de break-even.
- **Gráfico** de custo acumulado mês a mês para até 5 opções, além da composição do custo por item.
- **Fichas dos modelos** (`#/carro/<id>`): resumo, o que mudou entre anos-modelo, destaques, pontos de atenção,
  versões e preços, ficha técnica lado a lado com o seu carro, foto (Wikimedia Commons) e análise comparativa
  calculada com as suas premissas. Cada ficha lista as fontes, a data da pesquisa e o que não pôde ser confirmado.
  As fichas ficam em `src/data/models/*.json`.
- **Financiamento por montadora/modelo**: regras com taxa, prazo e entrada (ex.: taxa zero), aplicadas a 0 km,
  seminovos ou ambos. No modo automático, financia quando a taxa é menor que o rendimento do dinheiro.
- **Transparência**: cada ficha mostra o que é dado com fonte e o que é estimativa (seguro, manutenção, depreciação).
- **Filtros**: busca de carro com sugestões (abre a ficha), faixa de preço de/até, categoria do seu carro com
  "uma abaixo" e "uma acima" independentes, motorização, tipo, marca e preferência por motorização.
- **Comparador lado a lado**: o seu carro e até 5 opções, com custos por horizonte, composição, compra e ficha técnica.
- **Custo de oportunidade opcional**: chave para incluir ou não o rendimento do dinheiro no custo.
- **Exportar**: resumo para WhatsApp (copiar ou abrir), planilha Excel (.xlsx com resumo, comparação e ranking), CSV
  do ranking e imagem PNG da comparação.
- **Revisões programadas** do carro atual por quilometragem (tabela de preço fixo editável), somadas à manutenção.
- **Carros fora do catálogo**: adicione qualquer carro pela FIPE informando categoria, motorização e consumo INMETRO.
- Tudo fica salvo no `localStorage` do navegador. Não há backend.

## Metodologia

Custo = perda de patrimônio frente a vender o carro atual hoje e aplicar o dinheiro. A simulação mensal (60 meses)
debita combustível, seguro, IPVA/licenciamento, manutenção (crescente com a idade), parcelas e mensalidades, rende
o caixa à taxa informada e, no fim do horizonte, soma o valor de revenda (com deságio) e desconta o saldo devedor.
O custo de oportunidade é o resíduo: o rendimento que o dinheiro teria gerado.

## Scripts

```bash
npm install
npm run dev     # servidor de desenvolvimento
npm test        # testes do motor de cálculo (Vitest)
npm run build   # type-check + build de produção em dist/
```

Stack: React 19, TypeScript, Vite, Tailwind CSS v4. FIPE via [API Parallelum](https://fipe.parallelum.com.br)
(500 consultas/dia sem token; token gratuito opcional em Premissas → Mercado).

## Deploy na Vercel

O projeto já está pronto para a Vercel (`vercel.json`: framework Vite, `npm run build`, saída em `dist/`).

1. Em [vercel.com/new](https://vercel.com/new), clique em **Import Git Repository** e escolha `diegoafaguiar/car-cost-calculator`
   (na primeira vez, autorize a Vercel a acessar o repositório no GitHub).
2. A Vercel detecta **Vite** sozinha. Confira: Build Command `npm run build`, Output Directory `dist`, Node.js 20.19+ ou 22.12+ (padrão da Vercel atende).
3. Não há variáveis de ambiente obrigatórias. Clique em **Deploy**.
4. A cada push na `main` a Vercel publica uma nova versão; cada pull request ganha uma URL de pré-visualização.

As rotas usam `#/carro/<id>`, então não é preciso configurar rewrites. A FIPE (fipe.parallelum.com.br) e as fotos
(Wikipédia) são consultadas direto do navegador do visitante.
