export function sanitizacaoPaciente(paciente): any {
    const attributeSanitizations = {
      cpf: (value) => value.toString().replace(/[^0-9]/g, ''),
      nome: (value) => value.replace(/[^a-zA-Z-à-ú\s'-]/g, ''),
      email: (value) => value.trim(),
      telefone: (value) => value.replace(/[^0-9]/g, ''),
      endereco: {
            cep: (value) => value.toString().replace(/[^0-9]/g, ''),
            rua: (value) => value.replace(/[^a-zA-ZÀ-ú\s]/g, ''),
            estado: (value) => value.trim(),
            complemento: (value) => value.replace(/[^a-zA-ZÀ-ú\s]/g, ''),
            numero: (value) => parseInt(value, 10),
      },
    };
 
     const pacienteSanitizado = {};
  
     for (const key in paciente) {
           if (paciente.hasOwnProperty(key)) {
                 const value = paciente[key];
                 const sanizationRule = attributeSanitizations[key];
  
                 if (sanizationRule) {
                       if (typeof sanizationRule === 'object') {
                             pacienteSanitizado[key] = {};
  
                             for (const subKey in sanizationRule) {
                                   if (value.hasOwnProperty(subKey)) {
                                     pacienteSanitizado[key][subKey] = sanizationRule[subKey](value[subKey]);
                                   }
                             }
                       } else {
                             pacienteSanitizado[key] = sanizationRule(value);
                       }
                 } else {
                       pacienteSanitizado[key] = value;
                 }
           }
     }
  
     return pacienteSanitizado;
   }  