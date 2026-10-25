# Publicar a LastDance na Hostinger (plano Business)

O site (React) e a API (PHP) ficam no `public_html`. A base de dados é o MySQL da Hostinger.
A palavra-passe da base de dados fica num ficheiro **fora** do `public_html`: não fica acessível pela internet e nunca é apagada quando publicas uma versão nova.

```
domains/lastdance.pt/
├── lastdance-config.php   ← dados da base de dados (criado por ti, só uma vez)
└── public_html/           ← conteúdo da pasta dist (substituído a cada publicação)
    ├── index.html, assets/, brand/, ...
    └── api/               ← a API PHP
```

## 1. Guardar uma cópia do site atual

O `public_html` ainda tem o site antigo. Antes de mexer:
hPanel → **Ficheiros → Gestor de Ficheiros** → `public_html` → seleciona tudo → **Comprimir** → descarrega o `.zip`.

## 2. Criar a base de dados

hPanel → **Bases de Dados → Gestão** → «Criar nova base de dados MySQL».
Escolhe um nome (ex.: `lastdance`), um utilizador e uma palavra-passe forte.
A Hostinger junta um prefixo: fica algo como `u123456789_lastdance`. Aponta os três valores.

## 3. Ficheiro de configuração (fora do public_html)

No Gestor de Ficheiros, abre a pasta **acima** do `public_html` (normalmente `domains/lastdance.pt/`).
Cria o ficheiro `lastdance-config.php` com este conteúdo, preenchido com os teus dados:

```php
<?php
return [
  'driver' => 'mysql',
  'db_host' => 'localhost',
  'db_port' => 3306,
  'db_name' => 'u123456789_lastdance',
  'db_user' => 'u123456789_lastdance',
  'db_pass' => 'A_TUA_PALAVRA_PASSE',
  'allowed_origins' => [],
];
```

## 4. Versão do PHP

hPanel → **Avançado → Configuração PHP** → escolhe **PHP 8.2** ou mais recente.

## 5. Gerar e enviar o site

No teu computador, na pasta `lastdance`:

```bash
npm run build
```

Isto cria a pasta `dist` com o site **e** a API (`dist/api`).
Comprime o **conteúdo** da pasta `dist` num `.zip` (não a pasta em si), envia-o para o `public_html` no Gestor de Ficheiros e **Extrai** lá.
Confirma que ficaram os ficheiros `.htaccess` (no `public_html` e no `public_html/api`). Se não os vires, ativa «mostrar ficheiros ocultos».

## 6. Instalar

Abre `https://lastdance.pt/api/install.php`.
A página cria as tabelas e pede a primeira conta de administrador (o teu email e uma palavra-passe forte).
Depois, **apaga o ficheiro `public_html/api/install.php`**.

## 7. Entrar

Abre `https://lastdance.pt/entrar` e faz log-in com a conta que criaste.

- **Equipa e acessos**: cria as contas dos sócios, comerciais e staff. Cada conta nova recebe uma palavra-passe aleatória, que aparece no ecrã para a enviares à pessoa.
- **Eventos e códigos**: ao criar um evento com o email do promotor, é criada a conta dele (também com palavra-passe aleatória).
- Os alunos inscrevem-se sozinhos em `https://lastdance.pt/inscricao` com o código do evento.

### Testar com dados fictícios (opcional)

Em **Equipa e acessos → Dados de demonstração** podes carregar cerca de 1200 inscrições fictícias para experimentar todos os perfis (contas `admin@lastdance.pt`, `promotor@lastdance.pt`, `staff@lastdance.pt`, `aluno@lastdance.pt`…, todas com a palavra-passe `demo1234`).
**Antes de começares a usar a sério, carrega em «Apagar dados de demonstração».** Os teus dados reais não são tocados.

## Publicação automática pelo GitHub (recomendado)

Em vez dos passos 5 (enviar o zip), podes publicar com `git push`, como fazias antes:

1. O código está no repositório `guititopedroso/LastDance`. Trabalha-se no ramo `plataforma-nova`; publica-se quando entra no `main`.
2. Em cada push para `main`, o GitHub Actions (`.github/workflows/deploy.yml`) compila o site e guarda a versão pronta no ramo **`deploy`**. Pushes para outros ramos só verificam que compila, não publicam.
3. Na Hostinger: hPanel → **Avançado → Git**.
   - Se já tens o repositório ligado: muda o ramo de `main` para **`deploy`** e o diretório para `public_html` (vazio).
   - Ativa o **Deploy automático** e copia o URL do webhook para GitHub → Settings → Webhooks (se ainda não estiver lá).
   - Se o repositório for privado, adiciona a chave SSH que a Hostinger mostra em GitHub → Settings → **Deploy keys**.
4. O `lastdance-config.php` (passo 3) continua fora do `public_html`: o deploy nunca lhe toca.

Para pôr a plataforma no ar a partir do ramo de testes:

```bash
git checkout main
```

```bash
git reset --hard plataforma-nova
```

```bash
git push --force origin main
```

(`--force` porque o `main` antigo tem outro histórico. O código antigo continua guardado no GitHub, na história do repositório.)

## Publicar uma versão nova

1. `npm run build`
2. Envia o conteúdo de `dist` para o `public_html` (substitui os ficheiros).

A base de dados e o `lastdance-config.php` não são tocados. Não voltes a enviar o `install.php` (ou apaga-o outra vez).

## Porque é que as fotos desapareciam

Quando se publica uma versão nova, o conteúdo do `public_html` é substituído pelo que vem do projeto (ou do Git).
Tudo o que foi enviado diretamente para o servidor e não está no projeto (por exemplo fotos carregadas pelo site) desaparece nessa altura.
Regra: **dados e ficheiros enviados pelos utilizadores nunca vivem dentro da pasta que é substituída**. Nesta plataforma os dados estão no MySQL e a configuração fora do `public_html`; se um dia houver upload de fotos, a pasta de uploads fica também fora do `public_html` (ou num serviço próprio).

## Cópias de segurança

- O plano Business tem cópias automáticas: hPanel → **Ficheiros → Cópias de segurança**.
- Para uma cópia manual da base de dados: hPanel → **Bases de Dados → phpMyAdmin** → seleciona a base → **Exportar**.

## Segurança (resumo)

- As palavras-passe são guardadas cifradas (`password_hash`); o servidor nunca as devolve.
- Cada pedido é verificado no servidor de acordo com o perfil (o promotor só mexe no seu evento, o staff só regista entradas de quem tem tudo pago, o aluno só vota quando a votação está aberta, etc.).
- Depois de 10 tentativas de log-in falhadas, o endereço fica bloqueado 15 minutos.
- Ativa o HTTPS obrigatório: hPanel → **Segurança → SSL** → «Forçar HTTPS».
