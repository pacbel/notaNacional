using System;

namespace API_NFSe.Application.DTOs.Nfse
{
    public sealed class ListarNotasEmitidasRequestDto
    {
        public string? PrestadorId { get; set; }
        public string? ChaveAcesso { get; set; }
        public string? Numero { get; set; }
        public int Page { get; set; } = 1;
        public int PageSize { get; set; } = 10;

        public void EnsureValidPagination()
        {
            if (Page <= 0)
            {
                throw new ArgumentOutOfRangeException(nameof(Page), "A página deve ser maior que zero.");
            }

            if (PageSize <= 0 || PageSize > 100)
            {
                throw new ArgumentOutOfRangeException(nameof(PageSize), "O tamanho da página deve estar entre 1 e 100.");
            }
        }
    }
}
