import { createRoot, type Root } from 'react-dom/client';
import { createElement } from 'react';
import { Streamdown } from 'streamdown';

interface StreamdownState {
  text: string;
  streaming: boolean;
}

const roots = new WeakMap<HTMLElement, Root>();

export function renderStreamdown(el: HTMLElement, text: string, streaming: boolean) {
  let root = roots.get(el);
  if (!root) {
    el.textContent = '';
    root = createRoot(el);
    roots.set(el, root);
  }
  root.render(
    createElement(
      Streamdown,
      {
        isAnimating: streaming,
        animated: {
          animation: 'fadeIn',
          duration: 150,
          easing: 'ease',
          stagger: 0,
        },
        className: 'ballet-streamdown',
      },
      text,
    ),
  );
}

export function unmountStreamdown(el: HTMLElement) {
  const root = roots.get(el);
  if (root) {
    root.unmount();
    roots.delete(el);
  }
}

declare global {
  interface Window {
    __balletStreamdown?: {
      render: (el: HTMLElement, text: string, streaming: boolean) => void;
      unmount: (el: HTMLElement) => void;
    };
  }
}

window.__balletStreamdown = {
  render: renderStreamdown,
  unmount: unmountStreamdown,
};

export type { StreamdownState };
