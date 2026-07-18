/**
 * Página de Termos de Uso
 * ---------------------------------------------------------------
 * As "regras da casa": o que é permitido ao usar o NEXO e o que
 * esperamos de quem comenta. Texto de MVP, em linguagem clara. NÃO é
 * aconselhamento jurídico.
 * ---------------------------------------------------------------
 */

import type { Metadata } from "next";
import PaginaLegal from "@/components/PaginaLegal";

export const metadata: Metadata = {
  title: "Termos de Uso — NEXO",
  description:
    "As regras para usar o NEXO: conta, comentários, conteúdo de terceiros e responsabilidades.",
};

const EMAIL_CONTATO = "rosamaria.ppmiranda@gmail.com";

export default function PaginaTermos() {
  return (
    <PaginaLegal titulo="Termos de Uso" atualizadoEm="18 de julho de 2026">
      <p>
        Estes termos definem as regras para usar o NEXO. Ao acessar o site ou
        criar uma conta, você concorda com eles. Se não concordar, tudo bem —
        basta não usar o serviço.
      </p>

      <h2>1. O que é o NEXO</h2>
      <p>
        O NEXO é um portal que reúne, organiza e recomenda notícias de ciência
        e tecnologia de diversos portais, com um feed personalizado por
        interações. É um projeto em fase inicial (MVP), oferecido “como está”.
      </p>

      <h2>2. Sua conta</h2>
      <ul>
        <li>Você é responsável por manter sua senha em segurança;</li>
        <li>Use um e-mail válido e informações verdadeiras;</li>
        <li>
          Cada pessoa é responsável pela atividade feita na própria conta.
        </li>
      </ul>

      <h2>3. Regras dos comentários</h2>
      <p>Ao comentar, você concorda em NÃO publicar:</p>
      <ul>
        <li>Ofensas, discurso de ódio, assédio ou ameaças;</li>
        <li>Spam, propaganda ou links de golpe;</li>
        <li>Conteúdo ilegal ou que viole direitos de terceiros;</li>
        <li>Informação falsa apresentada como fato para enganar leitores.</li>
      </ul>
      <p>
        Usamos filtros automáticos e podemos remover comentários ou suspender
        contas que violem estas regras. Você pode apagar seus próprios
        comentários a qualquer momento.
      </p>

      <h2>4. Conteúdo de terceiros</h2>
      <p>
        As notícias exibidas pertencem aos seus portais de origem, sempre
        creditados com link para a matéria original. O NEXO não se
        responsabiliza pela exatidão do conteúdo produzido por terceiros —
        recomendamos ler a fonte para a informação completa.
      </p>

      <h2>5. Uso responsável</h2>
      <p>
        Você concorda em não tentar sobrecarregar, invadir ou burlar os
        sistemas do site, nem coletar dados de outras pessoas sem autorização.
      </p>

      <h2>6. Sem garantias</h2>
      <p>
        O serviço é fornecido “no estado em que se encontra”. Fazemos o possível
        para mantê-lo no ar e correto, mas não garantimos funcionamento
        ininterrupto nem ausência de erros.
      </p>

      <h2>7. Mudanças e contato</h2>
      <p>
        Podemos atualizar estes termos conforme o projeto evolui. Dúvidas?
        Escreva para <a href={`mailto:${EMAIL_CONTATO}`}>{EMAIL_CONTATO}</a>.
      </p>
    </PaginaLegal>
  );
}
