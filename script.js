/* ========= Degradado HSL pastel ========= */
(() => {
    const root = document.documentElement;
    const update = (x, y) => {
      const w = innerWidth, h = innerHeight;
      const hue = Math.round((x / w) * 360);
      const sat = Math.round(55 + (y / h) * 25);
      const lig = Math.round(55 + (1 - y / h) * 15);
      root.style.setProperty('--h', hue);
      root.style.setProperty('--s', sat);
      root.style.setProperty('--l', lig);
      root.style.setProperty('--mx', `${(x / w) * 100}%`);
      root.style.setProperty('--my', `${(y / h) * 100}%`);
    };
    // colores visibles desde el inicio
    update(innerWidth/2, innerHeight/2);
    let ticking = false;
    addEventListener('mousemove', e => {
      if (!ticking){
        requestAnimationFrame(() => { update(e.clientX, e.clientY); ticking = false; });
        ticking = true;
      }
    }, { passive:true });
    addEventListener('resize', () => update(innerWidth/2, innerHeight/2));
  })();
  
  /* ========= Helpers ========= */
  const $ = (s, c=document)=>c.querySelector(s);
  const $$ = (s, c=document)=>Array.from(c.querySelectorAll(s));
  const fmt = (n, cur='MXN') => new Intl.NumberFormat('es-MX',{style:'currency',currency:cur}).format(n);
  
  /* ========= Catálogo: búsqueda, orden y categoría ========= */
  (() => {
    const search = $('#search');
    const sort = $('#sort');
    const filter = $('#filter-category');
    const grid = $('#product-grid');
  
    const items = () => $$('.product-card', grid).map(card => ({
      el: card,
      name: card.dataset.name.toLowerCase(),
      cat: (card.dataset.category || '').toLowerCase(),
      price: Number(card.dataset.price)
    }));
  
    const apply = () => {
      const q = (search?.value || '').toLowerCase().trim();
      const cat = (filter?.value || 'all').toLowerCase();
      const list = items();
  
      list.forEach(it => {
        const hitText = it.name.includes(q);
        const hitCat = (cat === 'all') || (it.cat === cat);
        it.el.parentElement.classList.toggle('d-none', !(hitText && hitCat));
      });
  
      const visible = list.filter(it => !it.el.parentElement.classList.contains('d-none'));
      if (sort?.value?.startsWith('price')){
        visible.sort((a,b) => sort.value === 'price-asc' ? a.price-b.price : b.price-a.price);
        visible.forEach(v => grid.appendChild(v.el.parentElement));
      }
    };
  
    search?.addEventListener('input', apply);
    sort?.addEventListener('change', apply);
    filter?.addEventListener('change', apply);
  })();
  
  /* ========= Carrito ========= */
  const CART_KEY = 'veros_jewerly_cart_v4';
  const Cart = {
    state: { items: [] }, // {id,name,price,qty,img}
    load(){
      try{ const raw=localStorage.getItem(CART_KEY); if(raw) this.state=JSON.parse(raw); }catch(e){}
      if(!this.state?.items) this.state={items:[]};
      this.render(); this.updateCount();
    },
    save(){ localStorage.setItem(CART_KEY, JSON.stringify(this.state)); this.updateCount(); },
    updateCount(){ $('#cart-count').textContent = this.state.items.reduce((n,i)=>n+i.qty,0); },
    add(prod){
      const f=this.state.items.find(i=>i.id===prod.id);
      if(f) f.qty += 1; else this.state.items.push({...prod, qty:1});
      this.save(); this.render();
    },
    remove(id){ this.state.items=this.state.items.filter(i=>i.id!==id); this.save(); this.render(); },
    changeQty(id,d){ const it=this.state.items.find(i=>i.id===id); if(!it) return; it.qty=Math.max(1,it.qty+d); this.save(); this.render(); },
    clear(){ this.state.items=[]; this.save(); this.render(); },
    subtotal(){ return this.state.items.reduce((s,i)=>s+i.price*i.qty,0); },
    render(){
      const wrap=$('#cart-items'); const sub=$('#cart-subtotal');
      wrap.innerHTML='';
      if(this.state.items.length===0){
        wrap.innerHTML=`<div class="text-center text-secondary"><i class="bi bi-bag fs-1 d-block mb-2"></i>Tu carrito está vacío.</div>`;
      }else{
        this.state.items.forEach(it=>{
          const line=document.createElement('div'); line.className='cart-line';
          line.innerHTML=`
            <img class="cart-thumb" src="${it.img}" alt="${it.name}">
            <div>
              <div class="fw-semibold small">${it.name}</div>
              <div class="text-secondary small">${fmt(it.price)}</div>
              <div class="d-inline-flex align-items-center gap-2 mt-1" role="group" aria-label="Cantidad">
                <button class="btn btn-outline-secondary btn-sm qty-dec" data-id="${it.id}">−</button>
                <span class="small" aria-live="polite">${it.qty}</span>
                <button class="btn btn-outline-secondary btn-sm qty-inc" data-id="${it.id}">+</button>
              </div>
            </div>
            <div class="text-end">
              <div class="fw-semibold">${fmt(it.price*it.qty)}</div>
              <button class="btn btn-link text-danger p-0 small remove-item" data-id="${it.id}">
                <i class="bi bi-trash"></i> Quitar
              </button>
            </div>`;
          wrap.appendChild(line);
        });
      }
      sub.textContent = fmt(this.subtotal());
    }
  };
  
  document.addEventListener('DOMContentLoaded', () => {
    $('#year').textContent = new Date().getFullYear();
  
    Cart.load();
  
    // Delegación de clicks
    document.body.addEventListener('click', (ev) => {
      const add = ev.target.closest('.add-to-cart');
      if (add){
        const card = ev.target.closest('.product-card');
        Cart.add({
          id: card.dataset.id,
          name: card.dataset.name,
          price: Number(card.dataset.price),
          img: card.dataset.img || card.querySelector('img')?.getAttribute('src') || ''
        });
      }
      const rm = ev.target.closest('.remove-item'); if (rm) Cart.remove(rm.dataset.id);
      const inc = ev.target.closest('.qty-inc'); if (inc) Cart.changeQty(inc.dataset.id, +1);
      const dec = ev.target.closest('.qty-dec'); if (dec) Cart.changeQty(dec.dataset.id, -1);
    });
  
    $('#clear-cart')?.addEventListener('click', ()=>Cart.clear());
    $('#checkout')?.addEventListener('click', ()=>{
      if (Cart.state.items.length===0) return alert('Tu carrito está vacío.');
      alert('Demo de checkout. Para pagos reales conecta Stripe o Mercado Pago en el backend.');
    });
  
    // Formatear precios visibles
    $$('.price').forEach(el => { el.textContent = fmt(Number(el.dataset.raw), 'MXN'); });
  
    /* ======= To-do list con imagen por URL ======= */
    const TKEY = 'veros_todos_v1';
    const listWrap = $('#todo-list');
    const form = $('#todo-form');
    const txt = $('#todo-text');
    const imgUrl = $('#todo-img');
    const prio = $('#todo-priority');
    const counter = $('#todo-counter');
  
    const Todos = {
      items: [],
      load(){ try{ const raw=localStorage.getItem(TKEY); if(raw) this.items=JSON.parse(raw); }catch(e){} if(!Array.isArray(this.items)) this.items=[]; this.render(); },
      save(){ localStorage.setItem(TKEY, JSON.stringify(this.items)); this.updateCounter(); },
      add({title, image, priority}){ this.items.push({ id: crypto.randomUUID(), title, image, priority, done:false, ts:Date.now() }); this.save(); this.render(); },
      toggle(id){ const t=this.items.find(i=>i.id===id); if(!t) return; t.done=!t.done; this.save(); this.render(); },
      remove(id){ this.items=this.items.filter(i=>i.id!==id); this.save(); this.render(); },
      updateCounter(){ const total=this.items.length, done=this.items.filter(i=>i.done).length; counter.textContent = `${done}/${total} completadas`; },
      render(){
        listWrap.innerHTML='';
        if(this.items.length===0){ listWrap.innerHTML = `<div class="text-secondary">No hay tareas. Agrega la primera ✨</div>`; }
        else{
          this.items.slice().sort((a,b)=> (a.done - b.done) || (b.ts - a.ts)).forEach(t=>{
            const col=document.createElement('div'); col.className='col-md-4';
            col.innerHTML=`
              <article class="todo-card card shadow-sm h-100">
                ${t.image ? `<img class="todo-img" src="${t.image}" alt="Imagen de tarea">` : ''}
                <div class="card-body">
                  <div class="d-flex justify-content-between align-items-start">
                    <h3 class="h6 mb-2 todo-title ${t.done?'done':''}">${t.title}</h3>
                    <span class="badge ${t.priority==='alta'?'text-bg-danger':t.priority==='baja'?'text-bg-secondary':'text-bg-primary'}">${t.priority}</span>
                  </div>
                  <div class="d-flex gap-2">
                    <button class="btn btn-sm ${t.done?'btn-secondary':'btn-success'} toggle" data-id="${t.id}">
                      <i class="bi ${t.done?'bi-arrow-counterclockwise':'bi-check2'}"></i>
                    </button>
                    <button class="btn btn-sm btn-outline-danger remove" data-id="${t.id}">
                      <i class="bi bi-trash"></i>
                    </button>
                  </div>
                </div>
              </article>`;
            listWrap.appendChild(col);
          });
        }
        this.updateCounter();
      }
    };
  
    Todos.load();
    form.addEventListener('submit', (e)=>{
      e.preventDefault();
      const title = txt.value.trim(); if (!title) return;
      const image = (imgUrl.value || '').trim();
      const priority = prio.value || 'normal';
      Todos.add({ title, image, priority });
      form.reset();
    });
    listWrap.addEventListener('click', (e)=>{
      const t = e.target.closest('.toggle'); if (t) return Todos.toggle(t.dataset.id);
      const r = e.target.closest('.remove'); if (r) return Todos.remove(r.dataset.id);
    });
  });
  