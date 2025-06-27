-- DROP DATABASE testemed;
-- CREATE DATABASE testemed;
USE testemed;
-- DROP TABLE paciente;
-- CREATE TABLE paciente (
--     id VARCHAR(36) PRIMARY KEY,
--     cpf VARCHAR(11) UNIQUE NOT NULL,
--     nome VARCHAR(255) NOT NULL,
--     email VARCHAR(255) UNIQUE NOT NULL,
--     estaAtivo BOOLEAN NOT NULL,
--     senha VARCHAR(255) NOT NULL,
--     telefone VARCHAR(20) NOT NULL,
--     possuiPlanoSaude BOOLEAN NOT NULL,
--     planosSaude TEXT,
--     historico TEXT,
--     imagemUrl TEXT,
--     role VARCHAR(50) NOT NULL
-- );
INSERT INTO paciente (id, cpf, nome, email, estaAtivo, senha, telefone, possuiPlanoSaude, planosSaude, historico, imagemUrl, role)
VALUES 
  (uuid(), '78160552002', 'Emerson Laranja', 'emerson@email.com', true, 'Senh@forte123', '34999335522', true, '[2]', "['sinusite,moderado']", 'https://img.freepik.com/fotos-gratis/designer-trabalhando-no-modelo-3d_23-2149371896.jpg', 'PACIENTE'),
  (uuid(), '12345678904', 'Joana Silva', 'joana@email.com', true, 'MinhaSenha123', '34999887766', true, '[1, 3]', "['rinite,leve', 'asma,médio']", 'https://img.freepik.com/fotos-premium/retrato-de-uma-jovem-brasileira-sorridente-em-um-vestido-mexicano-ai-gerado_632984-139.jpg', 'PACIENTE');
SELECT 
CONCAT('KILL ', id, ';') 
FROM INFORMATION_SCHEMA.PROCESSLIST 
WHERE User = 'root' 
AND Host = 'db'
AND db = 'testemed';
