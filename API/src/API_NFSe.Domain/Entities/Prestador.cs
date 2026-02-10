using System;
using System.Collections.Generic;
using API_NFSe.Domain.Common;
using API_NFSe.Domain.ValueObjects;

namespace API_NFSe.Domain.Entities
{
    public class Prestador : EntityBase
    {
        public string Cnpj { get; private set; } = string.Empty;
        public string RazaoSocial { get; private set; } = string.Empty;
        public string NomeFantasia { get; private set; } = string.Empty;
        public string InscricaoMunicipal { get; private set; } = string.Empty;
        public string? InscricaoEstadual { get; private set; }
        public string? Telefone { get; private set; }
        public string? Email { get; private set; }
        public string? Website { get; private set; }
        public Endereco Endereco { get; private set; } = null!;
        public Guid CriadoPorUsuarioId { get; private set; }
        public Guid? AtualizadoPorUsuarioId { get; private set; }

        public ICollection<Dps> Dps { get; private set; } = new List<Dps>();
        public PrestadorConfiguracao? Configuracao { get; private set; }
        public ICollection<PrestadorCertificado> Certificados { get; private set; } = new List<PrestadorCertificado>();
        public ICollection<Usuario> Usuarios { get; private set; } = new List<Usuario>();
        public ICollection<RobotClient> RobotClients { get; private set; } = new List<RobotClient>();
        public ICollection<BilhetagemLancamento> BilhetagemLancamentos { get; private set; } = new List<BilhetagemLancamento>();

        protected Prestador() { }

        public Prestador(
            string cnpj,
            string razaoSocial,
            string nomeFantasia,
            string inscricaoMunicipal,
            string? inscricaoEstadual,
            string? telefone,
            string? email,
            string? website,
            Endereco endereco,
            Guid criadoPorUsuarioId)
        {
            if (string.IsNullOrWhiteSpace(cnpj))
            {
                throw new ArgumentException("O CNPJ é obrigatório", nameof(cnpj));
            }

            if (string.IsNullOrWhiteSpace(razaoSocial))
            {
                throw new ArgumentException("A razão social é obrigatória", nameof(razaoSocial));
            }

            if (string.IsNullOrWhiteSpace(nomeFantasia))
            {
                throw new ArgumentException("O nome fantasia é obrigatório", nameof(nomeFantasia));
            }

            if (string.IsNullOrWhiteSpace(inscricaoMunicipal))
            {
                throw new ArgumentException("A inscrição municipal é obrigatória", nameof(inscricaoMunicipal));
            }

            Cnpj = cnpj.Trim();
            RazaoSocial = razaoSocial.Trim();
            NomeFantasia = nomeFantasia.Trim();
            InscricaoMunicipal = inscricaoMunicipal.Trim();
            InscricaoEstadual = string.IsNullOrWhiteSpace(inscricaoEstadual) ? null : inscricaoEstadual.Trim();
            Telefone = string.IsNullOrWhiteSpace(telefone) ? null : telefone.Trim();
            Email = string.IsNullOrWhiteSpace(email) ? null : email.Trim();
            Website = string.IsNullOrWhiteSpace(website) ? null : website.Trim();
            Endereco = endereco ?? throw new ArgumentNullException(nameof(endereco));
            CriadoPorUsuarioId = criadoPorUsuarioId;
        }

        public void AtualizarDadosCadastrais(
            string cnpj,
            string razaoSocial,
            string nomeFantasia,
            string inscricaoMunicipal,
            string? inscricaoEstadual,
            string? telefone,
            string? email,
            string? website,
            Endereco endereco,
            Guid atualizadoPorUsuarioId)
        {
            Cnpj = string.IsNullOrWhiteSpace(cnpj) ? Cnpj : cnpj.Trim();
            RazaoSocial = string.IsNullOrWhiteSpace(razaoSocial) ? RazaoSocial : razaoSocial.Trim();
            NomeFantasia = string.IsNullOrWhiteSpace(nomeFantasia) ? NomeFantasia : nomeFantasia.Trim();
            InscricaoMunicipal = string.IsNullOrWhiteSpace(inscricaoMunicipal) ? InscricaoMunicipal : inscricaoMunicipal.Trim();
            InscricaoEstadual = string.IsNullOrWhiteSpace(inscricaoEstadual) ? null : inscricaoEstadual.Trim();
            Telefone = string.IsNullOrWhiteSpace(telefone) ? null : telefone.Trim();
            Email = string.IsNullOrWhiteSpace(email) ? null : email.Trim();
            Website = string.IsNullOrWhiteSpace(website) ? null : website.Trim();
            Endereco = endereco ?? Endereco;
            AtualizadoPorUsuarioId = atualizadoPorUsuarioId;
            AtualizarDataAtualizacao();
        }

        public void DefinirAtualizadoPor(Guid usuarioId)
        {
            AtualizadoPorUsuarioId = usuarioId;
        }

        public void DefinirConfiguracao(PrestadorConfiguracao configuracao)
        {
            Configuracao = configuracao ?? throw new ArgumentNullException(nameof(configuracao));
            AtualizarDataAtualizacao();
        }

        public RobotClient CriarClienteRobotico(
            string nome,
            string clientId,
            string secretHash,
            string? scopes,
            string? role = null)
        {
            var cliente = new RobotClient(nome, clientId, secretHash, Id, scopes, role);
            RobotClients.Add(cliente);
            AtualizarDataAtualizacao();
            return cliente;
        }
    }
}
