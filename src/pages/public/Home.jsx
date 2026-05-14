import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Sparkles, ArrowRight, ShieldCheck, Stars, Users, Mail, Phone, Globe, Music, Camera, Heart } from 'lucide-react';
import './Home.css';
import { validateSchoolCode } from '../../api/firebase';

// Animated counter hook
const useCounter = (target, duration = 2000, startCounting = false) => {
  const [count, setCount] = useState(0);
  useEffect(() => {
    if (!startCounting) return;
    let startTime = null;
    const step = (timestamp) => {
      if (!startTime) startTime = timestamp;
      const progress = Math.min((timestamp - startTime) / duration, 1);
      setCount(Math.floor(progress * target));
      if (progress < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }, [target, duration, startCounting]);
  return count;
};

// Scroll-triggered animation variants
const fadeUp = {
  hidden: { opacity: 0, y: 60 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.8, ease: [0.4, 0, 0.2, 1] } }
};
const fadeLeft = {
  hidden: { opacity: 0, x: -60 },
  visible: { opacity: 1, x: 0, transition: { duration: 0.8, ease: [0.4, 0, 0.2, 1] } }
};
const fadeRight = {
  hidden: { opacity: 0, x: 60 },
  visible: { opacity: 1, x: 0, transition: { duration: 0.8, ease: [0.4, 0, 0.2, 1] } }
};
const staggerContainer = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.18 } }
};
const staggerItem = {
  hidden: { opacity: 0, y: 40 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.7, ease: [0.4, 0, 0.2, 1] } }
};

const Home = () => {
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [statsVisible, setStatsVisible] = useState(false);
  const navigate = useNavigate();
  const heroRef = useRef(null);
  const statsRef = useRef(null);

  // Animated counters
  const count1 = useCounter(5000, 2200, statsVisible);
  const count2 = useCounter(15, 1800, statsVisible);
  const count3 = useCounter(10, 1500, statsVisible);

  useEffect(() => {
    if (!statsRef.current) return;
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) setStatsVisible(true); },
      { threshold: 0.3 }
    );
    observer.observe(statsRef.current);
    return () => observer.disconnect();
  }, []);

  const handleValidateCode = async (e) => {
    e.preventDefault();
    if (code.length !== 8) {
      alert("O código deve ter 8 caracteres.");
      return;
    }
    setLoading(true);
    const schoolId = await validateSchoolCode(code);
    setLoading(false);
    if (schoolId) {
      navigate(`/setup-account/${code.toUpperCase()}`);
    } else {
      alert("Código de escola inválido ou expirado.");
    }
  };

  return (
    <div className="home-page">
      {/* Hero Section */}
      <section className="hero" ref={heroRef}>
        <div className="hero-bg">
          <div className="orb orb-1"></div>
          <div className="orb orb-2"></div>
          <div className="orb orb-3"></div>
          {/* CSS-only floating particles */}
          {[...Array(20)].map((_, i) => (
            <div key={i} className="hero-particle" style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              width: `${2 + Math.random() * 4}px`,
              height: `${2 + Math.random() * 4}px`,
              animationDelay: `${Math.random() * 8}s`,
              animationDuration: `${6 + Math.random() * 10}s`,
              opacity: 0.2 + Math.random() * 0.5
            }} />
          ))}
        </div>

        <motion.div className="container hero-content">
          <motion.div
            initial="hidden"
            animate="visible"
            variants={staggerContainer}
            className="hero-text"
          >
            <motion.div variants={staggerItem} className="badge-premium pulse-glow">
              <Sparkles size={14} className="text-gold" />
              <span>Baile de Finalistas 2026</span>
            </motion.div>

            <motion.h1 variants={staggerItem}>
              <span>A Noite que Ficará</span>{' '}
              <span className="text-gold">Para a História</span>
            </motion.h1>

            <motion.p variants={staggerItem}>
              A LastDance cria experiências memoráveis e exclusivas para o teu final de ciclo.
              Vive o momento que sempre sonhaste com a sofisticação que mereces.
            </motion.p>

            <motion.div variants={staggerItem} className="hero-actions">
              <motion.a
                href="#inscricao"
                className="btn-premium"
                whileHover={{ scale: 1.05, y: -3 }}
                whileTap={{ scale: 0.97 }}
              >
                Garantir o meu lugar <ArrowRight size={18} />
              </motion.a>
              <motion.a
                href="#quem-somos"
                className="btn-outline animated-underline"
                whileHover={{ scale: 1.03 }}
              >
                Saber mais
              </motion.a>
            </motion.div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.7, rotate: -8 }}
            animate={{ opacity: 1, scale: 1, rotate: 0 }}
            transition={{ duration: 1.1, delay: 0.4, ease: [0.4, 0, 0.2, 1] }}
            className="hero-image"
          >
            <motion.div
              className="glass-card floating gradient-border"
              whileHover={{ scale: 1.04, rotate: 1 }}
            >
              <motion.div
                className="card-stat"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.9 }}
              >
                <Users className="text-gold" />
                <div>
                  <h4>+5000</h4>
                  <p>Alunos Inscritos</p>
                </div>
              </motion.div>
              <div className="card-divider"></div>
              <motion.div
                className="card-stat"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 1.1 }}
              >
                <Stars className="text-gold" />
                <div>
                  <h4>15</h4>
                  <p>Escolas Parceiras</p>
                </div>
              </motion.div>
            </motion.div>
          </motion.div>
        </motion.div>

        {/* Scroll indicator */}
        <motion.div
          className="scroll-indicator"
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 2, repeat: Infinity, repeatType: 'reverse', duration: 1 }}
        >
          <div className="scroll-dot" />
        </motion.div>
      </section>

      {/* Features Section */}
      <section className="features section-padding">
        <div className="container">
          <motion.div
            className="section-header"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.3 }}
            variants={fadeUp}
          >
            <h2 className="shimmer-text">Porquê a LastDance?</h2>
            <p>Trabalhamos com os melhores parceiros para garantir uma noite inesquecível.</p>
          </motion.div>

          <motion.div
            className="features-grid"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.1 }}
            variants={staggerContainer}
          >
            {[
              { icon: <ShieldCheck size={40} className="text-gold" />, title: 'Segurança Total', desc: 'Controlo de acessos rigoroso e equipas de apoio permanentes durante todo o evento.' },
              { icon: <Sparkles size={40} className="text-gold" />, title: 'Premium Decor', desc: 'Ambientes temáticos e decorações luxuosas pensadas ao detalhe para cada escola.' },
              { icon: <Music size={40} className="text-gold" />, title: 'Artistas Exclusivos', desc: 'Line-up de DJs e artistas nacionais para garantir que a pista nunca arrefece.' },
              { icon: <Camera size={40} className="text-gold" />, title: 'Fotografia Pro', desc: 'Fotógrafos e videógrafos profissionais para imortalizares cada momento desta noite.' },
              { icon: <Heart size={40} className="text-gold" />, title: 'Experiência Única', desc: 'Cada detalhe é pensado para que esta noite seja verdadeiramente inesquecível.' },
              { icon: <Stars size={40} className="text-gold" />, title: 'Locais Exclusivos', desc: 'Espaços premium cuidadosamente selecionados nos melhores venues do país.' },
            ].map((f, i) => (
              <motion.div
                key={i}
                variants={staggerItem}
                className="feature-item glass-card hover-lift"
                whileHover={{
                  y: -10,
                  borderColor: 'rgba(255, 140, 0, 0.4)',
                  boxShadow: '0 25px 50px rgba(0,0,0,0.4)',
                  transition: { duration: 0.3 }
                }}
              >
                <motion.div
                  whileHover={{ rotate: 10, scale: 1.2 }}
                  transition={{ type: 'spring', stiffness: 300 }}
                >
                  {f.icon}
                </motion.div>
                <h3>{f.title}</h3>
                <p>{f.desc}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Marquee Strip */}
      <div className="marquee-strip" aria-hidden="true">
        <div className="marquee-track">
          {[...Array(3)].map((_, rep) => (
            <span key={rep} className="marquee-inner">
              {['✦ Elegância', '✦ Luxo', '✦ Memórias', '✦ Glamour', '✦ Última Dança', '✦ Celebração', '✦ Inesquecível', '✦ Premium', '✦ Finalistas 2026'].map((word, i) => (
                <span key={i} className="marquee-word">{word}</span>
              ))}
            </span>
          ))}
        </div>
      </div>

      {/* Night Timeline Section */}
      <section className="timeline-section section-padding">
        <div className="container">
          <motion.div
            className="section-header"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.3 }}
            variants={fadeUp}
          >
            <h2 className="text-gold">A Noite em Revista</h2>
            <p>Cada momento desta noite foi pensado ao detalhe para superar todas as tuas expectativas.</p>
          </motion.div>

          <div className="timeline">
            {[
              { time: '20:00', emoji: '🚪', title: 'Red Carpet & Recepção', desc: 'Chegada VIP com fotógrafos profissionais e cocktail de boas-vindas.' },
              { time: '21:00', emoji: '🍽️', title: 'Jantar de Gala', desc: 'Menu de autor servido em ambiente requintado com música ao vivo.' },
              { time: '22:30', emoji: '🎤', title: 'Cerimónia & Discursos', desc: 'Momento especial de celebração com diplomas e prémios simbólicos.' },
              { time: '23:00', emoji: '🎵', title: 'Show & Dança', desc: 'DJ e artistas convidados para uma noite de festa até ao amanhecer.' },
              { time: '02:00', emoji: '✨', title: 'Afterparty Exclusivo', desc: 'Espaço privado reservado para os finalistas prolongarem a magia.' },
            ].map((item, i) => (
              <motion.div
                key={i}
                className={`timeline-item ${i % 2 === 0 ? 'left' : 'right'}`}
                initial={{ opacity: 0, x: i % 2 === 0 ? -80 : 80 }}
                whileInView={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.8, delay: i * 0.1, ease: [0.4, 0, 0.2, 1] }}
                viewport={{ once: true, amount: 0.3 }}
              >
                <div className="timeline-content glass-card">
                  <div className="timeline-emoji">{item.emoji}</div>
                  <div className="timeline-time">{item.time}</div>
                  <h3>{item.title}</h3>
                  <p>{item.desc}</p>
                </div>
                <div className="timeline-dot">
                  <motion.div
                    className="dot-inner"
                    initial={{ scale: 0 }}
                    whileInView={{ scale: 1 }}
                    transition={{ duration: 0.4, delay: i * 0.1 + 0.3 }}
                    viewport={{ once: true }}
                  />
                </div>
              </motion.div>
            ))}
            <div className="timeline-line" />
          </div>
        </div>
      </section>

      {/* Floating Confetti Decorators */}
      <div className="confetti-section" aria-hidden="true">
        {['💎', '🌹', '🥂', '⭐', '🎭', '💫', '🎶', '✨', '👑', '🌟'].map((em, i) => (
          <motion.span
            key={i}
            className="confetti-item"
            initial={{ opacity: 0, y: 60, rotate: 0 }}
            whileInView={{ opacity: 1, y: 0, rotate: (i % 2 === 0 ? 15 : -15) }}
            transition={{ duration: 0.8, delay: i * 0.07, ease: 'backOut' }}
            viewport={{ once: true, amount: 0.5 }}
            whileHover={{ scale: 1.5, rotate: 0 }}
            style={{ left: `${5 + i * 9.5}%` }}
          >
            {em}
          </motion.span>
        ))}
      </div>

      {/* Registration Section */}
      <section id="inscricao" className="registration-section section-padding">
        <div className="container">
          <motion.div
            className="glass-card registration-cta gradient-border"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.3 }}
            variants={fadeUp}
          >
            <motion.div className="section-header" variants={staggerContainer} initial="hidden" whileInView="visible" viewport={{ once: true }}>
              <motion.h2 variants={staggerItem} className="text-gold">
                Pronto para a Noite da Tua Vida?
              </motion.h2>
              <motion.p variants={staggerItem}>
                Introduz o código que a tua escola te forneceu para iniciares o processo de inscrição.
              </motion.p>
            </motion.div>

            <form onSubmit={handleValidateCode} className="code-form central">
              <motion.div
                className="input-group"
                whileFocusWithin={{
                  borderColor: 'var(--color-gold)',
                  boxShadow: '0 0 30px rgba(255,140,0,0.2)'
                }}
              >
                <input
                  type="text"
                  placeholder="CÓDIGO DE ESCOLA"
                  maxLength={8}
                  value={code}
                  onChange={(e) => setCode(e.target.value.toUpperCase())}
                  autoComplete="off"
                />
                <motion.button
                  type="submit"
                  disabled={loading}
                  className="btn-premium"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.97 }}
                >
                  {loading ? 'A Validar...' : 'Validar Código'}
                  {!loading && <ArrowRight size={18} />}
                </motion.button>
              </motion.div>
              <span className="helper-text">Precisas de um código de 8 caracteres (ex: A8B29C1F)</span>
            </form>
          </motion.div>
        </div>
      </section>

      {/* Who We Are Section */}
      <section id="quem-somos" className="about-section section-padding" ref={statsRef}>
        <div className="container">
          <div className="about-grid">
            <motion.div
              className="about-text"
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, amount: 0.3 }}
              variants={fadeLeft}
            >
              <span className="badge-premium">A Nossa História</span>
              <h2 className="text-gold">Criamos Memórias <br /> que Duram uma Vida</h2>
              <p>A LastDance é líder nacional na organização de Bailes de Finalistas. A nossa missão é transformar o final do percurso secundário numa experiência inesquecível, aliando sofisticação, segurança e diversão.</p>
              <p>Com mais de uma década de experiência, trabalhamos com os locais mais exclusivos e os melhores fornecedores para garantir que cada detalhe do teu baile seja perfeito.</p>
            </motion.div>

            <motion.div
              className="about-stats glass-card"
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, amount: 0.3 }}
              variants={fadeRight}
            >
              {[
                { value: count1, suffix: '+', label: 'Alunos Felizes' },
                { value: count2, suffix: '', label: 'Escolas Parceiras' },
                { value: count3, suffix: '+', label: 'Anos de Experiência' },
                { value: 100, suffix: '+', label: 'Eventos Realizados' },
              ].map((stat, i) => (
                <motion.div
                  key={i}
                  className="stat-item"
                  whileHover={{ scale: 1.05, y: -5 }}
                  transition={{ type: 'spring', stiffness: 300 }}
                >
                  <h3>
                    <AnimatePresence>
                      {statsVisible && (
                        <motion.span
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: i * 0.15 }}
                        >
                          {stat.value}{stat.suffix}
                        </motion.span>
                      )}
                    </AnimatePresence>
                  </h3>
                  <p>{stat.label}</p>
                </motion.div>
              ))}
            </motion.div>
          </div>
        </div>
      </section>

      {/* Contacts Section */}
      <section id="contactos" className="contact-section section-padding">
        <div className="container">
          <motion.div
            className="glass-card contact-wrapper"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.2 }}
            variants={fadeUp}
          >
            <div className="section-header">
              <h2 className="text-gold">Fala Connosco</h2>
              <p>Estamos aqui para ajudar a planear a melhor noite da tua vida.</p>
            </div>

            <div className="contact-grid">
              <motion.div
                className="contact-info"
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
                variants={staggerContainer}
              >
                {[
                  { icon: <Mail className="text-gold" />, title: 'Email', val: 'geral@lastdance.pt' },
                  { icon: <Phone className="text-gold" />, title: 'Telefone', val: '+351 210 000 000' },
                  { icon: <Globe className="text-gold" />, title: 'Sede', val: 'Avenida da Liberdade, Lisboa' },
                ].map((item, i) => (
                  <motion.div
                    key={i}
                    className="info-item hover-lift"
                    variants={staggerItem}
                    whileHover={{ x: 8 }}
                  >
                    {item.icon}
                    <div>
                      <h4>{item.title}</h4>
                      <p>{item.val}</p>
                    </div>
                  </motion.div>
                ))}
              </motion.div>

              <motion.form
                className="contact-form"
                onSubmit={(e) => e.preventDefault()}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
                variants={staggerContainer}
              >
                {['Teu Nome', 'Teu Email'].map((ph, i) => (
                  <motion.div key={i} className="input-group-simple" variants={staggerItem}>
                    <input type={i === 1 ? 'email' : 'text'} placeholder={ph} required />
                  </motion.div>
                ))}
                <motion.div className="input-group-simple" variants={staggerItem}>
                  <textarea placeholder="Como podemos ajudar?" rows={4} required />
                </motion.div>
                <motion.button
                  type="submit"
                  className="btn-premium"
                  variants={staggerItem}
                  whileHover={{ scale: 1.04, y: -3 }}
                  whileTap={{ scale: 0.97 }}
                >
                  Enviar Mensagem
                </motion.button>
              </motion.form>
            </div>
          </motion.div>
        </div>
      </section>
    </div>
  );
};

export default Home;
