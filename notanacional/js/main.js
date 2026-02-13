document.addEventListener('DOMContentLoaded', function() {
  // Animar elementos ao rolar a página
  const animateOnScroll = function() {
    const elements = document.querySelectorAll('.fade-in');
    
    elements.forEach(element => {
      const elementPosition = element.getBoundingClientRect().top;
      const windowHeight = window.innerHeight;
      
      if (elementPosition < windowHeight - 100) {
        element.style.opacity = '1';
        element.style.transform = 'translateY(0)';
      }
    });
  };
  
  // Executar animação ao carregar a página
  animateOnScroll();
  
  // Executar animação ao rolar a página
  window.addEventListener('scroll', animateOnScroll);
  
  // Botão Voltar ao Topo
  const backToTopButton = document.getElementById('back-to-top');
  
  // Mostrar ou ocultar o botão com base na posição de rolagem
  const toggleBackToTopButton = function() {
    if (window.pageYOffset > 300) {
      backToTopButton.classList.add('active');
    } else {
      backToTopButton.classList.remove('active');
    }
  };
  
  // Verificar a posição de rolagem ao carregar a página
  toggleBackToTopButton();
  
  // Verificar a posição de rolagem ao rolar a página
  window.addEventListener('scroll', toggleBackToTopButton);
  
  // Rolar suavemente para o topo ao clicar no botão
  backToTopButton.addEventListener('click', function(e) {
    e.preventDefault();
    
    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    });
  });
  
  // Toggle para as perguntas frequentes
  const faqItems = document.querySelectorAll('.faq-item');
  
  faqItems.forEach(item => {
    const question = item.querySelector('.faq-question');
    
    question.addEventListener('click', () => {
      // Fechar todos os outros itens
      faqItems.forEach(otherItem => {
        if (otherItem !== item && otherItem.classList.contains('active')) {
          otherItem.classList.remove('active');
        }
      });
      
      // Alternar o estado do item atual
      item.classList.toggle('active');
    });
  });
  
  // Rolagem suave para links de âncora
  const smoothScrollLinks = document.querySelectorAll('a[href^="#"]');
  
  smoothScrollLinks.forEach(link => {
    link.addEventListener('click', function(e) {
      e.preventDefault();
      
      const targetId = this.getAttribute('href');
      const targetElement = document.querySelector(targetId);
      
      if (targetElement) {
        const headerHeight = document.querySelector('header').offsetHeight;
        const targetPosition = targetElement.getBoundingClientRect().top + window.pageYOffset - headerHeight;
        
        window.scrollTo({
          top: targetPosition,
          behavior: 'smooth'
        });
      }
    });
  });
  
  // Contador de estatísticas
  const startCounters = function() {
    const counters = document.querySelectorAll('.counter');
    
    counters.forEach(counter => {
      const target = parseInt(counter.getAttribute('data-target'));
      const duration = 2000; // 2 segundos
      const step = target / (duration / 16); // 60fps
      
      let current = 0;
      const updateCounter = function() {
        current += step;
        
        if (current < target) {
          counter.textContent = Math.floor(current);
          requestAnimationFrame(updateCounter);
        } else {
          counter.textContent = target;
        }
      };
      
      updateCounter();
    });
  };
  
  // Iniciar contadores quando a seção estiver visível
  const statsSection = document.querySelector('.stats');
  
  if (statsSection) {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          startCounters();
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.5 });
    
    observer.observe(statsSection);
  }
  
  // Menu móvel
  const mobileMenuToggle = document.querySelector('.mobile-menu-toggle');
  const navMenu = document.querySelector('.nav-menu');
  
  if (mobileMenuToggle && navMenu) {
    mobileMenuToggle.addEventListener('click', function() {
      navMenu.classList.toggle('active');
      this.classList.toggle('active');
    });
  }
});
