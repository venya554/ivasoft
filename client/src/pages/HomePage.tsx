import { useEffect, useRef } from 'react';
import { Link } from 'wouter';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { animateSection } from '@/lib/animations';

export default function HomePage() {
  const sectionRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = animateSection(sectionRef);
    return () => observer.disconnect();
  }, []);

  return (
    <>
      {/* Hero Section */}
      <section id="home" className="pt-24 pb-16 md:pt-32 md:pb-24">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row items-center">
            <motion.div 
              className="md:w-1/2 md:pr-12 mb-10 md:mb-0"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              <h1 className="text-4xl md:text-5xl lg:text-6xl mb-6 leading-tight">
                <span className="text-primary">IvASoft</span> — IT-решения любой сложности
              </h1>
              <p className="text-lg md:text-xl mb-8 text-gray-700">
                Мы создаем инновационные технологические решения, которые помогают бизнесу расти и развиваться в цифровую эпоху
              </p>
              <div className="flex flex-col sm:flex-row space-y-4 sm:space-y-0 sm:space-x-4">
                <Button asChild variant="default" className="btn-hover bg-accent text-white hover:bg-accent/90 py-3 px-8 h-auto">
                  <Link href="/contact">Связаться с нами</Link>
                </Button>
                <Button asChild variant="outline" className="border-primary text-primary hover:bg-primary hover:text-white py-3 px-8 h-auto">
                  <Link href="/services">Наши услуги</Link>
                </Button>
              </div>
            </motion.div>
            <motion.div 
              className="md:w-1/2"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5, delay: 0.2 }}
            >
              <img 
                src="https://images.unsplash.com/photo-1551434678-e076c223a692?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=800&h=600" 
                alt="IT технологии и инновации" 
                className="rounded-xl shadow-xl w-full h-auto"
              />
            </motion.div>
          </div>
        </div>
      </section>

      {/* CTA section */}
      <section ref={sectionRef} className="py-16 bg-primary section-fade">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center text-white">
            <h2 className="text-3xl md:text-4xl mb-6">Готовы начать проект с нами?</h2>
            <p className="max-w-3xl mx-auto mb-10 text-lg">Свяжитесь с нами сегодня, чтобы обсудить ваши идеи и получить бесплатную консультацию по вашему проекту.</p>
            <Button asChild className="btn-hover bg-white text-primary hover:bg-white/90 py-3 px-10 h-auto">
              <Link href="/contact">Обсудить проект</Link>
            </Button>
          </div>
        </div>
      </section>
    </>
  );
}
