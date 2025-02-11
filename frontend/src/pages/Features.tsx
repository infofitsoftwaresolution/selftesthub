import React from 'react';
import Navbar from '../components/Home/Navbar';
import { FaLaptop, FaChartBar, FaLock, FaClock, FaMedal, FaUsers } from 'react-icons/fa';

const Features: React.FC = () => {
  const features = [
    {
      icon: <FaLaptop className="w-8 h-8" />,
      title: "Online Assessments",
      description: "Take exams from anywhere with our secure online platform"
    },
    {
      icon: <FaChartBar className="w-8 h-8" />,
      title: "Instant Results",
      description: "Get detailed performance analytics immediately after completion"
    },
    {
      icon: <FaLock className="w-8 h-8" />,
      title: "Secure Platform",
      description: "Advanced security measures to maintain exam integrity"
    },
    {
      icon: <FaClock className="w-8 h-8" />,
      title: "Timed Tests",
      description: "Automatic timing and submission for fair assessment"
    },
    {
      icon: <FaMedal className="w-8 h-8" />,
      title: "Progress Tracking",
      description: "Monitor your improvement over time with detailed statistics"
    },
    {
      icon: <FaUsers className="w-8 h-8" />,
      title: "Multiple Users",
      description: "Support for students, teachers, and administrators"
    }
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="pt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold text-gray-900 mb-4">Our Features</h1>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Discover the powerful features that make our MCQ Exam System the perfect choice for online assessments
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <div key={index} className="bg-white p-6 rounded-lg shadow-lg hover:shadow-xl transition-shadow">
                <div className="text-blue-600 mb-4">
                  {feature.icon}
                </div>
                <h3 className="text-xl font-semibold mb-2">{feature.title}</h3>
                <p className="text-gray-600">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Features; 