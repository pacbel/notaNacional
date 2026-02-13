SET @prestadorId = 'aba9ece5-97af-4480-b46a-da0a3c9f87cf';

DELETE FROM PrestadorConfiguracoes WHERE prestadorId = @prestadorId;
DELETE FROM RobotClients WHERE prestadorId = @prestadorId;
DELETE FROM Usuarios WHERE prestadorId = @prestadorId;
DELETE FROM PrestadorCertificados WHERE prestadorId = @prestadorId;
DELETE FROM Prestadores WHERE Id = @prestadorId;