import React from 'react';
import { FaGraduationCap, FaChartLine, FaShieldAlt } from 'react-icons/fa';
import Navbar from '../components/Home/Navbar';

const About: React.FC = () => {
  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="pt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold text-gray-900 mb-4">About MCQ Exam System</h1>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              We're dedicated to revolutionizing online assessment through our advanced MCQ examination platform.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 mb-16">
            <div className="bg-white p-6 rounded-lg shadow-lg">
              <div className="text-blue-600 mb-4">
                <FaGraduationCap size={40} />
              </div>
              <h3 className="text-xl font-semibold mb-2">Educational Excellence</h3>
              <p className="text-gray-600">
                Our platform is designed to support educational institutions in delivering high-quality assessments.
              </p>
            </div>

            <div className="bg-white p-6 rounded-lg shadow-lg">
              <div className="text-blue-600 mb-4">
                <FaChartLine size={40} />
              </div>
              <h3 className="text-xl font-semibold mb-2">Performance Analytics</h3>
              <p className="text-gray-600">
                Comprehensive analytics and reporting tools to track student progress and identify areas for improvement.
              </p>
            </div>

            <div className="bg-white p-6 rounded-lg shadow-lg">
              <div className="text-blue-600 mb-4">
                <FaShieldAlt size={40} />
              </div>
              <h3 className="text-xl font-semibold mb-2">Secure Testing</h3>
              <p className="text-gray-600">
                Advanced security measures to ensure the integrity of examinations and protect sensitive data.
              </p>
            </div>
          </div>

          <div className="bg-blue-50 rounded-xl p-8 mb-16">
            <h2 className="text-3xl font-bold text-center mb-8">Our Mission</h2>
            <p className="text-lg text-gray-700 max-w-4xl mx-auto text-center">
              To provide a robust, user-friendly platform that empowers educators and students alike, 
              making assessment processes more efficient, accurate, and insightful while maintaining 
              the highest standards of academic integrity.
            </p>
          </div>

          <div className="text-center">
            <h2 className="text-3xl font-bold mb-8">Get Started Today</h2>
            <button className="bg-blue-600 text-white px-8 py-3 rounded-lg text-lg font-medium hover:bg-blue-700 transition-colors">
              Join Our Platform
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default About; 