import { BRAND } from '../config'
import { Footer, Navbar } from '../components/site'

type Section = [title: string, ...paragraphs: (string | string[])[]]
const UPDATED = 'novembro de 2026'

const PAGES: Record<'termos' | 'privacidade' | 'cookies', { title: string; intro: string; body: Section[] }> = {
  termos: {
    title: 'Termos e Condições',
    intro: `Estes termos aplicam-se a quem se inscreve e participa nos eventos organizados pela ${BRAND.name} e a quem usa este site e a plataforma de inscrições. Ao concluir a inscrição, declaras que leste e aceitas estes termos.`,
    body: [
      ['1. Quem somos', `A ${BRAND.name} organiza bailes de finalistas, jantares de gala e outros eventos. Para qualquer questão sobre estes termos, contacta-nos através de ${BRAND.email}.`],
      [
        '2. Inscrição',
        'A inscrição é feita no site, com o código do evento que a comissão de finalistas (ou a entidade organizadora) te enviou. Cada inscrição é pessoal e só pode ser usada pelo próprio participante.',
        'Comprometes-te a indicar dados verdadeiros e atualizados. O nome tem de coincidir com o do teu documento de identificação, porque é confirmado à entrada.',
        'Se fores menor de idade, a inscrição deve ser feita com o conhecimento do teu encarregado de educação, cujos contactos te pedimos no formulário.',
        'Cada evento pode ter um limite de lugares. Quando esse limite é atingido, as inscrições com o código fecham.',
      ],
      [
        '3. Preço e prestações',
        'O preço do evento é o valor total indicado no momento da inscrição, de acordo com a modalidade e os extras que escolheres. Esse valor é dividido no número de prestações definido para o evento, cada uma com a sua data-limite.',
        'Se numa prestação só pagares uma parte, o valor em falta é dividido pelas prestações seguintes. Se pagares mais, a diferença desconta nas seguintes. A última prestação tem de cobrir o que faltar para completar o valor total.',
        'Uma prestação sem nenhum pagamento depois da sua data-limite fica em atraso. Podemos enviar-te lembretes por mensagem.',
        'Os pagamentos são feitos ao promotor do teu evento, que os regista na plataforma. Na tua área pessoal vês, a qualquer momento, o que já pagaste, o que falta e as próximas datas. Não há pagamentos online.',
        'Enquanto essa opção estiver disponível na tua área, podes mudar de modalidade ou de extras; o novo total é dividido pelas prestações que ainda faltam.',
      ],
      [
        '4. QR de entrada e app do evento',
        'O QR de entrada e a app do evento ficam disponíveis quando o valor total estiver pago.',
        'O QR é pessoal, intransmissível e só pode ser usado uma vez. À entrada tens de apresentar o Cartão de Cidadão (ou outro documento de identificação válido). A entrada pode ser recusada a quem não apresente identificação, não tenha o pagamento completo ou não cumpra as regras do evento.',
      ],
      [
        '5. Prémios e votações',
        'Durante o evento, os participantes com o pagamento completo podem votar nas categorias criadas para o evento (por exemplo, Rei e Rainha). O voto é secreto. Os resultados são apurados pela organização e anunciados no evento; a decisão da organização é final.',
      ],
      [
        '6. Mural de memórias (fotografias)',
        'Na app podes publicar fotografias do evento, que ficam visíveis para os restantes participantes do mesmo evento.',
        'Só deves publicar fotografias tuas ou de pessoas que concordem em aparecer. Não é permitido publicar conteúdos ofensivos, íntimos, discriminatórios, que violem direitos de terceiros ou que sejam ilegais.',
        'Qualquer participante pode denunciar uma fotografia. A organização pode esconder ou apagar fotografias denunciadas ou que não cumpram estas regras, sem aviso prévio. Podes apagar as tuas fotografias a qualquer momento.',
      ],
      [
        '7. Regras de conduta no evento',
        'Pedimos respeito pelos outros participantes, pela equipa e pelo espaço. A organização e a segurança podem retirar do evento quem tenha comportamentos que ponham em risco a segurança ou o bem-estar de outras pessoas, sem direito a reembolso.',
        'A venda e o consumo de bebidas alcoólicas seguem a lei em vigor e não são permitidos a menores de 18 anos.',
      ],
      [
        '8. Cancelamento e devoluções',
        'Se quiseres cancelar a tua inscrição, fala com o promotor do teu evento. As condições de devolução dos valores pagos são as definidas no contrato celebrado com a comissão de finalistas (ou com a entidade organizadora) e dependem da data do pedido e dos custos já assumidos com o evento.',
        'Uma inscrição cancelada deixa de contar para mesas, entrada e votações.',
      ],
      [
        '9. Alterações ao evento',
        'Por motivos alheios à nossa vontade (por exemplo, indicação das autoridades, condições meteorológicas ou indisponibilidade do espaço), poderemos ter de alterar a data, o horário, o local ou parte do programa. Avisaremos os participantes com a maior antecedência possível. Se o evento for cancelado pela organização, os valores pagos são devolvidos nos termos do contrato.',
      ],
      [
        '10. Responsabilidade',
        'Cada participante é responsável pelos seus objetos pessoais durante o evento. A organização não se responsabiliza por perdas ou danos que não lhe sejam imputáveis.',
        'Fazemos o possível para que o site e a plataforma estejam sempre disponíveis e sem erros, mas podem ocorrer interrupções pontuais para manutenção ou por falhas técnicas.',
      ],
      [
        '11. Conta e segurança',
        'O acesso à tua área é feito com o teu email e uma palavra-passe. És responsável por manter a palavra-passe em segurança e por não a partilhar. Se te esqueceres dela, podes recuperá-la com o teu email e a tua data de nascimento.',
      ],
      ['12. Propriedade intelectual', `A marca ${BRAND.name}, o logótipo, os textos e o design deste site pertencem à ${BRAND.name} e não podem ser usados sem autorização.`],
      ['13. Dados pessoais', 'O tratamento dos teus dados pessoais está descrito na nossa Política de Privacidade.'],
      [
        '14. Alterações a estes termos',
        'Podemos atualizar estes termos, por exemplo quando a plataforma ganhar novas funções. A data da última atualização aparece no fim desta página. As alterações não se aplicam a pagamentos já feitos.',
      ],
      [
        '15. Lei aplicável e resolução de litígios',
        'Estes termos regem-se pela lei portuguesa.',
        'Em caso de litígio de consumo, podes recorrer a uma entidade de resolução alternativa de litígios de consumo. A lista destas entidades está disponível no Portal do Consumidor (www.consumidor.gov.pt). Tens também ao teu dispor o Livro de Reclamações Eletrónico (www.livroreclamacoes.pt).',
      ],
    ],
  },
  privacidade: {
    title: 'Política de Privacidade',
    intro: `Esta política explica que dados pessoais a ${BRAND.name} recolhe, para quê, durante quanto tempo os guarda e quais são os teus direitos, nos termos do Regulamento Geral sobre a Proteção de Dados (RGPD) e da lei portuguesa.`,
    body: [
      ['1. Responsável pelo tratamento', `A responsável pelo tratamento dos teus dados é a ${BRAND.name}. Para qualquer questão sobre privacidade ou para exercer os teus direitos, contacta-nos através de ${BRAND.email}.`],
      [
        '2. Que dados recolhemos',
        [
          'Dados da inscrição: nome completo, data de nascimento, telemóvel, email, tipo de participante, turma, modalidade e extras escolhidos.',
          'Dados do encarregado de educação, no caso de participantes menores (nome e telefone).',
          'Restrições alimentares e, apenas se decidires indicá-la, informação de saúde que seja útil conhecermos para a tua segurança no evento.',
          'Dados de pagamento: valores, datas e o promotor que recebeu cada prestação. Não recolhemos dados de cartões nem de contas bancárias.',
          'Dados do evento: mesa atribuída, hora de entrada, votos nos prémios e fotografias que publiques na app.',
          'Dados da conta: email e palavra-passe (guardada de forma cifrada, que nem nós conseguimos ler).',
          'Dados técnicos estritamente necessários para o site funcionar, como a sessão iniciada (ver a Política de Cookies).',
        ],
      ],
      [
        '3. Para que usamos os dados e com que fundamento',
        [
          'Gerir a tua inscrição, as prestações, as mesas, a entrada e a app do evento — necessário para cumprir o contrato que celebras connosco ao inscrever-te.',
          'Confirmar a tua identidade e idade à entrada — necessário para cumprir o contrato e para cumprirmos obrigações legais (por exemplo, sobre a venda de álcool a menores).',
          'Ter em conta restrições alimentares e informação de saúde — com base no teu consentimento explícito, que podes retirar a qualquer momento.',
          'Enviar lembretes de prestações e informações práticas sobre o evento — necessário para cumprir o contrato.',
          'Publicar as fotografias que escolhes partilhar no mural de memórias — com base no teu consentimento, que retiras apagando a fotografia.',
          'Manter os registos de pagamentos exigidos por lei — cumprimento de obrigações legais.',
          'Garantir a segurança da plataforma e prevenir abusos — interesse legítimo da LastDance.',
        ],
        'Não usamos os teus dados para publicidade de terceiros, não os vendemos e não tomamos decisões automáticas que te afetem.',
      ],
      [
        '4. Menores',
        'Muitos participantes são menores. Pedimos os dados do encarregado de educação dos menores e só recolhemos o necessário para o evento. Nos termos da lei portuguesa, os jovens a partir dos 13 anos podem consentir no tratamento de dados em serviços online; abaixo dessa idade, o consentimento é dado pelo encarregado de educação.',
      ],
      [
        '5. Quem pode ver os teus dados',
        [
          'A equipa da LastDance (administração), para gerir os eventos.',
          'O promotor do teu evento, que vê os dados da inscrição e regista os pagamentos.',
          'O staff do evento, que vê apenas o necessário para validar a entrada (nome, tipo de participante, idade e se o pagamento está completo) e o número de votos de cada categoria — nunca quem votou em quem.',
          'Os outros participantes do mesmo evento veem o teu nome (na tua mesa e na lista de votações dos prémios) e as fotografias que publicares.',
          'Prestadores de serviços que nos ajudam a manter o site e o email (por exemplo, alojamento informático), que só tratam os dados por nossa conta e com as garantias exigidas pelo RGPD.',
          'Autoridades públicas, quando a lei o exija.',
        ],
      ],
      [
        '6. Durante quanto tempo guardamos os dados',
        'Os dados da inscrição, da mesa, da entrada, os votos e as fotografias são guardados até ao fim do ano letivo do evento e depois apagados ou anonimizados.',
        'Os registos de pagamentos são guardados pelo prazo que a lei exigir.',
      ],
      [
        '7. Os teus direitos',
        'Podes, a qualquer momento, pedir para aceder aos teus dados, corrigi-los, apagá-los, limitar ou opor-te ao seu tratamento, recebê-los num formato digital (portabilidade) e retirar o consentimento que tenhas dado, sem afetar o tratamento já feito.',
        `Para isso, fala com o promotor do teu evento ou escreve-nos para ${BRAND.email}. Respondemos no prazo máximo de um mês. O telemóvel, as restrições alimentares e a informação de saúde também podem ser corrigidos diretamente na tua área.`,
        'Se considerares que os teus direitos não foram respeitados, podes apresentar reclamação à Comissão Nacional de Proteção de Dados (www.cnpd.pt).',
      ],
      [
        '8. Segurança',
        'Usamos ligações cifradas (HTTPS), palavras-passe guardadas de forma cifrada e acessos limitados por função: cada pessoa da equipa só vê os dados de que precisa para o seu trabalho.',
      ],
      ['9. Alterações a esta política', 'Podemos atualizar esta política. A data da última atualização aparece no fim desta página e, se as alterações forem importantes, avisamos os participantes.'],
    ],
  },
  cookies: {
    title: 'Política de Cookies',
    intro: 'Os cookies são pequenos ficheiros guardados no teu dispositivo quando visitas um site.',
    body: [
      ['Cookies essenciais', 'Mantêm a tua sessão iniciada e guardam a tua escolha sobre cookies. São necessários para o site funcionar e não podem ser desativados.'],
      ['Cookies analíticos', 'Só são usados se os aceitares no aviso de cookies e servem apenas para percebermos como o site é usado.'],
      ['Gerir os cookies', 'Podes apagar os cookies a qualquer momento nas definições do teu navegador. Se apagares os essenciais, terás de voltar a iniciar sessão.'],
    ],
  },
}

export default function Legal({ page }: { page: keyof typeof PAGES }) {
  const p = PAGES[page]
  return (
    <>
      <Navbar />
      <main className="container legal">
        <h1>{p.title}</h1>
        <p>{p.intro}</p>
        {p.body.map(([h, ...paras]) => (
          <div key={h}>
            <h2>{h}</h2>
            {paras.map((t, i) =>
              Array.isArray(t) ? (
                <ul key={i}>
                  {t.map((li) => (
                    <li key={li}>{li}</li>
                  ))}
                </ul>
              ) : (
                <p key={i}>{t}</p>
              ),
            )}
          </div>
        ))}
        <p className="small muted" style={{ marginTop: 40 }}>
          Última atualização: {UPDATED}.
        </p>
      </main>
      <Footer />
    </>
  )
}
