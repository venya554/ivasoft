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
              <li className="flex items-start">
                <MapPin className="mr-2 text-accent h-4 w-4 mt-0.5" /> 
                <span>Республика Крым, Симферополь, проспект Академика Вернадского, 4</span>
              </li>
              <li className="flex items-center">
                <Phone className="mr-2 text-accent h-4 w-4" /> 
                +7(978) 519-74-72
              </li>
              <li className="flex items-center">
                <Mail className="mr-2 text-accent h-4 w-4" /> 
                ivasoft@internet.ru
              </li>
              
            </ul>
            
            <div className="mt-6">
              <h4 className="font-roboto font-bold text-md mb-3">Мы в социальных сетях</h4>
              <div className="flex space-x-3">
                {[
                  { 
                    icon: (
                      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.820 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z"/>
                      </svg>
                    ), 
                    url: "https://t.me/IvAS0ft", 
                    name: "Telegram" 
                  },
                  { 
                    icon: (
                      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M15.684 0H8.316C1.592 0 0 1.592 0 8.316v7.368C0 22.408 1.592 24 8.316 24h7.368C22.408 24 24 22.408 24 15.684V8.316C24 1.592 22.408 0 15.684 0zm3.692 17.123h-1.744c-.66 0-.862-.523-2.049-1.714-1.03-1.004-1.489-1.142-1.744-1.142-.356 0-.458.102-.458.596v1.565c0 .424-.135.678-1.253.678-1.846 0-3.896-1.115-5.335-3.196C4.566 10.721 4.05 7.745 4.05 7.042c0-.254.102-.491.596-.491h1.744c.444 0 .611.203.781.678.863 2.49 2.303 4.675 2.896 4.675.222 0 .322-.102.322-.663V9.721c-.068-1.186-.695-1.287-.695-1.71 0-.204.169-.407.441-.407h2.743c.373 0 .507.203.507.643v3.473c0 .372.169.507.271.507.222 0 .407-.135.813-.542 1.254-1.406 2.151-3.574 2.151-3.574.119-.254.322-.491.763-.491h1.744c.525 0 .644.271.525.643-.22 1.017-2.354 4.031-2.354 4.031-.186.305-.254.441 0 .763.186.237.795.779 1.203 1.254.745.847 1.32 1.558 1.473 2.05.169.49-.085.744-.576.744z"/>
                      </svg>
                    ), 
                    url: "https://vk.com/sanqee", 
                    name: "VK" 
                  },
                  { 
                    icon: (
                      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M12 0C5.374 0 0 5.373 0 12 0 17.302 3.438 21.8 8.207 23.387c.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23A11.509 11.509 0 0112 5.803c1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576C20.566 21.797 24 17.3 24 12c0-6.627-5.373-12-12-12z"/>
                      </svg>
                    ), 
                    url: "https://github.com/AlexanderBobrenko", 
                    name: "GitHub" 
                  }
                ].map((social, index) => (
                  <a 
                    key={index}
                    href={social.url} 
                    target="_blank" 
                    rel="noreferrer" 
                    className="bg-gray-600 text-white w-8 h-8 rounded-full flex items-center justify-center hover:bg-accent transition-colors"
                    title={social.name}
                  >
                    {social.icon}
                  </a>
                ))}
              </div>
            </div>
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
