import React, { useState } from 'react';
import { icons } from '../constants'; // Caminho atualizado

interface FeedbackScreenProps {
  onBack: () => void;
  onSubmit: (rating: number, comment: string) => void;
}

const StarRating: React.FC<{ rating: number; setRating: (rating: number) => void; }> = ({ rating, setRating }) => {
  return (
    <div className="flex justify-center space-x-2">
      {[1, 2, 3, 4, 5].map((star: number) => (
        <button key={star} onClick={() => setRating(star)} className="focus:outline-none transition-transform transform hover:scale-110">
          {/* FIX: The icons.star function only takes one argument (className). The fill/color is handled by the className. */}
          {icons.star(`w-10 h-10 ${star <= rating ? 'text-yellow-400' : 'text-gray-400'}`)}
        </button>
      ))}
    </div>
  );
};

const FeedbackScreen: React.FC<FeedbackScreenProps> = ({ onBack, onSubmit }) => {
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');

  const handleSubmit = () => {
    if (rating > 0 && comment.trim() !== '') {
      onSubmit(rating, comment);
      // Maybe show a success message and then navigate back
      onBack();
    } else {
      // Show an error/alert
      alert('Por favor, selecione uma avaliação e escreva um comentário.');
    }
  };

  return (
    <div className="w-full h-full flex flex-col bg-[#0B1526]">
      <header className="p-4 flex justify-between items-center flex-shrink-0">
        <button onClick={onBack} className="text-white">{icons.back('w-6 h-6')}</button>
        <h1 className="text-xl font-bold text-white">Feedback e Avaliação</h1>
        <div className="w-6 h-6"></div>
      </header>

      <main className="bg-white rounded-t-[2.5rem] p-6 pt-8 mt-4 text-gray-800 flex flex-col flex-grow">
        <h2 className="text-2xl font-bold text-center mb-2">Avalie a Indicação</h2>
        <p className="text-center text-gray-500 mb-8">Sua opinião é importante para nós!</p>

        <div className="mb-8">
            <StarRating rating={rating} setRating={setRating} />
        </div>

        <div className="flex-grow flex flex-col">
            <label htmlFor="comment" className="text-lg font-semibold mb-2">Comentário Construtivo</label>
            <textarea
                id="comment"
                rows={8}
                value={comment}
                onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setComment(e.target.value)}
                placeholder="Descreva sua experiência com a indicação..."
                className="w-full bg-gray-100 rounded-lg p-3 focus:outline-none flex-grow resize-none"
            />
        </div>

        <div className="mt-8 text-center">
            <button onClick={handleSubmit} className="bg-[#0d1b2a] text-white font-bold py-3 px-12 rounded-full w-full hover:bg-[#1a2c41] transition-colors">
                Enviar Feedback
            </button>
        </div>
      </main>
    </div>
  );
};

export default FeedbackScreen;