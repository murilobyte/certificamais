'use strict';

/* ── Modal ── */
const overlay = document.getElementById('modalOverlay');

function openModal() {
  overlay.classList.add('is-open');
  document.body.style.overflow = 'hidden';
  // Move focus into modal for accessibility
  setTimeout(() => {
    const first = overlay.querySelector('input, button');
    if (first) first.focus();
  }, 380);
}

function closeModal() {
  overlay.classList.remove('is-open');
  document.body.style.overflow = '';
}

// Close on overlay click
overlay.addEventListener('click', function (e) {
  if (e.target === overlay) closeModal();
});

// Close on Escape
document.addEventListener('keydown', function (e) {
  if (e.key === 'Escape' && overlay.classList.contains('is-open')) {
    closeModal();
  }
});

/* ── Form ──
   O formulário é o embed oficial do RD Station (injetado no modal).
   Envio, validação, máscara e tela de sucesso são tratados pelo próprio RD. */

/* ── Parallax (hero background) ── */
const heroBg = document.getElementById('heroBg');
const hero   = document.getElementById('hero');

function onScroll() {
  const scrollY = window.scrollY || window.pageYOffset;
  if (scrollY > hero.offsetHeight) return;
  const shift = scrollY * 0.30;
  heroBg.style.transform = 'translateY(' + shift + 'px)';
}

/* ── Parallax (Section 5 SVG texture) — very slow vertical drift ── */
const certificaSection = document.getElementById('quem-somos');
const certificaSvgWrap = document.getElementById('certificaBgSvg');
const certificaSvg = certificaSvgWrap ? certificaSvgWrap.querySelector('svg') : null;

function onScrollSvg() {
  if (!certificaSvg || !certificaSection) return;
  const rect = certificaSection.getBoundingClientRect();
  // progress: -1 (entering) → 1 (leaving) relative to viewport center
  const progress = (rect.top + rect.height / 2 - window.innerHeight / 2) / window.innerHeight;
  const shift = progress * -36; // imperceptível, lento
  certificaSvg.style.transform = 'translate(-50%, calc(-50% + ' + shift + 'px))';
}

// Only apply parallax on non-reduced-motion + non-touch
const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
if (!prefersReducedMotion) {
  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('scroll', onScrollSvg, { passive: true });
  onScrollSvg();
}

/* ── Scroll-reveal: .reveal · .reveal-blur · .reveal-blur-scale ── */
const revealEls = document.querySelectorAll('.reveal, .reveal-blur, .reveal-blur-scale');

if ('IntersectionObserver' in window) {
  const io = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          io.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.12, rootMargin: '0px 0px -40px 0px' }
  );
  revealEls.forEach((el) => io.observe(el));

  /* ── Stagger groups: observe parent, delay each .stagger-item ── */
  const staggerContainers = document.querySelectorAll('.profile-section__right, #supportTrack, #portfolioList, #advantagesGrid, #faqList');
  const staggerIo = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          const items = entry.target.querySelectorAll('.stagger-item');
          items.forEach((item, i) => {
            setTimeout(() => item.classList.add('is-visible'), i * 130);
          });
          staggerIo.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.08, rootMargin: '0px 0px -40px 0px' }
  );
  staggerContainers.forEach((c) => staggerIo.observe(c));

} else {
  revealEls.forEach((el) => el.classList.add('is-visible'));
  document.querySelectorAll('.stagger-item').forEach((el) => el.classList.add('is-visible'));
}

/* ── Section 4: horizontal slider — progress bar · wheel · drag ── */
(function initSupportSlider() {
  const slider      = document.getElementById('supportSlider');
  const progressBar = document.getElementById('supportProgressBar');
  if (!slider) return;

  const maxScroll = () => slider.scrollWidth - slider.clientWidth;

  /* Progress bar follows scroll position */
  let ticking = false;
  function updateProgress() {
    const max = maxScroll();
    const ratio = max > 0 ? slider.scrollLeft / max : 0;
    // bar fills from a visible minimum (22%) up to 100%
    const pct = 22 + ratio * 78;
    progressBar.style.width = pct + '%';
    ticking = false;
  }
  slider.addEventListener('scroll', () => {
    if (!ticking) {
      window.requestAnimationFrame(updateProgress);
      ticking = true;
    }
  }, { passive: true });
  updateProgress();
  window.addEventListener('resize', updateProgress);

  /* Desktop: convert vertical wheel into horizontal scroll while over slider */
  slider.addEventListener('wheel', function (e) {
    const max = maxScroll();
    if (max <= 0) return;
    // Only hijack when the gesture is predominantly vertical
    if (Math.abs(e.deltaY) <= Math.abs(e.deltaX)) return;
    const atStart = slider.scrollLeft <= 0;
    const atEnd   = slider.scrollLeft >= max - 1;
    // Let the page scroll past the edges instead of trapping the wheel
    if ((atStart && e.deltaY < 0) || (atEnd && e.deltaY > 0)) return;
    e.preventDefault();
    slider.scrollLeft += e.deltaY;
  }, { passive: false });

  /* Desktop: click-and-drag — capture the pointer ONLY once a real drag
     begins, so a plain click still reaches the card buttons. */
  let isDown = false, startX = 0, startScroll = 0, moved = false, captured = false;
  slider.addEventListener('pointerdown', function (e) {
    if (e.pointerType === 'touch') return; // native touch handles itself
    if (e.button !== 0) return;            // left button only
    isDown = true; moved = false; captured = false;
    startX = e.clientX;
    startScroll = slider.scrollLeft;
  });
  slider.addEventListener('pointermove', function (e) {
    if (!isDown) return;
    const dx = e.clientX - startX;
    if (!moved && Math.abs(dx) > 6) {
      moved = true;
      slider.classList.add('is-dragging');
      try { slider.setPointerCapture(e.pointerId); captured = true; } catch (_) {}
    }
    if (moved) slider.scrollLeft = startScroll - dx;
  });
  function endDrag(e) {
    if (!isDown) return;
    isDown = false;
    slider.classList.remove('is-dragging');
    if (captured) {
      try { slider.releasePointerCapture(e.pointerId); } catch (_) {}
      captured = false;
    }
  }
  slider.addEventListener('pointerup', endDrag);
  slider.addEventListener('pointercancel', endDrag);
  // Prevent a drag from triggering the button click underneath
  slider.addEventListener('click', function (e) {
    if (moved) { e.preventDefault(); e.stopPropagation(); }
  }, true);
})();

/* ── Section 6: portfolio — interactive solution → pain ── */
(function initPortfolio() {
  const list = document.getElementById('portfolioList');
  const painText = document.getElementById('portfolioPainText');
  if (!list || !painText) return;

  const PAINS = {
    'certifica-id':       'Certificado digital com validade jurídica para empresas e profissionais — base de quase tudo no ambiente digital.',
    'certifica-signer':   'Fim do contrato em papel: assinaturas digitais com validade jurídica, fechando negócios mais rápido.',
    'certifica-up':       'Sem marketing digital, a empresa não é encontrada online e não sabe atrair clientes: presença digital fraca, sem tempo nem estrutura para produzir conteúdo e se comunicar com o mercado.',
    'certifica-ged':      'Documentos perdidos e arquivos físicos: tudo organizado e acessível digitalmente.',
    'certifica-sst':      'Empresa exposta a multas e passivos trabalhistas por não estar adequada às normas de Saúde e Segurança do Trabalho exigidas pelo eSocial.',
    'certifica-ponto':    'Controle de jornada de ponto manual e sujeito a erro, que vira risco trabalhista.',
    'certifica-erp':      'Empresa rodando em planilhas soltas, sem visão integrada do negócio.',
    'certifica-registro': 'Marca desprotegida e sujeita a ser copiada ou contestada — sem garantia jurídica sobre registro do próprio nome do negócio.',
    'certifica-nota':     'Softwares de emissão de notas completos e difíceis de usar: burocracia em vez de solução.'
  };

  const items = Array.from(list.querySelectorAll('.portfolio-section__item'));
  let current = null;

  function select(item) {
    if (!item || item === current) return;
    const key = item.getAttribute('data-solution');
    const text = PAINS[key];
    if (!text) return;

    items.forEach((el) => {
      const on = el === item;
      el.classList.toggle('is-active', on);
      el.setAttribute('aria-selected', on ? 'true' : 'false');
    });
    current = item;

    // animação de troca: fade-out → troca → fade-in
    painText.classList.add('is-switching');
    const swap = () => {
      painText.textContent = text;
      // força reflow para reiniciar a transição
      void painText.offsetWidth;
      painText.classList.remove('is-switching');
    };
    if (prefersReducedMotion) {
      swap();
    } else {
      setTimeout(swap, 180);
    }
  }

  // estado inicial
  current = items.find((el) => el.classList.contains('is-active')) || items[0];

  items.forEach((item, i) => {
    item.addEventListener('click', () => select(item));
    item.addEventListener('mouseenter', () => select(item));
    // navegação por teclado (setas)
    item.addEventListener('keydown', (e) => {
      let target = null;
      if (e.key === 'ArrowDown' || e.key === 'ArrowRight') target = items[(i + 1) % items.length];
      else if (e.key === 'ArrowUp' || e.key === 'ArrowLeft') target = items[(i - 1 + items.length) % items.length];
      if (target) {
        e.preventDefault();
        target.focus();
        select(target);
      }
    });
  });
})();

/* ── Section 7: cinematic image expansion on scroll ── */
(function initFranchiseCover() {
  const section = document.getElementById('franchise-cover');
  const media   = document.getElementById('franchiseMedia');
  const content = document.getElementById('franchiseContent');
  if (!section || !media || !content) return;

  const START_SCALE = 0.78;
  const START_RADIUS = 0;

  if (prefersReducedMotion) {
    // imagem já em tela cheia, texto visível
    media.style.transform = 'scale(1)';
    media.style.borderRadius = '0px';
    content.style.opacity = '1';
    content.style.transform = 'none';
    content.style.filter = 'none';
    return;
  }

  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  let ticking = false;

  function update() {
    const rect = section.getBoundingClientRect();
    const vh = window.innerHeight;
    const distance = section.offsetHeight - vh;

    // começa a crescer já na entrada (topo da seção a 60% da viewport)
    // e completa na primeira metade do "pin"
    const START = vh * 0.6;          // rect.top onde p = 0
    const END   = -distance * 0.5;   // rect.top onde p = 1
    const range = START - END;
    const p = range > 0 ? clamp((START - rect.top) / range, 0, 1) : 1;

    // imagem cresce de 0.78 → 1, cantos de 28px → 0
    const scale = START_SCALE + (1 - START_SCALE) * p;
    media.style.transform = 'scale(' + scale.toFixed(4) + ')';
    media.style.borderRadius = (START_RADIUS * (1 - p)).toFixed(2) + 'px';

    // texto entra na segunda metade da expansão
    const tp = clamp((p - 0.45) / 0.45, 0, 1);
    content.style.opacity = tp.toFixed(3);
    content.style.transform = 'translateY(' + (24 * (1 - tp)).toFixed(2) + 'px)';
    content.style.filter = 'blur(' + (8 * (1 - tp)).toFixed(2) + 'px)';

    ticking = false;
  }

  function onScrollFranchise() {
    if (!ticking) {
      window.requestAnimationFrame(update);
      ticking = true;
    }
  }

  window.addEventListener('scroll', onScrollFranchise, { passive: true });
  window.addEventListener('resize', update);
  update();
})();

/* ── Section 9: FAQ accordion ── */
(function initFaq() {
  const list = document.getElementById('faqList');
  if (!list) return;

  const items = Array.from(list.querySelectorAll('.faq-section__item'));

  function setOpen(item, open) {
    const btn = item.querySelector('.faq-section__question');
    const answer = item.querySelector('.faq-section__answer');
    item.classList.toggle('is-open', open);
    btn.setAttribute('aria-expanded', open ? 'true' : 'false');
    answer.style.maxHeight = open ? (answer.scrollHeight + 'px') : '0px';
  }

  items.forEach((item) => {
    const btn = item.querySelector('.faq-section__question');
    const answer = item.querySelector('.faq-section__answer');

    // estado inicial
    if (item.classList.contains('is-open')) {
      answer.style.maxHeight = answer.scrollHeight + 'px';
      btn.setAttribute('aria-expanded', 'true');
    } else {
      answer.style.maxHeight = '0px';
    }

    btn.addEventListener('click', () => {
      const willOpen = !item.classList.contains('is-open');
      // fecha os outros (apenas um aberto por vez)
      items.forEach((other) => { if (other !== item) setOpen(other, false); });
      setOpen(item, willOpen);
    });
  });

  // recalcula altura do item aberto ao redimensionar
  window.addEventListener('resize', () => {
    const open = items.find((el) => el.classList.contains('is-open'));
    if (open) {
      const answer = open.querySelector('.faq-section__answer');
      answer.style.maxHeight = answer.scrollHeight + 'px';
    }
  });
})();

/* ── Footer: links de soluções → rola ao portfólio e ativa o item ── */
(function initFooterSolutions() {
  const links = document.querySelectorAll('.site-footer__link[data-solution-target]');
  if (!links.length) return;

  links.forEach((link) => {
    link.addEventListener('click', () => {
      const key = link.getAttribute('data-solution-target');
      const item = document.querySelector('.portfolio-section__item[data-solution="' + key + '"]');
      if (item) {
        // o href="#portfolio" já faz o scroll suave; ativa após um instante
        setTimeout(() => item.click(), 480);
      }
    });
  });
})();
