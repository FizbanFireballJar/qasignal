import { Page, expect } from '@playwright/test';
import { BasePage } from './BasePage';

export class ProductsPage extends BasePage {
  // Selectors - main container
  private readonly productsContainer = '.products-container';

  // Selectors - tabs
  private readonly tabList = '.p-tabview-title:has-text("List")';
  private readonly tabStockLevels = '.p-tabview-title:has-text("Stock Levels")';
  private readonly tabWarehouse = '.p-tabview-title:has-text("Warehouse")';

  // Selectors - toolbar
  private readonly searchInput = 'input.search-input.p-inputtext';
  private readonly addProductButton = 'button:has-text("Add Product")';
  private readonly showOnlyActiveToggle = '.p-inputswitch';

  // Selectors - datatable
  private readonly dataTable = '.p-datatable';
  private readonly tableBody = '.p-datatable-tbody';
  private readonly tableRow = '.p-datatable-tbody tr';

  // Selectors - EAN code modal (first step of adding product)
  private readonly eanModal = '.add-product-dialog';
  private readonly eanCodeInput = '#eanCode';
  private readonly eanAddButton = '.add-product-dialog button:has-text("Add")';
  private readonly eanSkipButton = '.add-product-dialog button:has-text("Skip")';

  // Selectors - product form (side panel)
  private readonly productSidebar = '.product-sidebar';
  private readonly sidebarHeader = '.details-sidebar-header h2';
  private readonly sidebarForm = '#details-sidebar-form';
  private readonly sidebarCloseButton = '.product-sidebar .p-sidebar-close';

  // Selectors - form fields
  private readonly inputSystemId = '#text-systemId';
  private readonly inputExternalSystemId = '#text-externalSystemId';
  private readonly inputEan = '#text-ean';
  private readonly inputName = '#text-name';
  private readonly dropdownCategory = '#dropdown-category';
  private readonly inputWeightVolume = '#number-weightVolume input.p-inputnumber-input';
  private readonly dropdownUnitOfMeasurement = '#dropdown-unitOfMeasurement';
  private readonly inputMinQuantity = '#number-minQuantity input.p-inputnumber-input';
  private readonly inputMaxQuantity = '#number-maxQuantity input.p-inputnumber-input';
  private readonly inputPrice = '#number-price input.p-inputnumber-input';
  private readonly dropdownCurrency = '#dropdown-currency';
  private readonly dropdownVatCode = '#dropdown-vatCode';
  private readonly toggleReturnablePackagingSelector = '#returnablePackagingEnabled';
  private readonly dropdownStatus = '#dropdown-status';

  // Selectors - form action buttons
  private readonly buttonSave = '.product-sidebar button:has-text("Save")';
  private readonly buttonCancel = '.product-sidebar button:has-text("Cancel")';

  // Selectors - messages (PrimeNG toasts)
  private readonly successMessage = '.p-toast-message-success, .p-toast .p-toast-message, [class*="toast"][class*="success"]';
  private readonly errorMessage = '.p-toast-message-error, .p-toast .p-toast-message, [class*="toast"][class*="error"]';
  private readonly anyToastMessage = '.p-toast-message, .p-toast .p-toast-message';

  constructor(page: Page) {
    super(page);
  }

  // ==================== Navigation ====================

  async navigateToProducts(): Promise<void> {
    await this.page.goto('https://test.vend-portal.com/products');
    await this.verifyProductsPageLoaded();
  }

  async verifyProductsPageLoaded(): Promise<void> {
    await this.waitForSelector(this.productsContainer, { timeout: 10000 });
    await expect(this.page.locator(this.productsContainer)).toBeVisible();
  }

  // ==================== Toolbar ====================

  async clickAddProductButton(): Promise<void> {
    await this.page.locator(this.addProductButton).click();
  }

  async searchProduct(searchTerm: string): Promise<void> {
    await this.page.locator(this.searchInput).fill(searchTerm);
    await this.page.waitForTimeout(500);
  }

  async toggleShowOnlyActive(): Promise<void> {
    await this.page.locator(this.showOnlyActiveToggle).click();
  }

  // ==================== Tabs ====================

  async clickTabList(): Promise<void> {
    await this.page.locator(this.tabList).click();
  }

  async clickTabStockLevels(): Promise<void> {
    await this.page.locator(this.tabStockLevels).click();
  }

  async clickTabWarehouse(): Promise<void> {
    await this.page.locator(this.tabWarehouse).click();
  }

  // ==================== EAN Modal ====================

  async isEanModalVisible(): Promise<boolean> {
    return await this.page.locator(this.eanModal).isVisible();
  }

  async waitForEanModal(): Promise<void> {
    await this.page.locator(this.eanModal).waitFor({ state: 'visible', timeout: 5000 });
  }

  async fillEanCode(ean: string): Promise<void> {
    await this.page.locator(this.eanCodeInput).fill(ean);
  }

  async clickEanAddButton(): Promise<void> {
    await this.page.locator(this.eanAddButton).click();
  }

  async clickEanSkipButton(): Promise<void> {
    await this.page.locator(this.eanSkipButton).click();
  }

  // ==================== Product Form (Side Panel) ====================

  async isProductFormVisible(): Promise<boolean> {
    return await this.page.locator(this.productSidebar).isVisible();
  }

  async waitForProductForm(): Promise<void> {
    await this.page.locator(this.productSidebar).waitFor({ state: 'visible', timeout: 5000 });
  }

  async closeProductForm(): Promise<void> {
    await this.page.locator(this.sidebarCloseButton).click();
    await this.page.locator(this.productSidebar).waitFor({ state: 'hidden', timeout: 3000 });
  }

  // ==================== Form Fields - Text Inputs ====================

  async getEanValue(): Promise<string> {
    return await this.page.locator(this.inputEan).inputValue();
  }

  async fillName(name: string): Promise<void> {
    const input = this.page.locator(this.inputName);
    await input.click();
    await input.press('Control+a');
    await input.press('Delete');
    await input.pressSequentially(name, { delay: 50 });
    // Blur the field to ensure value is saved
    await input.press('Tab');
  }

  async fillExternalId(externalId: string): Promise<void> {
    await this.page.locator(this.inputExternalSystemId).fill(externalId);
  }

  async fillEan(ean: string): Promise<void> {
    await this.page.locator(this.inputEan).fill(ean);
  }

  // ==================== Form Fields - Number Inputs ====================

  async fillWeightVolume(value: string): Promise<void> {
    const input = this.page.locator(this.inputWeightVolume);
    await input.click();
    await input.press('Control+a');
    await input.press('Delete');
    await input.pressSequentially(value, { delay: 50 });
    await input.press('Tab');
  }

  async fillMinQuantity(value: string): Promise<void> {
    const input = this.page.locator(this.inputMinQuantity);
    await input.click();
    await input.press('Control+a');
    await input.press('Delete');
    await input.pressSequentially(value, { delay: 50 });
    await input.press('Tab');
  }

  async fillMaxQuantity(value: string): Promise<void> {
    const input = this.page.locator(this.inputMaxQuantity);
    await input.click();
    await input.press('Control+a');
    await input.press('Delete');
    await input.pressSequentially(value, { delay: 50 });
    await input.press('Tab');
  }

  async fillPrice(value: string): Promise<void> {
    const input = this.page.locator(this.inputPrice);
    await input.click();
    // Dla p-inputnumber: zaznacz wszystko i wpisz nową wartość
    await input.press('Control+a');
    await input.press('Delete');
    await input.pressSequentially(value, { delay: 50 });
  }

  // ==================== Form Fields - Dropdowns ====================

  private async selectDropdownOption(dropdownSelector: string, optionText: string): Promise<void> {
    await this.page.locator(dropdownSelector).click();
    await this.page.locator('.p-dropdown-panel').waitFor({ state: 'visible', timeout: 3000 });
    const option = this.page.locator(`.p-dropdown-item:has-text("${optionText}")`);
    const count = await option.count();
    if (count > 0) {
      await option.first().click();
      await this.page.locator('.p-dropdown-panel').waitFor({ state: 'hidden', timeout: 3000 });
    } else {
      await this.page.keyboard.press('Escape');
      throw new Error(`Option "${optionText}" not found in dropdown`);
    }
  }

  async selectCategory(category: string): Promise<void> {
    await this.selectDropdownOption(this.dropdownCategory, category);
  }

  async selectUnitOfMeasurement(unit: string): Promise<void> {
    await this.selectDropdownOption(this.dropdownUnitOfMeasurement, unit);
  }

  async selectCurrency(currency: string): Promise<void> {
    await this.selectDropdownOption(this.dropdownCurrency, currency);
  }

  async selectVatCode(vatCode: string): Promise<void> {
    await this.selectDropdownOption(this.dropdownVatCode, vatCode);
  }

  async selectStatus(status: string): Promise<void> {
    await this.selectDropdownOption(this.dropdownStatus, status);
  }

  async getStatusValue(): Promise<string> {
    const label = this.page.locator(`${this.dropdownStatus} .p-dropdown-label`);
    return await label.textContent() || '';
  }

  // ==================== Form Fields - Toggle ====================

  async toggleReturnablePackaging(): Promise<void> {
    await this.page.locator(this.toggleReturnablePackagingSelector).click();
  }

  // ==================== Form Actions ====================

  async clickSaveButton(): Promise<void> {
    await this.page.locator(this.buttonSave).click();
    // Poczekaj chwilę na pojawienie się toastu
    await this.page.waitForTimeout(500);
  }

  async clickCancelButton(): Promise<void> {
    await this.page.locator(this.buttonCancel).click();
  }

  // ==================== Table Verification ====================

  async isProductInTable(productName: string): Promise<boolean> {
    await this.searchProduct(productName);
    await this.page.waitForTimeout(1000);
    const row = this.page.locator(`${this.tableRow}:has-text("${productName}")`);
    return await row.count() > 0;
  }

  async getProductRowByName(productName: string): Promise<string> {
    const row = this.page.locator(`${this.tableRow}:has-text("${productName}")`);
    return await row.textContent() || '';
  }

  // ==================== Messages ====================

  async isSuccessMessageVisible(): Promise<boolean> {
    try {
      await this.page.locator(this.successMessage).waitFor({ state: 'visible', timeout: 5000 });
      return true;
    } catch {
      return false;
    }
  }

  async isErrorMessageVisible(): Promise<boolean> {
    try {
      await this.page.locator(this.errorMessage).waitFor({ state: 'visible', timeout: 5000 });
      return true;
    } catch {
      return false;
    }
  }

  async getSuccessMessageText(): Promise<string> {
    // Szukaj tekstu w dowolnym toaście - bardziej elastyczne podejście
    const toastTexts = [
      'Product has been created',
      'has been created',
      'created successfully',
      'saved successfully'
    ];
    
    for (const text of toastTexts) {
      const locator = this.page.getByText(text, { exact: false });
      try {
        await locator.waitFor({ state: 'visible', timeout: 2000 });
        return await locator.textContent() || '';
      } catch {
        // Tekst nie znaleziony, spróbuj następny
        continue;
      }
    }
    
    // Fallback - spróbuj ogólny selektor toastu
    const message = this.page.locator(this.anyToastMessage).first();
    try {
      await message.waitFor({ state: 'visible', timeout: 5000 });
      return await message.textContent() || '';
    } catch {
      return '';
    }
  }

  async clickSaveButtonAndWaitForSuccess(expectedText: string = 'created'): Promise<string> {
    await this.page.locator(this.buttonSave).click();
    // Poczekaj na pojawienie się tekstu sukcesu
    const locator = this.page.getByText(expectedText, { exact: false });
    try {
      await locator.waitFor({ state: 'visible', timeout: 10000 });
      const text = await locator.textContent() || '';
      return text;
    } catch {
      // Jeśli nie znaleziono tekstu, zwróć pusty string
      return '';
    }
  }

  // ==================== Complex Operations ====================

  async addNewProduct(productData: {
    ean?: string;
    name: string;
    price: string;
    currency?: string;
    weightVolume?: string;
    unitOfMeasurement?: string;
    minQuantity?: string;
    maxQuantity?: string;
    category?: string;
    vatCode?: string;
  }): Promise<void> {
    // Step 1: Click Add Product
    await this.clickAddProductButton();
    await this.waitForEanModal();

    // Step 2: Enter EAN or skip
    if (productData.ean) {
      await this.fillEanCode(productData.ean);
      await this.clickEanAddButton();
    } else {
      await this.clickEanSkipButton();
    }

    // Step 3: Wait for product form
    await this.waitForProductForm();

    // Step 4: Fill form fields
    await this.fillName(productData.name);
    if (productData.price) await this.fillPrice(productData.price);
    if (productData.currency) await this.selectCurrency(productData.currency);
    if (productData.weightVolume) await this.fillWeightVolume(productData.weightVolume);
    if (productData.unitOfMeasurement) await this.selectUnitOfMeasurement(productData.unitOfMeasurement);
    if (productData.minQuantity) await this.fillMinQuantity(productData.minQuantity);
    if (productData.maxQuantity) await this.fillMaxQuantity(productData.maxQuantity);
    if (productData.category) await this.selectCategory(productData.category);
    if (productData.vatCode) await this.selectVatCode(productData.vatCode);

    // Step 5: Save
    await this.clickSaveButton();
  }

  // ==================== Page Verification ====================

  async verifyProductsPageElements(): Promise<void> {
    await expect(this.page.locator(this.productsContainer)).toBeVisible();
    await expect(this.page.locator(this.searchInput)).toBeVisible();
    await expect(this.page.locator(this.addProductButton)).toBeVisible();
    await expect(this.page.locator(this.dataTable)).toBeVisible();
  }
}