import React from 'react';
import { motion } from 'framer-motion';
import { SparklesIcon, CameraIcon, SuitcaseIcon } from './icons';

// Icône flèche simple locale pour ce composant
const ArrowIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
    <path fillRule="evenodd" d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z" clipRule="evenodd" />
  </svg>
);

// Icône chevron down pour le scroll indicator
const ChevronDownIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
  </svg>
);

interface LandingPageProps {
  onGetStarted: () => void;
}

const LandingPage: React.FC<LandingPageProps> = ({ onGetStarted }) => {
  const fadeInUp = {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.6 }
  };

  const staggerContainer = {
    animate: {
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  return (
    <div className="min-h-screen bg-snow dark:bg-onyx text-raisin-black dark:text-snow overflow-x-hidden">
      
      {/* Navigation minimaliste */}
      <nav className="absolute top-0 w-full p-6 flex justify-between items-center z-50">
        <div className="text-2xl font-serif font-bold">
          Dress <span className="text-gold">Me</span> Up!
        </div>
        <button 
          onClick={onGetStarted}
          className="text-sm font-semibold hover:text-gold transition-colors bg-white/10 backdrop-blur-md px-4 py-2 rounded-full border border-white/20"
        >
          Se connecter
        </button>
      </nav>

      {/* Hero Section */}
      <section className="relative min-h-screen flex flex-col justify-center items-center text-center px-4 pt-20">
        {/* Background Gradients */}
        <div className="absolute top-[-20%] left-[-10%] w-[500px] h-[500px] bg-gold/10 rounded-full blur-[100px] pointer-events-none" />
        <div className="absolute bottom-[-10%] right-[-5%] w-[400px] h-[400px] bg-purple-500/5 rounded-full blur-[100px] pointer-events-none" />

        <motion.div 
          initial="initial"
          animate="animate"
          variants={staggerContainer}
          className="max-w-4xl mx-auto z-10"
        >
          <motion.div variants={fadeInUp} className="mb-6 inline-flex items-center gap-2 px-3 py-1 rounded-full bg-gold/10 border border-gold/20 text-gold text-xs font-bold uppercase tracking-wider">
            <SparklesIcon />
            <span>Assistant Mode IA &middot; Beta Privée</span>
          </motion.div>
          
          <motion.h1 variants={fadeInUp} className="text-5xl md:text-7xl lg:text-8xl font-serif font-bold mb-8 leading-tight">
            Votre style, <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-gold to-yellow-600">
              réinventé par l'IA.
            </span>
          </motion.h1>
          
          <motion.p variants={fadeInUp} className="text-lg md:text-xl text-gray-500 dark:text-gray-400 mb-10 max-w-2xl mx-auto leading-relaxed">
            Fini le "Je n'ai rien à me mettre". <strong>Dress Me Up!</strong> analyse votre garde-robe, crée des tenues sur-mesure et prépare vos valises en un clic.
          </motion.p>
          
          <motion.div variants={fadeInUp} className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <button
              onClick={onGetStarted}
              className="group relative px-8 py-4 bg-gold text-onyx text-lg font-bold rounded-full overflow-hidden shadow-lg shadow-gold/20 hover:shadow-gold/40 transition-all hover:scale-105 active:scale-95"
            >
              <span className="relative z-10 flex items-center gap-2">
                Commencer l'expérience <ArrowIcon />
              </span>
              <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300" />
            </button>
          </motion.div>
        </motion.div>

        {/* Floating Mockup Elements (Decoratif) */}
        <motion.div 
          initial={{ opacity: 0, x: -50 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.8, duration: 1 }}
          className="absolute left-4 md:left-20 bottom-20 hidden lg:block"
        >
          <div className="bg-white dark:bg-raisin-black p-4 rounded-xl shadow-2xl border border-white/10 rotate-[-6deg] max-w-xs backdrop-blur-lg bg-opacity-90 dark:bg-opacity-90">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-8 h-8 bg-gold rounded-full flex items-center justify-center text-onyx">🤖</div>
              <div className="text-xs font-medium">Suggestion IA</div>
            </div>
            <p className="text-sm font-serif italic">"Pour ce soir à Rome, opte pour la chemise en lin blanc et le pantalon beige."</p>
          </div>
        </motion.div>

        <motion.div 
           initial={{ opacity: 0, x: 50 }}
           animate={{ opacity: 1, x: 0 }}
           transition={{ delay: 1, duration: 1 }}
           className="absolute right-4 md:right-20 top-40 hidden lg:block"
        >
          <div className="bg-white dark:bg-raisin-black p-3 rounded-xl shadow-2xl border border-white/10 rotate-[6deg] backdrop-blur-lg bg-opacity-90 dark:bg-opacity-90">
             <div className="w-32 h-32 bg-gray-200 dark:bg-gray-700 rounded-lg mb-2 flex items-center justify-center text-4xl">🧥</div>
             <div className="flex justify-between items-center">
               <span className="text-xs font-bold text-gray-500">Manteau Laine</span>
               <div className="w-2 h-2 rounded-full bg-green-500"></div>
             </div>
          </div>
        </motion.div>

        {/* Scroll Indicator */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1, y: [0, 10, 0] }}
          transition={{
            opacity: { delay: 1.5, duration: 0.6 },
            y: { repeat: Infinity, duration: 1.5, ease: "easeInOut" }
          }}
          className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 cursor-pointer"
          onClick={() => {
            window.scrollTo({ top: window.innerHeight, behavior: 'smooth' });
          }}
        >
          <span className="text-xs text-gray-400 font-medium uppercase tracking-wider">Découvrir</span>
          <div className="text-gold">
            <ChevronDownIcon />
          </div>
        </motion.div>
      </section>

      {/* Features Section */}
      <section className="py-24 px-4 bg-white/50 dark:bg-black/20 backdrop-blur-sm">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-serif font-bold mb-4">Votre dressing intelligent</h2>
            <p className="text-gray-500 max-w-xl mx-auto">
              Une suite d'outils puissants pour digitaliser et optimiser votre style au quotidien.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <FeatureCard 
              icon={<CameraIcon />}
              title="Digitalisez en un éclair"
              description="Prenez une photo, l'IA détecte automatiquement la catégorie, la couleur et la matière. Votre garde-robe dans votre poche."
            />
            <FeatureCard 
              icon={<SparklesIcon />}
              title="Styliste Personnel"
              description="Une réunion ? Un date ? Demandez à l'IA de créer la tenue parfaite en fonction de la météo et de l'occasion."
            />
            <FeatureCard 
              icon={<SuitcaseIcon />}
              title="Valise Optimisée"
              description="Partez l'esprit léger. Générez une liste de vêtements optimisée pour la durée et la destination de votre voyage."
            />
          </div>
        </div>
      </section>

      {/* Footer / Final CTA */}
      <section className="py-20 px-4 text-center">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-3xl md:text-5xl font-serif font-bold mb-8">
            Prêt à upgrader votre style ?
          </h2>
          <button 
            onClick={onGetStarted}
            className="px-10 py-4 bg-raisin-black dark:bg-snow text-snow dark:text-onyx font-bold rounded-full text-lg hover:opacity-90 transition-opacity transform hover:scale-105 duration-200"
          >
            Rejoindre maintenant
          </button>
          <p className="mt-8 text-sm text-gray-500">© 2025 Dress Me Up! - Fait avec ❤️ & IA.</p>
        </div>
      </section>
    </div>
  );
};

const FeatureCard: React.FC<{ icon: React.ReactNode, title: string, description: string }> = ({ icon, title, description }) => (
  <motion.div 
    whileHover={{ y: -5 }}
    className="p-8 rounded-2xl bg-white dark:bg-raisin-black border border-black/5 dark:border-white/5 shadow-xl shadow-black/5 dark:shadow-black/20"
  >
    <div className="w-12 h-12 bg-gold/10 text-gold rounded-xl flex items-center justify-center mb-6">
      <div className="w-6 h-6">{icon}</div>
    </div>
    <h3 className="text-xl font-bold mb-3">{title}</h3>
    <p className="text-gray-500 dark:text-gray-400 leading-relaxed">
      {description}
    </p>
  </motion.div>
);

export default LandingPage;
