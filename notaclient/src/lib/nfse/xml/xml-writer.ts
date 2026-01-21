/**
 * Classe para construção de XML de forma estruturada
 */
export class XmlWriter {
  private parts: string[] = [];

  private escAttr(v: string): string {
    return this.sanitizeText(v).replace(/"/g, "&quot;");
  }

  private sanitizeText(input: string): string {
    if (!input) return "";
    // Remove acentos e normaliza para ASCII básico
    const noDiacritics = input.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
    // Normaliza espaços: converte NBSP, colapsa espaços/tabs e aplica trim
    const normalizedSpaces = noDiacritics
      .replace(/\u00A0/g, " ")
      .replace(/[\t ]+/g, " ")
      .trim();
    // Substitui & < > por entidades
    const xmlSafe = normalizedSpaces
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;");
    // Remove caracteres de controle exceto \n \r \t
    return xmlSafe.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, "");
  }

  decl(version = "1.0", encoding = "UTF-8"): void {
    this.parts.push(`<?xml version="${version}" encoding="${encoding}"?>`);
  }

  open(name: string, attrs?: Record<string, string>): void {
    if (attrs && Object.keys(attrs).length) {
      const a = Object.entries(attrs)
        .map(([k, v]) => `${k}="${this.escAttr(v)}"`)
        .join(" ");
      this.parts.push(`<${name} ${a}>`);
    } else {
      this.parts.push(`<${name}>`);
    }
  }

  close(name: string): void {
    this.parts.push(`</${name}>`);
  }

  text(txt: string): void {
    this.parts.push(this.sanitizeText(txt));
  }

  leaf(name: string, txt: string): void {
    this.open(name);
    this.text(txt);
    this.close(name);
  }

  build(): string {
    return this.parts.join("");
  }
}
