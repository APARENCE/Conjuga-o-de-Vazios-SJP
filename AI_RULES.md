# Regras de Desenvolvimento de IA para Sistema CAS - Gestão de Containers

Este documento descreve as tecnologias centrais e as regras específicas para o desenvolvimento dentro deste projeto, visando garantir consistência, manutenibilidade e adesão às melhores práticas.

## Visão Geral da Pilha de Tecnologia (Tech Stack)

*   **Framework Frontend:** React com TypeScript.
*   **Ferramenta de Build:** Vite.
*   **Estilização:** Tailwind CSS para uma abordagem utility-first.
*   **Biblioteca de UI:** shadcn/ui (construída sobre primitivos Radix UI).
*   **Roteamento:** React Router DOM.
*   **Gerenciamento de Estado/Dados:** TanStack Query (React Query).
*   **Ícones:** Lucide React.
*   **Gerenciamento de Formulários:** React Hook Form, validado usando Zod.
*   **Visualização de Dados:** Recharts.
*   **Processamento de Arquivos:** XLSX para importação e exportação de dados de planilhas.

## Regras de Uso de Bibliotecas

Para manter um código limpo e consistente, siga as regras abaixo ao implementar novos recursos ou modificar os existentes:

1.  **Componentes de UI e Estilização:**
    *   **Uso Obrigatório:** Sempre utilize os componentes fornecidos pelo `shadcn/ui` (ex: Button, Card, Table, Dialog) para elementos de interface padrão.
    *   **Estilização:** Toda a estilização deve ser feita usando classes do Tailwind CSS.
    *   **Customização:** Se um componente `shadcn/ui` precisar de modificação significativa, crie um novo componente em `src/components/` que envolva ou estenda o componente base.

2.  **Roteamento:**
    *   Utilize `react-router-dom` para toda a lógica de navegação. As rotas devem ser definidas centralmente em `src/App.tsx`.

3.  **Formulários e Validação:**
    *   **Formulários:** Use `react-hook-form` para gerenciar o estado e a submissão de formulários.
    *   **Validação:** Use `zod` para definição de esquema e validação, integrado através do `@hookform/resolvers`.

4.  **Gerenciamento de Dados Assíncronos:**
    *   Para busca, cache e gerenciamento de estado de servidor, utilize **TanStack Query** (`@tanstack/react-query`).

5.  **Notificações:**
    *   Use o hook `useToast` (implementação shadcn/ui) para notificações contextuais e temporárias (ex: sucesso/erro após uma ação).
    *   Use **Sonner** para notificações globais ou mais persistentes, se necessário.

6.  **Ícones:**
    *   Todos os ícones devem ser importados da biblioteca **Lucide React**.