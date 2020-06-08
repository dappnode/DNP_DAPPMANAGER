// Installer types

export interface SelectedCategories {
  [category: string]: boolean;
}

export interface SetupWizardFormDataReturn {
  [dnpName: string]: {
    [propId: string]: string;
  };
}

export interface EnvsVerbose {
  [name: string]: {
    name: string;
    value: string;
    index: number;
  };
}
