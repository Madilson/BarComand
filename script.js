import { GoogleGenAI } from "@google/genai";

// --- CONFIGURATION ---
const STORE_KEY = 'bar_tabs_data';
let API_KEY = localStorage.getItem('gemini_api_key') || '';

// --- TYPES & CONSTANTS ---
const ProductCategory = {
    DRINK: 'Bebidas',
    FOOD: 'Comidas',
    COCKTAIL: 'Drinks',
    DESSERT: 'Sobremesas'
};

const TabStatus = {
    OPEN: 'Aberta',
    CLOSED: 'Fechada',
    PAID: 'Paga'
};

const INITIAL_MENU = [
    { id: '1', name: 'Caipirinha Clássica', price: 25.00, category: ProductCategory.COCKTAIL, description: 'Cachaça, limão e açúcar' },
    { id: '2', name: 'Gin Tônica', price: 32.00, category: ProductCategory.COCKTAIL, description: 'Gin importado, tônica e especiarias' },
    { id: '3', name: 'Cerveja Artesanal IPA', price: 18.00, category: ProductCategory.DRINK, description: '500ml' },
    { id: '4', name: 'Água sem Gás', price: 6.00, category: ProductCategory.DRINK, description: '350ml' },
    { id: '5', name: 'Batata Frita Rústica', price: 28.00, category: ProductCategory.FOOD, description: 'Com alecrim e alho' },
    { id: '6', name: 'Hambúrguer da Casa', price: 35.00, category: ProductCategory.FOOD, description: 'Blend 180g, queijo cheddar, bacon' },
    { id: '7', name: 'Dadinho de Tapioca', price: 24.00, category: ProductCategory.FOOD, description: 'Acompanha geleia de pimenta' },
    { id: '8', name: 'Petit Gâteau', price: 22.00, category: ProductCategory.DESSERT, description: 'Com sorvete de creme' },
    { id: '9', name: 'Moscow Mule', price: 30.00, category: ProductCategory.COCKTAIL, description: 'Vodka, espuma de gengibre e limão' },
    { id: '10', name: 'Refrigerante Lata', price: 7.00, category: ProductCategory.DRINK, description: 'Coca-cola, Guaraná' },
];

// --- STATE MANAGEMENT ---
const state = {
    menu: INITIAL_MENU,
    tabs: JSON.parse(localStorage.getItem(STORE_KEY)) || [],
    view: 'dashboard', // dashboard, menu, history, assistant, tab-detail
    activeTabId: null,
    ui: {
        isCreatingTab: false,
        searchTerm: '',
        activeCategory: 'all',
        isGrouped: false, // For grouped orders logic
        chatMessages: [
            { role: 'model', text: 'Olá! Sou seu assistente de bar. Posso sugerir drinks, explicar o cardápio ou ajudar com ideias para gestão.', timestamp: Date.now() }
        ],
        isChatLoading: false
    }
};

// --- CORE FUNCTIONS ---

function saveState() {
    localStorage.setItem(STORE_KEY, JSON.stringify(state.tabs));
    render();
}

function createTab(tableNumber, customerName) {
    const newTab = {
        id: Date.now().toString(),
        tableNumber,
        customerName,
        status: TabStatus.OPEN,
        items: [],
        openedAt: Date.now()
    };
    state.tabs.push(newTab);
    state.ui.isCreatingTab = false;
    saveState();
}

function addItemToTab(tabId, productId, quantity = 1) {
    const product = state.menu.find(p => p.id === productId);
    if (!product) return;
    
    const tab = state.tabs.find(t => t.id === tabId);
    if (!tab) return;

    tab.items.push({
        id: Date.now().toString(),
        productId: product.id,
        productName: product.name,
        price: product.price,
        quantity,
        timestamp: Date.now()
    });
    saveState();
}

function updateTabStatus(tabId, newStatus) {
    const tab = state.tabs.find(t => t.id === tabId);
    if (tab) {
        tab.status = newStatus;
        if (newStatus === TabStatus.CLOSED) tab.closedAt = Date.now();
        if (newStatus === TabStatus.OPEN) tab.closedAt = undefined;
        saveState();
    }
}

function deleteTab(tabId) {
    state.tabs = state.tabs.filter(t => t.id !== tabId);
    saveState();
}

// --- GEMINI SERVICE ---
async function askGemini(query) {
    if (!API_KEY) return "Por favor, configure sua API Key nas configurações ou no código.";
    
    try {
        const ai = new GoogleGenAI({ apiKey: API_KEY });
        
        const activeTabs = state.tabs.filter(t => t.status === TabStatus.OPEN);
        const totalRevenue = activeTabs.reduce((acc, tab) => {
            return acc + tab.items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
        }, 0);
        
        const menuString = state.menu.map(p => `- ${p.name} (R$ ${p.price.toFixed(2)})`).join('\n');
        
        const systemInstruction = `
            Você é um especialista em mixologia e gestão de bares chamado "BarGPT".
            Dados atuais do bar:
            - Mesas Abertas: ${activeTabs.length}
            - Faturamento (estimado): R$ ${totalRevenue.toFixed(2)}
            
            Menu:
            ${menuString}
            
            Seja conciso e útil.
        `;

        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: query,
            config: { systemInstruction }
        });

        return response.text;
    } catch (error) {
        console.error(error);
        return "Erro ao conectar com a IA. Verifique sua chave API.";
    }
}

// --- RENDER FUNCTIONS ---

function render() {
    const app = document.getElementById('app');
    app.innerHTML = '';
    
    // Check for API Key first
    if (!API_KEY) {
        renderApiKeyModal(app);
        return;
    }

    const layout = document.createElement('div');
    layout.className = "flex h-screen w-full bg-slate-900 text-slate-100 overflow-hidden";
    
    layout.innerHTML = `
        <!-- Sidebar -->
        <aside class="w-20 lg:w-64 bg-slate-950 border-r border-slate-800 flex flex-col flex-shrink-0">
            <div class="h-16 flex items-center justify-center lg:justify-start lg:px-6 border-b border-slate-800">
                <i data-lucide="beer" class="w-8 h-8 text-indigo-500"></i>
                <span class="hidden lg:block ml-3 font-bold text-xl bg-gradient-to-r from-indigo-400 to-emerald-400 bg-clip-text text-transparent">BarComanda</span>
            </div>
            <nav class="flex-1 py-6 space-y-2 px-2 lg:px-4">
                ${renderNavItem('dashboard', 'Mesas', 'layout-dashboard')}
                ${renderNavItem('menu', 'Cardápio', 'beer')}
                ${renderNavItem('history', 'Histórico', 'clipboard-list')}
                ${renderNavItem('assistant', 'Assistente AI', 'message-square-text')}
            </nav>
            <div class="p-4 border-t border-slate-800 hidden lg:block">
                <p class="text-xs text-slate-500">Versão XAMPP/JS</p>
            </div>
        </aside>

        <!-- Main Content -->
        <main class="flex-1 flex flex-col min-w-0 overflow-hidden relative">
            <header class="h-16 bg-slate-900/50 backdrop-blur-md border-b border-slate-800 flex items-center justify-between px-6 z-10">
                <h1 class="text-xl font-semibold text-white capitalize">${getHeaderTitle()}</h1>
                <div class="flex items-center space-x-4">
                     <span class="px-3 py-1 rounded-full bg-slate-800 border border-slate-700 text-xs text-slate-400">
                        ${new Date().toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric' })}
                     </span>
                </div>
            </header>
            <div class="flex-1 overflow-y-auto p-4 lg:p-8 scroll-smooth" id="main-container">
                <!-- Dynamic Content -->
            </div>
        </main>
    `;

    app.appendChild(layout);
    
    const mainContainer = document.getElementById('main-container');
    
    if (state.view === 'dashboard') renderDashboard(mainContainer);
    else if (state.view === 'tab-detail') renderTabDetail(mainContainer);
    else if (state.view === 'history') renderHistory(mainContainer);
    else if (state.view === 'assistant') renderAssistant(mainContainer);
    else if (state.view === 'menu') renderMenu(mainContainer);

    // Initialize Icons
    lucide.createIcons();
    
    // Attach Global Events (Delegation)
    attachEvents();
}

function renderNavItem(id, label, icon) {
    const isActive = state.view === id || (id === 'dashboard' && state.view === 'tab-detail');
    const bgClass = isActive ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-400 hover:bg-slate-800 hover:text-white';
    
    return `
        <button onclick="window.changeView('${id}')" 
            class="w-full flex items-center justify-center lg:justify-start p-3 rounded-xl transition-all duration-200 group ${bgClass}">
            <i data-lucide="${icon}" class="w-6 h-6"></i>
            <span class="hidden lg:block ml-3 font-medium">${label}</span>
        </button>
    `;
}

function getHeaderTitle() {
    if (state.view === 'tab-detail') return 'Detalhes da Comanda';
    const titles = { dashboard: 'Mesas', menu: 'Cardápio', history: 'Histórico', assistant: 'BarGPT' };
    return titles[state.view] || 'BarComanda';
}

function renderApiKeyModal(container) {
    container.innerHTML = `
        <div class="fixed inset-0 bg-black flex items-center justify-center p-4">
            <div class="bg-slate-900 p-8 rounded-2xl border border-slate-700 max-w-md w-full text-center">
                <h2 class="text-2xl font-bold text-white mb-4">Configuração Inicial</h2>
                <p class="text-slate-400 mb-6">Para usar o sistema com IA, insira sua chave API do Google Gemini.</p>
                <input type="text" id="apiKeyInput" placeholder="Cole sua API KEY aqui..." 
                    class="w-full p-3 bg-slate-950 border border-slate-700 rounded-xl text-white mb-4 focus:border-indigo-500 outline-none">
                <button onclick="window.saveApiKey()" class="w-full bg-indigo-600 text-white font-bold py-3 rounded-xl hover:bg-indigo-500">
                    Salvar e Entrar
                </button>
                <p class="mt-4 text-xs text-slate-500">A chave será salva no localStorage do seu navegador.</p>
            </div>
        </div>
    `;
}

function renderDashboard(container) {
    const activeTabs = state.tabs.filter(t => t.status === TabStatus.OPEN);
    const totalRev = activeTabs.reduce((acc, t) => acc + t.items.reduce((s, i) => s + (i.price * i.quantity), 0), 0);

    let html = `
        <div class="space-y-8 pb-20 animate-fade-in">
            <!-- Stats -->
            <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div class="bg-slate-800 p-6 rounded-2xl border border-slate-700 shadow-lg">
                    <p class="text-slate-400 text-sm font-medium">Mesas Abertas</p>
                    <h3 class="text-3xl font-bold text-white mt-1">${activeTabs.length}</h3>
                </div>
                <div class="bg-slate-800 p-6 rounded-2xl border border-slate-700 shadow-lg">
                    <p class="text-slate-400 text-sm font-medium">Total em Aberto</p>
                    <h3 class="text-3xl font-bold text-emerald-400 mt-1">R$ ${totalRev.toFixed(2)}</h3>
                </div>
                <button onclick="window.toggleCreateModal(true)" 
                    class="bg-gradient-to-br from-indigo-600 to-indigo-700 p-6 rounded-2xl border border-indigo-500 shadow-lg flex flex-col items-center justify-center hover:scale-[1.02] transition-transform">
                    <i data-lucide="plus" class="w-8 h-8 mb-2 text-white"></i>
                    <span class="font-bold text-lg text-white">Nova Comanda</span>
                </button>
            </div>

            <!-- Grid -->
            <div>
                <h2 class="text-lg font-semibold text-slate-200 mb-4 flex items-center">
                    <i data-lucide="clock" class="w-5 h-5 mr-2 text-indigo-400"></i> Em Andamento
                </h2>
                ${activeTabs.length === 0 ? 
                    `<div class="text-center py-20 bg-slate-800/50 rounded-2xl border border-slate-800 border-dashed">
                        <p class="text-slate-500">Nenhuma mesa aberta no momento.</p>
                     </div>` : 
                    `<div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                        ${activeTabs.map(tab => renderTabCard(tab)).join('')}
                    </div>`
                }
            </div>
        </div>
    `;

    // Modal
    if (state.ui.isCreatingTab) {
        html += `
            <div class="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                <div class="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-md p-6 shadow-2xl">
                    <h3 class="text-xl font-bold text-white mb-6">Abrir Nova Comanda</h3>
                    <form onsubmit="window.handleCreateTab(event)" class="space-y-4">
                        <div>
                            <label class="block text-sm font-medium text-slate-400 mb-1">Mesa</label>
                            <input name="tableNum" required autofocus class="w-full bg-slate-950 border border-slate-700 rounded-xl p-3 text-white focus:border-indigo-500 outline-none">
                        </div>
                        <div>
                            <label class="block text-sm font-medium text-slate-400 mb-1">Cliente (Opcional)</label>
                            <input name="custName" class="w-full bg-slate-950 border border-slate-700 rounded-xl p-3 text-white focus:border-indigo-500 outline-none">
                        </div>
                        <div class="flex gap-3 mt-6">
                            <button type="button" onclick="window.toggleCreateModal(false)" class="flex-1 py-3 px-4 rounded-xl text-slate-300 hover:bg-slate-800">Cancelar</button>
                            <button type="submit" class="flex-1 py-3 px-4 rounded-xl bg-indigo-600 text-white font-bold hover:bg-indigo-500">Abrir</button>
                        </div>
                    </form>
                </div>
            </div>
        `;
    }

    container.innerHTML = html;
}

function renderTabCard(tab) {
    const total = tab.items.reduce((s, i) => s + (i.price * i.quantity), 0);
    const count = tab.items.reduce((s, i) => s + i.quantity, 0);
    
    return `
        <div onclick="window.openTab('${tab.id}')" 
            class="bg-slate-800 rounded-2xl border border-slate-700 p-5 cursor-pointer hover:border-indigo-500 hover:shadow-lg transition-all group relative overflow-hidden">
            <div class="absolute top-0 right-0 p-3 opacity-10 group-hover:opacity-20"><i data-lucide="receipt" class="w-16 h-16"></i></div>
            <div class="flex justify-between items-start mb-4 relative z-10">
                <div>
                    <h4 class="text-2xl font-bold text-white">Mesa ${tab.tableNumber}</h4>
                    <p class="text-slate-400 text-sm truncate">${tab.customerName || 'Sem nome'}</p>
                </div>
            </div>
            <div class="space-y-3 relative z-10">
                <div class="flex justify-between text-sm">
                    <span class="text-slate-400">Itens</span>
                    <span class="text-slate-200 font-medium">${count}</span>
                </div>
                <div class="h-px bg-slate-700/50"></div>
                <div class="flex justify-between items-end">
                    <span class="text-slate-400 text-sm pb-1">Total</span>
                    <span class="text-2xl font-bold text-white">R$ ${total.toFixed(2)}</span>
                </div>
            </div>
        </div>
    `;
}

function renderTabDetail(container) {
    const tab = state.tabs.find(t => t.id === state.activeTabId);
    if (!tab) {
        window.changeView('dashboard');
        return;
    }

    const total = tab.items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    
    // Grouping Logic
    let displayItems = [];
    if (state.ui.isGrouped) {
        const grouped = {};
        tab.items.forEach(item => {
            if (!grouped[item.productId]) {
                grouped[item.productId] = { ...item, quantity: 0, total: 0 };
            }
            grouped[item.productId].quantity += item.quantity;
            grouped[item.productId].total += (item.price * item.quantity);
        });
        displayItems = Object.values(grouped);
    } else {
        displayItems = tab.items.map(item => ({...item, total: item.price * item.quantity}));
    }

    const filteredMenu = state.menu.filter(p => {
        const matchSearch = p.name.toLowerCase().includes(state.ui.searchTerm.toLowerCase());
        const matchCat = state.ui.activeCategory === 'all' || p.category === state.ui.activeCategory;
        return matchSearch && matchCat;
    });

    const categories = ['all', ...Object.values(ProductCategory)];

    container.innerHTML = `
        <div class="flex flex-col h-[calc(100vh-8rem)] lg:flex-row gap-6 animate-fade-in">
            <!-- Order List -->
            <div class="w-full lg:w-1/3 flex flex-col bg-slate-800 rounded-2xl border border-slate-700 overflow-hidden shadow-xl">
                <div class="p-4 border-b border-slate-700 bg-slate-800/50">
                    <button onclick="window.changeView('dashboard')" class="flex items-center text-slate-400 hover:text-white mb-4">
                        <i data-lucide="arrow-left" class="w-4 h-4 mr-2"></i> Voltar
                    </button>
                    <div class="flex justify-between items-start">
                        <div>
                            <h2 class="text-2xl font-bold text-white">Mesa ${tab.tableNumber}</h2>
                            <p class="text-slate-400">${tab.customerName || ''}</p>
                        </div>
                        <span class="px-2 py-1 rounded text-xs font-bold uppercase ${tab.status === TabStatus.OPEN ? 'bg-emerald-500/10 text-emerald-400' : 'bg-red-500/10 text-red-400'}">${tab.status}</span>
                    </div>
                </div>

                <!-- Grouping Toggle -->
                <div class="px-4 py-2 border-b border-slate-700/50 bg-slate-900/20 flex justify-between items-center">
                    <span class="text-xs text-slate-500 font-medium uppercase tracking-wider">
                        ${state.ui.isGrouped ? 'Itens Agrupados' : 'Ordem de Pedido'}
                    </span>
                    <button onclick="window.toggleGrouped()" 
                        class="flex items-center text-xs font-medium px-3 py-1.5 rounded-lg transition-all border ${state.ui.isGrouped ? 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20' : 'bg-slate-700/50 text-slate-400 border-slate-600'}">
                        <i data-lucide="${state.ui.isGrouped ? 'list' : 'layers'}" class="w-3.5 h-3.5 mr-1.5"></i>
                        ${state.ui.isGrouped ? 'Ver Detalhado' : 'Agrupar Pedidos'}
                    </button>
                </div>

                <div class="flex-1 overflow-y-auto p-4 space-y-3">
                    ${displayItems.length === 0 ? 
                        `<div class="h-full flex flex-col items-center justify-center text-slate-500 opacity-50">
                            <i data-lucide="receipt" class="w-12 h-12 mb-2"></i>
                            <p>Nenhum item</p>
                         </div>` : 
                        displayItems.map(item => `
                            <div class="flex justify-between items-center bg-slate-700/30 p-3 rounded-lg border border-slate-700/50">
                                <div>
                                    <div class="flex items-center">
                                        <span class="font-bold text-indigo-400 mr-2">${item.quantity}x</span>
                                        <span class="text-slate-200">${item.productName || item.name}</span>
                                    </div>
                                    <div class="flex items-center mt-1 gap-2">
                                        <span class="text-xs text-slate-500">Unit: R$ ${item.price.toFixed(2)}</span>
                                    </div>
                                </div>
                                <div class="font-semibold text-white">R$ ${item.total.toFixed(2)}</div>
                            </div>
                        `).join('')
                    }
                </div>

                <div class="p-6 bg-slate-900 border-t border-slate-700">
                    <div class="flex justify-between items-end mb-6">
                        <span class="text-slate-400">Total</span>
                        <span class="text-3xl font-bold text-white">R$ ${total.toFixed(2)}</span>
                    </div>
                    ${tab.status === TabStatus.OPEN ? 
                        `<button onclick="window.closeCurrentTab('${tab.id}')" class="w-full py-4 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl shadow-lg transition-all flex items-center justify-center">
                            <i data-lucide="check" class="w-5 h-5 mr-2"></i> Fechar Conta
                         </button>` :
                        `<div class="flex gap-2">
                            ${tab.status === TabStatus.CLOSED ? 
                                `<button onclick="window.payCurrentTab('${tab.id}')" class="flex-1 py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl">Marcar Pago</button>` : ''
                            }
                            <button onclick="window.reopenCurrentTab('${tab.id}')" class="flex-1 py-3 bg-slate-700 hover:bg-slate-600 text-white font-medium rounded-xl flex items-center justify-center">
                                <i data-lucide="x" class="w-4 h-4 mr-2"></i> Reabrir
                            </button>
                         </div>`
                    }
                </div>
            </div>

            <!-- Menu Grid -->
            ${tab.status === TabStatus.OPEN ? `
            <div class="flex-1 flex flex-col bg-slate-800 rounded-2xl border border-slate-700 overflow-hidden shadow-xl">
                <div class="p-4 border-b border-slate-700 flex flex-col gap-4">
                    <div class="relative">
                        <i data-lucide="search" class="absolute left-3 top-3 text-slate-400 w-5 h-5"></i>
                        <input type="text" placeholder="Buscar..." oninput="window.setSearch(this.value)" value="${state.ui.searchTerm}"
                            class="w-full bg-slate-900 border border-slate-700 rounded-xl pl-10 pr-4 py-3 text-white focus:border-indigo-500 outline-none">
                    </div>
                    <div class="flex gap-2 overflow-x-auto pb-2">
                        ${categories.map(cat => `
                            <button onclick="window.setCategory('${cat}')" 
                                class="px-4 py-2 rounded-lg whitespace-nowrap transition-all border ${state.ui.activeCategory === cat ? 'bg-indigo-600 text-white border-indigo-500' : 'bg-slate-900 text-slate-400 border-slate-700'}">
                                ${cat === 'all' ? 'Tudo' : cat}
                            </button>
                        `).join('')}
                    </div>
                </div>
                <div class="flex-1 overflow-y-auto p-4">
                    <div class="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4">
                        ${filteredMenu.map(product => `
                            <div onclick="window.addItem('${tab.id}', '${product.id}')" 
                                class="bg-slate-700/30 hover:bg-slate-700 border border-slate-700/50 p-4 rounded-xl cursor-pointer transition-all flex flex-col h-full group">
                                <div class="flex justify-between items-start mb-2">
                                    <span class="text-xs font-semibold text-slate-500 uppercase">${product.category}</span>
                                    <span class="text-emerald-400 font-bold">R$ ${product.price.toFixed(2)}</span>
                                </div>
                                <h3 class="text-white font-medium mb-1">${product.name}</h3>
                                <div class="mt-auto pt-3 border-t border-slate-600/30 flex items-center justify-center text-indigo-400 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <i data-lucide="plus" class="w-4 h-4 mr-1"></i> Adicionar
                                </div>
                            </div>
                        `).join('')}
                    </div>
                </div>
            </div>` : ''}
        </div>
    `;
}

function renderHistory(container) {
    const closed = state.tabs.filter(t => t.status !== TabStatus.OPEN).sort((a,b) => b.closedAt - a.closedAt);
    container.innerHTML = `
        <div class="space-y-6 animate-fade-in">
            <h2 class="text-2xl font-bold text-white">Histórico</h2>
            <div class="bg-slate-800 rounded-2xl border border-slate-700 overflow-hidden">
                <table class="w-full text-left">
                    <thead class="bg-slate-900/50 text-slate-400 border-b border-slate-700">
                        <tr>
                            <th class="p-4">Mesa</th><th class="p-4">Cliente</th><th class="p-4">Data</th><th class="p-4">Total</th><th class="p-4">Status</th><th class="p-4 text-right">Ação</th>
                        </tr>
                    </thead>
                    <tbody class="divide-y divide-slate-700/50">
                        ${closed.length === 0 ? '<tr><td colspan="6" class="p-8 text-center text-slate-500">Vazio</td></tr>' : 
                          closed.map(t => {
                              const total = t.items.reduce((s,i) => s + (i.price * i.quantity), 0);
                              return `
                                <tr class="hover:bg-slate-700/30">
                                    <td class="p-4 font-medium text-white">${t.tableNumber}</td>
                                    <td class="p-4 text-slate-300">${t.customerName || '-'}</td>
                                    <td class="p-4 text-slate-400 text-sm">${new Date(t.closedAt).toLocaleString()}</td>
                                    <td class="p-4 text-emerald-400 font-bold">R$ ${total.toFixed(2)}</td>
                                    <td class="p-4"><span class="px-2 py-1 rounded text-xs font-bold uppercase ${t.status === TabStatus.PAID ? 'bg-indigo-500/10 text-indigo-400' : 'bg-orange-500/10 text-orange-400'}">${t.status}</span></td>
                                    <td class="p-4 text-right"><button onclick="window.deleteTab('${t.id}')" class="text-slate-500 hover:text-red-400 text-sm">Excluir</button></td>
                                </tr>
                              `
                          }).join('')
                        }
                    </tbody>
                </table>
            </div>
        </div>
    `;
}

function renderAssistant(container) {
    container.innerHTML = `
        <div class="flex flex-col h-[calc(100vh-8rem)] bg-slate-800 rounded-2xl border border-slate-700 overflow-hidden shadow-2xl animate-fade-in">
            <div class="p-4 border-b border-slate-700 bg-slate-900/50 flex items-center">
                <div class="bg-indigo-500 p-2 rounded-lg mr-3"><i data-lucide="bot" class="w-5 h-5 text-white"></i></div>
                <div><h2 class="text-white font-bold">BarGPT</h2><p class="text-slate-400 text-xs">Gemini 2.5</p></div>
            </div>
            <div class="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-800/50" id="chat-container">
                ${state.ui.chatMessages.map(msg => `
                    <div class="flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}">
                        <div class="max-w-[80%] p-4 rounded-2xl text-sm leading-relaxed whitespace-pre-wrap shadow-md ${msg.role === 'user' ? 'bg-indigo-600 text-white rounded-tr-none' : 'bg-slate-700 text-slate-100 rounded-tl-none border border-slate-600'}">
                            ${msg.text}
                        </div>
                    </div>
                `).join('')}
                ${state.ui.isChatLoading ? '<div class="p-4 text-slate-400 text-xs animate-pulse">Digitando...</div>' : ''}
            </div>
            <form onsubmit="window.handleChatSubmit(event)" class="p-4 bg-slate-900 border-t border-slate-700 flex gap-2">
                <input name="msg" id="chatInput" placeholder="Digite sua mensagem..." autocomplete="off"
                    class="flex-1 bg-slate-950 border border-slate-700 rounded-xl px-4 py-3 text-white focus:border-indigo-500 outline-none">
                <button type="submit" class="bg-indigo-600 hover:bg-indigo-500 text-white p-3 rounded-xl"><i data-lucide="send" class="w-5 h-5"></i></button>
            </form>
        </div>
    `;
    setTimeout(() => {
        const chat = document.getElementById('chat-container');
        if(chat) chat.scrollTop = chat.scrollHeight;
    }, 100);
}

function renderMenu(container) {
    container.innerHTML = `
        <div class="space-y-6 animate-fade-in">
            <div class="flex justify-between items-center">
                <h2 class="text-2xl font-bold text-white">Cardápio Completo</h2>
            </div>
            <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                ${state.menu.map(item => `
                    <div class="bg-slate-800 p-4 rounded-xl border border-slate-700">
                        <h3 class="text-white font-bold">${item.name}</h3>
                        <p class="text-emerald-400 font-mono">R$ ${item.price.toFixed(2)}</p>
                        <span class="text-xs bg-slate-700 text-slate-300 px-2 py-0.5 rounded mt-2 inline-block">${item.category}</span>
                        <p class="text-slate-400 text-xs mt-2">${item.description || ''}</p>
                    </div>
                `).join('')}
            </div>
        </div>
    `;
}

// --- GLOBAL EVENT HANDLERS (Window Binding) ---

window.changeView = (view) => {
    state.view = view;
    render();
};

window.saveApiKey = () => {
    const input = document.getElementById('apiKeyInput');
    if (input && input.value) {
        API_KEY = input.value;
        localStorage.setItem('gemini_api_key', API_KEY);
        render();
    }
};

window.toggleCreateModal = (isOpen) => {
    state.ui.isCreatingTab = isOpen;
    render();
};

window.handleCreateTab = (e) => {
    e.preventDefault();
    const tableNum = e.target.tableNum.value;
    const custName = e.target.custName.value;
    if (tableNum) createTab(tableNum, custName);
};

window.openTab = (id) => {
    state.activeTabId = id;
    window.changeView('tab-detail');
};

window.toggleGrouped = () => {
    state.ui.isGrouped = !state.ui.isGrouped;
    render();
};

window.addItem = (tabId, prodId) => {
    addItemToTab(tabId, prodId, 1);
    render();
};

window.closeCurrentTab = (id) => {
    if (confirm('Fechar conta?')) {
        updateTabStatus(id, TabStatus.CLOSED);
        window.changeView('dashboard');
    }
};

window.payCurrentTab = (id) => {
    updateTabStatus(id, TabStatus.PAID);
    render();
};

window.reopenCurrentTab = (id) => {
    updateTabStatus(id, TabStatus.OPEN);
    render();
};

window.deleteTab = (id) => {
    if (confirm('Excluir histórico?')) {
        deleteTab(id);
        render();
    }
};

window.setSearch = (val) => {
    state.ui.searchTerm = val;
    render();
    // Keep focus
    const input = document.querySelector('input[placeholder="Buscar..."]');
    if(input) {
        input.focus();
        input.setSelectionRange(input.value.length, input.value.length);
    }
};

window.setCategory = (cat) => {
    state.ui.activeCategory = cat;
    render();
};

window.handleChatSubmit = async (e) => {
    e.preventDefault();
    const input = e.target.msg;
    const text = input.value.trim();
    if (!text) return;

    state.ui.chatMessages.push({ role: 'user', text, timestamp: Date.now() });
    state.ui.isChatLoading = true;
    input.value = '';
    render(); // Update UI immediately

    const response = await askGemini(text);
    
    state.ui.chatMessages.push({ role: 'model', text: response, timestamp: Date.now() });
    state.ui.isChatLoading = false;
    render();
};

// --- INITIALIZATION ---
function attachEvents() {
    // Lucide icons are re-scanned in render()
}

// Initial Render
render();