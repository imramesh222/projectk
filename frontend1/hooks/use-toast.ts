'use client';

import * as React from 'react';

// Define the toast action element type
export type ToastActionElement = React.ReactElement<{
  onClick?: () => void;
  altText: string;
  children: React.ReactNode;
}>;

// Define toast variants
type ToastVariant = 'default' | 'destructive';

// Define toast props
export type ToastProps = {
  variant?: ToastVariant;
  title?: React.ReactNode;
  description?: React.ReactNode;
  action?: ToastActionElement;
  duration?: number;
  className?: string;
  onOpenChange?: (open: boolean) => void;
  open?: boolean;
};

type ToastWithId = ToastProps & { id: string };

// Toast state type
type ToastState = {
  toasts: ToastWithId[];
};

// Action types
type Action =
  | { type: 'ADD_TOAST'; toast: ToastWithId }
  | { type: 'UPDATE_TOAST'; toast: Partial<ToastProps> & { id: string } }
  | { type: 'DISMISS_TOAST'; toastId?: string }
  | { type: 'REMOVE_TOAST'; toastId?: string };

// Toast context
type ToastContextType = {
  state: ToastState;
  dispatch: React.Dispatch<Action>;
};

export const ToastContext = React.createContext<ToastContextType | undefined>(undefined);

// Toast provider
const TOAST_LIMIT = 1;
const TOAST_REMOVE_DELAY = 5000; // 5 seconds

function toastReducer(state: ToastState, action: Action): ToastState {
  switch (action.type) {
    case 'ADD_TOAST':
      return {
        ...state,
        toasts: [action.toast, ...state.toasts].slice(0, TOAST_LIMIT),
      };

    case 'UPDATE_TOAST':
      return {
        ...state,
        toasts: state.toasts.map((t) =>
          t.id === action.toast.id ? { ...t, ...action.toast } : t
        ),
      };

    case 'DISMISS_TOAST': {
      const { toastId } = action;
      return {
        ...state,
        toasts: state.toasts.map((t) =>
          !toastId || t.id === toastId ? { ...t, open: false } : t
        ),
      };
    }

    case 'REMOVE_TOAST': {
      const { toastId } = action;
      if (toastId === undefined) {
        return { toasts: [] };
      }
      return {
        ...state,
        toasts: state.toasts.filter((t) => t.id !== toastId),
      };
    }

    default:
      return state;
  }
}

// Toast provider component
// This is the main provider that should be used in the app
export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = React.useReducer(toastReducer, { toasts: [] });
  
  // Set up the global dispatch for the toast function
  React.useEffect(() => {
    setGlobalDispatch(dispatch);
    return () => setGlobalDispatch(null as any);
  }, [dispatch]);

  const value = React.useMemo(() => ({
    state,
    dispatch
  }), [state]);

  return React.createElement(
    ToastContext.Provider,
    { value },
    children
  );
}

// Toast hook
export function useToast() {
  const context = React.useContext(ToastContext);
  if (context === undefined) {
    throw new Error('useToast must be used within a ToastProvider');
  }

  const { state, dispatch } = context;

  const toast = React.useCallback(
    (props: ToastProps) => {
      const id = Math.random().toString(36).slice(2, 11);
      
      dispatch({
        type: 'ADD_TOAST',
        toast: {
          ...props,
          id,
          open: true,
          onOpenChange: (open: boolean) => {
            if (!open) {
              dispatch({ type: 'DISMISS_TOAST', toastId: id });
            }
            props.onOpenChange?.(open);
          },
        },
      });

      // Auto-dismiss after delay
      if (props.duration !== 0) {
        setTimeout(() => {
          dispatch({ type: 'DISMISS_TOAST', toastId: id });
        }, props.duration ?? TOAST_REMOVE_DELAY);
      }

      return {
        id,
        dismiss: () => dispatch({ type: 'DISMISS_TOAST', toastId: id }),
        update: (props: Partial<ToastProps>) =>
          dispatch({ type: 'UPDATE_TOAST', toast: { ...props, id } }),
      };
    },
    [dispatch]
  );

  return {
    ...state,
    toast,
    dismiss: (toastId?: string) => dispatch({ type: 'DISMISS_TOAST', toastId }),
  };
}

// Export toast instance
type ToastReturnType = {
  id: string;
  dismiss: () => void;
  update: (props: Partial<ToastProps>) => void;
};

// Global toast dispatcher (will be set by ToastProvider)
let globalDispatch: React.Dispatch<Action> | null = null;

export const setGlobalDispatch = (dispatch: React.Dispatch<Action>) => {
  globalDispatch = dispatch;
};

export const toast = (props: ToastProps): ToastReturnType => {
  if (typeof window === 'undefined') {
    return {
      id: 'dummy-id',
      dismiss: () => {},
      update: () => {},
    };
  }
  
  if (!globalDispatch) {
    console.warn('Toast not initialized. Make sure to wrap your app with <ToastProvider>');
    return {
      id: 'dummy-id',
      dismiss: () => {},
      update: () => {},
    };
  }

  const id = Math.random().toString(36).slice(2, 11);
  
  globalDispatch({
    type: 'ADD_TOAST',
    toast: {
      ...props,
      id,
      open: true,
      onOpenChange: (open: boolean) => {
        if (!open && globalDispatch) {
          globalDispatch({ type: 'DISMISS_TOAST', toastId: id });
        }
        props.onOpenChange?.(open);
      },
    },
  });

  // Auto-dismiss after delay
  if (props.duration !== 0) {
    setTimeout(() => {
      if (globalDispatch) {
        globalDispatch({ type: 'DISMISS_TOAST', toastId: id });
      }
    }, props.duration ?? TOAST_REMOVE_DELAY);
  }

  return {
    id,
    dismiss: () => {
      if (globalDispatch) {
        globalDispatch({ type: 'DISMISS_TOAST', toastId: id });
      }
    },
    update: (updateProps: Partial<ToastProps>) => {
      if (globalDispatch) {
        globalDispatch({ type: 'UPDATE_TOAST', toast: { ...updateProps, id } });
      }
    },
  };
};

// Export the toast context and provider for advanced use cases
export const useToastContext = () => {
  const context = React.useContext(ToastContext);
  if (context === undefined) {
    throw new Error('useToastContext must be used within a ToastProvider');
  }
  return context;
};

// Toast component
export const Toaster = () => {
  const { state, dispatch } = useToastContext();
  
  return React.createElement(
    'div',
    { 
      className: 'fixed top-0 right-0 z-50 flex flex-col items-end p-4 space-y-2' 
    },
    state.toasts.map((toast) =>
      React.createElement(
        'div',
        {
          key: toast.id,
          className: `px-4 py-2 rounded-md shadow-md ${
            toast.variant === 'destructive' 
              ? 'bg-red-500 text-white' 
              : 'bg-white text-gray-900 border border-gray-200'
          }`
        },
        [
          toast.title && React.createElement('div', { key: 'title', className: 'font-semibold' }, toast.title),
          toast.description && React.createElement('div', { key: 'desc', className: 'text-sm' }, toast.description),
          toast.action && React.createElement(
            'div',
            { key: 'action', className: 'mt-2' },
            React.cloneElement(toast.action, {
              onClick: () => {
                toast.action?.props.onClick?.();
                dispatch({ type: 'DISMISS_TOAST', toastId: toast.id });
              },
            })
          )
        ].filter(Boolean)
      )
    )
  );
};