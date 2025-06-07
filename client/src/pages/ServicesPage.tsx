import { useEffect, useRef } from 'react';
import { Link } from 'wouter';
import { motion } from 'framer-motion';
import { ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { animateSection } from '@/lib/animations';
import { SERVICES } from '@/lib/constants.tsx';

export default function ServicesPage() {
  const sectionRef1 = useRef<HTMLDivElement>(null);
  const sectionRef2 = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer1 = animateSection(sectionRef1);
    const observer2 = animateSection(sectionRef2);
    
    return () => {
      observer1.disconnect();
      observer2.disconnect();
    };
  }, []);

  return (
    <>
      <section className="pt-24 pb-8 md:pt-32 md:pb-16">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div 
            className="text-center mb-16"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <h1 className="text-3xl md:text-4xl mb-4">Наши услуги</h1>
            <div className="w-20 h-1 bg-accent mx-auto mb-6"></div>
            <p className="max-w-3xl mx-auto text-gray-700">
              Мы предлагаем широкий спектр IT-услуг, адаптированных под потребности вашего бизнеса
            </p>
          </motion.div>
        </div>
      </section>

      <section ref={sectionRef1} className="py-8 section-fade">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {SERVICES.map((service, index) => (
              <div key={index} className="bg-white rounded-xl shadow-md overflow-hidden card-hover">
                <div className="h-48 bg-primary flex items-center justify-center">
                  {service.icon}
                </div>
                <div className="p-6">
                  <h3 className="font-roboto font-bold text-xl mb-3">{service.title}</h3>
                  <p className="text-gray-700 mb-4">{service.description}</p>
                  <Link href="/contact" className="text-primary font-medium inline-flex items-center hover:underline">
                    Узнать больше <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section ref={sectionRef2} className="py-16 bg-primary section-fade">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center text-white">
            <h2 className="text-3xl md:text-4xl mb-6">Готовы начать проект с нами?</h2>
            <p className="max-w-3xl mx-auto mb-10 text-lg">
              Свяжитесь с нами сегодня, чтобы обсудить ваши идеи и получить бесплатную консультацию по вашему проекту.
            </p>
            <Button asChild className="btn-hover bg-white text-primary hover:bg-white/90 py-3 px-10 h-auto">
              <Link href="/contact">Обсудить проект</Link>
            </Button>
          </div>
        </div>
      </section>
    </>
  );
}
