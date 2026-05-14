import React from 'react';
import './LegalPage.css';

const PrivacyPolicy = () => {
  return (
    <div className="legal-page section-padding">
      <div className="container">
        <header className="legal-header">
          <span className="subtitle">Privacidade & Confiança</span>
          <h1 className="text-gold">Política de Privacidade</h1>
          <p className="last-updated">Última atualização: 13 de Maio de 2026</p>
        </header>

        <div className="legal-content glass-card">
          <section>
            <h2>Introdução</h2>
            <p>
              A LastDance Eventos valoriza a privacidade dos seus utilizadores e compromete-se a proteger os seus dados pessoais. Esta política descreve como recolhemos, utilizamos e protegemos as suas informações.
            </p>
          </section>

          <section>
            <h2>Recolha de Informação</h2>
            <p>
              Recolhemos informações quando se regista no nosso site, faz um pedido de inscrição ou preenche um formulário. As informações recolhidas podem incluir o seu nome, e-mail, número de telefone e dados escolares.
            </p>
          </section>

          <section>
            <h2>Uso da Informação</h2>
            <p>
              Qualquer informação que recolhemos de si pode ser usada para:
            </p>
            <ul>
              <li>Personalizar a sua experiência;</li>
              <li>Melhorar o nosso website;</li>
              <li>Melhorar o serviço ao cliente;</li>
              <li>Processar transações;</li>
              <li>Enviar e-mails periódicos sobre o seu evento.</li>
            </ul>
          </section>

          <section>
            <h2>Proteção da Informação</h2>
            <p>
              Implementamos uma variedade de medidas de segurança para manter a segurança das suas informações pessoais. Utilizamos criptografia avançada para proteger dados sensíveis transmitidos online.
            </p>
          </section>

          <section>
            <h2>Divulgação a Terceiros</h2>
            <p>
              Não vendemos, comercializamos ou transferimos para terceiros as suas informações de identificação pessoal. Isso não inclui terceiros confiáveis que nos auxiliam na operação do nosso site ou na condução dos nossos negócios, desde que essas partes concordem em manter esta informação confidencial.
            </p>
          </section>

          <section>
            <h2>Consentimento</h2>
            <p>
              Ao utilizar o nosso site, concorda com a nossa política de privacidade.
            </p>
          </section>

          <section>
            <h2>Contacto</h2>
            <p>
              Se houver alguma dúvida sobre esta política de privacidade, pode contactar-nos através do e-mail: <a href="mailto:geral@lastdance.pt">geral@lastdance.pt</a>.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
};

export default PrivacyPolicy;
