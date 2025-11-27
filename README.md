# DSM-G08-PI4-2025-2

Repositório do GRUPO 8 do Projeto Interdisciplinar do 4º semestre DSM 2025/2

# 🧠 Projeto Interdisciplinar – 4º Semestre – DSM

Este repositório contém o **projeto interdisciplinar do 4º semestre** do curso de **Desenvolvimento de Software Multiplataforma (DSM)** da **Fatec Franca**.
O projeto foi desenvolvido pelos integrantes: Uriel Monte Paz de Araújo, Gabriel Andrade Aleixo e Hudson Ribeiro Bárbara Junior, com foco em um sistema integrado para ciclistas que conecta um **dispositivo IoT** instalado na bicicleta a um **aplicativo mobile** desenvolvido em **React Native**, com backend em **Node.js (Next.js/Express)**.
O projeto visa monitorar a velocidade em **Km/h** em tempo real, registrar dados das pedaladas e apresentar estatísticas detalhadas aos usuários.

---

## ⚙️ Tecnologias Utilizadas

### 🖥️ Back-End (API)

* Node.js
* Next.js
* Express
* MySQL (gerenciado com WorkBench)
* JWT (autenticação)
* Dotenv
* Nodemon

### 📱 Mobile

* React Native (via Expo)
* Axios
* React Navigation
* Async Storage
* Styled Components

### 🌐 Outras Ferramentas

* Git / GitHub
* Postman / Insomnia
* Expo Go
* Azure (para hospedagem da API e Frontend)

### 🔧 Hardware

* ESP32 (microprocessador)
* Sensor Hall (detecção de ímã de neodímio)
* Ímã de neodímio (para medir rotações da roda)

---

## 🚀 Como Rodar o Projeto

### 🔧 1. Clonar o repositório

```bash
git clone https://github.com/FatecFranca/DSM-G08-PI4-2025-2.git
cd DSM-G08-PI4-2025-2
```

### 🖥️ 2. Configurar e executar a API

```bash
cd API
npm install
```

* Crie o arquivo `.env` com as configurações do banco e variáveis de ambiente.
* Inicie a API:

```bash
npm start
```

* A API ficará disponível em:

```
http://localhost:3000
```

### 🌐 3. Executar o Frontend Web

```bash
cd ../Frontend
npm install
npm run dev
```

* Acesse em `http://localhost:3001`

### 📱 4. Executar o aplicativo Mobile

```bash
cd ../Mobile
npm install
```

* Configure a rota da API no arquivo `Mobile/src/api/variaveis.js`:

```javascript
export const API_URL = 'http://192.168.X.X:3000';
```

Substitua `192.168.X.X` pelo IP do seu computador ou da máquina virtual.

* Rode o app:

```bash
npx expo start
```

* Abra o **Expo Go** no celular e escaneie o QR Code.

### 🌐 5. Acesso Online (Azure)

* Caso a máquina virtual esteja ligada, basta acessar:

```
http://172.206.114.74:3001/
```

---

## 🎯 Objetivo do Projeto

O objetivo do projeto é desenvolver **um sistema integrado para ciclistas**, combinando um **dispositivo IoT** instalado na bicicleta com um **aplicativo mobile** capaz de registrar e analisar o desempenho do usuário.

O sistema permite coletar informações como:

* 🚴‍♂️ **Velocidade instantânea e média**
* 📏 **Distância total percorrida**
* ⏱️ **Tempo de pedalada**
* 🗓️ **Histórico de runs e frequência de uso**
* 📊 **Gráficos de desempenho e estatísticas** (média, moda, mediana, desvio padrão)

Os dados são enviados para a **API central**, armazenados em um banco de dados e exibidos de forma visual e intuitiva no **aplicativo mobile**, permitindo que o ciclista acompanhe sua performance.

O projeto integra conhecimentos das seguintes áreas:

* 💻 **Programação Web e Mobile**
* ⚙️ **IoT e sensores físicos**
* 🗄️ **Banco de Dados**
* 🧩 **Engenharia de Software**
* 🎨 **UX/UI Design**

---

## 🧩 Funcionalidades Implementadas

* ✅ **Cadastro de Usuários e Bicicletas**
* ✅ **Cadastro do projeto físico da bike**
* ✅ **Runs em tempo real** (velocidade instantânea, média e registro de pulsos do sensor Hall)
* ✅ **Armazenamento de dados e histórico no banco de dados**
* ✅ **Exibição de estatísticas detalhadas e gráficos**
* ✅ **Interface web e mobile responsiva e intuitiva**
* ✅ **Sincronização completa entre dispositivo IoT, API e app mobile**

---

## 👥 Integrantes do Grupo

* 🧑‍💻 **Uriel Monte Paz de Araújo**
* 🧑‍💻 **Gabriel Andrade Aleixo**
* 🧑‍💻 **Hudson Ribeiro Bárbara Junior**

---

## 📄 Licença

Este projeto é de **uso acadêmico**, desenvolvido para fins educacionais no âmbito da disciplina de **Projeto Interdisciplinar** do curso **Desenvolvimento de Software Multiplataforma (DSM)** – *Fatec Franca*.

© 2025 – **Grupo 08 (DSM-G08-PI4-2025-2)**
