using API_NFSe.Application.DTOs.Bilhetagem;
using API_NFSe.Application.DTOs.Dps;
using API_NFSe.Application.DTOs.Prestadores;
using API_NFSe.Application.DTOs.Usuarios;
using API_NFSe.Domain.Entities;
using API_NFSe.Domain.ValueObjects;
using AutoMapper;

namespace API_NFSe.Application.Mappings
{
    public class MappingProfile : Profile
    {
        public MappingProfile()
        {
            CreateMap<Usuario, UsuarioDto>()
                .ForMember(dest => dest.Nome, opt => opt.Ignore())
                .ForMember(dest => dest.Email, opt => opt.Ignore());

            CreateMap<Endereco, API_NFSe.Application.DTOs.Prestadores.EnderecoDto>();
            CreateMap<PrestadorConfiguracao, PrestadorConfiguracaoDto>();
            CreateMap<Prestador, PrestadorDto>();

            CreateMap<DpsRegimeTributario, RegimeTributarioDto>();
            CreateMap<DpsTomador, TomadorDto>();
            CreateMap<Endereco, API_NFSe.Application.DTOs.Dps.EnderecoDto>();
            CreateMap<DpsServico, ServicoDto>();
            CreateMap<DpsTributosTotais, TributosTotaisDto>();
            CreateMap<DpsTributos, TributosDto>();
            CreateMap<DpsValores, ValoresDto>();
            CreateMap<Dps, DpsDto>();

            CreateMap<BilhetagemLancamento, BilhetagemLancamentoDto>();
        }
    }
}
