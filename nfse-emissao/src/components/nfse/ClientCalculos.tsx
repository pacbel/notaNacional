'use client';

import { useEffect } from 'react';
import { useCalculos, Servico } from './useCalculos';

interface ClientCalculosProps {
  servicos: Servico[];
}

export function ClientCalculos({ servicos }: ClientCalculosProps) {
  useCalculos({ servicos });

  // Efeito para debug
  useEffect(() => {
  }, [servicos]);
  
  // Efeito para controlar a exibição dos campos de intermediário
  useEffect(() => {
    const radioButtons = document.querySelectorAll('input[name="tipoIntermediario"]');
    const intermediarioCampos = document.getElementById('intermediario-campos');
    
    function handleRadioChange(event: Event) {
      const target = event.target as HTMLInputElement;
      if (intermediarioCampos) {
        if (target.value === 'naoExiste') {
          intermediarioCampos.style.display = 'none';
          
          // Limpar os campos de intermediário
          const razaoSocialInput = document.querySelector('input[name="intermediarioRazaoSocial"]') as HTMLInputElement;
          const cpfCnpjInput = document.querySelector('input[name="intermediarioCpfCnpj"]') as HTMLInputElement;
          const inscricaoMunicipalInput = document.querySelector('input[name="intermediarioInscricaoMunicipal"]') as HTMLInputElement;
          
          if (razaoSocialInput) razaoSocialInput.value = '';
          if (cpfCnpjInput) cpfCnpjInput.value = '';
          if (inscricaoMunicipalInput) inscricaoMunicipalInput.value = '';
        } else {
          intermediarioCampos.style.display = 'grid';
        }
      }
    }
    
    // Adicionar event listeners aos radio buttons
    radioButtons.forEach(radio => {
      radio.addEventListener('change', handleRadioChange);
    });
    
    // Verificar o estado inicial
    const checkedRadio = document.querySelector('input[name="tipoIntermediario"]:checked') as HTMLInputElement;
    if (checkedRadio && checkedRadio.value === 'naoExiste' && intermediarioCampos) {
      intermediarioCampos.style.display = 'none';
    }
    
    // Cleanup
    return () => {
      radioButtons.forEach(radio => {
        radio.removeEventListener('change', handleRadioChange);
      });
    };
  }, []);
  
  return (
    <div>
      <div style={{ display: 'none' }} id="calculos-inicializados">
        Cálculos inicializados
      </div>
    </div>
  );
}
