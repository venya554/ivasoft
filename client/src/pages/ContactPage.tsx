import { useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { MapPin, Phone, Mail, MessageSquare } from 'lucide-react';
import { animateSection } from '@/lib/animations';
import ContactForm from '@/components/ContactForm';

export default function ContactPage() {
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
            <h1 className="text-3xl md:text-4xl mb-4">Свяжитесь с нами</h1>
            <div className="w-20 h-1 bg-accent mx-auto mb-6"></div>
            <p className="max-w-3xl mx-auto text-gray-700">
              Готовы обсудить ваш проект? Заполните форму ниже или воспользуйтесь контактной информацией
            </p>
          </motion.div>
        </div>
      </section>

      <section ref={sectionRef} className="py-8 bg-secondary section-fade">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
            {/* Contact Form */}
            <div className="bg-white p-8 rounded-xl shadow-lg">
              <h3 className="font-roboto font-bold text-2xl mb-6">Напишите нам</h3>
              <ContactForm />
            </div>
            
            {/* Contact Information */}
            <div>
              <h3 className="font-roboto font-bold text-2xl mb-6">Контактная информация</h3>
              <div className="space-y-8">
                <div className="flex items-start">
                  <div className="bg-primary text-white p-4 rounded-lg mr-4">
                    <MapPin className="h-5 w-5" />
                  </div>
                  <div>
                    <h4 className="font-roboto font-bold text-lg mb-1">Адрес</h4>
                    <p className="text-gray-700">г. Москва, ул. Технологическая, 42, офис 301</p>
                  </div>
                </div>
                
                <div className="flex items-start">
                  <div className="bg-primary text-white p-4 rounded-lg mr-4">
                    <Phone className="h-5 w-5" />
                  </div>
                  <div>
                    <h4 className="font-roboto font-bold text-lg mb-1">Телефон</h4>
                    <p className="text-gray-700">+7 (495) 123-45-67</p>
                  </div>
                </div>
                
                <div className="flex items-start">
                  <div className="bg-primary text-white p-4 rounded-lg mr-4">
                    <Mail className="h-5 w-5" />
                  </div>
                  <div>
                    <h4 className="font-roboto font-bold text-lg mb-1">Email</h4>
                    <p className="text-gray-700">info@ivasoft.ru</p>
                  </div>
                </div>
                
                <div className="flex items-start">
                  <div className="bg-primary text-white p-4 rounded-lg mr-4">
                    <MessageSquare className="h-5 w-5" />
                  </div>
                  <div>
                    <h4 className="font-roboto font-bold text-lg mb-1">Telegram</h4>
                    <p className="text-gray-700">@ivasoft_support</p>
                  </div>
                </div>
              </div>
              
              <div className="mt-10">
                <h4 className="font-roboto font-bold text-lg mb-4">Мы в социальных сетях</h4>
                <div className="flex space-x-4">
                  {[
                    { icon: "vk", url: "https://vk.com" },
                    { icon: "telegram", url: "https://t.me" },
                    { icon: "youtube", url: "https://youtube.com" },
                    { icon: "github", url: "https://github.com" }
                  ].map((social, index) => (
                    <a 
                      key={index}
                      href={social.url} 
                      target="_blank" 
                      rel="noreferrer" 
                      className="bg-primary text-white w-10 h-10 rounded-full flex items-center justify-center hover:bg-accent transition-colors"
                    >
                      <i className={`fab fa-${social.icon}`}></i>
                    </a>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
