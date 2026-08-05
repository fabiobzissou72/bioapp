# Bio Insta — Captador de Leads (extensão Chrome)

Extensão local (não publicada na loja) que analisa perfis do Instagram enquanto você navega neles e sugere uma abordagem de venda para o Bio Insta.

## Como instalar

1. Abra `chrome://extensions` no Chrome.
2. Ative o "Modo do desenvolvedor" (canto superior direito).
3. Clique em "Carregar sem compactação" e selecione esta pasta (`chrome-extension/`).
4. Clique no ícone da extensão na barra do Chrome, entre com o e-mail/senha da sua conta do Bio Insta.
5. Preencha "Nicho" (ex: manicure) e "Cidade" (ex: Goiânia) no popup.
6. Navegue no Instagram normalmente — pesquise pelo nicho/cidade na busca do próprio Instagram, abra os perfis que aparecerem. A extensão analisa automaticamente cada perfil que você visita (não precisa clicar em nada na extensão).
7. Veja os leads capturados e a abordagem sugerida em `/superadmin/leads` no painel.

## Como funciona (e o que NÃO faz)

- **Não pesquisa sozinha, não rola a tela sozinha, não clica em nada.** Só lê o que já está na tela quando você abre um perfil de verdade. Isso é proposital — reduz (mas não elimina) o risco de a conta do Instagram ser sinalizada como automação.
- Ao detectar um perfil novo, manda nome/bio/link pro backend do Bio Insta, que chama a Groq pra classificar se é um bom alvo comercial (bio fraca ou sem link organizado) e sugerir uma mensagem de abordagem.
- Você envia a mensagem manualmente pelo Instagram — a extensão nunca manda DM.

## Risco a ter em mente

Ler dados de perfis de forma automatizada (mesmo sem rolar/pesquisar sozinho) tecnicamente vai contra os Termos de Uso do Instagram. Recomendo usar uma conta secundária para prospecção, não a principal da agência.

## Se parar de capturar

Os seletores usados pra ler nome/bio/link (`content-script.js`) dependem da estrutura atual das páginas do Instagram, que muda com frequência. Se a extensão parar de detectar perfis, provavelmente precisa ajustar os seletores em `extractProfile()`.
