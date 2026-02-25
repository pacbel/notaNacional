// Controllers/CryptoController.cs
using API_NFSe.Application.DTOs;
using API_NFSe.Application.Interfaces;
using Microsoft.AspNetCore.Mvc;

namespace API_NFSe.API.Controllers;

[ApiController]
[Route("api/[controller]")]
public class CryptoController : ControllerBase
{
    private readonly ICryptoService _cryptoService;

    public CryptoController(ICryptoService cryptoService)
    {
        _cryptoService = cryptoService;
    }

    [HttpPost("encrypt")]
    public IActionResult Encrypt([FromBody] CryptoRequestDto request)
    {
        if (string.IsNullOrEmpty(request.Text))
            return BadRequest("Text is required");

        var bytes = _cryptoService.Encrypt(request.Text);
        return Ok(new CryptoResponseDto(bytes));
    }

    [HttpPost("decrypt")]
    public IActionResult Decrypt([FromBody] CryptoResponseDto request)
    {
        var text = _cryptoService.Decrypt(request.Bytes);
        return Ok(new CryptoRequestDto(text));
    }
}