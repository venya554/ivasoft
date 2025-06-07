import { useState, useEffect } from "react";
import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Menu, X, LogIn, User } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";

export default function Header() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [location] = useLocation();
  const [scrolled, setScrolled] = useState(false);
  const { user } = useAuth();

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 10);
    };
    
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Close mobile menu when location changes
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [location]);

  const navItems = [
    { href: "/", label: "Главная" },
    { href: "/about", label: "О нас" },
    { href: "/services", label: "Услуги" },
    { href: "/portfolio", label: "Портфолио" },
    { href: "/contact", label: "Контакты" },
  ];

  return (
    <header 
      className={`fixed w-full bg-white z-50 transition-shadow duration-300 ${
        scrolled ? "shadow-md" : "shadow-sm"
      }`}
    >
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center py-4">
          <Link href="/" className="flex items-center space-x-2">
            <span className="text-primary font-roboto font-bold text-2xl">
              IvA<span className="text-accent">Soft</span>
            </span>
          </Link>
          
          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-8">
            {navItems.map((item, index) => (
              <Link 
                key={index}
                href={item.href}
                className={`font-roboto font-medium transition-colors ${
                  location === item.href ? "text-primary" : "hover:text-primary" 
                }`}
              >
                {item.label}
              </Link>
            ))}
            
            {/* Кнопка личного кабинета */}
            <Link href={user ? "/dashboard" : "/auth"}>
              <Button 
                variant="default" 
                size="sm" 
                className="flex items-center gap-1.5"
              >
                {user ? (
                  <>
                    <User className="h-4 w-4" />
                    Кабинет
                  </>
                ) : (
                  <>
                    <LogIn className="h-4 w-4" />
                    Войти
                  </>
                )}
              </Button>
            </Link>
          </nav>
          
          {/* Mobile Navigation Button */}
          <div className="flex items-center gap-2 md:hidden">
            {/* Кнопка личного кабинета для мобильных устройств */}
            <Link href={user ? "/dashboard" : "/auth"}>
              <Button 
                variant="outline" 
                size="icon"
              >
                {user ? <User className="h-4 w-4" /> : <LogIn className="h-4 w-4" />}
              </Button>
            </Link>
            
            {/* Кнопка меню для мобильных устройств */}
            <Button 
              variant="ghost"
              size="icon"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </Button>
          </div>
        </div>
        
        {/* Mobile Navigation Menu */}
        {mobileMenuOpen && (
          <nav className="md:hidden flex flex-col py-4 space-y-4 border-t border-gray-200">
            {navItems.map((item, index) => (
              <Link 
                key={index}
                href={item.href}
                className={`font-roboto font-medium transition-colors ${
                  location === item.href ? "text-primary" : "hover:text-primary" 
                }`}
              >
                {item.label}
              </Link>
            ))}
          </nav>
        )}
      </div>
    </header>
  );
}
