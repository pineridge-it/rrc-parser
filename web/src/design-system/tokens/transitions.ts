// Design Tokens: Transitions and Animations
// Consistent timing and easing for smooth interactions

export const transitions = {
  // Duration values
  duration: {
    instant: '0ms',
    fast: '150ms',
    normal: '250ms',
    slow: '350ms',
    slower: '500ms',
  },
  
  // Easing functions
  easing: {
    linear: 'linear',
    easeIn: 'cubic-bezier(0.4, 0, 1, 1)',
    easeOut: 'cubic-bezier(0, 0, 0.2, 1)',
    easeInOut: 'cubic-bezier(0.4, 0, 0.2, 1)',
    sharp: 'cubic-bezier(0.4, 0, 0.6, 1)',
    spring: 'cubic-bezier(0.175, 0.885, 0.32, 1.275)',
  },
  
  // Common transition properties
  properties: {
    all: 'all',
    colors: 'background-color, border-color, color, fill, stroke',
    opacity: 'opacity',
    shadow: 'box-shadow',
    transform: 'transform',
  },
};

// Semantic transitions for common use cases
export const semanticTransitions = {
  // Interactive elements
  button: `${transitions.properties.all} ${transitions.duration.fast} ${transitions.easing.easeInOut}`,
  link: `${transitions.properties.colors} ${transitions.duration.fast} ${transitions.easing.easeInOut}`,
  input: `${transitions.properties.all} ${transitions.duration.normal} ${transitions.easing.easeInOut}`,
  
  // UI elements
  dropdown: `${transitions.properties.opacity} ${transitions.duration.normal} ${transitions.easing.easeOut}, ${transitions.properties.transform} ${transitions.duration.normal} ${transitions.easing.easeOut}`,
  modal: `${transitions.properties.opacity} ${transitions.duration.normal} ${transitions.easing.easeInOut}`,
  tooltip: `${transitions.properties.opacity} ${transitions.duration.fast} ${transitions.easing.easeOut}`,
  
  // Layout changes
  collapse: `height ${transitions.duration.normal} ${transitions.easing.easeInOut}`,
  fade: `opacity ${transitions.duration.normal} ${transitions.easing.easeInOut}`,
  slide: `transform ${transitions.duration.normal} ${transitions.easing.easeOut}`,
  
  // Hover effects
  hover: `${transitions.properties.all} ${transitions.duration.fast} ${transitions.easing.easeInOut}`,
  hoverShadow: `${transitions.properties.shadow} ${transitions.duration.fast} ${transitions.easing.easeInOut}`,
};

// Animation keyframes
export const animations = {
  // Fade animations
  fadeIn: {
    from: { opacity: 0 },
    to: { opacity: 1 },
  },
  fadeOut: {
    from: { opacity: 1 },
    to: { opacity: 0 },
  },
  
  // Slide animations
  slideInUp: {
    from: { transform: 'translateY(10px)', opacity: 0 },
    to: { transform: 'translateY(0)', opacity: 1 },
  },
  slideInDown: {
    from: { transform: 'translateY(-10px)', opacity: 0 },
    to: { transform: 'translateY(0)', opacity: 1 },
  },
  slideInLeft: {
    from: { transform: 'translateX(-10px)', opacity: 0 },
    to: { transform: 'translateX(0)', opacity: 1 },
  },
  slideInRight: {
    from: { transform: 'translateX(10px)', opacity: 0 },
    to: { transform: 'translateX(0)', opacity: 1 },
  },
  
  // Scale animations
  scaleIn: {
    from: { transform: 'scale(0.95)', opacity: 0 },
    to: { transform: 'scale(1)', opacity: 1 },
  },
  scaleOut: {
    from: { transform: 'scale(1)', opacity: 1 },
    to: { transform: 'scale(0.95)', opacity: 0 },
  },
  
  // Spin animation
  spin: {
    from: { transform: 'rotate(0deg)' },
    to: { transform: 'rotate(360deg)' },
  },
  
  // Pulse animation
  pulse: {
    '0%, 100%': { opacity: 1 },
    '50%': { opacity: 0.5 },
  },
  
  // Bounce animation
  bounce: {
    '0%, 100%': { transform: 'translateY(0)' },
    '50%': { transform: 'translateY(-10px)' },
  },
};
