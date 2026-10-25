# LastDance — site + plataforma de gestão de bailes

Front-end completo (React 18 + Vite + TypeScript) com o tema e logótipo do lastdance.pt e todas as funções do demo Epic Living.
Os dados ainda vivem no browser (localStorage), com dados fictícios de demonstração.

## Correr

```bash
npm install
npm run dev
```

Abre http://localhost:5173. Contas de demonstração (palavra-passe `demo1234`), também em botões na página `/entrar`:

| Perfil | Email |
|---|---|
| Administrador | admin@lastdance.pt |
| Comercial | comercial@lastdance.pt |
| Promotor chefe | promotor@lastdance.pt |
| Promotor da equipa | equipa@lastdance.pt |
| Staff (entradas) | staff@lastdance.pt |
| Participante | aluno@lastdance.pt |

Códigos de inscrição para testar: `CABRITA26`, `ALCOCHETE26`, `IPS26`, `MOITA26`…

## Páginas

- `/` — site público: hero, eventos, porquê a LastDance, demo interativa do software, como funciona, noite hora a hora, galeria, quem somos, testemunhos, FAQ, contactos (WhatsApp).
- `/inscricao` — inscrição com código do evento → cria a conta do participante.
- `/entrar` — login único para todos os perfis (`/area-cliente` redireciona para aqui).
- `/gestao` — cada perfil vê a sua área:
  - **Administrador**: Painel (receita, recebido, atrasos, comissões), Eventos e códigos (criar/editar/arquivar), Todas as inscrições, Contas (lucro por evento), Quintas, Parceiros, Despesas gerais, Equipa e acessos. Em cada evento: Inscritos, Finanças, Prémios, Recebimentos, Em atraso, Mesas.
  - **Comercial**: comissão prevista e eventos dele, em modo de consulta.
  - **Promotor chefe / promotor**: o evento deles — receber prestações, ver atrasos, organizar mesas.
  - **Staff**: validar entradas por QR (código, câmara ou nome), lista de convidados, modo sem internet.
  - **Participante**: prestações, QR de entrada (só com tudo pago), mesa, votação de prémios, dados.

## Base de dados (Hostinger: PHP + MySQL)

- `npm run dev` usa o **modo de demonstração** (dados só no browser).
- `npm run build` gera a versão para publicar, que usa a **API em `/api`** (pasta `api/`: PHP + MySQL). Está definido em `.env.production`.
- Toda a leitura e escrita passa por `src/data/store.ts`: cada alteração é aplicada no ecrã e enviada à API; sem internet fica numa fila no telemóvel e é enviada quando a ligação voltar. A cada 8 s o site verifica se alguém mudou alguma coisa.
- As permissões de cada perfil são verificadas no servidor (`api/index.php`).

Para publicar, segue o [GUIA-HOSTINGER.md](GUIA-HOSTINGER.md).
