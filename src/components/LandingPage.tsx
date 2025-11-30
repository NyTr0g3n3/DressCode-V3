import React, { useState, useEffect } from 'react';
import Auth from './Auth.tsx';

interface LandingPageProps {
  onShowAuth: () => void;
}

const LandingPage: React.FC<LandingPageProps> = ({ onShowAuth }) => {
  const [isVisible, setIsVisible] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);

  useEffect(() => {
    setIsVisible(true);
  }, []);

  const features = [
    {
      icon: '📸',
      title: 'Analyse IA instantanée',
      description: 'Prenez en photo vos vêtements. Notre IA identifie automatiquement le type, la couleur et la matière.',
      gradient: 'from-purple-500 to-pink-500'
    },
    {
      icon: '✨',
      title: 'Tenues personnalisées',
      description: 'Décrivez une occasion, l\'IA crée des combinaisons parfaites adaptées à la météo locale.',
      gradient: 'from-gold to-gold-dark'
    },
    {
      icon: '🧳',
      title: 'Valise intelligente',
      description: 'Partez en voyage ? L\'IA optimise votre valise selon la durée, la destination et la météo.',
      gradient: 'from-blue-500 to-cyan-500'
    }
  ];

  const testimonials = [
    {
      name: 'Marie L.',
      role: 'Entrepreneuse',
      avatar: '👩‍💼',
      quote: 'Je gagne 15 minutes chaque matin. Plus besoin de réfléchir à quoi porter !',
      rating: 5
    },
    {
      name: 'Thomas D.',
      role: 'Consultant',
      avatar: '👨‍💻',
      quote: 'Le planificateur de valise est génial. Fini le stress avant les voyages d\'affaires.',
      rating: 5
    },
    {
      name: 'Sophie M.',
      role: 'Étudiante',
      avatar: '👩‍🎓',
      quote: 'Enfin une app qui comprend mon style ! Les suggestions sont toujours pertinentes.',
      rating: 5
    }
  ];

  const faqs = [
    {
      question: 'Comment fonctionne l\'analyse IA ?',
      answer: 'Prenez simplement une photo de votre vêtement. Notre IA analyse instantanément le type (t-shirt, jean...), la couleur dominante et la matière pour l\'ajouter à votre garde-robe virtuelle.'
    },
    {
      question: 'Mes données sont-elles sécurisées ?',
      answer: 'Absolument. Vos photos et données sont stockées de manière sécurisée sur Firebase et ne sont jamais partagées. Vous pouvez supprimer votre compte à tout moment.'
    },
    {
      question: 'L\'app est-elle gratuite ?',
      answer: 'La beta est actuellement gratuite pour les premiers utilisateurs. Un modèle d\'abonnement sera introduit ultérieurement avec une offre spéciale pour les beta testeurs.'
    },
    {
      question: 'Sur quels appareils puis-je utiliser Dress Me Up ?',
      answer: 'L\'app fonctionne sur tous les navigateurs modernes (mobile et desktop). Une version iOS et Android est prévue pour bientôt.'
    }
  ];

  const [openFaq, setOpenFaq] = useState<number | null>(null);

  return (
    <div className="min-h-screen bg-onyx text-snow overflow-x-hidden">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-onyx/80 backdrop-blur-lg border-b border-white/10">
        <div className="container mx-auto px-4 lg:px-8 h-16 flex justify-between items-center">
          <h1 className="text-2xl font-serif font-bold">
            Dress <span className="text-gold">Me</span> Up!
          </h1>
          <button
            onClick={() => setShowAuthModal(true)}
            className="px-5 py-2 bg-gold text-onyx font-bold rounded-full hover:bg-gold-dark transition-all hover:scale-105"
          >
            Connexion
          </button>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="min-h-screen flex items-center justify-center relative pt-16 overflow-hidden">
        {/* Background gradient */}
        <div className="absolute inset-0 bg-gradient-to-br from-gold/20 via-transparent to-purple-500/20 opacity-50"></div>
        
        {/* Animated circles */}
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-gold/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }}></div>

        <div className="container mx-auto px-4 lg:px-8 text-center relative z-10">
          <div className={`transition-all duration-1000 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
            
            {/* Badge */}
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/10 backdrop-blur-sm rounded-full mb-8 border border-white/20">
              <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></span>
              <span className="text-sm font-medium">Beta privée — Places limitées</span>
            </div>

            {/* Headline */}
            <h1 className="text-5xl md:text-7xl font-serif font-bold mb-6 leading-tight">
              Votre <span className="text-gold">styliste IA</span>
              <br />personnel
            </h1>

            {/* Subheadline */}
            <p className="text-xl md:text-2xl text-gray-400 max-w-2xl mx-auto mb-10">
              Analysez vos vêtements, générez des tenues parfaites et préparez vos valises — le tout grâce à l'intelligence artificielle.
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <button
                onClick={() => setShowAuthModal(true)}
                className="group px-8 py-4 bg-gradient-to-r from-gold to-gold-dark text-onyx font-bold rounded-full hover:shadow-2xl hover:shadow-gold/30 transition-all hover:scale-105 text-lg flex items-center gap-2"
              >
                Rejoindre la beta gratuite
                <svg className="w-5 h-5 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                </svg>
              </button>
              
                href="#features"
                className="px-8 py-4 border-2 border-white/30 text-white font-bold rounded-full hover:bg-white/10 transition-all text-lg"
              >
                Découvrir
              </a>
            </div>

            {/* Social proof mini */}
            <div className="mt-12 flex items-center justify-center gap-4">
              <div className="flex -space-x-3">
                {['👩‍🦰', '👨‍🦱', '👩‍🦳', '👨'].map((emoji, i) => (
                  <div key={i} className="w-10 h-10 bg-gray-800 rounded-full border-2 border-onyx flex items-center justify-center text-lg">
                    {emoji}
                  </div>
                ))}
              </div>
              <p className="text-sm text-gray-400">
                <span className="text-white font-semibold">+50</span> beta testeurs conquis
              </p>
            </div>
          </div>
        </div>

        {/* Scroll indicator */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 animate-bounce">
          <svg className="w-6 h-6 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
          </svg>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-24 bg-raisin-black">
        <div className="container mx-auto px-4 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-serif font-bold mb-4">
              Tout ce dont vous avez <span className="text-gold">besoin</span>
            </h2>
            <p className="text-xl text-gray-400 max-w-2xl mx-auto">
              Une suite d'outils alimentés par l'IA pour révolutionner votre façon de vous habiller.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <div
                key={index}
                className="group p-8 bg-onyx rounded-2xl border border-white/10 hover:border-gold/50 transition-all duration-300 hover:-translate-y-2 hover:shadow-2xl hover:shadow-gold/10"
              >
                <div className={`w-16 h-16 bg-gradient-to-br ${feature.gradient} rounded-2xl flex items-center justify-center text-3xl mb-6 group-hover:scale-110 transition-transform`}>
                  {feature.icon}
                </div>
                <h3 className="text-2xl font-bold mb-3">{feature.title}</h3>
                <p className="text-gray-400 leading-relaxed">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Demo/Screenshot Section */}
      <section className="py-24 bg-onyx relative overflow-hidden">
        {/* Background pattern */}
        <div className="absolute inset-0 opacity-5">
          <div className="absolute inset-0" style={{ 
            backgroundImage: 'radial-gradient(circle at 1px 1px, white 1px, transparent 0)',
            backgroundSize: '40px 40px'
          }}></div>
        </div>

        <div className="container mx-auto px-4 lg:px-8 relative z-10">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-serif font-bold mb-4">
              Comment ça <span className="text-gold">marche</span> ?
            </h2>
            <p className="text-xl text-gray-400 max-w-2xl mx-auto">
              3 étapes simples pour transformer votre garde-robe.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 md:gap-4">
            {[
              { step: '1', title: 'Photographiez', desc: 'Prenez en photo vos vêtements. L\'IA les analyse et les classe automatiquement.', icon: '📷' },
              { step: '2', title: 'Demandez', desc: 'Décrivez votre besoin : "Tenue pour un rendez-vous" ou "Valise pour Rome 5 jours".', icon: '💬' },
              { step: '3', title: 'Recevez', desc: 'L\'IA génère des suggestions personnalisées basées sur votre garde-robe et la météo.', icon: '✨' }
            ].map((item, index) => (
              <div key={index} className="relative">
                {index < 2 && (
                  <div className="hidden md:block absolute top-1/2 -right-2 w-4 h-4 border-t-2 border-r-2 border-gold/50 transform rotate-45 translate-x-1/2"></div>
                )}
                <div className="text-center p-8">
                  <div className="w-20 h-20 mx-auto mb-6 bg-gradient-to-br from-gold/20 to-gold/5 rounded-full flex items-center justify-center text-4xl border border-gold/30">
                    {item.icon}
                  </div>
                  <div className="inline-flex items-center justify-center w-8 h-8 bg-gold text-onyx font-bold rounded-full mb-4">
                    {item.step}
                  </div>
                  <h3 className="text-xl font-bold mb-2">{item.title}</h3>
                  <p className="text-gray-400">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>

          {/* App mockup placeholder */}
          <div className="mt-16 flex justify-center">
            <div className="relative">
              <div className="w-72 h-[500px] bg-gradient-to-b from-raisin-black to-onyx rounded-[3rem] border-4 border-gray-700 shadow-2xl p-3">
                <div className="w-full h-full bg-onyx rounded-[2.5rem] overflow-hidden flex flex-col">
                  {/* Phone status bar */}
                  <div className="h-8 bg-raisin-black flex items-center justify-center">
                    <div className="w-20 h-5 bg-gray-800 rounded-full"></div>
                  </div>
                  {/* App content mockup */}
                  <div className="flex-1 p-4 flex flex-col">
                    <div className="text-center mb-4">
                      <p className="text-sm text-gold font-serif font-bold">Dress Me Up!</p>
                    </div>
                    <div className="flex-1 flex flex-col gap-3">
                      <div className="h-24 bg-gradient-to-r from-gold/20 to-purple-500/20 rounded-xl animate-pulse"></div>
                      <div className="grid grid-cols-3 gap-2">
                        {[1,2,3,4,5,6].map(i => (
                          <div key={i} className="aspect-square bg-gray-800 rounded-lg"></div>
                        ))}
                      </div>
                      <div className="h-12 bg-gold/20 rounded-xl"></div>
                    </div>
                  </div>
                </div>
              </div>
              {/* Floating elements */}
              <div className="absolute -top-4 -right-8 px-4 py-2 bg-green-500 text-white text-sm font-bold rounded-full shadow-lg animate-bounce">
                +12 tenues générées
              </div>
              <div className="absolute -bottom-4 -left-8 px-4 py-2 bg-purple-500 text-white text-sm font-bold rounded-full shadow-lg">
                Météo: 22°C ☀️
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="py-24 bg-raisin-black">
        <div className="container mx-auto px-4 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-serif font-bold mb-4">
              Ils adorent <span className="text-gold">Dress Me Up</span>
            </h2>
            <p className="text-xl text-gray-400 max-w-2xl mx-auto">
              Découvrez ce que nos beta testeurs en pensent.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {testimonials.map((testimonial, index) => (
              <div
                key={index}
                className="p-8 bg-onyx rounded-2xl border border-white/10 hover:border-gold/30 transition-all"
              >
                <div className="flex items-center gap-1 mb-4">
                  {[...Array(testimonial.rating)].map((_, i) => (
                    <span key={i} className="text-gold">★</span>
                  ))}
                </div>
                <p className="text-lg mb-6 text-gray-300 italic">"{testimonial.quote}"</p>
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-gray-800 rounded-full flex items-center justify-center text-2xl">
                    {testimonial.avatar}
                  </div>
                  <div>
                    <p className="font-bold">{testimonial.name}</p>
                    <p className="text-sm text-gray-500">{testimonial.role}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-24 bg-onyx">
        <div className="container mx-auto px-4 lg:px-8 max-w-3xl">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-serif font-bold mb-4">
              Questions <span className="text-gold">fréquentes</span>
            </h2>
          </div>

          <div className="space-y-4">
            {faqs.map((faq, index) => (
              <div
                key={index}
                className="border border-white/10 rounded-xl overflow-hidden"
              >
                <button
                  onClick={() => setOpenFaq(openFaq === index ? null : index)}
                  className="w-full p-6 text-left flex items-center justify-between hover:bg-white/5 transition-colors"
                >
                  <span className="font-semibold text-lg">{faq.question}</span>
                  <svg
                    className={`w-5 h-5 text-gold transition-transform ${openFaq === index ? 'rotate-180' : ''}`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
                {openFaq === index && (
                  <div className="px-6 pb-6 text-gray-400">
                    {faq.answer}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA Section */}
      <section className="py-24 bg-gradient-to-b from-raisin-black to-onyx relative overflow-hidden">
        {/* Background glow */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-[600px] h-[600px] bg-gold/10 rounded-full blur-3xl"></div>
        </div>

        <div className="container mx-auto px-4 lg:px-8 text-center relative z-10">
          <h2 className="text-4xl md:text-6xl font-serif font-bold mb-6">
            Prêt à révolutionner<br />votre <span className="text-gold">garde-robe</span> ?
          </h2>
          <p className="text-xl text-gray-400 max-w-2xl mx-auto mb-10">
            Rejoignez la beta gratuite et découvrez comment l'IA peut transformer votre quotidien.
          </p>
          <button
            onClick={() => setShowAuthModal(true)}
            className="group px-10 py-5 bg-gradient-to-r from-gold to-gold-dark text-onyx font-bold rounded-full hover:shadow-2xl hover:shadow-gold/30 transition-all hover:scale-105 text-xl flex items-center gap-3 mx-auto"
          >
            Commencer gratuitement
            <svg className="w-6 h-6 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
            </svg>
          </button>
          <p className="mt-6 text-sm text-gray-500">
            ✓ Gratuit pendant la beta &nbsp;&nbsp; ✓ Aucune carte requise &nbsp;&nbsp; ✓ Annulable à tout moment
          </p>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 bg-onyx border-t border-white/10">
        <div className="container mx-auto px-4 lg:px-8">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-gray-500">
              © 2024 Dress Me Up! — Tous droits réservés
            </p>
            <div className="flex gap-6 text-sm text-gray-500">
              <a href="#" className="hover:text-gold transition-colors">Confidentialité</a>
              <a href="#" className="hover:text-gold transition-colors">Conditions</a>
              <a href="#" className="hover:text-gold transition-colors">Contact</a>
            </div>
          </div>
        </div>
      </footer>

      {/* Auth Modal */}
      {showAuthModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-[100] p-4">
          <div className="relative w-full max-w-md">
            <button
              onClick={() => setShowAuthModal(false)}
              className="absolute -top-12 right-0 text-gray-400 hover:text-white transition-colors"
            >
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
            <Auth user={null} />
          </div>
        </div>
      )}
    </div>
  );
};

export default LandingPage;
