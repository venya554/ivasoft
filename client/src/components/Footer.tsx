import { Link } from "wouter";
import { MapPin, Phone, Mail, MessageSquare } from "lucide-react";

export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-[#333333] text-white py-12">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          <div>
            <h3 className="font-roboto font-bold text-xl mb-4">
              IvA<span className="text-accent">Soft</span>
            </h3>
            <p className="mb-4 text-gray-300">
              IT-решения любой сложности для вашего бизнеса. Мы помогаем компаниям 
              расти и развиваться в цифровую эпоху.
            </p>
            <p className="text-gray-300">© {currentYear} IvASoft. Все права защищены.</p>
          </div>
          
          <div>
            <h3 className="font-roboto font-bold text-lg mb-4">Услуги</h3>
            <ul className="space-y-2 text-gray-300">
              <li>
                <Link href="/services" className="hover:text-accent transition-colors">
                  Разработка ПО
                </Link>
              </li>
              <li>
                <Link href="/services" className="hover:text-accent transition-colors">
                  Мобильные приложения
                </Link>
              </li>
              <li>
                <Link href="/services" className="hover:text-accent transition-colors">
                  Веб-разработка
                </Link>
              </li>
              <li>
                <Link href="/services" className="hover:text-accent transition-colors">
                  AI и Big Data
                </Link>
              </li>
              <li>
                <Link href="/services" className="hover:text-accent transition-colors">
                  Техническая поддержка
                </Link>
              </li>
            </ul>
          </div>
          
          <div>
            <h3 className="font-roboto font-bold text-lg mb-4">Компания</h3>
            <ul className="space-y-2 text-gray-300">
              <li>
                <Link href="/about" className="hover:text-accent transition-colors">
                  О нас
                </Link>
              </li>
              <li>
                <Link href="/portfolio" className="hover:text-accent transition-colors">
                  Портфолио
                </Link>
              </li>
              <li>
                <Link href="#" className="hover:text-accent transition-colors">
                  Карьера
                </Link>
              </li>
              <li>
                <Link href="#" className="hover:text-accent transition-colors">
                  Блог
                </Link>
              </li>
              <li>
                <Link href="/contact" className="hover:text-accent transition-colors">
                  Контакты
                </Link>
              </li>
            </ul>
          </div>
          
          <div>
            <h3 className="font-roboto font-bold text-lg mb-4">Свяжитесь с нами</h3>
            <ul className="space-y-2 text-gray-300">
              <li className="flex items-center">
                <MapPin className="mr-2 text-accent h-4 w-4" /> 
                г. Москва, ул. Технологическая, 42
              </li>
              <li className="flex items-center">
                <Phone className="mr-2 text-accent h-4 w-4" /> 
                +7 (495) 123-45-67
              </li>
              <li className="flex items-center">
                <Mail className="mr-2 text-accent h-4 w-4" /> 
                info@ivasoft.ru
              </li>
              <li className="flex items-center">
                <MessageSquare className="mr-2 text-accent h-4 w-4" /> 
                @ivasoft_support
              </li>
            </ul>
          </div>
        </div>
        
        <div className="mt-12 pt-8 border-t border-gray-700 text-center text-gray-400">
          <p>
            Разработано с <span className="text-accent">♥</span> командой IvASoft
          </p>
        </div>
      </div>
    </footer>
  );
}
