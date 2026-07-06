// ============================================================
// src/theme/index.js
// Tema global do Mentalis
//
// Aqui ficam todas as "constantes visuais" do app:
// cores, tamanhos de fonte, espaçamentos e sombras.
//
// Por que centralizar aqui?
// Se você quiser mudar uma cor ou tamanho, muda em UM lugar
// e reflete em todo o app automaticamente.
// ============================================================

// ------------------------------------------------------------
// CORES
// Cada cor tem um nome semântico (o que ela significa)
// em vez de só um valor hex. Isso torna o código legível.
// ------------------------------------------------------------
export const colors = {
  // Fundos — do mais escuro para o mais claro
  background:  '#080810', // fundo principal da tela
  surface1:    '#0f0f1a', // cards de primeiro nível
  surface2:    '#161625', // cards de segundo nível (dentro de cards)
  surface3:    '#1e1e32', // inputs, áreas de texto

  // Cor primária — roxo neon (botões, destaques, IA)
  primary:        '#7c4dff',
  primaryDim:     'rgba(124, 77, 255, 0.10)', // versão transparente para fundos
  primaryGlow:    'rgba(124, 77, 255, 0.25)', // brilho/sombra

  // Semânticas — cada uma tem um significado claro
  success:     '#00e676', // verde: acerto, passou, tudo bem
  successDim:  'rgba(0, 230, 118, 0.10)',

  warning:     '#ff9100', // laranja: atenção, prazo chegando
  warningDim:  'rgba(255, 145, 0, 0.10)',

  danger:      '#ff3d57', // vermelho: erro, reprovação, falta
  dangerDim:   'rgba(255, 61, 87, 0.10)',

  info:        '#448aff', // azul: informação neutra
  infoDim:     'rgba(68, 138, 255, 0.10)',

  // Texto
  text:        '#e8e8f2', // texto principal
  textSub:     '#8888aa', // texto secundário (labels, datas)

  // Borda padrão dos cards
  border:      'rgba(255, 255, 255, 0.07)',
};

// ------------------------------------------------------------
// TIPOGRAFIA
// Tamanhos de fonte padronizados.
// Usar tamanhos fixos evita que cada tela use um valor diferente.
// ------------------------------------------------------------
export const typography = {
  // Tamanhos
  xs:   10, // labels pequenos, badges
  sm:   12, // texto secundário, datas
  md:   14, // texto padrão de corpo
  lg:   16, // títulos de card
  xl:   18, // títulos de seção
  xxl:  22, // títulos de tela
  hero: 28, // números grandes (ex: porcentagem de retenção)

  // Pesos
  regular:   '400',
  medium:    '500',
  semibold:  '600',
  bold:      '700',
};

// ------------------------------------------------------------
// ESPAÇAMENTO
// Múltiplos de 4px — padrão de design para manter harmonia visual.
// Exemplo: spacing.md = 16px, spacing.lg = 24px
// ------------------------------------------------------------
export const spacing = {
  xs:  4,
  sm:  8,
  md:  16,
  lg:  24,
  xl:  32,
  xxl: 48,
};

// ------------------------------------------------------------
// BORDAS
// Raios de borda para cards, botões e inputs.
// ------------------------------------------------------------
export const radii = {
  sm:   8,  // botões pequenos, badges
  md:   14, // cards padrão
  lg:   18, // cards em destaque
  xl:   24, // modais
  full: 999, // pílulas (chips, pills)
};

// ------------------------------------------------------------
// SOMBRAS
// Usadas para dar profundidade aos cards e botões.
// No React Native, sombra é definida por propriedades separadas.
// ------------------------------------------------------------
export const shadows = {
  card: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4, // elevation é necessário no Android
  },
  button: {
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 6,
  },
};
