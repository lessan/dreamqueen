import { state } from '../state.js';

export function init(container) {
  container.innerHTML = `
    <div class="screen" data-screen="avatareditor" style="align-items: center; justify-content: center; gap: 16px; padding: 24px;">
      <h2 style="color: var(--color-primary);">Customise Avatar</h2>
      <div id="avatar-preview" style="width: 150px; height: 200px; background: var(--color-surface); border-radius: 12px;"></div>
      <div id="editor-options" style="color: var(--color-secondary); font-size: 14px;">
        Options coming soon...
      </div>
      <button class="btn btn--primary" id="btn-done">Done</button>
    </div>
  `;
}

export function destroy() {}
