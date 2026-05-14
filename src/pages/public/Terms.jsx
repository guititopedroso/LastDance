import React from 'react';
import './LegalPage.css';

const Terms = () => {
  return (
    <div className="legal-page section-padding">
      <div className="container">
        <header className="legal-header">
          <span className="subtitle">Compromisso & Regras</span>
          <h1 className="text-gold">Termos e Condições</h1>
          <p className="last-updated">Última atualização: 13 de Maio de 2026</p>
        </header>

        <div className="legal-content glass-card">
          <section>
            <h2>Aceitação dos Termos</h2>
            <p>
              Ao aceder e utilizar o website da LastDance Eventos, o utilizador declara ter lido, compreendido e aceitado os Termos e Condições aqui descritos.
            </p>
          </section>

          <section>
            <h2>Serviços</h2>
            <p>
              A LastDance Eventos dedica-se à organização de eventos de finalistas, bailes de gala e celebrações académicas. As condições específicas de cada evento serão detalhadas nos respetivos contratos de prestação de serviços.
            </p>
          </section>

          <section>
            <h2>Inscrições e Pagamentos</h2>
            <p>
              As inscrições nos eventos são realizadas através do portal online. O utilizador é responsável pela veracidade dos dados fornecidos. Os pagamentos devem ser efetuados dentro dos prazos estipulados para garantir a reserva.
            </p>
          </section>

          <section>
            <h2>Propriedade Intelectual</h2>
            <p>
              Todo o conteúdo deste site, incluindo textos, gráficos, logótipos e imagens, é propriedade da LastDance Eventos e está protegido pelas leis de direitos de autor.
            </p>
          </section>

          <section>
            <h2>Limitação de Responsabilidade</h2>
            <p>
              A LastDance Eventos não se responsabiliza por danos resultantes do uso indevido do site ou por interrupções temporárias de serviço devido a causas técnicas fora do nosso controlo.
            </p>
          </section>

          <section>
            <h2>Alterações aos Termos</h2>
            <p>
              Reservamos o direito de alterar estes Termos e Condições a qualquer momento. As alterações serão publicadas nesta página com a respetiva data de atualização.
            </p>
          </section>

          <section>
            <h2>Lei Aplicável</h2>
            <p>
              Estes termos são regidos pela lei portuguesa. Para qualquer litígio emergente, as partes elegem o foro da Comarca de Setúbal.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
};

export default Terms;
