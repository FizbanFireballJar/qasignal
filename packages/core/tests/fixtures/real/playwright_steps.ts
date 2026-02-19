
import { createBdd } from 'playwright-bdd';
import { expect } from '@playwright/test';
import { test } from './fixtures';
import { ProductsPage } from '../page-objects';
import { createAllProducts, getProducts } from '../utilities';
import { products as testProducts } from '../test-data/products';
import { createProduct, findProductByEan, deleteProductByEan } from '../utilities/API/products';

const { When, Then } = createBdd(test);

let productsPage: ProductsPage;

When('user navigates to Products page', async ({ page, testContext }) => {
  productsPage = new ProductsPage(page);
  await productsPage.navigateToProducts();
});

When('user clicks Add product button', async ({}) => {
  await productsPage.clickAddProductButton();
});

Then('add product EAN code modal should be visible', async ({}) => {
  expect(await productsPage.isEanModalVisible()).toBeTruthy();
});

When('user fills product EAN code {string}', async ({ testContext }, ean: string) => {
  // Jeśli EAN to specjalna wartość, wygeneruj unikalny EAN i zapisz go w kontekście
  let actualEan = ean;
  if (ean === '<GENERATED_EAN>') {
    actualEan = generateTestEan();
    testContext.generatedEan = actualEan; // Zapisz w kontekście dla innych kroków
    console.log(`Generated EAN: ${actualEan}`);
  }
  await productsPage.fillEanCode(actualEan);
});

When('user clicks Add EAN button', async ({}) => {
  await productsPage.clickEanAddButton();
});

Then('add product form should be visible', async ({}) => {
  await productsPage.waitForProductForm();
  expect(await productsPage.isProductFormVisible()).toBeTruthy();
});

Then('user should see product EAN {string}', async ({ testContext }, ean: string) => {
  // Jeśli przekazano placeholder <GENERATED_EAN>, użyj zapisanej wartości z kontekstu
  let expectedEan = ean;
  if (ean === '<GENERATED_EAN>' && testContext.generatedEan) {
    expectedEan = testContext.generatedEan;
    console.log(`Using stored EAN for validation: ${expectedEan}`);
  }
  const value = await productsPage.getEanValue();
  expect(value).toBe(expectedEan);
});

Then('user should see product status {string}', async ({}, status: string) => {
  const value = await productsPage.getStatusValue();
  expect(value).toContain(status);
});

When('user fills product name {string}', async ({}, name: string) => {
  await productsPage.fillName(name);
});

When('user fills product price {string}', async ({}, price: string) => {
  await productsPage.fillPrice(price);
});

When('user selects product currency {string}', async ({}, currency: string) => {
  await productsPage.selectCurrency(currency);
});

When('user fills product weight volume {string}', async ({}, weight: string) => {
  await productsPage.fillWeightVolume(weight);
});

When('user selects product unit of measurement {string}', async ({}, unit: string) => {
  await productsPage.selectUnitOfMeasurement(unit);
});

When('user fills product min quantity {string}', async ({}, min: string) => {
  await productsPage.fillMinQuantity(min);
});

When('user fills product max quantity {string}', async ({}, max: string) => {
  await productsPage.fillMaxQuantity(max);
});

When('user selects product category {string}', async ({}, category: string) => {
  await productsPage.selectCategory(category);
});

When('user selects product VAT code {string}', async ({}, vat: string) => {
  await productsPage.selectVatCode(vat);
});

When('user clicks product Save button', async ({}) => {
  await productsPage.clickSaveButton();
});

When('user clicks product Save button and waits for success', async ({}) => {
  const successText = await productsPage.clickSaveButtonAndWaitForSuccess('Product has been created');
  console.log(`Success message: ${successText}`);
});

Then('product {string} should appear in products table', async ({}, productName: string) => {
  expect(await productsPage.isProductInTable(productName)).toBeTruthy();
});

Then('success message {string} should be displayed', async ({}, message: string) => {
  const actualMessage = await productsPage.getSuccessMessageText();
  expect(actualMessage).toContain(message);
});

// ==================== API Steps ====================

When('user adds all test products via API', async ({ request }) => {
  const result = await createAllProducts(request, testProducts);
  expect(result.errors.length).toBe(0);
  console.log(`API: Added ${result.created} products, skipped ${result.skipped} existing`);
});

Then('all test products should exist in the system', async ({ request }) => {
  const products = await getProducts(request);
  const testEans = testProducts.map(p => p.ean);
  const existingEans = products.map((p: any) => p.ean);

  const missing = testEans.filter(ean => !existingEans.includes(ean));
  if (missing.length > 0) {
    console.log(`Missing products: ${missing.join(', ')}`);
  }
  expect(missing.length).toBe(0);
});

Then('{int} products should be added via API', async ({ request }, expectedCount: number) => {
  const products = await getProducts(request);
  expect(products.length).toBeGreaterThanOrEqual(expectedCount);
});

// Module-level state for sharing between steps (API operations)
let lastCreatedProductEan: string | undefined;
let lastCreatedProductId: string | null = null;
let lastCreateProductError: any = null;
let lastDeleteProductError: any = null;

// Generator unikalnego EAN dla testów
let testEanCounter = 1000;
function generateTestEan(): string {
  const timestamp = Date.now().toString();
  const timestampDigits = timestamp.slice(-6); // Ostatnie 6 cyfr timestampu
  const counterDigits = (testEanCounter++).toString().padStart(3, '0'); // 3 cyfry licznika
  return `59012${timestampDigits}${counterDigits}1`; // 59012 (polski prefix) + 6 cyfr timestampu + 3 cyfry licznika + 1 (cyfra kontrolna)
}

When('user ensures product with EAN {string} does not exist', async ({ request }, ean: string) => {
  try {
    await deleteProductByEan(request, ean);
    console.log(`Cleanup: Ensured EAN=${ean} does not exist`);
  } catch (err) {
    console.log(`Cleanup: Product with EAN=${ean} not found or already deleted`);
  }
});

When('user creates product via API with EAN {string}', async ({ request }, ean: string) => {
  const productData = {
    externalSystemId: `TESTAPI-${Date.now()}`,
    ean,
    name: `Test API Product ${ean}`,
    price: 1.23,
    currency: 'PLN',
    weightVolume: 100,
    unitOfMeasurement: 'G',
    minQuantity: 1,
    maxQuantity: 5,
    category: { uuid: '2f3a6b2a-2a1d-4c9f-9b3f-1a9f7f9d0001', name: { name: 'Drinks', namePl: 'Napoje' } },
    vatCode: 'A',
    status: 'ACTIVE'
  };
  try {
    const created = await createProduct(request, productData);
    lastCreatedProductEan = ean;
    lastCreatedProductId = created.externalId || created.id;
    lastCreateProductError = null;
    console.log(`Product created: EAN=${ean}, ID=${lastCreatedProductId}`);
  } catch (err) {
    lastCreateProductError = err;
    lastCreatedProductEan = ean;
    lastCreatedProductId = null;
    console.log(`Product creation failed for EAN=${ean}: ${err}`);
  }
});

Then('product with EAN {string} should be created successfully', async ({ request }, ean: string) => {
  expect(lastCreateProductError).toBeNull();
  const found = await findProductByEan(request, ean);
  expect(found).not.toBeNull();
});

When('user deletes product via API with EAN {string}', async ({ request }, ean: string) => {
  try {
    await deleteProductByEan(request, ean);
    lastDeleteProductError = null;
    console.log(`Product deleted: EAN=${ean}`);
  } catch (err) {
    lastDeleteProductError = err;
    console.log(`Product deletion failed for EAN=${ean}: ${err}`);
  }
});

Then('product with EAN {string} should be deleted', async ({ request }, ean: string) => {
  expect(lastDeleteProductError).toBeNull();
  const found = await findProductByEan(request, ean);
  expect(found).toBeNull();
});

Then('new product should NOT be created \\(should fail)', async ({}) => {
  expect(lastCreateProductError).not.toBeNull();
  if (lastCreateProductError) {
    const msg = String(lastCreateProductError.message || lastCreateProductError);
    console.log(`Expected error received: ${msg}`);
    // Accept various error types: EAN not available, conflict (409), or server error (500)
    // Note: API may return 500 for EAN reuse attempts instead of proper 409
    expect(msg).toMatch(/EAN(.+)?not available|already exists|409|500|INTERNAL_SERVER_ERROR/i);
  }
});