class MedaclinicApp {
    constructor() {
        this.apiBase = 'http://localhost:3000/api';

        this.acciones = JSON.parse(localStorage.getItem('acciones')) || [];

        this.init();
    }

    init() {
        this.bindEvents();
        this.checkAuth();
    }

    bindEvents() {
        const loginForm = document.getElementById('loginForm');
        if (loginForm) {
            loginForm.addEventListener('submit', (e) => this.login(e));
            const togglePass = document.getElementById('togglePass');
            if (togglePass) togglePass.addEventListener('click', () => this.togglePassword());
        }

        const registerForm = document.getElementById('registerForm');
        if (registerForm) {
            registerForm.addEventListener('submit', (e) => this.register(e));
        }

        document.getElementById('logoutBtn')?.addEventListener('click', () => this.logout());

        this.initDashboard();
    }

    // =====================
    // LOGIN
    // =====================
    async login(e) {
        e.preventDefault();

        const btn = document.getElementById('loginBtn');
        const spinner = btn?.querySelector('.spinner');
        const text = btn?.querySelector('.btn-text') || btn;

        const username = document.getElementById('username').value;
        const password = document.getElementById('password').value;

        btn.disabled = true;
        if (spinner) spinner.style.display = 'block';
        text.textContent = 'Ingresando...';

        try {
            const response = await fetch(`${this.apiBase}/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username, password })
            });

            const data = await response.json();

            if (data.success) {
                localStorage.setItem('token', data.token);
                localStorage.setItem('user', JSON.stringify(data.user));

                this.showAlert('¡Login exitoso!', 'success');

                setTimeout(() => {
                    window.location.href = 'dashboard.html';
                }, 1000);

            } else {
                this.showAlert(data.error || 'Credenciales inválidas', 'error');
            }

        } catch (error) {
            this.showAlert('Error de servidor', 'error');
        } finally {
            btn.disabled = false;
            if (spinner) spinner.style.display = 'none';
            text.textContent = 'Ingresar';
        }
    }

    // =====================
    // 🔥 REGISTER (ARREGLADO)
    // =====================
    async register(e) {
        e.preventDefault();

        const username =
            document.getElementById('regUsername')?.value ||
            document.getElementById('username')?.value;

        const email =
            document.getElementById('regEmail')?.value || '';

        const password =
            document.getElementById('regPassword')?.value ||
            document.getElementById('password')?.value;

        if (!username || !password) {
            this.showAlert('Completa usuario y contraseña', 'error');
            return;
        }

        try {
            const response = await fetch(`${this.apiBase}/register`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    username,
                    email,
                    password
                })
            });

            const data = await response.json();

            if (data.success) {
                this.showAlert('Cuenta creada correctamente', 'success');

                setTimeout(() => {
                    window.location.href = 'index.html';
                }, 1200);

            } else {
                this.showAlert(data.error || 'Error al registrar', 'error');
            }

        } catch (error) {
            console.error(error);
            this.showAlert('Error de servidor', 'error');
        }
    }

    // =====================
    // PASSWORD TOGGLE
    // =====================
    togglePassword() {
        const passInput = document.getElementById('password');
        const toggle = document.getElementById('togglePass');

        if (!passInput || !toggle) return;

        if (passInput.type === 'password') {
            passInput.type = 'text';
            toggle.classList.replace('fa-eye', 'fa-eye-slash');
        } else {
            passInput.type = 'password';
            toggle.classList.replace('fa-eye-slash', 'fa-eye');
        }
    }

    checkAuth() {
        const token = localStorage.getItem('token');
        const isDashboard = document.querySelector('.dashboard-page');

        if (isDashboard && !token) {
            window.location.href = 'index.html';
        }

        if (isDashboard && token) {
            this.loadUser();
        }
    }

    initDashboard() {
        const isDashboard = document.querySelector('.dashboard-page');
        if (!isDashboard) return;

        this.loadUser();
        this.loadStats();
        this.bindMenuEvents();

        this.renderAcciones();
        this.bindDashboardActions();
    }

    loadUser() {
        const user = JSON.parse(localStorage.getItem('user') || '{}');
        const userInfo = document.getElementById('userInfo');

        if (userInfo && user.username) {
            userInfo.innerHTML = `
                <i class="fas fa-user-circle"></i>
                <span>${user.username} <small>(${user.role})</small></span>
            `;
        }
    }

    async loadStats() {
        try {
            const token = localStorage.getItem('token');

            const response = await fetch(`${this.apiBase}/dashboard`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });

            const data = await response.json();

            if (data.stats) {
                document.getElementById('totalUsers').textContent =
                    data.stats.totalUsers || data.stats.patients || 25;

                document.getElementById('totalAppointments').textContent =
                    data.stats.appointments || 12;

                document.getElementById('totalDoctors').textContent =
                    data.stats.doctors || 8;

                document.getElementById('pending').textContent = 3;
            }

        } catch (err) {
            console.log('Stats error:', err);
        }
    }

    bindMenuEvents() {
        document.querySelectorAll('.menu-item').forEach(item => {
            item.addEventListener('click', () => {
                document.querySelector('.menu-item.active')?.classList.remove('active');
                item.classList.add('active');

                this.showPage(item.dataset.page);
            });
        });
    }

    showPage(page) {
        const titles = {
            overview: 'Resumen General',
            patients: 'Pacientes',
            appointments: 'Citas',
            profile: 'Perfil',
            reports: 'Reportes'
        };

        const pageTitle = document.getElementById('pageTitle');
        const content = document.getElementById('dashboardContent');

        if (pageTitle) {
            pageTitle.textContent = titles[page] || 'Dashboard';
        }

        if (content && page === 'profile') {
            const user = JSON.parse(localStorage.getItem('user') || '{}');

            content.innerHTML = `
                <div class="card">
                    <h3>Perfil</h3>
                    <p>Usuario: ${user.username}</p>
                    <p>Rol: ${user.role}</p>
                </div>
            `;
        }
    }

    logout() {
        if (confirm('¿Cerrar sesión?')) {
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            window.location.href = 'index.html';
        }
    }

    showAlert(message, type = 'success') {
        const container = document.getElementById('alertContainer');
        if (!container) return;

        const alert = document.createElement('div');
        alert.className = `alert ${type}`;

        alert.innerHTML = `
            <i class="fas ${type === 'success' ? 'fa-check-circle' : 'fa-exclamation-circle'}"></i>
            ${message}
        `;

        container.appendChild(alert);

        setTimeout(() => alert.classList.add('show'), 100);
        setTimeout(() => alert.remove(), 3000);
    }

    // CRUD ACCIONES
    crearAccion(data) {
        data.id = Date.now();
        this.acciones.push(data);
        this.saveAcciones();
        this.renderAcciones();
    }

    eliminarAccion(id) {
        this.acciones = this.acciones.filter(a => a.id !== id);
        this.saveAcciones();
        this.renderAcciones();
    }

    saveAcciones() {
        localStorage.setItem('acciones', JSON.stringify(this.acciones));
    }

    renderAcciones() {
        const container = document.getElementById('accionesList');
        if (!container) return;

        container.innerHTML = '';

        this.acciones.forEach(a => {
            container.innerHTML += `
                <div class="card">
                    <strong>${a.paciente}</strong><br>
                    ${a.doctor} - ${a.fecha}<br>
                    <span>${a.estado}</span>
                    <button onclick="app.eliminarAccion(${a.id})">🗑️</button>
                </div>
            `;
        });
    }

    bindDashboardActions() {
        const btnNew = document.querySelector('.btn-primary');
        const btnExport = document.querySelector('.btn-secondary');

        btnNew?.addEventListener('click', () => this.openModal());
        btnExport?.addEventListener('click', () => this.exportExcel());

        document.getElementById('saveAccionBtn')?.addEventListener('click', () => this.saveNewAccion());
    }

    openModal() {
        document.getElementById('modalAccion')?.classList.remove('hidden');
    }

    closeModal() {
        document.getElementById('modalAccion')?.classList.add('hidden');
    }

    saveNewAccion() {
        const data = {
            paciente: document.getElementById('paciente').value,
            doctor: document.getElementById('doctor').value,
            fecha: document.getElementById('fecha').value,
            estado: document.getElementById('estado').value
        };

        this.crearAccion(data);
        this.closeModal();
    }

    exportExcel() {
        const ws = XLSX.utils.json_to_sheet(this.acciones);
        const wb = XLSX.utils.book_new();

        XLSX.utils.book_append_sheet(wb, ws, 'Acciones');

        XLSX.writeFile(wb, 'medaclinic_acciones.xlsx');
    }
}

const app = new MedaclinicApp();