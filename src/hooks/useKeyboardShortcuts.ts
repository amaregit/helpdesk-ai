import { useEffect } from 'react';

interface ShortcutConfig {
  key: string;
  ctrlKey?: boolean;
  shiftKey?: boolean;
  altKey?: boolean;
  metaKey?: boolean;
  action: () => void;
  description: string;
}

export function useKeyboardShortcuts(shortcuts: ShortcutConfig[]) {
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      for (const shortcut of shortcuts) {
        const {
          key,
          ctrlKey = false,
          shiftKey = false,
          altKey = false,
          metaKey = false,
          action
        } = shortcut;

        if (
          event.key.toLowerCase() === key.toLowerCase() &&
          event.ctrlKey === ctrlKey &&
          event.shiftKey === shiftKey &&
          event.altKey === altKey &&
          event.metaKey === metaKey
        ) {
          event.preventDefault();
          action();
          break;
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [shortcuts]);
}

// Predefined shortcuts for the chat
export const useChatShortcuts = (
  onNewChat: () => void,
  onFocusInput: () => void,
  onToggleTheme: () => void,
  onExportChat: () => void
) => {
  const shortcuts: ShortcutConfig[] = [
    {
      key: 'n',
      ctrlKey: true,
      action: onNewChat,
      description: 'New chat'
    },
    {
      key: 'k',
      ctrlKey: true,
      action: onFocusInput,
      description: 'Focus input'
    },
    {
      key: 't',
      ctrlKey: true,
      action: onToggleTheme,
      description: 'Toggle theme'
    },
    {
      key: 'e',
      ctrlKey: true,
      shiftKey: true,
      action: onExportChat,
      description: 'Export chat'
    },
    {
      key: '/',
      ctrlKey: true,
      action: () => {
        // Show shortcuts help
        console.log('Keyboard shortcuts:');
        shortcuts.forEach(s => {
          const modifiers = [
            s.ctrlKey && 'Ctrl',
            s.shiftKey && 'Shift',
            s.altKey && 'Alt',
            s.metaKey && 'Cmd'
          ].filter(Boolean).join('+');
          console.log(`${modifiers}+${s.key}: ${s.description}`);
        });
      },
      description: 'Show shortcuts'
    }
  ];

  useKeyboardShortcuts(shortcuts);
  return shortcuts;
};