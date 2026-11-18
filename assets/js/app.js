document.addEventListener('DOMContentLoaded', () => {
  const { products, capsules } = window.LIDO_DATA;

  const state = {
    activeCategory: 'all',
    onlySale: false,
    activeCapsuleId: capsules[0].id,
    capsuleSelections: {},
    cart: [],
    modalProduct: null,
    modalSize: null
  };

  // Initialize capsule selections
  capsules.forEach(c => {
    state.capsuleSelections[c.id] = c.items.map(i => ({ ...i }));
  });

  const formatPrice = (val) => new Intl.NumberFormat('ru-RU').format(val) + ' ₽';

  // Header scroll effect
  const header = document.getElementById('siteHeader');
  window.addEventListener('scroll', () => {
    header.classList.toggle('scrolled', window.scrollY > 24);
  });

  // Scroll Reveal
  const revealObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
        revealObserver.unobserve(entry.target);
      }
    });
  }, { threshold: 0.12 });

  document.querySelectorAll('.reveal').forEach(el => revealObserver.observe(el));

  // Render Catalog
  const productGrid = document.getElementById('productGrid');
  const renderCatalog = () => {
    const filtered = products.filter(p => {
      const catMatch = state.activeCategory === 'all' || p.category === state.activeCategory;
      const saleMatch = !state.onlySale || Boolean(p.discount);
      return catMatch && saleMatch;
    });

    productGrid.innerHTML = filtered.map(p => `
      <article class="product-card" data-hostcms-item-id="${p.id}" data-hostcms-group-id="${p.groupId}">
        <div class="product-media">
          <img src="${p.image}" alt="${p.title}" loading="lazy">
          <div class="product-badges">
            ${p.discount ? `<span class="badge badge-sale">-${p.discount}%</span>` : ''}
            ${p.isNew ? `<span class="badge badge-new">New</span>` : ''}
          </div>
          <button class="product-quick-btn" data-quick-view="${p.id}">Быстрый просмотр</button>
        </div>
        <div class="product-body">
          <span class="product-cat">${p.categoryLabel}</span>
          <h3 class="product-title">${p.title}</h3>
          <div class="product-sizes">Размеры: ${p.sizes.join(' · ')}</div>
          <div class="product-price-row">
            <span class="price-current">${formatPrice(p.price)}</span>
            ${p.oldPrice ? `<span class="price-old">${formatPrice(p.oldPrice)}</span>` : ''}
          </div>
        </div>
      </article>
    `).join('');

    productGrid.querySelectorAll('[data-quick-view]').forEach(btn => {
      btn.addEventListener('click', () => openModal(Number(btn.dataset.quickView)));
    });
  };

  document.querySelectorAll('.pill-btn[data-category]').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.pill-btn[data-category]').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      state.activeCategory = btn.dataset.category;
      renderCatalog();
    });
  });

  document.getElementById('saleOnlyToggle').addEventListener('change', (e) => {
    state.onlySale = e.target.checked;
    renderCatalog();
  });

  // Render Capsule Builder
  const capsuleTabsEl = document.getElementById('capsuleTabs');
  const capsulePhotoEl = document.getElementById('capsulePhoto');
  const capsuleTitleEl = document.getElementById('capsuleTitle');
  const capsuleDescEl = document.getElementById('capsuleDesc');
  const capsuleItemsEl = document.getElementById('capsuleItems');
  const capsuleTotalEl = document.getElementById('capsuleTotal');
  const capsuleSavingsEl = document.getElementById('capsuleSavings');

  const renderCapsules = () => {
    capsuleTabsEl.innerHTML = capsules.map(c => `
      <button class="capsule-tab ${c.id === state.activeCapsuleId ? 'active' : ''}" data-capsule="${c.id}">
        ${c.tabLabel}
      </button>
    `).join('');

    capsuleTabsEl.querySelectorAll('.capsule-tab').forEach(tab => {
      tab.addEventListener('click', () => {
        state.activeCapsuleId = tab.dataset.capsule;
        renderCapsules();
      });
    });

    const active = capsules.find(c => c.id === state.activeCapsuleId);
    const items = state.capsuleSelections[active.id];

    capsulePhotoEl.src = active.image;
    capsulePhotoEl.alt = active.title;
    capsuleTitleEl.textContent = active.title;
    capsuleDescEl.textContent = active.description;

    capsuleItemsEl.innerHTML = items.map((item, idx) => `
      <label class="capsule-item-row ${item.checked ? 'selected' : ''}">
        <div class="capsule-item-left">
          <input type="checkbox" ${item.checked ? 'checked' : ''} data-cap-idx="${idx}">
          <div>
            <strong>${item.title}</strong>
            <div style="font-size:0.8rem; opacity:0.7;">Размер: ${item.size}</div>
          </div>
        </div>
        <strong>${formatPrice(item.price)}</strong>
      </label>
    `).join('');

    capsuleItemsEl.querySelectorAll('input[type="checkbox"]').forEach(cb => {
      cb.addEventListener('change', (e) => {
        const idx = Number(e.target.dataset.capIdx);
        items[idx].checked = e.target.checked;
        renderCapsules();
      });
    });

    const selectedItems = items.filter(i => i.checked);
    const rawTotal = selectedItems.reduce((sum, i) => sum + i.price, 0);
    const hasBundleDiscount = selectedItems.length >= 2;
    const finalTotal = hasBundleDiscount ? Math.round(rawTotal * (1 - active.bundleDiscount)) : rawTotal;
    const saved = rawTotal - finalTotal;

    capsuleTotalEl.textContent = formatPrice(finalTotal);
    capsuleSavingsEl.textContent = hasBundleDiscount
      ? `Выгода -10% за образ: ${formatPrice(saved)}`
      : 'Выберите от 2 вещей для скидки -10%';
  };

  document.getElementById('addCapsuleBtn').addEventListener('click', () => {
    const items = state.capsuleSelections[state.activeCapsuleId].filter(i => i.checked);
    if (!items.length) return;
    items.forEach(item => {
      const prod = products.find(p => p.id === item.id);
      if (prod) addToCart(prod, item.size);
    });
    openCart();
  });

  // Smart Fit Calculator (46-60)
  const ogInput = document.getElementById('fitOg');
  const otInput = document.getElementById('fitOt');
  const obInput = document.getElementById('fitOb');
  const fitSizeOutput = document.getElementById('fitSizeOutput');
  const fitNoteOutput = document.getElementById('fitNoteOutput');
  const fitTgBtn = document.getElementById('fitTgBtn');

  const calculateFit = () => {
    const og = Number(ogInput.value) || 114;
    const ot = Number(otInput.value) || 92;
    const ob = Number(obInput.value) || 118;

    let size = '50-52';
    let note = 'Свободная посадка по бёдрам и комфортная линия плеча.';

    if (og <= 104 && ob <= 110) {
      size = '46-48';
      note = 'Идеально для верхней одежды и платьев-тренчей в размер.';
    } else if (og <= 116 && ob <= 122) {
      size = '50-52';
      note = 'Рекомендуемый размер для моделей LidO (параметры модели: ОГ 117 / ОТ 91 / ОБ 107).';
    } else if (og <= 124 && ob <= 130) {
      size = '54-56';
      note = 'Комфортный запас по груди и бедрам, вытягивающая вертикаль.';
    } else {
      size = '58-60';
      note = 'Полноразмерная посадка с учётом особенностей фигуры 58–60.';
    }

    fitSizeOutput.textContent = `Размер ${size}`;
    fitNoteOutput.textContent = note;

    const msg = encodeURIComponent(`Здравствуйте! Подобрала размер на сайте LidO: ${size} (ОГ ${og}, ОТ ${ot}, ОБ ${ob}). Подскажите по посадке?`);
    fitTgBtn.href = `https://t.me/+79805400207?text=${msg}`;
  };

  [ogInput, otInput, obInput].forEach(inp => inp.addEventListener('input', calculateFit));

  // Quick-View Modal
  const backdrop = document.getElementById('backdrop');
  const modal = document.getElementById('productModal');
  const modalImg = document.getElementById('modalImg');
  const modalCat = document.getElementById('modalCat');
  const modalTitle = document.getElementById('modalTitle');
  const modalPrice = document.getElementById('modalPrice');
  const modalFabric = document.getElementById('modalFabric');
  const modalModel = document.getElementById('modalModel');
  const modalSizes = document.getElementById('modalSizes');
  const modalAddBtn = document.getElementById('modalAddBtn');

  const openModal = (productId) => {
    const prod = products.find(p => p.id === productId);
    if (!prod) return;
    state.modalProduct = prod;
    state.modalSize = prod.sizes[0];

    modalImg.src = prod.image;
    modalImg.alt = prod.title;
    modalCat.textContent = `${prod.categoryLabel} · Арт. ${prod.sku}`;
    modalTitle.textContent = prod.title;
    modalPrice.textContent = formatPrice(prod.price);
    modalFabric.textContent = prod.fabric;
    modalModel.textContent = prod.modelInfo;

    modalSizes.innerHTML = prod.sizes.map((s, idx) => `
      <button class="size-chip ${idx === 0 ? 'active' : ''}" data-size="${s}">${s}</button>
    `).join('');

    modalSizes.querySelectorAll('.size-chip').forEach(chip => {
      chip.addEventListener('click', () => {
        modalSizes.querySelectorAll('.size-chip').forEach(c => c.classList.remove('active'));
        chip.classList.add('active');
        state.modalSize = chip.dataset.size;
      });
    });

    backdrop.classList.add('open');
    modal.classList.add('open');
  };

  const closeAllOverlays = () => {
    backdrop.classList.remove('open');
    modal.classList.remove('open');
    cartDrawer.classList.remove('open');
  };

  document.getElementById('closeModalBtn').addEventListener('click', closeAllOverlays);
  backdrop.addEventListener('click', closeAllOverlays);

  modalAddBtn.addEventListener('click', () => {
    if (state.modalProduct) {
      addToCart(state.modalProduct, state.modalSize);
      closeAllOverlays();
      openCart();
    }
  });

  // Cart Drawer & Gift Progress
  const cartDrawer = document.getElementById('cartDrawer');
  const cartBody = document.getElementById('cartBody');
  const cartBadge = document.getElementById('cartBadge');
  const cartTotalEl = document.getElementById('cartTotal');
  const giftTextEl = document.getElementById('giftText');
  const giftProgressFill = document.getElementById('giftProgressFill');

  const openCart = () => {
    backdrop.classList.add('open');
    cartDrawer.classList.add('open');
  };

  document.getElementById('openCartBtn').addEventListener('click', openCart);
  document.getElementById('closeCartBtn').addEventListener('click', closeAllOverlays);

  const addToCart = (product, size) => {
    const existing = state.cart.find(i => i.id === product.id && i.size === size);
    if (existing) {
      existing.qty += 1;
    } else {
      state.cart.push({
        id: product.id,
        title: product.title,
        price: product.price,
        image: product.image,
        size,
        qty: 1
      });
    }
    renderCart();
  };

  const renderCart = () => {
    const totalCount = state.cart.reduce((s, i) => s + i.qty, 0);
    const totalSum = state.cart.reduce((s, i) => s + i.price * i.qty, 0);

    cartBadge.textContent = totalCount;
    cartTotalEl.textContent = formatPrice(totalSum);

    const giftThreshold = 25000;
    const pct = Math.min(100, Math.round((totalSum / giftThreshold) * 100));
    giftProgressFill.style.width = `${pct}%`;

    if (totalSum >= giftThreshold) {
      giftTextEl.innerHTML = '<strong>Подарок открыт!</strong> Авторское украшение ручной работы добавлено к заказу.';
    } else {
      giftTextEl.innerHTML = `До подарка (украшение ручной работы): <strong>${formatPrice(giftThreshold - totalSum)}</strong>`;
    }

    if (!state.cart.length) {
      cartBody.innerHTML = '<p style="color:var(--text-secondary); text-align:center; padding:40px 0;">Корзина пока пуста. Добавьте вещь или готовую капсулу.</p>';
      return;
    }

    cartBody.innerHTML = state.cart.map((item, idx) => `
      <div class="cart-item">
        <img src="${item.image}" alt="${item.title}">
        <div>
          <strong style="font-size:0.92rem;">${item.title}</strong>
          <div style="font-size:0.8rem; color:var(--text-secondary); margin:2px 0;">Размер: ${item.size}</div>
          <div style="font-weight:700; font-size:0.95rem;">${formatPrice(item.price * item.qty)}</div>
          <div class="qty-controls">
            <button data-qty-dec="${idx}">−</button>
            <span>${item.qty}</span>
            <button data-qty-inc="${idx}">+</button>
          </div>
        </div>
      </div>
    `).join('');

    cartBody.querySelectorAll('[data-qty-dec]').forEach(b => {
      b.addEventListener('click', () => {
        const i = Number(b.dataset.qtyDec);
        state.cart[i].qty -= 1;
        if (state.cart[i].qty <= 0) state.cart.splice(i, 1);
        renderCart();
      });
    });

    cartBody.querySelectorAll('[data-qty-inc]').forEach(b => {
      b.addEventListener('click', () => {
        const i = Number(b.dataset.qtyInc);
        state.cart[i].qty += 1;
        renderCart();
      });
    });
  };

  document.getElementById('checkoutBtn').addEventListener('click', () => {
    if (!state.cart.length) return;
    alert('Заказ готов к передаче в HostCMS (Shop_Cart_Controller)! Бесплатная доставка СДЭК и 14 дней на примерку дома.');
  });

  // Initial renders
  renderCatalog();
  renderCapsules();
  calculateFit();
  renderCart();
});
