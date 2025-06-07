import { useEffect, useRef, useState } from 'react';
import { Link } from 'wouter';
import { motion } from 'framer-motion';
import { ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { PORTFOLIO_ITEMS } from '@/lib/constants.tsx';
import { animateSection } from '@/lib/animations';
import PortfolioModal from '@/components/PortfolioModal';

export default function PortfolioPage() {
  const [selectedProject, setSelectedProject] = useState<string | null>(null);
  const sectionRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = animateSection(sectionRef);
    return () => observer.disconnect();
  }, []);

  return (
    <>
      <section className="pt-24 pb-16 md:pt-32 md:pb-16">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div 
            className="text-center mb-16"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <h1 className="text-3xl md:text-4xl mb-4">Наше портфолио</h1>
            <div className="w-20 h-1 bg-accent mx-auto mb-6"></div>
            <p className="max-w-3xl mx-auto text-gray-700">
              Ознакомьтесь с нашими последними проектами, которые демонстрируют наш опыт и подход к работе
            </p>
          </motion.div>
        </div>
      </section>

      <section ref={sectionRef} className="py-8 section-fade">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {PORTFOLIO_ITEMS.map((item, index) => (
              <div key={index} className="bg-white rounded-xl shadow-md overflow-hidden card-hover">
                <img 
                  src={item.image} 
                  alt={item.title} 
                  className="w-full h-48 object-cover"
                />
                <div className="p-6">
                  <h3 className="font-roboto font-bold text-xl mb-2">{item.title}</h3>
                  <p className="text-gray-600 text-sm mb-3">{item.tags}</p>
                  <p className="text-gray-700 mb-4">{item.shortDescription}</p>
                  <Button 
                    variant="link" 
                    className="text-primary font-medium p-0 h-auto"
                    onClick={() => setSelectedProject(item.id)}
                  >
                    Подробнее <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
          
          <div className="text-center mt-12">
            <Button asChild className="btn-hover bg-accent text-white hover:bg-accent/90 py-3 px-8 h-auto">
              <Link href="/contact">Обсудить ваш проект</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Portfolio Modal */}
      {selectedProject && (
        <PortfolioModal 
          projectId={selectedProject} 
          onClose={() => setSelectedProject(null)} 
        />
      )}
    </>
  );
}
