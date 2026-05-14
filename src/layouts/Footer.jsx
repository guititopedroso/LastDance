import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Globe, Users, MessageSquare, MapPin, Mail, Phone, ArrowUp } from 'lucide-react';
import './Footer.css';

const stagger = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.12, delayChildren: 0.1 } }
};
const col = {
  hidden: { opacity: 0, y: 40 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.7, ease: [0.4, 0, 0.2, 1] } }
};

const Footer = () => {
  const scrollToTop = () => window.scrollTo({ top: 0, behavior: 'smooth' });

  return (
    <motion.footer
      className="main-footer"
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, amount: 0.1 }}
      variants={stagger}
    >
      <div className="container footer-grid">
        {/* Brand Column */}
        <motion.div className="footer-brand" variants={col}>
          <Link to="/" className="footer-logo">
            <img src="/logo_transparent.png" alt="Last Dance" className="footer-logo-img" />
          </Link>
          <p>Transformamos o teu final de ciclo numa celebração inesquecível com sofisticação, segurança e o melhor entretenimento.</p>
          <div className="social-links">
            {[Globe, Users, MessageSquare].map((Icon, i) => (
              <motion.a
                key={i}
                href="#"
                className="social-icon"
                whileHover={{ scale: 1.2, color: 'var(--color-accent)', y: -3 }}
                whileTap={{ scale: 0.9 }}
              >
                <Icon size={18} />
              </motion.a>
            ))}
          </div>
        </motion.div>

        {/* Links Column */}
        <motion.div className="footer-links" variants={col}>
          <h4>Navegação</h4>
          <ul>
            {[['Home','#'],['Quem Somos','#quem-somos'],['Inscrição','#inscricao'],['Contactos','#contactos']].map(([name,href]) => (
              <motion.li key={name} whileHover={{ x: 6 }} transition={{ type: 'spring', stiffness: 400 }}>
                <a href={href}>{name}</a>
              </motion.li>
            ))}
          </ul>
        </motion.div>

        {/* Legal Column */}
        <motion.div className="footer-links" variants={col}>
          <h4>Legal</h4>
          <ul>
            {[['Termos e Condições','/termos'],['Política de Privacidade','/privacidade'],['Política de Cookies','/cookies'],['Área de Cliente','/area-cliente']].map(([name,to]) => (
              <motion.li key={name} whileHover={{ x: 6 }} transition={{ type: 'spring', stiffness: 400 }}>
                <Link to={to}>{name}</Link>
              </motion.li>
            ))}
          </ul>
        </motion.div>

        {/* Contact/Location Column */}
        <motion.div className="footer-contact" variants={col}>
          <h4>Onde Estamos</h4>
          {[
            { Icon: MapPin,  text: 'Quinta das Pirâmides,\nQuinta do Conde, Setúbal' },
            { Icon: Mail,    text: 'geral@lastdance.pt' },
            { Icon: Phone,   text: '+351 969 037 376' },
          ].map(({ Icon, text }, i) => (
            <motion.div key={i} className="contact-item" whileHover={{ x: 4 }}>
              <Icon size={18} className="text-gold" />
              <p style={{ whiteSpace: 'pre-line' }}>{text}</p>
            </motion.div>
          ))}
        </motion.div>
      </div>

      <div className="footer-bottom">
        <div className="container bottom-content">
          <p>&copy; 2026 LastDance Eventos. Todos os direitos reservados. | Powered by <a href="https://azmar.pt" target="_blank" rel="noopener noreferrer" className="powered-by">Azmar</a></p>
          <motion.button
            className="back-to-top"
            onClick={scrollToTop}
            whileHover={{ scale: 1.08, y: -3, boxShadow: '0 10px 30px rgba(255,140,0,0.3)' }}
            whileTap={{ scale: 0.95 }}
          >
            Voltar ao topo <ArrowUp size={16} />
          </motion.button>
        </div>
      </div>
    </motion.footer>
  );
};

export default Footer;
