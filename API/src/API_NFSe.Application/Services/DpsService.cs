using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using API_NFSe.Application.DTOs.Dps;
using API_NFSe.Application.Interfaces;
using API_NFSe.Domain.Entities;
using API_NFSe.Domain.Interfaces;
using API_NFSe.Domain.ValueObjects;
using AutoMapper;

namespace API_NFSe.Application.Services
{
    public class DpsService : IDpsService
    {
        private readonly IDpsRepository _dpsRepository;
        private readonly IPrestadorRepository _prestadorRepository;
        private readonly IMapper _mapper;

        public DpsService(IDpsRepository dpsRepository, IPrestadorRepository prestadorRepository, IMapper mapper)
        {
            _dpsRepository = dpsRepository;
            _prestadorRepository = prestadorRepository;
            _mapper = mapper;
        }

        public async Task<DpsDto> CriarAsync(string usuarioReferencia, Guid prestadorId, Guid usuarioId, CriarDpsRequestDto request)
        {
            if (string.IsNullOrWhiteSpace(usuarioReferencia))
            {
                throw new ArgumentException("Usuário inválido.", nameof(usuarioReferencia));
            }

            if (prestadorId == Guid.Empty)
            {
                throw new ArgumentException("Prestador inválido.", nameof(prestadorId));
            }

            _ = await ObterPrestadorAtivoAsync(prestadorId);

            var existente = await _dpsRepository.ObterPorIdentificadorAsync(prestadorId, request.Identificador);
            if (existente != null)
            {
                throw new InvalidOperationException("Já existe um DPS com o identificador informado.");
            }

            var regimeTributario = new DpsRegimeTributario(
                request.RegimeTributario.OptanteSimplesNacional,
                request.RegimeTributario.RegimeEspecial);

            var enderecoTomador = new Endereco(
                request.Tomador.Endereco.Logradouro,
                request.Tomador.Endereco.Numero,
                request.Tomador.Endereco.Complemento,
                request.Tomador.Endereco.Bairro,
                request.Tomador.Endereco.CodigoMunicipioIbge,
                request.Tomador.Endereco.Uf,
                request.Tomador.Endereco.Cep);

            var tomador = new DpsTomador(
                request.Tomador.TipoDocumento,
                request.Tomador.Documento,
                request.Tomador.Nome,
                request.Tomador.Email,
                request.Tomador.Telefone,
                enderecoTomador);

            var servico = new DpsServico(
                request.Servico.CodigoLocalPrestacao,
                request.Servico.CodigoTributacaoNacional,
                request.Servico.CodigoTributacaoMunicipal,
                request.Servico.DescricaoServico,
                request.Servico.InformacoesComplementares);

            var totaisTributos = new DpsTributosTotais(
                request.Valores.Tributos.Totais.Federal,
                request.Valores.Tributos.Totais.Estadual,
                request.Valores.Tributos.Totais.Municipal);

            var tributos = new DpsTributos(
                request.Valores.Tributos.IssRetido,
                request.Valores.Tributos.TipoRetencaoIss,
                totaisTributos);

            var valores = new DpsValores(request.Valores.ValorServico, tributos);

            var status = string.IsNullOrWhiteSpace(request.Status) ? "Pendente" : request.Status.Trim();

            var dps = new Dps(
                prestadorId,
                usuarioId,
                request.Versao,
                request.Identificador,
                request.Ambiente,
                request.DataHoraEmissao,
                request.VersaoAplicacao,
                request.Serie,
                request.NumeroDps,
                request.DataCompetencia,
                request.TipoEmissao,
                request.CodigoLocalEmissao,
                regimeTributario,
                tomador,
                servico,
                valores,
                request.XmlAssinado,
                request.JsonEntrada,
                status);

            if (!string.IsNullOrWhiteSpace(request.DigestValue))
            {
                dps.AtualizarAssinatura(request.XmlAssinado, request.DigestValue);
            }

            if (request.DataEnvio.HasValue)
            {
                dps.DefinirEnvio(request.DataEnvio.Value);
            }

            if (!string.IsNullOrWhiteSpace(request.Protocolo) || !string.IsNullOrWhiteSpace(request.MensagemErro) || request.DataRetorno.HasValue)
            {
                dps.AtualizarRetorno(status, request.Protocolo, request.MensagemErro, request.DataRetorno);
            }

            await _dpsRepository.AdicionarAsync(dps);
            await _dpsRepository.SaveChangesAsync();

            return _mapper.Map<DpsDto>(dps);
        }

        public async Task<DpsDto?> ObterPorIdAsync(string usuarioReferencia, Guid prestadorId, Guid dpsId)
        {
            if (string.IsNullOrWhiteSpace(usuarioReferencia))
            {
                throw new ArgumentException("Usuário inválido.", nameof(usuarioReferencia));
            }

            if (prestadorId == Guid.Empty)
            {
                throw new ArgumentException("Prestador inválido.", nameof(prestadorId));
            }

            _ = await ObterPrestadorAtivoAsync(prestadorId);

            var dps = await _dpsRepository.ObterPorIdAsync(dpsId);
            if (dps == null || dps.PrestadorId != prestadorId)
            {
                return null;
            }

            return _mapper.Map<DpsDto>(dps);
        }

        public async Task<IEnumerable<DpsDto>> ObterTodosAsync(string usuarioReferencia, Guid prestadorId, string? status = null, DateTimeOffset? dataInicio = null, DateTimeOffset? dataFim = null)
        {
            if (string.IsNullOrWhiteSpace(usuarioReferencia))
            {
                throw new ArgumentException("Usuário inválido.", nameof(usuarioReferencia));
            }

            if (prestadorId == Guid.Empty)
            {
                throw new ArgumentException("Prestador inválido.", nameof(prestadorId));
            }

            _ = await ObterPrestadorAtivoAsync(prestadorId);

            IEnumerable<Dps> dpsList;

            if (!string.IsNullOrWhiteSpace(status))
            {
                dpsList = await _dpsRepository.ObterPorStatusAsync(prestadorId, status);
            }
            else if (dataInicio.HasValue || dataFim.HasValue)
            {
                if (!dataInicio.HasValue || !dataFim.HasValue)
                {
                    throw new ArgumentException("Os filtros de data exigem data inicial e final.");
                }

                dpsList = await _dpsRepository.ObterPorPeriodoAsync(prestadorId, dataInicio.Value, dataFim.Value);
            }
            else
            {
                dpsList = await _dpsRepository.ObterTodosPorPrestadorAsync(prestadorId);
            }

            return _mapper.Map<IEnumerable<DpsDto>>(dpsList);
        }

        private async Task<Prestador> ObterPrestadorAtivoAsync(Guid prestadorId)
        {
            var prestador = await _prestadorRepository.ObterPorIdAsync(prestadorId);
            if (prestador is null)
            {
                throw new UnauthorizedAccessException("Prestador não encontrado ou inativo para o usuário informado.");
            }

            return prestador;
        }
    }
}
