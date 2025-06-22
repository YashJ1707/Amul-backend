import axios from 'axios';
import { Product } from '@/models/Product';
import { notifySubscribers } from './emailService';

const AMUL_API_BASE_URL = 'https://shop.amul.com/api/1';

export const fetchAndUpdateProducts = async (substoreId: string): Promise<void> => {
  if (!substoreId) {
    console.error('❌ Substore ID is required to fetch products.');
    return;
  }
  try {
    const response = await axios.get(`${AMUL_API_BASE_URL}/entity/ms.products`, {
      params: {
        'fields[name]': 1,
        'fields[brand]': 1,
        'fields[categories]': 1,
        'fields[collections]': 1,
        'fields[alias]': 1,
        'fields[sku]': 1,
        'fields[price]': 1,
        'fields[compare_price]': 1,
        'fields[original_price]': 1,
        'fields[images]': 1,
        'fields[metafields]': 1,
        'fields[discounts]': 1,
        'fields[catalog_only]': 1,
        'fields[is_catalog]': 1,
        'fields[seller]': 1,
        'fields[available]': 1,
        'fields[inventory_quantity]': 1,
        'fields[net_quantity]': 1,
        'fields[num_reviews]': 1,
        'fields[avg_rating]': 1,
        'fields[inventory_low_stock_quantity]': 1,
        'fields[inventory_allow_out_of_stock]': 1,
        'fields[default_variant]': 1,
        'fields[variants]': 1,
        'fields[lp_seller_ids]': 1,
        'filters[0][field]': 'categories',
        'filters[0][value][0]': 'protein',
        'filters[0][operator]': 'in',
        'filters[0][original]': 1,
        'facets': true,
        'facetgroup': 'default_category_facet',
        'limit': 24,
        'total': 1,
        'start': 0,
        'cdc': '1m',
        'substore': substoreId
      }
    });

    const products = response.data.data;
    console.log(`📦 Fetched ${products.length} products from Amul API for substore ${substoreId}`);

    for (const productData of products) {
      const productId = productData._id;
      const existingProduct = await Product.findOne({ productId });

      if (existingProduct) {
        // Update existing product
        const updatedProduct = await Product.findOneAndUpdate(
          { productId },
          {
            name: productData.name,
            price: productData.price,
            image: productData.images?.[0]?.url,
            alias: productData.alias,
            inventoryQuantity: productData.inventory_quantity,
            isActive: true,
            available: productData.available
          },
          { new: true }
        );

        // Notify subscribers if product is back in stock
        if (updatedProduct && 
            productData.inventory_quantity > 0 && 
            existingProduct.inventoryQuantity === 0) {
          await notifySubscribers(updatedProduct, productData);
        }
      } else {
        // Create new product
        await Product.create({
          productId,
          name: productData.name,
          price: productData.price,
          image: productData.images?.[0]?.url,
          alias: productData.alias,
          inventoryQuantity: productData.inventory_quantity,
          isActive: true,
          available: productData.available
        });
      }
    }
  } catch (error) {
    console.error('❌ Error fetching products:', error);
  }
};

export const getProductsByLocation = async (substoreId: string): Promise<any[]> => {
  try {
    await fetchAndUpdateProducts(substoreId);
    return Product.find({ isActive: true }).sort({ name: 1 });
  } catch (error) {
    console.error('❌ Error getting products by location:', error);
    return [];
  }
};