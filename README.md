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
