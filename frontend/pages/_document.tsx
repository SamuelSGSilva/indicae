import { Html, Head, Main, NextScript } from 'next/document'

export default function Document() {
  return (
    <Html lang="pt-BR">
      <Head>
        <meta charSet="utf-8" />
        <meta name="description" content="Indicae — A Malha Neural de Talentos. HR-Tech baseada em Identidade Verificada, Banco de Grafos 3D e IA Generativa." />
        <meta property="og:title" content="Indicae — A Malha Neural de Talentos" />
        <meta property="og:description" content="O Tinder dos Mentores. Conectamos talentos verificados a recrutadores via grafos e IA." />
        <link rel="icon" href="/favicon.ico" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      </Head>
      <body>
        <Main />
        <NextScript />
      </body>
    </Html>
  )
}
