import React from 'react';
import { FaGraduationCap, FaChartLine, FaClock, FaTrophy } from 'react-icons/fa';

const features = [
  {
    icon: <FaGraduationCap className="w-8 h-8" />,
    title: "Diverse Quiz Categories",
    description: "Access a wide range of quizzes across various subjects and difficulty levels."
  },
  {
    icon: <FaChartLine className="w-8 h-8" />,
    title: "Performance Analytics",
    description: "Track your progress with detailed performance metrics and insights."
  },
  {
    icon: <FaClock className="w-8 h-8" />,
    title: "Time Management",
    description: "Practice with timed quizzes to improve your time management skills."
  },
  {
    icon: <FaTrophy className="w-8 h-8" />,
    title: "Achievement System",
    description: "Earn badges and certificates as you complete quizzes and improve your scores."
  }
];

const FeaturesSection: React.FC = () => {
  return (
    <section className="py-16 bg-white">
      <div className="container mx-auto px-4">
        <h2 className="text-3xl font-bold text-center mb-12">Why Choose SelfTestHub?</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {features.map((feature, index) => (
            <div key={index} className="p-6 bg-gray-50 rounded-lg shadow-sm hover:shadow-md transition-shadow">
              <div className="text-blue-600 mb-4">{feature.icon}</div>
              <h3 className="text-xl font-semibold mb-2">{feature.title}</h3>
              <p className="text-gray-600">{feature.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default FeaturesSection; 