<!DOCTYPE html>
<html lang="pt-PT">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>📊 Inova Status Check</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
            line-height: 1.6;
            color: #333;
            background: #f5f5f5;
            padding: 20px;
        }
        
        .container {
            max-width: 1000px;
            margin: 0 auto;
            background: white;
            padding: 40px;
            border-radius: 10px;
            box-shadow: 0 2px 8px rgba(0,0,0,0.1);
        }
        
        h1 {
            color: #1a73e8;
            margin-bottom: 10px;
            font-size: 2em;
        }
        
        h2 {
            color: #1a73e8;
            margin-top: 30px;
            margin-bottom: 15px;
            font-size: 1.5em;
            border-bottom: 2px solid #1a73e8;
            padding-bottom: 10px;
        }
        
        h3 {
            color: #2d3748;
            margin-top: 20px;
            margin-bottom: 12px;
            font-size: 1.2em;
        }
        
        p {
            margin-bottom: 15px;
            line-height: 1.8;
        }
        
        strong {
            color: #1a73e8;
        }
        
        ul {
            margin-left: 25px;
            margin-bottom: 15px;
        }
        
        li {
            margin-bottom: 10px;
            line-height: 1.7;
        }
        
        table {
            width: 100%;
            border-collapse: collapse;
            margin: 20px 0;
            background: white;
            box-shadow: 0 1px 3px rgba(0,0,0,0.1);
        }
        
        th, td {
            padding: 15px;
            text-align: left;
            border: 1px solid #ddd;
        }
        
        th {
            background-color: #1a73e8;
            color: white;
            font-weight: 600;
        }
        
        tr:nth-child(even) {
            background-color: #f9f9f9;
        }
        
        tr:hover {
            background-color: #f0f7ff;
        }
        
        code {
            background-color: #f5f5f5;
            padding: 2px 6px;
            border-radius: 3px;
            font-family: 'Courier New', monospace;
            color: #d73a49;
        }
        
        pre {
            background-color: #2d2d2d;
            color: #f8f8f2;
            padding: 15px;
            border-radius: 5px;
            overflow-x: auto;
            margin: 15px 0;
            font-size: 0.9em;
        }
        
        .section-intro {
            background-color: #f0f7ff;
            padding: 15px;
            border-left: 4px solid #1a73e8;
            margin: 15px 0;
            border-radius: 4px;
        }
        
        a {
            color: #1a73e8;
            text-decoration: none;
        }
        
        a:hover {
            text-decoration: underline;
        }
        
        .tech-stack {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 15px;
            margin: 15px 0;
        }
        
        .tech-item {
            padding: 12px;
            background: #f5f5f5;
            border-radius: 5px;
            border-left: 3px solid #1a73e8;
        }
        
        .emoji {
            font-size: 1.2em;
            margin-right: 8px;
        }
        
        @media (max-width: 768px) {
            .container {
                padding: 20px;
            }
            
            h1 {
                font-size: 1.5em;
            }
            
            h2 {
                font-size: 1.2em;
            }
            
            table {
                font-size: 0.9em;
            }
            
            th, td {
                padding: 10px;
            }
            
            .tech-stack {
                grid-template-columns: 1fr;
            }
        }
    </style>
</head>
<body>
    <div class="container">
        <h1><span class="emoji">📊</span>Inova Status Check</h1>
        <p>Ferramenta de monitorização de disponibilidade de sites desenvolvida para o Projeto de Inovação Tecnológica da UFPR. Permite verificar se URLs estão online ou offline, individualmente ou em lote (via Excel).</p>

        <h2><span class="emoji">🧐</span>Como Funciona a Verificação?</h2>
        <p>Como esta ferramenta corre diretamente no navegador do utilizador (sem um servidor backend próprio), ela utiliza uma <strong>estratégia de 3 camadas</strong> para contornar bloqueios de segurança (CORS) e sistemas anti-robô.</p>
        <p>A verificação funciona como um funil:</p>

        <h3><span class="emoji">1️⃣</span>Tentativa 1: Proxy Rápido (CorsProxy)</h3>
        <ul>
            <li>O sistema pede para um intermediário rápido tentar aceder ao site.</li>
            <li><strong>Objetivo:</strong> Obter o status real (200, 404, 500) com velocidade.</li>
        </ul>

        <h3><span class="emoji">2️⃣</span>Tentativa 2: Proxy Reserva (AllOrigins)</h3>
        <ul>
            <li>Se o primeiro falhar (estiver fora do ar), usamos um segundo serviço intermediário.</li>
            <li><strong>Objetivo:</strong> Garantir redundância. Se um serviço cair, o outro assume.</li>
        </ul>

        <h3><span class="emoji">3️⃣</span>Tentativa 3: Modo "Espião" (Conexão Direta no-cors)</h3>
        <ul>
            <li>Se os proxies forem bloqueados pelo site alvo (comum em LinkedIn, Bancos, Google), o navegador tenta "tocar" no servidor diretamente.</li>
            <li><strong>Objetivo:</strong> Confirmar se o site existe, mesmo que ele não deixe ler o conteúdo. Se a conexão for feita, marcamos como <strong>Online (Restrito)</strong>.</li>
        </ul>

        <h2><span class="emoji">🚦</span>Guia de Códigos de Status</h2>
        <p>Entenda o que cada resultado na tela significa:</p>
        
        <table>
            <thead>
                <tr>
                    <th>Status Visual</th>
                    <th>Código Técnico</th>
                    <th>O que significa na prática?</th>
                </tr>
            </thead>
            <tbody>
                <tr>
                    <td><strong>🟢 Online</strong></td>
                    <td><strong>200</strong></td>
                    <td><strong>Sucesso Total.</strong> O site existe, está no ar e permitiu o acesso completo. É o cenário ideal.</td>
                </tr>
                <tr>
                    <td><strong>🟢 Online</strong></td>
                    <td><strong>200 (Restrito)</strong></td>
                    <td><strong>Sucesso Parcial.</strong> O site está no ar, mas possui bloqueios contra robôs (ex: LinkedIn, Instagram). O sistema confirmou que ele está "vivo", mas não conseguiu ler o conteúdo da página.</td>
                </tr>
                <tr>
                    <td><strong>🔴 Offline</strong></td>
                    <td><strong>403</strong></td>
                    <td><strong>Proibido (Forbidden).</strong> O site existe, mas o servidor bloqueou ativamente o acesso. Pode ser uma firewall a bloquear a verificação.</td>
                </tr>
                <tr>
                    <td><strong>🔴 Offline</strong></td>
                    <td><strong>404</strong></td>
                    <td><strong>Não Encontrado.</strong> O domínio existe, mas a página específica (URL) não foi encontrada. É como ligar para um número errado.</td>
                </tr>
                <tr>
                    <td><strong>🔴 Offline</strong></td>
                    <td><strong>500 / 502 / 503</strong></td>
                    <td><strong>Erro no Servidor.</strong> O site está "quebrado" internamente. Ele existe, mas está com defeito, em manutenção ou sobrecarregado.</td>
                </tr>
                <tr>
                    <td><strong>🔴 Offline</strong></td>
                    <td><strong>TIMEOUT</strong></td>
                    <td><strong>Tempo Esgotado.</strong> O site demorou mais de 10 segundos para responder. Geralmente indica servidor travado ou internet muito lenta.</td>
                </tr>
                <tr>
                    <td><strong>🔴 Offline</strong></td>
                    <td><strong>ERR / DNS</strong></td>
                    <td><strong>Erro de Rede.</strong> O navegador não conseguiu encontrar o servidor. Geralmente acontece quando a URL está digitada errada ou o domínio deixou de existir.</td>
                </tr>
            </tbody>
        </table>

        <h2><span class="emoji">🚀</span>Como Rodar o Projeto</h2>

        <h3>Pré-requisitos</h3>
        <ul>
            <li><a href="https://nodejs.org/" target="_blank">Node.js</a> instalado.</li>
        </ul>

        <h3>Passo a Passo</h3>
        <ol>
            <li>
                <strong>Instalar dependências:</strong>
                <pre>npm install</pre>
            </li>
            <li>
                <strong>Rodar servidor de desenvolvimento:</strong>
                <pre>npm run dev</pre>
                <p>O projeto abrirá em de>http://localhost:5173</code></p>
            </li>
            <li>
                <strong>Gerar versão para Produção (Deploy):</strong>
                <pre>npm run build</pre>
                <p>Isso criará uma pasta de>dist</code> pronta para ser arrastada para o Netlify ou Vercel.</p>
            </li>
        </ol>

        <h2><span class="emoji">🛠️</span>Tecnologias Utilizadas</h2>
        <div class="tech-stack">
            <div class="tech-item">
                <strong><a href="https://react.dev/" target="_blank">React</a></strong>
                <p>Biblioteca principal para construção da interface.</p>
            </div>
            <div class="tech-item">
                <strong><a href="https://vitejs.dev/" target="_blank">Vite</a></strong>
                <p>Ferramenta de build rápida e leve.</p>
            </div>
            <div class="tech-item">
                <strong><a href="https://tailwindcss.com/" target="_blank">Tailwind CSS</a></strong>
                <p>Framework de estilização para o design moderno.</p>
            </div>
            <div class="tech-item">
                <strong><a href="https://lucide.dev/" target="_blank">Lucide React</a></strong>
                <p>Biblioteca de ícones.</p>
            </div>
            <div class="tech-item">
                <strong><a href="https://sheetjs.com/" target="_blank">SheetJS (XLSX)</a></strong>
                <p>Biblioteca para leitura e criação de ficheiros Excel no navegador.</p>
            </div>
        </div>

        <h2><span class="emoji">📝</span>Observações Importantes</h2>
        <ul>
            <li><strong>Limitações de Navegador:</strong> Por rodar 100% no navegador (Client-Side), a ferramenta depende de Proxies Públicos (corsproxy.io e allorigins). Em momentos de alto tráfego na internet, a verificação pode ficar um pouco mais lenta.</li>
            <li><strong>Privacidade:</strong> Nenhum dado das planilhas é enviado para servidores externos de armazenamento. Todo o processamento do Excel acontece na memória do seu computador.</li>
        </ul>

        <p style="margin-top: 40px; padding-top: 20px; border-top: 1px solid #ddd; color: #666;">
            Desenvolvido para fins educacionais e de monitorização.
        </p>
    </div>
</body>
</html>
