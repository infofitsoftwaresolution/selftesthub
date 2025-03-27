import React from 'react';
import { FaQuoteLeft } from 'react-icons/fa';

const testimonials = [
  {
    quote: "SelfTestHub has been instrumental in my exam preparation. The variety of quizzes and detailed feedback have helped me improve significantly.",
    author: "Sarah Johnson",
    role: "Medical Student"
  },
  {
    quote: "The platform's user-friendly interface and comprehensive quiz library make learning enjoyable and effective.",
    author: "Michael Chen",
    role: "Engineering Graduate"
  },
  {
    quote: "I love how I can track my progress and identify areas that need improvement. It's like having a personal tutor!",
    author: "Emma Davis",
    role: "High School Student"
  }
];

const TestimonialsSection: React.FC = () => {
  return (
    <section className="py-16 bg-white">
      <div className="container mx-auto px-4">
        <h2 className="text-3xl font-bold text-center mb-12">What Our Users Say</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {testimonials.map((testimonial, index) => (
            <div key={index} className="p-6 bg-gray-50 rounded-lg shadow-sm">
              <FaQuoteLeft className="text-blue-600 w-8 h-8 mb-4" />
              <p className="text-gray-600 mb-4 italic">"{testimonial.quote}"</p>
              <div>
                <p className="font-semibold">{testimonial.author}</p>
                <p className="text-gray-500 text-sm">{testimonial.role}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default TestimonialsSection; 