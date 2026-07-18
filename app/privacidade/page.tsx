/**
 * Página de Política de Privacidade
 * ---------------------------------------------------------------
 * Exigência da LGPD (Lei Geral de Proteção de Dados): como coletamos e
 * tratamos dados pessoais de quem usa o site. Texto adequado a um MVP,
 * em linguagem clara. NÃO é aconselhamento jurídico — quando o projeto
 * crescer, vale a revisão de um advogado.
 * ---------------------------------------------------------------
 */

import type { Metadata } from "next";
import PaginaLegal from "@/components/PaginaLegal";

export const metadata: Metadata = {
  title: "Política de Privacidade — NEXO",
  description:
    "Como o NEXO coleta, usa e protege seus dados pessoais, em conformidade com a LGPD.",
};

// E-mail de contato para assuntos de privacidade (o mesmo da responsável
// pelo projeto). Fica numa constante pra ser fácil trocar depois.
const EMAIL_CONTATO = "rosamaria.ppmiranda@gmail.com";

export default function PaginaPrivacidade() {
  return (
    <PaginaLegal titulo="Política de Privacidade" atualizadoEm="18 de julho de 2026">
      <p>
        Esta política explica, de forma direta, quais dados o NEXO coleta,
        por que coleta e o que você pode fazer a respeito. Ao usar o site,
        você concorda com o descrito aqui. Este documento segue a Lei Geral
        de Proteção de Dados (LGPD — Lei nº 13.709/2018).
      </p>

      <h2>1. Quem somos</h2>
      <p>
        O NEXO é um projeto de curadoria de notícias de ciência e tecnologia.
        A responsável pelo tratamento dos seus dados pode ser contatada pelo
        e-mail <a href={`mailto:${EMAIL_CONTATO}`}>{EMAIL_CONTATO}</a>.
      </p>

      <h2>2. Quais dados coletamos</h2>
      <ul>
        <li>
          <strong>Ler o feed é anônimo.</strong> Você pode navegar e ler as
          notícias sem criar conta e sem se identificar.
        </li>
        <li>
          <strong>Se você criar uma conta:</strong> guardamos seu e-mail, um
          nome de exibição e uma senha (armazenada de forma criptografada —
          nem nós conseguimos lê-la).
        </li>
        <li>
          <strong>Suas interações:</strong> curtidas, itens salvos,
          comentários e quais notícias você visualiza. Usamos isso para montar
          um feed personalizado para você.
        </li>
        <li>
          <strong>Cookies essenciais:</strong> um cookie de sessão para manter
          você conectado. Sem ele, o login não funcionaria.
        </li>
      </ul>

      <h2>3. Por que usamos esses dados</h2>
      <ul>
        <li>Manter você conectado à sua conta;</li>
        <li>
          Personalizar seu feed — recomendar notícias parecidas com o que você
          demonstrou interesse;
        </li>
        <li>Exibir e organizar comentários;</li>
        <li>Melhorar o site e entender o que é mais relevante.</li>
      </ul>

      <h2>4. Com quem compartilhamos</h2>
      <p>
        Não vendemos seus dados. Usamos o <strong>Supabase</strong> como
        infraestrutura de banco de dados e autenticação — ele processa os
        dados em nosso nome, sob contrato. Fora isso, seus dados não são
        repassados a terceiros, exceto se exigido por lei.
      </p>

      <h2>5. Notícias de outros portais</h2>
      <p>
        As manchetes e resumos exibidos vêm de portais de notícias externos,
        sempre com indicação da fonte e link para o conteúdo original. O NEXO
        organiza e recomenda esse conteúdo, mas os direitos de cada matéria
        pertencem ao portal de origem.
      </p>

      <h2>6. Seus direitos (LGPD)</h2>
      <p>Você pode, a qualquer momento:</p>
      <ul>
        <li>Acessar os dados que temos sobre você;</li>
        <li>Corrigir dados incorretos;</li>
        <li>Excluir sua conta e seus dados;</li>
        <li>Apagar seus próprios comentários diretamente no site.</li>
      </ul>
      <p>
        Para exercer qualquer um desses direitos, escreva para{" "}
        <a href={`mailto:${EMAIL_CONTATO}`}>{EMAIL_CONTATO}</a>.
      </p>

      <h2>7. Por quanto tempo guardamos</h2>
      <p>
        Mantemos seus dados enquanto sua conta existir. Se você pedir a
        exclusão, removemos seus dados pessoais dos nossos sistemas.
      </p>

      <h2>8. Mudanças nesta política</h2>
      <p>
        Podemos atualizar este texto conforme o projeto evolui. A data de
        “última atualização” no topo sempre indica a versão vigente.
      </p>
    </PaginaLegal>
  );
}
