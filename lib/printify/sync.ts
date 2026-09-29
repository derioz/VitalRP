import 'server-only';
import { createAdminClient } from '@/lib/supabase/admin';
import { getPrintifyProducts, PrintifyProduct, PrintifyVariant } from './client';

function slugify(text: string): string {
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')
    .replace(/[^\w\-]+/g, '')
    .replace(/\-\-+/g, '-')
    .replace(/^-+/, '')
    .replace(/-+$/, '');
}

/**
 * Sync all Printify products and variants into Supabase.
 */
export async function syncPrintifyCatalog(): Promise<{
  success: boolean;
  productsSynced: number;
  variantsSynced: number;
  error?: string;
}> {
  const supabase = createAdminClient();
  if (!supabase) {
    throw new Error('Supabase admin client could not be initialized (missing service role key).');
  }

  let logId: string | null = null;
  try {
    const { data: logEntry } = await supabase
      .from('merch_sync_logs')
      .insert({
        status: 'in_progress',
        products_synced: 0,
        variants_synced: 0,
      })
      .select('id')
      .single();

    if (logEntry) {
      logId = logEntry.id;
    }
  } catch (err) {
    console.warn('Could not create sync log entry:', err);
  }

  try {
    const response = await getPrintifyProducts(1, 100);
    const printifyProducts = response.data || [];

    let totalProductsSynced = 0;
    let totalVariantsSynced = 0;

    for (const p of printifyProducts) {
      // 1. Determine Category
      let category = 'Apparel';
      const titleLower = p.title.toLowerCase();
      if (titleLower.includes('sticker')) category = 'Accessories';
      else if (titleLower.includes('mug')) category = 'Accessories';
      else if (titleLower.includes('mat') || titleLower.includes('mousepad')) category = 'Accessories';
      else if (titleLower.includes('hat') || titleLower.includes('snapback') || titleLower.includes('beanie')) category = 'Apparel';
      else if (p.tags?.some((t: string) => t.toLowerCase() === 'accessories')) category = 'Accessories';
      else if (p.tags?.some((t: string) => t.toLowerCase() === 'in-game')) category = 'In-Game';

      // 2. Base & Retail Price in cents
      const enabledVariants = p.variants.filter((v: PrintifyVariant) => v.is_enabled);
      const activeVariants = enabledVariants.length > 0 ? enabledVariants : p.variants;
      const minCostCents = activeVariants.reduce((min, v) => (v.cost < min ? v.cost : min), activeVariants[0]?.cost || 0);
      const minPriceCents = activeVariants.reduce((min, v) => (v.price < min ? v.price : min), activeVariants[0]?.price || 0);

      const baseSlug = slugify(p.title);
      // Clean up description HTML tags if any
      const cleanDescription = p.description ? p.description.replace(/<[^>]*>?/gm, '').trim() : '';

      // 3. Upsert Product
      const { data: upsertedProduct, error: productError } = await supabase
        .from('merch_products')
        .upsert(
          {
            printify_product_id: p.id,
            title: p.title,
            slug: baseSlug,
            description: cleanDescription,
            blueprint_id: p.blueprint_id,
            print_provider_id: p.print_provider_id,
            category,
            status: p.visible ? 'live' : 'draft',
            base_price_cents: minCostCents,
            retail_price_cents: minPriceCents,
            mockup_images: p.images.map((img) => ({
              src: img.src,
              position: img.position,
              is_default: img.is_default,
              variant_ids: img.variant_ids,
            })),
            updated_at: new Date().toISOString(),
          },
          { onConflict: 'printify_product_id' }
        )
        .select('id')
        .single();

      if (productError) {
        console.error(`Error syncing product ${p.id} (${p.title}):`, productError);
        continue;
      }

      totalProductsSynced++;
      const localProductId = upsertedProduct.id;

      // 4. Map options to variant titles
      const colorOption = p.options.find((o) => o.type === 'color' || o.name.toLowerCase() === 'color');
      const sizeOption = p.options.find((o) => o.type === 'size' || o.name.toLowerCase() === 'size');

      // 5. Upsert Variants
      for (const v of p.variants) {
        let detectedColor: string | null = null;
        let detectedSize: string | null = null;

        // Extract option titles from options array
        if (v.title.includes('/')) {
          const parts = v.title.split('/').map((s) => s.trim());
          if (parts.length >= 2) {
            detectedColor = parts[0];
            detectedSize = parts[1];
          }
        } else if (v.title) {
          detectedSize = v.title;
        }

        const { error: variantError } = await supabase
          .from('merch_variants')
          .upsert(
            {
              product_id: localProductId,
              printify_variant_id: v.id,
              title: v.title,
              size: detectedSize,
              color: detectedColor,
              sku: v.sku || '',
              cost_cents: v.cost || 0,
              retail_price_cents: v.price || minPriceCents,
              is_enabled: v.is_enabled,
              is_in_stock: v.is_available,
              options: { raw: v.options },
              updated_at: new Date().toISOString(),
            },
            { onConflict: 'product_id,printify_variant_id' }
          );

        if (!variantError) {
          totalVariantsSynced++;
        }
      }
    }

    if (logId) {
      await supabase
        .from('merch_sync_logs')
        .update({
          status: 'completed',
          products_synced: totalProductsSynced,
          variants_synced: totalVariantsSynced,
        })
        .eq('id', logId);
    }

    return {
      success: true,
      productsSynced: totalProductsSynced,
      variantsSynced: totalVariantsSynced,
    };
  } catch (error: any) {
    console.error('Fatal error during Printify catalog sync:', error);
    if (logId) {
      await supabase
        .from('merch_sync_logs')
        .update({
          status: 'failed',
          error_message: error.message || 'Unknown error',
        })
        .eq('id', logId);
    }
    return {
      success: false,
      productsSynced: 0,
      variantsSynced: 0,
      error: error.message,
    };
  }
}
