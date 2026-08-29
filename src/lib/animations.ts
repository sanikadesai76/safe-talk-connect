// Shared animation configs for Sathiii pages
// The ease property must be typed as a tuple for framer-motion

export const fadeUp = {
  initial: { opacity: 0, y: 24 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] as const },
};

export const fadeUpExit = {
  initial: { opacity: 0, y: 24 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -24 },
  transition: { duration: 0.4, ease: [0.22, 1, 0.36, 1] as const },
};

export const stagger = {
  animate: { transition: { staggerChildren: 0.1 } },
};
