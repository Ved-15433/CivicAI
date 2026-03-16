import React from 'react';
import Navbar from '../components/landing/Navbar';
import Hero from '../components/landing/Hero';
import HowItWorks from '../components/landing/HowItWorks';
import Features from '../components/landing/Features';
import WhyItMatters from '../components/landing/WhyItMatters';
import Footer from '../components/landing/Footer';
import BackgroundEffects from '../components/landing/BackgroundEffects';

const Home = () => {
  return (
    <div className="relative min-h-screen selection:bg-blue-500/30">
      <BackgroundEffects />
      <Navbar />
      <main>
        <Hero />
        <HowItWorks />
        <Features />
        <WhyItMatters />
      </main>
      <Footer />
    </div>
  );
};

export default Home;
