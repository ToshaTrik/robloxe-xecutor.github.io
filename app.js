// --- Data Store ---
// Manages data persistence in localStorage.
const store = {
    key: 'courses_data',

    getCourses() {
        try {
            const data = localStorage.getItem(this.key);
            return data ? JSON.parse(data) : [];
        } catch (e) {
            console.error("Error reading from localStorage", e);
            return [];
        }
    },

    saveCourses(courses) {
        try {
            localStorage.setItem(this.key, JSON.stringify(courses));
        } catch (e) {
            console.error("Error writing to localStorage", e);
        }
    },

    // CRUD operations on the entire dataset
    addCourse(title, description) {
        const courses = this.getCourses();
        courses.push({
            id: self.crypto.randomUUID(),
            title,
            description,
            modules: []
        });
        this.saveCourses(courses);
    },
    
    updateCourse(courseId, newTitle, newDescription) {
        const courses = this.getCourses();
        const course = courses.find(c => c.id === courseId);
        if(course) {
            course.title = newTitle;
            course.description = newDescription;
            this.saveCourses(courses);
        }
    },

    deleteCourse(courseId) {
        let courses = this.getCourses();
        courses = courses.filter(c => c.id !== courseId);
        this.saveCourses(courses);
    },

    addModule(courseId, title) {
        const courses = this.getCourses();
        const course = courses.find(c => c.id === courseId);
        if (course) {
            course.modules.push({
                id: self.crypto.randomUUID(),
                title,
                submodules: []
            });
            this.saveCourses(courses);
        }
    },

    updateModule(courseId, moduleId, newTitle) {
        const courses = this.getCourses();
        const course = courses.find(c => c.id === courseId);
        if (course) {
            const module = course.modules.find(m => m.id === moduleId);
            if(module) {
                module.title = newTitle;
                this.saveCourses(courses);
            }
        }
    },

    deleteModule(courseId, moduleId) {
        const courses = this.getCourses();
        const course = courses.find(c => c.id === courseId);
        if (course) {
            course.modules = course.modules.filter(m => m.id !== moduleId);
            this.saveCourses(courses);
        }
    },
    
    addSubmodule(courseId, moduleId, title, content) {
        const courses = this.getCourses();
        const course = courses.find(c => c.id === courseId);
        if (course) {
            const module = course.modules.find(m => m.id === moduleId);
            if (module) {
                module.submodules.push({
                    id: self.crypto.randomUUID(),
                    title,
                    content
                });
                this.saveCourses(courses);
            }
        }
    },

    updateSubmodule(courseId, moduleId, submoduleId, newTitle, newContent) {
        const courses = this.getCourses();
        const course = courses.find(c => c.id === courseId);
        if (course) {
            const module = course.modules.find(m => m.id === moduleId);
            if(module) {
                const submodule = module.submodules.find(s => s.id === submoduleId);
                if(submodule) {
                    submodule.title = newTitle;
                    submodule.content = newContent;
                    this.saveCourses(courses);
                }
            }
        }
    },

    deleteSubmodule(courseId, moduleId, submoduleId) {
        const courses = this.getCourses();
        const course = courses.find(c => c.id === courseId);
        if (course) {
            const module = course.modules.find(m => m.id === moduleId);
            if (module) {
                module.submodules = module.submodules.filter(s => s.id !== submoduleId);
                this.saveCourses(courses);
            }
        }
    },
};

// --- App ---
// Manages UI rendering and application state.
class App {
    constructor(root) {
        this.root = root;
        this.courses = store.getCourses();
        this.activeCourseId = null;
        this.activeSubmoduleId = null;
        
        // Admin state
        this.editingCourseId = null;
        this.editingModuleId = null;
        this.editingSubmoduleId = null;

        window.addEventListener('hashchange', () => this.route());
        window.addEventListener('load', () => this.route());
    }

    route() {
        const hash = window.location.hash || '#/';
        const navLinks = document.querySelectorAll('header nav a');
        navLinks.forEach(link => {
            link.classList.toggle('active', link.getAttribute('href') === hash);
        });

        if (hash.startsWith('#/admin')) {
            this.renderAdminView();
        } else {
            this.renderCourseView();
        }
    }
    
    // --- Course Viewer Methods ---

    renderCourseView() {
        this.root.innerHTML = `
            <div class="container">
                <aside class="sidebar" id="course-sidebar"></aside>
                <section class="content" id="course-content"></section>
            </div>
        `;
        this.renderCourseList();
        this.renderCourseContent();
    }

    renderCourseList() {
        const sidebar = document.getElementById('course-sidebar');
        if (!sidebar) return;
        
        let listHtml = '<h3>Курсы</h3>';
        if (this.courses.length === 0) {
            listHtml += '<p>Курсы еще не добавлены.</p>';
        } else {
            listHtml += '<ul class="course-list">';
            this.courses.forEach(course => {
                const isActive = course.id === this.activeCourseId ? 'active' : '';
                listHtml += `<li class="course-list-item ${isActive}" data-id="${course.id}">${course.title}</li>`;
            });
            listHtml += '</ul>';
        }
        sidebar.innerHTML = listHtml;

        sidebar.querySelectorAll('.course-list-item').forEach(item => {
            item.addEventListener('click', (e) => {
                this.activeCourseId = e.target.dataset.id;
                this.activeSubmoduleId = null; // Reset submodule on course change
                this.courses = store.getCourses(); // Refresh data
                this.renderCourseList(); // Re-render list for active state
                this.renderCourseContent();
            });
        });
    }

    renderCourseContent() {
        const contentEl = document.getElementById('course-content');
        if (!contentEl) return;
        
        const course = this.courses.find(c => c.id === this.activeCourseId);

        if (!course) {
            contentEl.innerHTML = `<div class="placeholder"><h2>Добро пожаловать!</h2><p>Выберите курс из списка слева, чтобы начать обучение.</p></div>`;
            return;
        }

        let contentHtml = `
            <h2>${course.title}</h2>
            <p>${course.description}</p>
        `;

        if (course.modules.length > 0) {
            course.modules.forEach(module => {
                contentHtml += `<h3 class="module-title">${module.title}</h3>`;
                if (module.submodules.length > 0) {
                    contentHtml += `<div class="module-content"><ul>`;
                    module.submodules.forEach(submodule => {
                        const isActive = submodule.id === this.activeSubmoduleId ? 'active' : '';
                        contentHtml += `<li><button class="submodule-list-item ${isActive}" data-course-id="${course.id}" data-submodule-id="${submodule.id}">${submodule.title}</button></li>`;
                    });
                    contentHtml += `</ul></div>`;
                } else {
                    contentHtml += `<p>В этом модуле пока нет уроков.</p>`;
                }
            });
        } else {
            contentHtml += `<p>В этом курсе пока нет модулей.</p>`;
        }
        
        const submodule = this.getActiveSubmodule();
        if(submodule) {
            contentHtml += `
                <hr style="margin: 2rem 0;">
                <h3>${submodule.title}</h3>
                <div>${submodule.content}</div>
            `;
        }

        contentEl.innerHTML = contentHtml;
        
        contentEl.querySelectorAll('.submodule-list-item').forEach(item => {
           item.addEventListener('click', (e) => {
               this.activeCourseId = e.target.dataset.courseId;
               this.activeSubmoduleId = e.target.dataset.submoduleId;
               this.renderCourseContent();
           })
        });
    }
    
    getActiveSubmodule() {
        if (!this.activeCourseId || !this.activeSubmoduleId) return null;
        const course = this.courses.find(c => c.id === this.activeCourseId);
        if (!course) return null;
        for (const module of course.modules) {
            const submodule = module.submodules.find(s => s.id === this.activeSubmoduleId);
            if(submodule) return submodule;
        }
        return null;
    }


    // --- Admin View Methods ---

    renderAdminView() {
        this.root.innerHTML = `
            <div class="admin-container">
                <aside class="admin-sidebar" id="admin-sidebar"></aside>
                <main class="admin-main" id="admin-main"></main>
            </div>
        `;
        this.renderAdminSidebar();
        this.renderAdminMain();
    }
    
    renderAdminSidebar() {
        const sidebar = document.getElementById('admin-sidebar');
        if (!sidebar) return;
        this.courses = store.getCourses();

        let listHtml = `
            <div class="card">
                <h2>Курсы</h2>
                <div id="course-admin-list"></div>
                <button class="btn" id="add-course-btn">Добавить новый курс</button>
            </div>
        `;
        sidebar.innerHTML = listHtml;
        
        const courseAdminList = document.getElementById('course-admin-list');
        this.courses.forEach(course => {
            const item = document.createElement('div');
            item.className = 'admin-item';
            item.innerHTML = `
                <span class="admin-item-title">${course.title}</span>
                <div class="actions">
                    <button class="btn-secondary" data-action="edit" data-id="${course.id}">✏️</button>
                    <button class="btn-danger" data-action="delete" data-id="${course.id}">🗑️</button>
                </div>`;
            courseAdminList.appendChild(item);
        });

        document.getElementById('add-course-btn').addEventListener('click', () => {
            this.editingCourseId = null;
            this.renderAdminMain();
        });

        courseAdminList.querySelectorAll('button[data-action="delete"]').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const courseId = e.currentTarget.dataset.id;
                if(confirm('Вы уверены, что хотите удалить этот курс со всеми модулями и уроками?')) {
                    store.deleteCourse(courseId);
                    if(this.editingCourseId === courseId) this.editingCourseId = null;
                    this.renderAdminView();
                }
            });
        });
        
        courseAdminList.querySelectorAll('.admin-item-title, button[data-action="edit"]').forEach(el => {
            el.addEventListener('click', (e) => {
                this.editingCourseId = e.currentTarget.dataset.id || e.currentTarget.closest('.admin-item').querySelector('button').dataset.id;
                this.editingModuleId = null;
                this.editingSubmoduleId = null;
                this.renderAdminMain();
            });
        });
    }

    renderAdminMain() {
        const main = document.getElementById('admin-main');
        if (!main) return;
        this.courses = store.getCourses(); // Refresh data

        if (!this.editingCourseId) {
            main.innerHTML = this.getCourseFormHtml();
        } else {
            const course = this.courses.find(c => c.id === this.editingCourseId);
            if (!course) {
                this.editingCourseId = null;
                this.renderAdminMain();
                return;
            }
            main.innerHTML = this.getCourseFormHtml(course);
            main.innerHTML += this.getModuleListHtml(course);

            if(this.editingModuleId) {
                const module = course.modules.find(m => m.id === this.editingModuleId);
                if(module) {
                    main.innerHTML += this.getSubmoduleListHtml(course, module);
                    if(this.editingSubmoduleId) {
                        const submodule = module.submodules.find(s => s.id === this.editingSubmoduleId);
                        main.innerHTML += this.getSubmoduleFormHtml(course.id, module.id, submodule);
                    } else {
                        main.innerHTML += this.getSubmoduleFormHtml(course.id, module.id);
                    }
                }
            }
        }
        this.attachAdminFormListeners();
    }
    
    getCourseFormHtml(course = null) {
        return `
        <div class="card">
            <h2>${course ? 'Редактировать курс' : 'Создать новый курс'}</h2>
            <form id="course-form">
                <input type="hidden" name="courseId" value="${course?.id || ''}">
                <div class="form-group">
                    <label for="courseTitle">Название курса</label>
                    <input type="text" id="courseTitle" name="title" value="${course?.title || ''}" required>
                </div>
                <div class="form-group">
                    <label for="courseDescription">Описание курса</label>
                    <textarea id="courseDescription" name="description">${course?.description || ''}</textarea>
                </div>
                <button type="submit" class="btn">${course ? 'Сохранить изменения' : 'Создать курс'}</button>
            </form>
        </div>
        `;
    }

    getModuleListHtml(course) {
        let html = `
        <div class="card">
            <h2>Модули курса "${course.title}"</h2>
            <div id="module-admin-list">`;

        course.modules.forEach(module => {
            html += `
            <div class="admin-item">
                <span class="admin-item-title" data-module-id="${module.id}">${module.title}</span>
                <div class="actions">
                    <button class="btn-danger" data-action="delete-module" data-course-id="${course.id}" data-module-id="${module.id}">🗑️</button>
                </div>
            </div>`;
        });
        
        html += `</div><hr>`;

        // Form for new/editing module
        const editingModule = course.modules.find(m => m.id === this.editingModuleId);
        html += `
            <h3>${editingModule ? 'Редактировать модуль' : 'Добавить новый модуль'}</h3>
            <form id="module-form">
                <input type="hidden" name="courseId" value="${course.id}">
                <input type="hidden" name="moduleId" value="${editingModule?.id || ''}">
                <div class="form-group">
                    <label for="moduleTitle">Название модуля</label>
                    <input type="text" id="moduleTitle" name="title" value="${editingModule?.title || ''}" required>
                </div>
                <button type="submit" class="btn">${editingModule ? 'Сохранить' : 'Добавить модуль'}</button>
                ${editingModule ? `<button type="button" class="btn-secondary" id="cancel-edit-module">Отмена</button>` : ''}
            </form>
        </div>`;

        return html;
    }

    getSubmoduleListHtml(course, module) {
        let html = `
        <div class="card">
            <h2>Уроки в модуле "${module.title}"</h2>
            <div id="submodule-admin-list">`;
        
        module.submodules.forEach(submodule => {
            html += `
            <div class="admin-item">
                <span class="admin-item-title" data-submodule-id="${submodule.id}">${submodule.title}</span>
                 <div class="actions">
                    <button class="btn-danger" data-action="delete-submodule" data-course-id="${course.id}" data-module-id="${module.id}" data-submodule-id="${submodule.id}">🗑️</button>
                </div>
            </div>`;
        });

        html += `</div></div>`;
        return html;
    }

    getSubmoduleFormHtml(courseId, moduleId, submodule = null) {
        return `
        <div class="card">
            <h3>${submodule ? 'Редактировать урок' : 'Добавить новый урок'}</h3>
            <form id="submodule-form">
                <input type="hidden" name="courseId" value="${courseId}">
                <input type="hidden" name="moduleId" value="${moduleId}">
                <input type="hidden" name="submoduleId" value="${submodule?.id || ''}">
                <div class="form-group">
                    <label for="submoduleTitle">Название урока</label>
                    <input type="text" id="submoduleTitle" name="title" value="${submodule?.title || ''}" required>
                </div>
                <div class="form-group">
                    <label for="submoduleContent">Содержимое урока (HTML)</label>
                    <textarea id="submoduleContent" name="content">${submodule?.content || ''}</textarea>
                </div>
                <button type="submit" class="btn">${submodule ? 'Сохранить' : 'Добавить урок'}</button>
                ${submodule ? `<button type="button" class="btn-secondary" id="cancel-edit-submodule">Отмена</button>` : ''}
            </form>
        </div>
        `;
    }

    attachAdminFormListeners() {
        // Course form
        const courseForm = document.getElementById('course-form');
        if(courseForm) {
            courseForm.addEventListener('submit', (e) => {
                e.preventDefault();
                const formData = new FormData(courseForm);
                const id = formData.get('courseId');
                const title = formData.get('title');
                const description = formData.get('description');
                if (id) {
                    store.updateCourse(id, title, description);
                } else {
                    store.addCourse(title, description);
                }
                this.renderAdminView();
            });
        }
        
        // Module form
        const moduleForm = document.getElementById('module-form');
        if(moduleForm) {
            moduleForm.addEventListener('submit', e => {
                e.preventDefault();
                const formData = new FormData(moduleForm);
                const courseId = formData.get('courseId');
                const moduleId = formData.get('moduleId');
                const title = formData.get('title');
                if(moduleId) {
                    store.updateModule(courseId, moduleId, title);
                } else {
                    store.addModule(courseId, title);
                }
                this.editingModuleId = null;
                this.renderAdminMain();
            });
        }

        // Submodule form
        const submoduleForm = document.getElementById('submodule-form');
        if(submoduleForm) {
            submoduleForm.addEventListener('submit', e => {
                e.preventDefault();
                const formData = new FormData(submoduleForm);
                const courseId = formData.get('courseId');
                const moduleId = formData.get('moduleId');
                const submoduleId = formData.get('submoduleId');
                const title = formData.get('title');
                const content = formData.get('content');

                if(submoduleId) {
                    store.updateSubmodule(courseId, moduleId, submoduleId, title, content);
                } else {
                    store.addSubmodule(courseId, moduleId, title, content);
                }
                this.editingSubmoduleId = null;
                this.renderAdminMain();
            });
        }


        // Event delegation for actions
        const adminMain = document.getElementById('admin-main');
        if(adminMain) {
            adminMain.addEventListener('click', e => {
                const target = e.target;
                
                // Edit/Select Module
                if(target.matches('#module-admin-list .admin-item-title')) {
                    this.editingModuleId = target.dataset.moduleId;
                    this.editingSubmoduleId = null;
                    this.renderAdminMain();
                }

                // Edit/Select Submodule
                if(target.matches('#submodule-admin-list .admin-item-title')) {
                    this.editingSubmoduleId = target.dataset.submoduleId;
                    this.renderAdminMain();
                }

                // Delete Module
                if(target.matches('button[data-action="delete-module"]')) {
                    if (confirm('Удалить этот модуль со всеми уроками?')) {
                        store.deleteModule(target.dataset.courseId, target.dataset.moduleId);
                        this.editingModuleId = null;
                        this.editingSubmoduleId = null;
                        this.renderAdminMain();
                    }
                }

                // Delete Submodule
                if(target.matches('button[data-action="delete-submodule"]')) {
                    if (confirm('Удалить этот урок?')) {
                        store.deleteSubmodule(target.dataset.courseId, target.dataset.moduleId, target.dataset.submoduleId);
                        this.editingSubmoduleId = null;
                        this.renderAdminMain();
                    }
                }

                // Cancel buttons
                if(target.id === 'cancel-edit-module') {
                    this.editingModuleId = null;
                    this.editingSubmoduleId = null;
                    this.renderAdminMain();
                }
                if(target.id === 'cancel-edit-submodule') {
                    this.editingSubmoduleId = null;
                    this.renderAdminMain();
                }

            });
        }
    }
}

// Initialize the app
document.addEventListener('DOMContentLoaded', () => {
    new App(document.getElementById('app'));
});

