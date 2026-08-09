// 1. Utilidades Globales
const escHtml = (unsafe) => {
    return (unsafe || "").toString()
         .replace(/&/g, "&amp;")
         .replace(/</g, "&lt;")
         .replace(/>/g, "&gt;")
         .replace(/"/g, "&quot;")
         .replace(/'/g, "&#039;");
};

// Toast Notifications (iOS Native Style)
const showToast = (message, type = 'success') => {
    const container = document.getElementById('toast-container');
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    
    // Icon (Material Symbols)
    const icon = type === 'success' ? 'check_circle' : 'error';
    toast.innerHTML = `<span class="material-symbols-outlined toast-icon" style="font-size: 1.5rem; font-variation-settings: 'FILL' 1;">${icon}</span> <span>${escHtml(message)}</span>`;
    
    container.appendChild(toast);
    
    setTimeout(() => {
        toast.classList.add('fade-out');
        setTimeout(() => toast.remove(), 300);
    }, 3000);
};

// Token Management
const getToken = () => localStorage.getItem('token');
const setToken = (token) => localStorage.setItem('token', token);
const clearToken = () => localStorage.removeItem('token');

// Parse JWT payload safely
const getUserRole = () => {
    const token = getToken();
    if (!token) return null;
    try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        return payload.rol; // 'Administrador' o 'Abogado'
    } catch(e) {
        return null;
    }
};
const getUserName = () => {
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    return user.nombre || 'Usuario';
};

// API Fetch Wrapper
let API_BASE = '';
if (window.location.protocol === 'file:') {
    API_BASE = 'http://localhost:3000';
}

const apiFetch = async (url, options = {}) => {
    const token = getToken();
    const headers = {
        'Content-Type': 'application/json',
        ...options.headers,
    };
    if (token) headers['Authorization'] = `Bearer ${token}`;

    const response = await fetch(`${API_BASE}/api${url}`, { ...options, headers });
    
    // Expired or invalid token logic
    if (response.status === 401 || response.status === 403) {
        if (!window.location.pathname.endsWith('login.html')) {
            clearToken();
            localStorage.removeItem('user');
            window.location.href = 'login.html';
        }
    }
    return response;
};

// ======================== LÓGICA DE LOGIN ========================
if (window.location.pathname.endsWith('login.html')) {
    const form = document.getElementById('loginForm');
    
    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        const btn = form.querySelector('button');
        btn.textContent = 'Verificando...';
        btn.disabled = true;

        const email = document.getElementById('email').value;
        const password = document.getElementById('password').value;

        try {
            const res = await apiFetch('/auth/login', {
                method: 'POST',
                body: JSON.stringify({ email, password })
            });
            const data = await res.json();
            
            if (res.ok) {
                setToken(data.token);
                localStorage.setItem('user', JSON.stringify(data.user));
                window.location.href = 'index.html';
            } else {
                showToast(data.message || 'Credenciales inválidas', 'error');
            }
        } catch (err) {
            showToast('Error de red o conexión al servidor', 'error');
        } finally {
            btn.textContent = 'Iniciar Sesión';
            btn.disabled = false;
        }
    });
}

// ====================== LÓGICA DE DASHBOARD (SPA) ======================
if (window.location.pathname === '/' || window.location.pathname.endsWith('index.html')) {
    const role = getUserRole();
    if (!getToken() || !role) {
        window.location.href = 'login.html';
    } else {
        // App Init
        document.getElementById('app').classList.remove('hidden');
        document.getElementById('userNameDisplay').textContent = getUserName();
        document.getElementById('userRoleDisplay').textContent = role;

        // Show Admin-only nav item
        if (role === 'Administrador') {
            document.getElementById('nav-clientes').style.display = 'flex';
        }

        document.getElementById('logoutBtn').addEventListener('click', () => {
            clearToken();
            localStorage.removeItem('user');
            window.location.href = 'login.html';
        });

        // 1. SPA Navigation Logic
        const navItems = document.querySelectorAll('.nav-item');
        const views = document.querySelectorAll('.view-section');

        navItems.forEach(item => {
            item.addEventListener('click', () => {
                // Update active nav
                navItems.forEach(n => n.classList.remove('active'));
                item.classList.add('active');
                
                // Show view
                const targetView = item.getAttribute('data-view');
                views.forEach(v => {
                    v.classList.add('hidden');
                    if (v.id === targetView) v.classList.remove('hidden');
                });

                // Load contextual data
                if (targetView === 'clientes-view') loadClientes();
                else loadCasos();
            });
        });

        // 2. Modals Logic
        const setupModal = (modalId, closeIds) => {
            const modal = document.getElementById(modalId);
            const closeFns = () => modal.classList.remove('active');
            
            closeIds.forEach(id => {
                const el = document.getElementById(id);
                if (el) el.addEventListener('click', closeFns);
            });
            document.querySelectorAll(`#${modalId} .closeModalBtn`).forEach(btn => {
                btn.addEventListener('click', closeFns);
            });
            return modal;
        };

        const modalCaso = setupModal('modalCaso', ['closeModalCaso']);
        const modalCliente = setupModal('modalCliente', ['closeModalCliente']);

        // 3. Chart Logic
        let casosChartInstance = null;
        const renderChart = (stats) => {
            const ctx = document.getElementById('casosChart').getContext('2d');
            
            if (casosChartInstance) casosChartInstance.destroy();

            casosChartInstance = new Chart(ctx, {
                type: 'doughnut',
                data: {
                    labels: ['Abiertos', 'En Progreso', 'Pausados', 'Cerrados'],
                    datasets: [{
                        data: [stats['Abierto'], stats['En Progreso'], stats['Pausado'], stats['Cerrado']],
                        backgroundColor: ['#0071E3', '#FF9500', '#FF3B30', '#34C759'],
                        borderWidth: 0,
                        hoverOffset: 4
                    }]
                },
                options: {
                    responsive: true,
                    plugins: {
                        legend: { position: 'bottom', labels: { color: '#6B7280', font: { family: 'Inter' } } }
                    },
                    cutout: '75%'
                }
            });
        };

        // 4. Casos View Logic
        let globalCasos = [];
        let globalClientesList = [];

        const loadCasos = async (busqueda = '') => {
            const query = busqueda ? `?busqueda=${encodeURIComponent(busqueda)}` : '';
            const res = await apiFetch(`/casos${query}`);
            if (res.ok) {
                globalCasos = await res.json();
                renderCasos(globalCasos);
                updateCasosStats(globalCasos);
            }
        };

        const fetchClientesForSelect = async () => {
            const res = await apiFetch(`/clientes`);
            if (res.ok) {
                globalClientesList = await res.json();
                const select = document.getElementById('casoClienteId');
                select.innerHTML = '<option value="">Seleccione un cliente...</option>';
                globalClientesList.forEach(c => {
                    select.innerHTML += `<option value="${c.id}">${escHtml(c.nombre)}</option>`;
                });
            }
        };

        const updateCasosStats = (casos) => {
            const stats = { 'Abierto': 0, 'En Progreso': 0, 'Pausado': 0, 'Cerrado': 0 };
            casos.forEach(c => { if(stats[c.estatus] !== undefined) stats[c.estatus]++; });

            document.getElementById('count-abierto').textContent = stats['Abierto'];
            document.getElementById('count-progreso').textContent = stats['En Progreso'];
            document.getElementById('count-pausado').textContent = stats['Pausado'];
            document.getElementById('count-cerrado').textContent = stats['Cerrado'];

            renderChart(stats);
        };

        const renderCasos = (casos) => {
            const tbody = document.getElementById('casosTableBody');
            tbody.innerHTML = '';

            casos.forEach(caso => {
                const tr = document.createElement('tr');
                const badgeClass = caso.estatus === 'En Progreso' ? 'badge-progreso' : `badge-${caso.estatus.toLowerCase()}`;
                
                const formattedDate = new Date(caso.fechas).toLocaleDateString('es-ES', { year: 'numeric', month: 'long', day: 'numeric' });

                tr.innerHTML = `
                    <td><strong>${escHtml(caso.folio)}</strong></td>
                    <td>${escHtml(caso.cliente_nombre || 'Desconocido')}</td>
                    <td>${escHtml(caso.descripcion)}</td>
                    <td>${escHtml(formattedDate)}</td>
                    <td><span class="badge ${badgeClass}">${escHtml(caso.estatus)}</span></td>
                    <td style="text-align: right;">
                        <button class="action-btn" onclick="editCaso(${caso.id})" title="Editar">
                            <span class="material-symbols-outlined">edit_square</span>
                        </button>
                        <button class="action-btn delete" onclick="deleteCaso(${caso.id})" title="Eliminar">
                            <span class="material-symbols-outlined" style="color: var(--danger)">delete</span>
                        </button>
                    </td>
                `;
                tbody.appendChild(tr);
            });
        };

        // Debounce Search
        let debounceTimer;
        document.getElementById('searchInput').addEventListener('input', (e) => {
            clearTimeout(debounceTimer);
            debounceTimer = setTimeout(() => {
                loadCasos(e.target.value);
            }, 350);
        });

        // Add/Edit Caso Modal Logic
        document.getElementById('btnNewCaso').addEventListener('click', async () => {
            document.getElementById('formCaso').reset();
            document.getElementById('casoId').value = '';
            document.getElementById('modalCasoTitle').textContent = 'Registrar Nuevo Caso';
            document.getElementById('casoEstatusGroup').style.display = 'none'; // Only open on create
            await fetchClientesForSelect();
            modalCaso.classList.add('active');
        });

        // Global functions for inline onclick in render
        window.editCaso = async (id) => {
            const caso = globalCasos.find(c => c.id === id);
            if (!caso) return;

            document.getElementById('modalCasoTitle').textContent = `Editar Caso ${caso.folio}`;
            document.getElementById('casoId').value = caso.id;
            document.getElementById('casoDescripcion').value = caso.descripcion;
            document.getElementById('casoEstatus').value = caso.estatus;
            document.getElementById('casoEstatusGroup').style.display = 'block';

            await fetchClientesForSelect();
            document.getElementById('casoClienteId').value = caso.cliente_id;
            
            modalCaso.classList.add('active');
        };

        window.deleteCaso = async (id) => {
            if(confirm("¿Estás seguro de eliminar este caso? Esta acción no se puede deshacer.")) {
                const res = await apiFetch(`/casos/${id}`, { method: 'DELETE' });
                if(res.ok) {
                    showToast('Caso eliminado correctamente', 'success');
                    loadCasos(document.getElementById('searchInput').value);
                } else {
                    const error = await res.json();
                    showToast(error.message || 'Error al eliminar', 'error');
                }
            }
        };

        document.getElementById('formCaso').addEventListener('submit', async (e) => {
            e.preventDefault();
            const id = document.getElementById('casoId').value;
            const payload = {
                cliente_id: document.getElementById('casoClienteId').value,
                descripcion: document.getElementById('casoDescripcion').value,
                estatus: document.getElementById('casoEstatus').value || 'Abierto'
            };

            const url = id ? `/casos/${id}` : `/casos`;
            const method = id ? 'PUT' : 'POST';

            const res = await apiFetch(url, {
                method,
                body: JSON.stringify(payload)
            });

            if (res.ok) {
                showToast(id ? 'Caso actualizado exitosamente' : 'Caso creado con folio automático', 'success');
                modalCaso.classList.remove('active');
                loadCasos(document.getElementById('searchInput').value);
            } else {
                const error = await res.json();
                showToast(error.message || 'Error al guardar', 'error');
            }
        });


        // 5. Clientes View Logic
        let globalClientes = [];

        const loadClientes = async () => {
            const res = await apiFetch('/clientes');
            if (res.ok) {
                globalClientes = await res.json();
                renderClientes(globalClientes);
            }
        };

        const renderClientes = (clientes) => {
            const tbody = document.getElementById('clientesTableBody');
            tbody.innerHTML = '';

            clientes.forEach(cli => {
                const tr = document.createElement('tr');
                tr.innerHTML = `
                    <td>${cli.id}</td>
                    <td><strong>${escHtml(cli.nombre)}</strong></td>
                    <td>${escHtml(cli.telefono || '-')}</td>
                    <td>${escHtml(cli.email || '-')}</td>
                    <td style="text-align: right;">
                        <button class="action-btn" onclick="editCliente(${cli.id})" title="Editar">
                            <span class="material-symbols-outlined">edit_square</span>
                        </button>
                        <button class="action-btn delete" onclick="deleteCliente(${cli.id})" title="Eliminar">
                            <span class="material-symbols-outlined" style="color: var(--danger)">delete</span>
                        </button>
                    </td>
                `;
                tbody.appendChild(tr);
            });
        };

        document.getElementById('btnNewCliente').addEventListener('click', () => {
            document.getElementById('formCliente').reset();
            document.getElementById('clienteId').value = '';
            document.getElementById('modalClienteTitle').textContent = 'Registrar Cliente';
            modalCliente.classList.add('active');
        });

        window.editCliente = (id) => {
            const cli = globalClientes.find(c => c.id === id);
            if(!cli) return;
            document.getElementById('clienteId').value = cli.id;
            document.getElementById('clienteNombre').value = cli.nombre;
            document.getElementById('clienteTelefono').value = cli.telefono;
            document.getElementById('clienteEmail').value = cli.email;
            document.getElementById('modalClienteTitle').textContent = 'Editar Cliente';
            modalCliente.classList.add('active');
        };

        window.deleteCliente = async (id) => {
            if(confirm("¿Eliminar cliente? Los casos asociados podrían perder su referencia principal.")) {
                const res = await apiFetch(`/clientes/${id}`, { method: 'DELETE' });
                if (res.ok) {
                    showToast('Cliente eliminado', 'success');
                    loadClientes();
                } else {
                    const error = await res.json();
                    showToast(error.message || 'Error eliminando cliente', 'error');
                }
            }
        };

        document.getElementById('formCliente').addEventListener('submit', async (e) => {
            e.preventDefault();
            const id = document.getElementById('clienteId').value;
            const payload = {
                nombre: document.getElementById('clienteNombre').value,
                telefono: document.getElementById('clienteTelefono').value,
                email: document.getElementById('clienteEmail').value
            };

            const url = id ? `/clientes/${id}` : '/clientes';
            const method = id ? 'PUT' : 'POST';

            const res = await apiFetch(url, {
                method,
                body: JSON.stringify(payload)
            });

            if (res.ok) {
                showToast(id ? 'Cliente actualizado' : 'Cliente registrado', 'success');
                modalCliente.classList.remove('active');
                loadClientes();
            } else {
                const error = await res.json();
                showToast(error.message || 'Error al guardar (Solo Administradores pueden gestionar clientes)', 'error');
            }
        });


        // Initialization
        loadCasos();
    }
}
