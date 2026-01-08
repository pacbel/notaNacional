# Relatório de Análise de Aderência – Emissão de NFSe PBH

## 1. Abas e Campos do Sistema PBH

### Abas
- Tomador do(s) Serviço(s)
- Identificação do(s) Serviço(s)
- Valores
- Intermediário do(s) Serviço(s)
- Construção Civil

### Principais Campos
- **Tomador:** CPF/CNPJ, Inscrição Municipal, Razão Social, Endereço, Município (busca), Telefone, E-mail
- **Identificação do Serviço:** Discriminação, Código de Tributação (select), Item da Lista de Serviços (select), Natureza da Operação (select), Regime Especial de Tributação (select), Município do ISSQN (busca)
- **Valores:** Valor Total, Deduções, Descontos, Retenções (INSS, IR, PIS, Cofins, CSLL, Outras), ISS Retido (Sim/Não)
- **Intermediário:** CPF/CNPJ, Inscrição Municipal, Razão Social
- **Construção Civil:** Matrícula CEI, ART

---

## 2. Situação Atual do Sistema Pacbel

- **Tomador:** Todos os campos implementados, incluindo busca de município
- **Identificação do Serviço:** Discriminação, código de tributação, item da lista (preenchido automaticamente), natureza da operação, regime especial, município do ISSQN (busca)
- **Valores:** Todos os campos tributários e descontos, cálculos automáticos, validação de formato
- **Intermediário:** Campos presentes, integração a conferir
- **Construção Civil:** Matrícula CEI e ART presentes, obrigatoriedade condicional a conferir
- **Validações:** Máscaras, obrigatoriedade, feedback, exportação PDF, relatórios, payloads salvos, upload de logomarca, controle de acesso, autenticação JWT, scripts de seed, integração banco, logs, relatórios, filtros, exportação PDF, payloads salvos, controle de acesso, autenticação JWT, scripts de seed, integração banco, logs

---

## 3. Pontos de Atenção e Ajustes Necessários

1. **Item da Lista de Serviços:**
   - Certificar que exibe código e descrição conforme PBH
   - Preenchimento automático, mas visualização clara

2. **Intermediário do Serviço:**
   - Conferir obrigatoriedade e integração com API

3. **Construção Civil:**
   - Matrícula CEI e ART obrigatórios apenas se "Construção Civil" estiver ativa
   - Validação condicional

4. **Natureza da Operação:**
   - Todas as opções do PBH disponíveis

5. **Regime Especial de Tributação:**
   - Opções idênticas às do PBH

6. **Validação de Campos Obrigatórios:**
   - Conferir equivalência dos campos obrigatórios

7. **Formatação de Campos:**
   - Máscaras e validação para CNPJ, CEP, telefone

8. **Mensagens de erro:**
   - Clareza e aderência ao padrão PBH

9. **Aba Valores:**
   - Todos os campos de retenções e descontos visíveis

10. **Exportação PDF:**
    - Layout e nomes de campos conforme PBH

---

## 4. Resumo de Ações para Finalização

1. Revisar todos os selects (Natureza da Operação, Regime Especial, etc.)
2. Ajustar campo "Item da Lista de Serviços" para exibir código e descrição
3. Validar obrigatoriedade condicional de Construção Civil e Intermediário
4. Testar fluxos de validação de obrigatoriedade
5. Revisar layout/nome dos campos no PDF/exportação
6. Testar casos-limite (tomador sem inscrição, serviço sem descontos, etc.)
7. Revisar mensagens de erro
8. Validar integração dos dados enviados à API

---

## 5. Conclusão

O sistema está praticamente aderente ao PBH. Os ajustes finais envolvem revisão de obrigatoriedade condicional, opções de selects, exibição de campos automáticos e validação de obrigatoriedade. Recomenda-se checklist final e testes ponta a ponta para garantir conformidade total.
