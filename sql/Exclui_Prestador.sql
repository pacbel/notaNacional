
SET @prestadorId = (Select Id from Prestadores p Where p.Cnpj = '29583857000163');

DELETE FROM PrestadorConfiguracoes WHERE prestadorId = @prestadorId;
DELETE FROM RobotClients WHERE prestadorId = @prestadorId;
DELETE FROM Usuarios WHERE prestadorId = @prestadorId;
DELETE FROM PrestadorCertificados WHERE prestadorId = @prestadorId;
DELETE FROM Prestadores WHERE Id = @prestadorId;