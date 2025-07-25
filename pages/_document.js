import Document, { Html, Head, Main, NextScript } from 'next/document';

class MyDocument extends Document {
  render() {
    return (
      <Html lang="zh-CN">
        <Head>
          <link rel="preconnect" href="https://fonts.googleapis.com" />
          <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
          <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&family=Poppins:wght@400;500;600;700&display=swap" rel="stylesheet" />
          <script defer src="https://analytics.ravelloh.top/script.js" data-website-id="8ef18ba2-4313-457b-b6f1-a36ef1e1a27c"></script>
          <link rel="manifest" href="/site.webmanifest" />
          <meta name="theme-color" content="#ffffff" />
          <script src="/register-sw.js" defer></script>
        </Head>
        <body>
          <Main />
          <NextScript />
        </body>
      </Html>
    );
  }
}

export default MyDocument;
