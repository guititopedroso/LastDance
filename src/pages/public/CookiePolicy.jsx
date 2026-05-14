import React from 'react';
import './LegalPage.css';

const CookiePolicy = () => {
  return (
    <div className="legal-page section-padding">
      <div className="container">
        <header className="legal-header">
          <span className="subtitle">Transparência & Segurança</span>
          <h1 className="text-gold">Política de Cookies</h1>
          <p className="last-updated">Última atualização: 13 de Maio de 2026</p>
        </header>

        <div className="legal-content glass-card">
          <section>
            <h2>O que são Cookies?</h2>
            <p>
              Os cookies são pequenos ficheiros de texto que são armazenados no seu computador ou dispositivo móvel através do navegador (browser), retendo apenas informação relacionada com as suas preferências, não incluindo, como tal, os seus dados pessoais.
            </p>
            <p>
              A colocação de cookies ajudará o website a reconhecer o seu dispositivo na próxima vez que o utilizador o visita.
            </p>
          </section>

          <section>
            <h2>Como utilizamos os Cookies?</h2>
            <p>
              Utilizamos cookies para garantir o funcionamento correto do nosso site, personalizar conteúdo e anúncios, fornecer funcionalidades de redes sociais e analisar o nosso tráfego.
            </p>
            <div className="cookie-types">
              <div className="cookie-type-item">
                <h3>Cookies Estritamente Necessários</h3>
                <p>Estes cookies são essenciais para lhe permitir navegar no website e utilizar as suas funcionalidades. Sem estes cookies, os serviços que solicitou não podem ser fornecidos.</p>
              </div>
              <div className="cookie-type-item">
                <h3>Cookies de Desempenho</h3>
                <p>Estes cookies recolhem informações sobre como os visitantes utilizam um website, por exemplo, quais as páginas que os visitantes acedem com mais frequência. Estes cookies não recolhem informações que identifiquem um visitante.</p>
              </div>
              <div className="cookie-type-item">
                <h3>Cookies de Funcionalidade</h3>
                <p>Estes cookies permitem que o website se lembre das escolhas que faz (como o seu nome de utilizador, idioma ou a região em que se encontra) e forneça funcionalidades melhoradas e mais pessoais.</p>
              </div>
            </div>
          </section>

          <section>
            <h2>Como pode gerir os Cookies?</h2>
            <p>
              Todos os browsers permitem ao utilizador aceitar, recusar ou apagar cookies, nomeadamente através da seleção das definições apropriadas no respetivo navegador. Pode configurar os cookies no menu "opções" ou "preferências" do seu browser.
            </p>
            <p>
              Note-se, no entanto, que, ao desativar cookies, pode impedir que alguns serviços da web funcionem corretamente, afetando, parcial ou totalmente, a navegação no website.
            </p>
          </section>

          <section>
            <h2>Mais informações</h2>
            <p>
              Se tiver alguma dúvida sobre a nossa Política de Cookies, por favor contacte-nos através do e-mail: <a href="mailto:geral@lastdance.pt">geral@lastdance.pt</a>.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
};

export default CookiePolicy;
