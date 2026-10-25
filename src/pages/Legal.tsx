import { BRAND } from '../config'
import { Footer, Navbar } from '../components/site'

// Textos-base: devem ser revistos pelo jurídico antes de publicar.
const PAGES = {
  termos: {
    title: 'Termos e Condições',
    body: [
      ['Objeto', 'Estes termos regulam a inscrição e participação nos eventos organizados pela LastDance.'],
      ['Inscrição', 'A inscrição é feita com o código do evento fornecido pela comissão de finalistas. O participante garante que os dados indicados são verdadeiros; o nome é verificado à entrada com documento de identificação.'],
      ['Pagamentos', 'O preço é pago em prestações, nas datas-limite definidas para cada evento, ao promotor do evento, que regista cada pagamento na plataforma. O QR de entrada só fica disponível com todas as prestações pagas.'],
      ['Entrada', 'O QR é pessoal e intransmissível e só pode ser usado uma vez. A organização pode recusar a entrada a quem não apresente identificação ou não cumpra as regras do evento.'],
      ['Cancelamentos', 'As condições de devolução são as previstas no contrato celebrado com a comissão de finalistas.'],
    ],
  },
  privacidade: {
    title: 'Política de Privacidade',
    body: [
      ['Responsável', `LastDance, ${BRAND.address}. Contacto: ${BRAND.email}.`],
      ['Dados recolhidos', 'Nome, data de nascimento, telemóvel, email, tipo de participante, turma, restrições alimentares e, se indicado, informação de saúde relevante para o evento.'],
      ['Finalidade', 'Gerir a inscrição, os pagamentos, a distribuição de mesas, a entrada no evento e a votação de prémios.'],
      ['Conservação', 'Os dados são conservados até ao fim do ano letivo do evento e depois apagados, salvo obrigação legal.'],
      ['Direitos', 'Podes pedir acesso, retificação ou eliminação dos teus dados através do promotor do teu evento ou do email geral.'],
    ],
  },
  cookies: {
    title: 'Política de Cookies',
    body: [
      ['O que são', 'Pequenos ficheiros guardados no teu dispositivo para o site funcionar e para percebermos como é usado.'],
      ['Essenciais', 'Mantêm a tua sessão iniciada e as tuas preferências. Não podem ser desativados.'],
      ['Analíticos', 'Só são usados se aceitares no aviso de cookies.'],
      ['Gerir', 'Podes apagar os cookies a qualquer momento nas definições do teu navegador.'],
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
        {p.body.map(([h, t]) => (
          <div key={h}>
            <h2>{h}</h2>
            <p>{t}</p>
          </div>
        ))}
      </main>
      <Footer />
    </>
  )
}
