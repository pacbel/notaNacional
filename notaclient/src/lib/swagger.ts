export const swaggerSpec = {
  openapi: "3.0.0",
  info: {
    title: "NotaClient Public API",
    version: "1.0.0",
    description: "Documentação da API pública do NotaClient",
  },
  tags: [
    {
      name: "Public",
      description: "Endpoints públicos para integração externa",
    },
  ],
  components: {
    securitySchemes: {
      basicAuth: {
        type: "http",
        scheme: "basic",
      },
    },
    schemas: {
      PublicTomadorCreate: {
        type: "object",
        required: [
          "tipoDocumento",
          "documento",
          "nomeRazaoSocial",
          "email",
          "codigoMunicipio",
          "cidade",
          "estado",
          "cep",
          "logradouro",
          "numero",
          "bairro",
        ],
        properties: {
          tipoDocumento: { type: "string", enum: ["CPF", "CNPJ"] },
          documento: { type: "string", description: "Apenas números" },
          nomeRazaoSocial: { type: "string" },
          email: { type: "string", format: "email" },
          telefone: { type: "string", nullable: true },
          inscricaoMunicipal: { type: "string", nullable: true },
          codigoMunicipio: { type: "string", pattern: "^\\d{7}$" },
          cidade: { type: "string" },
          estado: { type: "string", pattern: "^[A-Z]{2}$" },
          cep: { type: "string", pattern: "^\\d{8}$" },
          logradouro: { type: "string" },
          numero: { type: "string" },
          complemento: { type: "string", nullable: true },
          bairro: { type: "string" },
        },
      },
      PublicDpsCreate: {
        type: "object",
        required: ["prestadorId", "tomadorId", "servicoId", "competencia", "dataEmissao"],
        properties: {
          prestadorId: { type: "string", format: "uuid" },
          tomadorId: { type: "string", format: "uuid" },
          servicoId: { type: "string", format: "uuid" },
          competencia: { type: "string", format: "date-time" },
          dataEmissao: { type: "string", format: "date-time" },
          tipoEmissao: { type: "integer", minimum: 0, maximum: 9 },
          observacoes: { type: "string", nullable: true },
        },
      },
      PublicTomadorWithDps: {
        type: "object",
        required: ["tomador", "dps"],
        properties: {
          tomador: { $ref: "#/components/schemas/PublicTomadorCreate" },
          dps: {
            allOf: [
              { $ref: "#/components/schemas/PublicDpsCreate" },
              {
                type: "object",
                properties: {
                  tomadorId: { readOnly: true, nullable: true },
                },
              },
            ],
          },
        },
      },
    },
  },
  security: [{ basicAuth: [] }],
  paths: {
    "/api/public/tomadores": {
      post: {
        tags: ["Public"],
        summary: "Cria um novo tomador",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/PublicTomadorCreate" },
            },
          },
        },
        responses: {
          "201": {
            description: "Tomador criado",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    id: { type: "string", format: "uuid" },
                  },
                },
              },
            },
          },
          "400": { description: "Dados inválidos" },
          "409": { description: "Documento já cadastrado" },
        },
      },
    },
    "/api/public/dps": {
      post: {
        tags: ["Public"],
        summary: "Cria uma DPS para um tomador existente",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/PublicDpsCreate" },
            },
          },
        },
        responses: {
          "201": {
            description: "DPS criada",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    id: { type: "string", format: "uuid" },
                  },
                },
              },
            },
          },
          "400": { description: "Dados inválidos" },
          "404": { description: "Relacionamento inexistente" },
        },
      },
    },
    "/api/public/tomadores-com-dps": {
      post: {
        tags: ["Public"],
        summary: "Cria tomador e DPS em uma única chamada",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/PublicTomadorWithDps" },
            },
          },
        },
        responses: {
          "201": {
            description: "Tomador e DPS criados",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    tomadorId: { type: "string", format: "uuid" },
                    dpsId: { type: "string", format: "uuid" },
                  },
                },
              },
            },
          },
          "400": { description: "Dados inválidos" },
        },
      },
    },
  },
} as const;

export function getSwaggerSpec() {
  return swaggerSpec;
}
