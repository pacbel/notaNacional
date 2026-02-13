using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;

namespace API_NFSe.Application.DTOs.Emails
{
    public class EnviarEmailAttachmentDto
    {
        [StringLength(255)]
        public string? FileName { get; set; }

        [Required]
        public string ContentBase64 { get; set; } = string.Empty;

        [StringLength(255)]
        public string? ContentType { get; set; }
    }

    public class EnviarEmailRequestDto : IValidatableObject
    {
        [Required]
        [MinLength(1)]
        public List<string> Destinatarios { get; set; } = new();

        [Required]
        [StringLength(200)]
        public string Assunto { get; set; } = string.Empty;

        [Required]
        public string CorpoHtml { get; set; } = string.Empty;

        public List<EnviarEmailAttachmentDto>? Anexos { get; set; }

        public IEnumerable<ValidationResult> Validate(ValidationContext validationContext)
        {
            if (Destinatarios.Count == 0)
            {
                yield return new ValidationResult(
                    "Informe ao menos um destinatário.",
                    new[] { nameof(Destinatarios) }
                );
            }

            foreach (var destinatario in Destinatarios)
            {
                if (string.IsNullOrWhiteSpace(destinatario))
                {
                    yield return new ValidationResult(
                        "Destinatários não podem conter valores vazios.",
                        new[] { nameof(Destinatarios) }
                    );
                    break;
                }
            }

            if (string.IsNullOrWhiteSpace(Assunto))
            {
                yield return new ValidationResult(
                    "Assunto é obrigatório.",
                    new[] { nameof(Assunto) }
                );
            }

            if (string.IsNullOrWhiteSpace(CorpoHtml))
            {
                yield return new ValidationResult(
                    "Corpo do e-mail é obrigatório.",
                    new[] { nameof(CorpoHtml) }
                );
            }

            if (Anexos == null)
            {
                yield break;
            }

            for (var index = 0; index < Anexos.Count; index++)
            {
                if (Anexos[index] == null)
                {
                    yield return new ValidationResult(
                        "Anexo inválido informado.",
                        new[] { nameof(Anexos) + "[" + index + "]" }
                    );
                }
            }
        }
    }
}
