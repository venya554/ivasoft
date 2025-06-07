import { MutableRefObject } from 'react';

/**
 * Функция для анимации секций при прокрутке
 * @param ref Реф для элемента, который нужно анимировать
 * @returns IntersectionObserver для отключения наблюдателя
 */
export const animateSection = (ref: MutableRefObject<HTMLElement | null>) => {
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
        }
      });
    },
    { threshold: 0.1 }
  );
  
  if (ref.current) {
    observer.observe(ref.current);
  }
  
  return observer;
};

/**
 * Анимации для Framer Motion
 */
export const fadeInUp = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.5 }
};

export const staggerChildren = {
  animate: {
    transition: {
      staggerChildren: 0.1
    }
  }
};

export const cardAnimation = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.3 },
  whileHover: { y: -5, boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)' }
};
