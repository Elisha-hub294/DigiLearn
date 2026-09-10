import { createContext, ReactNode, useContext, useMemo, useState } from "react";

type AccountDeletionState = {
  isDeletingAccount: boolean;
  setIsDeletingAccount: (deleting: boolean) => void;
};

const AccountDeletionContext = createContext<AccountDeletionState | undefined>(
  undefined,
);

export function AccountDeletionProvider({ children }: { children: ReactNode }) {
  const [isDeletingAccount, setIsDeletingAccount] = useState(false);
  const value = useMemo(
    () => ({ isDeletingAccount, setIsDeletingAccount }),
    [isDeletingAccount],
  );

  return (
    <AccountDeletionContext.Provider value={value}>
      {children}
    </AccountDeletionContext.Provider>
  );
}

export function useAccountDeletion() {
  const state = useContext(AccountDeletionContext);
  if (!state) {
    throw new Error(
      "useAccountDeletion must be used within AccountDeletionProvider",
    );
  }
  return state;
}
