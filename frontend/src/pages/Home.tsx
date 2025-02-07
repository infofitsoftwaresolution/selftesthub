import React from 'react';
import Navbar from '../components/Home/Navbar';
import HeroSection from '../components/Home/HeroSection';

const Home: React.FC = () => {
  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <HeroSection />
    </div>
  );
};

export default Home; 