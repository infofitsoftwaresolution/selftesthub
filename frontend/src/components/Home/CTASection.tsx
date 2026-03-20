import React from 'react';

interface CTASectionProps {
  onLoginClick: () => void;
  onRegisterClick: () => void;
}

const CTASection: React.FC<CTASectionProps> = ({ onLoginClick, onRegisterClick }) => {
  return (
    <section className="py-16 bg-blue-600 text-white">
      <div className="container mx-auto px-4 text-center">
        <h2 className="text-3xl font-bold mb-6">Ready to Start Your Learning Journey?</h2>
        <p className="text-xl mb-8 max-w-2xl mx-auto">
          Join thousands of students who are already improving their knowledge with SelfTestHub.
          Create your free account today and access our comprehensive quiz library!
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <button
            onClick={onRegisterClick}
            className="bg-white text-blue-600 px-8 py-3 rounded-lg font-semibold hover:bg-blue-50 transition-colors"
          >
            Get Started Free
          </button>
          <button
            onClick={onLoginClick}
            className="border-2 border-white px-8 py-3 rounded-lg font-semibold hover:bg-white hover:text-blue-600 transition-colors"
          >
            Sign In
          </button>
        </div>
      </div>
    </section>
  );
};

export default CTASection;