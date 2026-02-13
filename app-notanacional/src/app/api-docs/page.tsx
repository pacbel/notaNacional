"use client";

import { useEffect } from "react";
import Head from "next/head";

const SWAGGER_CSS = "https://unpkg.com/swagger-ui-dist@5/swagger-ui.css";
const SWAGGER_JS = "https://unpkg.com/swagger-ui-dist@5/swagger-ui-bundle.js";

export default function ApiDocsPage() {
  useEffect(() => {
    let scriptElement: HTMLScriptElement | null = null;
    let cssElement: HTMLLinkElement | null = null;

    const initialize = () => {
      if (typeof window === "undefined" || !(window as typeof window & { SwaggerUIBundle?: unknown }).SwaggerUIBundle) {
        return;
      }

      const SwaggerUIBundle = (window as typeof window & { SwaggerUIBundle: any }).SwaggerUIBundle;

      SwaggerUIBundle({
        url: "/api/docs",
        dom_id: "#swagger-ui",
        presets: [SwaggerUIBundle.presets.apis],
        layout: "BaseLayout",
      });
    };

    const ensureCss = () => {
      const existing = document.querySelector(`link[href='${SWAGGER_CSS}']`) as HTMLLinkElement | null;

      if (existing) {
        cssElement = existing;
        return;
      }

      cssElement = document.createElement("link");
      cssElement.rel = "stylesheet";
      cssElement.href = SWAGGER_CSS;
      document.head.appendChild(cssElement);
    };

    const loadScript = () => {
      scriptElement = document.createElement("script");
      scriptElement.src = SWAGGER_JS;
      scriptElement.async = true;
      scriptElement.onload = initialize;
      document.body.appendChild(scriptElement);
    };

    ensureCss();

    if (document.querySelector(`script[src='${SWAGGER_JS}']`)) {
      initialize();
    } else {
      loadScript();
    }

    return () => {
      if (scriptElement) {
        scriptElement.onload = null;
        scriptElement.remove();
      }

      if (cssElement && !document.querySelectorAll(`link[href='${SWAGGER_CSS}']`).length) {
        cssElement.remove();
      }
    };
  }, []);

  return (
    <>
      <Head>
        <title>NotaClient API Docs</title>
        <link rel="stylesheet" href={SWAGGER_CSS} />
      </Head>
      <main className="min-h-screen bg-slate-50 py-8">
        <div className="mx-auto w-full max-w-5xl rounded-lg bg-white p-6 shadow">
          <div id="swagger-ui" />
        </div>
      </main>
    </>
  );
}
