# DSM-G08-PI4-2025-2
Repositório do GRUPO 8 do Projeto Interdisciplinar do 4º semestre DSM 2025/2
# 🧠 Projeto Interdisciplinar – 4º Semestre – DSM

Este repositório contém o **projeto interdisciplinar do 4º semestre** do curso de **Desenvolvimento de Software Multiplataforma (DSM)** da **Fatec Franca**.  
O projeto foi desenvolvido pelos integrantes: Gabriel Andrade Aleixo, Uriel Monte Paz Araujo, Hudson Ribeiro Barbara Junior, Gabriel de oliveira Camera., com foco em um sistema integrado para ciclistas que conecta um **dispositivo IoT** instalado na bicicleta a um **aplicativo mobile** desenvolvido em **React Native**, com backend em **Node.js (Express)**.  
O projeto visa monitorar, registrar e analisar.

---

## 📁 Estrutura do Repositório

```
DSM-G08-PI4-2025-2/
│
├── API/                  # Backend em Node.js (Express)
│   ├── src/
│   │   ├── controllers/  # Lógica de controle das rotas
│   │   ├── models/       # Modelos e conexão com o banco
│   │   ├── routes/       # Rotas da aplicação
│   │   └── server.js     # Ponto inicial do servidor
│   ├── package.json
│   └── .env.example      # Modelo de variáveis de ambiente
│
├── Mobile/               # Aplicação Mobile (React Native / Expo)
│   ├── assets/           # Imagens e ícones
│   ├── src/              # Componentes, telas e serviços
│   ├── App.js
│   ├── package.json
│   └── app.json
│
├── README.md             # Documentação principal do projeto
└── .gitignore
```


---

## ⚙️ Tecnologias Utilizadas

### 🖥️ Back-End (API)
- Node.js  
- Express  
- MongoDB / SQL / Firebase  
- JWT (autenticação)  
- Dotenv  
- Nodemon  

### 📱 Mobile
- React Native (via Expo)  
- Axios  
- React Navigation  
- Async Storage  
- Styled Components  

### 🌐 Outras Ferramentas
- Git / GitHub  
- Postman / Insomnia  
- Expo Go  
- Render / Railway / Vercel (para deploy da API)

---

## 🚀 Como Rodar o Projeto

### 🔧 1. Clonar o repositório
```bash
git clone https://github.com/FatecFranca/DSM-G08-PI4-2025-2.git
cd DSM-G08-PI4-2025-2

```

### 🖥️ 2. Configurar e executar a API
```
1.
cd API
npm install

2.
Crie um arquivo .env baseado no .env.example:
PORT=3000
DB_URI=sua_string_de_conexao
JWT_SECRET=sua_chave_secret

3.Depois, inicie o servidor:
npm run dev

4.
A API ficará disponível em:
http://localhost:3000

Teste os endpoints com Postman ou Insomnia.

```

### 📱 3. Executar o aplicativo Mobile
```
1.
cd ../Mobile
npm install

2.Configure o IP da API no arquivo de configuração (por exemplo, src/config.js):
API_URL=http://192.168.X.X:3000
Substitua 192.168.X.X pelo IP local da sua máquina.

3.Rode o app:
npx expo start
(Abra o Expo Go no celular e escaneie o QR Code que aparece no terminal ou navegador.)
```


## 🎯 Objetivo do Projeto

O objetivo do projeto é desenvolver **um sistema integrado para ciclistas**, combinando um **dispositivo IoT** instalado na bicicleta com um **aplicativo mobile** capaz de registrar e analisar o desempenho do usuário.

O sistema é responsável por coletar e processar diversas informações, como:

- 🚴‍♂️ **Velocidade instantânea e média**  
- 📏 **Distância total percorrida**  
- ⏱️ **Tempo de pedalada**  
- 🗺️ **Histórico de rotas e sessões**  
- 📊 **Gráficos de desempenho e evolução**

Esses dados são enviados para a **API central**, armazenados em um banco de dados e exibidos de forma visual e intuitiva no **aplicativo mobile**, permitindo que o ciclista acompanhe sua performance, evolução e hábitos de pedalada.

O projeto integra conhecimentos das seguintes áreas:

- 💻 **Programação Web e Mobile**  
- ⚙️ **IoT e sensores físicos**  
- 🗄️ **Banco de Dados**  
- 🧩 **Engenharia de Software**  
- 🎨 **UX/UI Design**

## 🧩 Funcionalidades Implementadas

- ✅ **Leitura em tempo real** dos sensores do dispositivo IoT (velocidade, rota, tempo)  
- ✅ **Envio automático** dos dados para a API  
- ✅ **Armazenamento** das pedaladas e histórico no banco de dados  
- ✅ **Exibição de gráficos de desempenho**, como velocidade média, distância e tempo  
- ✅ **Cadastro e login de usuários**  
- ✅ **Interface responsiva e intuitiva** no aplicativo mobile  
- ✅ **Sincronização completa** entre o dispositivo IoT, a API e o app mobile  

## 👥 Integrantes do Grupo

**Grupo DSM-G08 - Projeto Interdisciplinar 4º Semestre (PI4 - 2025/2)**  

- 🧑‍💻 **Uriel Monte Paz Araujo**  
- 🧑‍💻 **Gabriel Andrade Aleixo**  
- 🧑‍💻 **Gabriel Camara de Oliveira**
- 🧑‍💻 **Hudson Ribeiro Barbara Junior**

## 📄 Licença

Este projeto é de **uso acadêmico**, desenvolvido para fins educacionais no âmbito da disciplina de **Projeto Interdisciplinar** do curso **Desenvolvimento de Software Multiplataforma (DSM)** – *Fatec Franca*.

© 2025 – **Grupo 08 (DSM-G08-PI4-2025-2)**






