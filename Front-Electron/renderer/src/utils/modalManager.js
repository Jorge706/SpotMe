// utils/modalManager.js
let openModalFn = null;
let closeModalFn = null;

export function registerModalHandlers(open, close) {
    openModalFn = open;
    closeModalFn = close;
}

export function openModal(content) {
    if (openModalFn) openModalFn(content);
}

export function closeModal() {
    if (closeModalFn) closeModalFn();
}
