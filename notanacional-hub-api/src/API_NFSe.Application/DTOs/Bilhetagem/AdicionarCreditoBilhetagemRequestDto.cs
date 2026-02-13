using System.ComponentModel.DataAnnotations;

namespace API_NFSe.Application.DTOs.Bilhetagem
{
    public class AdicionarCreditoBilhetagemRequestDto
    {
        [Range(1, int.MaxValue, ErrorMessage = "A quantidade de créditos deve ser maior que zero.")]
        public int Quantidade { get; set; }

        [StringLength(250)]
        public string? Observacao { get; set; }
    }
}
