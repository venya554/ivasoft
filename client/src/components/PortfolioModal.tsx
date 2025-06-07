import { useEffect } from 'react';
import { X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { PORTFOLIO_ITEMS } from '@/lib/constants.tsx';

interface PortfolioModalProps {
  projectId: string;
  onClose: () => void;
}

export default function PortfolioModal({ projectId, onClose }: PortfolioModalProps) {
  const project = PORTFOLIO_ITEMS.find(item => item.id === projectId);

  // Close modal on escape key
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [onClose]);

  // Prevent body scrolling when modal is open
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = 'auto';
    };
  }, []);

  if (!project) return null;

  return (
    <div 
      className="fixed inset-0 z-50 bg-black/75 flex items-center justify-center p-4 overflow-auto"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="bg-white rounded-xl max-w-4xl w-full max-h-[90vh] overflow-auto">
        <div className="relative">
          <Button 
            variant="ghost" 
            size="icon" 
            className="absolute top-4 right-4 z-10 text-gray-500 hover:text-gray-800" 
            onClick={onClose}
          >
            <X className="h-6 w-6" />
          </Button>
          
          <div className="p-8">
            <h2 className="font-roboto font-bold text-3xl mb-4">{project.title}</h2>
            <p className="text-gray-600 mb-6">{project.tags}</p>
            <img 
              src={project.image} 
              alt={project.title} 
              className="w-full rounded-xl mb-6"
            />
            <h3 className="font-roboto font-bold text-xl mb-3">О проекте</h3>
            <p className="text-gray-700 mb-4">{project.fullDescription}</p>
            
            <h3 className="font-roboto font-bold text-xl mb-3">Задачи</h3>
            <ul className="list-disc list-inside mb-4 text-gray-700">
              {project.tasks.map((task, index) => (
                <li key={index}>{task}</li>
              ))}
            </ul>
            
            <h3 className="font-roboto font-bold text-xl mb-3">Технологии</h3>
            <div className="flex flex-wrap gap-2 mb-4">
              {project.technologies.map((tech, index) => (
                <span key={index} className="bg-gray-200 px-3 py-1 rounded-full text-sm">
                  {tech}
                </span>
              ))}
            </div>
            
            <h3 className="font-roboto font-bold text-xl mb-3">Результаты</h3>
            <p className="text-gray-700">{project.results}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
