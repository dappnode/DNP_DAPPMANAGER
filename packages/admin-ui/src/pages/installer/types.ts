// Installer types

export interface SelectedCategories {
  [category: string]: boolean;
}

export interface SetupWizardFormDataReturn {
  [dnpName: string]: {
    [propId: string]: string;
  };
}
