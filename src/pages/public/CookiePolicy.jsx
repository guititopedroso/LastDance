import React from 'react';
import './LegalPage.css';

const CookiePolicy = () => {
  return (
    <div className="legal-page section-padding">
      <div className="container">
        <header className="legal-header">
          <span className="subtitle">Transparência & Segurança</span>
          <h1 className="text-gold">Política de Cookies</h1>
          <p className="last-updated">Última atualização: 14 de Maio de 2026</p>
        </header>

        <div className="legal-content glass-card">
          <section>
            <h2>O que são Cookies e Armazenamento Local?</h2>
            <p>
              Os cookies são pequenos ficheiros de texto guardados no seu dispositivo pelo navegador. O armazenamento local (<em>localStorage</em> e <em>sessionStorage</em>) é uma tecnologia semelhante, integrada nos browsers modernos, que permite guardar informação diretamente no seu dispositivo sem necessidade de a enviar para servidores externos.
            </p>
            <p>
              O website da LastDance utiliza exclusivamente armazenamento local para garantir o funcionamento das suas funcionalidades essenciais. <strong>Não utilizamos cookies de rastreamento, publicidade ou de terceiros.</strong>
            </p>
          </section>

          <section>
            <h2>O que armazenamos e porquê?</h2>
            <div className="cookie-types">
              <div className="cookie-type-item">
                <h3>Sessão do Aluno</h3>
                <p>
                  Após iniciar sessão na Área do Aluno, guardamos os seus dados de sessão no <em>localStorage</em> do seu dispositivo (<code>student_session</code>). Isto permite-lhe manter a sessão ativa sem precisar de iniciar sessão novamente a cada visita. Estes dados são eliminados quando termina sessão.
                </p>
              </div>
              <div className="cookie-type-item">
                <h3>Dados de Registo Temporários</h3>
                <p>
                  Durante o processo de inscrição, guardamos temporariamente os seus dados no <em>localStorage</em> (<code>temp_reg_data</code>) para não perder o progresso caso navegue entre as etapas do formulário. Estes dados são apagados automaticamente após a conclusão ou cancelamento do registo.
                </p>
              </div>
              <div className="cookie-type-item">
                <h3>Preferências do Site</h3>
                <p>
                  Guardamos a sua resposta ao aviso de cookies (<code>cookieConsent</code>) e se já visualizou a animação de carregamento inicial (<code>preloaderShown</code>) para não repetir elementos desnecessários nas suas visitas. Estes dados não contêm informação pessoal.
                </p>
              </div>
              <div className="cookie-type-item">
                <h3>Sessão Administrativa</h3>
                <p>
                  Para os administradores do sistema, é guardada uma chave de autenticação temporária no <em>sessionStorage</em> (<code>adminAuth</code>). Esta informação é apagada automaticamente quando o browser é fechado.
                </p>
              </div>
            </div>
          </section>

          <section>
            <h2>O que NÃO fazemos</h2>
            <p>Para total transparência, confirmamos que o website da LastDance:</p>
            <ul style={{ marginTop: '12px', paddingLeft: '20px', display: 'flex', flexDirection: 'column', gap: '8px', color: 'var(--color-gray-400)' }}>
              <li>❌ Não utiliza cookies de rastreamento ou analítica (Google Analytics, etc.)</li>
              <li>❌ Não utiliza cookies de publicidade ou retargeting</li>
              <li>❌ Não partilha dados com redes sociais através de cookies</li>
              <li>❌ Não utiliza cookies de terceiros de qualquer natureza</li>
              <li>❌ Não recolhe dados de navegação ou comportamento</li>
            </ul>
          </section>

          <section>
            <h2>Como pode gerir ou apagar os seus dados?</h2>
            <p>
              Pode apagar todos os dados guardados pelo nosso site a qualquer momento através das ferramentas do seu browser:
            </p>
            <p style={{ marginTop: '12px' }}>
              <strong>Chrome/Edge:</strong> Definições → Privacidade e segurança → Limpar dados de navegação → Imagens e ficheiros em cache + Dados de sites.<br /><br />
              <strong>Safari:</strong> Definições → Avançado → Dados dos websites → Remover todos os dados.<br /><br />
              <strong>Firefox:</strong> Definições → Privacidade e Segurança → Cookies e dados de sites → Limpar dados.
            </p>
            <p style={{ marginTop: '12px' }}>
              Note que ao apagar estes dados, irá terminar a sua sessão na Área do Aluno e perder as preferências guardadas.
            </p>
          </section>

          <section>
            <h2>Contacto</h2>
            <p>
              Se tiver alguma dúvida sobre a nossa Política de Cookies ou sobre os dados que armazenamos, contacte-nos através do e-mail: <a href="mailto:geral@lastdance.pt">geral@lastdance.pt</a> ou pelo telefone <a href="tel:+351969037376">+351 969 037 376</a>.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
};

export default CookiePolicy;
