import { useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { CheckCircle } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { animateSection } from '@/lib/animations';

export default function AboutPage() {
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
            <h1 className="text-3xl md:text-4xl mb-4">О нас</h1>
            <div className="w-20 h-1 bg-accent mx-auto mb-6"></div>
            <p className="max-w-3xl mx-auto text-gray-700">
              Мы команда профессионалов с многолетним опытом в IT-индустрии, специализирующаяся на разработке 
              программного обеспечения, мобильных и веб-приложений.
            </p>
          </motion.div>
        </div>
      </section>

      <section ref={sectionRef1} className="py-8 bg-secondary section-fade">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <Card className="bg-white card-hover">
              <CardContent className="p-8">
                <div className="text-primary text-4xl mb-6">
                  <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="10"/><path d="M12 16v-4"/><path d="M12 8h.01"/>
                  </svg>
                </div>
                <h3 className="text-xl mb-4">Наша миссия</h3>
                <p className="text-gray-700">
                  Создавать инновационные IT-решения, которые делают бизнес наших клиентов более эффективным 
                  и конкурентоспособным на рынке.
                </p>
              </CardContent>
            </Card>
            
            <Card className="bg-white card-hover">
              <CardContent className="p-8">
                <div className="text-primary text-4xl mb-6">
                  <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
                  </svg>
                </div>
                <h3 className="text-xl mb-4">История компании</h3>
                <p className="text-gray-700">
                  Основанная в 2020 году группой энтузиастов, наша компания за короткий срок превратилась 
                  в надежного партнера для десятков клиентов.
                </p>
              </CardContent>
            </Card>
            
            <Card className="bg-white card-hover">
              <CardContent className="p-8">
                <div className="text-primary text-4xl mb-6">
                  <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>
                  </svg>
                </div>
                <h3 className="text-xl mb-4">Наша команда</h3>
                <p className="text-gray-700">
                  У нас работают высококвалифицированные специалисты с опытом в различных сферах IT: 
                  от веб-разработки до искусственного интеллекта.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      <section ref={sectionRef2} className="py-16 section-fade">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row items-center">
            <div className="md:w-1/2 md:pr-12 mb-10 md:mb-0">
              <h3 className="text-2xl md:text-3xl mb-6 text-primary">Наши компетенции</h3>
              <ul className="space-y-4">
                {[
                  'Разработка программного обеспечения для бизнеса',
                  'Создание мобильных приложений для iOS и Android',
                  'Веб-разработка с использованием современных технологий',
                  'Решения в области искусственного интеллекта и Big Data',
                  'Техническая поддержка и сопровождение проектов'
                ].map((item, i) => (
                  <li key={i} className="flex items-start">
                    <span className="text-accent mr-2">
                      <CheckCircle className="h-5 w-5 mt-0.5" />
                    </span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div className="md:w-1/2">
              <img 
                src="https://images.unsplash.com/photo-1522071820081-009f0129c71c?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=800&h=533" 
                alt="Наша команда профессионалов" 
                className="rounded-xl shadow-lg w-full h-auto"
              />
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
