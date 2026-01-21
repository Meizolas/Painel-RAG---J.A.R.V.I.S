🤖 J.A.R.V.I.S — Assistente Inteligente com RAG (Next.js + n8n)
===============================================================

J.A.R.V.I.S é um **assistente inteligente corporativo**, inspirado em interfaces futuristas (HUD / sci-fi), que permite aos usuários tirarem dúvidas com base em uma **base de conhecimento interna (RAG)**.

O projeto integra **frontend moderno**, **automação inteligente com n8n** e **IA explicável**, entregando uma experiência visual avançada e profissional.


✨ Funcionalidades
-----------------

*   💬 Chat interativo com efeito de digitação (streaming)
    
*   🧠 IA baseada em **RAG (Retrieval-Augmented Generation)**
    
*   📚 Exibição de fontes utilizadas na resposta
    
*   ⚙️ Integração via webhook com **n8n**
    
*   🎨 Interface futurista estilo JARVIS (partículas, animações, HUD)
    
*   📱 Totalmente responsivo (desktop e mobile)
    
*   🔒 Uso de variáveis de ambiente para segurança
    


🧱 Stack Tecnológica
--------------------

### Frontend

*   **Next.js 14** (App Router)
    
*   **React**
    
*   **TypeScript**
    
*   **CSS Global customizado (HUD futurista)**
    
*   **Canvas / partículas animadas (JarvisOrb)**
    

### Backend

*   **API Routes do Next.js**
    
*   **n8n (Self-hosted ou Cloud)**
    

### Integrações

*   Webhook HTTP
    
*   Base de conhecimento (documentação interna)
    
*   Possível integração com banco de dados / vector store
    


📂 Estrutura do Projeto
-----------------------

src/ ├─ app/

│ ├─ api/

│ │ └─ chat/

│ │ └─ route.ts # Rota que comunica com o n8n

│ └─ page.tsx # Interface principal (chat)

│

├─ components/

│ ├─ JarvisOrb.tsx

│ └─ JarvisOrbFX.tsx

│

├─ styles/

│ └─ global.css

│

└─ .env


▶️ Rodando o Projeto Localmente
-------------------------------

*   1️⃣ Instale as dependências npm install
    
*   2️⃣ Rode em modo desenvolvimento npm run dev
    

Acesse no navegador:

[http://localhost:3000](http://localhost:3000/)

🔌 Integração com o n8n
-----------------------

Fluxo de funcionamento:

Usuário envia uma mensagem no chat

Frontend chama /api/chat

API Route encaminha para o webhook do n8n

O n8n:

Processa a pergunta

Consulta a base de conhecimento (RAG)

Retorna resposta + fontes

O frontend renderiza a resposta com animações

📤 Formato esperado da resposta do n8n
--------------------------------------

    {
  
        "answer": "Aqui está a resposta baseada na documentação.",
  
        "sources": [
      
            {
    
              "title": "Documento Interno",
    
              "section": "Seção 2.1",
    
              "snippet": "Trecho relevante da base de conhecimento."
    
            }
    
          ]

      }


📸 Preview
----------

Interface futurista inspirada em sistemas de IA corporativos e HUDs sci-fi, com foco em clareza, confiabilidade e experiência do usuário.
<img width="1919" height="909" alt="image" src="https://github.com/user-attachments/assets/a414c66c-354d-454e-b762-9ada391553b5" />




📄 Licença
----------

Uso livre para estudos, protótipos e aplicações internas. Adapte conforme as políticas da sua empresa.


👨‍💻 Autor
-----------

Desenvolvido por Hélio Nunes - Projeto de IA • Automação • UX Futurista
